import { Scenes, Markup, type Context } from "telegraf"
import axios from "axios"

const coreApiUrl = process.env.CORE_API_URL || "http://localhost:3000"

interface BalanceContext extends Context {
  scene: Scenes.SceneContextScene<BalanceContext>
}

export const balanceScene = new Scenes.BaseScene<BalanceContext>("balance") as any

balanceScene.enter(async (ctx) => {
  const workspaceId = ctx.from?.id.toString()

  try {
    const balanceResponse = await axios.get(`${coreApiUrl}/api/billing/balance`, {
      params: { workspace_id: workspaceId },
    })

    const balance = balanceResponse.data.balance || 0

    const ledgerResponse = await axios.get(`${coreApiUrl}/api/billing/ledger`, {
      params: { workspace_id: workspaceId, limit: 5 },
    })

    const entries = ledgerResponse.data.entries || []

    let text = `💰 Баланс\n\n`
    text += `💵 Текущий баланс: $${balance.toFixed(2)}\n\n`

    if (entries.length > 0) {
      text += `📜 Последние операции:\n\n`
      entries.forEach((e: any) => {
        const sign = e.amount >= 0 ? "+" : ""
        const emoji = e.type === "credit" ? "💚" : "💸"
        text += `${emoji} ${sign}$${e.amount.toFixed(2)} - ${e.description}\n`
        text += `   ${new Date(e.created_at).toLocaleDateString()}\n\n`
      })
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("💳 Пополнить", "topup")],
      [Markup.button.callback("📜 История", "history")],
      [Markup.button.callback("🔙 Главное меню", "menu")],
    ])

    await ctx.reply(text, keyboard)
  } catch (error) {
    console.error("[balance scene] Error:", error)
    await ctx.reply("❌ Ошибка загрузки баланса")
  }
})

balanceScene.action("topup", async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.reply(
    "💳 Пополнение баланса\n\n" +
      "🚧 В MVP версии пополнение осуществляется вручную администратором.\n\n" +
      "Свяжитесь с поддержкой для пополнения:\n" +
      "@support_bot",
  )
})

balanceScene.action("history", async (ctx) => {
  await ctx.answerCbQuery()
  const workspaceId = ctx.from?.id.toString()

  try {
    const response = await axios.get(`${coreApiUrl}/api/billing/ledger`, {
      params: { workspace_id: workspaceId, limit: 20 },
    })

    const entries = response.data.entries || []

    if (entries.length === 0) {
      await ctx.reply("📭 История операций пуста")
      return
    }

    let text = `📜 История операций:\n\n`

    entries.forEach((e: any, i: number) => {
      const sign = e.amount >= 0 ? "+" : ""
      text += `${i + 1}. ${sign}$${e.amount.toFixed(2)}\n`
      text += `   ${e.description}\n`
      text += `   ${new Date(e.created_at).toLocaleString()}\n\n`
    })

    await ctx.reply(text)
  } catch (error) {
    console.error("[balance] History error:", error)
    await ctx.reply("❌ Ошибка загрузки истории")
  }
})
