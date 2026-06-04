'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { setToken, isAuthenticated } from '../../../lib/auth'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (isAuthenticated()) router.replace('/admin')
  }, [router])

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    try {
      const res  = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Login failed')
        return
      }
      setToken(data.token)
      router.replace('/admin')
    } catch {
      setErrorMsg('Cannot connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%), #050c1a' }}
    >
      <div className="w-full max-w-sm">

        {/* Logo / title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 ring-1 ring-indigo-500/30 mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Admin Login</h1>
          <p className="text-sm text-slate-500 mt-1">Scoreboard Control Panel</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800/60 ring-1 ring-slate-700/50 rounded-2xl p-6 flex flex-col gap-4"
        >
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Username
            </label>
            <input
              className="admin-input w-full"
              type="text"
              autoComplete="username"
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Password
            </label>
            <input
              className="admin-input w-full"
              type="password"
              autoComplete="current-password"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Error */}
          {errorMsg && (
            <p className="text-sm text-red-400 bg-red-500/10 ring-1 ring-red-500/20 rounded-lg px-3 py-2">
              {errorMsg}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

      </div>
    </div>
  )
}
