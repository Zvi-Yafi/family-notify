/**
 * @jest-environment node
 */
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    $use: jest.fn(),
    $queryRaw: jest.fn(),
    membership: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    announcement: {
      count: jest.fn(),
    },
    event: {
      count: jest.fn(),
    },
  },
}))

jest.mock('@/lib/request-context', () => ({
  requestStorage: {
    run: jest.fn((_ctx: any, fn: () => any) => fn()),
    getStore: jest.fn(),
  },
  getRequestContext: jest.fn(),
  incrementQueryCount: jest.fn(),
  createRequestId: jest.fn(() => 'test-request-id'),
  logRequestStart: jest.fn(),
  logRequestEnd: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(),
}))

import { describe, it, expect, beforeEach, afterEach, jest as jestGlobals } from '@jest/globals'
import { createMocks } from 'node-mocks-http'
import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/admin/stats'
import { cache } from '@/lib/cache'
import { prisma } from '@/lib/prisma'

const mockTransaction = prisma.$transaction as any
const mockFindUnique = prisma.membership.findUnique as any
const mockGetUser = jestGlobals.fn() as any

describe('/api/admin/stats', () => {
  const mockFamilyGroupId = 'test-group-id'
  const mockUserId = 'test-user-id'

  beforeEach(() => {
    cache.clear()
    jest.clearAllMocks()

    const { createServerClient } = require('@/lib/supabase/server')
    ;(createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    })

    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId, email: 'test@example.com' } },
      error: null,
    } as any)

    mockFindUnique.mockResolvedValue({
      id: 'membership-id',
      userId: mockUserId,
      familyGroupId: mockFamilyGroupId,
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const mockResults: [
      number,
      number,
      number,
      number,
      Array<{ status: string; count: bigint }>,
      Array<{ count: bigint }>
    ] = [
      10,
      5,
      2,
      3,
      [{ status: 'SENT', count: BigInt(100) }],
      [{ count: BigInt(25) }],
    ]
    mockTransaction.mockResolvedValue(mockResults as any)
  })

  afterEach(() => {
    cache.clear()
  })

  it('should return stats successfully', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { familyGroupId: mockFamilyGroupId },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty('memberCount')
    expect(data).toHaveProperty('announcementsThisMonth')
    expect(data).toHaveProperty('scheduledAnnouncements')
    expect(data).toHaveProperty('upcomingEvents')
    expect(data).toHaveProperty('messagesSentToday')
    expect(data).toHaveProperty('deliveryStats')
  })

  it('should cache stats and reduce DB calls', async () => {
    const { req: req1, res: res1 } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { familyGroupId: mockFamilyGroupId },
    })

    await handler(req1, res1)

    const { req: req2, res: res2 } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { familyGroupId: mockFamilyGroupId },
    })

    await handler(req2, res2)

    const { req: req3, res: res3 } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { familyGroupId: mockFamilyGroupId },
    })

    await handler(req3, res3)

    expect(mockTransaction).toHaveBeenCalledTimes(1)

    expect(res1._getStatusCode()).toBe(200)
    expect(res2._getStatusCode()).toBe(200)
    expect(res3._getStatusCode()).toBe(200)
  })

  it('should return 401 if not authenticated', async () => {
    const { createServerClient } = require('@/lib/supabase/server')
    const mockGetUserUnauth = jest.fn() as any
    ;(createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: mockGetUserUnauth,
      },
    })

    mockGetUserUnauth.mockResolvedValue({
      data: { user: null },
      error: new Error('Unauthorized'),
    } as any)

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { familyGroupId: mockFamilyGroupId },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(401)
  })

  it('should return 403 if not a member', async () => {
    mockFindUnique.mockResolvedValueOnce(null)

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { familyGroupId: mockFamilyGroupId },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(403)
  })

  it('should return 400 if familyGroupId is missing', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: {},
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
  })

  it('should return 405 for non-GET requests', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      query: { familyGroupId: mockFamilyGroupId },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
  })
})
