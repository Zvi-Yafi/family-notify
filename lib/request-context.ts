import { AsyncLocalStorage } from 'async_hooks'
import { randomUUID } from 'crypto'

export interface RequestContext {
  requestId: string
  queryCount: number
  startTime: number
  method?: string
  url?: string
}

export const requestStorage = new AsyncLocalStorage<RequestContext>()

export function getRequestContext(): RequestContext | undefined {
  return requestStorage.getStore()
}

export function incrementQueryCount(): void {
  const ctx = getRequestContext()
  if (ctx) {
    ctx.queryCount++
  }
}

export function createRequestId(): string {
  return randomUUID()
}

export function logRequestStart(requestId: string, method: string, url: string): void {
  console.log(`[${requestId}] ${method} ${url}`)
}

export function logRequestEnd(ctx: RequestContext): void {
  const duration = Date.now() - ctx.startTime
  console.log(`[${ctx.requestId}] Completed - queries=${ctx.queryCount} duration=${duration}ms`)
}
