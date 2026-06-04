'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated } from '../../lib/auth'

export default function AdminLayout({ children }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Login page is always accessible
    if (pathname === '/admin/login') {
      setReady(true)
      return
    }
    if (!isAuthenticated()) {
      router.replace('/admin/login')
    } else {
      setReady(true)
    }
  }, [pathname, router])

  // Show nothing while checking auth (prevents flash of admin content)
  if (!ready) return null

  return <>{children}</>
}
