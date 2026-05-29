import { Elysia } from 'elysia'
import prisma from '../lib/prisma.js'

const EVENT_INCLUDE = {
  games: {
    select: { id: true, name: true, status: true, startsAt: true, endsAt: true },
    orderBy: { createdAt: 'asc' },
  },
}

export const eventsRouter = new Elysia({ prefix: '/api/events' })
  // ── List ─────────────────────────────────────────────
  .get('/', () =>
    prisma.event.findMany({
      include: EVENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })
  )

  // ── Get active event (auto-creates if none exists) ───
  .get('/active', async () => {
    let event = await prisma.event.findFirst({
      where: { active: true },
      include: EVENT_INCLUDE,
    })
    if (!event) {
      event = await prisma.event.create({
        data: { title: 'School Scoreboard' },
        include: EVENT_INCLUDE,
      })
    }
    return event
  })

  // ── Get by ID ─────────────────────────────────────────
  .get('/:id', async ({ params, error }) => {
    const event = await prisma.event.findUnique({
      where: { id: Number(params.id) },
      include: EVENT_INCLUDE,
    })
    if (!event) return error(404, { success: false, error: 'Event not found' })
    return event
  })

  // ── Create ────────────────────────────────────────────
  .post('/', ({ body }) =>
    prisma.event.create({
      data: body,
      include: EVENT_INCLUDE,
    })
  )

  // ── Update ────────────────────────────────────────────
  .patch('/:id', async ({ params, body, error }) => {
    const exists = await prisma.event.findUnique({ where: { id: Number(params.id) } })
    if (!exists) return error(404, { success: false, error: 'Event not found' })

    return prisma.event.update({
      where: { id: Number(params.id) },
      data: body,
      include: EVENT_INCLUDE,
    })
  })

  // ── Delete ────────────────────────────────────────────
  .delete('/:id', async ({ params, error }) => {
    const exists = await prisma.event.findUnique({ where: { id: Number(params.id) } })
    if (!exists) return error(404, { success: false, error: 'Event not found' })

    await prisma.event.delete({ where: { id: Number(params.id) } })
    return { success: true }
  })
