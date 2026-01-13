import { Router } from "express"
import { pool } from "../db"
import { v4 as uuidv4 } from "uuid"

export const billingRouter = Router()

// Get balance
billingRouter.get("/balance", async (req, res, next) => {
  try {
    const { workspace_id } = req.query

    if (!workspace_id) {
      return res.status(400).json({ error: "workspace_id is required" })
    }

    const result = await pool.query(`SELECT SUM(amount) as balance FROM billing_ledger WHERE workspace_id = $1`, [
      workspace_id,
    ])

    const balance = Number.parseFloat(result.rows[0].balance || "0")

    res.json({ workspace_id, balance })
  } catch (error) {
    next(error)
  }
})

// Get ledger
billingRouter.get("/ledger", async (req, res, next) => {
  try {
    const { workspace_id, limit = 50, offset = 0 } = req.query

    if (!workspace_id) {
      return res.status(400).json({ error: "workspace_id is required" })
    }

    const result = await pool.query(
      `SELECT * FROM billing_ledger 
       WHERE workspace_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [workspace_id, limit, offset],
    )

    res.json({ entries: result.rows })
  } catch (error) {
    next(error)
  }
})

// Add credit (manual/top-up)
billingRouter.post("/credit", async (req, res, next) => {
  try {
    const { workspace_id, amount, description } = req.body

    if (!workspace_id || !amount || amount <= 0) {
      return res.status(400).json({ error: "workspace_id and positive amount are required" })
    }

    const id = uuidv4()
    const result = await pool.query(
      `INSERT INTO billing_ledger (id, workspace_id, amount, type, description) 
       VALUES ($1, $2, $3, 'credit', $4) 
       RETURNING *`,
      [id, workspace_id, amount, description || "Manual credit"],
    )

    res.json({ entry: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

// Deduct (for sent emails, API calls, etc.)
billingRouter.post("/deduct", async (req, res, next) => {
  try {
    const { workspace_id, amount, description, reference_id } = req.body

    if (!workspace_id || !amount || amount <= 0) {
      return res.status(400).json({ error: "workspace_id and positive amount are required" })
    }

    // Check balance
    const balanceResult = await pool.query(
      `SELECT SUM(amount) as balance FROM billing_ledger WHERE workspace_id = $1`,
      [workspace_id],
    )
    const balance = Number.parseFloat(balanceResult.rows[0].balance || "0")

    if (balance < amount) {
      return res.status(402).json({ error: "Insufficient balance" })
    }

    const id = uuidv4()
    const result = await pool.query(
      `INSERT INTO billing_ledger (id, workspace_id, amount, type, description, reference_id) 
       VALUES ($1, $2, $3, 'debit', $4, $5) 
       RETURNING *`,
      [id, workspace_id, -amount, description || "Deduction", reference_id || null],
    )

    res.json({ entry: result.rows[0] })
  } catch (error) {
    next(error)
  }
})
