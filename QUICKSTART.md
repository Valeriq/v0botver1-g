# Быстрый старт для тестирования в Telegram

Эта инструкция поможет вам запустить систему и протестировать её через свой Telegram за 10 минут.

## Шаг 1: Создайте Telegram бота (2 минуты)

1. Откройте Telegram и найдите [@BotFather](https://t.me/botfather)
2. Отправьте команду `/newbot`
3. Следуйте инструкциям:
   - Введите имя бота (например: "My Cold Email Bot")
   - Введите username бота (должен заканчиваться на `bot`, например: `my_cold_email_bot`)
4. **Сохраните токен**, который вы получите (выглядит как `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

## Шаг 2: Узнайте свой Telegram ID (1 минута)

1. Откройте Telegram и найдите [@userinfobot](https://t.me/userinfobot)
2. Нажмите Start или отправьте любое сообщение
3. **Сохраните ваш ID** (число вида `123456789`)

## Шаг 3: Получите OpenAI API ключ (3 минуты)

1. Перейдите на [platform.openai.com](https://platform.openai.com/api-keys)
2. Войдите или зарегистрируйтесь
3. Нажмите "Create new secret key"
4. **Сохраните ключ** (начинается с `sk-...`)
5. Убедитесь, что у вас есть кредиты на балансе (минимум $5)

## Шаг 4: Настройте проект (2 минуты)

```bash
# Клонируйте проект (или распакуйте ZIP)
cd ai-cold-email-bot

# Создайте файл конфигурации
cp .env.example .env
```

Откройте файл `.env` в любом текстовом редакторе и замените:

```env
# Вставьте токен из Шага 1
TELEGRAM_BOT_TOKEN=7631533721:AAHgroaH4CGTpjraoJxUlYLAFsR3Q-uSuqM

# Вставьте ваш ID из Шага 2
ADMIN_TELEGRAM_IDS=ваш_telegram_id

# Вставьте ключ из Шага 3
OPENAI_API_KEY=sk-proj-xxx...

DATABASE_URL=postgresql://postgres:postgres@postgres:5432/cold_email_bot
REDIS_URL=redis://redis:6379
CORE_API_URL=http://core-api:3000
GMAIL_SERVICE_URL=http://gmail-service:3001
AI_ORCHESTRATOR_URL=http://ai-orchestrator:3002
OPENAI_MODEL=gpt-4o-mini

# Google OAuth - оставьте пустым для начала (нужно только для отправки email)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/oauth/callback
```

## Шаг 5: Запустите систему (2 минуты)

```bash
# Запустите все сервисы
docker-compose -f docker-compose.dev.yml up -d

# Подождите 30 секунд пока все запустится

# Проверьте что всё работает
docker-compose -f docker-compose.dev.yml ps
```

Вы должны увидеть все сервисы в статусе `Up` или `running`.

## Шаг 6: Протестируйте в Telegram! 🎉

### 6.1 Создание workspace

1. Откройте Telegram
2. Найдите вашего бота (по username из Шага 1)
3. Нажмите **Start** или отправьте `/start`
4. Вы должны увидеть приветственное сообщение

### 6.2 Откройте меню

Отправьте `/menu` - вы увидите главное меню с кнопками:
- 📇 База контактов
- 🤖 AI настройки
- 📧 Кампании
- 💎 Лиды
- 💰 Баланс

### 6.3 Загрузите контакты

1. Создайте CSV файл `test-contacts.csv`:
```csv
email,first_name,last_name,company,website
john@example.com,John,Doe,Example Corp,example.com
jane@test.com,Jane,Smith,Test Inc,test.com
bob@demo.org,Bob,Johnson,Demo LLC,demo.org
```

2. В Telegram:
   - Нажмите **📇 База контактов**
   - Нажмите **➕ Загрузить CSV**
   - Отправьте файл `test-contacts.csv`
   - Система обработает файл и покажет сколько контактов добавлено

3. Проверьте список:
   - Нажмите **📋 Список контактов**
   - Вы увидите загруженные контакты

### 6.4 Создайте AI профиль

1. В меню нажмите **🤖 AI настройки**
2. Нажмите **➕ Создать профиль**
3. Введите название, например: `Test Profile`
4. Введите инструкции для AI:
```
You are a professional sales representative. Write concise, friendly cold emails.
Focus on value proposition. Keep it under 150 words.
```

### 6.5 Посмотрите метрики (для админов)

Если ваш ID в `ADMIN_TELEGRAM_IDS`, вы увидите дополнительную кнопку:
- **⚙️ Админ-панель** - просмотр всех клиентов и Gmail аккаунтов

## Что работает БЕЗ Gmail?

Без настройки Google OAuth вы можете тестировать:
- ✅ Загрузку и управление контактами
- ✅ Создание AI профилей
- ✅ Создание кампаний (через API)
- ✅ Генерацию email текстов (задачи будут выполняться, но письма не отправятся)
- ✅ Просмотр метрик и статистики

## Что НЕ работает БЕЗ Gmail?

- ❌ Реальная отправка email
- ❌ Получение ответов
- ❌ Создание лидов из ответов
- ❌ Live reply через Telegram

## Настройка Gmail (опционально)

Если хотите тестировать полный функционал:

### 1. Google Cloud Console

1. Перейдите на [console.cloud.google.com](https://console.cloud.google.com)
2. Создайте новый проект
3. Включите Gmail API:
   - Меню → APIs & Services → Library
   - Найдите "Gmail API" и нажмите Enable

### 2. OAuth Credentials

1. APIs & Services → Credentials
2. Create Credentials → OAuth client ID
3. Application type: **Web application**
4. Name: `AI Cold Email Bot`
5. Authorized redirect URIs: 
   - `http://localhost:3001/oauth/callback`
6. Скопируйте **Client ID** и **Client Secret**

### 3. OAuth Consent Screen

1. APIs & Services → OAuth consent screen
2. User Type: **External** (для тестирования)
3. Заполните обязательные поля:
   - App name: `AI Cold Email Bot`
   - User support email: ваш email
   - Developer contact: ваш email
4. Scopes → Add or Remove Scopes:
   - Найдите и добавьте `gmail.send`
   - Найдите и добавьте `gmail.readonly`
5. Test users → Add Users:
   - Добавьте свой Gmail адрес

### 4. Обновите .env

```env
GOOGLE_CLIENT_ID=ваш_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-ваш_client_secret
```

### 5. Перезапустите сервисы

```bash
docker-compose -f docker-compose.dev.yml restart gmail-service
```

### 6. Подключите Gmail аккаунт

1. Откройте браузер: http://localhost:3001/oauth/authorize?workspace_id=YOUR_WORKSPACE_ID
   - `YOUR_WORKSPACE_ID` найдите в базе данных (см. ниже)
2. Войдите в Google и разрешите доступ
3. После успешной авторизации аккаунт появится в системе

## Полезные команды

### Просмотр логов

```bash
# Все сервисы
docker-compose -f docker-compose.dev.yml logs -f

# Только Telegram бот
docker-compose -f docker-compose.dev.yml logs -f telegram-bot

# Только Worker (задачи)
docker-compose -f docker-compose.dev.yml logs -f worker
```

### Проверка базы данных

```bash
# Подключение к БД
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d cold_email_bot

# Посмотреть workspace ID
SELECT id, telegram_user_id, created_at FROM workspaces;

# Посмотреть контакты
SELECT email, first_name, last_name FROM contacts LIMIT 10;

# Посмотреть задачи в очереди
SELECT id, type, status, created_at FROM queue_jobs ORDER BY created_at DESC LIMIT 10;

# Выход
\q
```

### Остановка и очистка

```bash
# Остановить все сервисы
docker-compose -f docker-compose.dev.yml down

# Остановить и удалить данные
docker-compose -f docker-compose.dev.yml down -v

# Полная перезагрузка
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d --build
```

## Тестирование через API (для продвинутых)

### Получить workspace ID

```bash
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d cold_email_bot -c "SELECT id FROM workspaces WHERE telegram_user_id = 'YOUR_TELEGRAM_ID';"
```

### Создать кампанию

```bash
# Сначала получите ID профиля и контактов
curl http://localhost:3000/api/workspaces/WORKSPACE_ID/prompt-profiles
curl http://localhost:3000/api/workspaces/WORKSPACE_ID/contacts

# Создайте кампанию
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "WORKSPACE_ID",
    "name": "Test Campaign",
    "prompt_profile_id": "PROFILE_ID",
    "steps": [
      {"template": "Cold outreach", "delay_hours": 0},
      {"template": "Follow-up", "delay_hours": 48}
    ]
  }'
```

### Добавить получателей и запустить

```bash
# Добавить контакты в кампанию
curl -X POST http://localhost:3000/api/campaigns/CAMPAIGN_ID/recipients \
  -H "Content-Type: application/json" \
  -d '{
    "contact_ids": ["CONTACT_ID_1", "CONTACT_ID_2"]
  }'

# Запустить кампанию
curl -X POST http://localhost:3000/api/campaigns/CAMPAIGN_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

### Наблюдать за выполнением

```bash
# Задачи в очереди
docker-compose -f docker-compose.dev.yml exec redis redis-cli LLEN queue:generate

# Логи worker
docker-compose -f docker-compose.dev.yml logs -f worker

# Статистика кампании
curl http://localhost:3000/api/campaigns/CAMPAIGN_ID/stats
```

## Решение проблем

### Бот не отвечает

1. Проверьте токен в `.env`
2. Посмотрите логи: `docker-compose -f docker-compose.dev.yml logs telegram-bot`
3. Перезапустите: `docker-compose -f docker-compose.dev.yml restart telegram-bot`

### Задачи не выполняются

1. Проверьте worker: `docker-compose -f docker-compose.dev.yml logs worker`
2. Проверьте Redis: `docker-compose -f docker-compose.dev.yml exec redis redis-cli ping`
3. Проверьте очередь: `docker-compose -f docker-compose.dev.yml exec redis redis-cli LLEN queue:generate`

### Ошибки OpenAI

1. Проверьте API ключ: `echo $OPENAI_API_KEY`
2. Проверьте баланс на [platform.openai.com/usage](https://platform.openai.com/usage)
3. Посмотрите логи AI orchestrator: `docker-compose -f docker-compose.dev.yml logs ai-orchestrator`

### База данных не доступна

1. Проверьте PostgreSQL: `docker-compose -f docker-compose.dev.yml ps postgres`
2. Проверьте логи: `docker-compose -f docker-compose.dev.yml logs postgres`
3. Пересоздайте: `docker-compose -f docker-compose.dev.yml up -d --force-recreate postgres`

## Следующие шаги

После успешного тестирования базового функционала:

1. Настройте Gmail OAuth для полной функциональности
2. Изучите [API.md](docs/API.md) для интеграции через API
3. Прочитайте [ARCHITECTURE.md](docs/ARCHITECTURE.md) для понимания системы
4. Изучите [DEPLOYMENT.md](docs/DEPLOYMENT.md) для production развертывания

## Поддержка

Если что-то не работает:
1. Проверьте все ли сервисы запущены: `docker-compose -f docker-compose.dev.yml ps`
2. Посмотрите логи проблемного сервиса
3. Убедитесь что все API ключи корректны в `.env`
4. Попробуйте полную перезагрузку системы
