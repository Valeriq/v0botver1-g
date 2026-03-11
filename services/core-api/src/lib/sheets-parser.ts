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
 * 
 * @param html - HTML содержимое страницы Google Sheets
 * @returns Объект с заголовками, строками данных и определённым маппингом колонок
 */
export function parseGoogleSheetsHTML(html: string): ParseResult {
  const $ = cheerio.load(html)
  const rows: ParsedRow[] = []
  const headers: string[] = []

  // Google Sheets использует table с классом waffle
  let table = $('table.waffle, table[id*="sheet"]').first()

  if (table.length === 0) {
    // Fallback: любая таблица
    table = $('table').first()
    if (table.length === 0) {
      return { headers: [], rows: [], detectedMapping: {} }
    }
  }

  // Извлекаем заголовки из первой строки
  table.find('tr').first().find('td, th').each((_, el) => {
    headers.push($(el).text().trim())
  })

  // Извлекаем данные из остальных строк
  table.find('tr').slice(1).each((_, row) => {
    const rowData: ParsedRow = {}
    $(row).find('td').each((i, cell) => {
      const header = headers[i] || `column_${i}`
      rowData[header] = $(cell).text().trim()
    })
    // Пропускаем полностью пустые строки
    if (Object.values(rowData).some((v) => v !== '')) {
      rows.push(rowData)
    }
  })

  const detectedMapping = detectColumns(headers, rows.slice(0, 5))

  return { headers, rows, detectedMapping }
}

/**
 * Автоопределение колонок по заголовкам и первым строкам данных.
 * Поддерживает английские и русские названия колонок.
 * 
 * @param headers - Массив заголовков таблицы
 * @param sampleRows - Первые несколько строк данных для анализа
 * @returns Объект с определённым маппингом колонок
 */
export function detectColumns(headers: string[], sampleRows: ParsedRow[]): ColumnMapping {
  const mapping: ColumnMapping = {}

  // Паттерны для определения колонок (регистронезависимые)
  const emailPatterns = ['email', 'e-mail', 'mail', 'email address', 'адрес', 'почта', 'электронная почта']
  const namePatterns = ['name', 'first name', 'имя', 'фио', 'full name', 'contact name', 'контакт']
  const companyPatterns = ['company', 'organization', 'org', 'компания', 'организация', 'фирма']
  const positionPatterns = ['position', 'title', 'job', 'role', 'должность', 'позиция', 'вакансия']

  const findColumn = (patterns: string[]): string | undefined => {
    // Сначала ищем в заголовках
    for (const header of headers) {
      const lower = header.toLowerCase()
      if (patterns.some((p) => lower.includes(p))) {
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
      const sampleValues = sampleRows.map((r) => r[header]).filter(Boolean)
      if (sampleValues.length === 0) continue
      
      const emailCount = sampleValues.filter((v) => emailRegex.test(v)).length
      if (emailCount > sampleValues.length * 0.5) {
        mapping.email = header
        break
      }
    }
  }

  return mapping
}
