import { Router } from "express"
import { pool } from "../db"
import { v4 as uuidv4 } from "uuid"
import { parse } from "csv-parse/sync"
import { validateRequest, uploadContactsSchema, paginationSchema } from "../lib/validation"
import { uploadLimiter } from "../middleware/rateLimiter"

export const contactRouter = Router()

contactRouter.post("/upload", uploadLimiter, async (req, res, next) => {
  try {
    const data = validateRequest(uploadContactsSchema, req.body)

    const records = parse(data.file_content, {
      columns: true,
      skip_empty_lines: true,
      delimiter: data.delimiter,
      trim: true,
    })

    const emailSet = new Set<string>()
    const contacts = []
    const errors: string[] = []

    for (const record of records) {
      const email = record.email?.toLowerCase().trim()

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(`Invalid email: ${email || "empty"}`)
        continue
      }

      if (emailSet.has(email)) {
        errors.push(`Duplicate email: ${email}`)
        continue
      }

      emailSet.add(email)
      contacts.push({
        id: uuidv4(),
        workspace_id: data.workspace_id,
        email,
        first_name: record.first_name || null,
        last_name: record.last_name || null,
        company: record.company || null,
        website: record.website || null,
        custom_fields: record.custom_fields ? JSON.parse(record.custom_fields) : {},
      })
    }

    if (contacts.length > 0) {
      const values = contacts
        .map(
          (c) =>
            `('${c.id}', '${c.workspace_id}', '${c.email}', ${c.first_name ? `'${c.first_name.replace(/'/g, "''")}'` : "NULL"}, ${c.last_name ? `'${c.last_name.replace(/'/g, "''")}'` : "NULL"}, ${c.company ? `'${c.company.replace(/'/g, "''")}'` : "NULL"}, ${c.website ? `'${c.website}'` : "NULL"}, '${JSON.stringify(c.custom_fields)}'::jsonb)`,
        )
        .join(",")

      await pool.query(`
        INSERT INTO contacts (id, workspace_id, email, first_name, last_name, company, website, custom_fields)
        VALUES ${values}
        ON CONFLICT (workspace_id, email) DO NOTHING
      `)
    }

    res.json({
      success: true,
      uploaded: contacts.length,
      skipped: records.length - contacts.length,
      errors: errors.slice(0, 10), // Return first 10 errors
    })
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({ error: "Validation failed", details: error })
    }
    next(error)
  }
})

contactRouter.get("/", async (req, res, next) => {
  try {
    const { workspace_id } = req.query

    if (!workspace_id) {
      return res.status(400).json({ error: "workspace_id is required" })
    }

    const { limit, offset } = validateRequest(paginationSchema, req.query)

    const result = await pool.query(
      `SELECT * FROM contacts WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [workspace_id, limit, offset],
    )

    const countResult = await pool.query(`SELECT COUNT(*) FROM contacts WHERE workspace_id = $1`, [workspace_id])

    res.json({
      contacts: result.rows,
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

// List contacts
contactRouter.get("/", async (req, res, next) => {
  try {
    const { workspace_id, limit = 50, offset = 0 } = req.query

    if (!workspace_id) {
      return res.status(400).json({ error: "workspace_id is required" })
    }

    const result = await pool.query(
      `SELECT * FROM contacts WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [workspace_id, limit, offset],
    )

    const countResult = await pool.query(`SELECT COUNT(*) FROM contacts WHERE workspace_id = $1`, [workspace_id])

    res.json({
      contacts: result.rows,
      total: Number.parseInt(countResult.rows[0].count),
      limit: Number.parseInt(limit as string),
      offset: Number.parseInt(offset as string),
    })
  } catch (error) {
    next(error)
  }
})

// Delete contact
contactRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const { workspace_id } = req.query

    await pool.query(`DELETE FROM contacts WHERE id = $1 AND workspace_id = $2`, [id, workspace_id])

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})
