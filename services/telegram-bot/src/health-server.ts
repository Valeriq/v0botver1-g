import express from "express"
import { createClient } from "redis"

export async function startHealthServer(port: number = 8080) {
  const app = express()
  
  // Basic health check - возвращает статус без проверки зависимостей
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      service: "telegram-bot",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  })

  // Liveness probe - проверка что процесс жив
  app.get("/health/live", (req, res) => {
    try {
      const uptime = process.uptime()
      
      if (uptime > 0) {
        res.json({
          status: "alive",
          service: "telegram-bot",
          version: "1.0.0",
          timestamp: new Date().toISOString(),
          uptime: uptime,
        })
      } else {
        res.status(503).json({
          status: "not_alive",
          service: "telegram-bot",
          version: "1.0.0",
          timestamp: new Date().toISOString(),
        })
      }
    } catch (error) {
      res.status(503).json({
        status: "not_alive",
        service: "telegram-bot",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  })

  // Readiness probe - проверка что сервис готов принимать запросы
  app.get("/health/ready", async (req, res) => {
    const checks = {
      redis: false,
    }

    const errors: Record<string, string> = {}

    try {
      // Check Redis
      const redisClient = createClient({ url: process.env.REDIS_URL })
      await redisClient.connect()
      checks.redis = (await redisClient.ping()) === "PONG"
      await redisClient.quit()
    } catch (error) {
      errors.redis = error instanceof Error ? error.message : "Unknown error"
    }

    const allReady = Object.values(checks).every((check) => check)

    if (allReady) {
      res.json({
        status: "ready",
        service: "telegram-bot",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        dependencies: checks,
      })
    } else {
      res.status(503).json({
        status: "not_ready",
        service: "telegram-bot",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        dependencies: checks,
        errors: errors,
      })
    }
  })

  // Detailed health check - с полной информацией о зависимостях
  app.get("/health/detailed", async (req, res) => {
    const checks: Record<string, any> = {}
    const errors: Record<string, string> = {}

    try {
      const startTime = Date.now()
      const redisClient = createClient({ url: process.env.REDIS_URL })
      await redisClient.connect()
      const pingStart = Date.now()
      await redisClient.ping()
      const redisResponseTime = Date.now() - pingStart
      await redisClient.quit()
      checks.redis = {
        status: "ok",
        response_time_ms: redisResponseTime,
      }
    } catch (error) {
      errors.redis = error instanceof Error ? error.message : "Unknown error"
      checks.redis = {
        status: "error",
        error: errors.redis,
      }
    }

    const allHealthy = Object.values(checks).every(
      (check) => check.status === "ok"
    )

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? "ok" : "degraded",
      service: "telegram-bot",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "unknown",
      dependencies: checks,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    })
  })

  app.listen(port, () => {
    console.log(`[telegram-bot] Health check server running on port ${port}`)
  })
}
