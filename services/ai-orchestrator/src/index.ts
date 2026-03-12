import express from "express"
import dotenv from "dotenv"
import { healthRouter } from "./routes/health"
import { generateRouter } from "./routes/generate"
import { classifyRouter } from "./routes/classify"
import { pool } from "./db"
import { requestLogger } from "./middleware/requestLogger"
import { perplexityRouter } from "./routes/perplexity"
import { dockerMcpClient } from "./lib/docker-mcp"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3002

app.use(express.json())
app.use(requestLogger)

// Routes
app.use("/health", healthRouter)
app.use("/api/generate", generateRouter)
app.use("/api/classify", classifyRouter)
app.use("/api/perplexity", perplexityRouter)

// Initialize Docker MCP
dockerMcpClient.connect().catch((err) => {
  console.error("[ai-orchestrator] Failed to initialize Docker MCP:", err)
})

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[ai-orchestrator] SIGTERM received, shutting down...")
  await dockerMcpClient.disconnect()
  await pool.end()
  process.exit(0)
})

app.listen(PORT, () => {
  console.log(`[ai-orchestrator] Server running on port ${PORT}`)
})
