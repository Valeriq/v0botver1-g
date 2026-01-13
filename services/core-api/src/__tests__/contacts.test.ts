import { describe, it, expect, beforeAll, afterAll } from "@jest/globals"
import request from "supertest"
import app from "../index"
import pool from "../db"

describe("Contacts API", () => {
  let workspaceId: string

  beforeAll(async () => {
    const result = await pool.query("INSERT INTO workspaces (name, owner_telegram_id) VALUES ($1, $2) RETURNING id", [
      "Test Workspace",
      "987654321",
    ])
    workspaceId = result.rows[0].id
  })

  afterAll(async () => {
    await pool.query("DELETE FROM workspaces WHERE id = $1", [workspaceId])
    await pool.end()
  })

  it("should upload contacts from CSV", async () => {
    const csvContent = "email,first_name,last_name,company\ntest@example.com,John,Doe,Acme Inc"

    const response = await request(app)
      .post("/api/contacts/upload")
      .field("workspace_id", workspaceId)
      .attach("file", Buffer.from(csvContent), "contacts.csv")

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty("imported")
    expect(response.body.imported).toBeGreaterThan(0)
  })

  it("should list contacts", async () => {
    const response = await request(app).get(`/api/contacts?workspace_id=${workspaceId}`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
  })

  it("should delete a contact", async () => {
    // Create contact
    const createRes = await pool.query(
      "INSERT INTO contacts (workspace_id, email, first_name) VALUES ($1, $2, $3) RETURNING id",
      [workspaceId, "delete@example.com", "Delete"],
    )
    const contactId = createRes.rows[0].id

    const response = await request(app).delete(`/api/contacts/${contactId}`)

    expect(response.status).toBe(200)
  })
})
