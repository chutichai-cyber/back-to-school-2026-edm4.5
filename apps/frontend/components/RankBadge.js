const MEDAL_IMG = { 1: '/assets/1.png', 2: '/assets/2.png', 3: '/assets/3.png' }

export default function RankBadge({ rank, showMedal = true }) {
  const medalSrc = showMedal ? MEDAL_IMG[rank] : null

  if (medalSrc) {
    return (
      <img
        src={medalSrc}
        alt={`rank ${rank}`}
        className="w-12 h-12 flex-shrink-0 object-contain"
      />
    )
  }

  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-700/80 border border-slate-600/60">
      <span className="font-kanit font-bold text-slate-400 leading-none text-2xl">
        {rank}
      </span>
    </div>
  )
}
