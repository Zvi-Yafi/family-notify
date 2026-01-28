/**
 * @jest-environment node
 */
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    $use: jest.fn(),
    membership: { count: jest.fn() },
    announcement: { count: jest.fn() },
    event: { count: jest.fn() },
    $queryRaw: jest.fn(),
  },
}))

jest.mock('@/lib/request-context', () => ({
  getRequestContext: jest.fn(),
  incrementQueryCount: jest.fn(),
}))

import { describe, it, expect, beforeEach, afterEach, jest as jestGlobals } from '@jest/globals'
import { getGroupStats, invalidateGroupStatsCache } from '@/lib/services/stats.service'
import { cache } from '@/lib/cache'
import { prisma } from '@/lib/prisma'

const mockTransaction = prisma.$transaction as any

describe('Stats Service', () => {
  const mockFamilyGroupId = 'test-group-id'

  beforeEach(() => {
    cache.clear()
    jest.clearAllMocks()
  })

  afterEach(() => {
    cache.clear()
  })

  it('should compute stats correctly', async () => {
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
      [
        { status: 'SENT', count: BigInt(100) },
        { status: 'QUEUED', count: BigInt(10) },
        { status: 'FAILED', count: BigInt(5) },
      ],
      [{ count: BigInt(25) }],
    ]

    mockTransaction.mockResolvedValueOnce(mockResults as any)

    const stats = await getGroupStats(mockFamilyGroupId)

    expect(stats).toEqual({
      memberCount: 10,
      announcementsThisMonth: 5,
      scheduledAnnouncements: 2,
      upcomingEvents: 3,
      messagesSentToday: 25,
      deliveryStats: {
        sent: 100,
        queued: 10,
        failed: 5,
      },
    })
  })

  it('should cache results', async () => {
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

    await getGroupStats(mockFamilyGroupId)
    await getGroupStats(mockFamilyGroupId)

    expect(mockTransaction).toHaveBeenCalledTimes(1)
  })

  it('should invalidate cache', async () => {
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

    await getGroupStats(mockFamilyGroupId)

    invalidateGroupStatsCache(mockFamilyGroupId)

    await getGroupStats(mockFamilyGroupId)

    expect(mockTransaction).toHaveBeenCalledTimes(2)
  })

  it('should handle empty delivery stats', async () => {
    const mockResults: [
      number,
      number,
      number,
      number,
      Array<{ status: string; count: bigint }>,
      Array<{ count: bigint }>
    ] = [10, 5, 2, 3, [], [{ count: BigInt(0) }]]

    mockTransaction.mockResolvedValue(mockResults as any)

    const stats = await getGroupStats(mockFamilyGroupId)

    expect(stats.deliveryStats).toEqual({
      sent: 0,
      queued: 0,
      failed: 0,
    })
  })
})
