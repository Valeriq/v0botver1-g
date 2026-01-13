import type { Pool } from "pg"
import type { RedisClientType } from "redis"
import axios from "axios"

const gmailServiceUrl = process.env.GMAIL_SERVICE_URL || "http://localhost:3001"

export async function processSendJob(job: any, pool: Pool, redis: RedisClientType) {
  const { campaign_id, recipient_id, contact_id, step_number, subject, body, artifact_id } = job.data

  console.log(`[send] Sending email for campaign ${campaign_id}, recipient ${recipient_id}`)

  // Get contact and campaign data
  const contactResult = await pool.query(`SELECT * FROM contacts WHERE id = $1`, [contact_id])
  const contact = contactResult.rows[0]

  const campaignResult = await pool.query(`SELECT workspace_id FROM campaigns WHERE id = $1`, [campaign_id])
  const campaign = campaignResult.rows[0]

  const accountResult = await pool.query(
    `SELECT ga.* FROM gmail_accounts ga
     JOIN account_assignments aa ON ga.id = aa.gmail_account_id
     WHERE aa.workspace_id = $1 AND ga.status = 'ok' AND ga.daily_sent < ga.daily_quota
     ORDER BY ga.daily_sent ASC, ga.last_used_at ASC NULLS FIRST
     LIMIT 1`,
    [campaign.workspace_id],
  )

  if (accountResult.rows.length === 0) {
    throw new Error("No available Gmail account for workspace")
  }

  const account = accountResult.rows[0]

  // Check suppression list
  const suppressedResult = await pool.query(`SELECT * FROM suppression_list WHERE workspace_id = $1 AND email = $2`, [
    campaign.workspace_id,
    contact.email,
  ])

  if (suppressedResult.rows.length > 0) {
    console.log(`[send] Email ${contact.email} is suppressed, skipping`)
    await pool.query(`UPDATE campaign_recipients SET status = 'suppressed' WHERE id = $1`, [recipient_id])
    return
  }

  // Check billing balance
  const balanceResult = await pool.query(`SELECT SUM(amount) as balance FROM billing_ledger WHERE workspace_id = $1`, [
    campaign.workspace_id,
  ])
  const balance = Number.parseFloat(balanceResult.rows[0].balance || "0")
  const emailCost = 0.01

  if (balance < emailCost) {
    throw new Error("Insufficient balance")
  }

  try {
    // Send via Gmail Service
    const response = await axios.post(`${gmailServiceUrl}/api/send`, {
      account_id: account.id,
      to: contact.email,
      subject,
      body,
      workspace_id: campaign.workspace_id,
    })

    const { thread_id, message_id } = response.data

    // Save message to database
    const emailMessageId = require("crypto").randomUUID()
    await pool.query(
      `INSERT INTO email_messages (id, workspace_id, gmail_account_id, thread_id, message_id, direction, recipient, subject, body, sent_at)
       VALUES ($1, $2, $3, $4, $5, 'outbound', $6, $7, $8, NOW())`,
      [emailMessageId, campaign.workspace_id, account.id, thread_id, message_id, contact.email, subject, body],
    )

    // Update recipient status
    await pool.query(
      `UPDATE campaign_recipients SET status = 'sent', thread_id = $1, last_step_sent = $2 WHERE id = $3`,
      [thread_id, step_number, recipient_id],
    )

    // Deduct from balance
    const ledgerId = require("crypto").randomUUID()
    await pool.query(
      `INSERT INTO billing_ledger (id, workspace_id, amount, type, description, reference_id)
       VALUES ($1, $2, $3, 'debit', 'Email sent', $4)`,
      [ledgerId, campaign.workspace_id, -emailCost, recipient_id],
    )

    console.log(`[send] Email sent successfully. Thread: ${thread_id}`)

    // Schedule follow-up if there are more steps
    const nextStepResult = await pool.query(
      `SELECT * FROM campaign_steps WHERE campaign_id = $1 AND step_number = $2`,
      [campaign_id, step_number + 1],
    )

    if (nextStepResult.rows.length > 0) {
      const nextStep = nextStepResult.rows[0]
      const delayMs = nextStep.delay_hours * 60 * 60 * 1000

      const followupJob = {
        id: require("crypto").randomUUID(),
        queue: "followup",
        data: {
          campaign_id,
          recipient_id,
          contact_id,
          step_number: step_number + 1,
          thread_id,
        },
      }

      // Store job in DB
      await pool.query(
        `INSERT INTO queue_jobs (id, queue, data, status, attempts, max_attempts, scheduled_at)
         VALUES ($1, $2, $3, 'pending', 0, 3, NOW() + INTERVAL '${nextStep.delay_hours} hours')`,
        [followupJob.id, followupJob.queue, JSON.stringify(followupJob.data)],
      )

      // Schedule delayed execution
      setTimeout(async () => {
        await redis.rPush("queue:followup", JSON.stringify(followupJob))
      }, delayMs)

      console.log(`[send] Follow-up scheduled for step ${step_number + 1} in ${nextStep.delay_hours} hours`)
    }
  } catch (error: any) {
    console.error(`[send] Failed to send email:`, error.response?.data || error.message)

    const errorCode = error.response?.data?.code

    if (errorCode === "RATE_LIMIT" || error.response?.status === 429) {
      await pool.query(`UPDATE gmail_accounts SET status = 'limit', status_updated_at = NOW() WHERE id = $1`, [
        account.id,
      ])
      // Retry with a different account
      throw new Error("RETRY_WITH_DIFFERENT_ACCOUNT")
    } else if (errorCode === "AUTH_FAILED" || error.response?.status === 401) {
      await pool.query(`UPDATE gmail_accounts SET status = 'auth_failed', status_updated_at = NOW() WHERE id = $1`, [
        account.id,
      ])
      throw new Error("RETRY_WITH_DIFFERENT_ACCOUNT")
    } else if (errorCode === "PERMISSION_DENIED" || error.response?.status === 403) {
      await pool.query(`UPDATE gmail_accounts SET status = 'blocked', status_updated_at = NOW() WHERE id = $1`, [
        account.id,
      ])
      throw new Error("RETRY_WITH_DIFFERENT_ACCOUNT")
    } else if (errorCode === "INVALID_RECIPIENT") {
      // Don't retry for invalid recipient
      await pool.query(
        `UPDATE campaign_recipients SET status = 'failed', error_message = 'Invalid email' WHERE id = $1`,
        [recipient_id],
      )
      return
    } else if (errorCode === "SERVICE_UNAVAILABLE" || error.response?.status === 503) {
      // Transient error - allow retry
      throw new Error("TRANSIENT_ERROR")
    }

    throw error
  }
}
