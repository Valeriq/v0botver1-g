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
  const age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 18
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
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const data = items.slice(startIndex, endIndex)
  const totalPages = Math.ceil(items.length / pageSize)
  
  return {
    data,
    total: items.length,
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
    vi.clearAllTimers()
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      expect(formatDate(date)).toBe('2024-01-15')
    })

    it('should handle different timezones', () => {
      const date = new Date('2024-12-31T23:59:59Z')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should handle leap years', () => {
      const date = new Date('2024-02-29T00:00:00Z')
      expect(formatDate(date)).toBe('2024-02-29')
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
      date.setDate(date.getDate() + 1) // День после 18-летия
      expect(isAdult(date)).toBe(true)
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
      const contacts = Array.from({ length: 50 }, (_, i) => ({
        id: generateId('contact'),
        name: `Contact ${i + 1}`,
        email: `contact${i + 1}@example.com`,
      }))

      const result = paginate(contacts, 1, 20)
      
      expect(result.data).toHaveLength(20)
      expect(result.total).toBe(50)
      expect(result.totalPages).toBe(3)
      expect(result.data.every(c => c.id.startsWith('contact-'))).toBe(true)
    })

    it('should filter and paginate results', () => {
      const items = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        status: i % 3 === 0 ? 'active' : 'inactive',
      }))

      const activeItems = items.filter(item => item.status === 'active')
      const result = paginate(activeItems, 1, 5)

      expect(result.data).toHaveLength(5)
      expect(result.total).toBe(7) // 7 items with status 'active'
      expect(result.data.every(item => item.status === 'active')).toBe(true)
    })
  })
})
