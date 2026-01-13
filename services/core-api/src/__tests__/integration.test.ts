import request from "supertest"
import app from "../index"
import db from "../db"

const API_BASE = "http://localhost:3000"

describe("Integration Tests", () => {
  let workspaceId: number
  let contactId: number
  let promptProfileId: number
  let campaignId: number

  beforeAll(async () => {
    // Wait for database to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000))
  })

  afterAll(async () => {
    await db.end()
  })

  describe("End-to-End Campaign Flow", () => {
    it("should create workspace", async () => {
      const response = await request(app).post("/workspaces").send({
        telegramId: "123456789",
        firstName: "Test",
        lastName: "User",
      })

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty("id")
      workspaceId = response.body.id
    })

    it("should create contact", async () => {
      const response = await request(app).post(`/workspaces/${workspaceId}/contacts`).send({
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        company: "Test Corp",
      })

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty("id")
      contactId = response.body.id
    })

    it("should create prompt profile", async () => {
      const response = await request(app).post(`/workspaces/${workspaceId}/prompt-profiles`).send({
        name: "Sales Outreach",
        systemPrompt: "You are a sales assistant",
        userPrompt: "Write a cold email",
        temperature: 0.7,
        maxTokens: 500,
      })

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty("id")
      promptProfileId = response.body.id
    })

    it("should create campaign", async () => {
      const response = await request(app).post(`/workspaces/${workspaceId}/campaigns`).send({
        name: "Test Campaign",
        promptProfileId,
        followupEnabled: true,
        followupDelayHours: 48,
      })

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty("id")
      campaignId = response.body.id
    })

    it("should start campaign", async () => {
      const response = await request(app).post(`/workspaces/${workspaceId}/campaigns/${campaignId}/start`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("active")
    })

    it("should get campaign stats", async () => {
      const response = await request(app).get(`/workspaces/${workspaceId}/campaigns/${campaignId}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty("totalRecipients")
      expect(response.body).toHaveProperty("sentCount")
    })

    it("should pause campaign", async () => {
      const response = await request(app).post(`/workspaces/${workspaceId}/campaigns/${campaignId}/pause`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("paused")
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
    it("should return 404 for non-existent workspace", async () => {
      const response = await request(app).get("/workspaces/999999/contacts")
      expect(response.status).toBe(404)
    })

    it("should validate email format", async () => {
      const response = await request(app).post(`/workspaces/${workspaceId}/contacts`).send({
        email: "invalid-email",
        firstName: "Test",
      })

      expect(response.status).toBe(400)
    })
  })
})
