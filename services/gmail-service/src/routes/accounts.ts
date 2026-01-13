import { Router } from "express"
import { pool } from "../db"
import { v4 as uuidv4 } from "uuid"

export const accountsRouter = Router()

// List Gmail accounts (admin)
accountsRouter.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, email, status, daily_quota, daily_sent, last_used_at, status_updated_at, created_at
       FROM gmail_accounts
       ORDER BY created_at DESC`,
    )

    res.json({ accounts: result.rows })
  } catch (error) {
    next(error)
  }
})

// Get account by ID
accountsRouter.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `SELECT id, email, status, daily_quota, daily_sent, last_used_at, status_updated_at, created_at
       FROM gmail_accounts
       WHERE id = $1`,
      [id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Account not found" })
    }

    res.json({ account: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

// Add Gmail account (admin only - for platform setup)
accountsRouter.post("/", async (req, res, next) => {
  try {
    const { email, access_token, refresh_token, daily_quota = 500 } = req.body

    if (!email || !access_token || !refresh_token) {
      return res.status(400).json({ error: "email, access_token, and refresh_token are required" })
    }

    const id = uuidv4()
    const result = await pool.query(
      `INSERT INTO gmail_accounts (id, email, access_token, refresh_token, status, daily_quota, daily_sent)
       VALUES ($1, $2, $3, $4, 'ok', $5, 0)
       RETURNING id, email, status, daily_quota`,
      [id, email, access_token, refresh_token, daily_quota],
    )

    res.json({ account: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

// Update account status (admin)
accountsRouter.patch("/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!["ok", "limit", "blocked", "auth_failed", "disabled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" })
    }

    const result = await pool.query(
      `UPDATE gmail_accounts SET status = $1, status_updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Account not found" })
    }

    res.json({ account: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

// Assign account to workspace
accountsRouter.post("/assign", async (req, res, next) => {
  try {
    const { workspace_id, gmail_account_id } = req.body

    if (!workspace_id || !gmail_account_id) {
      return res.status(400).json({ error: "workspace_id and gmail_account_id are required" })
    }

    const id = uuidv4()
    await pool.query(
      `INSERT INTO account_assignments (id, workspace_id, gmail_account_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (workspace_id, gmail_account_id) DO NOTHING`,
      [id, workspace_id, gmail_account_id],
    )

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Get accounts assigned to workspace
accountsRouter.get("/workspace/:workspace_id", async (req, res, next) => {
  try {
    const { workspace_id } = req.params

    const result = await pool.query(
      `SELECT ga.id, ga.email, ga.status, ga.daily_quota, ga.daily_sent
       FROM gmail_accounts ga
       JOIN account_assignments aa ON ga.id = aa.gmail_account_id
       WHERE aa.workspace_id = $1`,
      [workspace_id],
    )

    res.json({ accounts: result.rows })
  } catch (error) {
    next(error)
  }
})

accountsRouter.post("/:id/health-check", async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `SELECT id, email, status, daily_quota, daily_sent, last_used_at, status_updated_at
       FROM gmail_accounts
       WHERE id = $1`,
      [id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Account not found" })
    }

    const account = result.rows[0]
    const now = new Date()
    const statusUpdatedAt = new Date(account.status_updated_at)
    const hoursSinceUpdate = (now.getTime() - statusUpdatedAt.getTime()) / (1000 * 60 * 60)

    // Auto-recover from 'limit' status after 24 hours
    if (account.status === "limit" && hoursSinceUpdate >= 24) {
      await pool.query(
        `UPDATE gmail_accounts SET status = 'ok', daily_sent = 0, status_updated_at = NOW() WHERE id = $1`,
        [id],
      )
      account.status = "ok"
      account.daily_sent = 0
    }

    res.json({
      account_id: account.id,
      email: account.email,
      status: account.status,
      health: account.status === "ok" ? "healthy" : "unhealthy",
      daily_sent: account.daily_sent,
      daily_quota: account.daily_quota,
      quota_remaining: account.daily_quota - account.daily_sent,
    })
  } catch (error) {
    next(error)
  }
})

accountsRouter.post("/reset-daily-quotas", async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE gmail_accounts 
       SET daily_sent = 0, status = CASE WHEN status = 'limit' THEN 'ok' ELSE status END, status_updated_at = NOW()
       WHERE status IN ('ok', 'limit')
       RETURNING id, email`,
    )

    res.json({
      success: true,
      reset_count: result.rowCount,
      accounts: result.rows,
    })
  } catch (error) {
    next(error)
  }
})
