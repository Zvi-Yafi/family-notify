// WhatsApp Provider (Green API) - Implementation
// To enable: Set GREEN_API_ID_INSTANCE and GREEN_API_TOKEN_INSTANCE in .env

export interface WhatsAppOptions {
  to: string
  message: string
}

export class WhatsAppProvider {
  private idInstance: string | undefined
  private apiTokenInstance: string | undefined

  constructor() {
    this.idInstance = process.env.GREEN_API_ID_INSTANCE
    this.apiTokenInstance = process.env.GREEN_API_TOKEN_INSTANCE

    if (!this.isConfigured()) {
      console.warn('⚠️  WhatsApp credentials not configured - WhatsApp sending disabled')
      console.warn('   To enable WhatsApp: Set GREEN_API_ID_INSTANCE and GREEN_API_TOKEN_INSTANCE')
    }
  }

  isConfigured(): boolean {
    return !!(this.idInstance && this.apiTokenInstance)
  }

  /**
   * Normalize phone number to Green API format (number@c.us)
   * Converts to international format (972 for Israel)
   * Handles Israeli numbers starting with 0 (converts to 972)
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '')

    // Handle Israeli numbers that start with 0
    // Convert 0XX to 972XX (Israeli country code)
    if (digits.startsWith('0') && digits.length === 10) {
      // Israeli mobile/landline: remove leading 0 and add 972
      digits = '972' + digits.substring(1)
    } else if (digits.startsWith('972') && digits.length === 12) {
      // Already in international format with 972
      // Keep as is
    } else if (!digits.startsWith('972') && digits.length >= 9 && digits.length <= 10) {
      // Assume it's an Israeli number without country code
      // Add 972 prefix
      digits = '972' + digits
    }

    // Return in format: number@c.us
    return `${digits}@c.us`
  }

  async send(
    options: WhatsAppOptions
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error:
          'WhatsApp provider not configured. Please add Green API credentials to enable WhatsApp.',
      }
    }

    try {
      // Normalize phone number to Green API format
      const chatId = this.normalizePhoneNumber(options.to)

      console.log(`💬 Sending WhatsApp to ${chatId}`)

      // Green API implementation
      const apiUrl = `https://api.green-api.com/waInstance${this.idInstance}/sendMessage/${this.apiTokenInstance}`

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chatId,
          message: options.message,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || data.message || JSON.stringify(data) || 'Unknown error'
        console.error(`❌ Green API error:`, data)
        return {
          success: false,
          error: errorMessage,
        }
      }

      if (data.idMessage) {
        console.log(`✅ WhatsApp sent successfully! Message ID: ${data.idMessage}`)
        return {
          success: true,
          messageId: data.idMessage,
        }
      }

      return {
        success: false,
        error: 'Unexpected response from Green API',
      }
    } catch (error: any) {
      console.error('WhatsApp send error:', error)

      // Check for common errors
      if (error.message?.includes('fetch')) {
        return {
          success: false,
          error: 'Network error. Check your internet connection and Green API endpoint.',
        }
      }

      return {
        success: false,
        error: error.message || 'Unknown error',
      }
    }
  }
}

export const whatsAppProvider = new WhatsAppProvider()
