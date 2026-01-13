import { Router } from "express"

export const healthRouter = Router()

healthRouter.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "ai-orchestrator",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  })
})
