/**
 * @jest-environment node
 */

describe('SmsProvider', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('isConfigured', () => {
    it('should return true when all Twilio env vars are set', () => {
      process.env.TWILIO_ACCOUNT_SID = 'AC123'
      process.env.TWILIO_AUTH_TOKEN = 'token123'
      process.env.TWILIO_PHONE_NUMBER = '+15551234567'

      const { SmsProvider } = require('@/lib/providers/sms.provider')
      const provider = new SmsProvider()

      expect(provider.isConfigured()).toBe(true)
    })

    it('should return false when TWILIO_ACCOUNT_SID is missing', () => {
      delete process.env.TWILIO_ACCOUNT_SID
      process.env.TWILIO_AUTH_TOKEN = 'token123'
      process.env.TWILIO_PHONE_NUMBER = '+15551234567'

      const { SmsProvider } = require('@/lib/providers/sms.provider')
      const provider = new SmsProvider()

      expect(provider.isConfigured()).toBe(false)
    })

    it('should return false when TWILIO_AUTH_TOKEN is missing', () => {
      process.env.TWILIO_ACCOUNT_SID = 'AC123'
      delete process.env.TWILIO_AUTH_TOKEN
      process.env.TWILIO_PHONE_NUMBER = '+15551234567'

      const { SmsProvider } = require('@/lib/providers/sms.provider')
      const provider = new SmsProvider()

      expect(provider.isConfigured()).toBe(false)
    })

    it('should return false when TWILIO_PHONE_NUMBER is missing', () => {
      process.env.TWILIO_ACCOUNT_SID = 'AC123'
      process.env.TWILIO_AUTH_TOKEN = 'token123'
      delete process.env.TWILIO_PHONE_NUMBER

      const { SmsProvider } = require('@/lib/providers/sms.provider')
      const provider = new SmsProvider()

      expect(provider.isConfigured()).toBe(false)
    })

    it('should return false when all Twilio env vars are missing', () => {
      delete process.env.TWILIO_ACCOUNT_SID
      delete process.env.TWILIO_AUTH_TOKEN
      delete process.env.TWILIO_PHONE_NUMBER

      const { SmsProvider } = require('@/lib/providers/sms.provider')
      const provider = new SmsProvider()

      expect(provider.isConfigured()).toBe(false)
    })
  })

  describe('send', () => {
    it('should return error when not configured', async () => {
      delete process.env.TWILIO_ACCOUNT_SID
      delete process.env.TWILIO_AUTH_TOKEN
      delete process.env.TWILIO_PHONE_NUMBER

      const { SmsProvider } = require('@/lib/providers/sms.provider')
      const provider = new SmsProvider()

      const result = await provider.send({ to: '+972501234567', message: 'test' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('SMS provider not configured')
    })

    it('should return success in stub mode when configured', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'AC123'
      process.env.TWILIO_AUTH_TOKEN = 'token123'
      process.env.TWILIO_PHONE_NUMBER = '+15551234567'

      const { SmsProvider } = require('@/lib/providers/sms.provider')
      const provider = new SmsProvider()

      const result = await provider.send({ to: '+972501234567', message: 'test' })

      expect(result.success).toBe(true)
      expect(result.messageId).toMatch(/^stub-/)
    })
  })
})
