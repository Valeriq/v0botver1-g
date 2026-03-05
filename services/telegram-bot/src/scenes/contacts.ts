import { Scenes, Markup } from "telegraf"
import axios from "axios"

const coreApiUrl = process.env.CORE_API_URL || "http://localhost:3000"
const aiOrchestratorUrl = process.env.AI_ORCHESTRATOR_URL || "http://localhost:3002"

export const contactsScene = new Scenes.BaseScene<Scenes.SceneContext>("contacts")

// Entry point
contactsScene.enter(async (ctx) => {
  const workspaceId = ctx.from?.id.toString()

  try {
    // Get contact count
    const response = await axios.get(`${coreApiUrl}/api/contacts`, {
      params: { workspace_id: workspaceId, limit: 1 },
    })

    const total = response.data.total || 0

    const text = `📇 База контактов

📊 Всего контактов: ${total}

Выберите действие:`

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("📤 Загрузить CSV/TSV", "upload_csv")],
      [Markup.button.callback("🔍 Импорт через Perplexity", "perplexity_import")],
      [Markup.button.callback("📋 Просмотреть контакты", "view_contacts")],
      [Markup.button.callback("🔙 Главное меню", "menu")],
    ])

    await ctx.reply(text, keyboard)
  } catch (error) {
    console.error("[contacts scene] Error:", error)
    await ctx.reply("❌ Ошибка загрузки данных")
  }
})

// Upload CSV
contactsScene.action("upload_csv", async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.reply(
    "📤 Отправьте CSV или TSV файл с контактами\n\nФормат: email, first_name, last_name, company, website",
  )
  ;(ctx.scene.session as any).awaitingFile = true
})

// Handle file upload
contactsScene.on("document", async (ctx) => {
  if (!(ctx.scene.session as any).awaitingFile) return

  const workspaceId = ctx.from?.id.toString()
  const document = ctx.message.document

  try {
    await ctx.reply("⏳ Обрабатываю файл...")

    // Download file
    const fileLink = await ctx.telegram.getFileLink(document.file_id)
    const fileResponse = await axios.get(fileLink.href, { responseType: "text" })
    const fileContent = fileResponse.data

    // Determine delimiter
    const delimiter = document.file_name?.endsWith(".tsv") ? "\t" : ","

    // Upload to API
    const uploadResponse = await axios.post(`${coreApiUrl}/api/contacts/upload`, {
      workspace_id: workspaceId,
      file_content: fileContent,
      delimiter,
    })

    const { uploaded, skipped } = uploadResponse.data

    await ctx.reply(
      `✅ Загрузка завершена!\n\n` +
        `✓ Добавлено: ${uploaded}\n` +
        `⊘ Пропущено: ${skipped}\n\n` +
        `Используйте /menu для возврата`,
    )

    ;(ctx.scene.session as any).awaitingFile = false
    await ctx.scene.leave()
  } catch (error: any) {
    console.error("[contacts] Upload error:", error.response?.data || error.message)
    await ctx.reply("❌ Ошибка при загрузке файла")
  }
})

// Perplexity import
contactsScene.action("perplexity_import", async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.reply(
    "🔍 Perplexity Импорт\n\n" +
      "Введите запрос для поиска контактов, например:\n" +
      '"Найди 50 email адресов CEO в SaaS компаниях из Сан-Франциско"\n\n' +
      "Отправьте /cancel для отмены",
  )
  ;(ctx.scene.session as any).awaitingPerplexity = true
})

// Handle Perplexity query
contactsScene.on("text", async (ctx) => {
  if ((ctx.scene.session as any).awaitingPerplexity) {
    const query = ctx.message.text

    if (query === "/cancel") {
      await ctx.reply("❌ Отменено")
      ;(ctx.scene.session as any).awaitingPerplexity = false
      return ctx.scene.leave()
    }

    const workspaceId = ctx.from?.id.toString()

    await ctx.reply("⏳ Запускаю импорт через Perplexity...\n\nЭто может занять несколько минут")

    try {
      const response = await axios.post(`${aiOrchestratorUrl}/api/perplexity/search-contacts`, {
        workspace_id: workspaceId,
        query: query,
      })

      const { imported, total_found, message } = response.data

      await ctx.reply(
        `✅ Импорт завершен!\n\n` +
          `🔍 Найдено: ${total_found}\n` +
          `✓ Импортировано: ${imported}\n\n` +
          `${message}\n\n` +
          `Используйте /menu для возврата`,
      )
    } catch (error: any) {
      console.error("[contacts] Perplexity error:", error.response?.data || error.message)
      await ctx.reply(
        "❌ Ошибка при импорте через Perplexity\n\n" +
          "Убедитесь что API ключ настроен корректно\n\n" +
          "Используйте /menu",
      )
    }

    (ctx.scene.session as any).awaitingPerplexity = false
    return ctx.scene.leave()
  }
})

// View contacts
contactsScene.action("view_contacts", async (ctx) => {
  await ctx.answerCbQuery()
  const workspaceId = ctx.from?.id.toString()

  try {
    const response = await axios.get(`${coreApiUrl}/api/contacts`, {
      params: { workspace_id: workspaceId, limit: 10 },
    })

    const contacts = response.data.contacts
    const total = response.data.total

    if (contacts.length === 0) {
      await ctx.reply("📭 База контактов пуста\n\nЗагрузите CSV файл для добавления контактов")
      return
    }

    let text = `📇 Контакты (показано ${contacts.length} из ${total}):\n\n`

    contacts.forEach((c: any, i: number) => {
      text += `${i + 1}. ${c.email}\n`
      if (c.first_name || c.last_name) {
        text += `   ${c.first_name || ""} ${c.last_name || ""}\n`
      }
      if (c.company) {
        text += `   🏢 ${c.company}\n`
      }
      text += "\n"
    })

    await ctx.reply(text)
  } catch (error) {
    console.error("[contacts] View error:", error)
    await ctx.reply("❌ Ошибка загрузки контактов")
  }
})

contactsScene.command("cancel", (ctx) => ctx.scene.leave())
