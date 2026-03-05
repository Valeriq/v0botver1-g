import { Scenes, Markup } from "telegraf"
import axios from "axios"

const coreApiUrl = process.env.CORE_API_URL || "http://localhost:3000"

export const aiScene = new Scenes.BaseScene<Scenes.SceneContext>("ai")

aiScene.enter(async (ctx) => {
  const workspaceId = ctx.from?.id.toString()

  try {
    const response = await axios.get(`${coreApiUrl}/api/prompt-profiles`, {
      params: { workspace_id: workspaceId },
    })

    const profiles = response.data.profiles || []

    const text = `🤖 AI настройки\n\n📝 Prompt профили: ${profiles.length}\n\nВыберите действие:`

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("➕ Создать профиль", "create_profile")],
      [Markup.button.callback("📋 Мои профили", "list_profiles")],
      [Markup.button.callback("🔙 Главное меню", "menu")],
    ])

    await ctx.reply(text, keyboard)
  } catch (error) {
    console.error("[ai scene] Error:", error)
    await ctx.reply("❌ Ошибка загрузки данных")
  }
})

aiScene.action("create_profile", async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.reply(
    "➕ Создание нового Prompt профиля\n\n" +
      "Отправьте системный промпт для генерации писем.\n\n" +
      "Пример:\n" +
      '"Ты опытный email-маркетолог. Пиши персонализированные письма с учетом компании получателя. Стиль: дружелюбный, профессиональный."\n\n' +
      "Отправьте /cancel для отмены",
  )
  ;(ctx.scene.session as any).awaitingPrompt = true
})

aiScene.on("text", async (ctx) => {
  if ((ctx.scene.session as any).awaitingPrompt) {
    const prompt = ctx.message.text
    const workspaceId = ctx.from?.id.toString()

    if (prompt === "/cancel") {
      await ctx.reply("❌ Отменено")
      ;(ctx.scene.session as any).awaitingPrompt = false
      return ctx.scene.leave()
    }

    try {
      const response = await axios.post(`${coreApiUrl}/api/prompt-profiles`, {
        workspace_id: workspaceId,
        name: `Profile ${new Date().toISOString().split("T")[0]}`,
        system_prompt: prompt,
      })

      await ctx.reply(`✅ Профиль создан!\n\nID: ${response.data.profile.id.substring(0, 8)}...\n\nИспользуйте /menu`)

      ;(ctx.scene.session as any).awaitingPrompt = false
      return ctx.scene.leave()
    } catch (error) {
      console.error("[ai] Create profile error:", error)
      await ctx.reply("❌ Ошибка создания профиля")
    }
  }
})

aiScene.action("list_profiles", async (ctx) => {
  await ctx.answerCbQuery()
  const workspaceId = ctx.from?.id.toString()

  try {
    const response = await axios.get(`${coreApiUrl}/api/prompt-profiles`, {
      params: { workspace_id: workspaceId },
    })

    const profiles = response.data.profiles || []

    if (profiles.length === 0) {
      await ctx.reply("📭 Нет созданных профилей\n\nСоздайте новый профиль для использования")
      return
    }

    let text = `📋 Ваши Prompt профили:\n\n`

    profiles.forEach((p: any, i: number) => {
      text += `${i + 1}. ${p.name}\n`
      text += `   ID: ${p.id.substring(0, 8)}...\n`
      text += `   Создан: ${new Date(p.created_at).toLocaleDateString()}\n\n`
    })

    await ctx.reply(text)
  } catch (error) {
    console.error("[ai] List profiles error:", error)
    await ctx.reply("❌ Ошибка загрузки профилей")
  }
})

aiScene.command("cancel", (ctx) => ctx.scene.leave())
