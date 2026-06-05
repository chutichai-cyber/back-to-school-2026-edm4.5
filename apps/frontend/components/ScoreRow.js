'use client'

import { motion } from 'framer-motion'
import RankBadge from './RankBadge'
import ScoreNumber from './ScoreNumber'

const ROW_VARIANTS = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
}

function rowStyle(rank, color) {
  if (rank === 1) return {
    background:  `linear-gradient(135deg, ${color}44 0%, ${color}1a 100%)`,
    borderLeft:  `5px solid ${color}`,
    boxShadow:   `0 4px 32px ${color}50, inset 0 1px 0 rgba(255,255,255,0.07)`,
  }
  if (rank === 2) return {
    background:  `linear-gradient(135deg, ${color}2e 0%, ${color}10 100%)`,
    borderLeft:  `5px solid ${color}cc`,
    boxShadow:   `0 3px 22px ${color}35`,
  }
  if (rank === 3) return {
    background:  `linear-gradient(135deg, ${color}1c 0%, ${color}08 100%)`,
    borderLeft:  `5px solid ${color}99`,
    boxShadow:   `0 2px 14px ${color}22`,
  }
  return {
    background:  'rgba(13, 20, 40, 0.38)',
    borderLeft:  `4px solid ${color}55`,
    boxShadow:   '0 1px 6px rgba(0,0,0,0.18)',
  }
}

export default function ScoreRow({ team, rank, position, allZero }) {
  // When all scores are zero: show sequential position numbers, no medal/highlight styling
  const displayRank = allZero ? position : rank
  const styleRank   = allZero ? null : rank

  return (
    <motion.div
      layout
      variants={ROW_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        layout: { type: 'spring', stiffness: 320, damping: 32, mass: 1 },
        opacity: { duration: 0.22 },
        x: { duration: 0.25, ease: 'easeOut' },
      }}
      className="flex items-center gap-4 rounded-2xl will-change-transform overflow-hidden"
      style={{
        padding: 'clamp(0.65rem, 1.2vh, 1rem) clamp(0.9rem, 1.5vw, 1.25rem)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        ...rowStyle(styleRank, team.color),
      }}
    >
      <RankBadge rank={displayRank} showMedal={!allZero} />

      <span
        className="flex-1 text-white font-kanit font-semibold truncate leading-tight"
        style={{
          fontSize: !allZero && rank === 1
            ? 'clamp(1.3rem, 2.6vw, 2rem)'
            : !allZero && rank === 2
            ? 'clamp(1.15rem, 2.2vw, 1.7rem)'
            : !allZero && rank === 3
            ? 'clamp(1.05rem, 2.0vw, 1.5rem)'
            : 'clamp(0.9rem, 1.6vw, 1.25rem)',
        }}
      >
        {team.name}
      </span>

      <ScoreNumber
        value={team.score}
        color={team.color}
        className="leading-none"
        style={{ fontSize: 'clamp(2rem, 4.5vw, 3.75rem)' }}
      />
    </motion.div>
  )
}
