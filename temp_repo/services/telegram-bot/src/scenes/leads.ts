import { Scenes, Markup, type Context } from "telegraf"
import axios from "axios"

const coreApiUrl = process.env.CORE_API_URL || "http://localhost:3000"

interface LeadsSceneSession extends Scenes.SceneSession {
  awaitingReply?: boolean
  currentLeadId?: string
}

interface LeadsContext extends Context {
  scene: Scenes.SceneContextScene<LeadsContext, LeadsSceneSession>
  session: LeadsSceneSession
}

export const leadsScene = new Scenes.BaseScene<LeadsContext>("leads")

leadsScene.enter(async (ctx) => {
  const workspaceId = ctx.from?.id.toString()

  try {
    const response = await axios.get(`${coreApiUrl}/api/leads`, {
      params: { workspace_id: workspaceId, limit: 50 },
    })

    const leads = response.data.leads || []
    const newLeads = leads.filter((l: any) => l.status === "new").length

    const text = `💬 Лиды\n\n📊 Всего: ${leads.length}\n🆕 Новых: ${newLeads}\n\nВыберите действие:`

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("🆕 Новые лиды", "new_leads")],
      [Markup.button.callback("📋 Все лиды", "all_leads")],
      [Markup.button.callback("🔙 Главное меню", "menu")],
    ])

    await ctx.reply(text, keyboard)
  } catch (error) {
    console.error("[leads scene] Error:", error)
    await ctx.reply("❌ Ошибка загрузки данных")
  }
})

leadsScene.action("new_leads", async (ctx) => {
  await ctx.answerCbQuery()
  const workspaceId = ctx.from?.id.toString()

  try {
    const response = await axios.get(`${coreApiUrl}/api/leads`, {
      params: { workspace_id: workspaceId, status: "new", limit: 10 },
    })

    const leads = response.data.leads || []

    if (leads.length === 0) {
      await ctx.reply("📭 Нет новых лидов")
      return
    }

    for (const lead of leads) {
      const text =
        `💬 Новый лид!\n\n` +
        `📧 ${lead.email}\n` +
        `${lead.first_name || lead.last_name ? `👤 ${lead.first_name || ""} ${lead.last_name || ""}\n` : ""}` +
        `${lead.company ? `🏢 ${lead.company}\n` : ""}` +
        `📅 ${new Date(lead.created_at).toLocaleString()}\n\n` +
        `Классификация: ${lead.classification || "не определена"}`

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback("✅ Взять в работу", `take_lead_${lead.id}`)],
        [Markup.button.callback("📖 Показать переписку", `view_thread_${lead.id}`)],
      ])

      await ctx.reply(text, keyboard)
    }
  } catch (error) {
    console.error("[leads] New leads error:", error)
    await ctx.reply("❌ Ошибка загрузки новых лидов")
  }
})

leadsScene.action(/^take_lead_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery()
  const leadId = ctx.match[1]
  const workspaceId = ctx.from?.id.toString()
  const userId = ctx.from?.id.toString()

  try {
    await axios.post(`${coreApiUrl}/api/leads/${leadId}/take`, {
      workspace_id: workspaceId,
      user_id: userId,
    })

    await ctx.reply(
      "✅ Лид взят в работу!\n\n" +
        "Вы можете ответить в Live режиме.\n" +
        "Отправьте текст ответа следующим сообщением или используйте /cancel для отмены",
    )

    // Set up awaiting reply state
    ctx.scene.session.awaitingReply = true
    ctx.scene.session.currentLeadId = leadId
  } catch (error: any) {
    console.error("[leads] Take lead error:", error.response?.data || error.message)
    await ctx.reply("❌ Ошибка: лид уже взят или не найден")
  }
})

leadsScene.action(/^view_thread_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery()
  const leadId = ctx.match[1]
  const workspaceId = ctx.from?.id.toString()

  try {
    const response = await axios.get(`${coreApiUrl}/api/leads/${leadId}`, {
      params: { workspace_id: workspaceId },
    })

    const { lead, messages } = response.data

    let text = `📖 Переписка\n\n`
    text += `📧 ${lead.email}\n`
    text += `🏢 ${lead.company || "N/A"}\n\n`
    text += `--- Сообщения ---\n\n`

    if (messages.length === 0) {
      text += "Нет сообщений"
    } else {
      messages.forEach((msg: any, i: number) => {
        const direction = msg.direction === "outbound" ? "➡️" : "⬅️"
        const timestamp = msg.sent_at || msg.received_at
        text += `${direction} ${new Date(timestamp).toLocaleString()}\n`
        text += `Тема: ${msg.subject}\n`
        text += `${msg.body?.substring(0, 200)}...\n\n`
      })
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("💬 Ответить в Live", `reply_lead_${leadId}`)],
      [Markup.button.callback("🔙 Назад", "leads")],
    ])

    await ctx.reply(text, keyboard)
  } catch (error) {
    console.error("[leads] View thread error:", error)
    await ctx.reply("❌ Ошибка загрузки переписки")
  }
})

leadsScene.action(/^reply_lead_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery()
  const leadId = ctx.match[1]

  await ctx.reply(
    "💬 Live Reply режим\n\n" +
      "Отправьте текст вашего ответа следующим сообщением.\n" +
      "Сообщение будет отправлено в тот же email-тред.\n\n" +
      "Используйте /cancel для отмены",
  )

  ctx.scene.session.awaitingReply = true
  ctx.scene.session.currentLeadId = leadId
})

// Handle live reply text
leadsScene.on("text", async (ctx) => {
  if (ctx.scene.session.awaitingReply && ctx.scene.session.currentLeadId) {
    const replyText = ctx.message.text
    const leadId = ctx.scene.session.currentLeadId
    const workspaceId = ctx.from?.id.toString()
    const userId = ctx.from?.id.toString()

    if (replyText === "/cancel") {
      await ctx.reply("❌ Отменено")
      ctx.scene.session.awaitingReply = false
      ctx.scene.session.currentLeadId = undefined
      return
    }

    await ctx.reply("⏳ Отправляю ответ...")

    try {
      await axios.post(`${coreApiUrl}/api/leads/${leadId}/reply`, {
        workspace_id: workspaceId,
        user_id: userId,
        body: replyText,
      })

      await ctx.reply("✅ Ответ отправлен успешно!\n\nИспользуйте /menu для возврата в главное меню")

      ctx.scene.session.awaitingReply = false
      ctx.scene.session.currentLeadId = undefined
      await ctx.scene.leave()
    } catch (error: any) {
      console.error("[leads] Reply error:", error.response?.data || error.message)
      await ctx.reply("❌ Ошибка отправки ответа. Попробуйте позже.")
      ctx.scene.session.awaitingReply = false
      ctx.scene.session.currentLeadId = undefined
    }
  }
})

leadsScene.action("all_leads", async (ctx) => {
  await ctx.answerCbQuery()
  const workspaceId = ctx.from?.id.toString()

  try {
    const response = await axios.get(`${coreApiUrl}/api/leads`, {
      params: { workspace_id: workspaceId, limit: 20 },
    })

    const leads = response.data.leads || []

    if (leads.length === 0) {
      await ctx.reply("📭 Нет лидов")
      return
    }

    let text = `📋 Все лиды:\n\n`

    leads.forEach((l: any, i: number) => {
      const statusEmoji = l.status === "new" ? "🆕" : l.status === "taken" ? "✅" : l.status === "replied" ? "💬" : "⏸"
      text += `${i + 1}. ${statusEmoji} ${l.email}\n`
      text += `   ${l.company || "N/A"} | ${l.classification || "не классифицирован"}\n\n`
    })

    await ctx.reply(text)
  } catch (error) {
    console.error("[leads] All leads error:", error)
    await ctx.reply("❌ Ошибка загрузки лидов")
  }
})

leadsScene.command("cancel", async (ctx) => {
  ctx.scene.session.awaitingReply = false
  ctx.scene.session.currentLeadId = undefined
  await ctx.reply("❌ Отменено")
  await ctx.scene.leave()
})
