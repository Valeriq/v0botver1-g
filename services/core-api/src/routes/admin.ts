import { Router } from "express"
import { pool } from "../db"

export const adminRouter: Router = Router()

// Get all workspaces with activity stats
adminRouter.get("/workspaces", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        w.id,
        w.telegram_user_id,
        w.created_at,
        w.is_active,
        COUNT(DISTINCT c.id) as contacts_count,
        COUNT(DISTINCT camp.id) as campaigns_count,
        COUNT(DISTINCT l.id) as leads_count,
        COALESCE(SUM(bl.amount), 0) as total_spent
      FROM workspaces w
      LEFT JOIN contacts c ON c.workspace_id = w.id
      LEFT JOIN campaigns camp ON camp.workspace_id = w.id
      LEFT JOIN leads l ON l.workspace_id = w.id
      LEFT JOIN billing_ledger bl ON bl.workspace_id = w.id AND bl.amount < 0
      GROUP BY w.id
      ORDER BY w.created_at DESC
    `)

    res.json({ success: true, workspaces: result.rows })
  } catch (error) {
    console.error("[admin] Error fetching workspaces:", error)
    res.status(500).json({ success: false, error: "Failed to fetch workspaces" })
  }
})

// Toggle workspace active status
adminRouter.patch("/workspaces/:workspaceId/toggle", async (req, res) => {
  try {
    const { workspaceId } = req.params

    const result = await pool.query(
      `UPDATE workspaces SET is_active = NOT is_active WHERE id = $1 RETURNING is_active`,
      [workspaceId],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Workspace not found" })
    }

    res.json({ success: true, is_active: result.rows[0].is_active })
  } catch (error) {
    console.error("[admin] Error toggling workspace:", error)
    res.status(500).json({ success: false, error: "Failed to toggle workspace" })
  }
})

// Get all Gmail accounts in pool with status
adminRouter.get("/gmail-accounts", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ga.id,
        ga.email,
        ga.status,
        ga.daily_limit,
        ga.sent_today,
        ga.last_send_at,
        ga.error_count,
        ga.last_error,
        ga.created_at,
        COUNT(DISTINCT aa.workspace_id) as assigned_workspaces
      FROM gmail_accounts ga
      LEFT JOIN account_assignments aa ON aa.account_id = ga.id
      GROUP BY ga.id
      ORDER BY ga.status, ga.email
    `)

    res.json({ success: true, accounts: result.rows })
  } catch (error) {
    console.error("[admin] Error fetching Gmail accounts:", error)
    res.status(500).json({ success: false, error: "Failed to fetch Gmail accounts" })
  }
})

// Update Gmail account status
adminRouter.patch("/gmail-accounts/:accountId/status", async (req, res) => {
  try {
    const { accountId } = req.params
    const { status } = req.body

    if (!["ok", "limit", "blocked", "disabled"].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" })
    }

    const result = await pool.query(`UPDATE gmail_accounts SET status = $1 WHERE id = $2 RETURNING *`, [
      status,
      accountId,
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Account not found" })
    }

    res.json({ success: true, account: result.rows[0] })
  } catch (error) {
    console.error("[admin] Error updating account status:", error)
    res.status(500).json({ success: false, error: "Failed to update account status" })
  }
})

// Get system stats
adminRouter.get("/stats", async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM workspaces WHERE is_active = true) as active_workspaces,
        (SELECT COUNT(*) FROM gmail_accounts WHERE status = 'ok') as healthy_accounts,
        (SELECT COUNT(*) FROM campaigns WHERE status = 'active') as active_campaigns,
        (SELECT COUNT(*) FROM email_messages WHERE sent_at >= NOW() - INTERVAL '24 hours') as emails_sent_24h,
        (SELECT COUNT(*) FROM leads WHERE created_at >= NOW() - INTERVAL '24 hours') as leads_24h
    `)

    res.json({ success: true, stats: stats.rows[0] })
  } catch (error) {
    console.error("[admin] Error fetching stats:", error)
    res.status(500).json({ success: false, error: "Failed to fetch stats" })
  }
})
