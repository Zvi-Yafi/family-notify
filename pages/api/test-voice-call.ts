import type { NextApiRequest, NextApiResponse } from 'next'
import { voiceCallProvider } from '@/lib/providers/voice-call.provider'
import { createServerClient } from '@/lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createServerClient(req, res)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { to } = req.body

    if (!to) {
      return res.status(400).json({ error: 'Missing phone number' })
    }

    if (!voiceCallProvider.isConfigured()) {
      console.warn('⚠️  Voice call service not configured (missing YEMOT_USERNAME/PASSWORD)')
      return res.status(503).json({
        error: 'Voice call service is not configured. Please contact support.',
      })
    }

    const result = await voiceCallProvider.send({
      to,
      text: 'זוהי הודעת בדיקה מ-FamilyNotify. אם אתה שומע את ההודעה הזו, שירות ההתראות הקוליות שלך פועל בהצלחה.',
    })

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Voice call test sent successfully',
        messageId: result.messageId,
      })
    } else {
      return res.status(500).json({
        error: result.error || 'Failed to send voice call',
      })
    }
  } catch (error: any) {
    console.error('Voice call test error:', error)
    return res.status(500).json({
      error: error.message || 'Internal server error',
    })
  }
}
