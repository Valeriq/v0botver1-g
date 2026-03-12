import { describe, it, expect, vi, beforeEach } from 'vitest'

// Моки для зависимостей
vi.mock('pg', () => ({
  Pool: vi.fn(() => ({
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  })),
}))

// Функция форматирования даты
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Функция проверки возраста
function isAdult(birthDate: Date): boolean {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age >= 18
}

// Функция генерации ID
function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return `${prefix}-${timestamp}-${random}`
}

// Функция пагинации
function paginate<T>(items: T[], page: number, pageSize: number): {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
} {
  const total = items.length
  const totalPages = Math.ceil(total / pageSize)
  const offset = (page - 1) * pageSize
  const data = items.slice(offset, offset + pageSize)

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  }
}

// Функция дебаунсинга (для демонстрации с таймерами)
let debounceTimer: NodeJS.Timeout | null = null
function debounce(func: () => void, delay: number): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(func, delay)
}

describe('Utils Functions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-05-15T10:00:00Z')
      expect(formatDate(date)).toBe('2023-05-15')
    })
  })

  describe('isAdult', () => {
    it('should return true for adults', () => {
      const adultDate = new Date()
      adultDate.setFullYear(adultDate.getFullYear() - 25)
      expect(isAdult(adultDate)).toBe(true)
    })

    it('should return false for minors', () => {
      const minorDate = new Date()
      minorDate.setFullYear(minorDate.getFullYear() - 15)
      expect(isAdult(minorDate)).toBe(false)
    })

    it('should return true for exactly 18 years old', () => {
      const exactly18Date = new Date()
      exactly18Date.setFullYear(exactly18Date.getFullYear() - 18)
      expect(isAdult(exactly18Date)).toBe(true)
    })

    it('should handle edge case of 18th birthday', () => {
      const date = new Date()
      date.setFullYear(date.getFullYear() - 18)
      date.setDate(date.getDate() - 1) // День до 18-летия
      expect(isAdult(date)).toBe(false)
    })
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId('user')
      const id2 = generateId('user')
      expect(id1).not.toBe(id2)
    })

    it('should include prefix', () => {
      const id = generateId('contact')
      expect(id).toMatch(/^contact-/)
    })

    it('should generate IDs in correct format', () => {
      const id = generateId('test')
      expect(id).toMatch(/^test-[a-z0-9]+-[a-z0-9]+$/)
    })
  })

  describe('paginate', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }))

    it('should return correct page data', () => {
      const result = paginate(items, 1, 10)
      expect(result.data).toHaveLength(10)
      expect(result.data[0].id).toBe(1)
      expect(result.data[9].id).toBe(10)
    })

    it('should calculate total pages correctly', () => {
      const result = paginate(items, 1, 10)
      expect(result.totalPages).toBe(3)
    })

    it('should handle last page with fewer items', () => {
      const result = paginate(items, 3, 10)
      expect(result.data).toHaveLength(5)
      expect(result.page).toBe(3)
    })

    it('should return empty array for page beyond range', () => {
      const result = paginate(items, 10, 10)
      expect(result.data).toHaveLength(0)
      expect(result.page).toBe(10)
    })

    it('should handle empty array', () => {
      const result = paginate([], 1, 10)
      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
      expect(result.totalPages).toBe(0)
    })
  })

  describe('debounce', () => {
    it('should delay function execution', () => {
      const mockFn = vi.fn()
      debounce(mockFn, 100)
      
      expect(mockFn).not.toHaveBeenCalled()
      
      vi.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should cancel previous call when called again', () => {
      const mockFn = vi.fn()
      debounce(mockFn, 100)
      
      vi.advanceTimersByTime(50)
      debounce(mockFn, 100)
      
      vi.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should execute only the last call in rapid succession', () => {
      const mockFn = vi.fn()
      
      debounce(mockFn, 100)
      debounce(mockFn, 100)
      debounce(mockFn, 100)
      
      vi.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('Integration: Pagination with Data Processing', () => {
    it('should process and paginate contacts', () => {
      const contacts = [
        { name: 'John', email: 'john@example.com' },
        { name: 'Jane', email: 'jane@example.com' },
        { name: 'Bob', email: 'bob@example.com' }
      ]
      const result = paginate(contacts, 1, 2)
      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(3)
    })
  })
})
