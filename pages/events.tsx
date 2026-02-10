import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, RefreshCw, Bell, Paperclip, Loader2 } from 'lucide-react'
import Link from 'next/link'
import NextImage from 'next/image'
import { useRouter } from 'next/router'
import { apiClient } from '@/lib/api-client'
import { useFamilyContext } from '@/lib/context/family-context'
import { Header } from '@/components/header'
import { GroupSelector } from '@/components/group-selector'
import { useToast } from '@/hooks/use-toast'
import { getHebrewDateString } from '@/lib/utils/hebrew-date-utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { generateGoogleCalendarUrl, downloadIcsFile } from '@/lib/utils/calendar-utils'

interface Event {
  id: string
  title: string
  description: string | null
  startsAt: Date
  endsAt: Date | null
  location: string | null
  creator: { email: string }
  imageUrl?: string | null
  fileUrl?: string | null
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
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPastEvents, setShowPastEvents] = useState(false)
  const { familyGroupId, groups, loadingGroups, selectedGroup } = useFamilyContext()
  const { toast } = useToast()

  const loadEvents = useCallback(async () => {
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
        description: 'לא הצלחנו לטעון את האירועים. אנא נסה שוב.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [familyGroupId, showPastEvents, toast])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Refresh events when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && familyGroupId) {
        loadEvents()
      }
    }

    const handleFocus = () => {
      if (familyGroupId) {
        loadEvents()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [familyGroupId, loadEvents])

  if (loadingGroups) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <Loader2 className="h-8 w-8 mx-auto text-blue-600 mb-4 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">טוען קבוצות...</p>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadEvents}
                    disabled={loading}
                    className="w-full sm:w-auto touch-target"
                  >
                    <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                    רענן
                  </Button>
                  <Button asChild className="w-full sm:w-auto touch-target">
                    <Link href="/admin?tab=events">
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

                      {event.imageUrl && (
                        <div className="mt-3 mb-4 rounded-lg overflow-hidden border relative h-60">
                          <NextImage
                            src={event.imageUrl}
                            alt={event.title}
                            fill
                            className="object-contain bg-gray-50"
                            unoptimized
                          />
                        </div>
                      )}

                      {event.fileUrl && (
                        <div className="mt-3 mb-4">
                          <a
                            href={event.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 border rounded-lg bg-red-50 hover:bg-red-100 transition-colors text-red-700 font-semibold"
                          >
                            <Paperclip className="h-5 w-5" />
                            <span className="text-sm">צפה בהזמנה (PDF)</span>
                          </a>
                        </div>
                      )}

                      <div className="space-y-2 mt-4">
                        <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400 flex-wrap">
                          <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span className="text-xs sm:text-sm">
                            {formatDateTime(event.startsAt)}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-blue-600 font-semibold flex-wrap">
                          <Clock className="h-4 w-4 opacity-0 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">
                            תאריך עברי: {getHebrewDateString(event.startsAt)}
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
                          variant="default"
                          size="sm"
                          className="w-full sm:w-auto touch-target"
                          onClick={() => router.push(`/events/${event.id}`)}
                        >
                          <Bell className="h-4 w-4 ml-2" />
                          נהל תזכורות
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto touch-target"
                            >
                              <Calendar className="h-4 w-4 ml-2" />
                              הוסף ליומן
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(generateGoogleCalendarUrl(event), '_blank')
                              }
                              className="cursor-pointer"
                            >
                              Google Calendar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => downloadIcsFile(event)}
                              className="cursor-pointer"
                            >
                              אחר (.ics)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                  <Link href="/admin?tab=events">צור אירוע ראשון</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
