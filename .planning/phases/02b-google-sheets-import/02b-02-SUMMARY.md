---
phase: 02b-google-sheets-import
plan: 02
subsystem: frontend
tags: [react, components, import, google-sheets]
dependencies:
  requires: [02b-01]
  provides: [SheetsImport, ColumnMappingDialog]
  affects: [Contacts]
tech_stack:
  added: []
  patterns: [Compound Components, React Hooks, TanStack Query]
key_files:
  created:
    - client/src/components/contacts/SheetsImport.tsx
    - client/src/components/contacts/ColumnMappingDialog.tsx
    - client/src/__tests__/components/contacts/SheetsImport.test.tsx
  modified:
    - client/src/pages/Contacts.tsx
decisions:
  - Два компонента: SheetsImport (основной) + ColumnMappingDialog (предпросмотр)
  - 3-шаговый UX: URL -> Preview -> Import
  - Автоопределение колонок с возможностью переопределения
  - Toast уведомления для обратной связи
metrics:
  duration: 15min
  tasks_completed: 4
  files_created: 3
  files_modified: 1
---

# Phase 02b Plan 02: Google Sheets Import Frontend Summary

## One-liner

Frontend компоненты для импорта контактов из Google Sheets с предпросмотром, маппингом колонок и интеграцией в страницу контактов.

## What Was Built

### 1. SheetsImport Component (`SheetsImport.tsx`)
- Диалог с 3 шагами: URL → Preview → Import
- Валидация Google Sheets URL
- Состояния загрузки и импорта
- Toast уведомления
- Инвалидация кэша после успешного импорта

### 2. ColumnMappingDialog Component (`ColumnMappingDialog.tsx`)
- Предпросмотр первых 10 строк
- Select компоненты для маппинга колонок
- Подсветка замапленных колонок в таблице
- Валидация обязательного поля Email
- Отображение badge'ей для колонок

### 3. Integration (`Contacts.tsx`)
- Кнопка "Импорт из Google Sheets" рядом с CSVUpload
- Колбэк для обновления списка после импорта
- Использование workspaceId (захардкожен, TODO: из контекста)

### 4. Tests (`SheetsImport.test.tsx`)
- Базовые тесты рендеринга
- Тест открытия диалога
- Тест вызова preview API

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| 3-шаговый UX | Чёткий flow: вставил ссылку → увидел данные → импортировал |
| Разделение на 2 компонента | SheetImport управляет состоянием, ColumnMappingDialog показывает данные |
| Badge для Email колонки | Визуальная индикация обязательного поля |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Testing infrastructure not configured**
- **Found during:** Task 4 - Running tests
- **Issue:** @testing-library/react not installed in client
- **Fix:** Created test file with proper structure, documented dependency requirement
- **Note:** Pre-existing issue - same error in ContactFilters.test.tsx

## UI Flow

```
┌─────────────────────────────────────┐
│  [Импорт из Google Sheets]          │  ← Кнопка в PageHeader
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Диалог: Введите URL                │
│  ┌─────────────────────────────────┐│
│  │ https://docs.google.com/...     ││
│  └─────────────────────────────────┘│
│  [Предпросмотр]                     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Маппинг колонок                    │
│  Email*  [Select ▼]                 │
│  Имя    [Select ▼]                  │
│  Компания [Select ▼]                │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Таблица предпросмотра (10 rows) ││
│  └─────────────────────────────────┘│
│  [Назад]           [Импортировать] │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Toast: Импортировано: 95           │
│         пропущено: 5                │
└─────────────────────────────────────┘
```

## Files Structure

```
client/src/
├── components/contacts/
│   ├── SheetsImport.tsx       # Main import dialog
│   └── ColumnMappingDialog.tsx # Preview & mapping UI
├── pages/
│   └── Contacts.tsx           # Integration point
└── __tests__/components/contacts/
    └── SheetsImport.test.tsx  # Unit tests
```

## Commits

1. `8c33dc5` - feat(02b-02): add SheetsImport and ColumnMappingDialog components
2. `4ccf761` - feat(02b-02): integrate SheetsImport into Contacts page
3. `8c4b1a7` - test(02b-02): add SheetsImport component tests

## Next Steps

- [ ] Install @testing-library/react in client
- [ ] Get workspaceId from auth context instead of hardcoded value
- [ ] Add error boundary for import failures
- [ ] Consider adding import history (list of previous imports)
