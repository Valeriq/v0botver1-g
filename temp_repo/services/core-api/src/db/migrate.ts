import { readFileSync } from "fs"
import { join } from "path"
import { pool } from "./pool"

async function runMigrations() {
  console.log("[Migrations] Starting...")

  try {
    const migrationPath = join(__dirname, "migrations", "001_initial_schema.sql")
    const sql = readFileSync(migrationPath, "utf-8")

    await pool.query(sql)

    console.log("[Migrations] ✓ 001_initial_schema.sql completed")
    console.log("[Migrations] All migrations completed successfully")

    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error("[Migrations] Error:", error)
    await pool.end()
    process.exit(1)
  }
}

runMigrations()
