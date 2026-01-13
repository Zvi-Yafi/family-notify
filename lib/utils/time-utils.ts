/**
 * Rounds a date (or ISO string) to the nearest 10 minutes.
 * Examples:
 * 11:04 -> 11:00
 * 11:05 -> 11:10
 * 11:09 -> 11:10
 *
 * @param dateStr ISO date string (YYYY-MM-DDTHH:mm) or Date object
 * @returns ISO string formatted for datetime-local input (YYYY-MM-DDTHH:mm)
 */
export function roundToTenMinutes(dateInput: string | Date): string {
  if (!dateInput) return ''

  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return ''

  const minutes = date.getMinutes()

  // Round to nearest 10 minutes
  const roundedMinutes = Math.round(minutes / 10) * 10

  date.setMinutes(roundedMinutes)
  date.setSeconds(0)
  date.setMilliseconds(0)

  // Format YYYY-MM-DDTHH:mm for datetime-local
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const mins = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${mins}`
}

/**
 * Same as roundToTenMinutes but returns a Date object
 */
export function roundDateToTenMinutes(dateInput: string | Date): Date {
  if (!dateInput) return new Date(NaN)

  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return new Date(NaN)

  const minutes = date.getMinutes()
  const roundedMinutes = Math.round(minutes / 10) * 10

  date.setMinutes(roundedMinutes)
  date.setSeconds(0)
  date.setMilliseconds(0)

  return date
}
