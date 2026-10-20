import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'

/**
 * Tracks an app session for learners so the Parent Dashboard can show
 * average session duration and recent session history.
 *
 * Starts a session when a learner is logged in and ends it on logout,
 * tab hide, or page unload. End uses fetch({ keepalive: true }) so it
 * survives navigation/unload where sendBeacon cannot send the JWT header.
 */
export const SessionTracker: React.FC = () => {
  const { user } = useAuth()
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user || user.role !== 'LEARNER') return

    let cancelled = false

    const start = () => {
      api
        .post('/sessions/start')
        .then((res) => {
          if (!cancelled) sessionIdRef.current = res.data?.sessionId ?? null
        })
        .catch(() => {
          /* session tracking is best-effort */
        })
    }

    const end = () => {
      const id = sessionIdRef.current
      if (!id) return
      sessionIdRef.current = null
      const token = sessionStorage.getItem('pamana_token')
      try {
        fetch(`/api/sessions/${id}/end`, {
          method: 'POST',
          keepalive: true,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }).catch(() => {})
      } catch {
        /* ignore */
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') end()
    }

    start()
    window.addEventListener('beforeunload', end)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      window.removeEventListener('beforeunload', end)
      document.removeEventListener('visibilitychange', handleVisibility)
      end()
    }
  }, [user])

  return null
}
