import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { useFamilyContext } from '@/lib/context/family-context'
import { Header } from '@/components/header'
import { GroupSelector } from '@/components/group-selector'
import { useToast } from '@/hooks/use-toast'

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
  const [error, setError] = useState<string | null>(null)
  const [showPastEvents, setShowPastEvents] = useState(false)
  const { familyGroupId, groups, loadingGroups, selectedGroup } = useFamilyContext()
  const { toast } = useToast()

  const loadEvents = async () => {
    if (!familyGroupId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await apiClient.getEvents(familyGroupId, showPastEvents)
      setEvents(
        data.events.map((e) => ({
          ...e,
          startsAt: new Date(e.startsAt),
          endsAt: e.endsAt ? new Date(e.endsAt) : null,
        }))
      )
    } catch (err: any) {
      console.error('Failed to load events:', err)
      setError(err.message || 'שגיאה בטעינת האירועים')
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו לטעון את האירועים',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [familyGroupId, showPastEvents])

  // Show loading while fetching groups
  if (loadingGroups) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">טוען...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">לוח אירועים משפחתי</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {showPastEvents ? 'כל האירועים (כולל עבר)' : 'אירועים קרובים ושמחות'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {familyGroupId && (
                <>
                  <Button
                    variant={showPastEvents ? 'default' : 'outline'}
                    onClick={() => setShowPastEvents(!showPastEvents)}
                    size="sm"
                    className="w-full sm:w-auto touch-target"
                  >
                    {showPastEvents ? 'הצג עתידיים' : 'הצג הכל'}
                  </Button>
                  <Button asChild className="w-full sm:w-auto touch-target">
                    <Link href="/admin">
                      <Calendar className="h-4 w-4 ml-2" />
                      הוסף אירוע
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Show group selector if no groups or multiple groups (always show for multiple groups) */}
          {(groups.length === 0 || groups.length > 1) && (
            <GroupSelector
              title={familyGroupId ? 'החלף קבוצה' : 'בחר קבוצה לצפייה באירועים'}
              description="בחר את הקבוצה שתרצה לראות את האירועים שלה"
            />
          )}

          {loading && familyGroupId && (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 mx-auto text-gray-400 mb-4 animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">טוען אירועים...</p>
            </div>
          )}

          {error && familyGroupId && !loading && (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-red-400 mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={loadEvents} variant="outline">
                  <RefreshCw className="h-4 w-4 ml-2" />
                  נסה שוב
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && !error && familyGroupId && events.length > 0 && (
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
                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                            <CardTitle className="text-lg sm:text-xl">{event.title}</CardTitle>
                            {isToday && (
                              <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                                היום!
                              </span>
                            )}
                          </div>
                          {event.description && (
                            <CardDescription className="text-sm sm:text-base mb-3">
                              {event.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400 flex-wrap">
                          <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span className="text-xs sm:text-sm">
                            {formatDateTime(event.startsAt)}
                          </span>
                        </div>
                        {event.endsAt && (
                          <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400 flex-wrap">
                            <Clock className="h-4 w-4 opacity-0 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">
                              משך: {formatTimeRange(event.startsAt, event.endsAt)}
                            </span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm break-words">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto touch-target"
                        >
                          הוסף ליומן
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto touch-target"
                        >
                          שתף
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {!loading && !error && familyGroupId && events.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
                  אין אירועים מתוזמנים
                </p>
                <Button asChild className="touch-target">
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
