'use client'

import { AnimatePresence } from 'framer-motion'
import ScoreRow from './ScoreRow'

export default function ScoreBoard({ teams }) {
  return (
    <div className="flex flex-col gap-[clamp(0.4rem,0.8vh,0.75rem)] w-full">
      {/*
        mode="popLayout" keeps the layout stable when items enter/exit.
        initial={false} skips entrance animation on the very first render
        so all rows appear instantly on page load, then animate on changes.
      */}
      <AnimatePresence mode="popLayout" initial={false}>
        {teams.map((team, index) => (
          <ScoreRow key={team.id} team={team} rank={index + 1} />
        ))}
      </AnimatePresence>
    </div>
  )
}
