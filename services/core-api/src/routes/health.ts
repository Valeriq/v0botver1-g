import { Router } from "express"
import { pool } from "../db/pool"
import { createClient } from "redis"

export const healthRouter = Router()

// Basic health check - возвращает статус без проверки зависимостей
healthRouter.get("/", async (req, res) => {
  res.json({
    status: "ok",
    service: "core-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Liveness probe - проверка что процесс жив
healthRouter.get("/live", async (req, res) => {
  try {
    // Проверяем что процесс жив и отвечает
    const uptime = process.uptime()
    
    if (uptime > 0) {
      res.json({
        status: "alive",
        service: "core-api",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        uptime: uptime,
      })
    } else {
      res.status(503).json({
        status: "not_alive",
        service: "core-api",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    res.status(503).json({
      status: "not_alive",
      service: "core-api",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

// Readiness probe - проверка что сервис готов принимать запросы
healthRouter.get("/ready", async (req, res) => {
  const checks = {
    postgres: false,
    redis: false,
  }

  const errors: Record<string, string> = {}

  try {
    // Check DB
    const dbResult = await pool.query("SELECT NOW()")
    checks.postgres = dbResult.rows.length > 0
  } catch (error) {
    errors.postgres = error instanceof Error ? error.message : "Unknown error"
  }

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
      service: "core-api",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      dependencies: checks,
    })
  } else {
    res.status(503).json({
      status: "not_ready",
      service: "core-api",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      dependencies: checks,
      errors: errors,
    })
  }
})

// Detailed health check - с полной информацией о зависимостях
healthRouter.get("/detailed", async (req, res) => {
  const checks: Record<string, any> = {}
  const errors: Record<string, string> = {}

  try {
    const startTime = Date.now()
    const dbResult = await pool.query("SELECT NOW()")
    const dbResponseTime = Date.now() - startTime
    checks.postgres = {
      status: "ok",
      response_time_ms: dbResponseTime,
      timestamp: dbResult.rows[0]?.now || new Date().toISOString(),
    }
  } catch (error) {
    errors.postgres = error instanceof Error ? error.message : "Unknown error"
    checks.postgres = {
      status: "error",
      error: errors.postgres,
    }
  }

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
    service: "core-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "unknown",
    dependencies: checks,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  })
})
