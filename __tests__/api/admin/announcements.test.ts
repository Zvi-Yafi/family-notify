/**
 * @jest-environment node
 */

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $use: jest.fn(),
    membership: {
      findUnique: jest.fn(),
    },
    announcement: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/dispatch/dispatch.service', () => ({
  dispatchService: {
    dispatchAnnouncement: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('@/lib/hooks/cache-invalidation', () => ({
  invalidateStatsOnAnnouncementCreate: jest.fn(),
}))

jest.mock('@/lib/services/cached-endpoints.service', () => ({
  getGroupAnnouncements: jest.fn(),
  invalidateGroupCache: jest.fn(),
}))

jest.mock('@/lib/utils/timezone', () => ({
  convertIsraelToUTC: jest.fn((d: string) => new Date(d)),
  formatToIsraelTime: jest.fn((d: Date) => d.toISOString()),
}))

jest.mock('@/lib/utils/time-utils', () => ({
  roundDateToTenMinutes: jest.fn((d: string) => d),
}))

jest.mock('@/lib/request-context', () => ({
  requestStorage: { run: jest.fn((_c: any, fn: () => any) => fn()), getStore: jest.fn() },
  getRequestContext: jest.fn(),
  incrementQueryCount: jest.fn(),
  createRequestId: jest.fn(() => 'test-req'),
  logRequestStart: jest.fn(),
  logRequestEnd: jest.fn(),
}))

import { createMocks } from 'node-mocks-http'
import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/admin/announcements'
import { prisma } from '@/lib/prisma'
import { dispatchService } from '@/lib/dispatch/dispatch.service'
import { mockSupabaseAuth, TEST_USERS, TEST_FAMILIES } from '@test/helpers/auth'

const mockMembershipFindUnique = prisma.membership.findUnique as jest.Mock
const mockAnnouncementCreate = prisma.announcement.create as jest.Mock
const mockAnnouncementFindMany = prisma.announcement.findMany as jest.Mock
const mockDispatchAnnouncement = dispatchService.dispatchAnnouncement as jest.Mock

describe('/api/admin/announcements', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST (create announcement)', () => {
    const validBody = {
      title: 'Test Announcement',
      bodyText: 'Test body content',
      type: 'GENERAL',
      familyGroupId: TEST_FAMILIES.familyA,
    }

    it('should return 401 when not authenticated', async () => {
      mockSupabaseAuth(null)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: validBody,
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })

    it('should return 403 when user is not a member of the group', async () => {
      mockSupabaseAuth(TEST_USERS.adminB)
      mockMembershipFindUnique.mockResolvedValue(null)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: validBody,
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(403)
    })

    it('should return 403 for IDOR: adminB posting to familyA', async () => {
      mockSupabaseAuth(TEST_USERS.adminB)
      mockMembershipFindUnique.mockResolvedValue(null)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: { ...validBody, familyGroupId: TEST_FAMILIES.familyA },
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(403)
      expect(mockMembershipFindUnique).toHaveBeenCalledWith({
        where: {
          userId_familyGroupId: {
            userId: TEST_USERS.adminB.id,
            familyGroupId: TEST_FAMILIES.familyA,
          },
        },
      })
    })

    it('should create announcement when user is a member', async () => {
      mockSupabaseAuth(TEST_USERS.adminA)
      mockMembershipFindUnique.mockResolvedValue({
        id: 'mem-id',
        userId: TEST_USERS.adminA.id,
        familyGroupId: TEST_FAMILIES.familyA,
        role: 'ADMIN',
      })
      mockAnnouncementCreate.mockResolvedValue({
        id: 'announcement-id',
        title: validBody.title,
        body: validBody.bodyText,
        familyGroupId: TEST_FAMILIES.familyA,
        createdBy: TEST_USERS.adminA.id,
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: validBody,
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.announcement.title).toBe('Test Announcement')
    })
  })

  describe('GET (list announcements)', () => {
    it('should return 401 when not authenticated', async () => {
      mockSupabaseAuth(null)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { familyGroupId: TEST_FAMILIES.familyA },
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })

    it('should return 400 when familyGroupId is missing', async () => {
      mockSupabaseAuth(TEST_USERS.adminA)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {},
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should return 403 when user is not in the group', async () => {
      mockSupabaseAuth(TEST_USERS.adminB)
      mockMembershipFindUnique.mockResolvedValue(null)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { familyGroupId: TEST_FAMILIES.familyA },
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(403)
    })

    it('should return 403 for IDOR: adminB reading familyA announcements', async () => {
      mockSupabaseAuth(TEST_USERS.adminB)
      mockMembershipFindUnique.mockResolvedValue(null)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { familyGroupId: TEST_FAMILIES.familyA },
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(403)
    })

    it('should return announcements for a valid member', async () => {
      mockSupabaseAuth(TEST_USERS.adminA)
      mockMembershipFindUnique.mockResolvedValue({
        id: 'mem-id',
        userId: TEST_USERS.adminA.id,
        familyGroupId: TEST_FAMILIES.familyA,
        role: 'ADMIN',
      })
      mockAnnouncementFindMany.mockResolvedValue([
        {
          id: 'ann-1',
          title: 'Test',
          body: 'Body',
          type: 'GENERAL',
          familyGroupId: TEST_FAMILIES.familyA,
          creator: { email: TEST_USERS.adminA.email },
        },
      ])

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { familyGroupId: TEST_FAMILIES.familyA },
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.announcements).toHaveLength(1)
    })
  })

  describe('POST - send modes', () => {
    const baseBody = {
      title: 'Test Announcement',
      bodyText: 'Test body content',
      type: 'GENERAL',
      familyGroupId: TEST_FAMILIES.familyA,
    }

    const mockMembership = {
      id: 'mem-id',
      userId: TEST_USERS.adminA.id,
      familyGroupId: TEST_FAMILIES.familyA,
      role: 'ADMIN',
    }

    const mockAnnouncement = {
      id: 'announcement-id',
      title: baseBody.title,
      body: baseBody.bodyText,
      familyGroupId: TEST_FAMILIES.familyA,
      createdBy: TEST_USERS.adminA.id,
    }

    beforeEach(() => {
      mockSupabaseAuth(TEST_USERS.adminA)
      mockMembershipFindUnique.mockResolvedValue(mockMembership)
      mockAnnouncementCreate.mockResolvedValue(mockAnnouncement)
    })

    it('sendNow=true (default) without scheduledAt: dispatches immediately, publishedAt set', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: { ...baseBody },
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const createCall = mockAnnouncementCreate.mock.calls[0][0]
      expect(createCall.data.publishedAt).toBeInstanceOf(Date)
      expect(createCall.data.scheduledAt).toBeNull()
      expect(createCall.data.scheduledResendAt).toBeNull()
      expect(mockDispatchAnnouncement).toHaveBeenCalledWith({
        announcementId: 'announcement-id',
        familyGroupId: TEST_FAMILIES.familyA,
      })
    })

    it('sendNow=false with scheduledAt: sets scheduledAt, publishedAt null, no dispatch', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: { ...baseBody, sendNow: false, scheduledAt: '2026-03-01T10:00' },
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const createCall = mockAnnouncementCreate.mock.calls[0][0]
      expect(createCall.data.publishedAt).toBeNull()
      expect(createCall.data.scheduledAt).toBeTruthy()
      expect(createCall.data.scheduledResendAt).toBeNull()
      expect(mockDispatchAnnouncement).not.toHaveBeenCalled()
    })

    it('sendNow=true with scheduledAt (both mode): dispatches immediately and sets scheduledResendAt', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: { ...baseBody, sendNow: true, scheduledAt: '2026-03-01T10:00' },
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const createCall = mockAnnouncementCreate.mock.calls[0][0]
      expect(createCall.data.publishedAt).toBeInstanceOf(Date)
      expect(createCall.data.scheduledAt).toBeNull()
      expect(createCall.data.scheduledResendAt).toBeTruthy()
      expect(mockDispatchAnnouncement).toHaveBeenCalledWith({
        announcementId: 'announcement-id',
        familyGroupId: TEST_FAMILIES.familyA,
      })
    })
  })

  describe('unsupported methods', () => {
    it('should return 405 for PUT', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'PUT' })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })
  })
})
