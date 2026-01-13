import type { Pool } from "pg"
import type { RedisClientType } from "redis"

export async function processFollowupJob(job: any, pool: Pool, redis: RedisClientType) {
  const { campaign_id, recipient_id, contact_id, step_number, thread_id } = job.data

  console.log(
    `[followup] Processing follow-up for campaign ${campaign_id}, recipient ${recipient_id}, step ${step_number}`,
  )

  // Check if recipient has replied or lead is active
  const recipientResult = await pool.query(`SELECT status FROM campaign_recipients WHERE id = $1`, [recipient_id])

  if (recipientResult.rows.length === 0) {
    throw new Error("Recipient not found")
  }

  const recipientStatus = recipientResult.rows[0].status

  if (recipientStatus === "replied") {
    console.log(`[followup] Recipient has replied, skipping follow-up`)
    return
  }

  // Check if there's an active lead
  const leadResult = await pool.query(`SELECT id FROM leads WHERE thread_id = $1 AND status IN ('new', 'taken')`, [
    thread_id,
  ])

  if (leadResult.rows.length > 0) {
    console.log(`[followup] Active lead exists, skipping follow-up`)
    return
  }

  // Check campaign status
  const campaignResult = await pool.query(`SELECT status FROM campaigns WHERE id = $1`, [campaign_id])

  if (campaignResult.rows[0].status !== "active") {
    console.log(`[followup] Campaign is not active, skipping follow-up`)
    return
  }

  // Queue generate job for this step
  const generateJob = {
    id: require("crypto").randomUUID(),
    queue: "generate",
    data: {
      campaign_id,
      recipient_id,
      contact_id,
      step_number,
    },
  }

  await pool.query(
    `INSERT INTO queue_jobs (id, queue, data, status, attempts, max_attempts)
     VALUES ($1, $2, $3, 'pending', 0, 3)`,
    [generateJob.id, generateJob.queue, JSON.stringify(generateJob.data)],
  )

  await redis.rPush("queue:generate", JSON.stringify(generateJob))

  console.log(`[followup] Generate job queued for step ${step_number}: ${generateJob.id}`)
}
