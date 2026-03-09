# Текущее состояние проекта (WORKING VERSION)

**Дата:** 09.03.2026
**Статус:** ✅ Frontend работает локально с mock-данными

---

## 🚀 Как запустить

```powershell
# В отдельном окне PowerShell
cd "C:\Users\HP i5 1135\v0botver1-g\client"
pnpm dev

# Открыть в браузере: http://localhost:5173
```

---

## ✅ Что работает

### Страницы с mock-данными (без бэкенда)

| Маршрут | Страница | Статус | Mock данные |
|---------|----------|--------|-------------|
| `/` | Dashboard | ✅ Работает | ✅ 4 KPI карточки |
| `/contacts` | Контакты | ✅ Работает | ✅ 8 контактов |
| `/emails` | Письма | ✅ Работает | ✅ 7 писем |
| `/thread/1` | Переписка с Иваном | ✅ Работает | ✅ 2 письма |
| `/thread/4` | Переписка с Еленой | ✅ Работает | ✅ 2 письма |
| `/campaigns` | Кампании | ⚠️ UI есть | ❌ Нет mock |
| `/ai-profiles` | AI профили | ⚠️ UI есть | ❌ Нет mock |
| `/leads` | Лиды | ⚠️ UI есть | ❌ Нет mock |
| `/gmail-accounts` | Gmail аккаунты | ⚠️ UI есть | ❌ Нет mock |

### Компоненты

- ✅ **Sidebar** — навигация слева (7 пунктов меню)
- ✅ **Header** — шапка сверху
- ✅ **KPI Cards** — карточки с метриками
- ✅ **Tables** — таблицы с пагинацией (TanStack Table)
- ✅ **Filters** — фильтры по статусу и поиск
- ✅ **Thread View** — просмотр переписки

---

## 📦 Технологический стек

| Компонент | Версия | Примечание |
|-----------|--------|------------|
| Vite | 7.3.1 | Bundler |
| React | 19.0.0 | UI Framework |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.4.0 | Стили |
| shadcn/ui | latest | UI компоненты |
| TanStack Query | 5.x | Data fetching |
| TanStack Table | 8.x | Таблицы |
| Zustand | 5.x | State management |
| wouter | 3.9.0 | Routing |
| Lucide React | 0.562.0 | Иконки |

---

## 🔧 Ключевые файлы

### Конфигурация
- `client/vite.config.ts` — конфиг Vite
- `client/tailwind.config.ts` — конфиг Tailwind (content path исправлен)
- `client/postcss.config.js` — PostCSS
- `client/src/index.css` — глобальные стили и CSS переменные

### Страницы
- `client/src/pages/Dashboard.tsx` — главная с KPI
- `client/src/pages/Contacts.tsx` — таблица контактов
- `client/src/pages/Emails.tsx` — таблица писем
- `client/src/pages/Thread.tsx` — просмотр переписки
- `client/src/pages/Campaigns.tsx` — кампании (требует mock)
- `client/src/pages/AIProfiles.tsx` — AI профили (требует mock)
- `client/src/pages/Leads.tsx` — лиды (требует mock)
- `client/src/pages/GmailAccounts.tsx` — Gmail (требует mock)

### Компоненты
- `client/src/components/layout/AppLayout.tsx` — обертка с Sidebar
- `client/src/components/layout/Sidebar.tsx` — боковое меню
- `client/src/components/layout/Header.tsx` — шапка

### API & Mock
- `client/src/lib/apiClient.ts` — API клиент с mock режимом (`USE_MOCKS = true`)
- `client/src/lib/mockData.ts` — mock данные для разработки

### State
- `client/src/stores/uiStore.ts` — Zustand store (sidebar, theme)
- `client/src/contexts/AuthContext.tsx` — Auth context

---

## 🐛 Исправленные проблемы

### 1. Tailwind CSS не работал
**Причина:** Неверный путь к content в `tailwind.config.ts`

```diff
- content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
+ content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
```

### 2. Отсутствовал Sidebar
**Причина:** Страницы не обернуты в `AppLayout`

**Решение:** Добавлен `AppLayout` во все страницы:
- Dashboard.tsx
- Contacts.tsx
- Emails.tsx
- Thread.tsx

### 3. JSX ошибка в Thread.tsx
**Причина:** Отсутствовал закрывающий `</div>`

**Решение:** Добавлен закрывающий тег перед `</AppLayout>`

---

## 📋 TODO (следующие шаги)

### Приоритет 1: Mock данные для остальных страниц
- [ ] Добавить mock для `/campaigns`
- [ ] Добавить mock для `/ai-profiles`
- [ ] Добавить mock для `/leads`
- [ ] Добавить mock для `/gmail-accounts`

### Приоритет 2: Подключение к бэкенду
- [ ] Установить `USE_MOCKS = false` в `apiClient.ts`
- [ ] Поднять Docker контейнеры (postgres, redis, core-api)
- [ ] Проверить API endpoints

### Приоритет 3: Функционал
- [ ] CSV upload для контактов
- [ ] Создание кампаний
- [ ] Создание AI профилей
- [ ] Отправка писем

---

## 🌐 Переменные окружения

### Frontend (опционально)
```env
# client/.env
VITE_API_URL=http://localhost:3000
```

Сейчас не требуется, так как `USE_MOCKS = true`.

### Backend (для продакшена)
См. `.env.example` в корне проекта.

---

## 📝 Примечания

- Mock режим включен по умолчанию для работы без бэкенда
- Все mock данные на русском языке
- Интерфейс полностью на русском
- Tailwind использует CSS переменные для темизации
- Поддержка dark mode подготовлена (через class)

---

**Последнее обновление:** 09.03.2026, 18:50
**Автор:** AI Assistant
