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
import { Mail, Chrome, Lock, User } from 'lucide-react'
import { useFamilyContext } from '@/lib/context/family-context'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const { refreshGroups } = useFamilyContext()

  // Check for errors in URL
  useEffect(() => {
    const error = router.query.error
    if (error) {
      toast({
        title: 'שגיאת התחברות',
        description: decodeURIComponent(error as string),
        variant: 'destructive',
      })
    }
  }, [router.query, toast])

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      // IMPORTANT: redirectTo must be /api/auth/callback, NOT /feed!
      // The callback route will handle the OAuth code and then redirect to /feed
      const redirectUrl = `${window.location.origin}/api/auth/callback`

      console.log('🔐 Google OAuth redirect URL:', redirectUrl)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
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
        description: error.message || 'לא הצלחנו להתחבר עם Google',
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

    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // signInWithPassword should return session in data, but wait a bit for cookies to be set
      // The browser client from @supabase/ssr should automatically set cookies
      if (data?.session) {
        // Small delay to ensure cookies are set by the browser client
        await new Promise((resolve) => setTimeout(resolve, 200))

        // Sync user to database - include credentials to ensure cookies are sent
        try {
          const syncResponse = await fetch('/api/auth/sync-user', {
            method: 'POST',
            credentials: 'include', // Ensure cookies are sent
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (!syncResponse.ok) {
            const errorText = await syncResponse.text()
            console.error('Failed to sync user:', errorText)
            // Don't block login if sync fails, but log it
          } else {
            console.log('✅ User synced successfully')
          }
        } catch (syncError) {
          console.error('Failed to sync user:', syncError)
          // Don't block login if sync fails
        }

        // Refresh groups to load user's groups before redirect
        try {
          console.log('🔄 Refreshing groups...')
          await refreshGroups()
          console.log('✅ Groups refreshed successfully')
        } catch (refreshError) {
          console.error('Failed to refresh groups:', refreshError)
          // Don't block login if refresh fails
        }
      } else {
        console.warn('No session in response, sync-user will be called on next page load')
      }

      toast({
        title: 'התחברת בהצלחה! 🎉',
        description: 'מעביר אותך לדף הראשי...',
      })

      // Redirect to feed
      router.push('/feed')
    } catch (error: any) {
      console.error('Sign in error:', error)
      toast({
        title: 'שגיאת התחברות',
        description: error.message || 'אימייל או סיסמה שגויים',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password || !name) {
      toast({
        title: 'שגיאה',
        description: 'נא למלא את כל השדות',
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      // Check if email confirmation is required
      if (data?.user && !data.session) {
        // Email confirmation required - create user in database immediately
        try {
          await fetch('/api/auth/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: data.user.id,
              email: data.user.email,
              name: name,
              phone: data.user.phone || null,
            }),
          })
        } catch (syncError) {
          console.error('Failed to create user:', syncError)
        }

        toast({
          title: 'הרשמה הושלמה! 📧',
          description: 'אנא בדוק את האימייל שלך לאימות החשבון',
        })
      } else if (data?.user && data.session) {
        // User is signed in immediately (email confirmation disabled)
        // Sync user to database
        try {
          await fetch('/api/auth/sync-user', {
            method: 'POST',
          })
        } catch (syncError) {
          console.error('Failed to sync user:', syncError)
          // Don't block signup if sync fails
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

        toast({
          title: 'הרשמה הושלמה! 🎉',
          description: 'מעביר אותך לדף הראשי...',
        })
        router.push('/feed')
      }
    } catch (error: any) {
      console.error('Sign up error:', error)
      toast({
        title: 'שגיאת הרשמה',
        description: error.message || 'לא הצלחנו ליצור את החשבון',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl">ברוכים הבאים</CardTitle>
          <CardDescription>התחברו או הירשמו ל-FamilyNotify</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">התחברות</TabsTrigger>
              <TabsTrigger value="signup">הרשמה</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">אימייל</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">סיסמה</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
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

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">שם מלא</Label>
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
                  <Label htmlFor="signup-email">אימייל</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">סיסמה</Label>
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

          <p className="text-center text-sm text-muted-foreground">
            בהתחברות, אתם מסכימים ל
            <Link href="/legal/terms" className="underline hover:text-primary mx-1">
              תנאי השימוש
            </Link>
            ול
            <Link href="/legal/privacy" className="underline hover:text-primary mx-1">
              מדיניות הפרטיות
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
