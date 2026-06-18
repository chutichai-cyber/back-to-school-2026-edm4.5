'use client'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import Modal from './Modal.js'

const STATUSES = ['PENDING', 'ACTIVE', 'FINISHED']

const STATUS_STYLES = {
  PENDING:  'bg-slate-600/50 text-slate-300',
  ACTIVE:   'bg-emerald-700/50 text-emerald-300',
  FINISHED: 'bg-indigo-700/50 text-indigo-300',
}

function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full tracking-wide shrink-0 ${STATUS_STYLES[status] ?? STATUS_STYLES.PENDING}`}>
      {status}
    </span>
  )
}

function StatusPicker({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            value === s
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-700/60 text-slate-400 hover:bg-slate-600'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

export default function GamesTab({ teams, event, showToast }) {
  const [games, setGames]     = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding]   = useState(false)
  const [addForm, setAddForm] = useState({ name: '', status: 'PENDING' })
  const [editing, setEditing]   = useState(null)   // { id, name, status }
  const [deleting, setDeleting] = useState(null)   // game object
  const [expanded, setExpanded] = useState(null)   // gameId

  // scores[gameId] = { loading, pts: { [teamId]: string } }
  const [scoreMap, setScoreMap] = useState({})
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    if (!event?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    api.games.list({ eventId: event.id })
      .then(setGames)
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [event?.id])  // eslint-disable-line react-hooks/exhaustive-deps

  /* ── CRUD ─────────────────────────────────────────── */

  async function handleCreate(e) {
    e.preventDefault()
    const name = addForm.name.trim()
    if (!name || !event) return

    const tempId = -(Date.now())
    const temp = { id: tempId, name, status: addForm.status, eventId: event.id }
    setGames((prev) => [temp, ...prev])
    setAdding(false)
    setAddForm({ name: '', status: 'PENDING' })

    try {
      const created = await api.games.create({ name, status: addForm.status, eventId: event.id })
      setGames((prev) => prev.map((g) => (g.id === tempId ? created : g)))
      showToast(`"${created.name}" created`, 'success')
    } catch (err) {
      setGames((prev) => prev.filter((g) => g.id !== tempId))
      showToast(err.message, 'error')
    }
  }

  async function handleUpdate(e) {
    e.preventDefault()
    const name = editing?.name.trim()
    if (!name) return

    const original = games.find((g) => g.id === editing.id)
    const patch = { name, status: editing.status }
    setGames((prev) => prev.map((g) => (g.id === editing.id ? { ...g, ...patch } : g)))
    setEditing(null)

    try {
      const updated = await api.games.update(editing.id, patch)
      setGames((prev) => prev.map((g) => (g.id === updated.id ? { ...g, ...updated } : g)))
      showToast(`"${updated.name}" updated`, 'success')
    } catch (err) {
      setGames((prev) => prev.map((g) => (g.id === original.id ? original : g)))
      showToast(err.message, 'error')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    const removed = deleting
    setGames((prev) => prev.filter((g) => g.id !== removed.id))
    if (expanded === removed.id) setExpanded(null)
    setDeleting(null)

    try {
      await api.games.delete(removed.id)
      showToast(`"${removed.name}" deleted`, 'success')
    } catch (err) {
      setGames((prev) => [removed, ...prev])
      showToast(err.message, 'error')
    }
  }

  /* ── Score editing ───────────────────────────────── */

  async function toggleScores(gameId) {
    if (expanded === gameId) { setExpanded(null); return }
    setExpanded(gameId)
    if (scoreMap[gameId]) return   // already loaded

    setScoreMap((prev) => ({ ...prev, [gameId]: { loading: true, pts: {} } }))
    try {
      const rows = await api.scores.list({ gameId })
      const pts = {}
      for (const s of rows) pts[s.teamId] = String(s.points)
      setScoreMap((prev) => ({ ...prev, [gameId]: { loading: false, pts } }))
    } catch (err) {
      showToast(err.message, 'error')
      setScoreMap((prev) => ({ ...prev, [gameId]: { loading: false, pts: {} } }))
    }
  }

  function setPts(gameId, teamId, value) {
    setScoreMap((prev) => ({
      ...prev,
      [gameId]: {
        ...prev[gameId],
        pts: { ...prev[gameId]?.pts, [teamId]: value },
      },
    }))
  }

  async function saveScores(gameId) {
    const pts = scoreMap[gameId]?.pts ?? {}
    setSaving(true)
    let failed = 0
    try {
      await Promise.all(
        teams.map(async (team) => {
          const v = Number(pts[team.id] ?? 0)
          const points = isNaN(v) ? 0 : Math.max(0, v)
          try {
            await api.scores.upsert({ teamId: team.id, gameId, points })
          } catch {
            failed++
          }
        })
      )
      if (failed === 0) showToast('Scores saved', 'success')
      else showToast(`${teams.length - failed} saved, ${failed} failed`, 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ── Render ──────────────────────────────────────── */

  if (loading) {
    return <p className="text-slate-500 text-sm text-center py-10">Loading games…</p>
  }

  return (
    <div className="space-y-4">

      {/* ── Header bar ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {games.length} game{games.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => { setAdding((v) => !v); setEditing(null) }}
          className="text-xs px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-500 text-indigo-100 rounded-lg font-semibold transition-colors"
        >
          {adding ? '✕ Cancel' : '+ Add Game'}
        </button>
      </div>

      {/* ── Add form ─────────────────────────────────────── */}
      {adding && (
        <section className="bg-slate-800/70 ring-1 ring-indigo-500/30 rounded-2xl p-5">
          <form onSubmit={handleCreate} className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">New Game</p>
            <input
              value={addForm.name}
              onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Game name…"
              className="admin-input w-full text-sm"
              required
              maxLength={80}
              autoFocus
            />
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Status</p>
              <StatusPicker
                value={addForm.status}
                onChange={(s) => setAddForm((p) => ({ ...p, status: s }))}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-sm transition-colors"
            >
              Create Game
            </button>
          </form>
        </section>
      )}

      {/* ── Game list ────────────────────────────────────── */}
      {games.length === 0 && !adding && (
        <p className="text-slate-500 text-sm text-center py-10">No games yet.</p>
      )}

      <div className="space-y-3">
        {games.map((game) => (
          <section
            key={game.id}
            className="bg-slate-800/70 ring-1 ring-slate-700/50 rounded-2xl overflow-hidden"
          >
            {editing?.id === game.id ? (
              /* ── Edit form ── */
              <form onSubmit={handleUpdate} className="p-4 space-y-3">
                <input
                  value={editing.name}
                  onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                  className="admin-input w-full text-sm"
                  required
                  maxLength={80}
                  autoFocus
                />
                <StatusPicker
                  value={editing.status}
                  onChange={(s) => setEditing((p) => ({ ...p, status: s }))}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded-lg text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* ── Game header row ── */}
                <div className="flex items-center gap-2 px-4 py-3 flex-wrap">
                  <span className="flex-1 font-semibold text-sm truncate min-w-0">{game.name}</span>
                  <StatusBadge status={game.status} />
                  <button
                    onClick={() => {
                      setEditing({ id: game.id, name: game.name, status: game.status })
                      setAdding(false)
                    }}
                    className="text-xs px-2.5 py-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleting(game)}
                    className="text-xs px-2.5 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => toggleScores(game.id)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                      expanded === game.id
                        ? 'bg-slate-600/60 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                    }`}
                  >
                    Scores {expanded === game.id ? '▲' : '▼'}
                  </button>
                </div>

                {/* ── Score editor ── */}
                {expanded === game.id && (
                  <div className="border-t border-slate-700/50 px-4 py-4">
                    {scoreMap[game.id]?.loading ? (
                      <p className="text-slate-500 text-xs text-center py-4">Loading…</p>
                    ) : teams.length === 0 ? (
                      <p className="text-slate-500 text-xs text-center py-4">No teams yet.</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          {teams.map((team) => (
                            <div key={team.id} className="flex items-center gap-3">
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: team.color }}
                              />
                              <span className="flex-1 text-sm font-medium truncate min-w-0">
                                {team.name}
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={scoreMap[game.id]?.pts?.[team.id] ?? '0'}
                                onChange={(e) => setPts(game.id, team.id, e.target.value)}
                                className="admin-input w-20 text-sm text-right tabular-nums shrink-0"
                              />
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => saveScores(game.id)}
                          disabled={saving}
                          className="w-full py-2 bg-emerald-700/80 hover:bg-emerald-600 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors"
                        >
                          {saving ? 'Saving…' : 'Save Scores'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        ))}
      </div>

      {/* ── Delete confirm ───────────────────────────────── */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Game" size="sm">
        <p className="text-sm text-slate-300 mb-5">
          Delete{' '}
          <span className="font-bold text-white">"{deleting?.name}"</span>? All scores for this
          game will be removed. This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="flex-1 py-2 bg-red-700 hover:bg-red-600 rounded-xl text-sm font-semibold transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => setDeleting(null)}
            className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  )
}
