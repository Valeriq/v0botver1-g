import { Router } from "express"
import { pool } from "../db"
import { getHistory, getMessage, parseMessage } from "../lib/gmail-client"
import { createClient } from "redis"

const redisClient = createClient({ url: process.env.REDIS_URL })
let redisConnected = false

async function ensureRedisConnection() {
  if (!redisConnected) {
    await redisClient.connect()
    redisConnected = true
  }
}

export const webhookRouter = Router()

webhookRouter.post("/pubsub", async (req, res) => {
  try {
    console.log("[gmail-service] Received Pub/Sub notification")

    // Parse Pub/Sub message
    const message = req.body.message
    if (!message || !message.data) {
      return res.status(400).send("Invalid message")
    }

    const data = JSON.parse(Buffer.from(message.data, "base64").toString())
    const { emailAddress, historyId } = data

    console.log(`[webhook] Processing push for ${emailAddress}, historyId: ${historyId}`)

    // Find account by email
    const accountResult = await pool.query(
      `SELECT id, email, access_token, refresh_token, history_id 
       FROM gmail_accounts 
       WHERE email = $1`,
      [emailAddress],
    )

    if (accountResult.rows.length === 0) {
      console.log(`[webhook] Account not found for ${emailAddress}`)
      return res.status(200).send("OK")
    }

    const account = accountResult.rows[0]
    const startHistoryId = account.history_id

    if (!startHistoryId) {
      console.log(`[webhook] No history_id stored for account ${account.id}`)
      return res.status(200).send("OK")
    }

    // Get history changes
    const history = await getHistory(account, startHistoryId)

    console.log(`[webhook] Found ${history.length} history entries`)

    for (const entry of history) {
      if (entry.messagesAdded) {
        for (const msgAdded of entry.messagesAdded) {
          const messageId = msgAdded.message.id
          const threadId = msgAdded.message.threadId

          // Check if message is inbound (not sent by us)
          const labelIds = msgAdded.message.labelIds || []
          if (!labelIds.includes("INBOX")) {
            continue
          }

          // Get full message
          const fullMessage = await getMessage(account, messageId)
          const parsed = parseMessage(fullMessage)

          console.log(`[webhook] New inbound message: ${parsed.message_id} in thread ${parsed.thread_id}`)

          // Check if this thread belongs to a campaign
          const threadResult = await pool.query(
            `SELECT em.workspace_id, cr.campaign_id, cr.contact_id, cr.id as recipient_id
             FROM email_messages em
             JOIN campaign_recipients cr ON em.thread_id = cr.thread_id
             WHERE em.thread_id = $1 AND em.direction = 'outbound'
             LIMIT 1`,
            [parsed.thread_id],
          )

          if (threadResult.rows.length === 0) {
            console.log(`[webhook] Thread ${parsed.thread_id} not associated with any campaign`)
            continue
          }

          const { workspace_id, campaign_id, contact_id, recipient_id } = threadResult.rows[0]

          // Save reply message
          const replyMessageId = require("crypto").randomUUID()
          await pool.query(
            `INSERT INTO email_messages (id, workspace_id, gmail_account_id, thread_id, message_id, direction, sender, subject, body, received_at)
             VALUES ($1, $2, $3, $4, $5, 'inbound', $6, $7, $8, NOW())`,
            [
              replyMessageId,
              workspace_id,
              account.id,
              parsed.thread_id,
              parsed.message_id,
              parsed.from,
              parsed.subject,
              parsed.body,
            ],
          )

          // Create reply event
          const replyEventId = require("crypto").randomUUID()
          await pool.query(
            `INSERT INTO reply_events (id, workspace_id, campaign_id, contact_id, thread_id, message_id, received_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [replyEventId, workspace_id, campaign_id, contact_id, parsed.thread_id, parsed.message_id],
          )

          console.log(`[webhook] Created reply event: ${replyEventId}`)

          // Queue classify job
          await ensureRedisConnection()

          const classifyJob = {
            id: require("crypto").randomUUID(),
            queue: "classify",
            data: {
              reply_event_id: replyEventId,
              workspace_id,
              thread_id: parsed.thread_id,
              message_body: parsed.body,
              contact_id,
            },
          }

          await pool.query(
            `INSERT INTO queue_jobs (id, queue, data, status, attempts, max_attempts)
             VALUES ($1, $2, $3, 'pending', 0, 3)`,
            [classifyJob.id, classifyJob.queue, JSON.stringify(classifyJob.data)],
          )

          await redisClient.rPush("queue:classify", JSON.stringify(classifyJob))

          console.log(`[webhook] Classify job queued: ${classifyJob.id}`)
        }
      }
    }

    // Update account history_id
    await pool.query(`UPDATE gmail_accounts SET history_id = $1 WHERE id = $2`, [historyId, account.id])

    res.status(200).send("OK")
  } catch (error: any) {
    console.error("[webhook] Error processing push notification:", error.message)
    res.status(500).send("Error")
  }
})
