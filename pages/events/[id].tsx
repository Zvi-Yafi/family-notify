import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Calendar, Clock, MapPin, ArrowRight, Bell, Send, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useFamilyContext } from '@/lib/context/family-context'

interface Event {
  id: string
  title: string
  description: string | null
  startsAt: string
  endsAt: string | null
  location: string | null
  creator: {
    email: string
  }
}

interface EventReminder {
  id: string
  message: string
  scheduledAt: string | null
  sentAt: string | null
  createdAt: string
  creator: {
    email: string
  }
}

export default function EventDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const { toast } = useToast()
  const { familyGroupId } = useFamilyContext()

  const [event, setEvent] = useState<Event | null>(null)
  const [reminders, setReminders] = useState<EventReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [reminderForm, setReminderForm] = useState({
    message: '',
    scheduledAt: '',
  })

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadEventDetails()
    }
  }, [id])

  const loadEventDetails = async () => {
    if (!id || typeof id !== 'string') return

    try {
      setLoading(true)

      // Load event
      const eventResponse = await fetch(`/api/admin/events/${id}`)
      if (!eventResponse.ok) throw new Error('Failed to load event')
      const eventData = await eventResponse.json()
      setEvent(eventData.event)

      // Load reminders
      const remindersResponse = await fetch(`/api/admin/event-reminders?eventId=${id}`)
      if (!remindersResponse.ok) throw new Error('Failed to load reminders')
      const remindersData = await remindersResponse.json()
      setReminders(remindersData.reminders)
    } catch (error: any) {
      console.error('Error loading event:', error)
      toast({
        title: 'שגיאה',
        description: 'נכשל לטעון את פרטי האירוע',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!id || typeof id !== 'string') return

    try {
      setSubmitting(true)

      const response = await fetch('/api/admin/event-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: id,
          message: reminderForm.message,
          scheduledAt: reminderForm.scheduledAt || null,
        }),
      })

      if (!response.ok) throw new Error('Failed to create reminder')

      toast({
        title: reminderForm.scheduledAt ? 'תזכורת נוצרה!' : 'תזכורת נשלחה!',
        description: reminderForm.scheduledAt
          ? 'התזכורת תישלח בזמן המתוזמן'
          : 'התזכורת נשלחה לכל חברי הקבוצה',
      })

      // Reset form
      setReminderForm({
        message: '',
        scheduledAt: '',
      })

      // Reload reminders
      await loadEventDetails()
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'נכשל ליצור תזכורת',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400 mt-4">טוען...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">אירוע לא נמצא</p>
            <Button onClick={() => router.push('/events')} className="mt-4">
              חזרה לאירועים
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const eventDate = new Date(event.startsAt)
  const formattedDate = eventDate.toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = eventDate.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => router.push('/events')} className="mb-6">
            <ArrowRight className="h-4 w-4 ml-2" />
            חזרה לאירועים
          </Button>

          {/* Event Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">{event.title}</CardTitle>
              <CardDescription>נוצר על ידי {event.creator.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">{formattedDate}</p>
                  <p className="text-sm text-gray-600">{formattedTime}</p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-red-600 mt-0.5" />
                  <p>{event.location}</p>
                </div>
              )}

              {event.description && (
                <div className="pt-4 border-t">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Existing Reminders */}
          {reminders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>תזכורות קיימות</CardTitle>
                <CardDescription>{reminders.length} תזכורות עבור אירוע זה</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <p className="font-medium mb-2">{reminder.message}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {reminder.sentAt ? (
                          <span className="flex items-center gap-1 text-green-600">
                            ✓ נשלח ב-
                            {new Date(reminder.sentAt).toLocaleString('he-IL')}
                          </span>
                        ) : reminder.scheduledAt ? (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Clock className="h-4 w-4" />
                            מתוזמן ל-
                            {new Date(reminder.scheduledAt).toLocaleString('he-IL')}
                          </span>
                        ) : (
                          <span className="text-gray-500">ממתין לשליחה...</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {/* Create Reminder */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                צור תזכורת חדשה
              </CardTitle>
              <CardDescription>שלח תזכורת מיידית או תזמן אותה לזמן מסוים</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReminderSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="message">הודעת התזכורת</Label>
                  <textarea
                    id="message"
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="למשל: תזכורת! יום הולדת לסבתא מתקרב..."
                    value={reminderForm.message}
                    onChange={(e) => setReminderForm({ ...reminderForm, message: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="scheduledAt">תזמון (אופציונלי)</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={reminderForm.scheduledAt}
                    onChange={(e) =>
                      setReminderForm({ ...reminderForm, scheduledAt: e.target.value })
                    }
                  />
                  <p className="text-sm text-gray-500 mt-1">השאר ריק כדי לשלוח מיד</p>
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      שולח...
                    </>
                  ) : reminderForm.scheduledAt ? (
                    <>
                      <Clock className="h-4 w-4 ml-2" />
                      תזמן תזכורת
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 ml-2" />
                      שלח עכשיו
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
