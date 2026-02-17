import { useMemo, useState } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  parseISO,
} from 'date-fns'
import { he } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft, Calendar, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAY_HEADERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

interface EventsCalendarProps {
  eventDates: string[]
  selectedDate: string | null
  onDateSelect: (date: string | null) => void
  currentMonth: Date
  onMonthChange: (month: Date) => void
  loading?: boolean
}

export function EventsCalendar({
  eventDates,
  selectedDate,
  onDateSelect,
  currentMonth,
  onMonthChange,
  loading = false,
}: EventsCalendarProps) {
  const [collapsed, setCollapsed] = useState(true)
  const [weekAnchor, setWeekAnchor] = useState<Date>(new Date())

  const datesSet = useMemo(() => new Set(eventDates), [eventDates])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  const activeAnchor = useMemo(() => {
    if (selectedDate) {
      return parseISO(selectedDate)
    }
    return weekAnchor
  }, [selectedDate, weekAnchor])

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(activeAnchor, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(activeAnchor, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: weekStart, end: weekEnd })
  }, [activeAnchor])

  const monthLabel = format(currentMonth, 'LLLL yyyy', { locale: he })
  const weekMonthLabel = format(activeAnchor, 'LLLL yyyy', { locale: he })

  const handlePrevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1))
  }

  const handlePrevWeek = () => {
    const prev = subWeeks(activeAnchor, 1)
    setWeekAnchor(prev)
    const prevMonth = startOfMonth(prev)
    if (!isSameMonth(prev, currentMonth)) {
      onMonthChange(prevMonth)
    }
  }

  const handleNextWeek = () => {
    const next = addWeeks(activeAnchor, 1)
    setWeekAnchor(next)
    const nextMonth = startOfMonth(next)
    if (!isSameMonth(next, currentMonth)) {
      onMonthChange(nextMonth)
    }
  }

  const handleToday = () => {
    onMonthChange(new Date())
    setWeekAnchor(new Date())
  }

  const handleDateClick = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    if (selectedDate === dateStr) {
      onDateSelect(null)
    } else {
      onDateSelect(dateStr)
    }
  }

  const handleToggleCollapse = () => {
    if (!collapsed) {
      setWeekAnchor(selectedDate ? parseISO(selectedDate) : new Date())
    }
    setCollapsed(!collapsed)
  }

  const displayDays = collapsed ? weekDays : calendarDays
  const showTodayButton = collapsed
    ? !isSameDay(activeAnchor, new Date())
    : !isSameMonth(currentMonth, new Date())

  return (
    <div className="bg-card rounded-lg border p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={collapsed ? handlePrevWeek : handlePrevMonth}
          className="h-9 w-9"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-semibold capitalize">
            {collapsed ? weekMonthLabel : monthLabel}
          </h3>
          {showTodayButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="text-xs h-7 px-2"
            >
              היום
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleCollapse}
            className="text-xs h-7 px-2 gap-1"
          >
            {collapsed ? (
              <>
                <CalendarDays className="h-3.5 w-3.5" />
                שבוע
              </>
            ) : (
              <>
                <Calendar className="h-3.5 w-3.5" />
                חודש
              </>
            )}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={collapsed ? handleNextWeek : handleNextMonth}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {DAY_HEADERS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}

        {displayDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const inCurrentMonth = collapsed || isSameMonth(day, currentMonth)
          const isSelected = selectedDate === dateStr
          const today = isToday(day)
          const hasEvent = datesSet.has(dateStr)

          if (loading) {
            return (
              <div
                key={dateStr}
                className="flex flex-col items-center justify-center py-1.5 sm:py-2"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-muted animate-pulse" />
              </div>
            )
          }

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => inCurrentMonth && handleDateClick(day)}
              disabled={!inCurrentMonth}
              className={cn(
                'flex flex-col items-center justify-center py-1.5 sm:py-2 transition-colors min-h-[44px]',
                !inCurrentMonth && 'opacity-30 cursor-default',
                inCurrentMonth && 'cursor-pointer hover:bg-accent rounded-lg'
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full text-sm transition-colors',
                  isSelected && 'bg-primary text-primary-foreground font-bold',
                  !isSelected && today && 'ring-2 ring-primary font-semibold',
                  !isSelected && !today && inCurrentMonth && 'text-foreground',
                )}
              >
                {format(day, 'd')}
              </span>
              <div className="h-1.5 mt-0.5 flex items-center justify-center">
                {hasEvent && inCurrentMonth && (
                  <div
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      isSelected ? 'bg-primary-foreground' : 'bg-primary'
                    )}
                  />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
