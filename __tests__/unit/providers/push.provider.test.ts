/**
 * @jest-environment node
 */

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  generateVAPIDKeys: jest.fn(() => ({
    publicKey: 'generated-public-key-long-enough-for-validation',
    privateKey: 'generated-private-key-long-enough-for-validation',
  })),
  sendNotification: jest.fn(),
}))

jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}))

describe('PushProvider', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('isConfigured', () => {
    it('should return true when valid VAPID env vars are set', () => {
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'a-valid-public-key-that-is-longer-than-twenty-chars'
      process.env.VAPID_PRIVATE_KEY = 'a-valid-private-key-that-is-longer-than-twenty-chars'

      const { PushProvider } = require('@/lib/providers/push.provider')
      const provider = new PushProvider()

      expect(provider.isConfigured()).toBe(true)
    })

    it('should return true when VAPID keys are generated (no env, no file)', () => {
      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      delete process.env.VAPID_PRIVATE_KEY

      const { PushProvider } = require('@/lib/providers/push.provider')
      const provider = new PushProvider()

      expect(provider.isConfigured()).toBe(true)
    })

    it('should return true when VAPID keys are loaded from file', () => {
      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      delete process.env.VAPID_PRIVATE_KEY

      const fs = require('fs')
      fs.existsSync.mockReturnValue(true)
      fs.readFileSync.mockReturnValue(
        JSON.stringify({
          publicKey: 'file-based-public-key',
          privateKey: 'file-based-private-key',
        })
      )

      const { PushProvider } = require('@/lib/providers/push.provider')
      const provider = new PushProvider()

      expect(provider.isConfigured()).toBe(true)
    })

    it('should ignore placeholder VAPID values like [AUTO-GENERATED]', () => {
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = '[AUTO-GENERATED]'
      process.env.VAPID_PRIVATE_KEY = '[AUTO-GENERATED]'

      const fs = require('fs')
      fs.existsSync.mockReturnValue(false)

      const { PushProvider } = require('@/lib/providers/push.provider')
      const provider = new PushProvider()

      expect(provider.isConfigured()).toBe(true)
      expect(provider.getPublicKey()).toBeDefined()
    })
  })

  describe('getPublicKey', () => {
    it('should return the public key when configured via env', () => {
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'a-valid-public-key-that-is-longer-than-twenty-chars'
      process.env.VAPID_PRIVATE_KEY = 'a-valid-private-key-that-is-longer-than-twenty-chars'

      const { PushProvider } = require('@/lib/providers/push.provider')
      const provider = new PushProvider()

      expect(provider.getPublicKey()).toBe('a-valid-public-key-that-is-longer-than-twenty-chars')
    })
  })

  describe('send', () => {
    it('should send push notification successfully', async () => {
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'a-valid-public-key-that-is-longer-than-twenty-chars'
      process.env.VAPID_PRIVATE_KEY = 'a-valid-private-key-that-is-longer-than-twenty-chars'

      const webpush = require('web-push')
      webpush.sendNotification.mockResolvedValue({})

      const { PushProvider } = require('@/lib/providers/push.provider')
      const provider = new PushProvider()

      const result = await provider.send({
        subscription: {
          endpoint: 'https://push.example.com/sub/123',
          keys: { p256dh: 'key1', auth: 'key2' },
        },
        title: 'Test',
        body: 'Test body',
      })

      expect(result.success).toBe(true)
      expect(webpush.sendNotification).toHaveBeenCalled()
    })

    it('should handle send errors', async () => {
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'a-valid-public-key-that-is-longer-than-twenty-chars'
      process.env.VAPID_PRIVATE_KEY = 'a-valid-private-key-that-is-longer-than-twenty-chars'

      const webpush = require('web-push')
      webpush.sendNotification.mockRejectedValue(new Error('Subscription expired'))

      const { PushProvider } = require('@/lib/providers/push.provider')
      const provider = new PushProvider()

      const result = await provider.send({
        subscription: {
          endpoint: 'https://push.example.com/sub/123',
          keys: { p256dh: 'key1', auth: 'key2' },
        },
        title: 'Test',
        body: 'Test body',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Subscription expired')
    })
  })
})
