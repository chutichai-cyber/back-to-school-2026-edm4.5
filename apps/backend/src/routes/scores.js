import { Elysia } from 'elysia'
import prisma from '../lib/prisma.js'
import { broadcastScoreChange } from '../lib/broadcaster.js'

const SCORE_INCLUDE = {
  team: { select: { id: true, name: true, color: true } },
  game: { select: { id: true, name: true, status: true } },
}

// Re-compute Team.score from all Score records for that team and persist it.
// Returns the new total so callers can use it for history recording.
async function syncTeamScore(teamId) {
  const result = await prisma.score.aggregate({
    where: { teamId },
    _sum:  { points: true },
  })
  const total = result._sum.points ?? 0
  await prisma.team.update({ where: { id: teamId }, data: { score: total } })
  return total
}

export const scoresRouter = new Elysia({ prefix: '/api/scores' })
  // ── List ─────────────────────────────────────────────
  .get('/', ({ query }) =>
    prisma.score.findMany({
      where: {
        ...(query.teamId ? { teamId: Number(query.teamId) } : {}),
        ...(query.gameId ? { gameId: Number(query.gameId) } : {}),
      },
      include:  SCORE_INCLUDE,
      orderBy:  { points: 'desc' },
    })
  )

  // ── Get by ID ─────────────────────────────────────────
  .get('/:id', async ({ params, error }) => {
    const score = await prisma.score.findUnique({
      where:   { id: Number(params.id) },
      include: SCORE_INCLUDE,
    })
    if (!score) return error(404, { success: false, error: 'Score not found' })
    return score
  })

  // ── Upsert (create or update by teamId+gameId) ────────
  .post('/', async ({ body }) => {
    const { teamId, gameId, points, reason } = body

    const [teamBefore, existingScore] = await Promise.all([
      prisma.team.findUnique({ where: { id: teamId } }),
      prisma.score.findUnique({ where: { teamId_gameId: { teamId, gameId } } }),
    ])
    const pointsBefore = teamBefore?.score ?? 0
    const oldPoints    = existingScore?.points ?? 0
    const newPoints    = points ?? 0

    const score = await prisma.score.upsert({
      where:   { teamId_gameId: { teamId, gameId } },
      update:  { points: newPoints },
      create:  { teamId, gameId, points: newPoints },
      include: SCORE_INCLUDE,
    })

    const pointsAfter = await syncTeamScore(teamId)

    await prisma.scoreHistory.create({
      data: {
        teamId,
        gameId,
        delta:        newPoints - oldPoints,
        pointsBefore,
        pointsAfter,
        source:       'REST',
        reason:       reason ?? null,
      },
    })

    await broadcastScoreChange(teamId)
    return score
  })

  // ── Patch ─────────────────────────────────────────────
  .patch('/:id', async ({ params, body, error }) => {
    const existing = await prisma.score.findUnique({ where: { id: Number(params.id) } })
    if (!existing) return error(404, { success: false, error: 'Score not found' })

    const { reason, ...scoreData } = body
    const teamBefore   = await prisma.team.findUnique({ where: { id: existing.teamId } })
    const pointsBefore = teamBefore?.score ?? 0

    const score = await prisma.score.update({
      where:   { id: Number(params.id) },
      data:    scoreData,
      include: SCORE_INCLUDE,
    })

    const pointsAfter = await syncTeamScore(score.teamId)

    await prisma.scoreHistory.create({
      data: {
        teamId:       score.teamId,
        gameId:       score.gameId,
        delta:        (scoreData.points ?? existing.points) - existing.points,
        pointsBefore,
        pointsAfter,
        source:       'REST',
        reason:       reason ?? null,
      },
    })

    await broadcastScoreChange(score.teamId)
    return score
  })

  // ── Delete ────────────────────────────────────────────
  .delete('/:id', async ({ params, error }) => {
    const existing = await prisma.score.findUnique({ where: { id: Number(params.id) } })
    if (!existing) return error(404, { success: false, error: 'Score not found' })

    const teamBefore   = await prisma.team.findUnique({ where: { id: existing.teamId } })
    const pointsBefore = teamBefore?.score ?? 0

    await prisma.score.delete({ where: { id: Number(params.id) } })
    const pointsAfter = await syncTeamScore(existing.teamId)

    await prisma.scoreHistory.create({
      data: {
        teamId:       existing.teamId,
        gameId:       existing.gameId,
        delta:        -existing.points,
        pointsBefore,
        pointsAfter,
        source:       'REST',
        reason:       'Score record deleted',
      },
    })

    await broadcastScoreChange(existing.teamId)
    return { success: true }
  })
