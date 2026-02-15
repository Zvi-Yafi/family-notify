export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''

export function isGAEnabled(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!GA_MEASUREMENT_ID &&
    process.env.NODE_ENV === 'production'
  )
}

export function pageview(url: string): void {
  if (!isGAEnabled()) return
  window.gtag('event', 'page_view', {
    page_path: url,
  })
}

export function event(action: string, params?: Record<string, unknown>): void {
  if (!isGAEnabled()) return
  window.gtag('event', action, params)
}

export function setUserId(userId: string | null): void {
  if (!isGAEnabled()) return
  window.gtag('set', 'user_properties', {
    user_id: userId,
  })
  window.gtag('config', GA_MEASUREMENT_ID, {
    user_id: userId,
    send_page_view: false,
  })
}
