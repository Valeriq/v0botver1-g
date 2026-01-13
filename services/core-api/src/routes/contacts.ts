import { Router } from "express"
import { pool } from "../db"
import { v4 as uuidv4 } from "uuid"
import { parse } from "csv-parse/sync"

export const contactRouter = Router()

// Upload CSV/TSV contacts
contactRouter.post("/upload", async (req, res, next) => {
  try {
    const { workspace_id, file_content, delimiter = "," } = req.body

    if (!workspace_id || !file_content) {
      return res.status(400).json({ error: "workspace_id and file_content are required" })
    }

    // Parse CSV/TSV
    const records = parse(file_content, {
      columns: true,
      skip_empty_lines: true,
      delimiter,
      trim: true,
    })

    // Validation and dedupe
    const emailSet = new Set<string>()
    const contacts = []

    for (const record of records) {
      const email = record.email?.toLowerCase().trim()

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        continue // Skip invalid emails
      }

      if (emailSet.has(email)) {
        continue // Skip duplicates in upload
      }

      emailSet.add(email)
      contacts.push({
        id: uuidv4(),
        workspace_id,
        email,
        first_name: record.first_name || null,
        last_name: record.last_name || null,
        company: record.company || null,
        website: record.website || null,
        custom_fields: record.custom_fields ? JSON.parse(record.custom_fields) : {},
      })
    }

    // Insert contacts (on conflict do nothing for existing emails)
    if (contacts.length > 0) {
      const values = contacts
        .map(
          (c) =>
            `('${c.id}', '${c.workspace_id}', '${c.email}', ${c.first_name ? `'${c.first_name}'` : "NULL"}, ${c.last_name ? `'${c.last_name}'` : "NULL"}, ${c.company ? `'${c.company}'` : "NULL"}, ${c.website ? `'${c.website}'` : "NULL"}, '${JSON.stringify(c.custom_fields)}'::jsonb)`,
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
    })
  } catch (error) {
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
