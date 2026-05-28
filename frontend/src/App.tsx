import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'

// Game Pages
import { TrailMapPage } from '@/pages/trail/TrailMapPage'
import { SyllableModulePage } from '@/pages/modules/SyllableModulePage'

// Dashboard & Support
import { KlaseLeaderboardPage } from '@/pages/klase/KlaseLeaderboardPage'
import { TeacherKlasePage } from '@/pages/klase/TeacherKlasePage'
import { ParentDashboardPage } from '@/pages/dashboard/ParentDashboardPage'
import { TeacherDashboardPage } from '@/pages/dashboard/TeacherDashboardPage'

// Lazy-loaded module pages (loaded on demand to keep initial bundle small)
const VocabularyModulePage = React.lazy(() =>
  import('@/pages/modules/VocabularyModulePage').then((m) => ({ default: m.VocabularyModulePage }))
)
const SentenceModulePage = React.lazy(() =>
  import('@/pages/modules/SentenceModulePage').then((m) => ({ default: m.SentenceModulePage }))
)
const HamonGamePage = React.lazy(() =>
  import('@/pages/modules/HamonGamePage').then((m) => ({ default: m.HamonGamePage }))
)

const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-pamana-gold border-t-transparent rounded-full animate-spin" />
      <p className="text-green-300 font-heading font-semibold">Naglo-load...</p>
    </div>
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <React.Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Learner routes */}
            <Route
              path="/trail"
              element={
                <ProtectedRoute allowedRoles={['LEARNER']}>
                  <TrailMapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/modules/1"
              element={
                <ProtectedRoute allowedRoles={['LEARNER']}>
                  <SyllableModulePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/modules/2"
              element={
                <ProtectedRoute allowedRoles={['LEARNER']}>
                  <VocabularyModulePage moduleNumber={2} domain="self_body" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/modules/3"
              element={
                <ProtectedRoute allowedRoles={['LEARNER']}>
                  <VocabularyModulePage moduleNumber={3} domain="family_home" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/modules/4"
              element={
                <ProtectedRoute allowedRoles={['LEARNER']}>
                  <SentenceModulePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/modules/:moduleNumber/hamon"
              element={
                <ProtectedRoute allowedRoles={['LEARNER']}>
                  <HamonGamePage />
                </ProtectedRoute>
              }
            />

            {/* Shared routes (Learner + Teacher) */}
            <Route
              path="/klase"
              element={
                <ProtectedRoute allowedRoles={['LEARNER', 'TEACHER']}>
                  <RoleBasedKlaseRoute />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute allowedRoles={['LEARNER', 'TEACHER']}>
                  <KlaseLeaderboardPage />
                </ProtectedRoute>
              }
            />

            {/* Parent/Teacher dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['PARENT', 'TEACHER']}>
                  <RoleBasedDashboardRoute />
                </ProtectedRoute>
              }
            />

            {/* Default redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </React.Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

function RoleBasedDashboardRoute() {
  const { user } = useAuth()
  if (user?.role === 'TEACHER') {
    return <TeacherDashboardPage />
  }
  return <ParentDashboardPage />
}

function RoleBasedKlaseRoute() {
  const { user } = useAuth()
  if (user?.role === 'TEACHER') {
    return <TeacherKlasePage />
  }
  return <KlaseLeaderboardPage />
}

export default App
