import { Resend } from 'resend'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export class EmailProvider {
  private resend: Resend | null = null
  private fromEmail: string

  constructor() {
    const apiKey = process.env.RESEND_API_KEY
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'FamilyNotify <noreply@example.com>'

    if (apiKey) {
      this.resend = new Resend(apiKey)
      console.log('✅ Email provider (Resend) initialized')
      console.log(`   From: ${this.fromEmail}`)
    } else {
      console.warn('⚠️  RESEND_API_KEY not configured - email sending disabled')
    }
  }

  isConfigured(): boolean {
    return this.resend !== null
  }

  async send(
    options: EmailOptions
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Email provider not configured',
      }
    }

    try {
      const result = await this.resend!.emails.send({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      })

      if (result.error) {
        return {
          success: false,
          error: result.error.message,
        }
      }

      return {
        success: true,
        messageId: result.data?.id,
      }
    } catch (error: any) {
      console.error('Email send error:', error)

      // Check if it's a Resend testing mode limitation
      const errorMessage = error.message || ''
      if (errorMessage.includes('You can only send testing emails')) {
        console.error('⚠️  RESEND TESTING MODE LIMITATION:')
        console.error('   You can only send emails to your own address in testing mode.')
        console.error('   Solutions:')
        console.error('   1. Add recipient to "Allowed Recipients" in Resend dashboard')
        console.error('   2. Verify a domain at https://resend.com/domains (recommended)')
        console.error('   3. Use a Production API key')
        console.error('   See RESEND_EMAIL_FIX.md for details')
      }

      return {
        success: false,
        error: error.message || 'Unknown error',
      }
    }
  }

  async sendVerificationCode(
    email: string,
    code: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.send({
      to: email,
      subject: 'קוד אימות - FamilyNotify',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>קוד האימות שלך</h2>
          <p>שלום,</p>
          <p>קוד האימות שלך הוא:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p>הקוד תקף ל-10 דקות.</p>
          <p>אם לא ביקשת קוד זה, אנא התעלם מהודעה זו.</p>
          <br>
          <p>בברכה,<br>צוות FamilyNotify</p>
        </div>
      `,
      text: `קוד האימות שלך: ${code}\nהקוד תקף ל-10 דקות.`,
    })
  }
}

export const emailProvider = new EmailProvider()
