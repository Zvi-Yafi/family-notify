export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  totalPages: number
}

export interface SendProgressResponse {
  itemType: 'ANNOUNCEMENT' | 'EVENT' | 'EVENT_REMINDER'
  itemId: string
  total: number
  processed: number
  sent: number
  failed: number
  queued: number
  percentage: number
  byChannel: Record<
    'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH' | 'VOICE_CALL',
    {
      total: number
      processed: number
      sent: number
      failed: number
      queued: number
    }
  >
  startedAt: string | null
  completedAt: string | null
  isComplete: boolean
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname
          window.location.href = `/login?redirectTo=${encodeURIComponent(currentPath)}`
          throw new UnauthorizedError('Unauthorized - redirecting to login')
        }
        throw new UnauthorizedError('Unauthorized')
      }

      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async getAnnouncements(familyGroupId: string) {
    return this.request<{ announcements: any[] }>(
      `/api/admin/announcements?familyGroupId=${familyGroupId}`
    )
  }

  async getAnnouncementsPaginated(
    familyGroupId: string,
    params: { page: number; limit: number; type?: string }
  ) {
    const searchParams = new URLSearchParams({
      familyGroupId,
      page: String(params.page),
      limit: String(params.limit),
    })
    if (params.type && params.type !== 'ALL') {
      searchParams.set('type', params.type)
    }
    return this.request<PaginatedResponse<any>>(
      `/api/admin/announcements?${searchParams.toString()}`
    )
  }

  async createAnnouncement(data: {
    title: string
    bodyText: string
    type: 'GENERAL' | 'SIMCHA'
    familyGroupId: string
    scheduledAt?: string
    sendNow?: boolean
  }) {
    return this.request<{ success: boolean; announcement: any }>('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getAnnouncementProgress(announcementId: string) {
    return this.request<SendProgressResponse>(`/api/admin/announcements/${announcementId}/progress`)
  }

  async getEvents(familyGroupId: string, includePast: boolean = false) {
    const url = `/api/admin/events?familyGroupId=${familyGroupId}${includePast ? '&includePast=true' : ''}`
    return this.request<{ events: any[] }>(url)
  }

  async getEventsPaginated(
    familyGroupId: string,
    params: { page: number; limit: number; date?: string }
  ) {
    const searchParams = new URLSearchParams({
      familyGroupId,
      page: String(params.page),
      limit: String(params.limit),
    })
    if (params.date) {
      searchParams.set('date', params.date)
    }
    return this.request<PaginatedResponse<any>>(
      `/api/admin/events?${searchParams.toString()}`
    )
  }

  async getEventDatesForMonth(familyGroupId: string, month: string) {
    return this.request<{ eventDates: string[] }>(
      `/api/admin/events/dates?familyGroupId=${familyGroupId}&month=${month}`
    )
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

  async getEventReminderProgress(reminderId: string) {
    return this.request<SendProgressResponse>(`/api/admin/event-reminders/${reminderId}/progress`)
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
