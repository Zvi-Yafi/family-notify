import { PrismaClient } from '@prisma/client'
import { getRequestContext, incrementQueryCount } from './request-context'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  client.$use(async (params, next) => {
    const ctx = getRequestContext()
    if (ctx) {
      incrementQueryCount()
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${ctx.requestId}] Prisma ${params.action} ${params.model}`)
      }
    }
    return next(params)
  })

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
