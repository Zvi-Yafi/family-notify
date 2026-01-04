import type { NextApiRequest, NextApiResponse } from 'next'
import { whatsAppProvider } from '@/lib/providers/whatsapp.provider'
import { createServerClient } from '@/lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(200).end()
  }

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
      return res.status(400).json({ error: 'Phone number (to) is required' })
    }

    // Check if WhatsApp provider is configured
    if (!whatsAppProvider.isConfigured()) {
      return res.status(500).json({
        error: 'WhatsApp provider not configured',
        details: 'GREEN_API_ID_INSTANCE and GREEN_API_TOKEN_INSTANCE are required',
      })
    }

    console.log(`💬 Testing WhatsApp send to: ${to}`)

    // Send test WhatsApp message
    const result = await whatsAppProvider.send({
      to,
      message: `🧪 בדיקת WhatsApp - FamilyNotify\n\nזהו הודעת בדיקה מ-FamilyNotify.\nאם קיבלת את ההודעה הזו, זה אומר שההגדרות של WhatsApp עובדות מצוין! ✅\n\nנשלח ב: ${new Date().toLocaleString('he-IL')}`,
    })

    if (result.success) {
      console.log(`✅ Test WhatsApp sent successfully! Message ID: ${result.messageId}`)
      return res.status(200).json({
        success: true,
        message: 'WhatsApp message sent successfully',
        messageId: result.messageId,
      })
    } else {
      console.error(`❌ Failed to send test WhatsApp: ${result.error}`)
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to send WhatsApp message',
      })
    }
  } catch (error: any) {
    console.error('Error in test-whatsapp endpoint:', error)
    return res.status(500).json({
      error: error.message || 'Failed to send test WhatsApp message',
    })
  }
}
