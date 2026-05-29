import { Elysia } from 'elysia'
import prisma from '../lib/prisma.js'

const ADMIN_SELECT = {
  id: true,
  username: true,
  email: true,
  role: true,
  active: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
}

export const adminsRouter = new Elysia({ prefix: '/api/admins' })
  // ── List ──────────────────────────────────────────────
  .get('/', ({ query }) =>
    prisma.admin.findMany({
      where: {
        ...(query.role   ? { role:   query.role }            : {}),
        ...(query.active !== undefined
          ? { active: query.active === 'true' }
          : {}),
      },
      select: ADMIN_SELECT,
      orderBy: { createdAt: 'asc' },
    })
  )

  // ── Login — defined before /:id so it's not treated as an id param ──
  .post('/login', async ({ body, error }) => {
    const { username, password } = body ?? {}
    if (!username || !password)
      return error(400, { success: false, error: 'username and password are required' })

    const admin = await prisma.admin.findUnique({ where: { username } })
    if (!admin || !admin.active)
      return error(401, { success: false, error: 'Invalid credentials' })

    const valid = await Bun.password.verify(password, admin.passwordHash)
    if (!valid)
      return error(401, { success: false, error: 'Invalid credentials' })

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    })

    const { passwordHash: _ph, ...adminData } = admin
    return { success: true, admin: adminData }
  })

  // ── Get by ID ─────────────────────────────────────────
  .get('/:id', async ({ params, error }) => {
    const admin = await prisma.admin.findUnique({
      where: { id: Number(params.id) },
      select: ADMIN_SELECT,
    })
    if (!admin) return error(404, { success: false, error: 'Admin not found' })
    return admin
  })

  // ── Create ────────────────────────────────────────────
  .post('/', async ({ body, error }) => {
    const { username, email, password, role } = body ?? {}
    if (!username || !email || !password)
      return error(400, { success: false, error: 'username, email, and password are required' })
    if (password.length < 8)
      return error(422, { success: false, error: 'Password must be at least 8 characters' })

    const passwordHash = await Bun.password.hash(password)
    const admin = await prisma.admin.create({
      data: { username, email, passwordHash, ...(role ? { role } : {}) },
      select: ADMIN_SELECT,
    })
    return admin
  })

  // ── Update ────────────────────────────────────────────
  .patch('/:id', async ({ params, body, error }) => {
    const existing = await prisma.admin.findUnique({ where: { id: Number(params.id) } })
    if (!existing) return error(404, { success: false, error: 'Admin not found' })

    const { password, ...rest } = body ?? {}
    const data = { ...rest }
    if (password) {
      if (password.length < 8)
        return error(422, { success: false, error: 'Password must be at least 8 characters' })
      data.passwordHash = await Bun.password.hash(password)
    }

    const admin = await prisma.admin.update({
      where: { id: Number(params.id) },
      data,
      select: ADMIN_SELECT,
    })
    return admin
  })

  // ── Delete ────────────────────────────────────────────
  .delete('/:id', async ({ params, error }) => {
    const existing = await prisma.admin.findUnique({ where: { id: Number(params.id) } })
    if (!existing) return error(404, { success: false, error: 'Admin not found' })
    await prisma.admin.delete({ where: { id: Number(params.id) } })
    return { success: true }
  })
