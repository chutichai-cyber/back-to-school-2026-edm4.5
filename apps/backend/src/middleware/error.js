import { Elysia } from 'elysia'
import { logger } from '../lib/logger.js'

const IS_DEV = process.env.NODE_ENV !== 'production'

// Map Prisma error codes to HTTP status + message
function mapPrismaError(error) {
  const code = error.code
  if (code === 'P2002') return { status: 409, message: 'Resource already exists (unique constraint violated)' }
  if (code === 'P2025') return { status: 404, message: 'Resource not found' }
  if (code === 'P2003') return { status: 409, message: 'Foreign key constraint failed' }
  if (code === 'P2016') return { status: 404, message: 'Record not found' }
  return null
}

export const errorHandler = new Elysia({ name: 'middleware/error' })
  .onError({ as: 'global' }, ({ error, code, set, request }) => {
    const path = new URL(request.url).pathname
    const method = request.method

    // ── Elysia built-in error codes ─────────────────────
    if (code === 'NOT_FOUND') {
      set.status = 404
      return { success: false, error: 'Not Found', path }
    }

    if (code === 'VALIDATION') {
      set.status = 422
      logger.warn('validation error', { path, method, message: error.message })
      return {
        success: false,
        error: 'Validation Error',
        ...(IS_DEV && { details: error.message }),
      }
    }

    if (code === 'PARSE') {
      set.status = 400
      return { success: false, error: 'Bad Request', details: 'Invalid request body' }
    }

    if (code === 'INTERNAL_SERVER_ERROR') {
      logger.error('internal error', { path, method, message: error.message })
      set.status = 500
      return {
        success: false,
        error: 'Internal Server Error',
        ...(IS_DEV && { details: error.message }),
      }
    }

    // ── Prisma errors ────────────────────────────────────
    const isPrisma =
      error?.constructor?.name === 'PrismaClientKnownRequestError' ||
      error?.constructor?.name === 'PrismaClientValidationError'

    if (isPrisma) {
      const mapped = mapPrismaError(error)
      if (mapped) {
        set.status = mapped.status
        logger.warn('prisma error', { path, code: error.code, message: mapped.message })
        return { success: false, error: mapped.message }
      }
    }

    // ── Catch-all ────────────────────────────────────────
    logger.error('unhandled error', {
      code,
      path,
      method,
      message: error?.message,
      stack: IS_DEV ? error?.stack?.split('\n').slice(0, 5).join(' | ') : undefined,
    })

    set.status = 500
    return {
      success: false,
      error: 'Internal Server Error',
      ...(IS_DEV && { details: error?.message }),
    }
  })
