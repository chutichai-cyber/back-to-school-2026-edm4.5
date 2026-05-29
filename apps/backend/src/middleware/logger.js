import { Elysia } from 'elysia'
import { logger } from '../lib/logger.js'

const SKIP_PATHS = new Set(['/health'])

export const requestLogger = new Elysia({ name: 'middleware/logger' })
  /*
   * derive() runs once per request before the route handler.
   * The returned object is merged into the context, making
   * `startAt` available in onAfterHandle.
   */
  .derive({ as: 'global' }, ({ request }) => {
    const url = new URL(request.url)
    if (!SKIP_PATHS.has(url.pathname)) {
      logger.info('→', { method: request.method, path: url.pathname })
    }
    return { startAt: Date.now() }
  })
  .onAfterHandle({ as: 'global' }, ({ request, set, startAt }) => {
    const url = new URL(request.url)
    if (SKIP_PATHS.has(url.pathname)) return

    const ms = Date.now() - (startAt ?? Date.now())
    const status = typeof set.status === 'number' ? set.status : 200
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'

    logger[level]('←', {
      method: request.method,
      path: url.pathname,
      status,
      ms,
    })
  })
