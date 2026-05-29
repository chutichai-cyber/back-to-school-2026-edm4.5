'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ScoreBoard from '../../components/ScoreBoard'
import Celebration from '../../components/Celebration'
import { useScoreboard } from '../../lib/useScoreboard'

const TEAMS_PER_PAGE = 8
const PAGE_DURATION = 60_000

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
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-5 text-center px-4">
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

/* ── Page indicator (dots + progress bar) ────────────── */
function PageIndicator({ page, totalPages, onPageChange }) {
  return (
    <div className="page-indicator">
      <div className="page-dots">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={`page-dot${i === page ? ' page-dot-active' : ''}`}
            onClick={() => onPageChange(i)}
            aria-label={`หน้า ${i + 1}`}
            aria-current={i === page ? 'true' : undefined}
          />
        ))}
      </div>
      <div className="page-progress">
        <div key={page} className="page-progress-bar" style={{ '--duration': `${PAGE_DURATION}ms` }} />
      </div>
    </div>
  )
}

/* ── Page ────────────────────────────────────────────── */
export default function DisplayPage() {
  const [mock, setMock] = useState(false)
  const [page, setPage] = useState(0)
  const [resetKey, setResetKey] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Parse ?mock=1 from URL — safe in useEffect (client only)
    setMock(new URLSearchParams(window.location.search).get('mock') === '1')

    // Kiosk mode: hide cursor and disable text selection
    document.body.classList.add('kiosk')
    return () => document.body.classList.remove('kiosk')
  }, [])

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    setIsMobile(mql.matches)
    const onChange = (e) => setIsMobile(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  const { teams, event, connected, reconnecting } = useScoreboard({ mock })

  const totalPages = Math.max(1, Math.ceil(teams.length / TEAMS_PER_PAGE))
  const visibleTeams = teams.slice(page * TEAMS_PER_PAGE, (page + 1) * TEAMS_PER_PAGE)

  // Mobile: show all teams (scrollable); Desktop: paginate
  const displayTeams = isMobile ? teams : visibleTeams
  const showPagination = !isMobile && totalPages > 1

  // Clamp current page if teams are removed
  useEffect(() => {
    setPage(p => Math.min(p, totalPages - 1))
  }, [totalPages])

  // Manual navigation — resets auto-advance timer via resetKey
  const goToPage = useCallback((newPage) => {
    setPage(newPage)
    setResetKey(k => k + 1)
  }, [])

  // Auto-advance to next page (resetKey resets timer on manual navigation)
  useEffect(() => {
    if (totalPages <= 1) return
    const id = setInterval(() => setPage(p => (p + 1) % totalPages), PAGE_DURATION)
    return () => clearInterval(id)
  }, [totalPages, resetKey])

  // Arrow key navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goToPage((page + 1) % totalPages)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPage((page - 1 + totalPages) % totalPages)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [page, totalPages, goToPage])

  return (
    <div className="display-root">
      {/* Stadium atmosphere layer */}
      <div className="display-bg" aria-hidden="true" />
      <Celebration />

      {/* ── Header ── */}
      <header className="display-header">
        <CornerDecor position="left" />

        <div className="flex items-center justify-center">
          <img
            src="/assets/logo.png"
            alt="Event logo"
            className="display-logo"
          />
        </div>

        <CornerDecor position="right" />
        <LivePill connected={connected} reconnecting={reconnecting} />
      </header>

      {/* ── Scoreboard ── */}
      <main className="display-content gpu contain-layout">
        <div className="scoreboard-inner">
          {teams.length > 0 ? (
            <>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isMobile ? 'all' : page}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className={isMobile ? undefined : 'flex-1'}
                >
                  <ScoreBoard teams={displayTeams} />
                </motion.div>
              </AnimatePresence>

              {showPagination && (
                <PageIndicator page={page} totalPages={totalPages} onPageChange={goToPage} />
              )}
            </>
          ) : (
            <EmptyState connected={connected} />
          )}
        </div>
      </main>
    </div>
  )
}
