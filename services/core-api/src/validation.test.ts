import { describe, it, expect } from 'vitest'

// Простая функция валидации email для демонстрации
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  // Проверка на двойные точки
  if (email.includes('..')) return false
  return emailRegex.test(email)
}

// Функция валидации имени
function isValidName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 100
}

// Функция нормализации email
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

// Функция проверки безопасности строки
function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '')
}

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('user+tag@example.org')).toBe(true)
    })

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('user@domain')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('a@b.c')).toBe(true)
      expect(isValidEmail('test@example..com')).toBe(false)
    })
  })

  describe('isValidName', () => {
    it('should validate name length', () => {
      expect(isValidName('Jo')).toBe(true)
      expect(isValidName('John Doe')).toBe(true)
      expect(isValidName('a')).toBe(false)
      expect(isValidName('   ')).toBe(false)
    })
  })

  describe('normalizeEmail', () => {
    it('should lowercase and trim email', () => {
      expect(normalizeEmail(' TEST@example.com  ')).toBe('test@example.com')
    })
  })

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
    })
  })
})
