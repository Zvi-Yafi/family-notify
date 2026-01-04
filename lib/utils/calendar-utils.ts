/**
 * Utility for generating calendar links and files
 */

export interface CalendarEvent {
  title: string
  description?: string | null
  location?: string | null
  startsAt: Date
  endsAt?: Date | null
}

/**
 * Formats a date for Google Calendar (YYYYMMDDTHHMMSSZ)
 */
function formatGoogleDate(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d\d\d/g, '')
}

/**
 * Generates a Google Calendar shareable URL
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const start = formatGoogleDate(event.startsAt)
  const end = event.endsAt
    ? formatGoogleDate(event.endsAt)
    : formatGoogleDate(new Date(event.startsAt.getTime() + 60 * 60 * 1000)) // Default 1 hour

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description || '',
    location: event.location || '',
    dates: `${start}/${end}`,
  })

  return `https://www.google.com/calendar/render?${params.toString()}`
}

/**
 * Generates and triggers download of an .ics file
 */
export function downloadIcsFile(event: CalendarEvent): void {
  const start = formatGoogleDate(event.startsAt)
  const end = event.endsAt
    ? formatGoogleDate(event.endsAt)
    : formatGoogleDate(new Date(event.startsAt.getTime() + 60 * 60 * 1000))

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FamilyNotify//NONSGML v1.0//EN',
    'BEGIN:VEVENT',
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description || ''}`,
    `LOCATION:${event.location || ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
