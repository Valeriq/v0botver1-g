---
phase: 02b-google-sheets-import
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - services/core-api/src/routes/contacts.ts
  - services/core-api/src/lib/sheets-parser.ts
  - services/core-api/src/lib/validation.ts
  - services/core-api/migrations/004_add_contact_lists.sql
  - services/core-api/src/__tests__/sheets-parser.test.ts
autonomous: true
requirements: [GS-IMPORT-01, GS-IMPORT-02, GS-IMPORT-03, GS-IMPORT-04]
must_haves:
  truths:
    - "Пользователь может вставить ссылку на Google Sheets и получить распарсенные данные"
    - "Система автоматически определяет колонки email, имя, компания"
    - "Дубликаты по (workspace_id, email) отфильтровываются"
    - "Статистика импорта возвращается клиенту"
  artifacts:
    - path: "services/core-api/src/lib/sheets-parser.ts"
      provides: "HTML parsing and column detection"
      exports: ["parseGoogleSheetsHTML", "detectColumns"]
    - path: "services/core-api/src/routes/contacts.ts"
      provides: "POST /api/contacts/import-sheets endpoint"
      contains: "import-sheets"
    - path: "services/core-api/migrations/004_add_contact_lists.sql"
      provides: "contact_lists table and foreign key"
      contains: "CREATE TABLE contact_lists"
  key_links:
    - from: "services/core-api/src/routes/contacts.ts"
      to: "services/core-api/src/lib/sheets-parser.ts"
      via: "import and function call"
      pattern: "parseGoogleSheetsHTML"
---

<objective>
Создать backend для импорта контактов из Google Sheets по публичной ссылке.

Purpose: Позволить пользователям импортировать контакты без ручного скачивания CSV, напрямую из Google Sheets.
Output: API endpoint и HTML парсер для Google Sheets.

**Технический подход:**
- HTTP запрос к публичной ссылке Google Sheets
- HTML парсинг с помощью cheerio (легковесный, проверенный)
- Автоопределение колонок по заголовкам и первым строкам данных
- Переиспользование существующей логики дедупликации
</objective>

<execution_context>
@C:/Users/HP i5 1135/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/HP i5 1135/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md

<!-- Existing patterns from codebase -->
@services/core-api/src/routes/contacts.ts
@services/core-api/src/lib/validation.ts
@services/core-api/src/db/migrations/001_initial_schema.sql
</context>

<interfaces>
<!-- Key types and contracts from existing code -->

From services/core-api/src/routes/contacts.ts:
```typescript
// Existing CSV upload pattern - follow this structure
contactRouter.post("/upload", uploadLimiter, async (req, res, next) => {
  // ... validation, parsing, deduplication, insert
  res.json({
    success: true,
    uploaded: contacts.length,
    skipped: records.length - contacts.length,
    errors: errors.slice(0, 10),
  })
})
```

From services/core-api/src/lib/validation.ts:
```typescript
// Add new schema for sheets import
export const importSheetsSchema = z.object({
  workspace_id: z.string().uuid(),
  sheet_url: z.string().url("Invalid Google Sheets URL"),
  column_mapping: z.record(z.string()).optional(), // optional custom mapping
})
```
</interfaces>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Создать HTML парсер для Google Sheets</name>
  <files>services/core-api/src/lib/sheets-parser.ts, services/core-api/src/__tests__/sheets-parser.test.ts</files>
  <behavior>
    - Test 1: parseGoogleSheetsHTML возвращает массив строк из HTML таблицы
    - Test 2: detectColumns корректно определяет email колонку
    - Test 3: detectColumns определяет name, company, position по заголовкам
    - Test 4: Обработка пустых ячеек и пустых строк
  </behavior>
  <action>
    1. Создать `services/core-api/src/lib/sheets-parser.ts`:
    
    ```typescript
    import * as cheerio from 'cheerio'
    
    export interface ParsedRow {
      [key: string]: string
    }
    
    export interface ColumnMapping {
      email?: string
      name?: string
      company?: string
      position?: string
    }
    
    export interface ParseResult {
      headers: string[]
      rows: ParsedRow[]
      detectedMapping: ColumnMapping
    }
    
    /**
     * Парсит HTML страницу Google Sheets и извлекает табличные данные.
     * Google Sheets публикует таблицы как HTML с классами waffle-* и table-with-id-*
     */
    export function parseGoogleSheetsHTML(html: string): ParseResult {
      const $ = cheerio.load(html)
      const rows: ParsedRow[] = []
      let headers: string[] = []
      
      // Google Sheets использует table с классом waffle
      const table = $('table.waffle, table[id*="sheet"]').first()
      
      if (table.length === 0) {
        // Fallback: любая таблица
        const anyTable = $('table').first()
        if (anyTable.length === 0) {
          return { headers: [], rows: [], detectedMapping: {} }
        }
      }
      
      const targetTable = table.length > 0 ? table : $('table').first()
      
      // Извлекаем заголовки из первой строки
      targetTable.find('tr').first().find('td, th').each((i, el) => {
        headers.push($(el).text().trim())
      })
      
      // Извлекаем данные из остальных строк
      targetTable.find('tr').slice(1).each((_, row) => {
        const rowData: ParsedRow = {}
        $(row).find('td').each((i, cell) => {
          const header = headers[i] || `column_${i}`
          rowData[header] = $(cell).text().trim()
        })
        // Пропускаем полностью пустые строки
        if (Object.values(rowData).some(v => v !== '')) {
          rows.push(rowData)
        }
      })
      
      const detectedMapping = detectColumns(headers, rows.slice(0, 5))
      
      return { headers, rows, detectedMapping }
    }
    
    /**
     * Автоопределение колонок по заголовкам и первым строкам данных
     */
    export function detectColumns(headers: string[], sampleRows: ParsedRow[]): ColumnMapping {
      const mapping: ColumnMapping = {}
      
      // Паттерны для определения колонок
      const emailPatterns = ['email', 'e-mail', 'mail', 'email address', 'адрес', 'почта']
      const namePatterns = ['name', 'first name', 'имя', 'фио', 'full name', 'contact name']
      const companyPatterns = ['company', 'organization', 'org', 'компания', 'организация', 'фирма']
      const positionPatterns = ['position', 'title', 'job', 'role', 'должность', 'позиция']
      
      const findColumn = (patterns: string[]): string | undefined => {
        // Сначала ищем в заголовках
        for (const header of headers) {
          const lower = header.toLowerCase()
          if (patterns.some(p => lower.includes(p))) {
            return header
          }
        }
        return undefined
      }
      
      mapping.email = findColumn(emailPatterns)
      mapping.name = findColumn(namePatterns)
      mapping.company = findColumn(companyPatterns)
      mapping.position = findColumn(positionPatterns)
      
      // Если email не найден по заголовку, ищем по данным
      if (!mapping.email && sampleRows.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        for (const header of headers) {
          const sampleValues = sampleRows.map(r => r[header]).filter(Boolean)
          const emailCount = sampleValues.filter(v => emailRegex.test(v)).length
          if (emailCount > sampleValues.length * 0.5) {
            mapping.email = header
            break
          }
        }
      }
      
      return mapping
    }
    ```
    
    2. Создать тесты в `services/core-api/src/__tests__/sheets-parser.test.ts`:
       - Тест с реальным HTML от Google Sheets (fixture)
       - Тест определения email по заголовку
       - Тест определения email по данным
       - Тест пустой таблицы
    
    3. Добавить cheerio в зависимости (уже есть в проекте или npm install cheerio)
  </action>
  <verify>
    <automated>cd services/core-api && npm test -- --testPathPattern=sheets-parser</automated>
  </verify>
  <done>
    - Файл sheets-parser.ts существует и экспортирует parseGoogleSheetsHTML, detectColumns
    - Тесты проходят (>= 4 теста)
    - Функции корректно обрабатывают edge cases
  </done>
</task>

<task type="auto">
  <name>Task 2: Создать миграцию для contact_lists</name>
  <files>services/core-api/migrations/004_add_contact_lists.sql</files>
  <action>
    Создать миграцию для таблицы contact_lists и добавления foreign key в contacts:
    
    ```sql
    -- Contact Lists (группировка импортов)
    CREATE TABLE IF NOT EXISTS contact_lists (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      source_type TEXT NOT NULL CHECK (source_type IN ('csv', 'google_sheets', 'manual')) DEFAULT 'manual',
      source_url TEXT,
      row_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_contact_lists_workspace_id ON contact_lists(workspace_id);
    
    -- Добавляем contact_list_id в contacts
    ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_list_id UUID REFERENCES contact_lists(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_contacts_contact_list_id ON contacts(contact_list_id);
    
    -- Добавляем raw_data для хранения оригинальных данных
    ALTER TABLE contacts ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}';
    ```
  </action>
  <verify>
    <automated>cd services/core-api && npm run db:migrate 2>&1 | grep -E "(success|contact_lists)" || echo "Check migration manually"</automated>
  </verify>
  <done>
    - Миграция создана в migrations/004_add_contact_lists.sql
    - Таблица contact_lists создана
    - Колонки contact_list_id и raw_data добавлены в contacts
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Создать endpoint POST /api/contacts/import-sheets</name>
  <files>services/core-api/src/routes/contacts.ts, services/core-api/src/lib/validation.ts, services/core-api/src/__tests__/contacts.test.ts</files>
  <behavior>
    - Test 1: Валидный URL Google Sheets возвращает распарсенные данные
    - Test 2: Невалидный URL возвращает 400 ошибку
    - Test 3: Недоступная таблица возвращает понятную ошибку
    - Test 4: Дубликаты отфильтровываются и возвращаются в статистике
  </behavior>
  <action>
    1. Добавить схему валидации в `validation.ts`:
    
    ```typescript
    export const importSheetsSchema = z.object({
      workspace_id: z.string().uuid(),
      sheet_url: z.string().url().refine(
        (url) => url.includes('docs.google.com/spreadsheets'),
        "URL must be a Google Sheets URL"
      ),
      contact_list_name: z.string().min(1).max(200).optional(),
      column_mapping: z.record(z.string()).optional(),
    })
    ```
    
    2. Добавить endpoint в `contacts.ts`:
    
    ```typescript
    import { parseGoogleSheetsHTML, detectColumns } from "../lib/sheets-parser"
    
    // Regex для Google Sheets URL
    const GOOGLE_SHEETS_REGEX = /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
    
    // Preview endpoint - возвращает данные для предпросмотра
    contactRouter.post("/import-sheets/preview", uploadLimiter, async (req, res, next) => {
      try {
        const data = validateRequest(importSheetsSchema, req.body)
        
        // Извлекаем URL для публичного просмотра (публикуем как HTML)
        const match = data.sheet_url.match(GOOGLE_SHEETS_REGEX)
        if (!match) {
          return res.status(400).json({ error: "Invalid Google Sheets URL format" })
        }
        
        const sheetId = match[1]
        const publishUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=html`
        
        // Загружаем HTML
        const response = await fetch(publishUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        if (!response.ok) {
          return res.status(400).json({ 
            error: "Sheet not accessible",
            details: "Make sure the sheet is shared with 'Anyone with the link'"
          })
        }
        
        const html = await response.text()
        const { headers, rows, detectedMapping } = parseGoogleSheetsHTML(html)
        
        if (rows.length === 0) {
          return res.status(400).json({ error: "No data found in sheet" })
        }
        
        if (!detectedMapping.email) {
          return res.status(400).json({ 
            error: "Email column not detected",
            hint: "Please provide column_mapping with 'email' key",
            availableColumns: headers
          })
        }
        
        res.json({
          preview: rows.slice(0, 10), // Первые 10 строк для предпросмотра
          totalRows: rows.length,
          headers,
          detectedMapping,
        })
      } catch (error) {
        next(error)
      }
    })
    
    // Import endpoint - выполняет импорт
    contactRouter.post("/import-sheets", uploadLimiter, async (req, res, next) => {
      try {
        const data = validateRequest(importSheetsSchema, req.body)
        
        // Аналогично preview, но с импортом
        const match = data.sheet_url.match(GOOGLE_SHEETS_REGEX)
        if (!match) {
          return res.status(400).json({ error: "Invalid Google Sheets URL format" })
        }
        
        const sheetId = match[1]
        const publishUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=html`
        
        const response = await fetch(publishUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        if (!response.ok) {
          return res.status(400).json({ error: "Sheet not accessible" })
        }
        
        const html = await response.text()
        const { rows, detectedMapping } = parseGoogleSheetsHTML(html)
        
        // Маппинг колонок (переопределение или автоопределение)
        const mapping = data.column_mapping || detectedMapping
        
        if (!mapping.email) {
          return res.status(400).json({ error: "Email column required" })
        }
        
        // Создаём contact_list
        const listId = uuidv4()
        await pool.query(
          `INSERT INTO contact_lists (id, workspace_id, name, source_type, source_url, row_count)
           VALUES ($1, $2, $3, 'google_sheets', $4, $5)`,
          [listId, data.workspace_id, data.contact_list_name || `Import ${new Date().toISOString()}`, data.sheet_url, rows.length]
        )
        
        // Импортируем контакты
        const emailSet = new Set<string>()
        const contacts = []
        const errors: string[] = []
        
        for (const row of rows) {
          const email = row[mapping.email]?.toLowerCase().trim()
          
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push(`Invalid email: ${email || "empty"}`)
            continue
          }
          
          if (emailSet.has(email)) {
            continue // Дубликат внутри файла
          }
          
          emailSet.add(email)
          contacts.push({
            id: uuidv4(),
            workspace_id: data.workspace_id,
            contact_list_id: listId,
            email,
            first_name: mapping.name ? row[mapping.name] : null,
            last_name: null,
            company: mapping.company ? row[mapping.company] : null,
            website: null,
            raw_data: row, // Сохраняем все оригинальные данные
          })
        }
        
        // Batch insert с ON CONFLICT
        if (contacts.length > 0) {
          const values = contacts.map(c => 
            `('${c.id}', '${c.workspace_id}', '${c.contact_list_id}', '${c.email}', 
              ${c.first_name ? `'${c.first_name.replace(/'/g, "''")}'` : 'NULL'}, 
              NULL, 
              ${c.company ? `'${c.company.replace(/'/g, "''")}'` : 'NULL'}, 
              NULL, 
              '${JSON.stringify(c.raw_data)}'::jsonb)`
          ).join(',')
          
          await pool.query(`
            INSERT INTO contacts (id, workspace_id, contact_list_id, email, first_name, last_name, company, website, raw_data)
            VALUES ${values}
            ON CONFLICT (workspace_id, email) DO UPDATE SET
              first_name = COALESCE(EXCLUDED.first_name, contacts.first_name),
              company = COALESCE(EXCLUDED.company, contacts.company),
              raw_data = EXCLUDED.raw_data,
              contact_list_id = EXCLUDED.contact_list_id
          `)
        }
        
        res.json({
          success: true,
          contact_list_id: listId,
          imported: contacts.length,
          skipped: rows.length - contacts.length,
          errors: errors.slice(0, 10),
        })
      } catch (error) {
        next(error)
      }
    })
    ```
    
    3. Создать миграцию `004_add_contact_lists.sql`:
       - Таблица contact_lists
       - Добавить contact_list_id в contacts
       - Добавить raw_data в contacts
  </action>
  <verify>
    <automated>cd services/core-api && npm test -- --testPathPattern=contacts</automated>
  </verify>
  <done>
    - Endpoint POST /api/contacts/import-sheets/preview работает
    - Endpoint POST /api/contacts/import-sheets работает
    - Миграция применена успешно
    - Тесты проходят
  </done>
</task>

<task type="auto">
  <name>Task 4: Добавить интеграционные тесты</name>
  <files>services/core-api/src/__tests__/sheets-import.test.ts</files>
  <action>
    Создать интеграционные тесты для endpoint'ов:
    
    1. Тест preview с мок-HTML ответом от Google Sheets
    2. Тест импорта с проверкой БД
    3. Тест дедупликации
    4. Тест обработки ошибок (невалидный URL, недоступная таблица)
    
    Использовать supertest для HTTP запросов и тестовую БД.
    
    Мокнуть fetch для Google Sheets чтобы не зависеть от внешнего API.
  </action>
  <verify>
    <automated>cd services/core-api && npm test -- --testPathPattern=sheets-import</automated>
  </verify>
  <done>
    - Интеграционные тесты проходят
    - Покрытие endpoint'ов > 80%
    - Обработка ошибок проверена
  </done>
</task>

</tasks>

<verification>
1. Запустить тесты: `cd services/core-api && npm test`
2. Проверить миграцию: подключиться к БД и проверить структуру таблиц
3. Тестовый запрос к endpoint через curl или Postman
</verification>

<success_criteria>
1. Endpoint POST /api/contacts/import-sheets/preview возвращает предпросмотр данных
2. Endpoint POST /api/contacts/import-sheets импортирует контакты
3. Email колонка определяется автоматически
4. Дубликаты по (workspace_id, email) обрабатываются корректно
5. Статистика импорта возвращается клиенту
6. Миграция БД применена без ошибок
7. Все тесты проходят
</success_criteria>

<output>
После завершения создать `.planning/phases/02b-google-sheets-import/02b-01-SUMMARY.md`
</output>
