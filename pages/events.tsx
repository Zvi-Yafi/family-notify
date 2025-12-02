import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { useFamilyContext } from '@/lib/context/family-context'
import { Header } from '@/components/header'

interface Event {
  id: string
  title: string
  description: string | null
  startsAt: Date
  endsAt: Date | null
  location: string | null
  creator: { email: string }
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatTimeRange(start: Date, end: Date): string {
  const startTime = new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(start)
  const endTime = new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(end)
  return `${startTime} - ${endTime}`
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const { familyGroupId } = useFamilyContext()

  useEffect(() => {
    async function loadEvents() {
      if (!familyGroupId) {
        setLoading(false)
        return
      }

      try {
        const data = await apiClient.getEvents(familyGroupId)
        setEvents(
          data.events.map((e) => ({
            ...e,
            startsAt: new Date(e.startsAt),
            endsAt: e.endsAt ? new Date(e.endsAt) : null,
          }))
        )
      } catch (error) {
        console.error('Failed to load events:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [familyGroupId])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">לוח אירועים משפחתי</h2>
              <p className="text-gray-600 dark:text-gray-400">כל האירועים והשמחות הקרובים</p>
            </div>
            <Button asChild>
              <Link href="/admin">
                <Calendar className="h-4 w-4 ml-2" />
                הוסף אירוע
              </Link>
            </Button>
          </div>

          {loading && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">טוען אירועים...</p>
            </div>
          )}

          {!loading && !familyGroupId && (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  עדיין לא הצטרפת לקבוצה משפחתית
                </p>
                <Button asChild>
                  <Link href="/onboarding">הרשם עכשיו</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && familyGroupId && events.length > 0 && (
            <div className="space-y-4">
              {events.map((event) => {
                const isPast = event.startsAt < new Date()
                const isToday = event.startsAt.toDateString() === new Date().toDateString()

                return (
                  <Card
                    key={event.id}
                    className={`hover:shadow-lg transition-shadow ${
                      isPast ? 'opacity-60' : ''
                    } ${isToday ? 'border-blue-500 border-2' : ''}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-xl">{event.title}</CardTitle>
                            {isToday && (
                              <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                                היום!
                              </span>
                            )}
                          </div>
                          {event.description && (
                            <CardDescription className="text-base mb-3">
                              {event.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">{formatDateTime(event.startsAt)}</span>
                        </div>
                        {event.endsAt && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Clock className="h-4 w-4 opacity-0" />
                            <span className="text-sm">
                              משך: {formatTimeRange(event.startsAt, event.endsAt)}
                            </span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          הוסף ליומן
                        </Button>
                        <Button variant="outline" size="sm">
                          שתף
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {!loading && familyGroupId && events.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">אין אירועים מתוזמנים</p>
                <Button asChild>
                  <Link href="/admin">צור אירוע ראשון</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
