import { WhatsAppProvider } from '@/lib/providers/whatsapp.provider'

describe('WhatsAppProvider', () => {
  let provider: WhatsAppProvider

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isConfigured', () => {
    it('should return true when all credentials are configured', () => {
      process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone-id'
      process.env.WHATSAPP_ACCESS_TOKEN = 'test-token'
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = 'test-account-id'
      
      provider = new WhatsAppProvider()
      expect(provider.isConfigured()).toBe(true)

      delete process.env.WHATSAPP_PHONE_NUMBER_ID
      delete process.env.WHATSAPP_ACCESS_TOKEN
      delete process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
    })

    it('should return false when credentials are missing', () => {
      delete process.env.WHATSAPP_PHONE_NUMBER_ID
      delete process.env.WHATSAPP_ACCESS_TOKEN
      delete process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
      
      provider = new WhatsAppProvider()
      expect(provider.isConfigured()).toBe(false)
    })
  })

  describe('send', () => {
    it('should return error if not configured', async () => {
      delete process.env.WHATSAPP_PHONE_NUMBER_ID
      provider = new WhatsAppProvider()

      const result = await provider.send({
        to: '+1234567890',
        message: 'Test message',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('WhatsApp provider not configured')
    })

    it('should send WhatsApp message when configured (stub)', async () => {
      process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone-id'
      process.env.WHATSAPP_ACCESS_TOKEN = 'test-token'
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = 'test-account-id'
      
      provider = new WhatsAppProvider()

      const result = await provider.send({
        to: '+1234567890',
        message: 'Test message',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBeDefined()

      delete process.env.WHATSAPP_PHONE_NUMBER_ID
      delete process.env.WHATSAPP_ACCESS_TOKEN
      delete process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
    })
  })
})


