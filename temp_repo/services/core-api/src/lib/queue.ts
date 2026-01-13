import { createClient } from "redis"
import { pool } from "../db"

const redisClient = createClient({ url: process.env.REDIS_URL })

let isConnected = false

async function ensureConnection() {
  if (!isConnected) {
    await redisClient.connect()
    isConnected = true
  }
}

export async function enqueueJob(queue: string, data: any, maxAttempts = 3) {
  await ensureConnection()

  const jobId = require("crypto").randomUUID()
  const job = { id: jobId, queue, data }

  // Store in database
  await pool.query(
    `INSERT INTO queue_jobs (id, queue, data, status, attempts, max_attempts)
     VALUES ($1, $2, $3, 'pending', 0, $4)`,
    [jobId, queue, JSON.stringify(data), maxAttempts],
  )

  // Push to Redis queue
  await redisClient.rPush(`queue:${queue}`, JSON.stringify(job))

  return jobId
}

export async function scheduleCampaign(campaignId: string, workspaceId: string) {
  // Get campaign recipients
  const recipientsResult = await pool.query(
    `SELECT cr.id as recipient_id, cr.contact_id
     FROM campaign_recipients cr
     WHERE cr.campaign_id = $1 AND cr.status = 'pending'`,
    [campaignId],
  )

  const recipients = recipientsResult.rows

  console.log(`[scheduler] Scheduling ${recipients.length} recipients for campaign ${campaignId}`)

  // Queue generate jobs for each recipient (step 1)
  for (const recipient of recipients) {
    await enqueueJob("generate", {
      campaign_id: campaignId,
      recipient_id: recipient.recipient_id,
      contact_id: recipient.contact_id,
      step_number: 1,
    })
  }

  // Update campaign status
  await pool.query(`UPDATE campaigns SET status = 'active' WHERE id = $1`, [campaignId])

  return recipients.length
}
