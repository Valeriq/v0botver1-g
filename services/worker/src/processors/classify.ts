import type { Pool } from "pg"
import type { RedisClientType } from "redis"
import axios from "axios"

const aiOrchestratorUrl = process.env.AI_ORCHESTRATOR_URL || "http://localhost:3002"

export async function processClassifyJob(job: any, pool: Pool, redis: RedisClientType) {
  const { reply_event_id, workspace_id, thread_id, message_body, contact_id } = job.data

  console.log(`[classify] Classifying reply event ${reply_event_id}`)

  try {
    // Call AI Orchestrator for classification
    const response = await axios.post(`${aiOrchestratorUrl}/api/classify/reply`, {
      reply_event_id,
      message_body,
    })

    const { classification, is_lead } = response.data

    console.log(`[classify] Reply classified as: ${classification}, is_lead: ${is_lead}`)

    // If it's a lead, create lead entry
    if (is_lead) {
      const leadId = require("crypto").randomUUID()

      await pool.query(
        `INSERT INTO leads (id, workspace_id, contact_id, thread_id, status, classification, campaign_id)
         VALUES ($1, $2, $3, $4, 'new', $5, 
           (SELECT campaign_id FROM campaign_recipients WHERE thread_id = $4 LIMIT 1))`,
        [leadId, workspace_id, contact_id, thread_id, classification],
      )

      // Update campaign recipient status
      await pool.query(`UPDATE campaign_recipients SET status = 'replied' WHERE thread_id = $1`, [thread_id])

      console.log(`[classify] Lead created: ${leadId}`)

      // Queue notification
      const notifyJob = {
        id: require("crypto").randomUUID(),
        queue: "notify",
        data: {
          workspace_id,
          lead_id: leadId,
          type: "new_lead",
        },
      }

      await pool.query(
        `INSERT INTO queue_jobs (id, queue, data, status, attempts, max_attempts)
         VALUES ($1, $2, $3, 'pending', 0, 3)`,
        [notifyJob.id, notifyJob.queue, JSON.stringify(notifyJob.data)],
      )

      await redis.rPush("queue:notify", JSON.stringify(notifyJob))
    }
  } catch (error: any) {
    console.error(`[classify] AI Orchestrator error:`, error.response?.data || error.message)
    throw error
  }
}
