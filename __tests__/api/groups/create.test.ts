/**
 * @jest-environment node
 */

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $use: jest.fn(),
    familyGroup: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    membership: {
      create: jest.fn(),
    },
  },
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
import handler from '@/pages/api/groups/create'
import { prisma } from '@/lib/prisma'
import { mockSupabaseAuth, TEST_USERS } from '@test/helpers/auth'

const mockFamilyGroupCreate = prisma.familyGroup.create as jest.Mock
const mockFamilyGroupFindUnique = prisma.familyGroup.findUnique as jest.Mock
const mockMembershipCreate = prisma.membership.create as jest.Mock

describe('POST /api/groups/create', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockFamilyGroupFindUnique.mockResolvedValue(null)
    mockFamilyGroupCreate.mockResolvedValue({
      id: 'new-group-id',
      name: 'New Family',
      slug: 'new-family',
    })
    mockMembershipCreate.mockResolvedValue({ id: 'membership-id' })
  })

  it('should return 401 when not authenticated', async () => {
    mockSupabaseAuth(null)

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { name: 'Test', slug: 'test' },
    })

    await handler(req, res)
    expect(res._getStatusCode()).toBe(401)
  })

  it('should return 400 when name is missing', async () => {
    mockSupabaseAuth(TEST_USERS.adminA)

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { slug: 'test-slug' },
    })

    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should return 400 when slug is missing', async () => {
    mockSupabaseAuth(TEST_USERS.adminA)

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { name: 'Test Family' },
    })

    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should return 400 when slug already exists', async () => {
    mockSupabaseAuth(TEST_USERS.adminA)
    mockFamilyGroupFindUnique.mockResolvedValue({ id: 'existing-id', slug: 'taken-slug' })

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { name: 'Test Family', slug: 'taken-slug' },
    })

    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should create group and admin membership on valid request', async () => {
    mockSupabaseAuth(TEST_USERS.adminA)

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { name: 'New Family', slug: 'new-family' },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.group.name).toBe('New Family')
    expect(data.group.slug).toBe('new-family')

    expect(mockMembershipCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: TEST_USERS.adminA.id,
        role: 'ADMIN',
      }),
    })
  })

  it('should return 405 for non-POST methods', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    })

    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })
})
