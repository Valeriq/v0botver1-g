# AI Coding Rules

Эти правила обязательны для всех изменений кода в проекте.

## 1. Проверка перед каждым коммитом

Любое изменение кода = обязан запустить:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## 2. Если команда завершилась неуспешно

1. Скопируй полный лог ошибки.
2. Объясни, в чём причина.
3. Покажи патч, который исправит ошибку.
4. Повтори команду и убедись, что она проходит.

## 3. Стиль кода

- Не отключать правила линтера без объяснения.
- Не ставить `any` без причины и комментария.

## 4. Перед деплоем

Убедись, что все сервисы собираются:

```bash
cd packages/shared && pnpm run build
cd services/core-api && pnpm run build
cd services/telegram-bot && pnpm run build
cd services/worker && pnpm run build
cd services/gmail-service && pnpm run build
cd services/ai-orchestrator && pnpm run build
```

## 5. После изменений TypeScript конфигурации

Проверь компиляцию всех сервисов:

```bash
pnpm -r build
```
