const BADGE = {
  1: {
    gradient: 'from-yellow-400 via-amber-400 to-yellow-500',
    ring: 'ring-amber-300/40',
    shadow: '0 0 16px rgba(251,191,36,0.5)',
    icon: '🏆',
  },
  2: {
    gradient: 'from-slate-200 via-slate-300 to-slate-400',
    ring: 'ring-slate-300/30',
    shadow: '0 0 10px rgba(148,163,184,0.3)',
    icon: '🥈',
  },
  3: {
    gradient: 'from-amber-500 via-orange-500 to-amber-600',
    ring: 'ring-orange-400/30',
    shadow: '0 0 10px rgba(245,158,11,0.3)',
    icon: '🥉',
  },
}

export default function RankBadge({ rank }) {
  const badge = BADGE[rank]

  if (badge) {
    return (
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${badge.gradient} ring-2 ${badge.ring}`}
        style={{ boxShadow: badge.shadow }}
      >
        <span className="text-xl leading-none" role="img" aria-label={`rank ${rank}`}>
          {badge.icon}
        </span>
      </div>
    )
  }

  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-700/80 border border-slate-600/60">
      <span className="text-slate-400 font-black tabular-nums leading-none text-base">
        {rank}
      </span>
    </div>
  )
}
