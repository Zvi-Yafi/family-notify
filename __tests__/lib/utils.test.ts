import { cn, formatDate, slugify } from '@/lib/utils'

describe('Utils Functions', () => {
  describe('cn (className merger)', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4')
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
    })

    it('should handle undefined and null', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
    })
  })

  describe('formatDate', () => {
    it('should format Date object with Hebrew locale', () => {
      const date = new Date('2024-01-15T14:30:00Z')
      const formatted = formatDate(date, 'he-IL')
      expect(formatted).toContain('2024')
      expect(formatted).toContain('15')
    })

    it('should format string date', () => {
      const dateString = '2024-01-15T14:30:00Z'
      const formatted = formatDate(dateString, 'he-IL')
      expect(formatted).toContain('2024')
    })

    it('should use Hebrew locale by default', () => {
      const date = new Date('2024-01-15T14:30:00Z')
      const formatted = formatDate(date)
      expect(formatted).toBeDefined()
      expect(typeof formatted).toBe('string')
    })

    it('should include time in format', () => {
      const date = new Date('2024-01-15T14:30:00Z')
      const formatted = formatDate(date, 'en-US')
      expect(formatted).toMatch(/\d{1,2}:\d{2}/)
    })
  })

  describe('slugify', () => {
    it('should convert text to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world')
    })

    it('should handle Hebrew text', () => {
      const slug = slugify('משפחת כהן')
      expect(slug).toBeDefined()
      expect(typeof slug).toBe('string')
    })

    it('should replace spaces with hyphens', () => {
      expect(slugify('foo bar baz')).toBe('foo-bar-baz')
    })

    it('should remove special characters', () => {
      expect(slugify('foo!@#$%bar')).toBe('foobar')
    })

    it('should handle multiple spaces', () => {
      expect(slugify('foo   bar')).toBe('foo-bar')
    })

    it('should handle leading and trailing spaces', () => {
      expect(slugify('  foo bar  ')).toBe('foo-bar')
    })

    it('should convert to lowercase', () => {
      expect(slugify('FOO Bar')).toBe('foo-bar')
    })

    it('should handle multiple consecutive hyphens', () => {
      expect(slugify('foo---bar')).toBe('foo-bar')
    })

    it('should handle empty string', () => {
      expect(slugify('')).toBe('')
    })

    it('should handle numbers', () => {
      expect(slugify('foo123bar456')).toBe('foo123bar456')
    })
  })
})


