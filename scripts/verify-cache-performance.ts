import { prisma } from '@/lib/prisma'
import { getGroupStats } from '@/lib/services/stats.service'
import { cache } from '@/lib/cache'
import { requestStorage, type RequestContext } from '@/lib/request-context'
import { randomUUID } from 'crypto'

async function runTest() {
  console.log('🧪 Testing Cache Performance\n')

  const testGroupId = await prisma.familyGroup
    .findFirst({
      select: { id: true, name: true },
    })
    .then((g) => g?.id || 'test-group')

  console.log(`📊 Testing with group ID: ${testGroupId}\n`)

  cache.clear()

  const createContext = (): RequestContext => ({
    requestId: randomUUID(),
    queryCount: 0,
    startTime: Date.now(),
  })

  console.log('Test 1: First request (cache miss)')
  const start1 = Date.now()
  const ctx1 = createContext()
  await requestStorage.run(ctx1, async () => {
    await getGroupStats(testGroupId)
  })
  console.log(`✓ Queries: ${ctx1.queryCount}, Duration: ${Date.now() - start1}ms\n`)

  await new Promise((resolve) => setTimeout(resolve, 100))

  console.log('Test 2: Second request (cache hit)')
  const start2 = Date.now()
  const ctx2 = createContext()
  await requestStorage.run(ctx2, async () => {
    await getGroupStats(testGroupId)
  })
  console.log(`✓ Queries: ${ctx2.queryCount}, Duration: ${Date.now() - start2}ms\n`)

  await new Promise((resolve) => setTimeout(resolve, 100))

  console.log('Test 3: Third request (cache hit)')
  const start3 = Date.now()
  const ctx3 = createContext()
  await requestStorage.run(ctx3, async () => {
    await getGroupStats(testGroupId)
  })
  console.log(`✓ Queries: ${ctx3.queryCount}, Duration: ${Date.now() - start3}ms\n`)

  console.log('📈 Results Summary:')
  console.log(`- Cache Miss Queries: ${ctx1.queryCount}`)
  console.log(`- Cache Hit Queries: ${ctx2.queryCount}, ${ctx3.queryCount}`)
  console.log(
    `- Query Reduction: ${Math.round(((ctx1.queryCount - ctx2.queryCount) / ctx1.queryCount) * 100)}%`
  )
  console.log(`- Cache Size: ${cache.size()} entries\n`)

  if (ctx2.queryCount === 0 && ctx3.queryCount === 0) {
    console.log('✅ Cache working perfectly!')
  } else if (ctx2.queryCount < ctx1.queryCount) {
    console.log('⚠️  Cache working but still some queries')
  } else {
    console.log('❌ Cache not working - same query count')
  }
}

runTest()
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
