import { randomUUID } from 'crypto'

export type Role = 'ADMIN' | 'MEMBER'

export interface MembershipData {
  id: string
  userId: string
  familyGroupId: string
  role: Role
  createdAt: Date
  updatedAt: Date
}

export function buildMembership(overrides?: Partial<MembershipData>): MembershipData {
  const now = new Date()
  return {
    id: randomUUID(),
    userId: randomUUID(),
    familyGroupId: randomUUID(),
    role: 'MEMBER',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function buildAdminMembership(
  userId: string,
  familyGroupId: string,
  overrides?: Partial<MembershipData>
): MembershipData {
  return buildMembership({
    userId,
    familyGroupId,
    role: 'ADMIN',
    ...overrides,
  })
}

export function buildMemberMembership(
  userId: string,
  familyGroupId: string,
  overrides?: Partial<MembershipData>
): MembershipData {
  return buildMembership({
    userId,
    familyGroupId,
    role: 'MEMBER',
    ...overrides,
  })
}
