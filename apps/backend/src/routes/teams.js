import { Elysia } from 'elysia'
import prisma from '../lib/prisma.js'
import { broadcastTeamChange, broadcastFullState } from '../lib/broadcaster.js'

const HEX_RE = /^#[0-9a-fA-F]{6}$/

function toStr(v) {
  return v == null ? '' : String(v).trim()
}

export const teamsRouter = new Elysia({ prefix: '/api/teams' })
  // ── List ─────────────────────────────────────────────
  .get('/', ({ query }) =>
    prisma.team.findMany({
      orderBy: query.orderBy === 'name' ? { name: 'asc' } : { score: 'desc' },
    })
  )

  // ── Get by ID ─────────────────────────────────────────
  .get('/:id', async ({ params, error }) => {
    const team = await prisma.team.findUnique({
      where: { id: Number(params.id) },
      include: {
        scores: {
          include: { game: { select: { id: true, name: true, status: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!team) return error(404, { success: false, error: 'Team not found' })
    return team
  })

  // ── Create ────────────────────────────────────────────
  .post('/', async ({ body, error }) => {
    const name  = toStr(body?.name)
    const color = body?.color

    if (!name)
      return error(422, { success: false, error: 'name is required' })
    if (name.length > 40)
      return error(422, { success: false, error: 'name must be 40 characters or fewer' })
    if (color !== undefined && !HEX_RE.test(color))
      return error(422, { success: false, error: 'color must be a 6-digit hex (e.g. #6366f1)' })

    const team = await prisma.team.create({ data: { name, color: color || '#6366f1' } })
    // New team added → full state push so all scoreboard clients see it
    await broadcastFullState()
    return team
  })

  // ── Update ────────────────────────────────────────────
  .patch('/:id', async ({ params, body, error }) => {
    const exists = await prisma.team.findUnique({ where: { id: Number(params.id) } })
    if (!exists) return error(404, { success: false, error: 'Team not found' })

    const { color, score } = body ?? {}
    const data = {}

    if (body?.name !== undefined) {
      const name = toStr(body.name)
      if (!name)
        return error(422, { success: false, error: 'name cannot be empty' })
      if (name.length > 40)
        return error(422, { success: false, error: 'name must be 40 characters or fewer' })
      data.name = name
    }

    if (color !== undefined) {
      if (!HEX_RE.test(color))
        return error(422, { success: false, error: 'color must be a 6-digit hex (e.g. #6366f1)' })
      data.color = color
    }

    if (score !== undefined) data.score = Number(score)

    const team = await prisma.team.update({ where: { id: Number(params.id) }, data })
    // team.updated event + ranking.updated + scoreboard:state
    await broadcastTeamChange(team.id)
    return team
  })

  // ── Delete ────────────────────────────────────────────
  .delete('/:id', async ({ params, error }) => {
    const exists = await prisma.team.findUnique({ where: { id: Number(params.id) } })
    if (!exists) return error(404, { success: false, error: 'Team not found' })

    await prisma.team.delete({ where: { id: Number(params.id) } })
    // Full state push so scoreboard removes the deleted team
    await broadcastFullState()
    return { success: true }
  })
