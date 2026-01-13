import { createClient } from "redis"
import { Pool } from "pg"
import dotenv from "dotenv"
import { processGenerateJob } from "./processors/generate"
import { processSendJob } from "./processors/send"
import { processFollowupJob } from "./processors/followup"
import { processClassifyJob } from "./processors/classify"
import { processNotifyJob } from "./processors/notify"

dotenv.config()

const redisClient = createClient({ url: process.env.REDIS_URL })
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export const QUEUES = {
  dummy: "queue:dummy",
  generate: "queue:generate",
  send: "queue:send",
  followup: "queue:followup",
  classify: "queue:classify",
  notify: "queue:notify",
}

async function pollQueue(
  queueName: string,
  processor: (job: any, pool: Pool, redis: typeof redisClient) => Promise<void>,
) {
  console.log(`[worker] Polling ${queueName}...`)

  while (true) {
    try {
      const result = await redisClient.blPop(queueName, 5)

      if (result) {
        const job = JSON.parse(result.element)
        const logPrefix = `[worker] [job:${job.id}] [queue:${queueName}]`
        console.log(`${logPrefix} Processing job`, {
          jobId: job.id,
          queue: queueName,
          data: job.data,
          timestamp: new Date().toISOString(),
        })

        try {
          // Update job status to processing
          await pool.query(`UPDATE queue_jobs SET status = 'processing', processed_at = NOW() WHERE id = $1`, [job.id])

          // Process the job
          await processor(job, pool, redisClient)

          // Mark as completed
          await pool.query(`UPDATE queue_jobs SET status = 'completed', processed_at = NOW() WHERE id = $1`, [job.id])

          console.log(`${logPrefix} Job completed successfully`, {
            jobId: job.id,
            queue: queueName,
            timestamp: new Date().toISOString(),
          })
        } catch (error: any) {
          console.error(`${logPrefix} Job failed:`, {
            jobId: job.id,
            queue: queueName,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          })

          // Increment attempts and check max_attempts
          const jobResult = await pool.query(
            `UPDATE queue_jobs 
             SET attempts = attempts + 1, error = $1 
             WHERE id = $2 
             RETURNING attempts, max_attempts`,
            [error.message, job.id],
          )

          const { attempts, max_attempts } = jobResult.rows[0]

          if (attempts >= max_attempts) {
            // Mark as failed
            await pool.query(`UPDATE queue_jobs SET status = 'failed' WHERE id = $1`, [job.id])
            console.log(`${logPrefix} Job marked as failed after ${attempts} attempts`, {
              jobId: job.id,
              attempts,
              maxAttempts: max_attempts,
              timestamp: new Date().toISOString(),
            })
          } else {
            // Re-queue with exponential backoff
            const delay = Math.min(2 ** attempts * 1000, 60000) // Max 60s
            await new Promise((resolve) => setTimeout(resolve, delay))
            await redisClient.rPush(queueName, JSON.stringify(job))
            await pool.query(`UPDATE queue_jobs SET status = 'pending' WHERE id = $1`, [job.id])
            console.log(`${logPrefix} Job re-queued (attempt ${attempts + 1}/${max_attempts})`, {
              jobId: job.id,
              attempts: attempts + 1,
              maxAttempts: max_attempts,
              delayMs: delay,
              timestamp: new Date().toISOString(),
            })
          }
        }
      }
    } catch (error) {
      console.error(`[worker] Error polling ${queueName}:`, {
        queue: queueName,
        error,
        timestamp: new Date().toISOString(),
      })
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }
}

async function start() {
  try {
    await redisClient.connect()
    console.log("[worker] Connected to Redis")

    await pool.query("SELECT NOW()")
    console.log("[worker] Connected to PostgreSQL")

    pollQueue(QUEUES.generate, processGenerateJob)
    pollQueue(QUEUES.send, processSendJob)
    pollQueue(QUEUES.followup, processFollowupJob)
    pollQueue(QUEUES.classify, processClassifyJob)
    pollQueue(QUEUES.notify, processNotifyJob)

    console.log("[worker] Worker started successfully - processing all queues")
  } catch (error) {
    console.error("[worker] Failed to start:", error)
    process.exit(1)
  }
}

process.on("SIGTERM", async () => {
  console.log("[worker] SIGTERM received, closing connections...")
  await redisClient.quit()
  await pool.end()
  process.exit(0)
})

start()
