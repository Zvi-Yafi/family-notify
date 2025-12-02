import { POST, GET } from '@/app/api/admin/announcements/route'
import { prismaMock } from '../../../utils/test-helpers'
import { NextRequest } from 'next/server'
import { mockAnnouncement, mockUser } from '../../../utils/test-helpers'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
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

      const request = {
        json: jest.fn().mockResolvedValue(requestBody),
      } as unknown as NextRequest

      // @ts-ignore
      prismaMock.announcement.create.mockResolvedValue(announcement)
      mockDispatchService.dispatchAnnouncement.mockResolvedValue(undefined)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.announcement).toBeDefined()

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

      const request = {
        json: jest.fn().mockResolvedValue(requestBody),
      } as unknown as NextRequest

      // @ts-ignore
      prismaMock.announcement.create.mockResolvedValue({
        ...announcement,
        scheduledAt,
        publishedAt: null,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

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

    it('should handle errors', async () => {
      const requestBody = {
        title: 'הודעה חדשה',
        bodyText: 'תוכן ההודעה',
        familyGroupId: 'family-123',
      }

      const request = {
        json: jest.fn().mockResolvedValue(requestBody),
      } as unknown as NextRequest

      // @ts-ignore
      prismaMock.announcement.create.mockRejectedValue(new Error('Database error'))

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error')
    })
  })

  describe('GET /api/admin/announcements', () => {
    it('should fetch announcements for family group', async () => {
      const announcements = [mockAnnouncement(), mockAnnouncement({ id: 'ann-2' })]
      const creator = mockUser()

      const request = {
        url: 'http://localhost:3000/api/admin/announcements?familyGroupId=family-123',
      } as NextRequest

      // @ts-ignore
      prismaMock.announcement.findMany.mockResolvedValue(
        announcements.map((ann) => ({
          ...ann,
          creator,
        }))
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.announcements).toHaveLength(2)

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
      const request = {
        url: 'http://localhost:3000/api/admin/announcements',
      } as NextRequest

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('familyGroupId required')
    })

    it('should handle errors', async () => {
      const request = {
        url: 'http://localhost:3000/api/admin/announcements?familyGroupId=family-123',
      } as NextRequest

      // @ts-ignore
      prismaMock.announcement.findMany.mockRejectedValue(new Error('Database error'))

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error')
    })
  })
})


