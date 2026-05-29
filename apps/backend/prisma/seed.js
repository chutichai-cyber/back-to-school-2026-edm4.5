import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('[seed] starting…')

  // ── Event ─────────────────────────────────────────────
  const event = await prisma.event.upsert({
    where: { id: 1 },
    update: {},
    create: { title: 'Back to School Sports Day', active: true },
  })
  console.log(`[seed] event: "${event.title}"`)

  // ── Admins ────────────────────────────────────────────
  const adminDefs = [
    { username: 'superadmin', email: 'superadmin@scoreboard.local', password: 'Admin@1234', role: 'SUPER_ADMIN' },
    { username: 'admin',      email: 'admin@scoreboard.local',      password: 'Admin@1234', role: 'ADMIN'       },
  ]

  for (const def of adminDefs) {
    const passwordHash = await Bun.password.hash(def.password)
    await prisma.admin.upsert({
      where: { username: def.username },
      update: {},
      create: { username: def.username, email: def.email, passwordHash, role: def.role },
    })
    console.log(`[seed] admin: ${def.username} (${def.role})`)
  }

  // ── Teams ─────────────────────────────────────────────
  const teamDefs = [
    { name: 'Thunder Hawks',  color: '#6366f1' },
    { name: 'Solar Bears',    color: '#f59e0b' },
    { name: 'Neon Wolves',    color: '#10b981' },
    { name: 'Iron Tigers',    color: '#ef4444' },
    { name: 'Storm Eagles',   color: '#3b82f6' },
    { name: 'Pixel Panthers', color: '#8b5cf6' },
  ]

  const teams = []
  for (const def of teamDefs) {
    const team = await prisma.team.upsert({
      where: { name: def.name },
      update: {},
      create: { ...def, score: 0 },
    })
    teams.push(team)
    console.log(`[seed] team: ${team.name}`)
  }

  // ── Games ─────────────────────────────────────────────
  const gameDefs = [
    { name: 'Football Round 1', status: 'FINISHED' },
    { name: 'Basketball Match', status: 'FINISHED' },
    { name: 'Relay Race',       status: 'ACTIVE'   },
    { name: 'Tug of War',       status: 'PENDING'  },
  ]

  const games = []
  for (const def of gameDefs) {
    const existing = await prisma.game.findFirst({
      where: { eventId: event.id, name: def.name },
    })
    const game = existing
      ? existing
      : await prisma.game.create({
          data: { ...def, eventId: event.id },
        })
    games.push(game)
    console.log(`[seed] game: "${game.name}" (${game.status})`)
  }

  // ── Scores (for finished/active games) ───────────────
  const pointsTable = [
    [30, 20, 25, 15, 10, 5],   // Football Round 1
    [25, 30, 10, 20, 15, 5],   // Basketball Match
    [20, 10, 30, 15, 25, 5],   // Relay Race (active)
  ]

  for (let g = 0; g < 3; g++) {
    for (let t = 0; t < teams.length; t++) {
      await prisma.score.upsert({
        where: { teamId_gameId: { teamId: teams[t].id, gameId: games[g].id } },
        update: { points: pointsTable[g][t] },
        create: { teamId: teams[t].id, gameId: games[g].id, points: pointsTable[g][t] },
      })
    }
  }
  console.log('[seed] scores upserted')

  // ── Sync Team.score from Score totals ─────────────────
  const teamTotals = {}
  for (const team of teams) {
    const result = await prisma.score.aggregate({
      where: { teamId: team.id },
      _sum: { points: true },
    })
    const total = result._sum.points ?? 0
    await prisma.team.update({
      where: { id: team.id },
      data: { score: total },
    })
    teamTotals[team.id] = total
    console.log(`[seed] team total: ${team.name} = ${total}`)
  }

  // ── Score history (audit trail for seeded scores) ─────
  // Only insert if no seed history exists yet
  const existingHistory = await prisma.scoreHistory.findFirst({
    where: { source: 'SEED' },
  })
  if (!existingHistory) {
    for (let g = 0; g < 3; g++) {
      for (let t = 0; t < teams.length; t++) {
        const pts = pointsTable[g][t]
        await prisma.scoreHistory.create({
          data: {
            teamId:       teams[t].id,
            gameId:       games[g].id,
            delta:        pts,
            pointsBefore: 0,
            pointsAfter:  pts,
            source:       'SEED',
            reason:       `Seeded score for ${games[g].name}`,
          },
        })
      }
    }
    console.log('[seed] score history created')
  } else {
    console.log('[seed] score history already exists — skipped')
  }

  console.log('[seed] done ✓')
}

main()
  .catch((e) => { console.error('[seed] error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
