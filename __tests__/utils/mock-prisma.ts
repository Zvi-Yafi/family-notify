import { PrismaClient } from '@prisma/client'
import { mockDeep, DeepMockProxy } from 'jest-mock-extended'

export type MockPrisma = DeepMockProxy<PrismaClient>

export const mockPrisma = mockDeep<PrismaClient>()

// Mock the prisma module
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: mockPrisma,
}))

export default mockPrisma


