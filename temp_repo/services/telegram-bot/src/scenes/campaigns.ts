import { Scenes, Markup, type Context } from "telegraf"
import axios from "axios"

const coreApiUrl = process.env.CORE_API_URL || "http://localhost:3000"

interface CampaignsContext extends Context {
  scene: Scenes.SceneContextScene<CampaignsContext>
}

export const campaignsScene = new Scenes.BaseScene<CampaignsContext>("campaigns")

campaignsScene.enter(async (ctx) => {
  const workspaceId = ctx.from?.id.toString()

  try {
    const response = await axios.get(`${coreApiUrl}/api/campaigns`, {
      params: { workspace_id: workspaceId },
    })

    const campaigns = response.data.campaigns || []
    const active = campaigns.filter((c: any) => c.status === "active").length

    const text = `📧 Кампании\n\n📊 Всего: ${campaigns.length}\n🟢 Активных: ${active}\n\nВыберите действие:`

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("➕ Создать кампанию", "create_campaign")],
      [Markup.button.callback("📋 Мои кампании", "list_campaigns")],
      [Markup.button.callback("🔙 Главное меню", "menu")],
    ])

    await ctx.reply(text, keyboard)
  } catch (error) {
    console.error("[campaigns scene] Error:", error)
    await ctx.reply("❌ Ошибка загрузки данных")
  }
})

campaignsScene.action("create_campaign", async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.reply(
    "🚧 Создание кампании\n\n" +
      "В MVP версии создание кампаний упрощено.\n\n" +
      "Для создания полноценной кампании:\n" +
      "1. Загрузите контакты\n" +
      "2. Создайте Prompt профиль\n" +
      "3. Используйте API для создания кампании\n\n" +
      "Документация: /docs",
  )
})

campaignsScene.action("list_campaigns", async (ctx) => {
  await ctx.answerCbQuery()
  const workspaceId = ctx.from?.id.toString()

  try {
    const response = await axios.get(`${coreApiUrl}/api/campaigns`, {
      params: { workspace_id: workspaceId },
    })

    const campaigns = response.data.campaigns || []

    if (campaigns.length === 0) {
      await ctx.reply("📭 Нет созданных кампаний\n\nСоздайте новую кампанию для начала работы")
      return
    }

    let text = `📋 Ваши кампании:\n\n`

    campaigns.forEach((c: any, i: number) => {
      const statusEmoji = c.status === "active" ? "🟢" : c.status === "paused" ? "⏸" : "⚪️"
      text += `${i + 1}. ${statusEmoji} ${c.name}\n`
      text += `   Получателей: ${c.recipients_count || 0}\n`
      text += `   Статус: ${c.status}\n\n`
    })

    await ctx.reply(text)
  } catch (error) {
    console.error("[campaigns] List error:", error)
    await ctx.reply("❌ Ошибка загрузки кампаний")
  }
})
