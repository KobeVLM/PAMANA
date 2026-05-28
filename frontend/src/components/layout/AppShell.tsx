import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import {
  Map,
  BookOpen,
  Trophy,
  Users,
  BarChart2,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  roles: ('LEARNER' | 'PARENT' | 'TEACHER')[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Pamana Trail',
    to: '/trail',
    icon: <Map className="w-5 h-5" />,
    roles: ['LEARNER'],
  },
  {
    label: 'Mga Aralin',
    to: '/trail',
    icon: <BookOpen className="w-5 h-5" />,
    roles: ['LEARNER'],
  },
  {
    label: 'Klase Mode',
    to: '/klase',
    icon: <Users className="w-5 h-5" />,
    roles: ['LEARNER', 'TEACHER'],
  },
  {
    label: 'Leaderboard',
    to: '/leaderboard',
    icon: <Trophy className="w-5 h-5" />,
    roles: ['LEARNER', 'TEACHER'],
  },
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: <BarChart2 className="w-5 h-5" />,
    roles: ['PARENT', 'TEACHER'],
  },
]

interface AppShellProps {
  children: React.ReactNode
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const filteredNav = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role)
  )

  const roleLabel = user?.role === 'LEARNER'
    ? 'Mag-aaral'
    : user?.role === 'PARENT'
    ? 'Magulang'
    : 'Guro'

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 flex">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-30 flex flex-col',
          'w-64 bg-green-950/95 backdrop-blur-xl border-r border-white/10',
          'transform transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pamana-gold to-pamana-amber flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-heading font-bold text-lg leading-none">PAMANA</h1>
              <p className="text-green-400 text-xs mt-0.5 font-medium">Heritage Quest</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pamana-green to-emerald-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{user?.name}</p>
              <p className="text-green-400 text-xs">{roleLabel}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-gradient-to-r from-pamana-green to-emerald-500 text-white shadow-lg shadow-green-900/50'
                    : 'text-green-300 hover:bg-white/10 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn('transition-transform duration-200', !isActive && 'group-hover:scale-110')}>
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Mag-logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-10 h-16 bg-green-950/80 backdrop-blur-xl border-b border-white/10 flex items-center px-4 lg:px-6 gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-green-300 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Buksan ang menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          {/* Right-side: user avatar */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-white text-sm font-semibold leading-none">{user?.name}</p>
              <p className="text-green-400 text-xs mt-0.5">{roleLabel}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pamana-green to-emerald-400 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile close button when sidebar open */}
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed top-4 right-4 z-40 lg:hidden p-2 bg-white/10 rounded-full text-white"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
