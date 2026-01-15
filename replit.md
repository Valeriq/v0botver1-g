## Project Context
See PROJECT_CONTEXT.md for shared project documentation.

## Preferences
- Все комментарии и сообщения на русском языке
- Используй async/await вместо callbacks
- React компоненты должны быть функциональными
- Не редактируй файлы без явного запроса

## Project Overview
AI Cold Email Bot - система для автоматизированных email-рассылок с микросервисной архитектурой.

### Структура проекта
- `client/` - React фронтенд
- `server/` - Express бэкенд
- `services/` - микросервисы (core-api, telegram-bot, gmail-service, ai-orchestrator, worker)
- `shared/` - общая схема данных (Drizzle ORM)

### Загрузка контактов
- Поддерживаются форматы: **Excel (.xlsx, .xls)** и **CSV**
- CSV: автоопределение разделителя (запятая, точка с запятой, табуляция)
- Гибкий поиск колонок (email/почта/емейл, first_name/имя, last_name/фамилия, company/компания, website/сайт)
- Файлы загружаются в Supabase Storage (bucket "csv-files")
- Body limit: 50MB для больших файлов
