import { POST, GET } from '@/app/api/admin/events/route'
import { prismaMock } from '../../../utils/test-helpers'
import { NextRequest } from 'next/server'
import { mockEvent, mockUser } from '../../../utils/test-helpers'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

describe('Events API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

      const request = {
        json: jest.fn().mockResolvedValue(requestBody),
      } as unknown as NextRequest

      // @ts-ignore
      prismaMock.event.create.mockResolvedValue(event)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.event).toBeDefined()

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

      const request = {
        json: jest.fn().mockResolvedValue(requestBody),
      } as unknown as NextRequest

      // @ts-ignore
      prismaMock.event.create.mockResolvedValue(event)

      const response = await POST(request)

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

      const request = {
        json: jest.fn().mockResolvedValue(requestBody),
      } as unknown as NextRequest

      // @ts-ignore
      prismaMock.event.create.mockResolvedValue(event)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(prismaMock.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          endsAt: null,
        }),
      })
    })

    it('should handle errors', async () => {
      const requestBody = {
        title: 'אירוע משפחתי',
        startsAt: '2024-12-31T20:00:00Z',
        familyGroupId: 'family-123',
      }

      const request = {
        json: jest.fn().mockResolvedValue(requestBody),
      } as unknown as NextRequest

      // @ts-ignore
      prismaMock.event.create.mockRejectedValue(new Error('Database error'))

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error')
    })
  })

  describe('GET /api/admin/events', () => {
    it('should fetch future events for family group', async () => {
      const futureEvents = [
        mockEvent({ startsAt: new Date('2025-12-31T20:00:00Z') }),
        mockEvent({ id: 'event-2', startsAt: new Date('2025-12-25T18:00:00Z') }),
      ]
      const creator = mockUser()

      const request = {
        url: 'http://localhost:3000/api/admin/events?familyGroupId=family-123',
      } as NextRequest

      // @ts-ignore
      prismaMock.event.findMany.mockResolvedValue(
        futureEvents.map((evt) => ({
          ...evt,
          creator,
        }))
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.events).toHaveLength(2)

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
      const request = {
        url: 'http://localhost:3000/api/admin/events',
      } as NextRequest

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('familyGroupId required')
    })

    it('should handle errors', async () => {
      const request = {
        url: 'http://localhost:3000/api/admin/events?familyGroupId=family-123',
      } as NextRequest

      // @ts-ignore
      prismaMock.event.findMany.mockRejectedValue(new Error('Database error'))

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error')
    })
  })
})


