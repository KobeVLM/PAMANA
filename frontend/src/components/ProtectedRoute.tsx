import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('LEARNER' | 'PARENT' | 'TEACHER')[]
}

/**
 * Wraps routes that require authentication.
 * Redirects unauthenticated users to /login.
 * Optionally restricts to specific roles.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pamana-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-pamana-green border-t-transparent rounded-full animate-spin" />
          <p className="text-pamana-warm font-heading font-bold text-lg">Naglo-load...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their correct home based on role
    const roleHome = user.role === 'PARENT' ? '/dashboard' : user.role === 'TEACHER' ? '/klase' : '/trail'
    return <Navigate to={roleHome} replace />
  }

  return <>{children}</>
}
