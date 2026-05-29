import { Elysia } from 'elysia'
import prisma from '../lib/prisma.js'
import { broadcastGameChange } from '../lib/broadcaster.js'

const VALID_STATUSES = ['PENDING', 'ACTIVE', 'FINISHED']

const GAME_INCLUDE = {
  event: { select: { id: true, title: true } },
}

const GAME_INCLUDE_FULL = {
  event: { select: { id: true, title: true } },
  scores: {
    include: { team: { select: { id: true, name: true, color: true } } },
    orderBy: { points: 'desc' },
  },
}

export const gamesRouter = new Elysia({ prefix: '/api/games' })
  // ── List ─────────────────────────────────────────────
  .get('/', ({ query }) =>
    prisma.game.findMany({
      where: {
        ...(query.eventId ? { eventId: Number(query.eventId) } : {}),
        ...(query.status  ? { status:  query.status }          : {}),
      },
      include: GAME_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })
  )

  // ── Get by ID ─────────────────────────────────────────
  .get('/:id', async ({ params, error }) => {
    const game = await prisma.game.findUnique({
      where:   { id: Number(params.id) },
      include: GAME_INCLUDE_FULL,
    })
    if (!game) return error(404, { success: false, error: 'Game not found' })
    return game
  })

  // ── Create ────────────────────────────────────────────
  .post('/', async ({ body, error }) => {
    const { name, eventId, status } = body ?? {}

    if (!name?.toString().trim())
      return error(422, { success: false, error: 'name is required' })
    if (!eventId)
      return error(422, { success: false, error: 'eventId is required' })
    if (status && !VALID_STATUSES.includes(status))
      return error(422, { success: false, error: 'status must be PENDING, ACTIVE, or FINISHED' })

    const eventExists = await prisma.event.findUnique({ where: { id: Number(eventId) } })
    if (!eventExists)
      return error(404, { success: false, error: 'Event not found' })

    const game = await prisma.game.create({
      data: {
        name:    name.toString().trim(),
        eventId: Number(eventId),
        status:  status || 'PENDING',
      },
      include: GAME_INCLUDE,
    })

    await broadcastGameChange(game.id)
    return game
  })

  // ── Update ────────────────────────────────────────────
  .patch('/:id', async ({ params, body, error }) => {
    const exists = await prisma.game.findUnique({ where: { id: Number(params.id) } })
    if (!exists) return error(404, { success: false, error: 'Game not found' })

    const { name, status, startsAt, endsAt } = body ?? {}

    if (name !== undefined && !name.toString().trim())
      return error(422, { success: false, error: 'name cannot be empty' })
    if (status !== undefined && !VALID_STATUSES.includes(status))
      return error(422, { success: false, error: 'status must be PENDING, ACTIVE, or FINISHED' })

    const data = {}
    if (name     !== undefined) data.name     = name.toString().trim()
    if (status   !== undefined) data.status   = status
    if (startsAt !== undefined) data.startsAt = startsAt
    if (endsAt   !== undefined) data.endsAt   = endsAt

    const game = await prisma.game.update({
      where:   { id: Number(params.id) },
      data,
      include: GAME_INCLUDE,
    })

    await broadcastGameChange(game.id)
    return game
  })

  // ── Delete ────────────────────────────────────────────
  .delete('/:id', async ({ params, error }) => {
    const exists = await prisma.game.findUnique({ where: { id: Number(params.id) } })
    if (!exists) return error(404, { success: false, error: 'Game not found' })

    await prisma.game.delete({ where: { id: Number(params.id) } })
    return { success: true }
  })
