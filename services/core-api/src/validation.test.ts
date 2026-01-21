import { describe, it, expect } from 'vitest'

// Простая функция валидации email для демонстрации
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
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
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('test@example')).toBe(false)
      expect(isValidEmail('test example.com')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(isValidEmail('a@b.c')).toBe(true)
      expect(isValidEmail(' very.long.email@very.long.domain.example.com ')).toBe(false)
      expect(isValidEmail('test@example..com')).toBe(false)
    })
  })

  describe('isValidName', () => {
    it('should return true for valid names', () => {
      expect(isValidName('John')).toBe(true)
      expect(isValidName('Jane Doe')).toBe(true)
      expect(isValidName('Александр')).toBe(true)
      expect(isValidName('Maria')).toBe(true)
    })

    it('should return false for invalid names', () => {
      expect(isValidName('')).toBe(false)
      expect(isValidName('  ')).toBe(false)
      expect(isValidName('A')).toBe(false)
      expect(isValidName(' '.repeat(101))).toBe(false)
    })

    it('should handle names with special characters', () => {
      expect(isValidName("O'Brien")).toBe(true)
      expect(isValidName('Jean-Luc')).toBe(true)
      expect(isValidName('Müller')).toBe(true)
    })
  })

  describe('normalizeEmail', () => {
    it('should convert email to lowercase', () => {
      expect(normalizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com')
      expect(normalizeEmail('User.Name@Domain.Co.Uk')).toBe('user.name@domain.co.uk')
    })

    it('should trim whitespace', () => {
      expect(normalizeEmail('  test@example.com  ')).toBe('test@example.com')
    })

    it('should handle both uppercase and whitespace', () => {
      expect(normalizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com')
    })
  })

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
      expect(sanitizeInput('<div>Hello</div>')).toBe('divHello/div')
    })

    it('should keep normal text', () => {
      expect(sanitizeInput('Hello World')).toBe('Hello World')
      expect(sanitizeInput('Test 123')).toBe('Test 123')
    })

    it('should handle mixed content', () => {
      expect(sanitizeInput('Hello <b>World</b>')).toBe('Hello bWorld/b')
    })
  })
})

describe('Integration: Contact Validation', () => {
  it('should validate complete contact data', () => {
    const contact = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      company: 'Example Corp',
    }

    expect(isValidEmail(contact.email)).toBe(true)
    expect(isValidName(contact.firstName)).toBe(true)
    expect(isValidName(contact.lastName)).toBe(true)
  })

  it('should reject invalid contact data', () => {
    const contact = {
      email: 'invalid-email',
      firstName: 'J', // Слишком короткое имя
      lastName: 'Doe',
      company: 'Example Corp',
    }

    expect(isValidEmail(contact.email)).toBe(false)
    expect(isValidName(contact.firstName)).toBe(false)
  })

  it('should normalize and validate email', () => {
    const rawEmail = '  TEST@EXAMPLE.COM  '
    const normalizedEmail = normalizeEmail(rawEmail)

    expect(normalizedEmail).toBe('test@example.com')
    expect(isValidEmail(normalizedEmail)).toBe(true)
  })
})
