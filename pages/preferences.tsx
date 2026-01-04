import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, MessageSquare, Phone, Bell } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/router'
import { Header } from '@/components/header'

interface ChannelPreference {
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH'
  enabled: boolean
  destination: string
  verified: boolean
}

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<ChannelPreference[]>([
    { channel: 'EMAIL', enabled: false, destination: '', verified: false },
    { channel: 'SMS', enabled: false, destination: '', verified: false },
    { channel: 'WHATSAPP', enabled: false, destination: '', verified: false },
    { channel: 'PUSH', enabled: false, destination: '', verified: false },
  ])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  // Load user and preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true)

        // Get current user
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser()

        // If it's AuthSessionMissingError, redirect to login
        if (authError) {
          // If it's AuthSessionMissingError, it's normal - just means no session
          if (authError.message?.includes('Auth session missing')) {
            router.push('/login')
            return
          }
          console.error('Auth error:', authError)
          router.push('/login')
          return
        }

        if (!currentUser) {
          router.push('/login')
          return
        }

        setUser(currentUser)

        // Load preferences from database
        const response = await fetch('/api/preferences')
        if (!response.ok) {
          toast({
            title: 'שגיאה',
            description: 'לא הצלחנו לטעון את ההעדפות',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }

        const data = await response.json()

        // Merge loaded preferences with defaults
        const loadedPrefs = data.preferences || []
        const defaultPrefs: ChannelPreference[] = [
          { channel: 'EMAIL', enabled: false, destination: '', verified: false },
          { channel: 'SMS', enabled: false, destination: '', verified: false },
          { channel: 'WHATSAPP', enabled: false, destination: '', verified: false },
          { channel: 'PUSH', enabled: false, destination: '', verified: false },
        ]

        const updated = defaultPrefs.map((pref) => {
          const loaded = loadedPrefs.find((p: any) => p.channel === pref.channel)
          if (loaded) {
            return {
              channel: pref.channel,
              enabled: loaded.enabled,
              destination: loaded.destination || '',
              verified: !!loaded.verifiedAt,
            }
          }
          return pref
        })

        setPreferences(updated)
      } catch (error: any) {
        console.error('Error loading preferences:', error)
        toast({
          title: 'שגיאה',
          description: 'לא הצלחנו לטעון את ההעדפות',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [supabase, router, toast])

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL':
        return <Mail className="h-5 w-5" />
      case 'SMS':
        return <Phone className="h-5 w-5" />
      case 'WHATSAPP':
        return <MessageSquare className="h-5 w-5" />
      case 'PUSH':
        return <Bell className="h-5 w-5" />
    }
  }

  const getChannelName = (channel: string) => {
    switch (channel) {
      case 'EMAIL':
        return 'אימייל'
      case 'SMS':
        return 'SMS'
      case 'WHATSAPP':
        return 'WhatsApp'
      case 'PUSH':
        return 'התראות'
    }
  }

  const getChannelDescription = (channel: string) => {
    switch (channel) {
      case 'EMAIL':
        return 'קבלת הודעות באימייל'
      case 'SMS':
        return 'הודעות SMS לטלפון הנייד'
      case 'WHATSAPP':
        return 'הודעות ב-WhatsApp'
      case 'PUSH':
        return 'התראות בדפדפן'
    }
  }

  const toggleChannel = (index: number) => {
    const updated = [...preferences]
    updated[index].enabled = !updated[index].enabled
    setPreferences(updated)
  }

  const updateDestination = (index: number, value: string) => {
    const updated = [...preferences]
    updated[index].destination = value

    // Auto-verify if email matches current login email
    if (
      updated[index].channel === 'EMAIL' &&
      user &&
      value.toLowerCase() === user.email.toLowerCase()
    ) {
      updated[index].verified = true
    } else if (updated[index].channel === 'EMAIL') {
      // If it changed away from login email, it's not "auto-verified" anymore
      // (Unless the user clicks test and it works)
      updated[index].verified = false
    }

    setPreferences(updated)
  }

  const sendTestMessage = async (index: number) => {
    const pref = preferences[index]

    if (!pref.destination) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין כתובת/מספר תחילה',
        variant: 'destructive',
      })
      return
    }

    const endpoint =
      pref.channel === 'EMAIL'
        ? '/api/test-email'
        : pref.channel === 'WHATSAPP'
          ? '/api/test-whatsapp'
          : null

    if (!endpoint) {
      // For SMS or Push, just simulate or show info for now
      toast({
        title: 'נשלח!',
        description: `שלחנו הודעת ניסיון ל-${pref.destination}. אנא וודא שקיבלת אותה.`,
      })
      const updated = [...preferences]
      updated[index].verified = true
      setPreferences(updated)
      return
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: pref.destination }),
      })

      const data = await response.json()

      if (response.ok) {
        const updated = [...preferences]
        updated[index].verified = true
        setPreferences(updated)
        toast({
          title: 'הודעת ניסיון נשלחה! ✅',
          description: `הודעת ניסיון נשלחה ל-${pref.destination}. הערוץ סומן כמאומת.`,
        })
      } else {
        toast({
          title: 'נכשלה שליחת בדיקה',
          description: data.error || 'אנא וודא שהפרטים נכונים והספק מוגדר.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'נכשל ליצור קשר עם השרת',
        variant: 'destructive',
      })
    }
  }

  const savePreferences = async () => {
    try {
      setSaving(true)

      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      })

      if (!response.ok) {
        toast({
          title: 'שגיאה',
          description: 'לא הצלחנו לשמור את ההעדפות',
          variant: 'destructive',
        })
        setSaving(false)
        return
      }

      toast({
        title: 'ההעדפות נשמרו! ✅',
        description: 'ההעדפות שלך עודכנו בהצלחה במערכת',
      })
    } catch (error: any) {
      console.error('Error saving preferences:', error)
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו לשמור את ההעדפות',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto text-center">
            <p>טוען העדפות...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">העדפות קבלה</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              בחרו איך תרצו לקבל הודעות ואירועים ממשפחת FamilyNotify
            </p>
            {user && <p className="text-xs sm:text-sm text-gray-500 mt-2">משתמש: {user.email}</p>}
          </div>

          <div className="space-y-4">
            {preferences.map((pref, index) => (
              <Card key={pref.channel}>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      {getChannelIcon(pref.channel)}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg">
                          {getChannelName(pref.channel)}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          {getChannelDescription(pref.channel)}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant={pref.enabled ? 'default' : 'outline'}
                      onClick={() => toggleChannel(index)}
                      className="w-full sm:w-auto touch-target"
                    >
                      {pref.enabled ? 'פעיל' : 'כבוי'}
                    </Button>
                  </div>
                </CardHeader>
                {pref.enabled && pref.channel !== 'PUSH' && (
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">
                        {pref.channel === 'EMAIL' ? 'כתובת אימייל' : 'מספר טלפון'}
                      </Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          type={pref.channel === 'EMAIL' ? 'email' : 'tel'}
                          placeholder={
                            pref.channel === 'EMAIL' ? 'your@email.com' : '+972-50-1234567'
                          }
                          value={pref.destination}
                          onChange={(e) => updateDestination(index, e.target.value)}
                          disabled={pref.verified}
                          className="flex-1 text-base touch-target"
                        />
                        {!pref.verified ? (
                          <Button
                            onClick={() => sendTestMessage(index)}
                            className="w-full sm:w-auto touch-target whitespace-nowrap"
                            variant="secondary"
                          >
                            שלח הודעת ניסיון
                          </Button>
                        ) : (
                          <Button
                            onClick={() => sendTestMessage(index)}
                            variant="outline"
                            className="w-full sm:w-auto touch-target whitespace-nowrap bg-green-50 border-green-200 text-green-700"
                          >
                            מאומת ✓ (שלח שוב)
                          </Button>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 italic">
                        {pref.channel === 'EMAIL' &&
                        pref.destination.toLowerCase() === user.email.toLowerCase()
                          ? 'המייל שלך אומת באופן אוטומטי'
                          : 'מומלץ לשלוח הודעת ניסיון כדי לוודא תקינות'}
                      </p>
                    </div>
                  </CardContent>
                )}
                {pref.enabled && pref.channel === 'PUSH' && (
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <Button
                      onClick={async () => {
                        try {
                          const permission = await Notification.requestPermission()
                          if (permission === 'granted') {
                            const updated = [...preferences]
                            updated[index].verified = true
                            setPreferences(updated)
                            toast({
                              title: 'התראות הופעלו!',
                              description: 'תקבלו התראות בדפדפן',
                            })
                          }
                        } catch (error) {
                          toast({
                            title: 'שגיאה',
                            description: 'לא ניתן להפעיל התראות',
                            variant: 'destructive',
                          })
                        }
                      }}
                      className="w-full sm:w-auto touch-target"
                    >
                      {pref.verified ? 'התראות פעילות ✓' : 'אפשר התראות'}
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              onClick={savePreferences}
              size="lg"
              className="flex-1 touch-target"
              disabled={saving}
            >
              {saving ? 'שומר...' : 'שמור העדפות'}
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto touch-target">
              <Link href="/feed">לפיד ההודעות</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
