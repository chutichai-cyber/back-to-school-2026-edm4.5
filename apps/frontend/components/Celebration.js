'use client'

const COLORS = [
  '#fcd34d', // gold
  '#f97316', // orange
  '#ef4444', // red
  '#a855f7', // purple
  '#3b82f6', // blue
  '#22c55e', // green
  '#ec4899', // pink
  '#06b6d4', // cyan
]

// Deterministic ribbons — no Math.random() so SSR is stable
const RIBBONS = Array.from({ length: 32 }, (_, i) => ({
  id:           i,
  left:         `${(i * 6 + 1) % 98}%`,
  width:        `${4 + (i * 2) % 5}px`,
  height:       `${14 + (i * 3) % 14}px`,
  color:        COLORS[i % COLORS.length],
  fallDuration: `${5 + (i * 1.3) % 6}s`,
  fallDelay:    `${-(i * 0.75) % 8}s`,
  flutterDur:   `${0.4 + (i * 0.15) % 0.6}s`,
  drift:        `${((i % 7) - 3) * 22}px`,
}))

export default function Celebration() {
  return (
    <div className="celebration" aria-hidden="true">
      {RIBBONS.map(r => (
        <div
          key={r.id}
          className="ribbon"
          style={{
            left:              r.left,
            width:             r.width,
            height:            r.height,
            backgroundColor:   r.color,
            animationDuration: r.fallDuration,
            animationDelay:    r.fallDelay,
          }}
        >
          <div
            className="ribbon-inner"
            style={{
              '--drift':         r.drift,
              backgroundColor:   r.color,
              animationDuration: r.flutterDur,
            }}
          />
        </div>
      ))}
    </div>
  )
}
