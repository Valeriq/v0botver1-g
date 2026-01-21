import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Для демо режима используем mock, если база не доступна
if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL не установлена. Работаем в демо режиме без базы данных.");
}

// Создаем pool только если есть DATABASE_URL
export const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
export const db = pool ? drizzle(pool, { schema }) : null;
