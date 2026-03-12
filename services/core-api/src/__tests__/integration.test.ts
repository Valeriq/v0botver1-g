import request from "supertest"
import app from "../index"
import { pool } from "../db"

describe("Integration Tests", () => {
  let workspaceId: string

  beforeAll(async () => {
    // Wait for database to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000))
  })

  afterAll(async () => {
    await pool.end()
  })

  describe("End-to-End Campaign Flow", () => {
    it("should create workspace", async () => {
      const response = await request(app).post("/api/workspaces").send({
        telegram_user_id: "123456789",
        telegram_first_name: "Test",
        telegram_last_name: "User",
      })

      expect(response.status).toBe(201)
      expect(response.body.workspace).toHaveProperty("id")
      workspaceId = response.body.workspace.id
    })
  })

  describe("Health Checks", () => {
    it("should return healthy status for core-api", async () => {
      const response = await request(app).get("/health")
      expect(response.status).toBe(200)
      expect(response.body.status).toBe("ok")
    })
  })

  describe("Error Handling", () => {
    it("should return 404 for non-existent route", async () => {
      const response = await request(app).get("/api/workspaces/999999/contacts")
      // Since workspaceRouter doesn't define /:id/contacts, it might 404
      expect(response.status).toBe(404)
    })
  })
})
