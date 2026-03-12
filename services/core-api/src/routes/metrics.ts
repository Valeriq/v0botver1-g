import { Router } from "express"
import { pool } from "../db"

const router: Router = Router()

// Get system metrics
router.get("/", async (req, res) => {
  try {
    // Campaign metrics
    const campaignStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active_campaigns,
        COUNT(*) FILTER (WHERE status = 'paused') as paused_campaigns,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_campaigns,
        COUNT(*) as total_campaigns
      FROM campaigns
    `)

    // Email metrics (last 24h, 7d, 30d)
    const emailStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as sent_24h,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as sent_7d,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as sent_30d,
        COUNT(*) as total_sent
      FROM email_messages
      WHERE sent_at IS NOT NULL
    `)

    // Reply metrics
    const replyStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as replies_24h,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as replies_7d,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as replies_30d,
        COUNT(*) as total_replies
      FROM reply_events
    `)

    // Lead metrics
    const leadStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'new') as new_leads,
        COUNT(*) FILTER (WHERE status = 'taken') as taken_leads,
        COUNT(*) FILTER (WHERE status = 'replied') as replied_leads,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_leads,
        COUNT(*) as total_leads
      FROM leads
    `)

    // Error metrics (failed jobs)
    const errorStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as errors_24h,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as errors_7d,
        COUNT(*) as total_errors
      FROM queue_jobs
      WHERE status = 'failed'
    `)

    // Queue metrics
    const queueStats = await pool.query(`
      SELECT 
        queue_name,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) FILTER (WHERE processed_at IS NOT NULL) as avg_processing_time_seconds
      FROM queue_jobs
      GROUP BY queue_name
    `)

    // Workspace metrics
    const workspaceStats = await pool.query(`
      SELECT 
        COUNT(*) as total_workspaces,
        COUNT(*) FILTER (WHERE is_active = true) as active_workspaces
      FROM workspaces
    `)

    // Gmail account pool metrics
    const gmailStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'ok') as ok_accounts,
        COUNT(*) FILTER (WHERE status = 'daily_limit') as limited_accounts,
        COUNT(*) FILTER (WHERE status = 'blocked') as blocked_accounts,
        COUNT(*) as total_accounts
      FROM gmail_accounts
    `)

    res.json({
      timestamp: new Date().toISOString(),
      campaigns: campaignStats.rows[0],
      emails: emailStats.rows[0],
      replies: replyStats.rows[0],
      leads: leadStats.rows[0],
      errors: errorStats.rows[0],
      queues: queueStats.rows,
      workspaces: workspaceStats.rows[0],
      gmail_pool: gmailStats.rows[0],
    })
  } catch (error: any) {
    console.error("[metrics] Error fetching metrics:", error)
    res.status(500).json({ error: "Failed to fetch metrics" })
  }
})

// Get detailed campaign metrics
router.get("/campaigns/:campaignId", async (req, res) => {
  try {
    const { campaignId } = req.params

    const result = await pool.query(
      `
      SELECT 
        c.id,
        c.name,
        c.status,
        COUNT(cr.id) as total_recipients,
        COUNT(em.id) FILTER (WHERE em.sent_at IS NOT NULL) as emails_sent,
        COUNT(re.id) as replies_received,
        COUNT(l.id) as leads_generated,
        COUNT(qj.id) FILTER (WHERE qj.status = 'failed') as failed_jobs
      FROM campaigns c
      LEFT JOIN campaign_recipients cr ON cr.campaign_id = c.id
      LEFT JOIN email_messages em ON em.campaign_recipient_id = cr.id
      LEFT JOIN reply_events re ON re.campaign_id = c.id
      LEFT JOIN leads l ON l.campaign_id = c.id
      LEFT JOIN queue_jobs qj ON qj.metadata->>'campaign_id' = c.id::text
      WHERE c.id = $1
      GROUP BY c.id, c.name, c.status
    `,
      [campaignId],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Campaign not found" })
    }

    res.json(result.rows[0])
  } catch (error: any) {
    console.error("[metrics] Error fetching campaign metrics:", error)
    res.status(500).json({ error: "Failed to fetch campaign metrics" })
  }
})

export const metricsRouter = router
