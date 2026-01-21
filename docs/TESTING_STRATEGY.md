# Стратегия тестирования проекта

## Проблемы с текущим подходом (Jest)

1. **Конфликты типов TypeScript** - отсутствуют типы для Jest (`@types/jest`), что вызывает ошибки компиляции
2. **Сложности с настройкой ts-jest** - проблемы с модульной системой и `isolatedModules`
3. **Интеграционные тесты требуют реальную БД** - не могут работать без настроенного PostgreSQL
4. **Медленная работа** - Jest работает медленнее на современных TypeScript проектах
5. **Отсутствие изоляции** - тесты зависят от внешних сервисов (Redis, AI API, Gmail API)

## Новая стратегия: Vitest + Unit Testing

### Преимущества Vitest

- ✅ **Native ESM поддержка** - работает с TypeScript напрямую без ts-jest
- ✅ **Глобальные типы** - автоматическое определение `describe`, `it`, `expect`, `vi`
- ✅ **Быстрее Jest** - использует Vite для быстрой компиляции
- ✅ **Лучшие моки** - `vi.fn()`, `vi.mock()` работают из коробки
- ✅ **Watch mode** - мгновенный перезапуск тестов при изменениях
- ✅ **Встроенный coverage** - через `@vitest/coverage-v8`
- ✅ **UI интерфейс** - через `@vitest/ui`

### Уровни тестирования

#### 1. Unit Tests (Юнит-тесты)
**Цель:** Тестирование отдельных функций и классов без зависимостей

**Где:** `services/*/src/**/*.test.ts`

**Примеры:**
- Валидация данных (Zod схемы)
- Бизнес-логика (обработка email, классификация ответов)
- Утилиты (форматирование даты, строк)
- Функции форматирования

**Не тестируют:**
- API эндпоинты
- Базу данных
- Внешние сервисы

#### 2. Integration Tests (Интеграционные тесты)
**Цель:** Тестирование взаимодействия между модулями

**Где:** `services/*/src/__tests__/integration/*.test.ts`

**Использование моков:**
- PostgreSQL: `pg-mem` (in-memory база данных)
- Redis: моки через `vi.mock()`
- AI API: моки с предопределёнными ответами

**Примеры:**
- Создание контакта → сохранение в БД
- Создание кампании → добавление в очередь
- Обработка email → классификация → создание лида

#### 3. E2E Tests (End-to-End тесты)
**Цель:** Тестирование полного потока пользователя

**Где:** `e2e/` (позже)

**Инструменты:** Playwright или Cypress

**Примеры:**
- Регистрация через Telegram
- Загрузка CSV с контактами
- Запуск кампании
- Мониторинг статистики

### Структура тестов

```
project/
├── vitest.config.ts          # Конфигурация Vitest
├── vitest.setup.ts           # Глобальные моки и настройки
├── services/
│   ├── core-api/
│   │   └── src/
│   │       ├── utils.test.ts        # Unit тесты
│   │       ├── validation.test.ts   # Тесты валидации
│   │       └── __tests__/
│   │           └── integration/      # Интеграционные тесты
│   ├── worker/
│   │   └── src/
│   │       └── processors.test.ts   # Unit тесты процессоров
│   └── ai-orchestrator/
│       └── src/
│           └── email.test.ts        # Unit тесты генерации email
└── client/
    └── src/
        └── components/
            └── Button.test.tsx      # React компонент тесты
```

### Команды для тестирования

```bash
# Запуск всех тестов
npm run test

# Запуск тестов в watch режиме
npm run test:watch

# Запуск тестов с покрытием кода
npm run test:coverage

# Запуск только unit тестов
npm run test:unit

# Запуск только интеграционных тестов
npm run test:integration

# Запуск UI интерфейса для тестов
npm run test:ui
```

### Моки и заглушки

#### База данных
```typescript
// Используем pg-mem для in-memory PostgreSQL
import { newDb } from 'pg-mem'

const db = newDb()
const mockPool = db.adapters.createPool()
```

#### Redis
```typescript
// Мок Redis через Vitest
vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn(),
    get: vi.fn().mockResolvedValue('mocked value'),
    set: vi.fn(),
  })),
}))
```

#### AI API
```typescript
// Мок для OpenAI
vi.mock('openai', () => ({
  default: class {
    chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Generated email' } }],
        }),
      },
    }
  },
}))
```

### Конфигурация package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:unit": "vitest run **/*.test.ts",
    "test:integration": "vitest run **/__tests__/**/*.test.ts"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitest/ui": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "jsdom": "^24.0.0",
    "happy-dom": "^14.0.0",
    "pg-mem": "^3.0.0"
  }
}
```

### Рекомендации по написанию тестов

1. **Один тест - одна проверка**
   - Тестируйте только одну вещь в одном тесте

2. **Понятные названия**
   ```typescript
   it('should create contact with valid email', () => {})
   it('should reject contact with invalid email', () => {})
   ```

3. **Используйте beforeEach для setup**
   ```typescript
   beforeEach(() => {
     // Очистка состояния перед каждым тестом
     vi.clearAllMocks()
   })
   ```

4. **Изоляция тестов**
   - Тесты не должны зависеть друг от друга
   - Не используйте общее состояние

5. **Тестируйте крайние случаи**
   - Пустые данные
   - Null/undefined
   - Очень большие строки
   - Специальные символы

### Следующие шаги

1. ✅ Установить Vitest и зависимости
2. ⬜ Переписать существующие тесты на Vitest
3. ⬜ Создать unit тесты для бизнес-логики
4. ⬜ Создать интеграционные тесты с pg-mem
5. ⬜ Добавить тесты для React компонентов
6. ⬜ Настроить CI/CD для автоматического запуска тестов
7. ⬜ Добавить покрытие кода (минимум 80%)

### Отключение старых тестов

Старые Jest тесты остаются в `services/*/src/__tests__/`, но они:
- Не запускаются по умолчанию
- Можно использовать как референс при переписывании
- Будут удалены после завершения миграции на Vitest
