import handler from '@/pages/api/admin/events'
import {
  prismaMock,
  mockEvent,
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

describe('Events API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock authenticated user by default
    mockSupabaseAuth.auth.getUser.mockResolvedValue({
      data: { user: { id: 'demo-user-id', email: 'test@example.com' } },
      error: null,
    })
  })

  describe('POST /api/admin/events', () => {
    it('should create event with default reminder offsets', async () => {
      const event = mockEvent()
      const requestBody = {
        title: 'אירוע משפחתי',
        description: 'תיאור האירוע',
        startsAt: '2024-12-31T20:00:00Z',
        endsAt: '2024-12-31T23:00:00Z',
        location: 'תל אביב',
        familyGroupId: 'family-123',
      }

      const req = createMockApiRequest({
        method: 'POST',
        body: requestBody,
      })
      const res = createMockApiResponse()

      // @ts-ignore
      prismaMock.event.create.mockResolvedValue(event)

      await handler(req, res as any)

      expect(res.statusCode).toBe(200)
      expect(res.jsonData.success).toBe(true)
      expect(res.jsonData.event).toBeDefined()

      expect(prismaMock.event.create).toHaveBeenCalledWith({
        data: {
          title: requestBody.title,
          description: requestBody.description,
          startsAt: expect.any(Date),
          endsAt: expect.any(Date),
          location: requestBody.location,
          familyGroupId: requestBody.familyGroupId,
          createdBy: 'demo-user-id',
          scheduledReminderOffsets: [1440, 60], // Default
        },
      })
    })

    it('should create event with custom reminder offsets', async () => {
      const event = mockEvent()
      const customOffsets = [2880, 1440, 120] // 2 days, 1 day, 2 hours
      const requestBody = {
        title: 'אירוע משפחתי',
        description: 'תיאור האירוע',
        startsAt: '2024-12-31T20:00:00Z',
        familyGroupId: 'family-123',
        reminderOffsets: customOffsets,
      }

      const req = createMockApiRequest({
        method: 'POST',
        body: requestBody,
      })
      const res = createMockApiResponse()

      // @ts-ignore
      prismaMock.event.create.mockResolvedValue(event)

      await handler(req, res as any)

      expect(prismaMock.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          scheduledReminderOffsets: customOffsets,
        }),
      })
    })

    it('should handle null endsAt', async () => {
      const event = mockEvent({ endsAt: null })
      const requestBody = {
        title: 'אירוע משפחתי',
        startsAt: '2024-12-31T20:00:00Z',
        familyGroupId: 'family-123',
      }

      const req = createMockApiRequest({
        method: 'POST',
        body: requestBody,
      })
      const res = createMockApiResponse()

      // @ts-ignore
      prismaMock.event.create.mockResolvedValue(event)

      await handler(req, res as any)

      expect(res.statusCode).toBe(200)
      expect(prismaMock.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          endsAt: null,
        }),
      })
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
        title: 'אירוע משפחתי',
        startsAt: '2024-12-31T20:00:00Z',
        familyGroupId: 'family-123',
      }

      const req = createMockApiRequest({
        method: 'POST',
        body: requestBody,
      })
      const res = createMockApiResponse()

      // @ts-ignore
      prismaMock.event.create.mockRejectedValue(new Error('Database error'))

      await handler(req, res as any)

      expect(res.statusCode).toBe(500)
      expect(res.jsonData.error).toBe('Database error')
    })
  })

  describe('GET /api/admin/events', () => {
    it('should fetch future events for family group', async () => {
      const futureEvents = [
        mockEvent({ startsAt: new Date('2025-12-31T20:00:00Z') }),
        mockEvent({ id: 'event-2', startsAt: new Date('2025-12-25T18:00:00Z') }),
      ]
      const creator = mockUser()

      const req = createMockApiRequest({
        method: 'GET',
        query: { familyGroupId: 'family-123' },
      })
      const res = createMockApiResponse()

      // @ts-ignore
      prismaMock.event.findMany.mockResolvedValue(
        futureEvents.map((evt) => ({
          ...evt,
          creator,
        }))
      )

      await handler(req, res as any)

      expect(res.statusCode).toBe(200)
      expect(res.jsonData.events).toHaveLength(2)

      expect(prismaMock.event.findMany).toHaveBeenCalledWith({
        where: {
          familyGroupId: 'family-123',
          startsAt: {
            gte: expect.any(Date),
          },
        },
        include: {
          creator: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          startsAt: 'asc',
        },
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
      prismaMock.event.findMany.mockRejectedValue(new Error('Database error'))

      await handler(req, res as any)

      expect(res.statusCode).toBe(500)
      expect(res.jsonData.error).toBe('Database error')
    })
  })

  describe('Unsupported methods', () => {
    it('should return 405 for unsupported methods', async () => {
      const req = createMockApiRequest({
        method: 'DELETE',
      })
      const res = createMockApiResponse()

      await handler(req, res as any)

      expect(res.statusCode).toBe(405)
      expect(res.jsonData.error).toBe('Method not allowed')
    })
  })
})
