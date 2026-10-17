import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'  // ✅ ADD THIS BACK

import { AudioProvider } from '@/contexts/AudioContext'
import { LanguageProvider } from '@/contexts/LanguageContext'

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'

// Landing Page
import { LandingPage } from '@/pages/landingpage/landingpage'

// BGM & session shell components
import { BGMController } from '@/components/music/BGMController'
import { SessionTracker } from '@/components/SessionTracker'

// Lazy-loaded module pages
const HomePage = React.lazy(() => import('@/pages/homepage/HomePage'))
const TrailMapPage = React.lazy(() =>
  import('@/pages/trail/TrailMapPage').then((m) => ({ default: m.TrailMapPage }))
)
const SyllableModulePage = React.lazy(() =>
  import('@/pages/modules/SyllableModulePage').then((m) => ({ default: m.SyllableModulePage }))
)
const ParentDashboardPage = React.lazy(() =>
  import('@/pages/dashboard/ParentDashboardPage').then((m) => ({ default: m.ParentDashboardPage }))
)
const SettingsPage = React.lazy(() =>
  import('@/pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
)
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

// Lazy-loaded module pages
const VocabularyModulePage = React.lazy(() =>
  import('@/pages/modules/VocabularyModulePage').then((m) => ({ default: m.VocabularyModulePage }))
)
const SentenceModulePage = React.lazy(() =>
  import('@/pages/modules/SentenceModulePage').then((m) => ({ default: m.SentenceModulePage }))
)

// Lazy-loaded mastery practice pages
const SyllablePracticePage = React.lazy(() =>
  import('@/pages/mastery/SyllablePracticePage').then((m) => ({ default: m.SyllablePracticePage }))
)
const WordPracticePage = React.lazy(() =>
  import('@/pages/mastery/WordPracticePage').then((m) => ({ default: m.WordPracticePage }))
)
const ImagePracticePage = React.lazy(() =>
  import('@/pages/mastery/ImagePracticePage').then((m) => ({ default: m.ImagePracticePage }))
)
const SentencePracticePage = React.lazy(() =>
  import('@/pages/mastery/SentencePracticePage').then((m) => ({ default: m.SentencePracticePage }))
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
      <LanguageProvider>
        <AuthProvider>
          <AudioProvider>
          <BGMController />
          <SessionTracker />
          <TooltipProvider delayDuration={250}>
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

              {/* Mastery Practice Routes */}
              <Route
                path="/mastery/1"
                element={
                  <ProtectedRoute allowedRoles={['LEARNER']}>
                    <SyllablePracticePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mastery/2"
                element={
                  <ProtectedRoute allowedRoles={['LEARNER']}>
                    <WordPracticePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mastery/3"
                element={
                  <ProtectedRoute allowedRoles={['LEARNER']}>
                    <ImagePracticePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mastery/4"
                element={
                  <ProtectedRoute allowedRoles={['LEARNER']}>
                    <SentencePracticePage />
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
                    <ParentDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </React.Suspense>
          </TooltipProvider>
          <Toaster />
        </AudioProvider>
      </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}

export default App