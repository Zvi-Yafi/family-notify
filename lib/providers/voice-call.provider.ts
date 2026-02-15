export interface VoiceCallOptions {
  to: string
  text: string
}

export interface BatchVoiceCallOptions {
  recipients: Array<{
    phone: string
    userId: string
    attemptId: string
  }>
  text: string
}

export class VoiceCallProvider {
  private username: string | undefined
  private password: string | undefined
  private baseUrl = 'https://www.call2all.co.il/ym/api'

  constructor() {
    this.username = process.env.YEMOT_USERNAME
    this.password = process.env.YEMOT_PASSWORD

    if (!this.isConfigured()) {
      console.warn('⚠️  Yemot Hamashiach credentials not configured')
      console.warn('   Set YEMOT_USERNAME and YEMOT_PASSWORD in .env')
    }
  }

  isConfigured(): boolean {
    return !!(this.username && this.password)
  }

  async send(options: VoiceCallOptions): Promise<{
    success: boolean
    messageId?: string
    error?: string
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Voice call provider not configured'
      }
    }

    try {
      const phone = this.normalizeIsraeliPhone(options.to)
      if (!phone) {
        return {
          success: false,
          error: 'Invalid Israeli phone number format'
        }
      }

      const token = `${this.username}:${this.password}`

      const params = new URLSearchParams({
        token,
        ttsMessage: options.text,
        phones: phone,
        repeatFile: '1',
        ttsRate: '0',
      })

      console.log(`📞 Sending TTS call to ${phone}`)

      const response = await fetch(`${this.baseUrl}/SendTTS?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Yemot API error:', errorText)
        return {
          success: false,
          error: `API returned ${response.status}: ${errorText}`
        }
      }

      const data = await response.json()

      if (data.responseStatus === 'OK') {
        console.log(`✅ Voice call sent successfully. Campaign: ${data.CampaignId}`)
        console.log(`   OK Calls: ${data.OKCalls}, Billing: ${data.billing} units`)
        return {
          success: true,
          messageId: data.CampaignId
        }
      } else if (data.responseStatus === 'ERROR' || data.responseStatus === 'EXCEPTION') {
        console.error(`❌ Yemot error [${data.messageCode || 'UNKNOWN'}]: ${data.message}`)
        return {
          success: false,
          error: `${data.message} (Code: ${data.messageCode || 'UNKNOWN'})`
        }
      } else {
        return {
          success: false,
          error: data.message || 'Unknown response status'
        }
      }

    } catch (error: any) {
      console.error('Voice call error:', error)
      return {
        success: false,
        error: error.message || 'Unknown error'
      }
    }
  }

  private normalizeIsraeliPhone(phone: string): string | null {
    let cleaned = phone.replace(/[\s\-\(\)]/g, '')

    if (cleaned.startsWith('+972')) {
      cleaned = '0' + cleaned.substring(4)
    } else if (cleaned.startsWith('972')) {
      cleaned = '0' + cleaned.substring(3)
    } else if (!cleaned.startsWith('0')) {
      return null
    }

    if (cleaned.length !== 10) {
      return null
    }

    const validPrefixes = ['02', '03', '04', '08', '09', '050', '051', '052', '053', '054', '055', '058', '072', '073', '074', '076', '077', '078']
    const hasValidPrefix = validPrefixes.some(prefix => cleaned.startsWith(prefix))
    
    if (!hasValidPrefix) {
      return null
    }

    return cleaned
  }

  async sendBatch(options: BatchVoiceCallOptions): Promise<{
    success: boolean
    campaignId?: string
    results: Map<string, { success: boolean; error?: string }>
  }> {
    const results = new Map<string, { success: boolean; error?: string }>()

    if (!this.isConfigured()) {
      options.recipients.forEach(recipient => {
        results.set(recipient.phone, {
          success: false,
          error: 'Voice call provider not configured'
        })
      })
      return {
        success: false,
        results
      }
    }

    if (options.recipients.length === 0) {
      return {
        success: true,
        results
      }
    }

    try {
      const normalizedPhones: string[] = []
      const phoneToRecipient = new Map<string, typeof options.recipients[0]>()

      for (const recipient of options.recipients) {
        const normalized = this.normalizeIsraeliPhone(recipient.phone)
        if (normalized) {
          normalizedPhones.push(normalized)
          phoneToRecipient.set(normalized, recipient)
        } else {
          results.set(recipient.phone, {
            success: false,
            error: 'Invalid Israeli phone number format'
          })
        }
      }

      if (normalizedPhones.length === 0) {
        return {
          success: false,
          results
        }
      }

      const token = `${this.username}:${this.password}`
      const phonesParam = normalizedPhones.join(':')

      const params = new URLSearchParams({
        token,
        ttsMessage: options.text,
        phones: phonesParam,
        repeatFile: '1',
        ttsRate: '0',
      })

      console.log(`📞 Sending batch TTS call to ${normalizedPhones.length} recipients`)

      const response = await fetch(`${this.baseUrl}/SendTTS?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Yemot API error:', errorText)
        normalizedPhones.forEach(phone => {
          const recipient = phoneToRecipient.get(phone)
          if (recipient) {
            results.set(recipient.phone, {
              success: false,
              error: `API returned ${response.status}: ${errorText}`
            })
          }
        })
        return {
          success: false,
          results
        }
      }

      const data = await response.json()

      if (data.responseStatus === 'OK') {
        console.log(`✅ Batch voice call sent successfully. Campaign: ${data.CampaignId}`)
        console.log(`   OK Calls: ${data.OKCalls}, Error Calls: ${Object.keys(data.ErrorCalls || {}).length}, Billing: ${data.billing} units`)

        normalizedPhones.forEach(phone => {
          const recipient = phoneToRecipient.get(phone)
          if (recipient) {
            results.set(recipient.phone, {
              success: true
            })
          }
        })

        if (data.ErrorCalls && typeof data.ErrorCalls === 'object') {
          Object.entries(data.ErrorCalls).forEach(([phone, reason]) => {
            const recipient = phoneToRecipient.get(phone)
            if (recipient) {
              results.set(recipient.phone, {
                success: false,
                error: `Yemot error: ${reason}`
              })
            }
          })
        }

        return {
          success: true,
          campaignId: data.CampaignId,
          results
        }
      } else if (data.responseStatus === 'ERROR' || data.responseStatus === 'EXCEPTION') {
        console.error(`❌ Yemot batch error [${data.messageCode || 'UNKNOWN'}]: ${data.message}`)
        normalizedPhones.forEach(phone => {
          const recipient = phoneToRecipient.get(phone)
          if (recipient) {
            results.set(recipient.phone, {
              success: false,
              error: `${data.message} (Code: ${data.messageCode || 'UNKNOWN'})`
            })
          }
        })
        return {
          success: false,
          results
        }
      } else {
        normalizedPhones.forEach(phone => {
          const recipient = phoneToRecipient.get(phone)
          if (recipient) {
            results.set(recipient.phone, {
              success: false,
              error: data.message || 'Unknown response status'
            })
          }
        })
        return {
          success: false,
          results
        }
      }

    } catch (error: any) {
      console.error('Batch voice call error:', error)
      options.recipients.forEach(recipient => {
        results.set(recipient.phone, {
          success: false,
          error: error.message || 'Unknown error'
        })
      })
      return {
        success: false,
        results
      }
    }
  }

  async sendVerificationCode(phone: string, code: string): Promise<{
    success: boolean
    error?: string
  }> {
    return this.send({
      to: phone,
      text: `שלום! קוד האימות שלך ב-FamilyNotify הוא: ${code}. הקוד תקף ל-10 דקות.`
    })
  }
}

export const voiceCallProvider = new VoiceCallProvider()
