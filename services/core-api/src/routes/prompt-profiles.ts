import { Router } from "express"
import { pool } from "../db"
import { v4 as uuidv4 } from "uuid"

export const promptProfileRouter = Router()

// Create prompt profile
promptProfileRouter.post("/", async (req, res, next) => {
  try {
    const { workspace_id, name, system_prompt, user_variables, config } = req.body

    if (!workspace_id || !name) {
      return res.status(400).json({ error: "workspace_id and name are required" })
    }

    const id = uuidv4()
    const result = await pool.query(
      `INSERT INTO prompt_profiles (id, workspace_id, name, system_prompt, user_variables, config) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [id, workspace_id, name, system_prompt || "", user_variables || {}, config || {}],
    )

    res.json({ profile: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

// Update prompt profile
promptProfileRouter.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const { workspace_id, name, system_prompt, user_variables, config } = req.body

    const result = await pool.query(
      `UPDATE prompt_profiles 
       SET name = COALESCE($1, name), 
           system_prompt = COALESCE($2, system_prompt),
           user_variables = COALESCE($3, user_variables),
           config = COALESCE($4, config),
           updated_at = NOW()
       WHERE id = $5 AND workspace_id = $6
       RETURNING *`,
      [name, system_prompt, user_variables, config, id, workspace_id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" })
    }

    res.json({ profile: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

// List prompt profiles
promptProfileRouter.get("/", async (req, res, next) => {
  try {
    const { workspace_id } = req.query

    if (!workspace_id) {
      return res.status(400).json({ error: "workspace_id is required" })
    }

    const result = await pool.query(`SELECT * FROM prompt_profiles WHERE workspace_id = $1 ORDER BY created_at DESC`, [
      workspace_id,
    ])

    res.json({ profiles: result.rows })
  } catch (error) {
    next(error)
  }
})

// Delete prompt profile
promptProfileRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const { workspace_id } = req.query

    await pool.query(`DELETE FROM prompt_profiles WHERE id = $1 AND workspace_id = $2`, [id, workspace_id])

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})
