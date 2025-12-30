import { toZonedTime, fromZonedTime } from 'date-fns-tz'

const ISRAEL_TIMEZONE = 'Asia/Jerusalem'

/**
 * Converts a scheduled time string (YYYY-MM-DDTHH:mm) or Date object from Israel time to UTC Date object.
 * This is used when the user selects a time in the UI (which is local IL time) and we need to store it as UTC.
 *
 * @param dateStr - The date string or object to convert (assumed to be in Israel time)
 * @returns Date - The equivalent UTC Date object
 */
export function convertIsraelToUTC(dateInput: string | Date): Date {
  // If input is a string from datetime-local input, it has no timezone info
  // We treat it as if it's already in Israel timezone

  // Construct a date object that represents this "local" time
  const date = new Date(dateInput)

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date input')
  }

  // We use fromZonedTime to say: "This date object represents time in Asia/Jerusalem,
  // give me the corresponding UTC date"
  // Note: We need to be careful. new Date("2025-06-01T12:00") creates a date that is 12:00 LOCALLY (server time).
  // If server is UTC, it creates 12:00 UTC.

  // However, specifically for datetime-local strings like "2025-06-01T12:00",
  // we want to interpret "12:00" as "12:00 Israel Time".

  // date-fns-tz helper:
  return fromZonedTime(dateInput, ISRAEL_TIMEZONE)
}

/**
 * Formats a UTC date to Israel time string
 */
export function formatToIsraelTime(date: Date): string {
  return date.toLocaleString('he-IL', { timeZone: ISRAEL_TIMEZONE })
}
