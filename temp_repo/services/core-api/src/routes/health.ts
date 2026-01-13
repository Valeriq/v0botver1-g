import { Router } from "express"
import { pool } from "../db/pool"
import { createClient } from "redis"

export const healthRouter = Router()

healthRouter.get("/", async (req, res) => {
  try {
    // Check DB
    const dbResult = await pool.query("SELECT NOW()")
    const dbOk = dbResult.rows.length > 0

    // Check Redis
    const redisClient = createClient({ url: process.env.REDIS_URL })
    await redisClient.connect()
    const redisOk = (await redisClient.ping()) === "PONG"
    await redisClient.quit()

    const allHealthy = dbOk && redisOk

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? "ok" : "degraded",
      service: "core-api",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      dependencies: {
        postgres: dbOk,
        redis: redisOk,
      },
    })
  } catch (error) {
    res.status(503).json({
      status: "down",
      service: "core-api",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
})
