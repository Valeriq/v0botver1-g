import { Router } from "express"
import { pool } from "../db"
import { sendEmail } from "../lib/gmail-client"

export const sendRouter = Router()

sendRouter.post("/", async (req, res, next) => {
  try {
    const { account_id, to, subject, body, workspace_id, thread_id } = req.body

    if (!account_id || !to || !subject || !body) {
      return res.status(400).json({ error: "account_id, to, subject, and body are required" })
    }

    // Get account
    const accountResult = await pool.query(
      `SELECT id, email, access_token, refresh_token, status, daily_quota, daily_sent 
       FROM gmail_accounts 
       WHERE id = $1`,
      [account_id],
    )

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: "Gmail account not found" })
    }

    const account = accountResult.rows[0]

    if (account.status !== "ok") {
      return res.status(400).json({ error: `Account status is ${account.status}, cannot send` })
    }

    if (account.daily_sent >= account.daily_quota) {
      await pool.query(`UPDATE gmail_accounts SET status = 'limit', status_updated_at = NOW() WHERE id = $1`, [
        account_id,
      ])
      return res.status(429).json({ error: "Daily quota exceeded" })
    }

    try {
      // Send email
      const result = await sendEmail(account, to, subject, body, thread_id)

      await pool.query(`UPDATE gmail_accounts SET last_used_at = NOW(), daily_sent = daily_sent + 1 WHERE id = $1`, [
        account_id,
      ])

      res.json({
        success: true,
        message_id: result.message_id,
        thread_id: result.thread_id,
      })
    } catch (error: any) {
      if (error.message === "RATE_LIMIT") {
        await pool.query(`UPDATE gmail_accounts SET status = 'limit', status_updated_at = NOW() WHERE id = $1`, [
          account_id,
        ])
        return res.status(429).json({ error: "Rate limit exceeded", code: "RATE_LIMIT" })
      } else if (error.message === "AUTH_FAILED") {
        await pool.query(`UPDATE gmail_accounts SET status = 'auth_failed', status_updated_at = NOW() WHERE id = $1`, [
          account_id,
        ])
        return res.status(401).json({ error: "Authentication failed", code: "AUTH_FAILED" })
      } else if (error.message === "PERMISSION_DENIED") {
        await pool.query(`UPDATE gmail_accounts SET status = 'blocked', status_updated_at = NOW() WHERE id = $1`, [
          account_id,
        ])
        return res.status(403).json({ error: "Permission denied", code: "PERMISSION_DENIED" })
      } else if (error.message === "INVALID_RECIPIENT") {
        return res.status(400).json({ error: "Invalid recipient address", code: "INVALID_RECIPIENT" })
      } else if (error.message === "GMAIL_SERVICE_UNAVAILABLE") {
        return res.status(503).json({ error: "Gmail service temporarily unavailable", code: "SERVICE_UNAVAILABLE" })
      }

      throw error
    }
  } catch (error) {
    next(error)
  }
})
