import { Router } from "express"
import { pool } from "../db"

export const leadRouter: Router = Router()

// List leads
leadRouter.get("/", async (req, res, next) => {
  try {
    const { workspace_id, status, limit = 50, offset = 0 } = req.query

    if (!workspace_id) {
      return res.status(400).json({ error: "workspace_id is required" })
    }

    let query = `
      SELECT l.*, c.email, c.first_name, c.last_name, c.company,
             cam.name as campaign_name
      FROM leads l
      JOIN contacts c ON l.contact_id = c.id
      LEFT JOIN campaigns cam ON l.campaign_id = cam.id
      WHERE l.workspace_id = $1
    `
    const params: any[] = [workspace_id]

    if (status) {
      query += ` AND l.status = $${params.length + 1}`
      params.push(status)
    }

    query += ` ORDER BY l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    res.json({ leads: result.rows })
  } catch (error) {
    next(error)
  }
})

// Get lead detail (thread view)
leadRouter.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const { workspace_id } = req.query

    const leadResult = await pool.query(
      `SELECT l.*, c.email, c.first_name, c.last_name, c.company,
              cam.name as campaign_name
       FROM leads l
       JOIN contacts c ON l.contact_id = c.id
       LEFT JOIN campaigns cam ON l.campaign_id = cam.id
       WHERE l.id = $1 AND l.workspace_id = $2`,
      [id, workspace_id],
    )

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: "Lead not found" })
    }

    const lead = leadResult.rows[0]

    // Get message thread
    const messagesResult = await pool.query(
      `SELECT * FROM email_messages 
       WHERE thread_id = $1 
       ORDER BY sent_at ASC, received_at ASC`,
      [lead.thread_id],
    )

    res.json({
      lead,
      messages: messagesResult.rows,
    })
  } catch (error) {
    next(error)
  }
})

// Take lead
leadRouter.post("/:id/take", async (req, res, next) => {
  try {
    const { id } = req.params
    const { workspace_id, user_id } = req.body

    const result = await pool.query(
      `UPDATE leads 
       SET status = 'taken', taken_by = $1, taken_at = NOW()
       WHERE id = $2 AND workspace_id = $3 AND status = 'new'
       RETURNING *`,
      [user_id, id, workspace_id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lead not found or already taken" })
    }

    res.json({ lead: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

// Live reply - send message in thread
leadRouter.post("/:id/reply", async (req, res, next) => {
  try {
    const { id } = req.params
    const { workspace_id, body, user_id } = req.body

    if (!body) {
      return res.status(400).json({ error: "body is required" })
    }

    // Get lead and verify ownership
    const leadResult = await pool.query(
      `SELECT l.*, c.email 
       FROM leads l
       JOIN contacts c ON l.contact_id = c.id
       WHERE l.id = $1 AND l.workspace_id = $2`,
      [id, workspace_id],
    )

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: "Lead not found" })
    }

    const lead = leadResult.rows[0]

    // Verify lead is taken (optional check)
    if (lead.status === "new") {
      return res.status(400).json({ error: "Lead must be taken before replying" })
    }

    // Get assigned Gmail account
    const accountResult = await pool.query(
      `SELECT ga.* FROM gmail_accounts ga
       JOIN account_assignments aa ON ga.id = aa.gmail_account_id
       WHERE aa.workspace_id = $1 AND ga.status = 'ok'
       LIMIT 1`,
      [workspace_id],
    )

    if (accountResult.rows.length === 0) {
      return res.status(400).json({ error: "No available Gmail account" })
    }

    const account = accountResult.rows[0]

    // Get the last message subject for reply
    const lastMessageResult = await pool.query(
      `SELECT subject FROM email_messages 
       WHERE thread_id = $1 
       ORDER BY sent_at DESC, received_at DESC 
       LIMIT 1`,
      [lead.thread_id],
    )

    const subject = lastMessageResult.rows.length > 0 ? `Re: ${lastMessageResult.rows[0].subject}` : "Re: Your inquiry"

    // Send via Gmail service
    const gmailServiceUrl = process.env.GMAIL_SERVICE_URL || "http://gmail-service:3001"
    const axios = require("axios")

    try {
      const sendResponse = await axios.post(`${gmailServiceUrl}/api/send`, {
        account_id: account.id,
        to: lead.email,
        subject,
        body,
        workspace_id,
        thread_id: lead.thread_id,
      })

      // Save the reply message
      const messageId = require("crypto").randomUUID()
      await pool.query(
        `INSERT INTO email_messages (id, workspace_id, gmail_account_id, thread_id, message_id, direction, recipient, subject, body, sent_at, sent_by_user_id)
         VALUES ($1, $2, $3, $4, $5, 'outbound', $6, $7, $8, NOW(), $9)`,
        [
          messageId,
          workspace_id,
          account.id,
          lead.thread_id,
          sendResponse.data.message_id,
          lead.email,
          subject,
          body,
          user_id,
        ],
      )

      // Update lead status to replied
      await pool.query(`UPDATE leads SET status = 'replied', replied_at = NOW() WHERE id = $1`, [id])

      res.json({
        success: true,
        message_id: sendResponse.data.message_id,
        thread_id: sendResponse.data.thread_id,
      })
    } catch (error: any) {
      console.error("[leads] Failed to send reply:", error.response?.data || error.message)
      throw new Error("Failed to send reply via Gmail service")
    }
  } catch (error) {
    next(error)
  }
})

// Close lead
leadRouter.post("/:id/close", async (req, res, next) => {
  try {
    const { id } = req.params
    const { workspace_id, reason } = req.body

    const result = await pool.query(
      `UPDATE leads 
       SET status = 'closed', closed_at = NOW(), closed_reason = $1
       WHERE id = $2 AND workspace_id = $3
       RETURNING *`,
      [reason || null, id, workspace_id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lead not found" })
    }

    res.json({ lead: result.rows[0] })
  } catch (error) {
    next(error)
  }
})
