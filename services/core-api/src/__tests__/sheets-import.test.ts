import { describe, it, expect, beforeAll, afterAll, jest, beforeEach } from "@jest/globals"
import request from "supertest"
import app from "../index"

// Мокаем pool для избежания подключения к БД
jest.mock("../db", () => ({
  pool: {
    query: jest.fn(),
    end: jest.fn(),
  },
}))

// Мокаем fetch для Google Sheets
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>
global.fetch = mockFetch

const mockGoogleSheetsHTML = `
<!DOCTYPE html>
<html>
<body>
<table class="waffle">
  <tr>
    <th>Email</th>
    <th>Name</th>
    <th>Company</th>
  </tr>
  <tr>
    <td>test@example.com</td>
    <td>Test User</td>
    <td>Test Company</td>
  </tr>
  <tr>
    <td>another@example.org</td>
    <td>Another User</td>
    <td>Another Company</td>
  </tr>
</table>
</body>
</html>
`

const mockEmptySheetsHTML = `
<!DOCTYPE html>
<html>
<body>
<table class="waffle">
  <tr><th>Email</th><th>Name</th></tr>
</table>
</body>
</html>
`

import { pool } from "../db"
const mockedPool = pool as unknown as jest.Mocked<typeof pool>

describe("Google Sheets Import API", () => {
  // Use different workspace IDs for each test to avoid rate limiting
  const workspaces = {
    preview1: "10000000-0000-0000-0000-000000000001",
    preview2: "10000000-0000-0000-0000-000000000002",
    preview3: "10000000-0000-0000-0000-000000000003",
    preview4: "10000000-0000-0000-0000-000000000004",
    preview5: "10000000-0000-0000-0000-000000000005",
    preview6: "10000000-0000-0000-0000-000000000006",
    import1: "20000000-0000-0000-0000-000000000001",
    import2: "20000000-0000-0000-0000-000000000002",
    import3: "20000000-0000-0000-0000-000000000003",
    import4: "20000000-0000-0000-0000-000000000004",
    import5: "20000000-0000-0000-0000-000000000005",
    import6: "20000000-0000-0000-0000-000000000006",
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Setup default mock for pool.query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(mockedPool.query as any).mockResolvedValue({ rows: [{ id: "test-list-id" }] })
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  describe("POST /api/contacts/import-sheets/preview", () => {
    it("should return preview data for valid Google Sheets URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockGoogleSheetsHTML,
      } as Response)

      const response = await request(app).post("/api/contacts/import-sheets/preview").send({
        workspace_id: workspaces.preview1,
        sheet_url: "https://docs.google.com/spreadsheets/d/abc12345/edit",
      })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty("preview")
      expect(response.body).toHaveProperty("totalRows", 2)
      expect(response.body).toHaveProperty("headers")
      expect(response.body.headers).toContain("Email")
      expect(response.body.detectedMapping.email).toBe("Email")
    })

    it("should return 400 for invalid URL format", async () => {
      const response = await request(app).post("/api/contacts/import-sheets/preview").send({
        workspace_id: workspaces.preview2,
        sheet_url: "not-a-url",
      })

      expect(response.status).toBe(400)
    })

    it("should return 400 for non-Google Sheets URL", async () => {
      const response = await request(app).post("/api/contacts/import-sheets/preview").send({
        workspace_id: workspaces.preview3,
        sheet_url: "https://example.com/sheet",
      })

      expect(response.status).toBe(400)
    })

    it("should return 400 for empty sheet", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockEmptySheetsHTML,
      } as Response)

      const response = await request(app).post("/api/contacts/import-sheets/preview").send({
        workspace_id: workspaces.preview4,
        sheet_url: "https://docs.google.com/spreadsheets/d/empty123/edit",
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe("No data found in sheet")
    })

    it("should return 400 for inaccessible sheet", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      } as Response)

      const response = await request(app).post("/api/contacts/import-sheets/preview").send({
        workspace_id: workspaces.preview5,
        sheet_url: "https://docs.google.com/spreadsheets/d/private123/edit",
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe("Sheet not accessible")
    })

    it("should return 400 when email column not detected", async () => {
      const noEmailHTML = `
        <!DOCTYPE html>
        <html>
        <body>
        <table class="waffle">
          <tr><th>Name</th><th>Phone</th></tr>
          <tr><td>John</td><td>123-456</td></tr>
        </table>
        </body>
        </html>
      `
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => noEmailHTML,
      } as Response)

      const response = await request(app).post("/api/contacts/import-sheets/preview").send({
        workspace_id: workspaces.preview6,
        sheet_url: "https://docs.google.com/spreadsheets/d/noemail123/edit",
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe("Email column not detected")
    })
  })

  describe("POST /api/contacts/import-sheets", () => {
    it("should import contacts from valid Google Sheets URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockGoogleSheetsHTML,
      } as Response)

      const response = await request(app).post("/api/contacts/import-sheets").send({
        workspace_id: workspaces.import1,
        sheet_url: "https://docs.google.com/spreadsheets/d/import123/edit",
        contact_list_name: "Test Import",
      })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty("contact_list_id")
      expect(response.body.imported).toBe(2)
      expect(response.body.skipped).toBe(0)
    })

    it("should handle duplicate emails within import", async () => {
      const duplicateHTML = `
        <!DOCTYPE html>
        <html>
        <body>
        <table class="waffle">
          <tr><th>Email</th><th>Name</th></tr>
          <tr><td>dup@example.com</td><td>User 1</td></tr>
          <tr><td>dup@example.com</td><td>User 2</td></tr>
        </table>
        </body>
        </html>
      `
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => duplicateHTML,
      } as Response)

      const response = await request(app).post("/api/contacts/import-sheets").send({
        workspace_id: workspaces.import2,
        sheet_url: "https://docs.google.com/spreadsheets/d/dup123/edit",
      })

      expect(response.status).toBe(200)
      expect(response.body.imported).toBe(1) // Only one should be imported
      expect(response.body.skipped).toBe(1) // One duplicate skipped
    })

    it("should handle invalid emails", async () => {
      const invalidEmailHTML = `
        <!DOCTYPE html>
        <html>
        <body>
        <table class="waffle">
          <tr><th>Email</th><th>Name</th></tr>
          <tr><td>valid@example.com</td><td>Valid</td></tr>
          <tr><td>invalid-email</td><td>Invalid</td></tr>
          <tr><td></td><td>Empty</td></tr>
        </table>
        </body>
        </html>
      `
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => invalidEmailHTML,
      } as Response)

      const response = await request(app).post("/api/contacts/import-sheets").send({
        workspace_id: workspaces.import3,
        sheet_url: "https://docs.google.com/spreadsheets/d/invalid123/edit",
      })

      expect(response.status).toBe(200)
      expect(response.body.imported).toBe(1)
      expect(response.body.errors.length).toBeGreaterThan(0)
    })

    it("should support custom column mapping", async () => {
      const customMappingHTML = `
        <!DOCTYPE html>
        <html>
        <body>
        <table class="waffle">
          <tr><th>Контакт</th><th>ФИО</th><th>Организация</th></tr>
          <tr><td>custom@test.com</td><td>Custom User</td><td>Custom Org</td></tr>
        </table>
        </body>
        </html>
      `
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => customMappingHTML,
      } as Response)

      const response = await request(app).post("/api/contacts/import-sheets").send({
        workspace_id: workspaces.import4,
        sheet_url: "https://docs.google.com/spreadsheets/d/custom123/edit",
        column_mapping: {
          email: "Контакт",
          name: "ФИО",
          company: "Организация",
        },
      })

      expect(response.status).toBe(200)
      expect(response.body.imported).toBe(1)
    })

    it("should return 400 when email column not provided and not detected", async () => {
      const noEmailHTML = `
        <!DOCTYPE html>
        <html>
        <body>
        <table class="waffle">
          <tr><th>Name</th><th>Phone</th></tr>
          <tr><td>John</td><td>123-456</td></tr>
        </table>
        </body>
        </html>
      `
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => noEmailHTML,
      } as Response)

      const response = await request(app).post("/api/contacts/import-sheets").send({
        workspace_id: workspaces.import5,
        sheet_url: "https://docs.google.com/spreadsheets/d/noemail123/edit",
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe("Email column required")
    })

    it("should return 400 for invalid workspace_id", async () => {
      const response = await request(app).post("/api/contacts/import-sheets").send({
        workspace_id: "not-a-uuid",
        sheet_url: "https://docs.google.com/spreadsheets/d/test123/edit",
      })

      expect(response.status).toBe(400)
    })
  })
})
