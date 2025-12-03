import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useFamilyContext } from '@/lib/context/family-context'
import { createClient } from '@/lib/supabase/client'

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
  const { setFamilyGroup, setUser } = useFamilyContext()
  const supabase = createClient()

  // Check if user is already authenticated
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setIsAuthenticated(true)
        setFormData((prev) => ({ ...prev, email: user.email || '' }))
      }
    }
    checkAuth()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user && !isAuthenticated) {
        // If not authenticated, redirect to login
        toast({
          title: 'נדרשת התחברות',
          description: 'אנא התחבר או הירשם כדי להמשיך',
          variant: 'destructive',
        })
        router.push('/login')
        return
      }

      // Update user phone if provided
      if (formData.phone && user) {
        await supabase.auth.updateUser({
          phone: formData.phone,
        })
      }

      // Sync user to Prisma
      try {
        await fetch('/api/auth/sync-user', {
          method: 'POST',
        })
      } catch (syncError) {
        console.error('Failed to sync user:', syncError)
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
        description: error.message || 'אירעה שגיאה בהרשמה. נסה שוב.',
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
                setStep(2)
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="email">כתובת אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">מספר טלפון (אופציונלי)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+972-50-1234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <p className="text-sm text-gray-500 mt-1">נדרש לקבלת SMS ו-WhatsApp</p>
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
                  <div>
                    <Label htmlFor="groupName">שם הקבוצה</Label>
                    <Input
                      id="groupName"
                      placeholder="משפחת כהן"
                      value={formData.groupName}
                      onChange={(e) => {
                        const name = e.target.value
                        const slug = name
                          .toLowerCase()
                          .replace(/\s+/g, '-')
                          .replace(/[^\w\-]+/g, '')
                        setFormData({ ...formData, groupName: name, groupSlug: slug })
                      }}
                      required
                    />
                    {formData.groupSlug && (
                      <p className="text-sm text-gray-500 mt-1">
                        קוד הקבוצה:{' '}
                        <span className="font-mono font-bold">{formData.groupSlug}</span>
                      </p>
                    )}
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
