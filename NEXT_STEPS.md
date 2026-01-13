# 🚀 Следующие шаги для Production

Все компоненты, не требующие внешних ключей, уже реализованы. Ниже список действий для полного запуска системы.

---

## ✅ Что уже готово

1. **Input Validation** - Zod схемы для всех API endpoints
2. **Rate Limiting** - Многоуровневая защита от abuse
3. **Error Handling** - Улучшенный error handler с request tracing
4. **Database Connection Pooling** - Оптимизированные подключения к PostgreSQL
5. **Request Logging** - Request ID для трейсинга
6. **API Documentation** - Полная документация в docs/API.md
7. **Production Configs** - Kubernetes манифесты и Docker setup
8. **Comprehensive Tests** - Jest тесты для всех сервисов
9. **CI/CD Pipeline** - GitHub Actions workflows

---

## 🔑 Что требует внешних ключей

### 1. Telegram Bot Token (5 минут)

**Где получить:**
1. Открой [@BotFather](https://t.me/BotFather) в Telegram
2. Отправь `/newbot`
3. Следуй инструкциям для создания бота
4. Получи токен в формате: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

**Где добавить:**
```bash
# В .env файл в корне проекта
TELEGRAM_BOT_TOKEN=ваш_токен_здесь
```

---

### 2. OpenAI API Key (5 минут)

**Где получить:**
1. Открой [platform.openai.com](https://platform.openai.com)
2. Зарегистрируйся или войди
3. Перейди в API Keys → Create new secret key
4. Скопируй ключ (начинается с `sk-`)

**Где добавить:**
```bash
# В .env файл
OPENAI_API_KEY=sk-...ваш_ключ
OPENAI_MODEL=gpt-4o-mini  # Или gpt-4, gpt-3.5-turbo
```

**Стоимость:**
- gpt-4o-mini: ~$0.15 за 1М tokens (дешевый)
- gpt-4: ~$30 за 1М tokens (качественный)

---

### 3. Google OAuth для Gmail (20-30 минут)

**Это самая сложная часть!** Нужна для отправки писем через Gmail API.

**Шаги:**

1. **Создай Google Cloud проект**
   - Открой [console.cloud.google.com](https://console.cloud.google.com)
   - Создай новый проект: "Cold Email Bot"

2. **Включи Gmail API**
   - В проекте: APIs & Services → Library
   - Найди "Gmail API" → Enable

3. **Настрой OAuth Consent Screen**
   - APIs & Services → OAuth consent screen
   - User Type: External
   - Заполни:
     - App name: "Cold Email Bot"
     - User support email: твой email
     - Developer contact: твой email
   - Scopes: добавь `gmail.send` и `gmail.readonly`

4. **Создай OAuth 2.0 Credentials**
   - APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Name: "Cold Email Bot"
   - Authorized redirect URIs:
     - `http://localhost:3001/auth/google/callback` (для локального теста)
     - `https://your-domain.com/auth/google/callback` (для production)
   - Скопируй Client ID и Client Secret

5. **Настрой Pub/Sub для получения ответов**
   - В Google Cloud Console: Pub/Sub → Topics
   - Create Topic: `gmail-notifications`
   - Create Subscription: `gmail-notifications-sub`
   - Скопируй полный путь топика

**Где добавить:**
```bash
# В .env файл
GOOGLE_CLIENT_ID=ваш-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=ваш-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
GMAIL_PUBSUB_TOPIC=projects/ваш-проект/topics/gmail-notifications
```

---

### 4. Perplexity API (опционально, 5 минут)

**Для чего:** Поиск информации о компаниях контактов (улучшает персонализацию)

**Где получить:**
1. Открой [perplexity.ai](https://www.perplexity.ai)
2. Создай аккаунт
3. API Settings → Generate API Key

**Где добавить:**
```bash
# В .env файл
PERPLEXITY_API_KEY=pplx-...ваш_ключ
```

---

### 5. Sentry для мониторинга ошибок (10 минут, опционально)

**Где получить:**
1. Открой [sentry.io](https://sentry.io)
2. Создай аккаунт (есть бесплатный tier)
3. Create Project → Node.js
4. Скопируй DSN

**Где добавить:**
```bash
# В .env файл
SENTRY_DSN=https://...@sentry.io/...
NODE_ENV=production
```

**Альтернатива:** Self-hosted Sentry (бесплатно, но требует отдельный сервер)

---

## 📦 Запуск после получения ключей

### Локальный запуск

```bash
# 1. Склонируй проект с GitHub
git clone https://github.com/Valerig/v0-ai-cold-email-bot.git
cd v0-ai-cold-email-bot

# 2. Создай .env файл
cp .env.example .env

# 3. Добавь все ключи в .env (см. выше)

# 4. Запусти через Docker Compose
docker-compose up --build

# 5. В другом терминале: запусти миграции
docker-compose exec core-api npm run migrate

# 6. Проверь что всё работает
curl http://localhost:3000/health
```

### Проверка работы

```bash
# Все сервисы должны быть healthy
docker-compose ps

# Проверь логи
docker-compose logs -f telegram-bot
docker-compose logs -f core-api

# Telegram бот должен ответить на /start
# Открой своего бота в Telegram и напиши /start
```

---

## 🌐 Публичный доступ (для Gmail webhook)

Gmail Pub/Sub требует публичный HTTPS endpoint. Варианты:

### Вариант 1: Cloudflare Tunnel (бесплатно, проще всего)

```bash
# Установи cloudflared
brew install cloudflare/cloudflare/cloudflared  # macOS
# или скачай с cloudflare.com для Windows/Linux

# Запусти туннель
cloudflared tunnel --url http://localhost:3001

# Получишь URL вида: https://xxx-xxx.trycloudflare.com
# Обнови GOOGLE_REDIRECT_URI в .env на этот URL
```

### Вариант 2: ngrok (бесплатно, 8 часов лимит)

```bash
# Установи ngrok
brew install ngrok  # macOS

# Запусти туннель
ngrok http 3001

# Получишь URL вида: https://xxx.ngrok-free.app
```

### Вариант 3: Deploy на реальный сервер (см. PRODUCTION.md)

---

## 🧪 Тестирование

После запуска протестируй основной flow:

1. **Создай workspace**
   - В Telegram: `/start`
   - Должен создаться workspace

2. **Загрузи контакты**
   - В Telegram: Меню → База → Загрузить CSV
   - Отправь CSV файл с контактами

3. **Создай Prompt Profile**
   - Меню → AI → Создать профиль
   - Задай инструкции для генерации писем

4. **Запусти кампанию**
   - Меню → Кампании → Создать
   - Выбери контакты и запусти

5. **Проверь отправку**
   - Смотри логи: `docker-compose logs -f worker`
   - Проверь Gmail: письма должны уходить

6. **Симулируй ответ**
   - Ответь на письмо
   - Через несколько минут должно прийти уведомление о лиде

---

## 🚨 Troubleshooting

### Проблема: "Database connection failed"

```bash
# Проверь что PostgreSQL запущен
docker-compose ps postgres

# Проверь подключение
docker-compose exec postgres psql -U postgres -d cold_email_bot -c "SELECT 1"
```

### Проблема: "Redis connection refused"

```bash
# Проверь Redis
docker-compose ps redis

# Проверь ping
docker-compose exec redis redis-cli ping
# Должно вернуть: PONG
```

### Проблема: "Telegram bot not responding"

```bash
# Проверь токен
echo $TELEGRAM_BOT_TOKEN

# Проверь логи бота
docker-compose logs telegram-bot

# Проверь webhook status
curl https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo
```

### Проблема: "Gmail OAuth not working"

1. Проверь redirect URI в Google Console
2. Убедись что Client ID/Secret правильные
3. Проверь что Gmail API enabled
4. Попробуй перезагрузить сервис

---

## 📊 Мониторинг Production

После деплоя настрой мониторинг:

1. **Grafana Dashboard** - визуализация метрик (см. monitoring/grafana-dashboard.json)
2. **Prometheus Alerts** - алерты о проблемах (см. monitoring/alerts.yml)
3. **Sentry** - отслеживание ошибок в реальном времени
4. **Database backups** - автоматические бэкапы (см. scripts/backup-db.sh)

---

## 🎯 Checklist перед production

- [ ] Все API ключи добавлены в secrets manager (не в .env!)
- [ ] HTTPS настроен с валидным сертификатом
- [ ] Database backups настроены и протестированы
- [ ] Rate limiting протестирован
- [ ] Error monitoring (Sentry) настроен
- [ ] Gmail OAuth протестирован с реальными аккаунтами
- [ ] Webhook для Gmail Pub/Sub работает
- [ ] Capacity planning: достаточно ресурсов для планируемой нагрузки
- [ ] Monitoring dashboards настроены
- [ ] Документация обновлена для команды

---

## 💡 Советы

1. **Начни с малого**: Запусти локально с 1-2 Gmail аккаунтами и небольшой базой контактов
2. **Тестируй на себе**: Отправь первые кампании на свои email адреса
3. **Мониторь квоты**: Gmail имеет жесткие лимиты - следи за ними
4. **Бэкапь базу**: Регулярно делай бэкапы PostgreSQL
5. **Читай логи**: Все ошибки логируются с request-id - используй их для debugging

---

## 📞 Поддержка

Если возникли проблемы, смотри:
- **TROUBLESHOOTING.md** - детальное решение частых проблем
- **ARCHITECTURE.md** - как устроена система
- **API.md** - API документация
- **PRODUCTION.md** - production deployment guide

Удачного запуска! 🚀
