import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { spawn } from "child_process";
import path from "path";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
  // Start core-api on port 3000 to avoid conflict with main server (port 5000)
  startService("core-api", "services/core-api/src/index.ts", { PORT: "3000" });
  startService("telegram-bot", "services/telegram-bot/src/index.ts");
  // startService("worker", "services/worker/src/index.ts"); 

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
