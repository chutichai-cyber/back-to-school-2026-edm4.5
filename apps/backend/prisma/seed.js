import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('[seed] starting — full reset…')

  // ── Event ─────────────────────────────────────────────
  const event = await prisma.event.upsert({
    where: { id: 1 },
    update: {},
    create: { title: 'Back to School Sports Day', active: true },
  })
  console.log(`[seed] event: "${event.title}"`)

  // ── Admins ────────────────────────────────────────────
  // Upsert only — never delete existing admin accounts
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

  // ── Reset teams + games (scores / histories cascade-delete) ───────────────
  // Deleting teams cascades to Score and ScoreHistory rows.
  // Deleting games cascades to any remaining Score rows.
  await prisma.team.deleteMany()
  await prisma.game.deleteMany({ where: { eventId: event.id } })
  console.log('[seed] cleared: teams, games, scores, score histories')

  // ── Teams ─────────────────────────────────────────────
  const teamDefs = [
    { name: 'ป. 3/1', color: '#6366f1' },
    { name: 'ป. 3/2', color: '#f59e0b' },
    { name: 'ป. 3/3', color: '#10b981' },
    { name: 'ป. 3/4', color: '#ef4444' },
    { name: 'ป. 3/5', color: '#3b82f6' },
    { name: 'ป. 3/6', color: '#8b5cf6' },
    { name: 'ป. 3/7', color: '#ec4899' },
    { name: 'ป. 3/8', color: '#14b8a6' },
  ]
  await prisma.team.createMany({ data: teamDefs.map((d) => ({ ...d, score: 0 })) })
  console.log(`[seed] created ${teamDefs.length} teams`)

  // ── Game ──────────────────────────────────────────────
  await prisma.game.create({
    data: { name: 'กีฬาสี', status: 'ACTIVE', eventId: event.id },
  })
  console.log('[seed] game: "กีฬาสี"')

  console.log('[seed] done ✓')
}

main()
  .catch((e) => { console.error('[seed] error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
