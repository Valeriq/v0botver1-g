import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { healthRouter } from "./routes/health"
import { workspaceRouter } from "./routes/workspaces"
import { contactRouter } from "./routes/contacts"
import { suppressionRouter } from "./routes/suppression"
import { promptProfileRouter } from "./routes/prompt-profiles"
import { campaignRouter } from "./routes/campaigns"
import { leadRouter } from "./routes/leads"
import { billingRouter } from "./routes/billing"
import { errorHandler } from "./middleware/errorHandler"
import { pool } from "./db"
import { adminRouter } from "./routes/admin"
import { requestLogger } from "./middleware/requestLogger"
import { metricsRouter } from "./routes/metrics"
import { apiLimiter } from "./middleware/rateLimiter"
import { fileUploadRouter } from "./routes/file-upload"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors({
  origin: ["http://localhost:5000", "http://0.0.0.0:5000"],
  credentials: true
}))
app.use(express.json())
app.use(requestLogger)

app.use("/api/", apiLimiter)

// Routes
app.use("/health", healthRouter)
app.use("/api/workspaces", workspaceRouter)
app.use("/api/contacts", contactRouter)
app.use("/api/suppression", suppressionRouter)
app.use("/api/prompt-profiles", promptProfileRouter)
app.use("/api/campaigns", campaignRouter)
app.use("/api/leads", leadRouter)
app.use("/api/billing", billingRouter)
app.use("/api/admin", adminRouter)
app.use("/api/metrics", metricsRouter)
app.use("/api", fileUploadRouter)

// Error handling
app.use(errorHandler)

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing connections...")
  await pool.end()
  process.exit(0)
})

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`[core-api] Server running on port ${PORT}`)
  })
}

export default app
