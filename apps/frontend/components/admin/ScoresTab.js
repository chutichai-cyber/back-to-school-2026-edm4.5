'use client'
import { useEffect, useRef, useState } from 'react'
import { SOCKET_EVENTS } from '@scoreboard/shared'

function DeltaBtn({ label, onClick, variant = 'neutral' }) {
  const base =
    'w-9 h-9 rounded-lg text-sm font-black flex items-center justify-center transition-all active:scale-90 select-none'
  const styles = {
    add:     'bg-emerald-700/60 hover:bg-emerald-600 text-emerald-200',
    remove:  'bg-red-700/60 hover:bg-red-600 text-red-200',
    neutral: 'bg-slate-600/60 hover:bg-slate-500 text-slate-200',
  }
  return (
    <button className={`${base} ${styles[variant]}`} onClick={onClick} type="button">
      {label}
    </button>
  )
}

export default function ScoresTab({ teams, event, connected, emit, lastChangedTeamId }) {
  const [eventTitle, setEventTitle]     = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [setScoreFor, setSetScoreFor]   = useState(null)
  const setScoreRef = useRef('')

  useEffect(() => {
    if (!editingTitle) setEventTitle(event?.title ?? '')
  }, [event, editingTitle])

  const handleScoreDelta = (teamId, delta) =>
    emit(SOCKET_EVENTS.SCORE_UPDATE, { teamId, delta })

  const handleScoreSet = (teamId) => {
    const v = parseInt(setScoreRef.current, 10)
    if (!isNaN(v)) emit(SOCKET_EVENTS.SCORE_SET, { teamId, score: v })
    setSetScoreFor(null)
    setScoreRef.current = ''
  }

  const handleReset = () => {
    if (window.confirm('Reset ALL team scores to 0?'))
      emit(SOCKET_EVENTS.SCORE_RESET)
  }

  const handleTitleSave = () => {
    if (event && eventTitle.trim())
      emit(SOCKET_EVENTS.EVENT_UPDATE, { eventId: event.id, title: eventTitle.trim() })
    setEditingTitle(false)
  }

  const handleRemoveTeam = (teamId) => {
    if (window.confirm('Remove this team permanently?'))
      emit(SOCKET_EVENTS.TEAM_REMOVE, { teamId })
  }

  return (
    <div className="space-y-4">

      {/* ── Event title ────────────────────────────────── */}
      <section className="bg-slate-800/70 ring-1 ring-slate-700/50 rounded-2xl p-5">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Event Title</h2>
        {editingTitle ? (
          <div className="flex gap-2">
            <input
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              className="admin-input flex-1 text-sm"
              autoFocus
              placeholder="Event name…"
            />
            <button
              onClick={handleTitleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setEditingTitle(false)}
              className="px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold text-white truncate">
              {event?.title || <span className="text-slate-500 italic">No title set</span>}
            </span>
            <button
              onClick={() => setEditingTitle(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 flex-shrink-0"
            >
              Edit
            </button>
          </div>
        )}
      </section>

      {/* ── Live scores ─────────────────────────────────── */}
      <section className="bg-slate-800/70 ring-1 ring-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Scores</h2>
          <button
            onClick={handleReset}
            className="text-xs px-3 py-1.5 bg-red-700/60 hover:bg-red-600 text-red-200 rounded-lg font-semibold transition-colors"
          >
            Reset All
          </button>
        </div>

        <div className="space-y-2">
          {teams.map((team, index) => (
            <div key={team.id}>
              <div
                className={`flex items-center gap-2 sm:gap-3 py-2.5 px-3 rounded-xl transition-colors duration-300 ${
                  lastChangedTeamId === team.id
                    ? 'bg-indigo-500/20 ring-1 ring-indigo-400/40'
                    : 'bg-slate-700/40'
                }`}
                style={{ borderLeft: `3px solid ${team.color}` }}
              >
                <span className="text-xs font-bold text-slate-500 w-4 text-center tabular-nums shrink-0">
                  {index + 1}
                </span>
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
                <span className="flex-1 font-semibold text-sm truncate min-w-0">{team.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <DeltaBtn label="−10" onClick={() => handleScoreDelta(team.id, -10)} variant="remove" />
                  <DeltaBtn label="−1"  onClick={() => handleScoreDelta(team.id, -1)}  variant="remove" />
                  <button
                    onClick={() => setSetScoreFor((prev) => (prev === team.id ? null : team.id))}
                    className="min-w-[3rem] px-2 h-9 rounded-lg tabular-nums font-black text-sm transition-all active:scale-90"
                    style={{ color: team.color, background: `${team.color}18` }}
                  >
                    {team.score}
                  </button>
                  <DeltaBtn label="+1"  onClick={() => handleScoreDelta(team.id, 1)}   variant="add" />
                  <DeltaBtn label="+10" onClick={() => handleScoreDelta(team.id, 10)}  variant="add" />
                </div>
                <button
                  onClick={() => handleRemoveTeam(team.id)}
                  className="text-slate-600 hover:text-red-400 text-lg leading-none transition-colors shrink-0"
                  title="Remove team"
                >
                  ×
                </button>
              </div>

              {setScoreFor === team.id && (
                <div className="flex gap-2 mt-1 px-3">
                  <input
                    type="number"
                    defaultValue={team.score}
                    onChange={(e) => { setScoreRef.current = e.target.value }}
                    onKeyDown={(e) => e.key === 'Enter' && handleScoreSet(team.id)}
                    className="admin-input flex-1 text-sm tabular-nums"
                    autoFocus
                    placeholder="Set exact score…"
                  />
                  <button
                    onClick={() => handleScoreSet(team.id)}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Set
                  </button>
                </div>
              )}
            </div>
          ))}

          {teams.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-6">
              {connected ? 'No teams — add teams in the Teams tab.' : 'Connecting to server…'}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
