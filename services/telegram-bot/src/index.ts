import { Telegraf, Scenes, session } from "telegraf"
import dotenv from "dotenv"
import { startHandler } from "./handlers/start"
import { mainMenuHandler } from "./handlers/menu"
import { contactsScene } from "./scenes/contacts"
import { aiScene } from "./scenes/ai"
import { campaignsScene } from "./scenes/campaigns"
import { leadsScene } from "./scenes/leads"
import { balanceScene } from "./scenes/balance"
import { adminScene } from "./scenes/admin"
import { metricsScene } from "./scenes/metrics"
import { startHealthServer } from "./health-server"

dotenv.config()

const bot = new Telegraf<Scenes.SceneContext>(process.env.TELEGRAM_BOT_TOKEN!)

// Create stage with all scenes
const stage = new Scenes.Stage<Scenes.SceneContext>([
  contactsScene as any,
  aiScene as any,
  campaignsScene as any,
  leadsScene as any,
  balanceScene as any,
  adminScene as any,
  metricsScene as any,
])

// Middleware
bot.use(session())
bot.use(stage.middleware())

// Set bot commands
bot.telegram.setMyCommands([
  { command: "start", description: "Start and create workspace" },
  { command: "menu", description: "Main menu" },
  { command: "admin", description: "Admin panel (owners only)" },
  { command: "metrics", description: "View system metrics (admins only)" },
])

// Handlers
bot.start(startHandler)
bot.command("menu", mainMenuHandler)
bot.action("menu", mainMenuHandler)

bot.command("admin", (ctx) => ctx.scene.enter("admin"))
bot.action("admin", (ctx) => ctx.scene.enter("admin"))

bot.command("metrics", (ctx) => ctx.scene.enter("metrics"))
bot.action("metrics", (ctx) => ctx.scene.enter("metrics"))

// Action handlers for entering scenes
bot.action("contacts", (ctx) => ctx.scene.enter("contacts"))
bot.action("ai", (ctx) => ctx.scene.enter("ai"))
bot.action("campaigns", (ctx) => ctx.scene.enter("campaigns"))
bot.action("leads", (ctx) => ctx.scene.enter("leads"))
bot.action("balance", (ctx) => ctx.scene.enter("balance"))

// Error handling
bot.catch((err: any, ctx: any) => {
  console.error("[Telegram Bot] Error:", err)
  ctx.reply("Произошла ошибка. Попробуйте позже.")
})

// Health check
setInterval(async () => {
  try {
    const me = await bot.telegram.getMe()
    console.log(`[telegram-bot] Health check OK - @${me.username}`)
  } catch (error) {
    console.error("[telegram-bot] Health check FAILED:", error)
  }
}, 60000)

// Graceful shutdown
process.once("SIGINT", () => {
  console.log("[telegram-bot] SIGINT received, stopping bot...")
  bot.stop("SIGINT")
})

process.once("SIGTERM", () => {
  console.log("[telegram-bot] SIGTERM received, stopping bot...")
  bot.stop("SIGTERM")
})

// Launch
// Start health check server (if not in test mode)
if (process.env.NODE_ENV !== "test") {
  const healthPort = parseInt(process.env.HEALTH_PORT || "8080")
  startHealthServer(healthPort).catch((error) => {
    console.error("[telegram-bot] Failed to start health server:", error)
  })
}

bot
  .launch()
  .then(() => {
    console.log("[telegram-bot] Bot started successfully")
  })
  .catch((error) => {
    console.error("[telegram-bot] Failed to start:", error)
    process.exit(1)
  })
