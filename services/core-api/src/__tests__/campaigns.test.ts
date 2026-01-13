import { describe, it, expect, beforeAll, afterAll } from "@jest/globals"
import request from "supertest"
import app from "../index"
import pool from "../db"

describe("Campaign API", () => {
  let workspaceId: string
  let promptProfileId: string

  beforeAll(async () => {
    // Create test workspace
    const wsResult = await pool.query("INSERT INTO workspaces (name, owner_telegram_id) VALUES ($1, $2) RETURNING id", [
      "Test Workspace",
      "123456789",
    ])
    workspaceId = wsResult.rows[0].id

    // Create test prompt profile
    const ppResult = await pool.query(
      "INSERT INTO prompt_profiles (workspace_id, name, system_prompt) VALUES ($1, $2, $3) RETURNING id",
      [workspaceId, "Test Profile", "Test system prompt"],
    )
    promptProfileId = ppResult.rows[0].id
  })

  afterAll(async () => {
    // Cleanup
    await pool.query("DELETE FROM workspaces WHERE id = $1", [workspaceId])
    await pool.end()
  })

  it("should create a campaign", async () => {
    const response = await request(app)
      .post("/api/campaigns")
      .send({
        workspace_id: workspaceId,
        name: "Test Campaign",
        prompt_profile_id: promptProfileId,
        steps: [
          { template: "Initial email", delay_hours: 0 },
          { template: "Follow-up", delay_hours: 48 },
        ],
      })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty("id")
    expect(response.body.name).toBe("Test Campaign")
  })

  it("should list campaigns", async () => {
    const response = await request(app).get(`/api/campaigns?workspace_id=${workspaceId}`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
    expect(response.body.length).toBeGreaterThan(0)
  })

  it("should get campaign stats", async () => {
    // Create campaign first
    const createRes = await request(app)
      .post("/api/campaigns")
      .send({
        workspace_id: workspaceId,
        name: "Stats Test Campaign",
        prompt_profile_id: promptProfileId,
        steps: [{ template: "Test", delay_hours: 0 }],
      })

    const campaignId = createRes.body.id

    const response = await request(app).get(`/api/campaigns/${campaignId}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty("stats")
    expect(response.body.stats).toHaveProperty("total_recipients")
    expect(response.body.stats).toHaveProperty("sent_count")
  })
})
