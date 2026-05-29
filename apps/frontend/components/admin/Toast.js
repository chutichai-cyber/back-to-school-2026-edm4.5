'use client'
import { useCallback, useState } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  return { toasts, toast }
}

const STYLES = {
  success: 'bg-emerald-800/95 text-emerald-100 ring-1 ring-emerald-600/40',
  error:   'bg-red-800/95 text-red-100 ring-1 ring-red-600/40',
  info:    'bg-slate-700/95 text-slate-100 ring-1 ring-slate-600/40',
}

const ICONS = { success: '✓', error: '✕', info: 'i' }

export function ToastContainer({ toasts }) {
  if (!toasts.length) return null

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-5 z-50 flex flex-col-reverse gap-2 w-[calc(100vw-2rem)] sm:w-auto sm:max-w-xs pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium shadow-xl backdrop-blur pointer-events-auto ${STYLES[t.type] ?? STYLES.info}`}
        >
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black opacity-80 flex-shrink-0 bg-white/15">
            {ICONS[t.type]}
          </span>
          <span className="leading-snug">{t.message}</span>
        </div>
      ))}
    </div>
  )
}
