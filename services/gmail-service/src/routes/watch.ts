import { Router } from "express"
import { pool } from "../db"
import { setupWatch } from "../lib/gmail-client"

export const watchRouter = Router()

watchRouter.post("/setup", async (req, res, next) => {
  try {
    const { account_id } = req.body

    if (!account_id) {
      return res.status(400).json({ error: "account_id is required" })
    }

    // Get account
    const accountResult = await pool.query(
      `SELECT id, email, access_token, refresh_token 
       FROM gmail_accounts 
       WHERE id = $1`,
      [account_id],
    )

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: "Account not found" })
    }

    const account = accountResult.rows[0]

    // Setup watch
    const topicName = process.env.GMAIL_PUBSUB_TOPIC || "projects/YOUR_PROJECT/topics/gmail-push"
    const watchData = await setupWatch(account, topicName)

    // Update account with history_id
    await pool.query(`UPDATE gmail_accounts SET history_id = $1, watch_expiration = $2 WHERE id = $3`, [
      watchData.history_id,
      new Date(Number.parseInt(watchData.expiration)),
      account_id,
    ])

    res.json({
      success: true,
      history_id: watchData.history_id,
      expiration: watchData.expiration,
    })
  } catch (error) {
    next(error)
  }
})
