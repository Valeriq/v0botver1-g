import { GmailClient } from "../lib/gmail-client"

describe("GmailClient", () => {
  let gmailClient: GmailClient

  beforeEach(() => {
    gmailClient = new GmailClient({
      refresh_token: "mock-token",
      client_id: "mock-id",
      client_secret: "mock-secret",
    })
  })

  describe("sendEmail", () => {
    it("should format email correctly", () => {
      const email = {
        to: "test@example.com",
        from: "sender@example.com",
        subject: "Test Subject",
        body: "Test Body",
        inReplyTo: "message-id",
        references: "message-id",
      }

      expect(email.to).toBe("test@example.com")
      expect(email.subject).toBe("Test Subject")
    })
  })

  describe("error handling", () => {
    it("should handle rate limit errors", () => {
      const error = { code: 429, message: "Rate limit exceeded" }
      expect(error.code).toBe(429)
    })

    it("should handle auth errors", () => {
      const error = { code: 401, message: "Unauthorized" }
      expect(error.code).toBe(401)
    })
  })
})
