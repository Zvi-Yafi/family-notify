import { EmailProvider } from '@/lib/providers/email.provider'

// Mock Resend
const mockResend = {
  emails: {
    send: jest.fn(),
  },
}

jest.mock('resend', () => ({
  Resend: jest.fn(() => mockResend),
}))

describe('EmailProvider', () => {
  let provider: EmailProvider

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.RESEND_API_KEY = 'test-api-key'
    process.env.RESEND_FROM_EMAIL = 'test@example.com'
    provider = new EmailProvider()
  })

  afterEach(() => {
    delete process.env.RESEND_API_KEY
    delete process.env.RESEND_FROM_EMAIL
  })

  describe('isConfigured', () => {
    it('should return true when API key is configured', () => {
      expect(provider.isConfigured()).toBe(true)
    })

    it('should return false when API key is not configured', () => {
      delete process.env.RESEND_API_KEY
      const unconfiguredProvider = new EmailProvider()
      expect(unconfiguredProvider.isConfigured()).toBe(false)
    })
  })

  describe('send', () => {
    it('should send email successfully', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      })

      const result = await provider.send({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: 'Test content',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('email-123')
      expect(result.error).toBeUndefined()

      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: 'Test content',
      })
    })

    it('should handle send failure', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: null,
        error: { message: 'Send failed' },
      })

      const result = await provider.send({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Send failed')
    })

    it('should handle exception', async () => {
      mockResend.emails.send.mockRejectedValue(new Error('Network error'))

      const result = await provider.send({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should return error if not configured', async () => {
      delete process.env.RESEND_API_KEY
      const unconfiguredProvider = new EmailProvider()

      const result = await unconfiguredProvider.send({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email provider not configured')
    })
  })

  describe('sendVerificationCode', () => {
    it('should send verification code email', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      })

      const result = await provider.sendVerificationCode('user@example.com', '123456')

      expect(result.success).toBe(true)
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'קוד אימות - FamilyNotify',
        })
      )
    })
  })
})


