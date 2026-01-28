# Phase 2: Additional Endpoint Caching Implementation

## Status: In Progress

This document tracks the implementation of caching for the remaining heavy endpoints identified in production logs.

## Completed ✅

### 1. Super Admin Stats (`/api/super-admin/stats`)
- **Service**: `lib/services/super-admin-stats.service.ts`
- **Cache Key**: `super-admin-stats`
- **TTL**: 30s (configurable)
- **Queries Reduced**: ~8 → 0 on cache hit
- **Wrapped**: `withRequestContext()`

### 2. Groups Endpoint (`/api/groups/[id]`)
- **Service**: `lib/services/cached-endpoints.service.ts::getGroupById()`
- **Cache Key**: `group:{groupId}`
- **Invalidation**: On UPDATE (PUT request)
- **Wrapped**: `withRequestContext()`

### 3. Members Endpoint (`/api/admin/members`)
- **Service**: `lib/services/cached-endpoints.service.ts::getGroupMembers()`
- **Cache Key**: `admin-members:{groupId}`
- **Invalidation**: On member creation (POST)
- **Wrapped**: `withRequestContext()`

### 4. Events Endpoint (`/api/admin/events`)
- **Service**: `lib/services/cached-endpoints.service.ts::getGroupEvents()`
- **Cache Key**: `admin-events:{groupId}:{includePast}`
- **Invalidation**: On event creation (POST)
- **Wrapped**: `withRequestContext()`

## Remaining Tasks ⏳

### 5. Announcements Endpoint (`/api/admin/announcements`)
**TODO:**
```typescript
// In announcements.ts, add:
import { withRequestContext } from '@/lib/api-wrapper'
import { getGroupAnnouncements, invalidateGroupCache } from '@/lib/services/cached-endpoints.service'

// Replace GET handler with:
const result = await getGroupAnnouncements(familyGroupId)
return res.status(200).json(result)

// After POST (creating announcement), add:
invalidateGroupCache(familyGroupId)

// At end of file:
export default withRequestContext(handler)
```

### 6. Frontend Deduplication

**Files to Check:**
- `/pages/super-admin.tsx` - May call `/api/super-admin/stats` multiple times
- `/pages/super-admin/group/[id].tsx` - Calls multiple endpoints repeatedly

**Common Issues:**
1. Multiple useEffect hooks fetching same data
2. StrictMode double-calling in dev (acceptable if server caches)
3. No SWR deduping configuration
4. Unstable dependencies causing re-fetches

**Solution Pattern:**
```typescript
// Example: Centralized data fetching
function SuperAdminPage() {
  const { data: stats, isLoading } = useSWR(
    '/api/super-admin/stats',
    fetcher,
    {
      dedupingInterval: 2000,      // Dedupe within 2s
      revalidateOnFocus: false,    // Don't refetch on focus
      revalidateOnReconnect: false // Don't refetch on reconnect
    }
  )
  
  // Pass stats down as props to child components
  // Don't let children fetch independently
}
```

### 7. Integration Tests

**Create:** `__tests__/api/cached-endpoints.test.ts`

```typescript
describe('Cached Endpoints', () => {
  it('should cache /api/super-admin/stats', async () => {
    const req1 = await fetch('/api/super-admin/stats')
    const req2 = await fetch('/api/super-admin/stats')
    const req3 = await fetch('/api/super-admin/stats')
    
    // First: Cache MISS, subsequent: Cache HIT
    // Verify via server logs: queries=0 on 2nd and 3rd
  })
  
  it('should cache group endpoints', async () => {
    const groupId = 'test-group-id'
    
    // Test members
    await Promise.all([
      fetch(`/api/admin/members?familyGroupId=${groupId}`),
      fetch(`/api/admin/members?familyGroupId=${groupId}`),
      fetch(`/api/admin/members?familyGroupId=${groupId}`)
    ])
    
    // Expect 1 DB query total
  })
  
  it('should invalidate cache on mutations', async () => {
    const groupId = 'test-group-id'
    
    // Get initial data (cache miss)
    const r1 = await fetch(`/api/admin/members?familyGroupId=${groupId}`)
    const data1 = await r1.json()
    
    // Create new member (should invalidate cache)
    await fetch('/api/admin/members', {
      method: 'POST',
      body: JSON.stringify({ familyGroupId: groupId, name: 'Test', email: 'test@test.com' })
    })
    
    // Get again (should be cache miss due to invalidation)
    const r2 = await fetch(`/api/admin/members?familyGroupId=${groupId}`)
    const data2 = await r2.json()
    
    // Verify member count increased
    expect(data2.members.length).toBe(data1.members.length + 1)
  })
})
```

## Implementation Checklist

### Per-Endpoint Tasks
- [x] Create service function with caching
- [x] Update endpoint to use service
- [x] Wrap handler with `withRequestContext()`
- [x] Add cache invalidation on mutations
- [ ] Add integration tests
- [ ] Verify in dev with logs

### Frontend Tasks
- [ ] Audit `/pages/super-admin.tsx` for duplicate fetches
- [ ] Audit `/pages/super-admin/group/[id].tsx` for duplicate fetches
- [ ] Implement SWR deduping configuration
- [ ] Centralize data fetching per page
- [ ] Test with React StrictMode enabled

### Verification Tasks
- [ ] Run `npm run build` - should succeed
- [ ] Check dev logs for cache HIT/MISS patterns
- [ ] Verify query counts: 0 on cache hits
- [ ] Load test: 10 concurrent users, 30s duration
- [ ] Confirm no stale data issues

## Expected Results

### Before Optimization
```
Request 1: GET /api/super-admin/stats → queries=8, 3400ms
Request 2: GET /api/super-admin/stats → queries=8, 3500ms (304, but still queried DB!)
Request 3: GET /api/super-admin/stats → queries=8, 3800ms
```

### After Optimization
```
Request 1: GET /api/super-admin/stats → [Cache MISS] queries=8, 2900ms
Request 2: GET /api/super-admin/stats → [Cache HIT] queries=0, 100ms
Request 3: GET /api/super-admin/stats → [Cache HIT] queries=0, 5ms
```

## Cache Strategy Summary

| Endpoint | Cache Key | TTL | Invalidate On |
|----------|-----------|-----|---------------|
| `/api/super-admin/stats` | `super-admin-stats` | 30s | Manual/TTL |
| `/api/admin/stats` | `admin-stats:{groupId}` | 30s | Announcement/Event/Member create |
| `/api/groups/[id]` | `group:{groupId}` | 30s | Group update |
| `/api/admin/members` | `admin-members:{groupId}` | 30s | Member create |
| `/api/admin/events` | `admin-events:{groupId}:{includePast}` | 30s | Event create |
| `/api/admin/announcements` | `admin-announcements:{groupId}` | 30s | Announcement create |

## Monitoring

### Key Metrics
1. **Cache Hit Rate**: Should be >70% after warm-up
2. **Query Count**: Should average <2 per request (1 for auth, 0-1 for data)
3. **Response Time P95**: Should be <200ms for cached requests
4. **Database Connections**: Should remain stable <20

### Log Patterns to Watch
```
✅ Good:
[abc-123] GET /api/admin/stats?familyGroupId=xyz
[Cache HIT] admin-stats:xyz
[abc-123] Completed - queries=0 duration=5ms

❌ Bad (indicates cache not working):
[abc-123] GET /api/admin/stats?familyGroupId=xyz
[Cache MISS] admin-stats:xyz
[abc-123] Prisma count Membership
[abc-123] Prisma count Announcement
...
[abc-123] Completed - queries=6 duration=2500ms
[def-456] GET /api/admin/stats?familyGroupId=xyz  // Same request immediately after!
[Cache MISS] admin-stats:xyz  // Should have been HIT!
```

## Next Steps

1. Complete announcements endpoint caching (5 min)
2. Audit frontend pages for duplicate fetches (30 min)
3. Add integration tests (1 hour)
4. Deploy to staging and monitor (1 day)
5. If stable, deploy to production

## Notes

- All caching is in-memory (acceptable for single-server or low-traffic)
- For multi-server: Consider Redis (future enhancement)
- TTL is configurable via `STATS_CACHE_TTL_SECONDS` env var
- Cache invalidation is immediate on mutations
- Frontend should still dedupe, but server cache prevents DB load regardless

## Questions/Issues

- **Q**: What if cache becomes stale?  
  **A**: 30s TTL ensures max 30s staleness. Acceptable for admin dashboards. Can reduce TTL if needed.

- **Q**: What about multi-server deployments?  
  **A**: Current solution is single-server. For multi-server, add Redis cache layer.

- **Q**: How to test cache invalidation?  
  **A**: Create → Wait 1s → Fetch → Verify new data appears. Add automated test.

