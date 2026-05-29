const IS_PROD = process.env.NODE_ENV === 'production'
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 }
const MIN_LEVEL = LEVELS[LOG_LEVEL] ?? LEVELS.info

// ANSI colors for dev output
const C = {
  debug: '\x1b[36m',
  info:  '\x1b[32m',
  warn:  '\x1b[33m',
  error: '\x1b[31m',
  dim:   '\x1b[2m',
  reset: '\x1b[0m',
}

function formatData(data) {
  if (!data || Object.keys(data).length === 0) return ''
  return (
    ' ' +
    Object.entries(data)
      .map(([k, v]) => `${C.dim}${k}${C.reset}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(' ')
  )
}

function log(level, msg, data) {
  if ((LEVELS[level] ?? 0) < MIN_LEVEL) return

  if (IS_PROD) {
    const entry = { ts: new Date().toISOString(), level, msg, ...data }
    const line = JSON.stringify(entry)
    if (level === 'error') console.error(line)
    else if (level === 'warn') console.warn(line)
    else console.log(line)
    return
  }

  const ts = new Date().toTimeString().slice(0, 8)
  const color = C[level] ?? C.reset
  const tag = `${color}${level.toUpperCase().padEnd(5)}${C.reset}`
  const dataStr = formatData(data)
  console.log(`${C.dim}${ts}${C.reset} ${tag} ${msg}${dataStr}`)
}

export const logger = {
  debug: (msg, data) => log('debug', msg, data),
  info:  (msg, data) => log('info',  msg, data),
  warn:  (msg, data) => log('warn',  msg, data),
  error: (msg, data) => log('error', msg, data),
}
