'use client'

import { AnimatePresence } from 'framer-motion'
import ScoreRow from './ScoreRow'

export default function ScoreBoard({ teams }) {
  const allZero = teams.length > 0 && teams.every((t) => t.score === 0)

  return (
    <div className="flex flex-col gap-[clamp(0.4rem,0.8vh,0.75rem)] w-full">
      <AnimatePresence mode="popLayout" initial={false}>
        {teams.map((team, i) => (
          <ScoreRow
            key={team.id}
            team={team}
            rank={team.rank}
            position={i + 1}
            allZero={allZero}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
