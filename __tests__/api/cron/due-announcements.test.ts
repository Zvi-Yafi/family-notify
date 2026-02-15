/**
 * @jest-environment node
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $use: jest.fn(),
    announcement: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/dispatch/dispatch.service', () => ({
  dispatchService: {
    dispatchAnnouncement: jest.fn().mockResolvedValue(undefined),
  },
}))

import { createMocks } from 'node-mocks-http'
import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/cron/due-announcements'
import { prisma } from '@/lib/prisma'
import { dispatchService } from '@/lib/dispatch/dispatch.service'

const mockFindMany = prisma.announcement.findMany as jest.Mock
const mockUpdateMany = prisma.announcement.updateMany as jest.Mock
const mockDispatch = dispatchService.dispatchAnnouncement as jest.Mock

const CRON_SECRET = process.env.CRON_SECRET || 'test-cron-secret'

describe('/api/cron/due-announcements', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.CRON_SECRET = CRON_SECRET
  })

  it('should return 405 for non-GET methods', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })

  it('should return 401 without valid cron secret', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      headers: { authorization: 'Bearer wrong-secret' },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(401)
  })

  it('should return 200 with no due announcements', async () => {
    mockFindMany.mockResolvedValue([])

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.processed).toBe(0)
  })

  it('should dispatch due scheduled announcements', async () => {
    const dueAnnouncement = {
      id: 'ann-1',
      title: 'Scheduled Announcement',
      familyGroupId: 'family-1',
      scheduledAt: new Date('2026-01-01T10:00:00Z'),
      publishedAt: null,
    }

    mockFindMany
      .mockResolvedValueOnce([dueAnnouncement])
      .mockResolvedValueOnce([])
    mockUpdateMany.mockResolvedValue({ count: 1 })

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(mockDispatch).toHaveBeenCalledWith({
      announcementId: 'ann-1',
      familyGroupId: 'family-1',
    })
  })

  it('should skip already-claimed scheduled announcements (optimistic lock)', async () => {
    const dueAnnouncement = {
      id: 'ann-1',
      title: 'Already Claimed',
      familyGroupId: 'family-1',
      scheduledAt: new Date('2026-01-01T10:00:00Z'),
      publishedAt: null,
    }

    mockFindMany
      .mockResolvedValueOnce([dueAnnouncement])
      .mockResolvedValueOnce([])
    mockUpdateMany.mockResolvedValue({ count: 0 })

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should dispatch due resend announcements (scheduledResendAt)', async () => {
    const resendAnnouncement = {
      id: 'ann-2',
      title: 'Resend Announcement',
      familyGroupId: 'family-1',
      scheduledResendAt: new Date('2026-01-01T12:00:00Z'),
    }

    mockFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([resendAnnouncement])
    mockUpdateMany.mockResolvedValue({ count: 1 })

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(mockDispatch).toHaveBeenCalledWith({
      announcementId: 'ann-2',
      familyGroupId: 'family-1',
    })
    const data = JSON.parse(res._getData())
    expect(data.processed).toBe(1)
  })

  it('should skip already-claimed resend announcements (optimistic lock)', async () => {
    const resendAnnouncement = {
      id: 'ann-2',
      title: 'Already Resent',
      familyGroupId: 'family-1',
      scheduledResendAt: new Date('2026-01-01T12:00:00Z'),
    }

    mockFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([resendAnnouncement])
    mockUpdateMany.mockResolvedValue({ count: 0 })

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should process both scheduled and resend announcements in one run', async () => {
    const scheduledAnn = {
      id: 'ann-1',
      title: 'Scheduled',
      familyGroupId: 'family-1',
      scheduledAt: new Date('2026-01-01T10:00:00Z'),
      publishedAt: null,
    }
    const resendAnn = {
      id: 'ann-2',
      title: 'Resend',
      familyGroupId: 'family-2',
      scheduledResendAt: new Date('2026-01-01T12:00:00Z'),
    }

    mockFindMany
      .mockResolvedValueOnce([scheduledAnn])
      .mockResolvedValueOnce([resendAnn])
    mockUpdateMany.mockResolvedValue({ count: 1 })

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(mockDispatch).toHaveBeenCalledTimes(2)
    expect(mockDispatch).toHaveBeenCalledWith({
      announcementId: 'ann-1',
      familyGroupId: 'family-1',
    })
    expect(mockDispatch).toHaveBeenCalledWith({
      announcementId: 'ann-2',
      familyGroupId: 'family-2',
    })
    const data = JSON.parse(res._getData())
    expect(data.processed).toBe(2)
  })
})
