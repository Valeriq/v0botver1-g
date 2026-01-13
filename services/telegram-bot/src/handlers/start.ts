import type { Context } from "telegraf"
import axios from "axios"

const coreApiUrl = process.env.CORE_API_URL || "http://localhost:3000"

export async function startHandler(ctx: Context) {
  try {
    const telegramUserId = ctx.from?.id.toString()
    const username = ctx.from?.username
    const firstName = ctx.from?.first_name
    const lastName = ctx.from?.last_name

    if (!telegramUserId) {
      await ctx.reply("❌ Ошибка: не удалось получить ваш ID")
      return
    }

    // Create workspace via API
    const response = await axios.post(`${coreApiUrl}/api/workspaces`, {
      telegram_user_id: telegramUserId,
      name: username || firstName || "My Workspace",
      telegram_username: username,
      telegram_first_name: firstName,
      telegram_last_name: lastName,
    })

    const { workspace, message: apiMessage } = response.data

    const greeting = `👋 Привет${firstName ? ", " + firstName : ""}!

🎉 ${apiMessage === "Workspace already exists" ? "С возвращением!" : "Добро пожаловать в AI Cold Email Bot!"}

📊 Workspace ID: ${workspace.id.substring(0, 8)}...
💰 Баланс токенов: ${workspace.token_balance}

Используйте /menu для доступа к функциям бота.

📌 Основные возможности:
• 📇 База контактов (CSV / Perplexity)
• 🤖 AI генерация писем
• 📧 Мультишаговые кампании
• 💬 Обработка ответов и лиды
• 🔴 Live-режим ответов`

    await ctx.reply(greeting)
  } catch (error: any) {
    console.error("[start handler] Error:", error.response?.data || error.message)
    await ctx.reply("❌ Ошибка при создании workspace. Попробуйте еще раз.")
  }
}
