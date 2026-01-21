import type { Express } from "express";
import type { Server } from "http";
import { jsonStorage as storage } from "./storage-json";
import { api } from "@shared/routes";
import { z } from "zod";
import { spawn } from "child_process";
import path from "path";
import multer from "multer";
import crypto from "crypto";

const telegramAuthSchema = z.object({
  id: z.number(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number(),
  hash: z.string(),
});

function validateTelegramAuth(data: z.infer<typeof telegramAuthSchema>): boolean {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  // In demo mode, accept dummy tokens
  if (botToken === 'dummy' || !botToken) {
    console.log("[telegram-auth] Demo mode: accepting any auth data");
    return true;
  }

  const { hash, ...authData } = data;
  const dataCheckString = Object.keys(authData)
    .sort()
    .map(key => `${key}=${authData[key as keyof typeof authData]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (hmac !== hash) {
    return false;
  }

  const authDate = data.auth_date;
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) {
    return false;
  }

  return true;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === Auth Routes ===

  app.post("/api/auth/telegram", async (req, res) => {
    try {
      const authData = telegramAuthSchema.parse(req.body);

      if (!validateTelegramAuth(authData)) {
        return res.status(401).json({ error: "Недействительные данные авторизации" });
      }

      const user = await storage.upsertUser({
        telegramUserId: authData.id,
        username: authData.username || null,
        firstName: authData.first_name || null,
        lastName: authData.last_name || null,
        photoUrl: authData.photo_url || null,
        authDate: new Date(authData.auth_date * 1000),
      });

      req.session = req.session || {};
      (req.session as any).userId = user.id;
      (req.session as any).telegramUserId = user.telegramUserId;

      res.json({
        success: true,
        user: {
          id: user.id,
          telegramUserId: user.telegramUserId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          photoUrl: user.photoUrl,
        },
      });
    } catch (err) {
      console.error("[telegram-auth] Error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Некорректные данные" });
      }
      res.status(500).json({ error: "Ошибка авторизации" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: "Пользователь не найден" });
    }

    res.json({
      id: user.id,
      telegramUserId: user.telegramUserId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session = null as any;
    res.json({ success: true });
  });

  // Demo auth endpoint - allows login without Telegram
  app.post("/api/auth/demo", async (req, res) => {
    try {
      console.log("[demo-auth] Demo authentication requested");

      // Create demo user
      const user = await storage.upsertUser({
        telegramUserId: 123456789,
        username: "demo_user",
        firstName: "Demo",
        lastName: "User",
        photoUrl: null,
        authDate: new Date(),
      });

      req.session = req.session || {};
      (req.session as any).userId = user.id;
      (req.session as any).telegramUserId = user.telegramUserId;

      res.json({
        success: true,
        user: {
          id: user.id,
          telegramUserId: user.telegramUserId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          photoUrl: user.photoUrl,
        },
      });
    } catch (err) {
      console.error("[demo-auth] Error:", err);
      res.status(500).json({ error: "Ошибка демо авторизации" });
    }
  });

  // === API Routes ===

  // Contacts
  app.get(api.contacts.list.path, async (req, res) => {
    const contacts = await storage.getContacts();
    res.json(contacts);
  });

  app.post(api.contacts.create.path, async (req, res) => {
    try {
      const input = api.contacts.create.input.parse(req.body);
      const contact = await storage.createContact(input);
      res.status(201).json(contact);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.contacts.delete.path, async (req, res) => {
    await storage.deleteContact(req.params.id);
    res.status(204).send();
  });

  // File Upload (CSV/Excel)
  app.post(api.contacts.uploadFile.path, async (req, res) => {
    try {
      const input = api.contacts.uploadFile.input.parse(req.body);
      const fileBuffer = Buffer.from(input.fileBase64, "base64");
      const result = await storage.uploadFile(fileBuffer, input.filename);
      res.json({
        success: true,
        csvUploadId: result.csvUpload.id,
        uploaded: result.uploaded,
        skipped: result.skipped,
        errors: result.errors,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      if (err instanceof Error) {
        return res.status(400).json({
          message: err.message,
        });
      }
      throw err;
    }
  });

  // CSV Uploads list
  app.get(api.csvUploads.list.path, async (req, res) => {
    const uploads = await storage.getCsvUploads();
    res.json(uploads);
  });

  // File Upload to Supabase Storage (FormData) - парсит контакты и сохраняет в БД
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
  });

  app.post("/api/upload-file-storage", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "Файл не предоставлен" });
      }

      const allowedExts = [".csv", ".xlsx", ".xls"];
      const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
      if (!allowedExts.includes(ext)) {
        return res.status(400).json({ error: "Неподдерживаемый формат файла. Используйте CSV или Excel." });
      }

      const result = await storage.uploadFile(file.buffer, file.originalname);

      res.status(201).json({
        success: true,
        id: result.csvUpload.id,
        filename: result.csvUpload.filename,
        supabase_url: result.csvUpload.supabaseUrl,
        file_size: file.size,
        created_at: result.csvUpload.createdAt,
        uploaded: result.uploaded,
        skipped: result.skipped,
        errors: result.errors,
      });
    } catch (error) {
      console.error("[upload-file-storage] Error:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  // Campaigns
  app.get(api.campaigns.list.path, async (req, res) => {
    const campaigns = await storage.getCampaigns();
    res.json(campaigns);
  });

  app.post(api.campaigns.create.path, async (req, res) => {
    try {
      const input = api.campaigns.create.input.parse(req.body);
      const campaign = await storage.createCampaign(input);
      res.status(201).json(campaign);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Prompt Profiles
  app.get(api.promptProfiles.list.path, async (req, res) => {
    const profiles = await storage.getPromptProfiles();
    res.json(profiles);
  });

  app.post(api.promptProfiles.create.path, async (req, res) => {
    try {
      const input = api.promptProfiles.create.input.parse(req.body);
      const profile = await storage.createPromptProfile(input);
      res.status(201).json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Gmail Accounts
  app.get(api.gmailAccounts.list.path, async (req, res) => {
    const accounts = await storage.getGmailAccounts();
    res.json(accounts);
  });

  // Leads
  app.get(api.leads.list.path, async (req, res) => {
    const leads = await storage.getLeads();
    res.json(leads);
  });

  // === Start Core Services ===
  // В демо режиме не запускаем микросервисы
  if (process.env.DATABASE_URL && process.env.REDIS_URL) {
    startService("core-api", "services/core-api/src/index.ts", { PORT: "3000" });
    startService("telegram-bot", "services/telegram-bot/src/index.ts");
    // startService("worker", "services/worker/src/index.ts");
  } else {
    console.log("[services] Демо режим: микросервисы отключены");
  }

  return httpServer;
}

function startService(name: string, scriptPath: string, env: Record<string, string> = {}) {
  console.log(`[${name}] Starting service...`);
  // Use tsx to run the service
  const service = spawn("npx", ["tsx", scriptPath], {
    stdio: "inherit",
    env: { ...process.env, ...env },
    cwd: process.cwd()
  });

  service.on("error", (err) => {
    console.error(`[${name}] Failed to start:`, err);
  });

  service.on("exit", (code) => {
    console.log(`[${name}] Exited with code ${code}`);
  });
}
