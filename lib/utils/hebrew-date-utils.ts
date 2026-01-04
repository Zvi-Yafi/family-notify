import { HDate } from '@hebcal/core'

/**
 * Converts a Date object to a Hebrew date string.
 * Format: "day month year" in Hebrew (e.g., "י' בכסלו תשפ\"ה")
 */
export function formatHebrewDate(date: Date): string {
  const hDate = new HDate(date)
  return hDate.renderGematriya()
}

/**
 * Converts a Date object to a Hebrew date string with month name.
 * Useful for displaying more readable Hebrew dates.
 */
export function getHebrewDateString(date: Date): string {
  const hDate = new HDate(date)
  // render() provides a string like "10th of Kislev, 5785"
  // For Hebrew localized string, we use the gematriya which is standard.
  return hDate.renderGematriya()
}
/**
 * Returns the day of the week in Hebrew.
 */
export function getHebrewDayOfWeek(date: Date): string {
  const days = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת']
  return days[date.getDay()]
}

/**
 * Returns a full Hebrew date string including the day of the week.
 * Format: "יום שישי, י״ג טֵבֵת תשפ״ו"
 */
export function getFullHebrewDate(date: Date): string {
  const dayName = getHebrewDayOfWeek(date)
  const hDate = new HDate(date)
  return `${dayName}, ${hDate.renderGematriya()}`
}
