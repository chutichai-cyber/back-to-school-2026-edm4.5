import { io } from 'socket.io-client'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

let socket = null

export function getSocket() {
  if (typeof window === 'undefined') return null

  if (!socket) {
    socket = io(BACKEND_URL, {
      // Try WebSocket first, fall back to long-polling
      transports: ['websocket', 'polling'],

      // ── Reconnect strategy: exponential backoff with jitter ───────────────
      // Sequence (approx): 500ms → 1s → 2s → 4s → 8s → 16s → 30s → 30s …
      // The ±50% randomizationFactor prevents a thundering-herd reconnect storm
      // when many clients lose connectivity at the same time.
      reconnection:          true,
      reconnectionAttempts:  Infinity,
      reconnectionDelay:     500,
      reconnectionDelayMax:  30_000,
      randomizationFactor:   0.5,

      // Connection handshake timeout before falling back to polling
      timeout: 10_000,
    })
  }

  return socket
}

// Destroy and recreate the socket (useful for logout / hard reset)
export function resetSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
