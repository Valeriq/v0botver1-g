import { Scenes } from "telegraf"
import axios from "axios"

const CORE_API_URL = process.env.CORE_API_URL || "http://localhost:3000"

export const metricsScene = new Scenes.BaseScene<Scenes.SceneContext>("metrics")

metricsScene.enter(async (ctx) => {
  try {
    const { data: metrics } = await axios.get(`${CORE_API_URL}/api/metrics`)

    const text = `
📊 *Метрики системы*

*Кампании:*
▫️ Активные: ${metrics.campaigns.active_campaigns}
▫️ На паузе: ${metrics.campaigns.paused_campaigns}
▫️ Завершенные: ${metrics.campaigns.completed_campaigns}
▫️ Всего: ${metrics.campaigns.total_campaigns}

*Письма:*
▫️ За 24ч: ${metrics.emails.sent_24h}
▫️ За 7д: ${metrics.emails.sent_7d}
▫️ За 30д: ${metrics.emails.sent_30d}
▫️ Всего: ${metrics.emails.total_sent}

*Ответы:*
▫️ За 24ч: ${metrics.replies.replies_24h}
▫️ За 7д: ${metrics.replies.replies_7d}
▫️ За 30д: ${metrics.replies.replies_30d}
▫️ Всего: ${metrics.replies.total_replies}

*Лиды:*
▫️ Новые: ${metrics.leads.new_leads}
▫️ Взяты: ${metrics.leads.taken_leads}
▫️ Получили ответ: ${metrics.leads.replied_leads}
▫️ Закрыты: ${metrics.leads.closed_leads}
▫️ Всего: ${metrics.leads.total_leads}

*Ошибки:*
▫️ За 24ч: ${metrics.errors.errors_24h}
▫️ За 7д: ${metrics.errors.errors_7d}
▫️ Всего: ${metrics.errors.total_errors}

*Воркспейсы:*
▫️ Активные: ${metrics.workspaces.active_workspaces}
▫️ Всего: ${metrics.workspaces.total_workspaces}

*Gmail Pool:*
▫️ OK: ${metrics.gmail_pool.ok_accounts}
▫️ Лимит: ${metrics.gmail_pool.limited_accounts}
▫️ Заблок: ${metrics.gmail_pool.blocked_accounts}
▫️ Всего: ${metrics.gmail_pool.total_accounts}

*Очереди:*
${metrics.queues.map((q: any) => `▫️ ${q.queue_name}: ${q.pending} pending, ${q.processing} processing, ${q.failed} failed`).join("\n")}
    `.trim()

    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔄 Обновить", callback_data: "metrics_refresh" }],
          [{ text: "« Назад", callback_data: "main_menu" }],
        ],
      },
    })
  } catch (error: any) {
    console.error("[metrics] Error fetching metrics:", error)
    await ctx.reply("Ошибка при загрузке метрик")
  }
})

metricsScene.action("metrics_refresh", async (ctx) => {
  await ctx.answerCbQuery("Обновление...")
  await ctx.scene.reenter()
})

metricsScene.action("main_menu", async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter("menu")
})
