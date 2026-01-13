# Как разместить проект на GitHub

Существует два способа загрузить этот проект на GitHub.

---

## Способ 1: Через интерфейс v0 (Автоматический) ⚡

Это самый простой и быстрый способ.

### Шаги:

1. **Откройте боковую панель**
   - Нажмите на иконку настроек слева в интерфейсе v0
   - Или найдите раздел **Settings**

2. **Подключите GitHub**
   - Найдите секцию **GitHub Repository**
   - Нажмите кнопку **Connect GitHub**
   - Авторизуйтесь в своем GitHub аккаунте

3. **Создайте репозиторий**
   - Введите название репозитория: `ai-cold-email-bot`
   - Выберите приватный или публичный репозиторий
   - Нажмите **Create**

4. **Готово!**
   - v0 автоматически запушит весь код в ваш новый GitHub репозиторий
   - Все дальнейшие изменения будут автоматически синхронизироваться

### Преимущества:
- Автоматическая синхронизация изменений
- Не нужно устанавливать Git локально
- Работает прямо из браузера

---

## Способ 2: Скачать и загрузить вручную 📦

Если Способ 1 не работает или вы хотите больше контроля.

### Шаг 1: Скачать проект

1. В интерфейсе v0 найдите блок с кодом
2. Нажмите на три точки **⋯** в правом верхнем углу
3. Выберите **Download ZIP**
4. Сохраните файл `ai-cold-email-bot.zip`

### Шаг 2: Подготовить проект

Распакуйте ZIP-файл в удобное место на компьютере:

```bash
# Windows
# Щелкните правой кнопкой → Извлечь все

# macOS / Linux
unzip ai-cold-email-bot.zip
cd ai-cold-email-bot
```

### Шаг 3: Создать репозиторий на GitHub

1. Зайдите на [github.com](https://github.com)
2. Нажмите на **+** в правом верхнем углу → **New repository**
3. Заполните:
   - **Repository name:** `ai-cold-email-bot`
   - **Description:** AI Cold Email Bot - Automated email campaigns with Telegram interface
   - **Visibility:** Private (рекомендуется для проектов с API ключами)
4. **НЕ** добавляйте README, .gitignore или license (они уже есть в проекте)
5. Нажмите **Create repository**

### Шаг 4: Загрузить код

GitHub покажет инструкции. Используйте вариант **"push an existing repository"**:

```bash
# Перейдите в папку проекта
cd ai-cold-email-bot

# Инициализируйте Git (если еще не сделано)
git init

# Добавьте все файлы
git add .

# Создайте первый коммит
git commit -m "Initial commit: AI Cold Email Bot MVP"

# Добавьте ссылку на ваш GitHub репозиторий
# Замените YOUR_USERNAME на ваше имя пользователя GitHub
git remote add origin https://github.com/YOUR_USERNAME/ai-cold-email-bot.git

# Переименуйте ветку в main
git branch -M main

# Загрузите код
git push -u origin main
```

### Шаг 5: Проверка

1. Обновите страницу вашего репозитория на GitHub
2. Вы должны увидеть все файлы проекта
3. Готово! Код теперь на GitHub

---

## После загрузки на GitHub

### Клонировать проект на другой компьютер:

```bash
git clone https://github.com/YOUR_USERNAME/ai-cold-email-bot.git
cd ai-cold-email-bot
```

### Запустить проект локально:

```bash
# 1. Создать .env файл
cp .env.example .env

# 2. Добавить ваш Telegram Bot Token в .env
# TELEGRAM_BOT_TOKEN=ваш_токен_тут

# 3. Запустить все сервисы
docker-compose up --build

# 4. В другом терминале - запустить миграции
docker-compose exec core-api npm run migrate
```

### Обновить код на GitHub:

После внесения изменений в проект:

```bash
git add .
git commit -m "Описание изменений"
git push
```

---

## Безопасность ⚠️

**ВАЖНО:** Перед загрузкой на GitHub убедитесь:

1. **.env файл НЕ загружается**
   - Файл `.gitignore` уже настроен для исключения `.env`
   - Никогда не коммитьте реальные API ключи и токены

2. **Используйте GitHub Secrets для CI/CD**
   - Добавьте секреты в Settings → Secrets and variables → Actions
   - Например: `TELEGRAM_BOT_TOKEN`, `OPENAI_API_KEY`

3. **Приватный репозиторий**
   - Для проектов с бизнес-логикой используйте private repository
   - Особенно если планируете коммерческое использование

---

## Troubleshooting

### "git: command not found"

Установите Git:
- **Windows:** https://git-scm.com/download/win
- **macOS:** `brew install git` или Xcode Command Line Tools
- **Linux:** `sudo apt install git` (Ubuntu/Debian)

### "Permission denied (publickey)"

Настройте SSH ключ или используйте HTTPS:

```bash
# Вместо git@github.com используйте https://
git remote set-url origin https://github.com/YOUR_USERNAME/ai-cold-email-bot.git
```

### "Repository already exists"

Если репозиторий уже создан:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ai-cold-email-bot.git
git push -u origin main
```

---

## Следующие шаги

После размещения на GitHub:

1. ✅ Прочитайте `QUICKSTART.md` для запуска проекта
2. ✅ Изучите `docs/ARCHITECTURE.md` для понимания структуры
3. ✅ Настройте Telegram бота по инструкции в `SETUP.md`
4. ✅ Запустите проект локально через Docker Compose

**Документация:**
- `README.md` - Общая информация о проекте
- `QUICKSTART.md` - Быстрый старт для тестирования
- `SETUP.md` - Детальная настройка
- `docs/DEPLOYMENT.md` - Production деплой
- `docs/API.md` - API документация

Удачи с проектом! 🚀
