import { Router, Request, Response, NextFunction } from "express"
import { createClient } from "@supabase/supabase-js"
import { pool } from "../db"
import multer from "multer"

const router = Router()

const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ]
    const allowedExts = [".csv", ".xlsx", ".xls"]
    const ext = file.originalname.substring(file.originalname.lastIndexOf(".")).toLowerCase()
    
    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error("Неподдерживаемый формат файла. Используйте CSV или Excel."))
    }
  }
})

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

function isNullUUID(str: string): boolean {
  return str === "00000000-0000-0000-0000-000000000000"
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-_]/g, "_")
    .substring(0, 200)
}

router.post(
  "/upload-file",
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file
      const workspaceId = req.body.workspace_id

      if (!file) {
        res.status(400).json({ error: "Файл не предоставлен" })
        return
      }

      if (!workspaceId) {
        res.status(400).json({ error: "workspace_id обязателен" })
        return
      }

      if (!isValidUUID(workspaceId)) {
        res.status(400).json({ error: "Некорректный формат workspace_id" })
        return
      }

      if (isNullUUID(workspaceId)) {
        res.status(400).json({ error: "Нулевой UUID не допускается для workspace_id" })
        return
      }

      const workspaceCheck = await pool.query(
        "SELECT id FROM workspaces WHERE id = $1",
        [workspaceId]
      )
      
      if (workspaceCheck.rows.length === 0) {
        res.status(400).json({ 
          error: `Workspace с ID ${workspaceId} не найден. Создайте workspace сначала.` 
        })
        return
      }

      const timestamp = Date.now()
      const sanitizedName = sanitizeFilename(file.originalname)
      const storagePath = `uploads/${workspaceId}/${timestamp}_${sanitizedName}`

      const { error: storageError } = await supabase.storage
        .from("csv-files")
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        })

      if (storageError) {
        console.error("[file-upload] Storage error:", storageError)
        res.status(500).json({ error: `Ошибка загрузки в хранилище: ${storageError.message}` })
        return
      }

      const { data: urlData } = supabase.storage
        .from("csv-files")
        .getPublicUrl(storagePath)

      const supabaseUrl = urlData?.publicUrl || storagePath

      const insertQuery = `
        INSERT INTO csv_uploads (workspace_id, filename, supabase_url, file_size, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, filename, supabase_url, file_size, created_at
      `
      const result = await pool.query(insertQuery, [
        workspaceId,
        file.originalname,
        supabaseUrl,
        file.size
      ])

      const uploadRecord = result.rows[0]

      res.status(201).json({
        success: true,
        id: uploadRecord.id,
        filename: uploadRecord.filename,
        supabase_url: uploadRecord.supabase_url,
        file_size: uploadRecord.file_size,
        created_at: uploadRecord.created_at
      })
    } catch (error) {
      console.error("[file-upload] Error:", error)
      next(error)
    }
  }
)

export { router as fileUploadRouter }
