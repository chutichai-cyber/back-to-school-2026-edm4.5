import { Elysia } from 'elysia'
import { timingSafeEqual } from 'crypto'

const ADMIN_USERNAME  = process.env.ADMIN_USERNAME        || 'admin'
const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD        || 'changeme'
const JWT_SECRET      = process.env.JWT_SECRET            || 'dev-secret-change-in-production'
const TOKEN_EXPIRY_H  = Number(process.env.TOKEN_EXPIRY_HOURS) || 8

// base64url-encoded static JWT header
const HEADER_B64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')

async function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const data = `${HEADER_B64}.${body}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const sig    = Buffer.from(sigBuf).toString('base64url')
  return `${data}.${sig}`
}

// constant-time string comparison to prevent timing attacks
function safeEqual(a, b) {
  const aBuf = Buffer.from(String(a))
  const bBuf = Buffer.from(String(b))
  // Pad shorter buffer so lengths match (still returns false if lengths differ)
  const len   = Math.max(aBuf.length, bBuf.length)
  const aPad  = Buffer.concat([aBuf, Buffer.alloc(len - aBuf.length)])
  const bPad  = Buffer.concat([bBuf, Buffer.alloc(len - bBuf.length)])
  return timingSafeEqual(aPad, bPad) && aBuf.length === bBuf.length
}

export const authRouter = new Elysia({ prefix: '/api/auth' })
  .post('/login', async ({ body, error }) => {
    const { username = '', password = '' } = body ?? {}

    if (!username || !password)
      return error(400, { success: false, error: 'username and password are required' })

    const validUser = safeEqual(username, ADMIN_USERNAME)
    const validPass = safeEqual(password, ADMIN_PASSWORD)

    if (!validUser || !validPass)
      return error(401, { success: false, error: 'Invalid credentials' })

    const now   = Math.floor(Date.now() / 1000)
    const token = await signToken({
      sub: 'admin',
      iat: now,
      exp: now + TOKEN_EXPIRY_H * 3600,
    })

    return { success: true, token, expiresIn: TOKEN_EXPIRY_H * 3600 }
  })
