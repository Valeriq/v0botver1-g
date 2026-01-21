import { db } from "./db";
import {
  contacts,
  campaigns,
  promptProfiles,
  gmailAccounts,
  leads,
  csvUploads,
  users,
  type InsertContact,
  type InsertCampaign,
  type InsertPromptProfile,
  type InsertGmailAccount,
  type InsertCsvUpload,
  type CsvUpload,
  type User
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { uploadFileToSupabase } from "./supabase";

// Mock данные для демо режима
const mockContacts = [
  {
    id: "1",
    workspaceId: "demo",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    company: "Example Corp",
    website: "example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    workspaceId: "demo",
    email: "jane@test.com",
    firstName: "Jane",
    lastName: "Smith",
    company: "Test Inc",
    website: "test.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockCampaigns = [
  {
    id: "1",
    workspaceId: "demo",
    name: "Demo Campaign",
    description: "Тестовая кампания для демонстрации",
    promptProfileId: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockPromptProfiles = [
  {
    id: "1",
    workspaceId: "demo",
    name: "Default Profile",
    systemPrompt: "You are a professional sales representative...",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

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
  // Users (Auth)
  async getUserById(id: string): Promise<User | null> {
    if (!db) {
      // Demo mode: return mock user
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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getUserByTelegramId(telegramUserId: number): Promise<User | null> {
    if (!db) {
      // Demo mode: return mock user
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
    const [user] = await db.select().from(users).where(eq(users.telegramUserId, telegramUserId));
    return user || null;
  }

  async upsertUser(data: {
    telegramUserId: number;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    photoUrl: string | null;
    authDate: Date;
  }): Promise<User> {
    if (!db) {
      // Demo mode: return mock user
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

    const existingUser = await this.getUserByTelegramId(data.telegramUserId);

    if (existingUser) {
      const [updatedUser] = await db.update(users)
        .set({
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          photoUrl: data.photoUrl,
          authDate: data.authDate,
          updatedAt: new Date(),
        })
        .where(eq(users.telegramUserId, data.telegramUserId))
        .returning();
      return updatedUser;
    }

    const [newUser] = await db.insert(users).values({
      telegramUserId: data.telegramUserId,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      photoUrl: data.photoUrl,
      authDate: data.authDate,
    }).returning();
    return newUser;
  }

  // Contacts
  async getContacts() {
    if (!db) return mockContacts;
    return await db.select().from(contacts);
  }

  async createContact(contact: InsertContact) {
    if (!db) {
      const newContact = {
        ...contact,
        id: String(mockContacts.length + 1),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockContacts.push(newContact);
      return newContact;
    }
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async deleteContact(id: string) {
    if (!db) {
      const index = mockContacts.findIndex(c => c.id === id);
      if (index > -1) mockContacts.splice(index, 1);
      return;
    }
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // File Uploads (CSV/Excel)
  async uploadFile(fileBuffer: Buffer, filename: string) {
    // Demo mode: возвращаем mock результат без сохранения в базу
    if (!db) {
      const errors: string[] = [];
      const lowerFilename = filename.toLowerCase();
      const isExcel = lowerFilename.endsWith(".xlsx") || lowerFilename.endsWith(".xls");
      let records: any[] = [];
      
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

      // Парсим контакты
      const emailSet = new Set<string>();
      const contactsToInsert: InsertContact[] = [];
      
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
        const newContact = {
          workspaceId: "demo",
          email,
          firstName: findValue(record, ["first_name", "firstname", "имя", "name", "фио", "контакт лпр"]),
          lastName: findValue(record, ["last_name", "lastname", "фамилия", "surname"]),
          company: findValue(record, ["company", "компания", "organization", "org", "организация", "наименование"]),
          website: findValue(record, ["website", "site", "url", "сайт", "сайт в сети интернет"]),
        } as any;
        
        // Add to mock contacts
        mockContacts.push({
          ...newContact,
          id: String(mockContacts.length + 1),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        contactsToInsert.push(newContact);
      }

      return {
        csvUpload: {
          id: String(Date.now()),
          workspaceId: "demo",
          filename,
          supabaseUrl: null,
          rowCount: records.length,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        uploaded: contactsToInsert.length,
        skipped: records.length - contactsToInsert.length,
        errors: errors.slice(0, 10),
      };
    }

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
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "csv-uploads";
    const { url: supabaseUrl, error: uploadError } = await uploadFileToSupabase(
      bucketName,
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
        workspaceId: "00000000-0000-0000-0000-000000000000",
        email,
        firstName: findValue(record, ["first_name", "firstname", "имя", "name", "фио", "контакт лпр"]),
        lastName: findValue(record, ["last_name", "lastname", "фамилия", "surname"]),
        company: findValue(record, ["company", "компания", "organization", "org", "организация", "наименование"]),
        website: findValue(record, ["website", "site", "url", "сайт", "сайт в сети интернет"]),
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
    if (!db) return mockCampaigns;
    return await db.select().from(campaigns);
  }

  async createCampaign(campaign: InsertCampaign) {
    if (!db) {
      const newCampaign = {
        ...campaign,
        id: String(mockCampaigns.length + 1),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCampaigns.push(newCampaign);
      return newCampaign;
    }
    const [newCampaign] = await db.insert(campaigns).values(campaign).returning();
    return newCampaign;
  }

  // Prompt Profiles
  async getPromptProfiles() {
    if (!db) return mockPromptProfiles;
    return await db.select().from(promptProfiles);
  }

  async createPromptProfile(profile: InsertPromptProfile) {
    if (!db) {
      const newProfile = {
        ...profile,
        id: String(mockPromptProfiles.length + 1),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPromptProfiles.push(newProfile);
      return newProfile;
    }
    const [newProfile] = await db.insert(promptProfiles).values(profile).returning();
    return newProfile;
  }

  // Gmail Accounts
  async getGmailAccounts() {
    if (!db) return [];
    return await db.select().from(gmailAccounts);
  }

  // Leads
  async getLeads() {
    if (!db) return [];
    return await db.select().from(leads);
  }
}

export const storage = new DatabaseStorage();
