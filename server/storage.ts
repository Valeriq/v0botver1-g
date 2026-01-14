import { db } from "./db";
import {
  contacts,
  campaigns,
  promptProfiles,
  gmailAccounts,
  leads,
  csvUploads,
  type InsertContact,
  type InsertCampaign,
  type InsertPromptProfile,
  type InsertGmailAccount,
  type InsertCsvUpload,
  type CsvUpload
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { parse } from "csv-parse/sync";
import { uploadFileToSupabase } from "./supabase";

export interface IStorage {
  // Contacts
  getContacts(): Promise<typeof contacts.$inferSelect[]>;
  createContact(contact: InsertContact): Promise<typeof contacts.$inferSelect>;
  deleteContact(id: string): Promise<void>;

  // CSV Uploads
  uploadCsv(fileContent: string, filename: string): Promise<{
    csvUpload: CsvUpload;
    uploaded: number;
    skipped: number;
    errors: string[];
  }>;
  getCsvUploads(): Promise<CsvUpload[]>;

  // Campaigns
  getCampaigns(): Promise<typeof campaigns.$inferSelect[]>;
  createCampaign(campaign: InsertCampaign): Promise<typeof campaigns.$inferSelect>;

  // Prompt Profiles
  getPromptProfiles(): Promise<typeof promptProfiles.$inferSelect[]>;
  createPromptProfile(profile: InsertPromptProfile): Promise<typeof promptProfiles.$inferSelect>;

  // Gmail Accounts
  getGmailAccounts(): Promise<typeof gmailAccounts.$inferSelect[]>;

  // Leads
  getLeads(): Promise<typeof leads.$inferSelect[]>;
}

export class DatabaseStorage implements IStorage {
  // Contacts
  async getContacts() {
    return await db.select().from(contacts);
  }

  async createContact(contact: InsertContact) {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async deleteContact(id: string) {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // CSV Uploads
  async uploadCsv(fileContent: string, filename: string) {
    const errors: string[] = [];
    let records: any[] = [];
    
    // Автоопределение разделителя: запятая, точка с запятой, табуляция
    const delimiters = [",", ";", "\t"];
    let parsedSuccessfully = false;
    
    for (const delimiter of delimiters) {
      try {
        const parsed = parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          delimiter,
          relaxColumnCount: true,
          relaxQuotes: true,
        });
        
        // Проверяем что парсинг дал результат с email колонкой
        if (parsed.length > 0) {
          const firstRow = parsed[0];
          const keys = Object.keys(firstRow).map(k => k.toLowerCase());
          if (keys.some(k => k.includes("email") || k.includes("mail"))) {
            records = parsed;
            parsedSuccessfully = true;
            console.log(`[storage] CSV parsed with delimiter: "${delimiter === "\t" ? "TAB" : delimiter}"`);
            break;
          }
        }
      } catch (e) {
        // Пробуем следующий разделитель
        continue;
      }
    }
    
    // Если не удалось найти email колонку, пробуем любой успешный парсинг
    if (!parsedSuccessfully) {
      for (const delimiter of delimiters) {
        try {
          const parsed = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            delimiter,
            relaxColumnCount: true,
            relaxQuotes: true,
          });
          if (parsed.length > 0) {
            records = parsed;
            parsedSuccessfully = true;
            console.log(`[storage] CSV parsed (fallback) with delimiter: "${delimiter === "\t" ? "TAB" : delimiter}"`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }
    
    if (!parsedSuccessfully || records.length === 0) {
      throw new Error("Не удалось распарсить CSV. Убедитесь что файл содержит заголовки и данные.");
    }

    // Загружаем файл в Supabase Storage
    const timestamp = Date.now();
    const supabasePath = `csv-uploads/${timestamp}_${filename}`;
    const { url: supabaseUrl, error: uploadError } = await uploadFileToSupabase(
      "csv-files",
      supabasePath,
      fileContent
    );
    
    if (uploadError) {
      console.warn(`[storage] Не удалось загрузить в Supabase: ${uploadError}`);
    }

    // Сохраняем оригинальный файл и ссылку на Supabase
    const [csvUpload] = await db.insert(csvUploads).values({
      workspaceId: "00000000-0000-0000-0000-000000000000",
      filename,
      originalContent: fileContent,
      supabaseUrl: supabaseUrl || null,
      rowCount: records.length,
    }).returning();

    const emailSet = new Set<string>();
    const contactsToInsert: InsertContact[] = [];
    
    // Функция для поиска значения по возможным названиям колонок
    const findValue = (record: any, possibleNames: string[]): string | null => {
      for (const name of possibleNames) {
        for (const key of Object.keys(record)) {
          if (key.toLowerCase() === name.toLowerCase() || 
              key.toLowerCase().includes(name.toLowerCase())) {
            const val = record[key];
            if (val && typeof val === "string" && val.trim()) {
              return val.trim();
            }
          }
        }
      }
      return null;
    };

    for (const record of records) {
      // Ищем email в разных вариантах названия колонки
      const rawEmail = findValue(record, ["email", "e-mail", "mail", "почта", "емейл"]);
      const email = rawEmail?.toLowerCase();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(`Неверный email: ${email || "пусто"}`);
        continue;
      }

      if (emailSet.has(email)) {
        errors.push(`Дубликат email: ${email}`);
        continue;
      }

      emailSet.add(email);
      contactsToInsert.push({
        workspaceId: "00000000-0000-0000-0000-000000000000",
        email,
        firstName: findValue(record, ["first_name", "firstname", "имя", "name"]),
        lastName: findValue(record, ["last_name", "lastname", "фамилия", "surname"]),
        company: findValue(record, ["company", "компания", "organization", "org"]),
        website: findValue(record, ["website", "site", "url", "сайт"]),
      });
    }

    if (contactsToInsert.length > 0) {
      try {
        await db.insert(contacts).values(contactsToInsert).onConflictDoNothing();
      } catch (e) {
        errors.push("Ошибка сохранения контактов");
      }
    }

    return {
      csvUpload,
      uploaded: contactsToInsert.length,
      skipped: records.length - contactsToInsert.length,
      errors: errors.slice(0, 10),
    };
  }

  async getCsvUploads() {
    return await db.select().from(csvUploads);
  }

  // Campaigns
  async getCampaigns() {
    return await db.select().from(campaigns);
  }

  async createCampaign(campaign: InsertCampaign) {
    const [newCampaign] = await db.insert(campaigns).values(campaign).returning();
    return newCampaign;
  }

  // Prompt Profiles
  async getPromptProfiles() {
    return await db.select().from(promptProfiles);
  }

  async createPromptProfile(profile: InsertPromptProfile) {
    const [newProfile] = await db.insert(promptProfiles).values(profile).returning();
    return newProfile;
  }

  // Gmail Accounts
  async getGmailAccounts() {
    return await db.select().from(gmailAccounts);
  }

  // Leads
  async getLeads() {
    return await db.select().from(leads);
  }
}

export const storage = new DatabaseStorage();
