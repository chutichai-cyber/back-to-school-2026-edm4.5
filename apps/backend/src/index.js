import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { createServer } from 'node:http'
import { Server as SocketIO } from 'socket.io'

import { requestLogger }  from './middleware/logger.js'
import { errorHandler }   from './middleware/error.js'
import { teamsRouter }        from './routes/teams.js'
import { eventsRouter }       from './routes/events.js'
import { gamesRouter }        from './routes/games.js'
import { scoresRouter }       from './routes/scores.js'
import { adminsRouter }       from './routes/admins.js'
import { scoreHistoryRouter } from './routes/score-history.js'
import { authRouter }         from './routes/auth.js'
import { registerSocketHandlers } from './socket/handlers.js'
import { logger }         from './lib/logger.js'
import { setIO }          from './lib/io.js'
import prisma             from './lib/prisma.js'

const PORT         = Number(process.env.PORT)         || 4000
const FRONTEND_URL = process.env.FRONTEND_URL          || 'http://localhost:3000'
const NODE_ENV     = process.env.NODE_ENV              || 'development'

// ── Elysia app ──────────────────────────────────────────
const elysia = new Elysia()
  .use(requestLogger)
  .use(errorHandler)
  .use(
    cors({
      origin: [FRONTEND_URL, /localhost:\d+/],
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  )
  // Health endpoint — no auth, no logging
  .get('/health', () => ({
    success: true,
    status: 'ok',
    env: NODE_ENV,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  }))
  .use(teamsRouter)
  .use(eventsRouter)
  .use(gamesRouter)
  .use(scoresRouter)
  .use(authRouter)
  .use(adminsRouter)
  .use(scoreHistoryRouter)

// ── Node HTTP bridge ────────────────────────────────────
// Socket.IO registers its own `request` and `upgrade` listeners on httpServer.
// Our callback is the first listener; we skip /socket.io/* paths so Socket.IO
// can handle them through its own listener added afterwards.
async function handleRequest(req, res) {
  try {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined

    const webRequest = new Request(
      new URL(req.url, `http://localhost:${PORT}`).href,
      {
        method: req.method,
        headers: Object.fromEntries(
          Object.entries(req.headers).filter(([, v]) => v != null)
        ),
        body: body?.length ? body : undefined,
      }
    )

    const response = await elysia.handle(webRequest)

    const headers = {}
    response.headers.forEach((v, k) => { headers[k] = v })

    res.writeHead(response.status, headers)
    res.end(Buffer.from(await response.arrayBuffer()))
  } catch (err) {
    logger.error('http bridge error', { error: err.message })
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
    }
    res.end(JSON.stringify({ success: false, error: 'Internal Server Error' }))
  }
}

const httpServer = createServer((req, res) => {
  if (req.url?.startsWith('/socket.io')) return
  handleRequest(req, res)
})

// ── Socket.IO ───────────────────────────────────────────
const io = new SocketIO(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
  pingTimeout: 20_000,
  pingInterval: 25_000,
})

setIO(io) // make io available to route handlers that broadcast
registerSocketHandlers(io)

// ── Start ───────────────────────────────────────────────
httpServer.listen(PORT, '0.0.0.0', () => {
  logger.info('server started', { port: PORT, env: NODE_ENV })
  logger.info('routes', {
    rest: ['/health', '/api/auth/login', '/api/teams', '/api/events', '/api/games', '/api/scores', '/api/admins', '/api/score-history'],
    ws: 'ws://0.0.0.0:' + PORT + '/socket.io',
  })
})

// ── Graceful shutdown ────────────────────────────────────
async function shutdown(signal) {
  logger.info('shutdown initiated', { signal })

  httpServer.close(async () => {
    io.close()
    await prisma.$disconnect()
    logger.info('shutdown complete')
    process.exit(0)
  })

  // Force-kill if graceful close takes more than 10 s
  setTimeout(() => {
    logger.error('shutdown timed out — forcing exit')
    process.exit(1)
  }, 10_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))

process.on('uncaughtException', (err) => {
  logger.error('uncaught exception', { error: err.message, stack: err.stack })
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  logger.error('unhandled rejection', { reason: String(reason) })
})
