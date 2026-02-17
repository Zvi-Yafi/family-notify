import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  MapPin,
  Clock,
  RefreshCw,
  Bell,
  Paperclip,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import NextImage from 'next/image'
import { useRouter } from 'next/router'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
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
import { EventsCalendar } from '@/components/events-calendar'
import { Pagination } from '@/components/ui/pagination'

interface Event {
  id: string
  title: string
  description: string | null
  startsAt: Date
  endsAt: Date | null
  location: string | null
  creator: { email: string; name?: string | null }
  imageUrl?: string | null
  fileUrl?: string | null
}

const ITEMS_PER_PAGE = 10

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

function formatSelectedDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return format(date, 'd בMMMM yyyy', { locale: he })
}

function CardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-muted" />
          <div className="h-6 w-48 rounded bg-muted" />
        </div>
        <div className="h-4 w-full rounded bg-muted mb-2" />
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="space-y-2 mt-4">
          <div className="h-4 w-56 rounded bg-muted" />
          <div className="h-4 w-40 rounded bg-muted" />
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="flex gap-2">
          <div className="h-9 w-28 rounded bg-muted" />
          <div className="h-9 w-28 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function EventsPage() {
  const router = useRouter()
  const { familyGroupId, groups, loadingGroups } = useFamilyContext()
  const { toast } = useToast()
  const listRef = useRef<HTMLDivElement>(null)

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const [eventDates, setEventDates] = useState<string[]>([])
  const [loadingDates, setLoadingDates] = useState(false)

  const [events, setEvents] = useState<Event[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEventDates = useCallback(
    async (month: Date) => {
      if (!familyGroupId) return

      setLoadingDates(true)
      try {
        const monthStr = format(month, 'yyyy-MM')
        const data = await apiClient.getEventDatesForMonth(familyGroupId, monthStr)
        setEventDates(data.eventDates)
      } catch (err: any) {
        console.error('Failed to load event dates:', err)
      } finally {
        setLoadingDates(false)
      }
    },
    [familyGroupId]
  )

  const loadEvents = useCallback(
    async (pageNum: number, date?: string | null) => {
      if (!familyGroupId) {
        setLoadingEvents(false)
        return
      }

      setLoadingEvents(true)
      setError(null)

      try {
        const data = await apiClient.getEventsPaginated(familyGroupId, {
          page: pageNum,
          limit: ITEMS_PER_PAGE,
          date: date || undefined,
        })

        setEvents(
          data.items.map((e: any) => ({
            ...e,
            startsAt: new Date(e.startsAt),
            endsAt: e.endsAt ? new Date(e.endsAt) : null,
          }))
        )
        setTotalPages(data.totalPages)
      } catch (err: any) {
        console.error('Failed to load events:', err)
        setError(err.message || 'שגיאה בטעינת האירועים')
        toast({
          title: 'שגיאה',
          description: 'לא הצלחנו לטעון את האירועים. אנא נסה שוב.',
          variant: 'destructive',
        })
      } finally {
        setLoadingEvents(false)
      }
    },
    [familyGroupId, toast]
  )

  useEffect(() => {
    loadEventDates(currentMonth)
  }, [currentMonth, loadEventDates])

  useEffect(() => {
    loadEvents(page, selectedDate)
  }, [page, selectedDate, loadEvents])

  useEffect(() => {
    setSelectedDate(null)
    setPage(1)
    setEventDates([])
    setEvents([])
    setCurrentMonth(new Date())
  }, [familyGroupId])

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month)
  }

  const handleDateSelect = (date: string | null) => {
    setSelectedDate(date)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    listRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleClearFilter = () => {
    setSelectedDate(null)
    setPage(1)
  }

  const handleRetry = () => {
    loadEvents(page, selectedDate)
    loadEventDates(currentMonth)
  }

  if (loadingGroups) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl lg:max-w-7xl mx-auto text-center py-12">
            <Loader2 className="h-8 w-8 mx-auto text-primary mb-4 animate-spin" />
            <p className="text-muted-foreground">טוען קבוצות...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-4xl lg:max-w-7xl mx-auto">
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold mb-1">לוח אירועים משפחתי</h2>
              <p className="text-sm text-muted-foreground">
                אירועים ושמחות
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {familyGroupId && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    disabled={loadingEvents}
                    className="touch-target"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ml-2 ${loadingEvents ? 'animate-spin' : ''}`}
                    />
                    רענן
                  </Button>
                  <Button asChild className="touch-target">
                    <Link href="/admin?tab=events">
                      <Calendar className="h-4 w-4 ml-2" />
                      הוסף אירוע
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {(groups.length === 0 || groups.length > 1) && (
            <GroupSelector
              title={familyGroupId ? 'החלף קבוצה' : 'בחר קבוצה לצפייה באירועים'}
              description="בחר את הקבוצה שתרצה לראות את האירועים שלה"
            />
          )}

          {familyGroupId && (
            <div className="lg:grid lg:grid-cols-[350px_1fr] lg:gap-6 lg:items-start">
              <div className="mb-4 lg:mb-0 lg:sticky lg:top-24">
                <EventsCalendar
                  eventDates={eventDates}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  currentMonth={currentMonth}
                  onMonthChange={handleMonthChange}
                  loading={loadingDates}
                />
              </div>

              <div>
              {selectedDate && (
                <div className="mb-4 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
                    אירועים ב-{formatSelectedDate(selectedDate)}
                    <button
                      type="button"
                      onClick={handleClearFilter}
                      className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
              )}

              <div ref={listRef}>
                {loadingEvents && (
                  <div className="space-y-4">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                  </div>
                )}

                {!loadingEvents && error && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                      <p className="text-sm sm:text-base text-muted-foreground mb-4">{error}</p>
                      <Button onClick={handleRetry} className="touch-target">
                        נסה שוב
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {!loadingEvents && !error && events.length > 0 && (
                  <div className="space-y-4">
                    {events.map((event) => {
                      const isPast = event.startsAt < new Date()
                      const isTodayEvent =
                        event.startsAt.toDateString() === new Date().toDateString()

                      return (
                        <Card
                          key={event.id}
                          className={`hover:shadow-lg transition-shadow ${
                            isPast ? 'opacity-60' : ''
                          } ${isTodayEvent ? 'border-primary border-2' : ''}`}
                        >
                          <CardHeader className="p-4 sm:p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                                  <CardTitle className="text-lg sm:text-xl">
                                    {event.title}
                                  </CardTitle>
                                  {isTodayEvent && (
                                    <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold">
                                      היום!
                                    </span>
                                  )}
                                </div>
                                {event.description && (
                                  <CardDescription className="text-sm sm:text-base mb-3 whitespace-pre-wrap">
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
                                  className="object-contain bg-muted"
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
                                  className="flex items-center gap-2 p-3 border rounded-lg bg-destructive/5 hover:bg-destructive/10 transition-colors text-destructive font-semibold"
                                >
                                  <Paperclip className="h-5 w-5" />
                                  <span className="text-sm">צפה בהזמנה (PDF)</span>
                                </a>
                              </div>
                            )}

                            <div className="space-y-2 mt-4">
                              <div className="flex items-start gap-2 text-muted-foreground flex-wrap">
                                <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <span className="text-xs sm:text-sm">
                                  {formatDateTime(event.startsAt)}
                                </span>
                              </div>
                              <div className="flex items-start gap-2 text-primary font-semibold flex-wrap">
                                <Clock className="h-4 w-4 opacity-0 flex-shrink-0" />
                                <span className="text-xs sm:text-sm">
                                  תאריך עברי: {getHebrewDateString(event.startsAt)}
                                </span>
                              </div>
                              {event.endsAt && (
                                <div className="flex items-start gap-2 text-muted-foreground flex-wrap">
                                  <Clock className="h-4 w-4 opacity-0 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm">
                                    משך: {formatTimeRange(event.startsAt, event.endsAt)}
                                  </span>
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-start gap-2 text-muted-foreground">
                                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                  <span className="text-xs sm:text-sm break-words">
                                    {event.location}
                                  </span>
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

                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      className="mt-6"
                    />
                  </div>
                )}

                {!loadingEvents && !error && events.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm sm:text-base text-muted-foreground mb-4">
                        {selectedDate
                          ? `אין אירועים ב-${formatSelectedDate(selectedDate)}`
                          : 'אין אירועים מתוזמנים'}
                      </p>
                      {selectedDate ? (
                        <Button
                          variant="outline"
                          onClick={handleClearFilter}
                          className="touch-target"
                        >
                          הצג את כל האירועים
                        </Button>
                      ) : (
                        <Button asChild className="touch-target">
                          <Link href="/admin?tab=events">צור אירוע ראשון</Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
