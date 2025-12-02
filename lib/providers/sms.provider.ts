// SMS Provider (Twilio) - Stub implementation
// To enable: Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env

export interface SmsOptions {
  to: string
  message: string
}

export class SmsProvider {
  private accountSid: string | undefined
  private authToken: string | undefined
  private fromPhone: string | undefined

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID
    this.authToken = process.env.TWILIO_AUTH_TOKEN
    this.fromPhone = process.env.TWILIO_PHONE_NUMBER

    if (!this.isConfigured()) {
      console.warn('⚠️  Twilio credentials not configured - SMS sending disabled')
      console.warn('   To enable SMS: Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER')
    }
  }

  isConfigured(): boolean {
    return !!(this.accountSid && this.authToken && this.fromPhone)
  }

  async send(options: SmsOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'SMS provider not configured. Please add Twilio credentials to enable SMS.',
      }
    }

    try {
      // Actual Twilio implementation would go here:
      // const twilio = require('twilio')(this.accountSid, this.authToken)
      // const message = await twilio.messages.create({
      //   body: options.message,
      //   from: this.fromPhone,
      //   to: options.to,
      // })
      // return { success: true, messageId: message.sid }

      console.log(`📱 [SMS STUB] Would send to ${options.to}: ${options.message}`)
      
      return {
        success: true,
        messageId: `stub-${Date.now()}`,
      }
    } catch (error: any) {
      console.error('SMS send error:', error)
      return {
        success: false,
        error: error.message || 'Unknown error',
      }
    }
  }

  async sendVerificationCode(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
    return this.send({
      to: phone,
      message: `קוד האימות שלך ב-FamilyNotify: ${code}\nהקוד תקף ל-10 דקות.`,
    })
  }
}

export const smsProvider = new SmsProvider()



