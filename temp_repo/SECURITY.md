# Безопасность проекта

## ⚠️ ВАЖНО: Защита конфиденциальных данных

Вы получили Telegram Bot Token: `7631533721:AAHgroaH4CGTpjraoJxUlYLAFsR3Q-uSuqM`

### Критические правила безопасности:

1. **НЕ публикуйте этот токен в публичных репозиториях**
2. **НЕ коммитьте файл .env в Git**
3. **НЕ делитесь токеном с третьими лицами**

---

## Настройка .env файла

### Шаг 1: Создайте локальный .env

```bash
cp .env.example .env
```

### Шаг 2: Добавьте ваш токен

Откройте файл `.env` и замените первую строку:

```env
TELEGRAM_BOT_TOKEN=7631533721:AAHgroaH4CGTpjraoJxUlYLAFsR3Q-uSuqM

# Остальные настройки...
```

### Шаг 3: Проверьте .gitignore

Убедитесь, что файл `.gitignore` содержит:

```
.env
.env.*
services/*/.env
```

Это гарантирует, что токен не попадет в Git.

---

## Что делать если токен утек

Если токен случайно попал в публичный репозиторий:

1. **Немедленно отзовите токен:**
   - Откройте [@BotFather](https://t.me/botfather)
   - Отправьте `/revoke`
   - Выберите ваш бот
   - Получите новый токен

2. **Обновите .env с новым токеном**

3. **Удалите историю Git:**
   ```bash
   # ОПАСНО: переписывает историю
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   
   git push origin --force --all
   ```

---

## Как безопасно использовать токены в production

### Вариант 1: Environment Variables (рекомендуется)

В production окружении (Kubernetes, Docker Swarm, Vercel, Heroku):

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: bot-secrets
type: Opaque
stringData:
  telegram-bot-token: "7631533721:AAHgroaH4CGTpjraoJxUlYLAFsR3Q-uSuqM"
```

Затем примонтируйте secret:

```yaml
env:
  - name: TELEGRAM_BOT_TOKEN
    valueFrom:
      secretKeyRef:
        name: bot-secrets
        key: telegram-bot-token
```

### Вариант 2: Secrets Manager

Используйте облачные сервисы:
- **AWS Secrets Manager**
- **Google Cloud Secret Manager**
- **Azure Key Vault**
- **HashiCorp Vault**

### Вариант 3: CI/CD Variables

В GitHub Actions, GitLab CI, или других CI системах:

1. Добавьте токен как секретную переменную в настройках репозитория
2. Используйте в workflow:

```yaml
# .github/workflows/deploy.yml
env:
  TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
```

---

## Ротация токенов

Рекомендуется периодически обновлять токены:

1. **Каждые 90 дней** для production
2. **Немедленно** при подозрении на компрометацию
3. **После увольнения** сотрудника с доступом

---

## Другие конфиденциальные данные

Кроме Telegram токена, защищайте:

- `OPENAI_API_KEY` - доступ к OpenAI (платный)
- `GOOGLE_CLIENT_SECRET` - доступ к Gmail API
- `DATABASE_URL` - доступ к базе данных
- `ADMIN_TELEGRAM_IDS` - список администраторов

Все эти данные должны быть только в `.env` и никогда в Git!

---

## Проверка безопасности перед коммитом

```bash
# Проверьте что .env не будет закоммичен
git status

# Если видите .env в списке:
git reset .env
echo ".env" >> .gitignore
```

---

## Безопасность API endpoints

В production обязательно добавьте:

1. **HTTPS** - используйте SSL сертификаты
2. **Rate limiting** - уже реализовано в проекте
3. **API Keys** - для доступа к Core API
4. **IP Whitelist** - ограничьте доступ к admin endpoints

---

## Мониторинг безопасности

Включено в проекте:
- GitHub Security Scanning (`.github/workflows/security.yml`)
- Trivy для сканирования Docker образов
- Dependabot для обновления зависимостей

---

## Контакты

Если обнаружили уязвимость - создайте private issue в GitHub или свяжитесь с maintainer напрямую.
