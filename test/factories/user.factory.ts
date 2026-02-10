import { randomUUID } from 'crypto'

export interface UserData {
  id: string
  email: string | null
  phone: string | null
  name: string | null
  createdAt: Date
  updatedAt: Date
}

export function buildUser(overrides?: Partial<UserData>): UserData {
  const id = randomUUID()
  const now = new Date()
  return {
    id,
    email: `test-${id.slice(0, 8)}@example.com`,
    phone: null,
    name: 'Test User',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function buildAdminUser(overrides?: Partial<UserData>): UserData {
  return buildUser({
    name: 'Test Admin',
    ...overrides,
  })
}

export function buildMemberUser(overrides?: Partial<UserData>): UserData {
  return buildUser({
    name: 'Test Member',
    ...overrides,
  })
}
