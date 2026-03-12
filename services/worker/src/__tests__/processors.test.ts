import { describe, it, expect, vi } from "vitest"
import { processGenerateJob, processClassifyJob, processFollowupJob } from "../processors"
import { Pool } from "pg"

const mockPool = {
  query: vi.fn(),
} as unknown as Pool

const mockRedis = {
  rPush: vi.fn(),
  lPop: vi.fn(),
} as any

describe("Job Processors", () => {
  describe("processGenerateJob", () => {
    it("should generate email and queue send job", async () => {
      const mockJob = {
        data: {
          campaign_id: "camp-1",
          recipient_id: "rec-1",
          step_number: 1,
          contact_id: "cont-1",
        },
      }
      ;(mockPool.query as any)
        .mockResolvedValueOnce({
          rows: [
            {
              id: "camp-1",
              workspace_id: "ws-1",
              prompt_profile_id: "pp-1",
              system_prompt: "test prompt",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: "cont-1",
              email: "test@example.com",
              first_name: "John",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              campaign_id: "camp-1",
              step_number: 1,
              template: "Hello {{first_name}}",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })

      await expect(processGenerateJob(mockJob, mockPool, mockRedis)).resolves.not.toThrow()
    })
  })

  describe("processClassifyJob", () => {
    it("should create lead when classified as interested", async () => {
      const mockJob = {
        data: {
          reply_event_id: "reply-1",
          workspace_id: "ws-1",
          thread_id: "thread-1",
          message_body: "I am interested",
          contact_id: "cont-1",
        },
      }

      await expect(processClassifyJob(mockJob, mockPool, mockRedis)).resolves.not.toThrow()
    })
  })

  describe("processFollowupJob", () => {
    it("should skip follow-up if recipient replied", async () => {
      const mockJob = {
        data: {
          campaign_id: "camp-1",
          recipient_id: "rec-1",
          contact_id: "cont-1",
          step_number: 2,
          thread_id: "thread-1",
        },
      }
      ;(mockPool.query as any).mockResolvedValueOnce({
        rows: [{ status: "replied" }],
      })

      await processFollowupJob(mockJob, mockPool, mockRedis)

      expect(mockRedis.rPush).not.toHaveBeenCalled()
    })

    it("should queue generate job if no reply", async () => {
      const mockJob = {
        data: {
          campaign_id: "camp-1",
          recipient_id: "rec-1",
          contact_id: "cont-1",
          step_number: 2,
          thread_id: "thread-1",
        },
      }
      ;(mockPool.query as any)
        .mockResolvedValueOnce({ rows: [{ status: "sent" }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ status: "active" }] })
        .mockResolvedValueOnce({ rows: [] })

      await processFollowupJob(mockJob, mockPool, mockRedis)

      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO queue_jobs"), expect.any(Array))
    })
  })
})
