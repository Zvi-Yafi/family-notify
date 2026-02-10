/**
 * @jest-environment node
 */

describe('WhatsAppProvider', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('isConfigured', () => {
    it('should return true when both Green API env vars are set', () => {
      process.env.GREEN_API_ID_INSTANCE = '123456'
      process.env.GREEN_API_TOKEN_INSTANCE = 'token-abc-123'

      const { WhatsAppProvider } = require('@/lib/providers/whatsapp.provider')
      const provider = new WhatsAppProvider()

      expect(provider.isConfigured()).toBe(true)
    })

    it('should return false when GREEN_API_ID_INSTANCE is missing', () => {
      delete process.env.GREEN_API_ID_INSTANCE
      process.env.GREEN_API_TOKEN_INSTANCE = 'token-abc-123'

      const { WhatsAppProvider } = require('@/lib/providers/whatsapp.provider')
      const provider = new WhatsAppProvider()

      expect(provider.isConfigured()).toBe(false)
    })

    it('should return false when GREEN_API_TOKEN_INSTANCE is missing', () => {
      process.env.GREEN_API_ID_INSTANCE = '123456'
      delete process.env.GREEN_API_TOKEN_INSTANCE

      const { WhatsAppProvider } = require('@/lib/providers/whatsapp.provider')
      const provider = new WhatsAppProvider()

      expect(provider.isConfigured()).toBe(false)
    })

    it('should return false when both Green API env vars are missing', () => {
      delete process.env.GREEN_API_ID_INSTANCE
      delete process.env.GREEN_API_TOKEN_INSTANCE

      const { WhatsAppProvider } = require('@/lib/providers/whatsapp.provider')
      const provider = new WhatsAppProvider()

      expect(provider.isConfigured()).toBe(false)
    })
  })

  describe('send', () => {
    it('should return error when not configured', async () => {
      delete process.env.GREEN_API_ID_INSTANCE
      delete process.env.GREEN_API_TOKEN_INSTANCE

      const { WhatsAppProvider } = require('@/lib/providers/whatsapp.provider')
      const provider = new WhatsAppProvider()

      const result = await provider.send({ to: '0541234567', message: 'test' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('WhatsApp provider not configured')
    })

    it('should send message successfully when configured', async () => {
      process.env.GREEN_API_ID_INSTANCE = '123456'
      process.env.GREEN_API_TOKEN_INSTANCE = 'token-abc-123'

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ idMessage: 'wa-msg-001' }),
      }
      global.fetch = jest.fn().mockResolvedValue(mockResponse) as any

      const { WhatsAppProvider } = require('@/lib/providers/whatsapp.provider')
      const provider = new WhatsAppProvider()

      const result = await provider.send({ to: '0541234567', message: 'test' })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('wa-msg-001')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.green-api.com'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should handle API error responses', async () => {
      process.env.GREEN_API_ID_INSTANCE = '123456'
      process.env.GREEN_API_TOKEN_INSTANCE = 'token-abc-123'

      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Invalid phone number' }),
      }
      global.fetch = jest.fn().mockResolvedValue(mockResponse) as any

      const { WhatsAppProvider } = require('@/lib/providers/whatsapp.provider')
      const provider = new WhatsAppProvider()

      const result = await provider.send({ to: '0541234567', message: 'test' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid phone number')
    })

    it('should handle network errors', async () => {
      process.env.GREEN_API_ID_INSTANCE = '123456'
      process.env.GREEN_API_TOKEN_INSTANCE = 'token-abc-123'

      global.fetch = jest.fn().mockRejectedValue(new Error('fetch failed')) as any

      const { WhatsAppProvider } = require('@/lib/providers/whatsapp.provider')
      const provider = new WhatsAppProvider()

      const result = await provider.send({ to: '0541234567', message: 'test' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })
  })
})
