import { Router } from "express"
import { pool } from "../db"
import { v4 as uuidv4 } from "uuid"
import { parse } from "csv-parse/sync"
import {
  validateRequest,
  uploadContactsSchema,
  paginationSchema,
  importSheetsPreviewSchema,
  importSheetsSchema,
} from "../lib/validation"
import { uploadLimiter } from "../middleware/rateLimiter"
import { parseGoogleSheetsHTML } from "../lib/sheets-parser"

export const contactRouter = Router()

// Regex для Google Sheets URL
const GOOGLE_SHEETS_REGEX = /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/

contactRouter.post("/upload", uploadLimiter, async (req, res, next) => {
  try {
    const data = validateRequest(uploadContactsSchema, req.body)

    const records = parse(data.file_content, {
      columns: true,
      skip_empty_lines: true,
      delimiter: data.delimiter,
      trim: true,
    })

    // Сохраняем оригинальный CSV файл в базу
    const csvUploadId = uuidv4()
    const filename = data.filename || `upload_${Date.now()}.csv`
    await pool.query(
      `INSERT INTO csv_uploads (id, workspace_id, filename, original_content, row_count)
       VALUES ($1, $2, $3, $4, $5)`,
      [csvUploadId, data.workspace_id, filename, data.file_content, records.length]
    )

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
      csvUploadId,
      uploaded: contacts.length,
      skipped: records.length - contacts.length,
      errors: errors.slice(0, 10),
    })
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({ error: "Validation failed", details: error })
    }
    next(error)
  }
})

// Preview endpoint - возвращает данные для предпросмотра перед импортом
contactRouter.post("/import-sheets/preview", uploadLimiter, async (req, res, next) => {
  try {
    const data = validateRequest(importSheetsPreviewSchema, req.body)

    // Извлекаем URL для публичного просмотра (публикуем как HTML)
    const match = data.sheet_url.match(GOOGLE_SHEETS_REGEX)
    if (!match) {
      return res.status(400).json({ error: "Invalid Google Sheets URL format" })
    }

    const sheetId = match[1]
    const publishUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=html`

    // Загружаем HTML
    const response = await fetch(publishUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (!response.ok) {
      return res.status(400).json({
        error: "Sheet not accessible",
        details: "Make sure the sheet is shared with 'Anyone with the link'",
      })
    }

    const html = await response.text()
    const { headers, rows, detectedMapping } = parseGoogleSheetsHTML(html)

    if (rows.length === 0) {
      return res.status(400).json({ error: "No data found in sheet" })
    }

    if (!detectedMapping.email) {
      return res.status(400).json({
        error: "Email column not detected",
        hint: "Please provide column_mapping with 'email' key",
        availableColumns: headers,
      })
    }

    res.json({
      preview: rows.slice(0, 10), // Первые 10 строк для предпросмотра
      totalRows: rows.length,
      headers,
      detectedMapping,
    })
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({ error: "Validation failed", details: error })
    }
    next(error)
  }
})

// Import endpoint - выполняет импорт контактов
contactRouter.post("/import-sheets", uploadLimiter, async (req, res, next) => {
  try {
    const data = validateRequest(importSheetsSchema, req.body)

    const match = data.sheet_url.match(GOOGLE_SHEETS_REGEX)
    if (!match) {
      return res.status(400).json({ error: "Invalid Google Sheets URL format" })
    }

    const sheetId = match[1]
    const publishUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=html`

    const response = await fetch(publishUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (!response.ok) {
      return res.status(400).json({ error: "Sheet not accessible" })
    }

    const html = await response.text()
    const { rows, detectedMapping } = parseGoogleSheetsHTML(html)

    // Маппинг колонок (переопределение или автоопределение)
    const mapping = data.column_mapping || detectedMapping

    if (!mapping.email) {
      return res.status(400).json({ error: "Email column required" })
    }

    // Создаём contact_list
    const listId = uuidv4()
    await pool.query(
      `INSERT INTO contact_lists (id, workspace_id, name, source_type, source_url, row_count)
       VALUES ($1, $2, $3, 'google_sheets', $4, $5)`,
      [listId, data.workspace_id, data.contact_list_name || `Import ${new Date().toISOString()}`, data.sheet_url, rows.length]
    )

    // Импортируем контакты
    const emailSet = new Set<string>()
    const contacts = []
    const errors: string[] = []

    for (const row of rows) {
      const email = row[mapping.email]?.toLowerCase().trim()

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(`Invalid email: ${email || "empty"}`)
        continue
      }

      if (emailSet.has(email)) {
        continue // Дубликат внутри файла
      }

      emailSet.add(email)
      contacts.push({
        id: uuidv4(),
        workspace_id: data.workspace_id,
        contact_list_id: listId,
        email,
        first_name: mapping.name ? row[mapping.name] : null,
        last_name: null,
        company: mapping.company ? row[mapping.company] : null,
        website: null,
        raw_data: row,
      })
    }

    // Batch insert с ON CONFLICT
    if (contacts.length > 0) {
      const values = contacts
        .map(
          (c) =>
            `('${c.id}', '${c.workspace_id}', ${c.contact_list_id ? `'${c.contact_list_id}'` : "NULL"}, '${c.email}', ${c.first_name ? `'${c.first_name.replace(/'/g, "''")}'` : "NULL"}, NULL, ${c.company ? `'${c.company.replace(/'/g, "''")}'` : "NULL"}, NULL, '${JSON.stringify(c.raw_data).replace(/'/g, "''")}'::jsonb)`
        )
        .join(",")

      await pool.query(`
        INSERT INTO contacts (id, workspace_id, contact_list_id, email, first_name, last_name, company, website, raw_data)
        VALUES ${values}
        ON CONFLICT (workspace_id, email) DO UPDATE SET
          first_name = COALESCE(EXCLUDED.first_name, contacts.first_name),
          company = COALESCE(EXCLUDED.company, contacts.company),
          raw_data = EXCLUDED.raw_data,
          contact_list_id = EXCLUDED.contact_list_id
      `)
    }

    res.json({
      success: true,
      contact_list_id: listId,
      imported: contacts.length,
      skipped: rows.length - contacts.length,
      errors: errors.slice(0, 10),
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

// Delete all contacts for workspace
contactRouter.delete("/all", async (req, res, next) => {
  try {
    const { workspace_id } = req.query

    if (!workspace_id) {
      return res.status(400).json({ error: "workspace_id is required" })
    }

    const contactsResult = await pool.query("DELETE FROM contacts WHERE workspace_id = $1", [workspace_id])
    const listsResult = await pool.query("DELETE FROM contact_lists WHERE workspace_id = $1", [workspace_id])

    res.json({ 
      success: true, 
      contacts_deleted: contactsResult.rowCount,
      lists_deleted: listsResult.rowCount 
    })
  } catch (error) {
    next(error)
  }
})
