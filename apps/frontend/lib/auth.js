const TOKEN_KEY = 'admin_token'

export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// Decode the JWT payload (middle segment) — no signature verification
export function decodeToken(token) {
  try {
    const parts = token?.split('.')
    if (!parts || parts.length < 2) return null
    // base64url → base64 → JSON
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(b64))
  } catch {
    return null
  }
}

export function isTokenValid(token) {
  const payload = decodeToken(token)
  if (!payload || typeof payload.exp !== 'number') return false
  return payload.exp > Math.floor(Date.now() / 1000)
}

export function isAuthenticated() {
  return isTokenValid(getToken())
}

export function logout() {
  removeToken()
  if (typeof window !== 'undefined') window.location.replace('/admin/login')
}
