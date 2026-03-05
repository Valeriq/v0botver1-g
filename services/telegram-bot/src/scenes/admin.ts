import { Scenes, Markup } from "telegraf"
import axios from "axios"

const CORE_API = process.env.CORE_API_URL || "http://core-api:3000"
const ADMIN_TELEGRAM_IDS = process.env.ADMIN_TELEGRAM_IDS?.split(",") || []

// Helper to check if user is admin
function isAdmin(telegramId: string): boolean {
  return ADMIN_TELEGRAM_IDS.includes(telegramId)
}

export const adminScene = new Scenes.BaseScene<Scenes.SceneContext>("admin") as any

adminScene.enter(async (ctx) => {
  const telegramId = ctx.from?.id.toString()

  if (!telegramId || !isAdmin(telegramId)) {
    await ctx.reply("У вас нет доступа к админ-панели.")
    return ctx.scene.leave()
  }

  await ctx.reply(
    "Админ-панель",
    Markup.inlineKeyboard([
      [Markup.button.callback("Клиенты", "admin_workspaces")],
      [Markup.button.callback("Gmail аккаунты", "admin_gmail")],
      [Markup.button.callback("Статистика", "admin_stats")],
      [Markup.button.callback("Назад", "menu")],
    ]),
  )
})

// View all workspaces
adminScene.action("admin_workspaces", async (ctx) => {
  try {
    await ctx.answerCbQuery()

    const response = await axios.get(`${CORE_API}/api/admin/workspaces`)
    const workspaces = response.data.workspaces

    if (workspaces.length === 0) {
      await ctx.reply("Нет зарегистрированных клиентов.")
      return
    }

    let message = "📊 *Клиенты:*\n\n"
    const buttons: any[] = []

    workspaces.forEach((ws: any) => {
      const status = ws.is_active ? "✅" : "❌"
      message += `${status} ID: ${ws.id}\n`
      message += `Telegram: ${ws.telegram_user_id}\n`
      message += `Контакты: ${ws.contacts_count}, Кампании: ${ws.campaigns_count}\n`
      message += `Лиды: ${ws.leads_count}, Потрачено: ${Math.abs(ws.total_spent)} токенов\n`
      message += `Создан: ${new Date(ws.created_at).toLocaleDateString()}\n\n`

      buttons.push([Markup.button.callback(`${status} ${ws.id.slice(0, 8)}...`, `toggle_ws_${ws.id}`)])
    })

    buttons.push([Markup.button.callback("Назад", "admin")])

    await ctx.editMessageText(message, { parse_mode: "Markdown", ...Markup.inlineKeyboard(buttons) })
  } catch (error) {
    console.error("[admin] Error fetching workspaces:", error)
    await ctx.reply("Ошибка при загрузке списка клиентов.")
  }
})

// Toggle workspace status
adminScene.action(/toggle_ws_(.+)/, async (ctx) => {
  try {
    await ctx.answerCbQuery()

    const workspaceId = ctx.match[1]
    const response = await axios.patch(`${CORE_API}/api/admin/workspaces/${workspaceId}/toggle`)

    await ctx.answerCbQuery(response.data.is_active ? "Активирован" : "Деактивирован")

    // Refresh the list
    ctx.scene.reenter()
  } catch (error) {
    console.error("[admin] Error toggling workspace:", error)
    await ctx.answerCbQuery("Ошибка при изменении статуса")
  }
})

// View Gmail accounts
adminScene.action("admin_gmail", async (ctx) => {
  try {
    await ctx.answerCbQuery()

    const response = await axios.get(`${CORE_API}/api/admin/gmail-accounts`)
    const accounts = response.data.accounts

    if (accounts.length === 0) {
      await ctx.reply("Нет Gmail аккаунтов в пуле.")
      return
    }

    let message = "📧 *Gmail аккаунты:*\n\n"
    const buttons: any[] = []

    accounts.forEach((acc: any) => {
      const statusIcon = {
        ok: "✅",
        limit: "⚠️",
        blocked: "🚫",
        disabled: "❌",
      }[acc.status]

      message += `${statusIcon} ${acc.email}\n`
      message += `Статус: ${acc.status}, Лимит: ${acc.daily_limit}/день\n`
      message += `Отправлено сегодня: ${acc.sent_today}\n`
      message += `Назначено: ${acc.assigned_workspaces} workspace\n`
      if (acc.last_error) {
        message += `Ошибка: ${acc.last_error.substring(0, 50)}...\n`
      }
      message += "\n"

      buttons.push([Markup.button.callback(`${statusIcon} ${acc.email}`, `gmail_${acc.id}`)])
    })

    buttons.push([Markup.button.callback("Назад", "admin")])

    await ctx.editMessageText(message, { parse_mode: "Markdown", ...Markup.inlineKeyboard(buttons) })
  } catch (error) {
    console.error("[admin] Error fetching Gmail accounts:", error)
    await ctx.reply("Ошибка при загрузке списка Gmail аккаунтов.")
  }
})

// Gmail account details
adminScene.action(/gmail_(.+)/, async (ctx) => {
  const accountId = ctx.match[1]
  await ctx.answerCbQuery()

  const message = `Управление аккаунтом ${accountId.slice(0, 8)}...`

  await ctx.editMessageText(
    message,
    Markup.inlineKeyboard([
      [Markup.button.callback("🚫 Заблокировать", `set_status_${accountId}_blocked`)],
      [Markup.button.callback("✅ Активировать", `set_status_${accountId}_ok`)],
      [Markup.button.callback("❌ Отключить", `set_status_${accountId}_disabled`)],
      [Markup.button.callback("Назад", "admin_gmail")],
    ]),
  )
})

// Update account status
adminScene.action(/set_status_(.+)_(.+)/, async (ctx) => {
  try {
    const accountId = ctx.match[1]
    const status = ctx.match[2]

    await axios.patch(`${CORE_API}/api/admin/gmail-accounts/${accountId}/status`, { status })

    await ctx.answerCbQuery(`Статус изменен на ${status}`)
    ctx.scene.reenter()
  } catch (error) {
    console.error("[admin] Error updating account status:", error)
    await ctx.answerCbQuery("Ошибка при изменении статуса")
  }
})

// System stats
adminScene.action("admin_stats", async (ctx) => {
  try {
    await ctx.answerCbQuery()

    const response = await axios.get(`${CORE_API}/api/admin/stats`)
    const stats = response.data.stats

    const message = `📊 *Статистика системы:*

✅ Активных клиентов: ${stats.active_workspaces}
📧 Здоровых Gmail: ${stats.healthy_accounts}
🚀 Активных кампаний: ${stats.active_campaigns}

📨 Отправлено за 24ч: ${stats.emails_sent_24h}
🎯 Лидов за 24ч: ${stats.leads_24h}
`

    await ctx.editMessageText(
      message,
      Markup.inlineKeyboard([
        [Markup.button.callback("Обновить", "admin_stats")],
        [Markup.button.callback("Назад", "admin")],
      ]),
    )
  } catch (error) {
    console.error("[admin] Error fetching stats:", error)
    await ctx.reply("Ошибка при загрузке статистики.")
  }
})

// Back to admin menu
adminScene.action("admin", async (ctx) => {
  await ctx.answerCbQuery()
  ctx.scene.reenter()
})
