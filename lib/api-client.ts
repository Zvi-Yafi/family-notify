/**
 * API Client for FamilyNotify
 * Centralized API communication layer
 */

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
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
    return this.request<{ success: boolean; announcement: any }>(
      '/api/admin/announcements',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  }

  // Events
  async getEvents(familyGroupId: string) {
    return this.request<{ events: any[] }>(
      `/api/admin/events?familyGroupId=${familyGroupId}`
    )
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
    return this.request<{ success: boolean; event: any }>(
      '/api/admin/events',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  }
}

export const apiClient = new ApiClient()


