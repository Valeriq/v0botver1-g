# REQUIREMENTS: Web Interface MVP

## v1 Requirements

### DASH - Dashboard

- [ ] **DASH-01**: Отображение статистики (отправлено, открыто, ответов, leads) — **Phase 2**
- [ ] **DASH-02**: Список последних отправленных писем — **Phase 2**
- [ ] **DASH-03**: Быстрые ссылки на разделы — **Phase 2**

### CONT - Contacts

- [ ] **CONT-01**: Список контактов с пагинацией (25 на странице) — **Phase 2**
- [ ] **CONT-02**: Поиск по email/имени — **Phase 2**
- [ ] **CONT-03**: Фильтрация по статусу (active, bounced, unsubscribed) — **Phase 2**
- [ ] **CONT-04**: Загрузка CSV/TSV — **Phase 2**
- [ ] **CONT-05**: Удаление контакта — **Phase 2**

### EMAIL - Email Messages

- [ ] **EMAIL-01**: Список всех отправленных писем — **Phase 3**
- [ ] **EMAIL-02**: Фильтрация по дате — **Phase 3**
- [ ] **EMAIL-03**: Фильтрация по получателю — **Phase 3**
- [ ] **EMAIL-04**: Фильтрация по статусу (sent, delivered, opened, replied, bounced) — **Phase 3**
- [ ] **EMAIL-05**: Поиск по email — **Phase 3**

### THREAD - Thread View

- [ ] **THREAD-01**: Gmail-style цепочка писем — **Phase 3**
- [ ] **THREAD-02**: Визуальное разделение входящих/исходящих — **Phase 3**
- [ ] **THREAD-03**: Отображение lead статуса — **Phase 3**

### AIAG - AI Conversation Agent

- [ ] **AIAG-01**: Классификация ответов (interested/question/not_interested) — **Phase 4**
- [ ] **AIAG-02**: Авто-ответ на вопросы без подтверждения — **Phase 4**
- [ ] **AIAG-03**: Создание lead при заинтересованности — **Phase 4**
- [ ] **AIAG-04**: Уведомление человека о новом lead — **Phase 4**
- [ ] **AIAG-05**: Вежливое закрытие при отказе — **Phase 4**
- [ ] **AIAG-06**: История диалога в thread view — **Phase 4**
- [ ] **AIAG-07**: Индикатор AI-режима в thread — **Phase 4**

### TPL - Template Editor

- [ ] **TPL-01**: Текстовый редактор шаблонов — **Phase 5**
- [ ] **TPL-02**: Переменные {{first_name}}, {{company}}, {{website}} — **Phase 5**
- [ ] **TPL-03**: Предпросмотр с подставленными данными — **Phase 5**
- [ ] **TPL-04**: Сохранение/редактирование/удаление — **Phase 5**

### ACCT - Gmail Accounts

- [ ] **ACCT-01**: Список аккаунтов с статусами (ok, limit, blocked, auth_failed) — **Phase 5**
- [ ] **ACCT-02**: Цветовая индикация статуса — **Phase 5**
- [ ] **ACCT-03**: Добавление аккаунта через OAuth — **Phase 5**
- [ ] **ACCT-04**: Удаление аккаунта — **Phase 5**
- [ ] **ACCT-05**: Назначение аккаунтов workspace'ам — **Phase 5**

### LEAD - Leads Management

- [ ] **LEAD-01**: Список leads со статусами (new, taken, replied, closed) — **Phase 6**
- [ ] **LEAD-02**: Фильтрация по статусу — **Phase 6**
- [ ] **LEAD-03**: Детальный view с thread историей — **Phase 6**
- [ ] **LEAD-04**: Действия: take, close — **Phase 6**

### CAMP - Campaigns

- [ ] **CAMP-01**: Список кампаний — **Phase 6**
- [ ] **CAMP-02**: Просмотр деталей кампании — **Phase 6**
- [ ] **CAMP-03**: Статистика кампании — **Phase 6**

---

## v2 Requirements (отложено)

- Live reply из веба
- HTML email templates
- Аналитические графики
- A/B тестирование
- Экспорт данных

### AUTH - Authentication (Phase 7 - LAST)

- [ ] **AUTH-01**: OAuth 2.0 login (Google/Telegram) — **Phase 7**
- [ ] **AUTH-02**: Session persistence (HttpOnly cookies) — **Phase 7**
- [ ] **AUTH-03**: Logout functionality — **Phase 7**
- [ ] **AUTH-04**: Protected routes with auth guards — **Phase 7**
- [ ] **AUTH-05**: CSRF protection — **Phase 7**

---

## Out of Scope

- Team collaboration - один пользователь на workspace
- Мобильное приложение
- Rich text editor
- Real-time уведомления (пока polling)

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DASH-01 | Phase 2 | Pending |
| DASH-02 | Phase 2 | Pending |
| DASH-03 | Phase 2 | Pending |
| CONT-01 | Phase 2 | Pending |
| CONT-02 | Phase 2 | Pending |
| CONT-03 | Phase 2 | Pending |
| CONT-04 | Phase 2 | Pending |
| CONT-05 | Phase 2 | Pending |
| EMAIL-01 | Phase 3 | Pending |
| EMAIL-02 | Phase 3 | Pending |
| EMAIL-03 | Phase 3 | Pending |
| EMAIL-04 | Phase 3 | Pending |
| EMAIL-05 | Phase 3 | Pending |
| THREAD-01 | Phase 3 | Pending |
| THREAD-02 | Phase 3 | Pending |
| THREAD-03 | Phase 3 | Pending |
| TPL-01 | Phase 4 | Pending |
| TPL-02 | Phase 4 | Pending |
| TPL-03 | Phase 4 | Pending |
| TPL-04 | Phase 4 | Pending |
| ACCT-01 | Phase 4 | Pending |
| ACCT-02 | Phase 4 | Pending |
| ACCT-03 | Phase 4 | Pending |
| ACCT-04 | Phase 4 | Pending |
| ACCT-05 | Phase 4 | Pending |
| LEAD-01 | Phase 5 | Pending |
| LEAD-02 | Phase 5 | Pending |
| LEAD-03 | Phase 5 | Pending |
| LEAD-04 | Phase 5 | Pending |
| CAMP-01 | Phase 5 | Pending |
| CAMP-02 | Phase 5 | Pending |
| CAMP-03 | Phase 5 | Pending |
| AUTH-01 | Phase 6 | Pending |
| AUTH-02 | Phase 6 | Pending |
| AUTH-03 | Phase 6 | Pending |
| AUTH-04 | Phase 6 | Pending |
| AUTH-05 | Phase 6 | Pending |

**Coverage:** 32/32 v1 requirements mapped ✓
**Phase 6:** 5 authentication requirements (v2 scope, added for security)

---

*Last updated: 2026-03-07*
