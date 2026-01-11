import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    // Check if we have an active session or a valid recovery token in hash
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // If no session and no hash parameters, show error
      if (!session && !window.location.hash) {
        setError('פג תוקפו של הקישור או שהוא אינו תקין. נא לבקש איפוס סיסמה חדש.')
      }
    }

    checkSession()
  }, [supabase.auth])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      toast({
        title: 'שגיאה',
        description: 'נא למלא את כל השדות',
        variant: 'destructive',
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: 'שגיאה',
        description: 'הסיסמאות אינן תואמות',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'שגיאה',
        description: 'הסיסמה חייבת להכיל לפחות 6 תווים',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }

      setSuccess(true)
      toast({
        title: 'הסיסמה שונתה בהצלחה! 🔐',
        description: 'כעת תוכל להתחבר עם הסיסמה החדשה',
      })

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error: any) {
      console.error('Reset password error:', error)
      let errorMessage = 'לא הצלחנו לעדכן את הסיסמה. אנא נסה שוב.'
      if (error.message?.includes('New password should be different')) {
        errorMessage = 'הסיסמה החדשה חייבת להיות שונה מהקודמת'
      }

      toast({
        title: 'שגיאה',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">קביעת סיסמה חדשה</CardTitle>
            <CardDescription>
              {success ? 'הסיסמה שלך עודכנה' : error ? 'משהו השתבש' : 'בחר סיסמה חדשה לחשבון שלך'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {success ? (
              <div className="text-center py-4 space-y-4">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  הסיסמה שלך עודכנה בהצלחה. מעביר אותך להתחברות...
                </p>
                <Button className="w-full" onClick={() => router.push('/login')}>
                  חזרה להתחברות
                </Button>
              </div>
            ) : error ? (
              <div className="text-center py-4 space-y-4">
                <div className="flex justify-center">
                  <AlertCircle className="h-12 w-12 text-destructive" />
                </div>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <Button className="w-full" onClick={() => router.push('/forgot-password')}>
                  שלח בקשה חדשה
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">סיסמה חדשה</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground italic">לפחות 6 תווים</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">אימות סיסמה</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'מעדכן...' : 'עדכן סיסמה'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}
