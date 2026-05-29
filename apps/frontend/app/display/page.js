'use client'

import { useEffect, useState } from 'react'
import ScoreBoard from '../../components/ScoreBoard'
import { useScoreboard } from '../../lib/useScoreboard'

/* ── Live / offline / reconnecting pill ─────────────── */
function LivePill({ connected, reconnecting }) {
  const label   = reconnecting ? 'RECONNECTING' : connected ? 'LIVE' : 'OFFLINE'
  const dotCls  = reconnecting
    ? 'bg-amber-400 animate-pulse'
    : connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
  const wrapCls = reconnecting
    ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
    : connected
      ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
      : 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30'

  return (
    <div
      className={`absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase ${wrapCls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
      {label}
    </div>
  )
}

/* ── Corner decoration (pure CSS, no images) ─────────── */
function CornerDecor({ position }) {
  const isLeft = position === 'left'
  return (
    <div
      className={`hidden md:flex absolute top-1/2 -translate-y-1/2 items-center gap-1.5 opacity-25 ${
        isLeft ? 'left-4' : 'right-4 flex-row-reverse'
      }`}
      aria-hidden="true"
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-full bg-amber-400"
          style={{ width: 6 + i * 3, height: 6 + i * 3, opacity: 0.4 + i * 0.2 }}
        />
      ))}
    </div>
  )
}

/* ── Empty state ─────────────────────────────────────── */
function EmptyState({ connected }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-4">
      <span className="text-6xl" role="img" aria-label="trophy">🏆</span>
      <p className="text-2xl font-bold text-slate-400">
        {connected ? 'No teams yet' : 'Connecting to server…'}
      </p>
      <p className="text-sm text-slate-600">
        {connected ? 'Add teams from the admin panel' : 'Make sure the backend is running'}
      </p>
    </div>
  )
}

/* ── Page ────────────────────────────────────────────── */
export default function DisplayPage() {
  const [mock, setMock] = useState(false)

  useEffect(() => {
    // Parse ?mock=1 from URL — safe in useEffect (client only)
    setMock(new URLSearchParams(window.location.search).get('mock') === '1')

    // Kiosk mode: hide cursor and disable text selection
    document.body.classList.add('kiosk')
    return () => document.body.classList.remove('kiosk')
  }, [])

  const { teams, event, connected, reconnecting } = useScoreboard({ mock })

  return (
    <div className="display-root">
      {/* Stadium atmosphere layer */}
      <div className="display-bg" aria-hidden="true" />

      {/* ── Header ── */}
      <header className="display-header">
        <CornerDecor position="left" />

        <div className="text-center">
          <p className="display-eyebrow">★ School Event ★</p>
          <h1 className="display-title">
            {event?.title ?? 'Back to School Sports Day'}
          </h1>
        </div>

        <CornerDecor position="right" />
        <LivePill connected={connected} reconnecting={reconnecting} />
      </header>

      {/* ── Scoreboard ── */}
      <main className="display-content gpu contain-layout">
        {teams.length > 0 ? (
          <ScoreBoard teams={teams} />
        ) : (
          <EmptyState connected={connected} />
        )}
      </main>
    </div>
  )
}
