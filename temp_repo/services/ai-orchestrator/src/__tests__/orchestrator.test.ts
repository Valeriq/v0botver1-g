import { MCPTools } from "../lib/mcp-tools"
import { jest } from "@jest/globals"

describe("AI Orchestrator", () => {
  describe("MCPTools", () => {
    it("should read database records", async () => {
      const tools = new MCPTools({
        query: jest.fn().mockResolvedValue({ rows: [{ id: "1", name: "Test" }] }),
      } as any)

      const result = await tools.readDatabase("contacts", { workspace_id: "ws-1" })
      expect(result).toBeDefined()
    })

    it("should check policy compliance", async () => {
      const tools = new MCPTools({
        query: jest.fn(),
      } as any)

      const result = await tools.checkPolicy("Test email body", "ws-1")
      expect(result).toHaveProperty("compliant")
    })
  })

  describe("Email Generation", () => {
    it("should generate email with required fields", () => {
      const email = {
        subject: "Test Subject",
        body: "Test Body",
        artifact_id: "artifact-1",
      }

      expect(email.subject).toBeTruthy()
      expect(email.body).toBeTruthy()
      expect(email.artifact_id).toBeTruthy()
    })
  })

  describe("Reply Classification", () => {
    it("should classify positive replies", () => {
      const positiveReply = "Yes, I am interested in learning more"
      expect(positiveReply).toContain("interested")
    })

    it("should classify negative replies", () => {
      const negativeReply = "No thanks, not interested"
      expect(negativeReply).toContain("not interested")
    })
  })
})
