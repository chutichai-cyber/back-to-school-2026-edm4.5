import { Elysia } from 'elysia'
import prisma from '../lib/prisma.js'

const HISTORY_INCLUDE = {
  team:  { select: { id: true, name: true, color: true } },
  game:  { select: { id: true, name: true, status: true } },
  admin: { select: { id: true, username: true, role: true } },
}

export const scoreHistoryRouter = new Elysia({ prefix: '/api/score-history' })
  // ── List ──────────────────────────────────────────────
  .get('/', ({ query }) => {
    const where = {}
    if (query.teamId)  where.teamId  = Number(query.teamId)
    if (query.gameId)  where.gameId  = Number(query.gameId)
    if (query.adminId) where.adminId = Number(query.adminId)
    if (query.source)  where.source  = query.source

    const limit = Math.min(Number(query.limit) || 50, 200)

    return prisma.scoreHistory.findMany({
      where,
      include: HISTORY_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  })

  // ── Get by ID ─────────────────────────────────────────
  .get('/:id', async ({ params, error }) => {
    const entry = await prisma.scoreHistory.findUnique({
      where: { id: Number(params.id) },
      include: HISTORY_INCLUDE,
    })
    if (!entry) return error(404, { success: false, error: 'Score history entry not found' })
    return entry
  })
