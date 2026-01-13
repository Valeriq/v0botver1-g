import { Router } from "express"
import { z } from "zod"
import { pool } from "../db/pool"
import { v4 as uuidv4 } from "uuid"

export const workspaceRouter = Router()

const createWorkspaceSchema = z.object({
  telegram_user_id: z.string(),
  name: z.string().optional(),
  telegram_username: z.string().optional(),
  telegram_first_name: z.string().optional(),
  telegram_last_name: z.string().optional(),
})

// Create workspace
workspaceRouter.post("/", async (req, res, next) => {
  try {
    const data = createWorkspaceSchema.parse(req.body)

    // Check if workspace exists
    const existingResult = await pool.query("SELECT * FROM workspaces WHERE telegram_user_id = $1", [
      data.telegram_user_id,
    ])

    if (existingResult.rows.length > 0) {
      return res.status(200).json({
        workspace: existingResult.rows[0],
        message: "Workspace already exists",
      })
    }

    // Create workspace
    const workspaceId = uuidv4()
    const workspaceResult = await pool.query(
      `INSERT INTO workspaces (id, telegram_user_id, name) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [workspaceId, data.telegram_user_id, data.name || null],
    )

    // Create owner user
    await pool.query(
      `INSERT INTO users (workspace_id, telegram_username, telegram_first_name, telegram_last_name, role) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        workspaceId,
        data.telegram_username || null,
        data.telegram_first_name || null,
        data.telegram_last_name || null,
        "owner",
      ],
    )

    res.status(201).json({
      workspace: workspaceResult.rows[0],
      message: "Workspace created successfully",
    })
  } catch (error) {
    next(error)
  }
})

// Get workspace by telegram user ID
workspaceRouter.get("/by-telegram/:telegramUserId", async (req, res, next) => {
  try {
    const { telegramUserId } = req.params

    const result = await pool.query("SELECT * FROM workspaces WHERE telegram_user_id = $1", [telegramUserId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Workspace not found" })
    }

    res.json({ workspace: result.rows[0] })
  } catch (error) {
    next(error)
  }
})
