'use client'

import { useState } from 'react'
import { useScoreboard } from '../../lib/useScoreboard'
import { logout } from '../../lib/auth'
import ScoresTab from '../../components/admin/ScoresTab'
import TeamsTab  from '../../components/admin/TeamsTab'
import GamesTab  from '../../components/admin/GamesTab'
import { useToast, ToastContainer } from '../../components/admin/Toast'

const TABS = [
  { id: 'scores', label: 'Live Scores' },
  { id: 'teams',  label: 'Teams' },
  { id: 'games',  label: 'Games' },
]

function ConnectionBadge({ connected, reconnecting }) {
  const label  = reconnecting ? 'Reconnecting' : connected ? 'Live' : 'Offline'
  const dotCls = reconnecting
    ? 'bg-amber-400 animate-pulse'
    : connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
  const wrapCls = reconnecting
    ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25'
    : connected
      ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25'
      : 'bg-slate-600/30 text-slate-500 ring-1 ring-slate-600/30'

  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${wrapCls}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotCls}`} />
      {label}
    </div>
  )
}

export default function AdminPage() {
  const { teams, setTeams, event, connected, reconnecting, lastChangedTeamId, emit } =
    useScoreboard({ mock: false })
  const [activeTab, setActiveTab] = useState('scores')
  const { toasts, toast } = useToast()

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-24">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <h1 className="text-2xl font-black text-amber-400 tracking-tight">Admin Panel</h1>
          <div className="flex items-center gap-2.5">
            <ConnectionBadge connected={connected} reconnecting={reconnecting} />
            <a
              href="/display"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-white underline underline-offset-2 shrink-0"
            >
              Display ↗
            </a>
            <button
              onClick={logout}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors shrink-0"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* ── Tab navigation ── */}
        <div className="flex bg-slate-800/60 ring-1 ring-slate-700/50 rounded-xl p-1 mb-5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        {activeTab === 'scores' && (
          <ScoresTab
            teams={teams}
            event={event}
            connected={connected}
            emit={emit}
            lastChangedTeamId={lastChangedTeamId}
          />
        )}
        {activeTab === 'teams' && (
          <TeamsTab
            teams={teams}
            setTeams={setTeams}
            showToast={toast}
          />
        )}
        {activeTab === 'games' && (
          <GamesTab
            teams={teams}
            event={event}
            showToast={toast}
          />
        )}

      </div>

      <ToastContainer toasts={toasts} />
    </div>
  )
}
