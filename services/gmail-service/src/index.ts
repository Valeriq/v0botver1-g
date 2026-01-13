import express from "express"
import dotenv from "dotenv"
import { healthRouter } from "./routes/health"
import { webhookRouter } from "./routes/webhook"
import { sendRouter } from "./routes/send"
import { accountsRouter } from "./routes/accounts"
import { watchRouter } from "./routes/watch"
import { pool } from "./db"
import { requestLogger } from "./middleware/requestLogger"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())
app.use(requestLogger)

// Routes
app.use("/health", healthRouter)
app.use("/api/send", sendRouter)
app.use("/api/accounts", accountsRouter)
app.use("/api/watch", watchRouter)
app.use("/webhook", webhookRouter)

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[gmail-service] SIGTERM received, shutting down...")
  await pool.end()
  process.exit(0)
})

app.listen(PORT, () => {
  console.log(`[gmail-service] Server running on port ${PORT}`)
})
