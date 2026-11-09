import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import { LoadingState } from '@/components/common/LoadingState'

export interface ModuleRouteGuardProps {
  moduleNumber: number
  children: React.ReactNode
}

type GuardStatus = 'loading' | 'allowed' | 'denied'

/**
 * Route guard that ensures learners cannot navigate to a module page
 * if that module is locked according to their module_progress.
 */
export const ModuleRouteGuard: React.FC<ModuleRouteGuardProps> = ({
  moduleNumber,
  children,
}) => {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [status, setStatus] = useState<GuardStatus>('loading')

  useEffect(() => {
    setStatus('loading')

    if (isAuthLoading || !user) {
      return
    }

    let isMounted = true

    const checkProgress = async () => {
      try {
        const response = await api.get(`/modules/progress/${user.id}`)
        if (!isMounted) return

        const progressList = Array.isArray(response.data) ? response.data : []
        const mod = progressList.find((p: any) => p.moduleNumber === moduleNumber)

        const isUnlocked =
          moduleNumber === 1
            ? (mod ? Boolean(mod.isUnlocked ?? mod.unlocked) : true)
            : Boolean(mod?.isUnlocked ?? mod?.unlocked)

        if (isUnlocked) {
          setStatus('allowed')
        } else {
          toast.error(`Naka-lock pa ang Module ${moduleNumber}. Tapusin muna ang naunang aralin!`)
          setStatus('denied')
        }
      } catch (error) {
        if (!isMounted) return

        if (moduleNumber === 1) {
          setStatus('allowed')
        } else {
          toast.error(`Naka-lock pa ang Module ${moduleNumber}. Tapusin muna ang naunang aralin!`)
          setStatus('denied')
        }
      }
    }

    checkProgress()

    return () => {
      isMounted = false
    }
  }, [user, isAuthLoading, moduleNumber])

  if (isAuthLoading || !user || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pamana-cream">
        <LoadingState message="Naglo-load..." />
      </div>
    )
  }

  if (status === 'denied') {
    return <Navigate to="/trail" replace />
  }

  return <>{children}</>
}
