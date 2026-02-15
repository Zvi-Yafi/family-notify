import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { event as gaEvent } from '@/lib/analytics'
import { Mail, Chrome, Lock, User, AlertCircle } from 'lucide-react'
import { useFamilyContext } from '@/lib/context/family-context'
import { Footer } from '@/components/footer'

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const isValidPhone = (value: string) => {
  const cleaned = value.replace(/[\s\-()]/g, '')
  return /^(\+?\d{9,15})$/.test(cleaned)
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const { refreshGroups } = useFamilyContext()

  const emailError = touched.email && email && !isValidEmail(email) ? 'כתובת מייל לא תקינה' : ''
  const phoneError = touched.phone && phone && !isValidPhone(phone) ? 'מספר טלפון לא תקין (9-15 ספרות)' : ''
  const signInEmailError = touched.signInEmail && email && !isValidEmail(email) ? 'כתובת מייל לא תקינה' : ''

  // Check for errors in URL
  useEffect(() => {
    const error = router.query.error
    if (error) {
      let errorDescription = 'חלה שגיאה בהתחברות'
      if (error === 'access_denied') {
        errorDescription = 'הגישה נדחתה. ייתכן שהקישור פג תוקף או שכבר נעשה בו שימוש.'
      }

      toast({
        title: 'שגיאת התחברות',
        description: errorDescription,
        variant: 'destructive',
      })
    }
  }, [router.query, toast])

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      const redirectToParam = router.query.redirectTo as string
      // IMPORTANT: redirectTo must be /api/auth/callback, NOT /feed!
      // The callback route will handle the OAuth code and then redirect to the original destination
      let callbackUrl = `${window.location.origin}/api/auth/callback`
      if (redirectToParam) {
        callbackUrl += `?redirectTo=${encodeURIComponent(redirectToParam)}`
      }

      console.log('🔐 Google OAuth redirect URL:', callbackUrl)

      gaEvent('login', { method: 'google' })

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        throw error
      }

      // User will be redirected to Google
    } catch (error: any) {
      console.error('❌ Login error:', error)
      toast({
        title: 'שגיאת התחברות',
        description: 'לא הצלחנו להתחבר עם Google. אנא נסה שוב.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast({
        title: 'שגיאה',
        description: 'נא למלא את כל השדות',
        variant: 'destructive',
      })
      return
    }

    if (!isValidEmail(email)) {
      toast({
        title: 'מייל לא תקין',
        description: 'נא להזין כתובת מייל תקינה, לדוגמה: name@example.com',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        let errorTitle = 'שגיאת התחברות'
        let errorMessage = 'חלה שגיאה בהתחברות. אנא נסה שוב.'

        if (error.message === 'Invalid login credentials') {
          errorTitle = 'פרטים שגויים'
          errorMessage = 'האימייל או הסיסמה לא נכונים. אם עדיין לא נרשמת, עבור ללשונית "הרשמה" כדי ליצור חשבון חדש.'
        } else if (error.message?.includes('Email not confirmed')) {
          errorTitle = 'נדרש אימות מייל'
          errorMessage = 'אנא בדוק את תיבת המייל שלך ולחץ על קישור האימות לפני ההתחברות.'
        } else if (error.message?.includes('Too many requests')) {
          errorTitle = 'יותר מדי ניסיונות'
          errorMessage = 'ביצעת יותר מדי ניסיונות התחברות. אנא המתן מספר דקות ונסה שוב.'
        }

        toast({
          title: errorTitle,
          description: errorMessage,
          variant: 'destructive',
        })
        return
      }

      if (data?.session) {
        await new Promise((resolve) => setTimeout(resolve, 200))

        try {
          await refreshGroups()
        } catch (refreshError) {
          console.error('Failed to refresh groups:', refreshError)
        }
      }

      toast({
        title: 'התחברת בהצלחה! 🎉',
        description: 'מעביר אותך...',
      })

      gaEvent('login', { method: 'email' })

      const dest = (router.query.redirectTo as string) || '/feed'
      router.push(dest)
    } catch (error: any) {
      console.error('Sign in error:', error)
      toast({
        title: 'שגיאה בלתי צפויה',
        description: 'לא הצלחנו להתחבר. בדוק את חיבור האינטרנט ונסה שוב.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !password) {
      toast({
        title: 'שגיאה',
        description: 'נא למלא את השם והסיסמה',
        variant: 'destructive',
      })
      return
    }

    if (!email && !phone) {
      toast({
        title: 'שגיאה',
        description: 'נא למלא לפחות מייל או מספר טלפון',
        variant: 'destructive',
      })
      return
    }

    if (email && !isValidEmail(email)) {
      toast({
        title: 'מייל לא תקין',
        description: 'נא להזין כתובת מייל תקינה, לדוגמה: name@example.com',
        variant: 'destructive',
      })
      return
    }

    if (phone && !isValidPhone(phone)) {
      toast({
        title: 'טלפון לא תקין',
        description: 'נא להזין מספר טלפון תקין (9-15 ספרות). לדוגמה: 050-1234567 או +972501234567',
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
      
      let signupEmail = email
      let isTemporaryEmail = false
      
      if (!email && phone) {
        const cleanPhone = phone.replace(/[^0-9]/g, '')
        signupEmail = `phone_${cleanPhone}@temp.familynotify.internal`
        isTemporaryEmail = true
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password,
        options: {
          data: {
            full_name: name,
            phone_number: phone,
            is_temp_email: isTemporaryEmail,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      // Check if email confirmation is required
      if (data?.user && !data.session) {
        try {
          await fetch('/api/auth/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: data.user.id,
              email: isTemporaryEmail ? null : (email || null),
              name: name,
              phone: phone || data.user.phone || null,
            }),
          })
        } catch (syncError) {
          console.error('Failed to create user:', syncError)
        }

        gaEvent('sign_up', { method: 'email' })

        if (isTemporaryEmail) {
          toast({
            title: 'הרשמה הושלמה! 🎉',
            description: 'החשבון שלך נוצר בהצלחה',
          })
        } else {
          toast({
            title: 'הרשמה הושלמה! 📧',
            description: 'אנא בדוק את האימייל שלך לאימות החשבון',
          })
        }
      } else if (data?.user && data.session) {
        try {
          await fetch('/api/auth/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: data.user.id,
              email: isTemporaryEmail ? null : (email || null),
              name: name,
              phone: phone || data.user.phone || null,
            }),
          })
        } catch (syncError) {
          console.error('Failed to create user:', syncError)
        }

        // Refresh groups to load user's groups before redirect
        try {
          console.log('🔄 Refreshing groups...')
          await refreshGroups()
          console.log('✅ Groups refreshed successfully')
        } catch (refreshError) {
          console.error('Failed to refresh groups:', refreshError)
          // Don't block signup if refresh fails
        }

        gaEvent('sign_up', { method: 'email' })

        toast({
          title: 'הרשמה הושלמה! 🎉',
          description: 'מעביר אותך...',
        })
        const dest = (router.query.redirectTo as string) || '/feed'
        router.push(dest)
      }
    } catch (error: any) {
      console.error('Sign up error:', error)
      let errorMessage = 'לא הצלחנו ליצור את החשבון'
      if (error.message === 'User already registered') {
        errorMessage = 'המשתמש כבר רשום במערכת'
      } else if (error.message?.includes('Password should be at least 6 characters')) {
        errorMessage = 'הסיסמה חייבת להכיל לפחות 6 תווים'
      }

      toast({
        title: 'שגיאת הרשמה',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          {/* ... existing CardContent ... */}
          <CardHeader className="text-center p-4 sm:p-6">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="h-12 w-12 sm:h-16 sm:w-16 bg-blue-600 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl">ברוכים הבאים</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              התחברו או הירשמו ל-FamilyNotify
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-auto">
                <TabsTrigger value="signin" className="text-sm sm:text-base py-2 sm:py-1.5">
                  התחברות
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-sm sm:text-base py-2 sm:py-1.5">
                  הרשמה
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleEmailSignIn} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm sm:text-base">
                      אימייל
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, signInEmail: true }))}
                      disabled={loading}
                      required
                      className={signInEmailError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    {signInEmailError && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {signInEmailError}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm sm:text-base">
                      סיסמה
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <div className="flex justify-end mt-1">
                      <Button
                        variant="link"
                        className="p-0 h-auto text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => router.push('/forgot-password')}
                        type="button"
                      >
                        שכחתי סיסמה?
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    <Lock className="ml-2 h-5 w-5" />
                    {loading ? 'מתחבר...' : 'התחבר'}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">או</span>
                  </div>
                </div>

                <Button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  size="lg"
                  className="w-full"
                  variant="outline"
                >
                  <Chrome className="ml-2 h-5 w-5" />
                  {loading ? 'מתחבר...' : 'התחבר עם Google'}
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-4">
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm sm:text-base">
                      שם מלא
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="ישראל ישראלי"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm sm:text-base">
                      אימייל (אופציונלי)
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                      disabled={loading}
                      className={emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    {emailError && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {emailError}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone" className="text-sm sm:text-base">
                      טלפון (אופציונלי)
                    </Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+972-50-1234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                      disabled={loading}
                      className={phoneError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    {phoneError ? (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {phoneError}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">נא למלא לפחות מייל או טלפון</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm sm:text-base">
                      סיסמה
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">לפחות 6 תווים</p>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    <User className="ml-2 h-5 w-5" />
                    {loading ? 'נרשם...' : 'הירשם'}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">או</span>
                  </div>
                </div>

                <Button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  size="lg"
                  className="w-full"
                  variant="outline"
                >
                  <Chrome className="ml-2 h-5 w-5" />
                  {loading ? 'מתחבר...' : 'הירשם עם Google'}
                </Button>
              </TabsContent>
            </Tabs>

            <Button
              onClick={() => router.push('/onboarding')}
              variant="ghost"
              size="sm"
              className="w-full"
              disabled={loading}
            >
              המשך כאורח
            </Button>

            <p className="text-center text-sm text-muted-foreground pt-4 border-t">
              בהתחברות, אתם מסכימים ל
              <Link href="/legal/terms" className="underline hover:text-primary mx-1">
                תנאי השימוש
              </Link>
              ול
              <Link
                href="https://famnotify.com/legal/privacy"
                className="underline hover:text-primary mx-1"
              >
                מדיניות הפרטיות (Privacy Policy)
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}
