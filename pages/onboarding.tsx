import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useFamilyContext } from '@/lib/context/family-context'
import { createClient } from '@/lib/supabase/client'
import { Info, AlertCircle } from 'lucide-react'

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const isValidPhone = (value: string) => {
  const cleaned = value.replace(/[\s\-()]/g, '')
  return /^(\+?\d{9,15})$/.test(cleaned)
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    groupSlug: '',
    groupName: '',
    createNew: false,
  })
  const router = useRouter()
  const { toast } = useToast()
  const { setFamilyGroup, setUser, refreshGroups } = useFamilyContext()
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  const emailError = touched.email && formData.email && !isValidEmail(formData.email) ? 'כתובת מייל לא תקינה' : ''
  const phoneError = touched.phone && formData.phone && !isValidPhone(formData.phone) ? 'מספר טלפון לא תקין (9-15 ספרות)' : ''

  // Check if user is already authenticated and handle query params
  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { user: supabaseUser },
          error,
        } = await supabase.auth.getUser()

        if (error && !error.message?.includes('Auth session missing')) {
          console.error('Auth error:', error)
        }

        if (supabaseUser) {
          setIsAuthenticated(true)

          // Fetch user details from our API
          try {
            const response = await fetch('/api/user/me')
            if (response.ok) {
              const data = await response.json()
              if (data.user) {
                setFormData((prev) => ({
                  ...prev,
                  email: data.user.email || supabaseUser.email || prev.email,
                  phone: data.user.phone || prev.phone,
                }))

                // If we have a user and they are joining via a link, move to step 2
                if (router.query.slug) {
                  setStep(2)
                }
              }
            }
          } catch (err) {
            console.error('Failed to fetch user data:', err)
          }
        }
      } catch (error: any) {
        if (!error?.message?.includes('Auth session missing')) {
          console.error('Auth check error:', error)
        }
      }
    }

    // Handle slug from query parameter
    if (router.isReady && router.query.slug) {
      const slug = router.query.slug as string
      setFormData((prev) => ({
        ...prev,
        groupSlug: slug,
        createNew: false,
      }))
      console.log('🔗 Pre-filling group slug from URL:', slug)
    }

    checkAuth()
  }, [supabase, router.isReady, router.query.slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get current user
      const {
        data: { user },
        error: getUserError,
      } = await supabase.auth.getUser()

      // If it's AuthSessionMissingError, it's normal - just means no session
      if (getUserError && !getUserError.message?.includes('Auth session missing')) {
        console.error('Get user error:', getUserError)
      }

      if (!user && !isAuthenticated) {
        // If not authenticated, redirect to login and preserve this path for return
        toast({
          title: 'נדרשת התחברות',
          description: 'אנא התחבר או הירשם כדי להמשיך',
          variant: 'destructive',
        })
        router.push(`/login?redirectTo=${encodeURIComponent(router.asPath)}`)
        return
      }

      // Update user phone if provided
      if (formData.phone && user) {
        await supabase.auth.updateUser({
          phone: formData.phone,
        })
      }

      // Create new group or join existing one
      let groupResult
      if (formData.createNew) {
        // Create new group
        const createResponse = await fetch('/api/groups/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.groupName,
            slug: formData.groupSlug,
          }),
        })

        if (!createResponse.ok) {
          const errorData = await createResponse.json()
          toast({
            title: 'שגיאה',
            description: errorData.error || 'שגיאה ביצירת הקבוצה',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }

        groupResult = await createResponse.json()
      } else {
        // Join existing group
        const joinResponse = await fetch('/api/groups/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: formData.groupSlug,
          }),
        })

        if (!joinResponse.ok) {
          const errorData = await joinResponse.json()
          toast({
            title: 'שגיאה',
            description: errorData.error || 'שגיאה בהצטרפות לקבוצה',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }

        groupResult = await joinResponse.json()
      }

      const userId = user?.id || `guest-${Date.now()}`

      // Save to context
      setFamilyGroup(groupResult.group.id)
      setUser(userId)

      // Refresh groups to update the list
      await refreshGroups()

      toast({
        title: formData.createNew ? 'הקבוצה נוצרה בהצלחה! 🎉' : 'הצטרפת לקבוצה בהצלחה! 🎉',
        description: `ברוך הבא לקבוצה "${groupResult.group.name}"`,
      })

      // Redirect to feed or admin
      setTimeout(() => {
        router.push('/feed')
      }, 1000)
    } catch (error: any) {
      console.error('Onboarding error:', error)
      toast({
        title: 'שגיאה',
        description: 'חלה שגיאה בתהליך ההצטרפות. אנא נסה שוב.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>ברוכים הבאים ל-FamilyNotify</CardTitle>
          <CardDescription>שלב {step} מתוך 2 - בואו נתחיל</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (formData.email && !isValidEmail(formData.email)) {
                  toast({
                    title: 'מייל לא תקין',
                    description: 'נא להזין כתובת מייל תקינה, לדוגמה: name@example.com',
                    variant: 'destructive',
                  })
                  return
                }
                if (formData.phone && !isValidPhone(formData.phone)) {
                  toast({
                    title: 'טלפון לא תקין',
                    description: 'נא להזין מספר טלפון תקין (9-15 ספרות). לדוגמה: 050-1234567',
                    variant: 'destructive',
                  })
                  return
                }
                setStep(2)
              }}
              className="space-y-4"
            >
              {formData.groupSlug && !formData.createNew && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg mb-4 flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <Info className="h-5 w-5 text-blue-600" />
                  <p className="text-sm font-medium">
                    אתה מצטרף לקבוצה: <strong>{formData.groupSlug}</strong>
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="email">כתובת אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                  required
                  className={emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {emailError && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {emailError}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">מספר טלפון (אופציונלי)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+972-50-1234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                  className={phoneError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {phoneError ? (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {phoneError}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">נדרש לקבלת SMS ו-WhatsApp</p>
                )}
              </div>

              <Button type="submit" className="w-full">
                המשך
              </Button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Button
                  variant={formData.createNew ? 'outline' : 'default'}
                  className="w-full"
                  onClick={() => setFormData({ ...formData, createNew: false })}
                >
                  הצטרף לקבוצה קיימת
                </Button>
                <Button
                  variant={formData.createNew ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setFormData({ ...formData, createNew: true })}
                >
                  צור קבוצה חדשה
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!formData.createNew ? (
                  <div>
                    <Label htmlFor="groupSlug">קוד קבוצה</Label>
                    <Input
                      id="groupSlug"
                      placeholder="family-cohen"
                      value={formData.groupSlug}
                      onChange={(e) => setFormData({ ...formData, groupSlug: e.target.value })}
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">בקשו את קוד הקבוצה ממנהל המשפחה</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="groupName">שם הקבוצה</Label>
                      <Input
                        id="groupName"
                        placeholder="משפחת כהן"
                        value={formData.groupName}
                        onChange={(e) => {
                          const name = e.target.value
                          // Auto-generate slug only if user hasn't manually edited it
                          if (
                            !formData.groupSlug ||
                            formData.groupSlug ===
                              formData.groupName
                                .toLowerCase()
                                .replace(/\s+/g, '-')
                                .replace(/[^\w\-]+/g, '')
                          ) {
                            const slug = name
                              .toLowerCase()
                              .replace(/\s+/g, '-')
                              .replace(/[^\w\-]+/g, '')
                            setFormData({ ...formData, groupName: name, groupSlug: slug })
                          } else {
                            setFormData({ ...formData, groupName: name })
                          }
                        }}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="groupSlugEdit">קוד הקבוצה (באנגלית)</Label>
                      <Input
                        id="groupSlugEdit"
                        placeholder="family-cohen"
                        value={formData.groupSlug}
                        onChange={(e) => {
                          const slug = e.target.value
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^\w\-]+/g, '')
                          setFormData({ ...formData, groupSlug: slug })
                        }}
                        required
                        dir="ltr"
                        className="text-left font-mono"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        קוד ייחודי להצטרפות לקבוצה (רק אותיות באנגלית, מספרים ומקפים)
                      </p>
                    </div>
                  </div>
                )}

                {/* Explanation Box */}
                {formData.createNew && (
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2 text-blue-800 dark:text-blue-300">
                      <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-bold mb-1">מה ההבדל בין שם לקוד?</p>
                        <div className="space-y-2">
                          <p>
                            <strong>שם הקבוצה:</strong> השם היפה שכולם יראו (למשל: &quot;משפחת כהן
                            המורחבת&quot;). אפשר להשתמש בעברית, רווחים ואימוג&apos;י.
                          </p>
                          <p>
                            <strong>קוד הקבוצה (Slug):</strong> ה&quot;כתובת&quot; של הקבוצה. משמש
                            להצטרפות (למשל: <code>cohen-family</code>). רק אותיות באנגלית, מספרים
                            ומקפים.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    חזור
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'מתחבר...' : 'סיים הרשמה'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
