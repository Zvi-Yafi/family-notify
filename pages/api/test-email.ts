import type { NextApiRequest, NextApiResponse } from 'next'
import { emailProvider } from '@/lib/providers/email.provider'
import { createServerClient } from '@/lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get authenticated user
    const supabase = createServerClient(req, res)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { to } = req.body

    if (!to || typeof to !== 'string') {
      return res.status(400).json({ error: 'Email address (to) is required' })
    }

    // Check if email provider is configured
    if (!emailProvider.isConfigured()) {
      return res.status(500).json({
        error: 'Email provider not configured',
        details: 'RESEND_API_KEY is missing or invalid',
      })
    }

    console.log(`📧 Testing email send to: ${to}`)

    // Send test email
    const result = await emailProvider.send({
      to,
      subject: '🧪 בדיקת אימייל - FamilyNotify',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">בדיקת אימייל - FamilyNotify</h2>
          <p>שלום,</p>
          <p>זהו אימייל בדיקה מ-FamilyNotify.</p>
          <p>אם קיבלת את האימייל הזה, זה אומר שההגדרות של Resend עובדות מצוין! ✅</p>
          <div style="background: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>פרטי הבדיקה:</strong></p>
            <p style="margin: 5px 0;">נשלח ב: ${new Date().toLocaleString('he-IL')}</p>
            <p style="margin: 5px 0;">מאת: ${user.email}</p>
          </div>
          <p>בברכה,<br>צוות FamilyNotify</p>
        </div>
      `,
      text: `בדיקת אימייל - FamilyNotify\n\nזהו אימייל בדיקה. אם קיבלת את זה, הכל עובד! ✅`,
    })

    if (result.success) {
      console.log(`✅ Test email sent successfully! Message ID: ${result.messageId}`)
      return res.status(200).json({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId,
      })
    } else {
      console.error(`❌ Failed to send test email: ${result.error}`)
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to send email',
      })
    }
  } catch (error: any) {
    console.error('Error in test-email endpoint:', error)
    return res.status(500).json({
      error: error.message || 'Failed to send test email',
    })
  }
}
