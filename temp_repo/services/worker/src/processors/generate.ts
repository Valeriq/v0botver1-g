import type { Pool } from "pg"
import type { RedisClientType } from "redis"
import axios from "axios"

const aiOrchestratorUrl = process.env.AI_ORCHESTRATOR_URL || "http://localhost:3002"

export async function processGenerateJob(job: any, pool: Pool, redis: RedisClientType) {
  const { campaign_id, recipient_id, step_number, contact_id } = job.data

  console.log(`[generate] Generating email for campaign ${campaign_id}, recipient ${recipient_id}, step ${step_number}`)

  // Get campaign and contact data
  const campaignResult = await pool.query(
    `SELECT c.*, pp.system_prompt, pp.config, pp.id as prompt_profile_id
     FROM campaigns c
     LEFT JOIN prompt_profiles pp ON c.prompt_profile_id = pp.id
     WHERE c.id = $1`,
    [campaign_id],
  )

  if (campaignResult.rows.length === 0) {
    throw new Error("Campaign not found")
  }

  const campaign = campaignResult.rows[0]

  const contactResult = await pool.query(`SELECT * FROM contacts WHERE id = $1`, [contact_id])

  if (contactResult.rows.length === 0) {
    throw new Error("Contact not found")
  }

  const contact = contactResult.rows[0]

  const stepResult = await pool.query(`SELECT * FROM campaign_steps WHERE campaign_id = $1 AND step_number = $2`, [
    campaign_id,
    step_number,
  ])

  if (stepResult.rows.length === 0) {
    throw new Error("Campaign step not found")
  }

  const step = stepResult.rows[0]

  try {
    // Call AI Orchestrator
    const response = await axios.post(`${aiOrchestratorUrl}/api/generate/email`, {
      workspace_id: campaign.workspace_id,
      contact_id,
      prompt_profile_id: campaign.prompt_profile_id,
      context: step.template,
    })

    const { subject, body, artifact_id } = response.data

    console.log(`[generate] Email generated via AI Orchestrator: ${artifact_id}`)

    // Queue send job
    const sendJob = {
      id: require("crypto").randomUUID(),
      queue: "send",
      data: {
        campaign_id,
        recipient_id,
        contact_id,
        step_number,
        subject,
        body,
        artifact_id,
      },
    }

    await pool.query(
      `INSERT INTO queue_jobs (id, queue, data, status, attempts, max_attempts)
       VALUES ($1, $2, $3, 'pending', 0, 3)`,
      [sendJob.id, sendJob.queue, JSON.stringify(sendJob.data)],
    )

    await redis.rPush("queue:send", JSON.stringify(sendJob))

    console.log(`[generate] Email generated and send job queued: ${sendJob.id}`)
  } catch (error: any) {
    console.error(`[generate] AI Orchestrator error:`, error.response?.data || error.message)
    throw error
  }
}
