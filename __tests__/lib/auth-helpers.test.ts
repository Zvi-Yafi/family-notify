import { getCurrentUser, isAuthenticated, requireAuth } from '@/lib/auth-helpers'
import {
  mockSupabaseClient,
  createMockApiRequest,
  createMockApiResponse,
} from '../utils/test-helpers'

// Mock the Supabase server module
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient),
}))

describe('Auth Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCurrentUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const req = createMockApiRequest()
      const res = createMockApiResponse()

      const user = await getCurrentUser(req as any, res as any)
      expect(user).toEqual(mockUser)
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(1)
    })

    it('should return null when not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const req = createMockApiRequest()
      const res = createMockApiResponse()

      const user = await getCurrentUser(req as any, res as any)
      expect(user).toBeNull()
    })

    it('should return null when error occurs', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      })

      const req = createMockApiRequest()
      const res = createMockApiResponse()

      const user = await getCurrentUser(req as any, res as any)
      expect(user).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const req = createMockApiRequest()
      const res = createMockApiResponse()

      const result = await isAuthenticated(req as any, res as any)
      expect(result).toBe(true)
    })

    it('should return false when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const req = createMockApiRequest()
      const res = createMockApiResponse()

      const result = await isAuthenticated(req as any, res as any)
      expect(result).toBe(false)
    })
  })

  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const req = createMockApiRequest()
      const res = createMockApiResponse()

      const user = await requireAuth(req as any, res as any)
      expect(user).toEqual(mockUser)
    })

    it('should throw error when not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const req = createMockApiRequest()
      const res = createMockApiResponse()

      await expect(requireAuth(req as any, res as any)).rejects.toThrow('Authentication required')
    })

    it('should throw error when auth check fails', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Network error' },
      })

      const req = createMockApiRequest()
      const res = createMockApiResponse()

      await expect(requireAuth(req as any, res as any)).rejects.toThrow('Authentication required')
    })
  })
})
