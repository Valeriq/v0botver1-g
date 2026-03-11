# REQUIREMENTS: Google Sheets Import

## Phase 02b: Google Sheets Import

### GS-IMPORT - Google Sheets Import Feature

- [ ] **GS-IMPORT-01**: HTML парсинг Google Sheets — **Phase 02b**
- [ ] **GS-IMPORT-02**: Автоопределение колонок (email, name, company, position) — **Phase 02b**
- [ ] **GS-IMPORT-03**: Endpoint POST /api/contacts/import-sheets/preview — **Phase 02b**
- [ ] **GS-IMPORT-04**: Endpoint POST /api/contacts/import-sheets с дедупликацией — **Phase 02b**
- [ ] **GS-IMPORT-05**: UI компонент SheetsImport — **Phase 02b**
- [ ] **GS-IMPORT-06**: UI компонент ColumnMappingDialog — **Phase 02b**
- [ ] **GS-IMPORT-07**: Интеграция в страницу Contacts — **Phase 02b**

### GS-DATA - Data Model Extensions

- [ ] **GS-DATA-01**: Таблица contact_lists — **Phase 02b**
- [ ] **GS-DATA-02**: Колонка contact_list_id в contacts — **Phase 02b**
- [ ] **GS-DATA-03**: Колонка raw_data в contacts — **Phase 02b**

### GS-ERROR - Error Handling

- [ ] **GS-ERROR-01**: Валидация URL Google Sheets — **Phase 02b**
- [ ] **GS-ERROR-02**: Обработка недоступной таблицы — **Phase 02b**
- [ ] **GS-ERROR-03**: Обработка отсутствия email колонки — **Phase 02b**
- [ ] **GS-ERROR-04**: Обработка пустой таблицы — **Phase 02b**

---

## Technical Approach

### HTML Parsing (No OAuth)

Google Sheets публикует публичные таблицы как HTML. Парсим:
1. HTTP GET к `https://docs.google.com/spreadsheets/d/{ID}/export?format=html`
2. HTML содержит `<table>` с классом `waffle`
3. Извлекаем заголовки из первой строки
4. Извлекаем данные из остальных строк

### Column Detection

Автоопределение по заголовкам и данным:
- Email: колонки с заголовком "email", "e-mail", "mail" ИЛИ колонки где >50% значений содержат `@`
- Name: колонки с заголовком "name", "first name", "имя"
- Company: колонки с заголовком "company", "организация"
- Position: колонки с заголовком "position", "должность"

### Deduplication

Переиспользуем существующий UNIQUE constraint на `(workspace_id, email)`:
- `ON CONFLICT DO UPDATE` для обновления существующих
- Пропускаем дубликаты внутри файла

---

## Dependencies

### Backend (services/core-api)
- `cheerio` — HTML parsing (добавить если нет)
- `node-fetch` — HTTP requests (уже есть в Node 18+)

### Frontend (client)
- Существующие UI компоненты: Dialog, Button, Input, Select, Table
- `@tanstack/react-query` — уже установлен
- `lucide-react` — уже установлен

---

## Out of Scope

- OAuth авторизация для приватных таблиц
- Редактирование Google Sheets из приложения
- Импорт нескольких листов одновременно
- Real-time синхронизация

---

*Created: 2026-03-11*
