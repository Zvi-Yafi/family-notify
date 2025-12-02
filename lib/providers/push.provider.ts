import webpush from 'web-push'
import fs from 'fs'
import path from 'path'

export interface PushOptions {
  subscription: PushSubscription
  title: string
  body: string
  data?: any
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export class PushProvider {
  private vapidKeys: { publicKey: string; privateKey: string } | null = null

  constructor() {
    this.initializeVapid()
  }

  private initializeVapid() {
    // Try to load from environment variables
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY

    // Check if keys are valid (not placeholder values)
    if (publicKey && privateKey && 
        publicKey !== '[AUTO-GENERATED]' && privateKey !== '[AUTO-GENERATED]' &&
        publicKey.length > 20 && privateKey.length > 20) {
      this.vapidKeys = { publicKey, privateKey }
      webpush.setVapidDetails(
        'mailto:noreply@familynotify.com',
        publicKey,
        privateKey
      )
      return
    }

    // Try to load from file
    const keysPath = path.join(process.cwd(), 'vapid-keys.json')
    if (fs.existsSync(keysPath)) {
      const keys = JSON.parse(fs.readFileSync(keysPath, 'utf-8'))
      this.vapidKeys = keys
      webpush.setVapidDetails(
        'mailto:noreply@familynotify.com',
        keys.publicKey,
        keys.privateKey
      )
      return
    }

    // Generate new keys
    console.log('🔑 Generating new VAPID keys...')
    const keys = webpush.generateVAPIDKeys()
    this.vapidKeys = keys

    // Save to file
    try {
      fs.writeFileSync(keysPath, JSON.stringify(keys, null, 2))
      console.log('✅ VAPID keys saved to vapid-keys.json')
      console.log('📝 Add these to your .env file:')
      console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${keys.publicKey}"`)
      console.log(`VAPID_PRIVATE_KEY="${keys.privateKey}"`)
    } catch (error) {
      console.error('⚠️  Could not save VAPID keys to file:', error)
    }

    webpush.setVapidDetails(
      'mailto:noreply@familynotify.com',
      keys.publicKey,
      keys.privateKey
    )
  }

  isConfigured(): boolean {
    return this.vapidKeys !== null
  }

  getPublicKey(): string | null {
    return this.vapidKeys?.publicKey || null
  }

  async send(options: PushOptions): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Push provider not configured',
      }
    }

    try {
      const payload = JSON.stringify({
        title: options.title,
        body: options.body,
        data: options.data,
      })

      await webpush.sendNotification(options.subscription, payload)

      return { success: true }
    } catch (error: any) {
      console.error('Push send error:', error)
      return {
        success: false,
        error: error.message || 'Unknown error',
      }
    }
  }
}

export const pushProvider = new PushProvider()


