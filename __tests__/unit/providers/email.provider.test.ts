/**
 * @jest-environment node
 */

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}))

jest.mock('@/lib/utils/email-templates', () => ({
  buildVerificationEmailHtml: jest.fn(() => '<html>verification</html>'),
  buildInvitationEmailHtml: jest.fn(() => '<html>invitation</html>'),
}))

describe('EmailProvider', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('isConfigured', () => {
    it('should return true when RESEND_API_KEY is set', () => {
      process.env.RESEND_API_KEY = 'test-api-key'
      const { EmailProvider } = require('@/lib/providers/email.provider')
      const provider = new EmailProvider()
      expect(provider.isConfigured()).toBe(true)
    })

    it('should return false when RESEND_API_KEY is not set', () => {
      delete process.env.RESEND_API_KEY
      const { EmailProvider } = require('@/lib/providers/email.provider')
      const provider = new EmailProvider()
      expect(provider.isConfigured()).toBe(false)
    })
  })

  describe('send', () => {
    it('should return error when not configured', async () => {
      delete process.env.RESEND_API_KEY
      const { EmailProvider } = require('@/lib/providers/email.provider')
      const provider = new EmailProvider()

      const result = await provider.send({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>test</p>',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email provider not configured')
    })

    it('should send email successfully when configured', async () => {
      process.env.RESEND_API_KEY = 'test-api-key'
      const { Resend } = require('resend')
      const mockSend = jest.fn().mockResolvedValue({
        data: { id: 'msg-123' },
        error: null,
      })
      Resend.mockImplementation(() => ({
        emails: { send: mockSend },
      }))

      const { EmailProvider } = require('@/lib/providers/email.provider')
      const provider = new EmailProvider()

      const result = await provider.send({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>test</p>',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('msg-123')
    })

    it('should handle Resend API errors', async () => {
      process.env.RESEND_API_KEY = 'test-api-key'
      const { Resend } = require('resend')
      const mockSend = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Rate limit exceeded' },
      })
      Resend.mockImplementation(() => ({
        emails: { send: mockSend },
      }))

      const { EmailProvider } = require('@/lib/providers/email.provider')
      const provider = new EmailProvider()

      const result = await provider.send({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>test</p>',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Rate limit exceeded')
    })

    it('should handle thrown exceptions', async () => {
      process.env.RESEND_API_KEY = 'test-api-key'
      const { Resend } = require('resend')
      const mockSend = jest.fn().mockRejectedValue(new Error('Network failure'))
      Resend.mockImplementation(() => ({
        emails: { send: mockSend },
      }))

      const { EmailProvider } = require('@/lib/providers/email.provider')
      const provider = new EmailProvider()

      const result = await provider.send({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>test</p>',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network failure')
    })
  })
})
