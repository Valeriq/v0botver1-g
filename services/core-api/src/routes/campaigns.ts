import { Router } from "express"
import { pool } from "../db"
import { v4 as uuidv4 } from "uuid"
import { scheduleCampaign } from "../lib/queue"
import { validateRequest, createCampaignSchema, updateCampaignStatusSchema, paginationSchema } from "../lib/validation"
import { campaignLimiter } from "../middleware/rateLimiter"

export const campaignRouter: Router = Router()

// Create campaign
campaignRouter.post("/", campaignLimiter, async (req, res, next) => {
  try {
    const data = validateRequest(createCampaignSchema, req.body)

    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      const campaignId = uuidv4()
      const campaignResult = await client.query(
        `INSERT INTO campaigns (id, workspace_id, name, status, prompt_profile_id) 
         VALUES ($1, $2, $3, 'draft', $4) 
         RETURNING *`,
        [campaignId, data.workspace_id, data.name, data.prompt_profile_id || null],
      )

      for (let i = 0; i < data.steps.length; i++) {
        const step = data.steps[i]
        await client.query(
          `INSERT INTO campaign_steps (id, campaign_id, step_number, template, delay_hours) 
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), campaignId, i + 1, step.template, step.delay_hours],
        )
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
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({ error: "Validation failed", details: error })
    }
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

    const { limit, offset } = validateRequest(paginationSchema, req.query)

    const result = await pool.query(
      `SELECT c.*, COUNT(DISTINCT cr.id) as recipients_count
       FROM campaigns c
       LEFT JOIN campaign_recipients cr ON c.id = cr.campaign_id
       WHERE c.workspace_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [workspace_id, limit, offset],
    )

    const countResult = await pool.query(`SELECT COUNT(*) FROM campaigns WHERE workspace_id = $1`, [workspace_id])

    res.json({
      campaigns: result.rows,
      total: Number.parseInt(countResult.rows[0].count),
      limit,
      offset,
    })
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({ error: "Validation failed", details: error })
    }
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

    const data = validateRequest(updateCampaignStatusSchema, req.body)

    const result = await pool.query(
      `UPDATE campaigns SET status = $1, updated_at = NOW() 
       WHERE id = $2 AND workspace_id = $3 
       RETURNING *`,
      [data.status, id, data.workspace_id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Campaign not found" })
    }

    if (data.status === "active") {
      const recipientsScheduled = await scheduleCampaign(id, data.workspace_id)
      res.json({
        campaign: result.rows[0],
        recipients_scheduled: recipientsScheduled,
      })
    } else {
      res.json({ campaign: result.rows[0] })
    }
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({ error: "Validation failed", details: error })
    }
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

    const suppressedResult = await pool.query(`SELECT email FROM suppression_list WHERE workspace_id = $1`, [
      workspace_id,
    ])
    const suppressedEmails = new Set(suppressedResult.rows.map((r) => r.email))

    const contactsResult = await pool.query(`SELECT id, email FROM contacts WHERE id = ANY($1) AND workspace_id = $2`, [
      contact_ids,
      workspace_id,
    ])

    const validContacts = contactsResult.rows.filter((c) => !suppressedEmails.has(c.email))

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
