import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 px-6">
      {/* Eyebrow */}
      <p className="text-amber-400/60 text-xs font-bold tracking-[0.3em] uppercase">
        ★ School Event ★
      </p>

      {/* Title */}
      <div className="text-center">
        <h1
          className="text-6xl sm:text-7xl font-black tracking-tight leading-none"
          style={{ color: '#fcd34d', textShadow: '0 0 40px rgba(252,211,77,0.4)' }}
        >
          Scoreboard
        </h1>
        <p className="mt-3 text-slate-400 text-lg">
          Realtime school sports day scoreboard
        </p>
      </div>

      {/* Nav */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
        <Link
          href="/display"
          className="flex-1 text-center px-8 py-4 rounded-2xl font-bold text-white text-lg
                     bg-indigo-600 hover:bg-indigo-500 active:scale-95
                     transition-all duration-150 shadow-lg shadow-indigo-600/30"
        >
          Live Display
        </Link>
        <Link
          href="/admin"
          className="flex-1 text-center px-8 py-4 rounded-2xl font-bold text-white text-lg
                     bg-slate-700 hover:bg-slate-600 active:scale-95
                     transition-all duration-150"
        >
          Admin Panel
        </Link>
      </div>

      {/* Mock preview hint */}
      <p className="text-slate-600 text-xs">
        No backend? Try{' '}
        <Link href="/display?mock=1" className="text-indigo-400 hover:text-indigo-300 underline">
          /display?mock=1
        </Link>
      </p>
    </main>
  )
}
