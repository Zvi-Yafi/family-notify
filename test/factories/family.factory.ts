import { randomUUID } from 'crypto'

export interface FamilyGroupData {
  id: string
  name: string
  slug: string
  createdAt: Date
  updatedAt: Date
}

export function buildFamily(overrides?: Partial<FamilyGroupData>): FamilyGroupData {
  const id = randomUUID()
  const slug = `test-family-${id.slice(0, 8)}`
  const now = new Date()
  return {
    id,
    name: 'Test Family',
    slug,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function buildFamilyA(): FamilyGroupData {
  return buildFamily({
    id: 'test-family-a-id',
    name: 'Family A',
    slug: 'test-family-a',
  })
}

export function buildFamilyB(): FamilyGroupData {
  return buildFamily({
    id: 'test-family-b-id',
    name: 'Family B',
    slug: 'test-family-b',
  })
}
