import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין כתובת אימייל',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/api/auth/callback?redirectTo=/reset-password`,
      })

      if (error) {
        throw error
      }

      setSubmitted(true)
      toast({
        title: 'נשלח! 📧',
        description: 'שלחנו הוראות לאיפוס סיסמה למייל שלך',
      })
    } catch (error: any) {
      console.error('Reset request error:', error)
      toast({
        title: 'שגיאה',
        description: 'חלה שגיאה בשליחת בקשת האיפוס. אנא וודא שהאימייל תקין ונסה שוב.',
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
                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">איפוס סיסמה</CardTitle>
            <CardDescription>
              {submitted
                ? 'בדוק את המייל שלך להוראות נוספות'
                : 'הכנס את המייל שלך ונשלח לך קישור לאיפוס הסיסמה'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!submitted ? (
              <form onSubmit={handleResetRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
                </Button>
              </form>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  נשלח מייל ל-<strong>{email}</strong> עם קישור לאיפוס הסיסמה. אל תשכח לבדוק גם
                  בתיקיית הספאם.
                </p>
                <Button variant="outline" className="w-full" onClick={() => setSubmitted(false)}>
                  שלח שוב
                </Button>
              </div>
            )}

            <div className="pt-4 border-t">
              <Link
                href="/login"
                className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowRight className="ml-2 h-4 w-4" />
                חזרה להתחברות
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}
