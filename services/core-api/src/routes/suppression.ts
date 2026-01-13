import { Router } from "express"
import { pool } from "../db"
import { v4 as uuidv4 } from "uuid"

export const suppressionRouter = Router()

// Add email to suppression list
suppressionRouter.post("/", async (req, res, next) => {
  try {
    const { workspace_id, email, reason } = req.body

    if (!workspace_id || !email) {
      return res.status(400).json({ error: "workspace_id and email are required" })
    }

    const id = uuidv4()
    await pool.query(
      `INSERT INTO suppression_list (id, workspace_id, email, reason) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (workspace_id, email) DO NOTHING`,
      [id, workspace_id, email.toLowerCase(), reason || null],
    )

    res.json({ success: true, id })
  } catch (error) {
    next(error)
  }
})

// List suppressed emails
suppressionRouter.get("/", async (req, res, next) => {
  try {
    const { workspace_id } = req.query

    if (!workspace_id) {
      return res.status(400).json({ error: "workspace_id is required" })
    }

    const result = await pool.query(`SELECT * FROM suppression_list WHERE workspace_id = $1 ORDER BY created_at DESC`, [
      workspace_id,
    ])

    res.json({ suppressed: result.rows })
  } catch (error) {
    next(error)
  }
})

// Remove from suppression
suppressionRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const { workspace_id } = req.query

    await pool.query(`DELETE FROM suppression_list WHERE id = $1 AND workspace_id = $2`, [id, workspace_id])

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})
