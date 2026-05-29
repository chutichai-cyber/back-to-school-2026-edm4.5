function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

export default function TeamAvatar({ name, color }) {
  const initials = getInitials(name)

  return (
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-white text-sm"
      style={{
        backgroundColor: `${color}22`,
        border: `2px solid ${color}55`,
        boxShadow: `0 0 14px ${color}25`,
        letterSpacing: '0.05em',
      }}
    >
      {initials}
    </div>
  )
}
