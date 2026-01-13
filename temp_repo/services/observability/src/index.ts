import express from "express"
import dotenv from "dotenv"
import { createClient } from "redis"
import { Pool } from "pg"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3003

const redisClient = createClient({ url: process.env.REDIS_URL })
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

app.use(express.json())

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "observability" })
})

// Prometheus-style metrics endpoint
app.get("/metrics", async (req, res) => {
  try {
    // Get metrics from database
    const [campaignStats, emailStats, jobStats, queueSizes] = await Promise.all([
      pool.query("SELECT status, COUNT(*) as count FROM campaigns GROUP BY status"),
      pool.query(`
        SELECT 
          COUNT(*) as total_sent,
          COUNT(*) FILTER (WHERE sent_at > NOW() - INTERVAL '1 hour') as sent_last_hour
        FROM email_messages WHERE sent_at IS NOT NULL
      `),
      pool.query(`
        SELECT 
          status, 
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_duration_seconds
        FROM queue_jobs 
        WHERE created_at > NOW() - INTERVAL '24 hours'
        GROUP BY status
      `),
      Promise.all([
        redisClient.lLen("queue:generate"),
        redisClient.lLen("queue:send"),
        redisClient.lLen("queue:followup"),
        redisClient.lLen("queue:classify"),
        redisClient.lLen("queue:notify"),
      ]),
    ])

    // Format as Prometheus metrics
    let output = ""

    // Campaign metrics
    output += "# HELP campaigns_total Total number of campaigns by status\n"
    output += "# TYPE campaigns_total gauge\n"
    campaignStats.rows.forEach((row) => {
      output += `campaigns_total{status="${row.status}"} ${row.count}\n`
    })

    // Email metrics
    output += "# HELP emails_sent_total Total emails sent\n"
    output += "# TYPE emails_sent_total counter\n"
    output += `emails_sent_total ${emailStats.rows[0].total_sent}\n`

    output += "# HELP emails_sent_last_hour Emails sent in the last hour\n"
    output += "# TYPE emails_sent_last_hour gauge\n"
    output += `emails_sent_last_hour ${emailStats.rows[0].sent_last_hour}\n`

    // Job metrics
    output += "# HELP queue_jobs_total Total queue jobs by status (24h)\n"
    output += "# TYPE queue_jobs_total gauge\n"
    jobStats.rows.forEach((row) => {
      output += `queue_jobs_total{status="${row.status}"} ${row.count}\n`
    })

    output += "# HELP queue_job_duration_seconds Average job processing duration\n"
    output += "# TYPE queue_job_duration_seconds gauge\n"
    jobStats.rows.forEach((row) => {
      if (row.avg_duration_seconds) {
        output += `queue_job_duration_seconds{status="${row.status}"} ${row.avg_duration_seconds}\n`
      }
    })

    // Queue sizes
    const queues = ["generate", "send", "followup", "classify", "notify"]
    output += "# HELP queue_size Current queue size\n"
    output += "# TYPE queue_size gauge\n"
    queueSizes.forEach((size, i) => {
      output += `queue_size{queue="${queues[i]}"} ${size}\n`
    })

    res.set("Content-Type", "text/plain")
    res.send(output)
  } catch (error) {
    console.error("[observability] Error generating metrics:", error)
    res.status(500).send("Error generating metrics")
  }
})

// Start server
async function start() {
  try {
    await redisClient.connect()
    await pool.query("SELECT NOW()")

    app.listen(PORT, () => {
      console.log(`[observability] Metrics exporter running on port ${PORT}`)
    })
  } catch (error) {
    console.error("[observability] Failed to start:", error)
    process.exit(1)
  }
}

process.on("SIGTERM", async () => {
  console.log("[observability] Shutting down...")
  await redisClient.quit()
  await pool.end()
  process.exit(0)
})

start()
