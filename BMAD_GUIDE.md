# Руководство по использованию BMad Method (bmadcodes.com)

## Что такое BMad Method?

**BMad Method** - это универсальный AI агент framework, который интегрируется с вашими AI-инструментами (Windsurf, Cursor, Cline, Claude Code и др.) для автоматизации разработки.

**Установленная версия:** 4.44.3 (full installation)
**Дата установки:** 19.01.2026

---

## Основные команды BMad Method

### 1. Проверка статуса установки
```bash
npx bmad-method status
```
Показывает информацию о текущей установке: версию, дату, тип установки и количество файлов.

### 2. Полная установка BMad Method
```bash
npx bmad-method install --full
```
Устанавливает полный пакет BMad Method со всеми агентами и инструментами.

### 3. Установка для конкретной IDE
```bash
npx bmad-method install --ide windsurf
```
Конфигурирует BMad Method для Windsurf.

**Поддерживаемые IDE:**
- windsurf ✓ (ваша текущая IDE)
- cursor
- claude-code
- trae
- roo
- kilo
- cline
- gemini
- qwen-code
- github-copilot
- codex
- codex-web
- auggie-cli
- iflow-cli
- opencode
- other

Можете указать несколько IDE одновременно:
```bash
npx bmad-method install --ide windsurf --ide cursor --ide claude-code
```

### 4. Установка с расширениями (Expansion Packs)
```bash
npx bmad-method install --expansion-packs bmad-2d-phaser-game-dev
```

Установка нескольких expansion packs:
```bash
npx bmad-method install --expansion-packs bmad-2d-phaser-game-dev bmad-infrastructure-devops
```

### 5. Обновление BMad Method
```bash
npx bmad-method update
```
Обновляет существующую установку до последней версии.

### 6. Проверка обновлений
```bash
npx bmad-method update-check
```
Проверяет наличие доступных обновлений без установки.

### 7. Список доступных расширений
```bash
npx bmad-method list:expansions
```
Показывает все доступные expansion packs с описаниями.

### 8. Конвертация кода в XML
```bash
npx bmad-method flatten
```
Преобразует кодовую базу в формат XML для анализа.

---

## Доступные Expansion Packs

### 1. **bmad-2d-phaser-game-dev** (v1.13.0)
Разработка 2D игр с использованием Phaser 3 и TypeScript.
- Автор: Brian (BMad)
- Для: Разработчики игр на JavaScript/TypeScript

### 2. **bmad-2d-unity-game-dev** (v1.6.0)
Разработка 2D игр с использованием Unity и C#.
- Автор: pbean (PinkyD)
- Для: Разработчики игр на Unity

### 3. **bmad-creative-writing** (v1.1.1)
Комплексный AI-фреймворк для творческого письма.
- Авторы: Wes
- Возможности:
  - 10 специализированных агентов для письма
  - 8 рабочих процессов от идеи до публикации
  - 27 чек-листов качества
  - Интеграция с KDP publishing

### 4. **bmad-godot-game-dev** (v1.0.0)
Разработка игр с использованием Godot (GDScript и C#).
- Автор: sjennings (Lum), на основе BMAD Unity Game Dev
- Для: Разработчики игр на Godot

### 5. **bmad-infrastructure-devops** (v1.12.0)
Расширение для инфраструктуры и DevOps.
- Автор: Brian (BMad)
- Возможности:
  - Определение облачной инфраструктуры
  - Реализация и управление
  - Интеграция с разработкой приложений

---

## Как использовать BMad Method с Windsurf

### Шаг 1: Настройка для Windsurf
```bash
npx bmad-method install --ide windsurf
```

### Шаг 2: Использование в проекте
После установки BMad Method автоматически интегрируется с Windsurf. AI-агенты будут использовать:

1. **Специализированные промпты** для вашего типа проекта
2. **Лучшие практики** для выбранных технологий
3. **Expansion packs** если они установлены

### Шаг 3: Работа с кодом
При общении с Windsurf AI, BMad Method автоматически:
- Анализирует контекст вашего проекта
- Предлагает оптимальные решения
- Следует стандартам выбранных технологий

---

## Полезные команды

### Установка в конкретную директорию
```bash
npx bmad-method install --directory C:\Projects\MyProject
```

### Установка только расширений (без core)
```bash
npx bmad-method install --expansion-only --expansion-packs bmad-infrastructure-devops
```

### Комбинирование опций
```bash
npx bmad-method install --full --ide windsurf --expansion-packs bmad-infrastructure-devops
```

---

## Для вашего проекта v0botver1-g

Учитывая, что у вас проект с Telegram ботом, AI-оркестратором и микросервисами, рекомендую:

### Рекомендуемый expansion pack:
```bash
npx bmad-method install --expansion-packs bmad-infrastructure-devops
```

Это поможет вам с:
- Управлением инфраструктурой (Docker, Kubernetes)
- DevOps практиками
- Облачной архитектурой

### Использование с текущей установкой:
У вас уже установлена полная версия (full), которая включает:
- bmad-core (основной фреймворк)
- Все основные агенты
- Инструменты для разработки

Просто используйте Windsurf как обычно - BMad Method будет работать в фоновом режиме!

---

## Получение справки

```bash
# Общая справка
npx bmad-method --help

# Справка по конкретной команде
npx bmad-method install --help
npx bmad-method update --help
```

---

## Дополнительная информация

**Официальный сайт:** https://bmadcodes.com/
**Версия CLI:** 4.44.3
**Установлен как:** full (74 файла)

---

## Советы по использованию

1. **Регулярно обновляйтесь:**
   ```bash
   npx bmad-method update-check
   npx bmad-method update
   ```

2. **Выбирайте правильные expansion packs** для вашего типа проекта

3. **Настраивайте для вашей IDE** для лучшей интеграции

4. **Используйте с вашими AI-инструментами** для максимальной продуктивности

5. **Проверяйте статус** перед началом работы:
   ```bash
   npx bmad-method status
   ```

---

## Решение проблем

Если возникают проблемы:

1. Проверьте статус установки:
   ```bash
   npx bmad-method status
   ```

2. Переустановите если нужно:
   ```bash
   npx bmad-method install --full
   ```

3. Проверьте версию:
   ```bash
   npx bmad-method --version
   ```

---

## Следующие шаги

1. ✅ BMad Method уже установлен (версия 4.44.3)
2. 🎯 Настройте для Windsurf: `npx bmad-method install --ide windsurf`
3. 🚀 Установите expansion packs при необходимости
4. 💡 Начните использовать с Windsurf AI

Удачи в разработке!
