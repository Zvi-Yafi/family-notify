import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

// Mock data factories
export const mockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  phone: '+972501234567',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const mockFamilyGroup = (overrides = {}) => ({
  id: 'family-123',
  name: 'משפחת כהן',
  slug: 'cohen-family',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const mockMembership = (overrides = {}) => ({
  id: 'membership-123',
  userId: 'user-123',
  familyGroupId: 'family-123',
  role: 'MEMBER' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const mockAnnouncement = (overrides = {}) => ({
  id: 'announcement-123',
  familyGroupId: 'family-123',
  title: 'הודעה חשובה',
  body: 'תוכן ההודעה כאן',
  type: 'GENERAL' as const,
  createdBy: 'user-123',
  scheduledAt: null,
  publishedAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const mockEvent = (overrides = {}) => ({
  id: 'event-123',
  familyGroupId: 'family-123',
  title: 'אירוע משפחתי',
  description: 'תיאור האירוע',
  startsAt: new Date('2024-12-31T20:00:00Z'),
  endsAt: new Date('2024-12-31T23:00:00Z'),
  location: 'תל אביב',
  createdBy: 'user-123',
  scheduledReminderOffsets: [1440, 60], // 24h and 1h before
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const mockPreference = (overrides = {}) => ({
  id: 'preference-123',
  userId: 'user-123',
  channel: 'EMAIL' as const,
  enabled: true,
  destination: 'test@example.com',
  verifiedAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const mockDeliveryAttempt = (overrides = {}) => ({
  id: 'delivery-123',
  itemType: 'ANNOUNCEMENT' as const,
  itemId: 'announcement-123',
  userId: 'user-123',
  channel: 'EMAIL' as const,
  status: 'SENT' as const,
  providerMessageId: 'msg-123',
  error: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

// Prisma mock setup
export type MockPrismaClient = DeepMockProxy<PrismaClient>

export const prismaMock = mockDeep<PrismaClient>()

export function resetPrismaMock() {
  mockReset(prismaMock)
}

// Supabase mock
export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    signInWithOAuth: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}

// Provider mocks
export const mockEmailProvider = {
  send: jest.fn(),
}

export const mockSmsProvider = {
  send: jest.fn(),
}

export const mockWhatsAppProvider = {
  send: jest.fn(),
}

export const mockPushProvider = {
  send: jest.fn(),
}

// Helper to wait for async operations
export const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper to create mock request (App Router style - deprecated)
export const mockRequest = (body: any = {}, options: any = {}) => {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: new Map(Object.entries(options.headers || {})),
    url: options.url || 'http://localhost:3000/api/test',
    method: options.method || 'POST',
    ...options,
  }
}

// Helper to create mock NextResponse (App Router style - deprecated)
export const mockNextResponse = () => {
  const response = {
    json: jest.fn((data) => ({
      status: 200,
      data,
    })),
  }
  return response
}

// Pages Router API helpers
export interface MockApiRequest {
  method?: string
  body?: any
  query?: Record<string, string | string[]>
  cookies?: Record<string, string>
  headers?: Record<string, string>
}

export interface MockApiResponse {
  statusCode: number
  jsonData: any
  status: jest.Mock
  json: jest.Mock
  setHeader: jest.Mock
  redirect: jest.Mock
}

// Helper to create mock NextApiRequest for Pages Router
export const createMockApiRequest = (options: MockApiRequest = {}): any => {
  return {
    method: options.method || 'GET',
    body: options.body || {},
    query: options.query || {},
    cookies: options.cookies || {},
    headers: options.headers || {},
  }
}

// Helper to create mock NextApiResponse for Pages Router
export const createMockApiResponse = (): MockApiResponse => {
  const res: MockApiResponse = {
    statusCode: 200,
    jsonData: null,
    status: jest.fn().mockImplementation((code: number) => {
      res.statusCode = code
      return res
    }),
    json: jest.fn().mockImplementation((data: any) => {
      res.jsonData = data
      return res
    }),
    setHeader: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
  }
  return res
}
