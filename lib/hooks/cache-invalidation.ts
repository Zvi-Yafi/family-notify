import { invalidateGroupStatsCache } from '@/lib/services/stats.service'

export function invalidateStatsOnAnnouncementCreate(familyGroupId: string): void {
  invalidateGroupStatsCache(familyGroupId)
}

export function invalidateStatsOnEventCreate(familyGroupId: string): void {
  invalidateGroupStatsCache(familyGroupId)
}

export function invalidateStatsOnMembershipChange(familyGroupId: string): void {
  invalidateGroupStatsCache(familyGroupId)
}

export function invalidateStatsOnDeliveryAttempt(familyGroupId: string): void {
  invalidateGroupStatsCache(familyGroupId)
}
