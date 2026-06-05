import { getIO } from './io.js'
import prisma   from './prisma.js'

// ── In-process ranking cache ────────────────────────────────────────────────
// Stores [teamId, ...] sorted by score DESC from the last broadcast.
// Used to detect when the ranking ORDER changes, not just scores.
//
// Multi-replica note: this is per-process state. To scale horizontally,
// replace with a shared store and add @socket.io/redis-adapter.
let _prevOrder = []

// ── Helpers ─────────────────────────────────────────────────────────────────

// Dense ranking: tied scores share the same rank, next group increments by 1
// e.g. scores [1000, 200, 200, 150, 100, 100] → ranks [1, 2, 2, 3, 4, 4]
function addRanks(teams) {
  let rank = 1
  return teams.map((t, i, arr) => {
    if (i > 0 && arr[i - 1].score !== t.score) rank++
    return { ...t, rank }
  })
}

function orderChanged(teams) {
  if (_prevOrder.length !== teams.length) return true
  return teams.some((t, i) => t.id !== _prevOrder[i])
}

async function fetchState() {
  const [teams, event] = await Promise.all([
    prisma.team.findMany({ orderBy: [{ score: 'desc' }, { id: 'asc' }] }),
    prisma.event.findFirst({ where: { active: true } }),
  ])
  return { teams, event }
}

// Emit to a specific socket OR broadcast to all clients
function emitTo(target, eventName, data) {
  const io = getIO()
  if (!io) return
  ;(target ?? io).emit(eventName, data)
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Call after any score change (REST or socket).
 * Emits: score.updated → ranking.updated (if order changed) → scoreboard:state
 */
export async function broadcastScoreChange(teamId) {
  const io = getIO()
  if (!io) return

  const { teams, event } = await fetchState()
  const ranked  = addRanks(teams)
  const changed = ranked.find((t) => t.id === teamId)

  // Granular event for the specific team
  io.emit('score.updated', {
    teamId,
    team:     changed ?? null,
    score:    changed?.score ?? 0,
    rank:     changed?.rank  ?? -1,
    prevRank: (_prevOrder.indexOf(teamId) + 1) || -1,
  })

  // Ranking snapshot whenever scores change
  io.emit('ranking.updated', { teams: ranked })

  // Full state — includes event title, backward-compatible with old clients
  io.emit('scoreboard:state', { teams: ranked, event })

  _prevOrder = teams.map((t) => t.id)
}

/**
 * Call after a team's name or color changes.
 * Emits: team.updated → ranking.updated → scoreboard:state
 */
export async function broadcastTeamChange(teamId) {
  const io = getIO()
  if (!io) return

  const [team, { teams, event }] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamId } }),
    fetchState(),
  ])

  if (team) io.emit('team.updated', { team })

  const ranked = addRanks(teams)
  io.emit('ranking.updated', { teams: ranked })
  io.emit('scoreboard:state', { teams: ranked, event })

  _prevOrder = teams.map((t) => t.id)
}

/**
 * Call after a game's status or metadata changes.
 * Emits: game.updated
 */
export async function broadcastGameChange(gameId) {
  const io = getIO()
  if (!io) return

  const game = await prisma.game.findUnique({
    where:   { id: gameId },
    include: { event: { select: { id: true, title: true } } },
  })
  if (game) io.emit('game.updated', { game })
}

/**
 * Full state push. Used for:
 *   - New socket connection  (target = socket)
 *   - Score reset            (target = undefined → all)
 *   - Team add / remove      (target = undefined → all)
 *   - Event title change     (target = undefined → all)
 *   - STATE_REQUEST          (target = requesting socket)
 *
 * Emits: ranking.updated → scoreboard:state
 */
export async function broadcastFullState(target) {
  const io = getIO()
  if (!io) return

  const { teams, event } = await fetchState()
  const ranked = addRanks(teams)

  emitTo(target, 'ranking.updated', { teams: ranked })
  emitTo(target, 'scoreboard:state', { teams: ranked, event })

  if (!target) _prevOrder = teams.map((t) => t.id)
}
