import handler from '@/pages/api/admin/announcements'
import {
  prismaMock,
  mockAnnouncement,
  mockUser,
  createMockApiRequest,
  createMockApiResponse,
} from '../../../utils/test-helpers'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

// Mock Supabase server client
const mockSupabaseAuth = {
  auth: {
    getUser: jest.fn(),
  },
}

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => mockSupabaseAuth),
}))

// Mock dispatch service
const mockDispatchService = {
  dispatchAnnouncement: jest.fn(),
}

jest.mock('@/lib/dispatch/dispatch.service', () => ({
  dispatchService: mockDispatchService,
}))

describe('Announcements API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock authenticated user by default
    mockSupabaseAuth.auth.getUser.mockResolvedValue({
      data: { user: { id: 'demo-user-id', email: 'test@example.com' } },
      error: null,
    })
  })

  describe('POST /api/admin/announcements', () => {
    it('should create announcement and dispatch immediately if not scheduled', async () => {
      const announcement = mockAnnouncement()
      const requestBody = {
        title: 'הודעה חדשה',
        bodyText: 'תוכן ההודעה',
        type: 'GENERAL',
        familyGroupId: 'family-123',
      }

      const req = createMockApiRequest({
        method: 'POST',
        body: requestBody,
      })
      const res = createMockApiResponse()

      // @ts-ignore
      prismaMock.announcement.create.mockResolvedValue(announcement)
      mockDispatchService.dispatchAnnouncement.mockResolvedValue(undefined)

      await handler(req, res as any)

      expect(res.statusCode).toBe(200)
      expect(res.jsonData.success).toBe(true)
      expect(res.jsonData.announcement).toBeDefined()

      expect(prismaMock.announcement.create).toHaveBeenCalledWith({
        data: {
          title: requestBody.title,
          body: requestBody.bodyText,
          type: requestBody.type,
          familyGroupId: requestBody.familyGroupId,
          createdBy: 'demo-user-id',
          scheduledAt: null,
          publishedAt: expect.any(Date),
        },
      })

      expect(mockDispatchService.dispatchAnnouncement).toHaveBeenCalledWith({
        announcementId: announcement.id,
        familyGroupId: requestBody.familyGroupId,
      })
    })

    it('should create scheduled announcement without immediate dispatch', async () => {
      const announcement = mockAnnouncement()
      const scheduledAt = new Date('2024-12-31T20:00:00Z')
      const requestBody = {
        title: 'הודעה מתוזמנת',
        bodyText: 'תוכן ההודעה',
        type: 'GENERAL',
        familyGroupId: 'family-123',
        scheduledAt: scheduledAt.toISOString(),
      }

      const req = createMockApiRequest({
        method: 'POST',
        body: requestBody,
      })
      const res = createMockApiResponse()

      // @ts-ignore
      prismaMock.announcement.create.mockResolvedValue({
        ...announcement,
        scheduledAt,
        publishedAt: null,
      })

      await handler(req, res as any)

      expect(res.statusCode).toBe(200)
      expect(res.jsonData.success).toBe(true)

      expect(prismaMock.announcement.create).toHaveBeenCalledWith({
        data: {
          title: requestBody.title,
          body: requestBody.bodyText,
          type: requestBody.type,
          familyGroupId: requestBody.familyGroupId,
          createdBy: 'demo-user-id',
          scheduledAt: expect.any(Date),
          publishedAt: null,
        },
      })

      expect(mockDispatchService.dispatchAnnouncement).not.toHaveBeenCalled()
    })

    it('should return 401 if not authenticated', async () => {
      mockSupabaseAuth.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const req = createMockApiRequest({
        method: 'POST',
        body: { title: 'Test' },
      })
      const res = createMockApiResponse()

      await handler(req, res as any)

      expect(res.statusCode).toBe(401)
      expect(res.jsonData.error).toBe('Unauthorized')
    })

    it('should handle errors', async () => {
      const requestBody = {
        title: 'הודעה חדשה',
        bodyText: 'תוכן ההודעה',
        familyGroupId: 'family-123',
      }

      const req = createMockApiRequest({
        method: 'POST',
        body: requestBody,
      })
      const res = createMockApiResponse()

      // @ts-ignore
      prismaMock.announcement.create.mockRejectedValue(new Error('Database error'))

      await handler(req, res as any)

      expect(res.statusCode).toBe(500)
      expect(res.jsonData.error).toBe('Database error')
    })
  })

  describe('GET /api/admin/announcements', () => {
    it('should fetch announcements for family group', async () => {
      const announcements = [mockAnnouncement(), mockAnnouncement({ id: 'ann-2' })]
      const creator = mockUser()

      const req = createMockApiRequest({
        method: 'GET',
        query: { familyGroupId: 'family-123' },
      })
      const res = createMockApiResponse()

      // @ts-ignore
      prismaMock.announcement.findMany.mockResolvedValue(
        announcements.map((ann) => ({
          ...ann,
          creator,
        }))
      )

      await handler(req, res as any)

      expect(res.statusCode).toBe(200)
      expect(res.jsonData.announcements).toHaveLength(2)

      expect(prismaMock.announcement.findMany).toHaveBeenCalledWith({
        where: { familyGroupId: 'family-123' },
        include: {
          creator: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      })
    })

    it('should return 400 if familyGroupId is missing', async () => {
      const req = createMockApiRequest({
        method: 'GET',
        query: {},
      })
      const res = createMockApiResponse()

      await handler(req, res as any)

      expect(res.statusCode).toBe(400)
      expect(res.jsonData.error).toBe('familyGroupId required')
    })

    it('should handle errors', async () => {
      const req = createMockApiRequest({
        method: 'GET',
        query: { familyGroupId: 'family-123' },
      })
      const res = createMockApiResponse()

      // @ts-ignore
      prismaMock.announcement.findMany.mockRejectedValue(new Error('Database error'))

      await handler(req, res as any)

      expect(res.statusCode).toBe(500)
      expect(res.jsonData.error).toBe('Database error')
    })
  })

  describe('Unsupported methods', () => {
    it('should return 405 for unsupported methods', async () => {
      const req = createMockApiRequest({
        method: 'PUT',
      })
      const res = createMockApiResponse()

      await handler(req, res as any)

      expect(res.statusCode).toBe(405)
      expect(res.jsonData.error).toBe('Method not allowed')
    })
  })
})
