import prisma from '../lib/prisma.js'
import { logger } from '../lib/logger.js'
import { SOCKET_EVENTS } from '@scoreboard/shared'
import {
  broadcastScoreChange,
  broadcastFullState,
} from '../lib/broadcaster.js'

// Wraps each handler in try/catch: one bad payload can't crash the loop.
function safe(socket, eventName, handler) {
  return async (...args) => {
    try {
      await handler(...args)
    } catch (err) {
      logger.error('socket handler error', {
        event:    eventName,
        socketId: socket.id,
        error:    err.message,
      })
      socket.emit('error', { event: eventName, message: 'Operation failed' })
    }
  }
}

export function registerSocketHandlers(io) {
  io.on('connection', async (socket) => {
    logger.info('socket connected', {
      id:        socket.id,
      transport: socket.conn.transport.name,
      ip:        socket.handshake.address,
    })

    // ── Push full state to the newly connected client ────────────────────────
    try {
      await broadcastFullState(socket)
    } catch (err) {
      logger.error('initial state push failed', { id: socket.id, error: err.message })
    }

    // ── STATE_REQUEST — client-initiated full sync (reconnect / tab focus) ───
    socket.on(
      SOCKET_EVENTS.STATE_REQUEST,
      safe(socket, SOCKET_EVENTS.STATE_REQUEST, async () => {
        await broadcastFullState(socket)
      })
    )

    // ── SCORE_UPDATE — delta-based score change ──────────────────────────────
    socket.on(
      SOCKET_EVENTS.SCORE_UPDATE,
      safe(socket, SOCKET_EVENTS.SCORE_UPDATE, async ({ teamId, delta, reason }) => {
        const team = await prisma.team.update({
          where: { id: teamId },
          data:  { score: { increment: delta } },
        })
        await prisma.scoreHistory.create({
          data: {
            teamId,
            delta,
            pointsBefore: team.score - delta,
            pointsAfter:  team.score,
            source:       'SOCKET',
            reason:       reason ?? null,
          },
        })
        await broadcastScoreChange(teamId)
      })
    )

    // ── SCORE_SET — set a team's score to an exact value ────────────────────
    socket.on(
      SOCKET_EVENTS.SCORE_SET,
      safe(socket, SOCKET_EVENTS.SCORE_SET, async ({ teamId, score, reason }) => {
        const before   = await prisma.team.findUnique({ where: { id: teamId } })
        const newScore = Number(score)
        await prisma.team.update({ where: { id: teamId }, data: { score: newScore } })
        await prisma.scoreHistory.create({
          data: {
            teamId,
            delta:        newScore - (before?.score ?? 0),
            pointsBefore: before?.score ?? 0,
            pointsAfter:  newScore,
            source:       'SOCKET',
            reason:       reason ?? null,
          },
        })
        await broadcastScoreChange(teamId)
      })
    )

    // ── SCORE_RESET — zero out all team scores ───────────────────────────────
    socket.on(
      SOCKET_EVENTS.SCORE_RESET,
      safe(socket, SOCKET_EVENTS.SCORE_RESET, async ({ reason } = {}) => {
        const teams = await prisma.team.findMany({ select: { id: true, score: true } })
        await prisma.team.updateMany({ data: { score: 0 } })
        const histories = teams
          .filter((t) => t.score !== 0)
          .map((t) => ({
            teamId:       t.id,
            delta:        -t.score,
            pointsBefore: t.score,
            pointsAfter:  0,
            source:       'SOCKET',
            reason:       reason ?? 'Score reset',
          }))
        if (histories.length) await prisma.scoreHistory.createMany({ data: histories })
        await broadcastFullState()
      })
    )

    // ── TEAM_ADD ─────────────────────────────────────────────────────────────
    socket.on(
      SOCKET_EVENTS.TEAM_ADD,
      safe(socket, SOCKET_EVENTS.TEAM_ADD, async ({ name, color }) => {
        await prisma.team.create({ data: { name, color: color || '#6366f1' } })
        await broadcastFullState()
      })
    )

    // ── TEAM_REMOVE ──────────────────────────────────────────────────────────
    socket.on(
      SOCKET_EVENTS.TEAM_REMOVE,
      safe(socket, SOCKET_EVENTS.TEAM_REMOVE, async ({ teamId }) => {
        await prisma.team.delete({ where: { id: teamId } })
        await broadcastFullState()
      })
    )

    // ── EVENT_UPDATE ─────────────────────────────────────────────────────────
    socket.on(
      SOCKET_EVENTS.EVENT_UPDATE,
      safe(socket, SOCKET_EVENTS.EVENT_UPDATE, async ({ eventId, title }) => {
        await prisma.event.update({ where: { id: eventId }, data: { title } })
        await broadcastFullState()
      })
    )

    socket.on('disconnect', (reason) => {
      logger.info('socket disconnected', { id: socket.id, reason })
    })

    socket.on('error', (err) => {
      logger.error('socket error', { id: socket.id, error: err.message })
    })
  })

  io.on('connect_error', (err) => {
    logger.error('socket.io connection error', { error: err.message })
  })
}
