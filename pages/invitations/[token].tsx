import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { Header } from '@/components/header'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, AlertCircle, Mail, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useFamilyContext } from '@/lib/context/family-context'

export default function InvitationPage() {
  const router = useRouter()
  const { token } = router.query
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [invitation, setInvitation] = useState<any>(null)
  const [context, setContext] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()
  const { refreshGroups } = useFamilyContext()

  const loadInvitation = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/invitations/${token}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'נכשל בטעינת ההזמנה')
      }

      setInvitation(data.invitation)
      setContext(data.context)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      loadInvitation()
    }
  }, [token, loadInvitation])

  const handleAccept = async () => {
    // If not logged in, redirect to login
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    try {
      setAccepting(true)
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'נכשל בקבלת ההזמנה')
      }

      toast({
        title: 'הצטרפת בהצלחה!',
        description: `ברוך הבא לקבוצת ${invitation.familyGroup.name}. כעת ניתן להגדיר העדפות.`,
      })

      // Refresh groups in context so the user sees them everywhere immediately
      await refreshGroups()

      // Redirect to preferences
      router.push('/preferences?message=joined')
    } catch (err: any) {
      toast({
        title: 'שגיאה',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-20 flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>אופס!</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full" onClick={() => router.push('/')}>
                חזרה לדף הבית
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">הוזמנת להצטרף!</CardTitle>
            <CardDescription className="text-lg mt-2">
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {invitation.inviter.name || invitation.inviter.email}
              </span>{' '}
              מזמין/ה אותך להצטרף לקבוצת{' '}
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {invitation.familyGroup.name}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              הצטרף לקבוצה כדי לקבל עדכונים, הודעות ואירועים ישירות אליך.
            </p>

            {context.isMember && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3 text-right">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-200">
                  נראה שאת/ה כבר חבר/ה בקבוצה זו.
                </p>
              </div>
            )}

            {!context.isSameUser && context.currentUserEmail && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-right">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  שימי לב: ההרשמה במייל <strong>{context.currentUserEmail}</strong>, אך ההזמנה נשלחה
                  ל-<strong>{invitation.email}</strong>.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            {context.isMember ? (
              <Button className="w-full" onClick={() => router.push('/feed')}>
                למעבר להודעות
              </Button>
            ) : (
              <Button className="w-full text-lg h-12" onClick={handleAccept} disabled={accepting}>
                {accepting ? (
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />
                ) : (
                  <UserPlus className="h-5 w-5 ml-2" />
                )}
                קבל הזמנה והצטרף
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
