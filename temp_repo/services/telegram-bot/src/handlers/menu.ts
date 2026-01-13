import { type Context, Markup } from "telegraf"

const ADMIN_TELEGRAM_IDS = process.env.ADMIN_TELEGRAM_IDS?.split(",") || []

function isAdmin(telegramId: string): boolean {
  return ADMIN_TELEGRAM_IDS.includes(telegramId)
}

export async function mainMenuHandler(ctx: Context) {
  const menuText = `📋 Главное меню

Выберите раздел:`

  const buttons = [
    [Markup.button.callback("📇 База контактов", "contacts")],
    [Markup.button.callback("🤖 AI настройки", "ai")],
    [Markup.button.callback("📧 Кампании", "campaigns")],
    [Markup.button.callback("💬 Лиды", "leads")],
    [Markup.button.callback("💰 Баланс", "balance")],
  ]

  if (ctx.from?.id && isAdmin(ctx.from.id.toString())) {
    buttons.push([Markup.button.callback("📊 Метрики", "metrics")])
    buttons.push([Markup.button.callback("⚙️ Админ-панель", "admin")])
  }

  const keyboard = Markup.inlineKeyboard(buttons)

  if (ctx.callbackQuery) {
    await ctx.editMessageText(menuText, keyboard)
    await ctx.answerCbQuery()
  } else {
    await ctx.reply(menuText, keyboard)
  }
}
