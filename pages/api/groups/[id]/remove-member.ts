import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { invalidateGroupCache } from '@/lib/services/cached-endpoints.service'

const SUPER_ADMIN_EMAIL = 'z0533113784@gmail.com'

type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'INVALID_REQUEST'
  | 'SELF_REMOVAL'
  | 'PERMISSION_DENIED'
  | 'MEMBER_NOT_FOUND'
  | 'LAST_ADMIN'
  | 'SERVER_ERROR'

interface ErrorResponse {
  error: string
  code: ErrorCode
}

function errorResponse(res: NextApiResponse, status: number, error: string, code: ErrorCode) {
  return res.status(status).json({ error, code } as ErrorResponse)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 405, 'שיטת בקשה לא נתמכת', 'INVALID_REQUEST')
  }

  try {
    const supabase = createServerClient(req, res)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse(res, 401, 'יש להתחבר כדי לבצע פעולה זו', 'AUTH_REQUIRED')
    }

    const { id: groupId } = req.query
    const { userId: targetUserId } = req.body

    if (!groupId || typeof groupId !== 'string') {
      return errorResponse(res, 400, 'מזהה קבוצה חסר או לא תקין', 'INVALID_REQUEST')
    }

    if (!targetUserId || typeof targetUserId !== 'string') {
      return errorResponse(res, 400, 'מזהה משתמש להסרה חסר או לא תקין', 'INVALID_REQUEST')
    }

    if (user.id === targetUserId) {
      return errorResponse(
        res,
        400,
        'לא ניתן להסיר את עצמך מהקבוצה. אם ברצונך לעזוב, השתמש באפשרות "עזוב קבוצה" בדף הקבוצות.',
        'SELF_REMOVAL'
      )
    }

    const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL

    const requesterMembership = await prisma.membership.findUnique({
      where: {
        userId_familyGroupId: {
          userId: user.id,
          familyGroupId: groupId,
        },
      },
    })

    if (!isSuperAdmin && !requesterMembership) {
      return errorResponse(res, 403, 'אינך חבר בקבוצה זו', 'PERMISSION_DENIED')
    }

    if (!isSuperAdmin && requesterMembership?.role !== 'ADMIN') {
      return errorResponse(
        res,
        403,
        'רק מנהל קבוצה יכול להסיר חברים. פנה למנהל הקבוצה לביצוע פעולה זו.',
        'PERMISSION_DENIED'
      )
    }

    const targetMembership = await prisma.membership.findUnique({
      where: {
        userId_familyGroupId: {
          userId: targetUserId,
          familyGroupId: groupId,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!targetMembership) {
      return errorResponse(
        res,
        404,
        'המשתמש שביקשת להסיר אינו חבר בקבוצה זו. ייתכן שכבר הוסר או עזב.',
        'MEMBER_NOT_FOUND'
      )
    }

    if (targetMembership.role === 'ADMIN') {
      const adminCount = await prisma.membership.count({
        where: {
          familyGroupId: groupId,
          role: 'ADMIN',
        },
      })

      if (adminCount === 1) {
        const memberName = targetMembership.user.name || targetMembership.user.email || 'המשתמש'
        return errorResponse(
          res,
          400,
          `לא ניתן להסיר את ${memberName} כי הוא המנהל היחיד בקבוצה. יש למנות מנהל נוסף לפני ההסרה.`,
          'LAST_ADMIN'
        )
      }
    }

    await prisma.membership.delete({
      where: {
        id: targetMembership.id,
      },
    })

    invalidateGroupCache(groupId)

    const memberName = targetMembership.user.name || targetMembership.user.email || 'המשתמש'

    return res.status(200).json({
      success: true,
      message: `${memberName} הוסר מהקבוצה בהצלחה`,
      removedMember: {
        id: targetUserId,
        name: targetMembership.user.name,
        email: targetMembership.user.email,
      },
    })
  } catch (error: any) {
    console.error('Error removing member:', error)
    return errorResponse(
      res,
      500,
      'אירעה שגיאה בלתי צפויה בהסרת החבר. אנא נסה שוב מאוחר יותר או פנה לתמיכה.',
      'SERVER_ERROR'
    )
  }
}
