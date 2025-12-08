/**
 * API Client for FamilyNotify
 * Centralized API communication layer
 */

// Custom error class for authentication errors
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Use relative URLs - works in browser and during SSR
    const url = endpoint

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for auth
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      // Handle 401 Unauthorized - user logged out
      if (response.status === 401) {
        // Only redirect if we're in the browser
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname
          window.location.href = `/login?redirectTo=${encodeURIComponent(currentPath)}`
          // Throw a special error that won't be displayed
          throw new UnauthorizedError('Unauthorized - redirecting to login')
        }
        throw new UnauthorizedError('Unauthorized')
      }

      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Announcements
  async getAnnouncements(familyGroupId: string) {
    return this.request<{ announcements: any[] }>(
      `/api/admin/announcements?familyGroupId=${familyGroupId}`
    )
  }

  async createAnnouncement(data: {
    title: string
    bodyText: string
    type: 'GENERAL' | 'SIMCHA'
    familyGroupId: string
    scheduledAt?: string
  }) {
    return this.request<{ success: boolean; announcement: any }>('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Events
  async getEvents(familyGroupId: string, includePast: boolean = false) {
    const url = `/api/admin/events?familyGroupId=${familyGroupId}${includePast ? '&includePast=true' : ''}`
    return this.request<{ events: any[] }>(url)
  }

  async createEvent(data: {
    title: string
    description?: string
    startsAt: string
    endsAt?: string
    location?: string
    familyGroupId: string
    reminderOffsets?: number[]
  }) {
    return this.request<{ success: boolean; event: any }>('/api/admin/events', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Stats
  async getStats(familyGroupId: string) {
    return this.request<{
      memberCount: number
      announcementsThisMonth: number
      upcomingEvents: number
      messagesSentToday: number
      deliveryStats: {
        sent: number
        queued: number
        failed: number
      }
    }>(`/api/admin/stats?familyGroupId=${familyGroupId}`)
  }

  // Members
  async getMembers(familyGroupId: string) {
    return this.request<{
      members: Array<{
        id: string
        email: string
        phone: string | null
        role: string
        joinedAt: string
      }>
    }>(`/api/admin/members?familyGroupId=${familyGroupId}`)
  }
}

export const apiClient = new ApiClient()
