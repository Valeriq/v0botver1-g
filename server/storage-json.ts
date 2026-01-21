import {
  type InsertContact,
  type InsertCampaign,
  type InsertPromptProfile,
  type CsvUpload,
  type User
} from "@shared/schema";
import * as XLSX from "xlsx";
import { parse } from "csv-parse/sync";

import fs from "fs/promises";
import path from "path";

// Путь к файлам с данными
const DATA_DIR = path.join(process.cwd(), "..", "data");
const CONTACTS_FILE = path.join(DATA_DIR, "contacts.json");
const CAMPAIGNS_FILE = path.join(DATA_DIR, "campaigns.json");
const PROMPTS_FILE = path.join(DATA_DIR, "prompts.json");
const UPLOADS_FILE = path.join(DATA_DIR, "uploads.json");

// Интерфейс для хранилища (совместим с DatabaseStorage)
export interface IStorage {
  // Users (Auth)
  getUserById(id: string): Promise<User | null>;
  getUserByTelegramId(telegramUserId: number): Promise<User | null>;
  upsertUser(data: {
    telegramUserId: number;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    photoUrl: string | null;
    authDate: Date;
  }): Promise<User>;

  // Contacts
  getContacts(): Promise<any[]>;
  createContact(contact: InsertContact): Promise<any>;
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
  getCampaigns(): Promise<any[]>;
  createCampaign(campaign: InsertCampaign): Promise<any>;

  // Prompt Profiles
  getPromptProfiles(): Promise<any[]>;
  createPromptProfile(profile: InsertPromptProfile): Promise<any>;

  // Gmail Accounts
  getGmailAccounts(): Promise<any[]>;

  // Leads
  getLeads(): Promise<any[]>;
}

// Вспомогательные функции для работы с файлами
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    // Директория уже существует
  }
}

async function readJSON<T>(filePath: string, defaultData: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    // Файл не существует или пуст
    return defaultData;
  }
}

async function writeJSON<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export class JsonStorage implements IStorage {
  // Users (Auth)
  async getUserById(id: string): Promise<User | null> {
    return {
      id: "demo-user-1",
      telegramUserId: 123456789,
      username: "demo_user",
      firstName: "Demo",
      lastName: "User",
      photoUrl: null,
      authDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getUserByTelegramId(telegramUserId: number): Promise<User | null> {
    return {
      id: "demo-user-1",
      telegramUserId: telegramUserId,
      username: "demo_user",
      firstName: "Demo",
      lastName: "User",
      photoUrl: null,
      authDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async upsertUser(data: {
    telegramUserId: number;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    photoUrl: string | null;
    authDate: Date;
  }): Promise<User> {
    return {
      id: "demo-user-1",
      telegramUserId: data.telegramUserId,
      username: data.username || "demo_user",
      firstName: data.firstName || "Demo",
      lastName: data.lastName || "User",
      photoUrl: data.photoUrl,
      authDate: data.authDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Contacts
  async getContacts(): Promise<any[]> {
    const contacts = await readJSON<any[]>(CONTACTS_FILE, []);
    return contacts;
  }

  async createContact(contact: InsertContact): Promise<any> {
    const contacts = await this.getContacts();
    const newContact = {
      ...contact,
      id: String(Date.now()),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    contacts.push(newContact);
    await writeJSON(CONTACTS_FILE, contacts);
    return newContact;
  }

  async deleteContact(id: string): Promise<void> {
    let contacts = await this.getContacts();
    contacts = contacts.filter((c) => c.id !== id);
    await writeJSON(CONTACTS_FILE, contacts);
  }

  // File Uploads (CSV/Excel)
  async uploadFile(fileBuffer: Buffer, filename: string): Promise<{
    csvUpload: CsvUpload;
    uploaded: number;
    skipped: number;
    errors: string[];
  }> {
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
        console.log(`[json-storage] Excel parsed: ${records.length} rows from sheet "${firstSheetName}"`);
      } catch (e: any) {
        throw new Error(`Ошибка парсинга Excel: ${e.message}`);
      }
    } else {
      // CSV парсинг
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
            console.log(`[json-storage] CSV parsed with delimiter: "${delimiter === "\t" ? "TAB" : delimiter}"`);
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

    // Логируем названия колонок
    if (records.length > 0) {
      const columnNames = Object.keys(records[0]);
      console.log(`[json-storage] Найдены колонки: ${columnNames.join(", ")}`);
    }

    // Сохраняем запись о загрузке
    const csvUpload: CsvUpload = {
      id: String(Date.now()),
      workspaceId: "demo",
      filename,
      supabaseUrl: null,
      rowCount: records.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const uploads = await readJSON<any[]>(UPLOADS_FILE, []);
    uploads.push(csvUpload);
    await writeJSON(UPLOADS_FILE, uploads);

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
      const rawEmail = findValue(record, ["email", "e-mail", "mail", "почта", "емейл", "электронная почта", "электронный адрес"]);
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
        workspaceId: "demo",
        email,
        firstName: findValue(record, ["first_name", "firstname", "имя", "name", "фио", "контакт лпр"]),
        lastName: findValue(record, ["last_name", "lastname", "фамилия", "surname"]),
        company: findValue(record, ["company", "компания", "organization", "org", "организация", "наименование"]),
        website: findValue(record, ["website", "site", "url", "сайт", "сайт в сети интернет"]),
      });
    }

    // Сохраняем контакты
    if (contactsToInsert.length > 0) {
      const existingContacts = await this.getContacts();
      for (const contact of contactsToInsert) {
        const newContact = {
          ...contact,
          id: String(Date.now() + Math.random()),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        existingContacts.push(newContact);
      }
      await writeJSON(CONTACTS_FILE, existingContacts);
    }

    return {
      csvUpload,
      uploaded: contactsToInsert.length,
      skipped: records.length - contactsToInsert.length,
      errors: errors.slice(0, 10),
    };
  }

  async getCsvUploads(): Promise<CsvUpload[]> {
    const uploads = await readJSON<any[]>(UPLOADS_FILE, []);
    return uploads;
  }

  // Campaigns
  async getCampaigns(): Promise<any[]> {
    const campaigns = await readJSON<any[]>(CAMPAIGNS_FILE, []);
    return campaigns;
  }

  async createCampaign(campaign: InsertCampaign): Promise<any> {
    const campaigns = await this.getCampaigns();
    const newCampaign = {
      ...campaign,
      id: String(Date.now()),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    campaigns.push(newCampaign);
    await writeJSON(CAMPAIGNS_FILE, campaigns);
    return newCampaign;
  }

  // Prompt Profiles
  async getPromptProfiles(): Promise<any[]> {
    const prompts = await readJSON<any[]>(PROMPTS_FILE, []);
    return prompts;
  }

  async createPromptProfile(profile: InsertPromptProfile): Promise<any> {
    const prompts = await this.getPromptProfiles();
    const newProfile = {
      ...profile,
      id: String(Date.now()),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prompts.push(newProfile);
    await writeJSON(PROMPTS_FILE, prompts);
    return newProfile;
  }

  // Gmail Accounts
  async getGmailAccounts(): Promise<any[]> {
    return [];
  }

  // Leads
  async getLeads(): Promise<any[]> {
    return [];
  }
}

export const jsonStorage = new JsonStorage();
