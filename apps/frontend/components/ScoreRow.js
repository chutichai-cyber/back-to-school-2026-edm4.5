'use client'

import { motion } from 'framer-motion'
import RankBadge from './RankBadge'
import TeamAvatar from './TeamAvatar'
import ScoreNumber from './ScoreNumber'

const ROW_VARIANTS = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
}

export default function ScoreRow({ team, rank }) {
  const isFirst = rank === 1

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
      // GPU promotion — avoid layout thrashing on transform-based animation
      className="flex items-center gap-4 rounded-2xl will-change-transform overflow-hidden"
      style={{
        padding: 'clamp(0.65rem, 1.2vh, 1rem) clamp(0.9rem, 1.5vw, 1.25rem)',
        background: isFirst
          ? `linear-gradient(135deg, ${team.color}22 0%, ${team.color}0a 100%)`
          : 'rgba(13, 20, 40, 0.72)',
        borderLeft: `4px solid ${team.color}`,
        boxShadow: isFirst
          ? `0 4px 28px ${team.color}28, inset 0 1px 0 rgba(255,255,255,0.04)`
          : '0 2px 12px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <RankBadge rank={rank} />
      <TeamAvatar name={team.name} color={team.color} />

      <span
        className="flex-1 text-white font-bold truncate leading-tight"
        style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.35rem)' }}
      >
        {team.name}
      </span>

      <ScoreNumber
        value={team.score}
        color={team.color}
        className="leading-none"
        // font-size via inline style so it scales with viewport width
        style={{ fontSize: 'clamp(2rem, 4.5vw, 3.75rem)' }}
      />
    </motion.div>
  )
}
