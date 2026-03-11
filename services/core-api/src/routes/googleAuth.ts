import { Router } from "express"
import { google } from "googleapis"
import { pool } from "../db"
import { v4 as uuidv4 } from "uuid"

export const googleAuthRouter = Router()

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback"
)

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

// Начало OAuth потока
googleAuthRouter.get("/google", (req, res) => {
  const workspaceId = req.query.workspace_id as string

  if (!workspaceId) {
    return res.status(400).json({ error: "workspace_id is required" })
  }

  // Генерируем URL для авторизации
  const state = Buffer.from(JSON.stringify({ workspace_id: workspaceId })).toString("base64")
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: state,
    prompt: "consent", // Чтобы получить refresh_token
  })

  res.redirect(authUrl)
})

// OAuth callback
googleAuthRouter.get("/google/callback", async (req, res, next) => {
  try {
    const { code, state } = req.query

    if (!code) {
      return res.status(400).json({ error: "Authorization code not provided" })
    }

    // Декодируем state
    let workspaceId: string
    try {
      const stateData = JSON.parse(Buffer.from(state as string, "base64").toString())
      workspaceId = stateData.workspace_id
    } catch {
      return res.status(400).json({ error: "Invalid state parameter" })
    }

    // Обмениваем code на tokens
    const { tokens } = await oauth2Client.getToken(code as string)
    
    if (!tokens.access_token) {
      return res.status(400).json({ error: "Failed to get access token" })
    }

    // Сохраняем tokens в БД
    await pool.query(
      `INSERT INTO google_oauth_tokens (id, workspace_id, access_token, refresh_token, token_type, expiry_date, scope)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (workspace_id) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, google_oauth_tokens.refresh_token),
         token_type = EXCLUDED.token_type,
         expiry_date = EXCLUDED.expiry_date,
         scope = EXCLUDED.scope,
         updated_at = NOW()`,
      [
        uuidv4(),
        workspaceId,
        tokens.access_token,
        tokens.refresh_token || null,
        tokens.token_type || "Bearer",
        tokens.expiry_date || null,
        tokens.scope || SCOPES.join(" "),
      ]
    )

    // Редирект на фронтенд с сообщением об успехе
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/contacts?google_connected=true`)
  } catch (error) {
    console.error("Google OAuth callback error:", error)
    next(error)
  }
})

// Проверка статуса подключения
googleAuthRouter.get("/google/status", async (req, res, next) => {
  try {
    const { workspace_id } = req.query

    if (!workspace_id) {
      return res.status(400).json({ error: "workspace_id is required" })
    }

    const result = await pool.query(
      "SELECT id, created_at, updated_at FROM google_oauth_tokens WHERE workspace_id = $1",
      [workspace_id]
    )

    res.json({
      connected: result.rows.length > 0,
      connectedAt: result.rows[0]?.created_at || null,
    })
  } catch (error) {
    next(error)
  }
})

// Отключение Google аккаунта
googleAuthRouter.delete("/google", async (req, res, next) => {
  try {
    const { workspace_id } = req.query

    if (!workspace_id) {
      return res.status(400).json({ error: "workspace_id is required" })
    }

    await pool.query("DELETE FROM google_oauth_tokens WHERE workspace_id = $1", [workspace_id])

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Экспорт функции для получения авторизованного клиента
export async function getGoogleSheetsClient(workspaceId: string) {
  const result = await pool.query(
    "SELECT * FROM google_oauth_tokens WHERE workspace_id = $1",
    [workspaceId]
  )

  if (result.rows.length === 0) {
    throw new Error("Google account not connected")
  }

  const tokenData = result.rows[0]

  // Устанавливаем credentials
  oauth2Client.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expiry_date: tokenData.expiry_date,
  })

  // Проверяем и обновляем токен если истёк
  if (tokenData.expiry_date && Date.now() >= tokenData.expiry_date) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken()
      
      // Обновляем в БД
      await pool.query(
        `UPDATE google_oauth_tokens 
         SET access_token = $1, expiry_date = $2, updated_at = NOW()
         WHERE workspace_id = $3`,
        [credentials.access_token, credentials.expiry_date, workspaceId]
      )
    } catch (error) {
      console.error("Failed to refresh Google token:", error)
      throw new Error("Failed to refresh Google token. Please reconnect your Google account.")
    }
  }

  return google.sheets({ version: "v4", auth: oauth2Client })
}
