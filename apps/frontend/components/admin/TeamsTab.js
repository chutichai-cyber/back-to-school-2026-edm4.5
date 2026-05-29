'use client'
import { useState } from 'react'
import { TEAM_COLORS } from '@scoreboard/shared'
import { api } from '../../lib/api.js'
import Modal from './Modal.js'

const byName = (teams) => [...teams].sort((a, b) => a.name.localeCompare(b.name))

function ColorDots({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {TEAM_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="w-6 h-6 rounded-full transition-transform hover:scale-110 active:scale-95 shrink-0"
          style={{
            backgroundColor: c,
            outline: value === c ? '3px solid white' : '3px solid transparent',
            outlineOffset: '2px',
          }}
          aria-label={`Color ${c}`}
        />
      ))}
    </div>
  )
}

export default function TeamsTab({ teams, setTeams, showToast }) {
  const [adding, setAdding]    = useState(false)
  const [addForm, setAddForm]  = useState({ name: '', color: TEAM_COLORS[0] })
  const [editing, setEditing]  = useState(null)   // { id, name, color }
  const [deleting, setDeleting] = useState(null)  // team object

  async function handleCreate(e) {
    e.preventDefault()
    const name = addForm.name.trim()
    if (!name) return

    const tempId = -(Date.now())
    const temp = { id: tempId, name, color: addForm.color, score: 0 }
    setTeams((prev) => byName([...prev, temp]))
    setAdding(false)
    setAddForm({ name: '', color: TEAM_COLORS[0] })

    try {
      const created = await api.teams.create({ name, color: addForm.color })
      setTeams((prev) => prev.map((t) => (t.id === tempId ? created : t)))
      showToast(`"${created.name}" created`, 'success')
    } catch (err) {
      setTeams((prev) => prev.filter((t) => t.id !== tempId))
      showToast(err.message, 'error')
    }
  }

  async function handleUpdate(e) {
    e.preventDefault()
    const name = editing?.name.trim()
    if (!name) return

    const original = teams.find((t) => t.id === editing.id)
    const patch = { name, color: editing.color }
    setTeams((prev) => prev.map((t) => (t.id === editing.id ? { ...t, ...patch } : t)))
    setEditing(null)

    try {
      const updated = await api.teams.update(editing.id, patch)
      setTeams((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)))
      showToast(`"${updated.name}" updated`, 'success')
    } catch (err) {
      setTeams((prev) => prev.map((t) => (t.id === original.id ? original : t)))
      showToast(err.message, 'error')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    const removed = deleting
    setTeams((prev) => prev.filter((t) => t.id !== removed.id))
    setDeleting(null)

    try {
      await api.teams.delete(removed.id)
      showToast(`"${removed.name}" deleted`, 'success')
    } catch (err) {
      setTeams((prev) => byName([...prev, removed]))
      showToast(err.message, 'error')
    }
  }

  const sorted = byName(teams)

  return (
    <div className="space-y-4">

      {/* ── Header bar ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {sorted.length} team{sorted.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => { setAdding((v) => !v); setEditing(null) }}
          className="text-xs px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-500 text-indigo-100 rounded-lg font-semibold transition-colors"
        >
          {adding ? '✕ Cancel' : '+ Add Team'}
        </button>
      </div>

      {/* ── Add form ─────────────────────────────────────── */}
      {adding && (
        <section className="bg-slate-800/70 ring-1 ring-indigo-500/30 rounded-2xl p-5">
          <form onSubmit={handleCreate} className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">New Team</p>
            <input
              value={addForm.name}
              onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Team name…"
              className="admin-input w-full text-sm"
              required
              maxLength={40}
              autoFocus
            />
            <div>
              <p className="text-xs text-slate-500 mb-2">Color</p>
              <ColorDots value={addForm.color} onChange={(c) => setAddForm((p) => ({ ...p, color: c }))} />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <div
                className="px-3 py-1 rounded-lg text-xs font-black text-white shrink-0"
                style={{ backgroundColor: addForm.color }}
              >
                {addForm.name || 'Preview'}
              </div>
              <button
                type="submit"
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-sm transition-colors"
              >
                Create Team
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Team list ────────────────────────────────────── */}
      <section className="bg-slate-800/70 ring-1 ring-slate-700/50 rounded-2xl overflow-hidden">
        {sorted.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No teams yet.</p>
        ) : (
          <ul className="divide-y divide-slate-700/40">
            {sorted.map((team) =>
              editing?.id === team.id ? (
                /* ── Edit row ── */
                <li key={team.id} className="p-3 space-y-2.5">
                  <form onSubmit={handleUpdate} className="space-y-2.5">
                    <input
                      value={editing.name}
                      onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                      className="admin-input w-full text-sm"
                      required
                      maxLength={40}
                      autoFocus
                    />
                    <ColorDots
                      value={editing.color}
                      onChange={(c) => setEditing((p) => ({ ...p, color: c }))}
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
                </li>
              ) : (
                /* ── Display row ── */
                <li
                  key={team.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderLeft: `3px solid ${team.color}` }}
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="flex-1 font-semibold text-sm truncate">{team.name}</span>
                  <span className="text-xs tabular-nums font-bold text-slate-400">
                    {team.score} pts
                  </span>
                  <button
                    onClick={() => {
                      setEditing({ id: team.id, name: team.name, color: team.color })
                      setAdding(false)
                    }}
                    className="text-xs px-2.5 py-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors shrink-0"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleting(team)}
                    className="text-xs px-2.5 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                  >
                    Delete
                  </button>
                </li>
              )
            )}
          </ul>
        )}
      </section>

      {/* ── Delete confirm ───────────────────────────────── */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Team" size="sm">
        <p className="text-sm text-slate-300 mb-5">
          Delete{' '}
          <span className="font-bold text-white">"{deleting?.name}"</span>? This removes all
          scores and history for this team and cannot be undone.
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
