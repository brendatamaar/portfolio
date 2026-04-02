import type { MiddlewareHandler } from 'hono'
import { logger } from '../lib/logger.js'

export const requestLogger: MiddlewareHandler = async (c, next) => {
  const start = Date.now()
  await next()
  logger.request(c.req.method, c.req.path, c.res.status, Date.now() - start)
}
