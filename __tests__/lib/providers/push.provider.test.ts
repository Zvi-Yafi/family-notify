import { PushProvider } from '@/lib/providers/push.provider'

// Mock web-push
const mockWebPush = {
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
  generateVAPIDKeys: jest.fn(() => ({
    publicKey: 'test-public-key-generated',
    privateKey: 'test-private-key-generated',
  })),
}

jest.mock('web-push', () => mockWebPush)

// Mock fs
const mockFs = {
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}

jest.mock('fs', () => mockFs)

describe('PushProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variables
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-public-key-from-env'
    process.env.VAPID_PRIVATE_KEY = 'test-private-key-from-env'
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    delete process.env.VAPID_PRIVATE_KEY
  })

  describe('initialization', () => {
    it('should initialize with environment variables', () => {
      const provider = new PushProvider()
      
      expect(provider.isConfigured()).toBe(true)
      expect(provider.getPublicKey()).toBe('test-public-key-from-env')
      expect(mockWebPush.setVapidDetails).toHaveBeenCalledWith(
        'mailto:noreply@familynotify.com',
        'test-public-key-from-env',
        'test-private-key-from-env'
      )
    })

    it('should skip placeholder values', () => {
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = '[AUTO-GENERATED]'
      process.env.VAPID_PRIVATE_KEY = '[AUTO-GENERATED]'
      
      mockFs.existsSync.mockReturnValue(false)
      
      const provider = new PushProvider()
      
      expect(mockWebPush.generateVAPIDKeys).toHaveBeenCalled()
    })

    it('should load keys from file if env vars not set', () => {
      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      delete process.env.VAPID_PRIVATE_KEY
      
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify({
          publicKey: 'test-public-key-from-file',
          privateKey: 'test-private-key-from-file',
        })
      )

      const provider = new PushProvider()
      
      expect(provider.isConfigured()).toBe(true)
      expect(provider.getPublicKey()).toBe('test-public-key-from-file')
    })

    it('should generate new keys if none exist', () => {
      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      delete process.env.VAPID_PRIVATE_KEY
      
      mockFs.existsSync.mockReturnValue(false)

      const provider = new PushProvider()
      
      expect(mockWebPush.generateVAPIDKeys).toHaveBeenCalled()
      expect(provider.isConfigured()).toBe(true)
    })
  })

  describe('send', () => {
    it('should send push notification successfully', async () => {
      mockWebPush.sendNotification.mockResolvedValue({ statusCode: 201 })

      const provider = new PushProvider()
      
      const subscription = {
        endpoint: 'https://example.com/push',
        keys: {
          p256dh: 'test-p256dh',
          auth: 'test-auth',
        },
      }

      const result = await provider.send({
        subscription,
        title: 'Test Notification',
        body: 'Test body',
        data: { foo: 'bar' },
      })

      expect(result.success).toBe(true)
      expect(mockWebPush.sendNotification).toHaveBeenCalledWith(
        subscription,
        expect.stringContaining('Test Notification')
      )
    })

    it('should handle send failure', async () => {
      mockWebPush.sendNotification.mockRejectedValue(new Error('Send failed'))

      const provider = new PushProvider()
      
      const subscription = {
        endpoint: 'https://example.com/push',
        keys: {
          p256dh: 'test-p256dh',
          auth: 'test-auth',
        },
      }

      const result = await provider.send({
        subscription,
        title: 'Test Notification',
        body: 'Test body',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Send failed')
    })
  })

  describe('getPublicKey', () => {
    it('should return public key', () => {
      const provider = new PushProvider()
      const publicKey = provider.getPublicKey()
      
      expect(publicKey).toBeDefined()
      expect(typeof publicKey).toBe('string')
    })
  })
})


