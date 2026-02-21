# 🚀 Быстрый старт тестирования

## Что вам понадобится

✅ **У вас уже есть:**
- Telegram Bot Token (получите от @BotFather)
- Проект на GitHub

⚠️ **Нужно установить (если еще нет):**
- Docker Desktop - https://www.docker.com/products/docker-desktop/
- Git - https://git-scm.com/downloads

---

## Шаг 1: Скачайте проект

Откройте терминал (командную строку) и выполните:

```bash
# Клонируйте репозиторий
git clone https://github.com/Valerig/v0-ai-cold-email-bot.git

# Перейдите в папку проекта
cd v0-ai-cold-email-bot
```

---

## Шаг 2: Создайте .env файл

Создайте файл `.env` в корне проекта и добавьте туда:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=aibot
POSTGRES_PASSWORD=aibot_secret_pass
POSTGRES_DATABASE=cold_email_bot
DATABASE_URL=postgresql://aibot:aibot_secret_pass@postgres:5432/cold_email_bot

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# API URLs (для docker-compose)
CORE_API_URL=http://core-api:3000
GMAIL_SERVICE_URL=http://gmail-service:3001
AI_ORCHESTRATOR_URL=http://ai-orchestrator:3002

# Пока без ключей - базовое тестирование
OPENAI_API_KEY=sk-test-placeholder
```

**Быстрый способ (команда):**
```bash
cp .env.example .env
```
Затем отредактируйте `.env` и замените `your_telegram_bot_token_here` на ваш токен.

---

## Шаг 3: Запустите систему

```bash
# Запустите все сервисы
docker-compose up --build
```

**Что произойдет:**
- Docker скачает все необходимые образы (первый раз займет 5-10 минут)
- Запустятся 8 сервисов: PostgreSQL, Redis, Core API, Telegram Bot, Worker, Gmail Service, AI Orchestrator, Observability
- В терминале появятся логи всех сервисов

**Дождитесь сообщения:**
```
telegram-bot | ✅ Telegram bot connected
core-api     | ✅ Server listening on port 3000
```

---

## Шаг 4: Протестируйте в Telegram

### 4.1 Откройте вашего бота
Найдите бота в Telegram по username (который вы указывали при создании бота в BotFather)

### 4.2 Отправьте команду `/start`
Бот должен:
- Создать для вас workspace
- Показать приветственное сообщение
- Отобразить главное меню с кнопками

### 4.3 Что можно протестировать БЕЗ OpenAI и Gmail:

✅ **База контактов:**
- Нажмите кнопку "База" в меню
- Добавьте контакт вручную (email, имя, фамилия, компания)
- Посмотрите список контактов
- Удалите контакт

✅ **Загрузка CSV:**
Создайте тестовый CSV файл:
```csv
email,first_name,last_name,company
test@example.com,Иван,Иванов,Тест Компания
```
- В меню "База" → "Загрузить CSV"
- Отправьте файл боту
- Система импортирует контакты

✅ **AI Профили (создание):**
- Нажмите "AI" в меню
- Создайте prompt profile с инструкциями для AI
- Посмотрите список профилей

✅ **Кампании (просмотр):**
- Нажмите "Кампании"
- Создайте кампанию (она не запустится без OpenAI, но структура сохранится)
- Посмотрите статус

✅ **Баланс:**
- Нажмите "Баланс"
- Увидите начальный баланс 0.00
- Посмотрите историю транзакций

---

## Шаг 5: Проверка логов

В терминале вы увидите логи в реальном времени:

```
telegram-bot | [INFO] User 123456789 sent /start
core-api     | [INFO] POST /workspaces - 201
postgres     | [INFO] Connected to database
```

**Чтобы остановить систему:**
Нажмите `Ctrl+C` в терминале

**Чтобы запустить заново:**
```bash
docker-compose up
```

---

## Что НЕ будет работать без дополнительных ключей

❌ **Без OpenAI API Key:**
- Генерация персонализированных писем
- Классификация ответов (определение лидов)
- Perplexity поиск информации о компаниях

❌ **Без Gmail OAuth:**
- Отправка реальных email
- Получение ответов от контактов
- Push-уведомления о новых письмах

**Но базовая функциональность (управление контактами, создание кампаний, работа с ботом) работает полностью!**

---

## Следующие шаги для полного функционала

1. **Получите OpenAI API Key** - см. файл `NEXT_STEPS.md` раздел "OpenAI Setup"
2. **Настройте Gmail OAuth** - см. файл `NEXT_STEPS.md` раздел "Google OAuth Setup"
3. Добавьте ключи в `.env` файл
4. Перезапустите: `docker-compose restart`

---

## Проблемы?

### Docker не запускается
```bash
# Проверьте, что Docker Desktop запущен
docker --version
docker-compose --version
```

### Порт занят
Если порт 3000 или 5432 уже используется, измените в `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # вместо 3000:3000
```

### Бот не отвечает
1. Проверьте логи: `docker-compose logs telegram-bot`
2. Убедитесь, что токен правильный в `.env`
3. Перезапустите: `docker-compose restart telegram-bot`

### База данных не создается
```bash
# Пересоздайте контейнеры
docker-compose down -v
docker-compose up --build
```

---

## Полезные команды

```bash
# Посмотреть логи конкретного сервиса
docker-compose logs -f telegram-bot

# Перезапустить один сервис
docker-compose restart telegram-bot

# Остановить всё и удалить данные
docker-compose down -v

# Посмотреть запущенные контейнеры
docker ps
```

---

**Готово!** Теперь вы можете тестировать бота в Telegram. Базовая функциональность (контакты, меню, команды) работает без дополнительных настроек.
