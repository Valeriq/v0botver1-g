# PROJECT: v0botver1-g Web Interface

## Vision

**Аутрич-сервис с человекоподобной рассылкой** — веб-интерфейс для управления email-кампаниями. Сначала проектируем в вебе, тестируем, затем переносим в Telegram бот.

## Core Value

**Один workspace = один кабинет клиента** с полным контролем над email-аутричем: от загрузки контактов до анализа ответов.

## Key Context

### Что это за сервис
Это НЕ спам-рассылка. Это **человекоподобный аутрич** — персонализированные письма, осмысленные follow-up'ы, работа с ответами как с реальными диалогами.

### Текущее состояние
- Telegram бот — основной UI
- 6 микросервисов (core-api, telegram-bot, worker, gmail-service, ai-orchestrator, observability)
- PostgreSQL + Redis
- React + Vite в `client/` (неактивен)

### Куда движемся
Веб-интерфейс → тестирование → перенос UX в Telegram бот

---

## Requirements

### Validated

- ✓ Workspace management (через Telegram)
- ✓ Contact upload (CSV/TSV)
- ✓ Campaign creation with multi-step follow-ups
- ✓ Gmail OAuth и отправка
- ✓ AI email generation
- ✓ Reply classification
- ✓ Lead management
- ✓ Billing system

### Active

#### Web Interface — Phase 1

**Кабинет клиента (Dashboard)**
- [ ] Общая статистика: отправлено, открыто, ответов, leads
- [ ] Список контактов (пагинация по 25)
- [ ] Все отправленные письма с фильтрацией:
  - По дате
  - По получателю
  - По статусу (sent, delivered, opened, replied, bounced)
- [ ] Поиск по email/имени

**Переписка (Thread View)**
- [ ] Gmail-style thread view — цепочка писем
- [ ] История всего диалога с контактом
- [ ] Визуальное разделение: исходящие / входящие

**Редактор шаблонов**
- [ ] Простой текстовый редактор
- [ ] Переменные подстановки: `{{first_name}}`, `{{company}}`, `{{website}}`
- [ ] Предпросмотр с подставленными данными
- [ ] Сохранение/редактирование/удаление шаблонов

**Управление Gmail аккаунтами**
- [ ] Список аккаунтов с статусами (ok, limit, blocked, auth_failed)
- [ ] Добавление аккаунта через OAuth flow в вебе
- [ ] Удаление аккаунта
- [ ] Назначение аккаунтов workspace'ам
- [ ] Отображение лимитов/health

**Leads и ответы**
- [ ] Список leads со статусами (new, taken, replied, closed)
- [ ] Фильтрация по статусу
- [ ] Детальный view с thread историей
- [ ] Быстрые действия: take, close

### Out of Scope (v1)

- HTML email templates (пока plain text)
- Аналитические графики и charts
- A/B тестирование
- Team collaboration (множественные пользователи на workspace)
- Мобильное приложение
- Live reply из веба (пока только просмотр)

---

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + Vite (существующий) | Переиспользовать `client/`, не создавать новый стек | — Pending |
| Plain text templates | Простота MVP, HTML сложнее в рендере email клиентов | — Pending |
| OAuth в вебе | Нативный UX для Google OAuth, лучше чем через Telegram | — Pending |
| Thread view | Пользователи привыкли к Gmail-стилю | — Pending |

---

## Constraints

- **Бюджет:** Минимизация затрат на AI (использовать gpt-4o-mini где возможно)
- **Время:** MVP за 2-3 недели
- **Технологии:** Только существующий стек (React, TypeScript, Tailwind)
- **Безопасность:** Секреты не коммитить, .env не логировать

---

## Success Metrics

1. Пользователь может управлять кампаниями полностью из веба
2. OAuth Gmail работает через веб
3. Thread view корректно отображает диалоги
4. Все API endpoints покрыты тестами

---

*Last updated: 2025-03-07 after initialization*
