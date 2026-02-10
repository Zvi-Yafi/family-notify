/**
 * @jest-environment node
 */

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(),
}))

import { createMocks } from 'node-mocks-http'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getCurrentUser, isAuthenticated, requireAuth } from '@/lib/auth-helpers'
import { createServerClient } from '@/lib/supabase/server'

const mockCreateServerClient = createServerClient as jest.Mock

function mockSupabaseWithUser(user: any) {
  mockCreateServerClient.mockReturnValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
    },
  })
}

function mockSupabaseWithError(error: Error) {
  mockCreateServerClient.mockReturnValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error,
      }),
    },
  })
}

describe('auth-helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCurrentUser', () => {
    it('should return the user when authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabaseWithUser(mockUser)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>()
      const user = await getCurrentUser(req, res)

      expect(user).toEqual(mockUser)
      expect(mockCreateServerClient).toHaveBeenCalledWith(req, res)
    })

    it('should return null when not authenticated', async () => {
      mockSupabaseWithUser(null)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>()
      const user = await getCurrentUser(req, res)

      expect(user).toBeNull()
    })

    it('should return null when supabase returns an error', async () => {
      mockSupabaseWithError(new Error('Token expired'))

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>()
      const user = await getCurrentUser(req, res)

      expect(user).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when user exists', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabaseWithUser(mockUser)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>()
      const result = await isAuthenticated(req, res)

      expect(result).toBe(true)
    })

    it('should return false when user is null', async () => {
      mockSupabaseWithUser(null)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>()
      const result = await isAuthenticated(req, res)

      expect(result).toBe(false)
    })
  })

  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabaseWithUser(mockUser)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>()
      const user = await requireAuth(req, res)

      expect(user).toEqual(mockUser)
    })

    it('should throw when not authenticated', async () => {
      mockSupabaseWithUser(null)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>()

      await expect(requireAuth(req, res)).rejects.toThrow('Authentication required')
    })
  })
})
