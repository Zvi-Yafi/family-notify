import type { NextApiRequest, NextApiResponse } from 'next'
import {
  requestStorage,
  createRequestId,
  logRequestStart,
  logRequestEnd,
  type RequestContext,
} from './request-context'

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void

export function withRequestContext(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const requestId = createRequestId()
    const url = req.url || 'unknown'
    const method = req.method || 'unknown'

    const context: RequestContext = {
      requestId,
      queryCount: 0,
      startTime: Date.now(),
      method,
      url,
    }

    logRequestStart(requestId, method, url)

    try {
      await requestStorage.run(context, async () => {
        await handler(req, res)
      })
    } finally {
      logRequestEnd(context)
    }
  }
}
