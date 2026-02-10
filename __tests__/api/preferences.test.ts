/**
 * @jest-environment node
 */

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $use: jest.fn(),
    preference: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

jest.mock('@/lib/users', () => ({
  syncUser: jest.fn().mockResolvedValue({ id: 'test-admin-a-id' }),
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
import handler from '@/pages/api/preferences'
import { prisma } from '@/lib/prisma'
import { mockSupabaseAuth, TEST_USERS } from '@test/helpers/auth'

const mockFindMany = prisma.preference.findMany as jest.Mock
const mockUpsert = prisma.preference.upsert as jest.Mock

describe('/api/preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      mockSupabaseAuth(null)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET' })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })

    it('should return preferences for authenticated user', async () => {
      mockSupabaseAuth(TEST_USERS.adminA)
      const mockPrefs = [
        { id: '1', userId: TEST_USERS.adminA.id, channel: 'EMAIL', enabled: true },
        { id: '2', userId: TEST_USERS.adminA.id, channel: 'PUSH', enabled: false },
      ]
      mockFindMany.mockResolvedValue(mockPrefs)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET' })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.preferences).toHaveLength(2)
      expect(data.preferences[0].channel).toBe('EMAIL')
    })
  })

  describe('POST', () => {
    it('should return 401 when not authenticated', async () => {
      mockSupabaseAuth(null)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: { preferences: [] },
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })

    it('should return 400 when preferences is not an array', async () => {
      mockSupabaseAuth(TEST_USERS.adminA)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: { preferences: 'not-array' },
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.error).toContain('Invalid preferences format')
    })

    it('should upsert preferences for authenticated user', async () => {
      mockSupabaseAuth(TEST_USERS.adminA)
      mockUpsert.mockResolvedValue({
        id: '1',
        userId: TEST_USERS.adminA.id,
        channel: 'EMAIL',
        enabled: true,
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          preferences: [
            { channel: 'EMAIL', enabled: true, destination: 'test@example.com', verified: true },
          ],
        },
      })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(mockUpsert).toHaveBeenCalledTimes(1)
    })
  })

  describe('unsupported methods', () => {
    it('should return 405 for DELETE', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'DELETE' })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })
  })
})
