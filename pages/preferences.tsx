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

        if (authError || !currentUser) {
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
    setPreferences(updated)
  }

  const verifyChannel = async (index: number) => {
    const pref = preferences[index]

    if (!pref.destination) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין כתובת/מספר תחילה',
        variant: 'destructive',
      })
      return
    }

    // Simulate verification
    toast({
      title: 'נשלח קוד אימות',
      description: `קוד אימות נשלח ל-${pref.destination}`,
    })

    // In real app, would send verification code and show input
    setTimeout(() => {
      const updated = [...preferences]
      updated[index].verified = true
      setPreferences(updated)
      toast({
        title: 'אומת בהצלחה!',
        description: `הערוץ ${getChannelName(pref.channel)} אומת`,
      })
    }, 2000)
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">העדפות קבלה</h1>
            <p className="text-gray-600 dark:text-gray-400">
              בחרו איך תרצו לקבל הודעות ואירועים ממשפחת FamilyNotify
            </p>
            {user && <p className="text-sm text-gray-500 mt-2">משתמש: {user.email}</p>}
          </div>

          <div className="space-y-4">
            {preferences.map((pref, index) => (
              <Card key={pref.channel}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getChannelIcon(pref.channel)}
                      <div>
                        <CardTitle className="text-lg">{getChannelName(pref.channel)}</CardTitle>
                        <CardDescription>{getChannelDescription(pref.channel)}</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant={pref.enabled ? 'default' : 'outline'}
                      onClick={() => toggleChannel(index)}
                    >
                      {pref.enabled ? 'פעיל' : 'כבוי'}
                    </Button>
                  </div>
                </CardHeader>
                {pref.enabled && pref.channel !== 'PUSH' && (
                  <CardContent>
                    <div className="space-y-2">
                      <Label>{pref.channel === 'EMAIL' ? 'כתובת אימייל' : 'מספר טלפון'}</Label>
                      <div className="flex gap-2">
                        <Input
                          type={pref.channel === 'EMAIL' ? 'email' : 'tel'}
                          placeholder={
                            pref.channel === 'EMAIL' ? 'your@email.com' : '+972-50-1234567'
                          }
                          value={pref.destination}
                          onChange={(e) => updateDestination(index, e.target.value)}
                          disabled={pref.verified}
                        />
                        {!pref.verified ? (
                          <Button onClick={() => verifyChannel(index)}>אמת</Button>
                        ) : (
                          <Button variant="outline" disabled>
                            מאומת ✓
                          </Button>
                        )}
                      </div>
                      {pref.verified && <p className="text-sm text-green-600">הערוץ אומת ופעיל</p>}
                    </div>
                  </CardContent>
                )}
                {pref.enabled && pref.channel === 'PUSH' && (
                  <CardContent>
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
                    >
                      {pref.verified ? 'התראות פעילות ✓' : 'אפשר התראות'}
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <div className="mt-8 flex gap-4">
            <Button onClick={savePreferences} size="lg" className="flex-1" disabled={saving}>
              {saving ? 'שומר...' : 'שמור העדפות'}
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/feed">לפיד ההודעות</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
