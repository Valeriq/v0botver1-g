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
import * as XLSX from "xlsx";
import { uploadFileToSupabase } from "./supabase";

export interface IStorage {
  // Contacts
  getContacts(): Promise<typeof contacts.$inferSelect[]>;
  createContact(contact: InsertContact): Promise<typeof contacts.$inferSelect>;
  deleteContact(id: string): Promise<void>;

  // File Uploads (CSV/Excel)
  uploadFile(fileBuffer: Buffer, filename: string): Promise<{
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

  // File Uploads (CSV/Excel)
  async uploadFile(fileBuffer: Buffer, filename: string) {
    const errors: string[] = [];
    let records: any[] = [];
    const lowerFilename = filename.toLowerCase();
    const isExcel = lowerFilename.endsWith(".xlsx") || lowerFilename.endsWith(".xls");
    
    // Парсинг Excel или CSV
    if (isExcel) {
      try {
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error("Excel файл не содержит листов");
        }
        const worksheet = workbook.Sheets[firstSheetName];
        records = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        console.log(`[storage] Excel parsed: ${records.length} rows from sheet "${firstSheetName}"`);
      } catch (e: any) {
        throw new Error(`Ошибка парсинга Excel: ${e.message}`);
      }
    } else {
      // CSV парсинг с автоопределением разделителя
      const fileContent = fileBuffer.toString("utf-8");
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
          if (parsed.length > 0) {
            records = parsed;
            parsedSuccessfully = true;
            console.log(`[storage] CSV parsed with delimiter: "${delimiter === "\t" ? "TAB" : delimiter}"`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!parsedSuccessfully) {
        throw new Error("Не удалось распарсить CSV файл");
      }
    }
    
    if (records.length === 0) {
      throw new Error("Файл не содержит данных");
    }

    // Логируем названия колонок для диагностики
    if (records.length > 0) {
      const columnNames = Object.keys(records[0]);
      console.log(`[storage] Найдены колонки: ${columnNames.join(", ")}`);
    }

    // Загружаем файл в Supabase Storage
    const timestamp = Date.now();
    const supabasePath = `uploads/${timestamp}_${filename}`;
    const contentType = isExcel 
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
      : "text/csv";
    const { url: supabaseUrl, error: uploadError } = await uploadFileToSupabase(
      "csv-files",
      supabasePath,
      fileBuffer,
      contentType
    );
    
    if (uploadError) {
      console.warn(`[storage] Не удалось загрузить в Supabase: ${uploadError}`);
    }

    // Сохраняем запись о загрузке
    const [csvUpload] = await db.insert(csvUploads).values({
      workspaceId: "00000000-0000-0000-0000-000000000000",
      filename,
      originalContent: isExcel ? "[Excel binary]" : fileBuffer.toString("utf-8").substring(0, 10000),
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
            if (val !== null && val !== undefined) {
              const strVal = String(val).trim();
              if (strVal) return strVal;
            }
          }
        }
      }
      return null;
    };

    for (const record of records) {
      const rawEmail = findValue(record, ["email", "e-mail", "mail", "почта", "емейл", "электронная почта"]);
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
        firstName: findValue(record, ["first_name", "firstname", "имя", "name", "фио"]),
        lastName: findValue(record, ["last_name", "lastname", "фамилия", "surname"]),
        company: findValue(record, ["company", "компания", "organization", "org", "организация"]),
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
