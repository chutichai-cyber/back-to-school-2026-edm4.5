'use client'

import { animate } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

export default function ScoreNumber({ value, color, className = '', style = {} }) {
  const [display, setDisplay] = useState(value)
  const [bump, setBump] = useState(false)
  const prevRef = useRef(value)

  useEffect(() => {
    const from = prevRef.current
    prevRef.current = value

    if (from === value) return

    let timeoutId
    if (value > from) {
      setBump(true)
      timeoutId = setTimeout(() => setBump(false), 500)
    }

    const controls = animate(from, value, {
      duration: value > from ? 0.7 : 0.4,
      ease: value > from ? [0.16, 1, 0.3, 1] : 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    })

    return () => {
      controls.stop()
      clearTimeout(timeoutId)
    }
  }, [value])

  return (
    <span
      className={`tabular-nums font-black leading-none inline-block transition-transform duration-300 ease-out ${
        bump ? 'scale-125' : 'scale-100'
      } ${className}`}
      style={{
        color,
        textShadow: bump ? `0 0 24px ${color}90` : 'none',
        transition: bump
          ? 'transform 0.15s ease-out, text-shadow 0.3s ease-out'
          : 'transform 0.3s ease-out, text-shadow 0.4s ease-out',
        ...style,
      }}
    >
      {display}
    </span>
  )
}
