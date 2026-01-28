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
    imageUrl?: string
    fileUrl?: string
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
      scheduledAnnouncements: number
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
        email: string | null
        name: string | null
        phone: string | null
        role: string
        joinedAt: string
      }>
    }>(`/api/admin/members?familyGroupId=${familyGroupId}`)
  }

  async addMember(data: {
    familyGroupId: string
    email?: string
    name: string
    phone?: string
    channel?: string
    password?: string
  }) {
    return this.request<{ success: boolean; user: any; membership: any }>('/api/admin/members', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Groups
  async updateGroup(groupId: string, data: { name?: string; slug?: string }) {
    return this.request<{ success: boolean; group: any }>(`/api/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteGroup(groupId: string) {
    return this.request<{ success: boolean; message: string; deletedGroup: any }>(
      `/api/groups/${groupId}/delete`,
      {
        method: 'DELETE',
      }
    )
  }

  // Profile
  async getProfile() {
    return this.request<{ success: boolean; user: any }>('/api/user/me')
  }

  async updateProfile(data: { name?: string; phone?: string; email?: string }) {
    return this.request<{ success: boolean; user: any }>('/api/user/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Invitations
  async getInvitations(familyGroupId: string) {
    return this.request<{ invitations: any[] }>(`/api/groups/${familyGroupId}/invitations`)
  }

  async sendInvitations(familyGroupId: string, emails: string[]) {
    return this.request<{ results: any[] }>(`/api/groups/${familyGroupId}/invitations`, {
      method: 'POST',
      body: JSON.stringify({ emails }),
    })
  }

  async getPendingInvitations() {
    return this.request<{ invitations: any[] }>('/api/invitations/pending')
  }

  async acceptInvitation(token: string) {
    return this.request<{ success: boolean; groupslug: string }>(
      `/api/invitations/${token}/accept`,
      {
        method: 'POST',
      }
    )
  }
}

export const apiClient = new ApiClient()
