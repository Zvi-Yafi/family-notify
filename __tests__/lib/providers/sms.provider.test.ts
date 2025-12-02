import { SmsProvider } from '@/lib/providers/sms.provider'

describe('SmsProvider', () => {
  let provider: SmsProvider

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isConfigured', () => {
    it('should return true when all credentials are configured', () => {
      process.env.TWILIO_ACCOUNT_SID = 'test-sid'
      process.env.TWILIO_AUTH_TOKEN = 'test-token'
      process.env.TWILIO_PHONE_NUMBER = '+1234567890'
      
      provider = new SmsProvider()
      expect(provider.isConfigured()).toBe(true)

      delete process.env.TWILIO_ACCOUNT_SID
      delete process.env.TWILIO_AUTH_TOKEN
      delete process.env.TWILIO_PHONE_NUMBER
    })

    it('should return false when credentials are missing', () => {
      delete process.env.TWILIO_ACCOUNT_SID
      delete process.env.TWILIO_AUTH_TOKEN
      delete process.env.TWILIO_PHONE_NUMBER
      
      provider = new SmsProvider()
      expect(provider.isConfigured()).toBe(false)
    })
  })

  describe('send', () => {
    it('should return error if not configured', async () => {
      delete process.env.TWILIO_ACCOUNT_SID
      provider = new SmsProvider()

      const result = await provider.send({
        to: '+1234567890',
        message: 'Test message',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('SMS provider not configured')
    })

    it('should send SMS when configured (stub)', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test-sid'
      process.env.TWILIO_AUTH_TOKEN = 'test-token'
      process.env.TWILIO_PHONE_NUMBER = '+1234567890'
      
      provider = new SmsProvider()

      const result = await provider.send({
        to: '+1234567890',
        message: 'Test message',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBeDefined()

      delete process.env.TWILIO_ACCOUNT_SID
      delete process.env.TWILIO_AUTH_TOKEN
      delete process.env.TWILIO_PHONE_NUMBER
    })
  })

  describe('sendVerificationCode', () => {
    it('should send verification code', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test-sid'
      process.env.TWILIO_AUTH_TOKEN = 'test-token'
      process.env.TWILIO_PHONE_NUMBER = '+1234567890'
      
      provider = new SmsProvider()

      const result = await provider.sendVerificationCode('+1234567890', '123456')

      expect(result.success).toBe(true)

      delete process.env.TWILIO_ACCOUNT_SID
      delete process.env.TWILIO_AUTH_TOKEN
      delete process.env.TWILIO_PHONE_NUMBER
    })
  })
})


