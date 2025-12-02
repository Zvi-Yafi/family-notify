// WhatsApp Provider (Cloud API) - Stub implementation
// To enable: Set WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, and WHATSAPP_BUSINESS_ACCOUNT_ID in .env

export interface WhatsAppOptions {
  to: string
  message: string
}

export class WhatsAppProvider {
  private phoneNumberId: string | undefined
  private accessToken: string | undefined
  private businessAccountId: string | undefined

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID

    if (!this.isConfigured()) {
      console.warn('⚠️  WhatsApp credentials not configured - WhatsApp sending disabled')
      console.warn('   To enable WhatsApp: Set WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, and WHATSAPP_BUSINESS_ACCOUNT_ID')
    }
  }

  isConfigured(): boolean {
    return !!(this.phoneNumberId && this.accessToken && this.businessAccountId)
  }

  async send(options: WhatsAppOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'WhatsApp provider not configured. Please add WhatsApp Cloud API credentials to enable WhatsApp.',
      }
    }

    try {
      // Actual WhatsApp Cloud API implementation would go here:
      // const response = await fetch(
      //   `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       'Authorization': `Bearer ${this.accessToken}`,
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({
      //       messaging_product: 'whatsapp',
      //       to: options.to,
      //       type: 'text',
      //       text: { body: options.message },
      //     }),
      //   }
      // )
      // const data = await response.json()
      // return { success: true, messageId: data.messages[0].id }

      console.log(`💬 [WhatsApp STUB] Would send to ${options.to}: ${options.message}`)
      
      return {
        success: true,
        messageId: `stub-wa-${Date.now()}`,
      }
    } catch (error: any) {
      console.error('WhatsApp send error:', error)
      return {
        success: false,
        error: error.message || 'Unknown error',
      }
    }
  }
}

export const whatsAppProvider = new WhatsAppProvider()



