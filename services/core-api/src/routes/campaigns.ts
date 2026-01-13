import { Router } from "express"
import { pool } from "../db"
import { v4 as uuidv4 } from "uuid"
import { scheduleCampaign } from "../lib/queue"

export const campaignRouter = Router()

// Create campaign
campaignRouter.post("/", async (req, res, next) => {
  try {
    const { workspace_id, name, prompt_profile_id, steps } = req.body

    if (!workspace_id || !name) {
      return res.status(400).json({ error: "workspace_id and name are required" })
    }

    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      const campaignId = uuidv4()
      const campaignResult = await client.query(
        `INSERT INTO campaigns (id, workspace_id, name, status, prompt_profile_id) 
         VALUES ($1, $2, $3, 'draft', $4) 
         RETURNING *`,
        [campaignId, workspace_id, name, prompt_profile_id || null],
      )

      // Create campaign steps
      if (steps && Array.isArray(steps)) {
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i]
          await client.query(
            `INSERT INTO campaign_steps (id, campaign_id, step_number, template, delay_hours) 
             VALUES ($1, $2, $3, $4, $5)`,
            [uuidv4(), campaignId, i + 1, step.template || "", step.delay_hours || 0],
          )
        }
      }

      await client.query("COMMIT")
      res.json({ campaign: campaignResult.rows[0] })
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    next(error)
  }
})

// List campaigns
campaignRouter.get("/", async (req, res, next) => {
  try {
    const { workspace_id } = req.query

    if (!workspace_id) {
      return res.status(400).json({ error: "workspace_id is required" })
    }

    const result = await pool.query(
      `SELECT c.*, COUNT(DISTINCT cr.id) as recipients_count
       FROM campaigns c
       LEFT JOIN campaign_recipients cr ON c.id = cr.campaign_id
       WHERE c.workspace_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [workspace_id],
    )

    res.json({ campaigns: result.rows })
  } catch (error) {
    next(error)
  }
})

// Get campaign with stats
campaignRouter.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const { workspace_id } = req.query

    const campaignResult = await pool.query(`SELECT * FROM campaigns WHERE id = $1 AND workspace_id = $2`, [
      id,
      workspace_id,
    ])

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: "Campaign not found" })
    }

    const stepsResult = await pool.query(`SELECT * FROM campaign_steps WHERE campaign_id = $1 ORDER BY step_number`, [
      id,
    ])

    const statsResult = await pool.query(
      `SELECT 
         COUNT(*) as total_recipients,
         COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
         COUNT(CASE WHEN status = 'replied' THEN 1 END) as replied,
         COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
       FROM campaign_recipients WHERE campaign_id = $1`,
      [id],
    )

    res.json({
      campaign: campaignResult.rows[0],
      steps: stepsResult.rows,
      stats: statsResult.rows[0],
    })
  } catch (error) {
    next(error)
  }
})

// Start/pause campaign
campaignRouter.post("/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params
    const { workspace_id, status } = req.body

    if (!["active", "paused"].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be 'active' or 'paused'" })
    }

    const result = await pool.query(
      `UPDATE campaigns SET status = $1, updated_at = NOW() 
       WHERE id = $2 AND workspace_id = $3 
       RETURNING *`,
      [status, id, workspace_id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Campaign not found" })
    }

    // If activating campaign, schedule it
    if (status === "active") {
      const recipientsScheduled = await scheduleCampaign(id, workspace_id)
      res.json({
        campaign: result.rows[0],
        recipients_scheduled: recipientsScheduled,
      })
    } else {
      res.json({ campaign: result.rows[0] })
    }
  } catch (error) {
    next(error)
  }
})

// Add recipients to campaign
campaignRouter.post("/:id/recipients", async (req, res, next) => {
  try {
    const { id } = req.params
    const { workspace_id, contact_ids } = req.body

    if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
      return res.status(400).json({ error: "contact_ids array is required" })
    }

    // Check suppression list
    const suppressedResult = await pool.query(`SELECT email FROM suppression_list WHERE workspace_id = $1`, [
      workspace_id,
    ])
    const suppressedEmails = new Set(suppressedResult.rows.map((r) => r.email))

    // Get contacts
    const contactsResult = await pool.query(`SELECT id, email FROM contacts WHERE id = ANY($1) AND workspace_id = $2`, [
      contact_ids,
      workspace_id,
    ])

    // Filter out suppressed contacts
    const validContacts = contactsResult.rows.filter((c) => !suppressedEmails.has(c.email))

    // Insert recipients
    const values = validContacts.map((c) => `('${uuidv4()}', '${id}', '${c.id}', 'pending')`).join(",")

    if (values) {
      await pool.query(`
        INSERT INTO campaign_recipients (id, campaign_id, contact_id, status)
        VALUES ${values}
        ON CONFLICT (campaign_id, contact_id) DO NOTHING
      `)
    }

    res.json({
      success: true,
      added: validContacts.length,
      suppressed: contact_ids.length - validContacts.length,
    })
  } catch (error) {
    next(error)
  }
})
