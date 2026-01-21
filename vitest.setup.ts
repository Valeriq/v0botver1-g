// Настройка окружения для тестов Vitest
import { vi } from 'vitest'

// Моки для внешних сервисов, которые не нужны в тестах
vi.mock('./services/ai-orchestrator', () => ({
  default: {
    generateEmail: vi.fn(),
    classifyReply: vi.fn(),
  },
}))

vi.mock('./services/gmail-service', () => ({
  sendEmail: vi.fn(),
  checkReplies: vi.fn(),
}))

// Мок для Redis
vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn(),
    quit: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    rPush: vi.fn(),
    lPop: vi.fn(),
  })),
}))

// Глобальные моки для переменных окружения
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.REDIS_URL = 'redis://localhost:6379'
