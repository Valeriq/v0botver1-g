import type { Pool } from "pg"
import type { RedisClientType } from "redis"
import axios from "axios"

export async function processNotifyJob(job: any, pool: Pool, redis: RedisClientType) {
  const { workspace_id, lead_id, type } = job.data

  console.log(`[notify] Sending notification for ${type}, lead ${lead_id}`)

  // Get workspace owner's telegram info
  const workspaceResult = await pool.query(`SELECT telegram_user_id FROM workspaces WHERE id = $1`, [workspace_id])

  if (workspaceResult.rows.length === 0) {
    throw new Error("Workspace not found")
  }

  const telegramUserId = workspaceResult.rows[0].telegram_user_id

  // Get lead details
  const leadResult = await pool.query(
    `SELECT l.*, c.email, c.first_name, c.last_name, c.company, cam.name as campaign_name
     FROM leads l
     JOIN contacts c ON l.contact_id = c.id
     LEFT JOIN campaigns cam ON l.campaign_id = cam.id
     WHERE l.id = $1`,
    [lead_id],
  )

  if (leadResult.rows.length === 0) {
    throw new Error("Lead not found")
  }

  const lead = leadResult.rows[0]

  // Send Telegram notification
  const message =
    `🎉 Новый лид!\n\n` +
    `📧 ${lead.email}\n` +
    `${lead.first_name || lead.last_name ? `👤 ${lead.first_name || ""} ${lead.last_name || ""}\n` : ""}` +
    `${lead.company ? `🏢 ${lead.company}\n` : ""}` +
    `📊 Кампания: ${lead.campaign_name || "N/A"}\n` +
    `🏷 Классификация: ${lead.classification}\n\n` +
    `Используйте /menu → Лиды для просмотра`

  try {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: telegramUserId,
      text: message,
      parse_mode: "HTML",
    })

    console.log(`[notify] Notification sent to Telegram user ${telegramUserId}`)
  } catch (error: any) {
    console.error(`[notify] Failed to send Telegram notification:`, error.response?.data || error.message)
    throw error
  }
}
