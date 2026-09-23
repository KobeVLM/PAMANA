import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'  // ✅ ADD THIS BACK

import { AudioProvider } from '@/contexts/AudioContext'

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'

// Landing Page
import { LandingPage } from '@/pages/landingpage/landingpage'

// Home Page - CHALLENGES layout
import HomePage from '@/pages/homepage/HomePage'

// Game Pages
import { TrailMapPage } from '@/pages/trail/TrailMapPage'
import { SyllableModulePage } from '@/pages/modules/SyllableModulePage'

// Dashboard & Support
import { ParentDashboardPage } from '@/pages/dashboard/ParentDashboardPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { BGMController } from '@/components/music/BGMController'

// Lazy-loaded module pages
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
        <AudioProvider>
          <BGMController />
          <React.Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* ✅ Home page WITH AppShell */}
              <Route
                path="/home"
                element={
                  <ProtectedRoute allowedRoles={['LEARNER']}>
                    <AppShell>
                      <HomePage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              {/* ✅ Learner routes - NO AppShell wrapper (pages already have AppShell) */}
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

              {/* Settings */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={['LEARNER', 'PARENT']}>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Parent dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['PARENT']}>
                    <RoleBasedDashboardRoute />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </React.Suspense>
        </AudioProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

function RoleBasedDashboardRoute() {
  return <ParentDashboardPage />
}

export default App