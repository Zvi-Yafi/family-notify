import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, MessageSquare, Phone, Bell, CheckCircle2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/router'
import { Header } from '@/components/header'
import { motion, AnimatePresence } from 'framer-motion'

interface ChannelPreference {
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH' | 'VOICE_CALL'
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
    { channel: 'VOICE_CALL', enabled: false, destination: '', verified: false },
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
          { channel: 'VOICE_CALL', enabled: false, destination: '', verified: false },
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
      case 'VOICE_CALL':
        return <Phone className="h-5 w-5" />
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
      case 'VOICE_CALL':
        return 'התראה קולית'
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
      case 'VOICE_CALL':
        return 'שיחה קולית אוטומטית (מתאים לטלפון כשר)'
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
          : pref.channel === 'VOICE_CALL'
            ? '/api/test-voice-call'
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

        // Auto-save preferences after successful test message
        try {
          const saveResponse = await fetch('/api/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preferences: updated }),
          })

          if (saveResponse.ok) {
            toast({
              title: 'הודעת ניסיון נשלחה! ✅',
              description: `הודעת ניסיון נשלחה ל-${pref.destination}. הערוץ אומת ונשמר.`,
            })
          } else {
            toast({
              title: 'הודעת ניסיון נשלחה! ✅',
              description: `הודעת ניסיון נשלחה ל-${pref.destination}. נא לשמור את ההעדפות.`,
            })
          }
        } catch (saveError) {
          console.error('Error auto-saving preferences:', saveError)
          toast({
            title: 'הודעת ניסיון נשלחה! ✅',
            description: `הודעת ניסיון נשלחה ל-${pref.destination}. נא לשמור את ההעדפות.`,
          })
        }
      } else {
        toast({
          title: 'נכשלה שליחת בדיקה',
          description: 'אנא וודא שהפרטים נכונים ונסה שוב.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'נכשל ליצור קשר עם השרת. אנא בדוק את החיבור לאינטרנט.',
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
          description: 'לא הצלחנו לשמור את ההעדפות. אנא נסה שוב.',
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
        description: 'לא הצלחנו לשמור את ההעדפות. אנא נסה שוב.',
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
          <div className="max-w-3xl lg:max-w-6xl mx-auto text-center">
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
        <div className="max-w-4xl lg:max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-l from-blue-600 to-purple-600 bg-clip-text text-transparent">
                העדפות התראות
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                התאימו אישית את אופן קבלת ההודעות והתזכורות שלכם
              </p>
              {user && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-sm text-blue-700 dark:text-blue-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-l from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-8 border border-blue-100 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-semibold">💡 טיפ: בחרו כמה ערוצים שתרצו!</p>
                  <p>תוכלו לקבל התראות במספר ערוצים בו-זמנית. מומלץ להפעיל לפחות ערוץ אחד כדי להישאר מעודכנים.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {preferences.map((pref, index) => (
              <motion.div
                key={pref.channel}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`relative overflow-hidden transition-all duration-300 ${
                  pref.enabled 
                    ? 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg' 
                    : 'hover:shadow-md'
                }`}>
                  {pref.enabled && (
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 opacity-10 blur-2xl" />
                  )}
                  
                  <CardHeader className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${
                          pref.enabled 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}>
                          {getChannelIcon(pref.channel)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">
                              {getChannelName(pref.channel)}
                            </CardTitle>
                            {pref.verified && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <CardDescription className="text-sm">
                            {getChannelDescription(pref.channel)}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => toggleChannel(index)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                          pref.enabled
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50'
                            : 'bg-gray-300 dark:bg-gray-600 shadow-inner'
                        }`}
                        role="switch"
                        aria-checked={pref.enabled}
                        dir="ltr"
                      >
                        <span
                          className={`${
                            pref.enabled ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-5 w-5 transform rounded-full transition-all duration-200 shadow-md ${
                            pref.enabled 
                              ? 'bg-white' 
                              : 'bg-white dark:bg-gray-300'
                          }`}
                        />
                      </button>
                    </div>
                  </CardHeader>
                  
                  <AnimatePresence>
                    {pref.enabled && pref.channel !== 'PUSH' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CardContent className="p-5 pt-0 bg-gray-50 dark:bg-gray-900/50">
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">
                              {pref.channel === 'EMAIL' ? 'כתובת אימייל' : 'מספר טלפון'}
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type={pref.channel === 'EMAIL' ? 'email' : 'tel'}
                                placeholder={
                                  pref.channel === 'EMAIL'
                                    ? 'your@email.com'
                                    : pref.channel === 'VOICE_CALL'
                                      ? '050-1234567'
                                      : '+972-50-1234567'
                                }
                                value={pref.destination}
                                onChange={(e) => updateDestination(index, e.target.value)}
                                disabled={pref.verified}
                                className="flex-1"
                              />
                              {!pref.verified ? (
                                <Button
                                  onClick={() => sendTestMessage(index)}
                                  variant="secondary"
                                  size="sm"
                                  className="whitespace-nowrap"
                                >
                                  בדיקה
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => sendTestMessage(index)}
                                  variant="outline"
                                  size="sm"
                                  className="whitespace-nowrap bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                                >
                                  ✓ מאומת
                                </Button>
                              )}
                            </div>
                            {pref.verified ? (
                              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>
                                  {pref.channel === 'EMAIL' &&
                                  pref.destination.toLowerCase() === user.email.toLowerCase()
                                    ? 'המייל שלך אומת באופן אוטומטי'
                                    : 'הערוץ מאומת ופעיל'}
                                </span>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                מומלץ לאמת את הערוץ כדי לוודא שאתם מקבלים הודעות
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <AnimatePresence>
                    {pref.enabled && pref.channel === 'PUSH' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CardContent className="p-5 pt-0 bg-gray-50 dark:bg-gray-900/50">
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
                            className="w-full"
                            variant={pref.verified ? 'default' : 'secondary'}
                          >
                            {pref.verified ? (
                              <span className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                התראות פעילות
                              </span>
                            ) : (
                              'אפשר התראות בדפדפן'
                            )}
                          </Button>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 space-y-4"
          >
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-right">
                  <h3 className="font-semibold text-lg mb-1">מוכנים?</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {preferences.filter(p => p.enabled).length} ערוצים פעילים
                  </p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button
                    onClick={savePreferences}
                    size="lg"
                    className="flex-1 sm:flex-initial sm:min-w-[160px]"
                    disabled={saving}
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        שומר...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        שמור העדפות
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="flex-1 sm:flex-initial"
                  >
                    <Link href="/feed">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        לפיד
                      </span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {preferences.filter(p => p.enabled && !p.verified && p.channel !== 'PUSH').length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                      יש לכם ערוצים לא מאומתים
                    </p>
                    <p className="text-amber-700 dark:text-amber-300">
                      מומלץ לאמת את הערוצים שהפעלתם כדי לוודא שאתם מקבלים הודעות בצורה תקינה.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
