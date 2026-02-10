export function mockSupabaseAuth(mockUser: { id: string; email: string } | null) {
  const { createServerClient } = require('@/lib/supabase/server')
  ;(createServerClient as jest.Mock).mockReturnValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: mockUser ? { ...mockUser, user_metadata: {} } : null },
        error: mockUser ? null : new Error('Not authenticated'),
      }),
    },
  })
}

export const TEST_USERS = {
  adminA: { id: 'test-admin-a-id', email: 'test-admin-a@familynotify.test' },
  memberA: { id: 'test-member-a-id', email: 'test-member-a@familynotify.test' },
  adminB: { id: 'test-admin-b-id', email: 'test-admin-b@familynotify.test' },
  unknown: { id: 'unknown-user-id', email: 'unknown@familynotify.test' },
} as const

export const TEST_FAMILIES = {
  familyA: 'test-family-a-id',
  familyB: 'test-family-b-id',
} as const
