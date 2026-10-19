import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

interface ParentSidebarProps {
  user: User | null
  /** Slide the drawer off-canvas (mobile) / collapse it (desktop). */
  isHidden: boolean
  /** Avatar node built by AppShell from the saved character. */
  avatar: React.ReactNode
  /** Close the drawer after navigating on small screens. */
  onNavigate: () => void
  onLogout: () => void
}

const PARENT_NAV = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Settings', to: '/settings', icon: Settings },
]

/**
 * Understated parent portal navigation: white panel, quiet line icons and a
 * single green accent for the current page. Learners keep the playful sidebar.
 */
export const ParentSidebar: React.FC<ParentSidebarProps> = ({
  user,
  isHidden,
  avatar,
  onNavigate,
  onLogout,
}) => {
  return (
    <aside
      aria-label="Parent navigation"
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-[#e3ebe0] bg-white shadow-xl transition-all duration-300 ease-in-out lg:static lg:shadow-none',
        isHidden ? '-translate-x-full lg:-ml-[260px]' : 'translate-x-0 lg:ml-0'
      )}
    >
      <div className="flex items-center gap-3 px-5 pb-5 pt-7">
        <img
          src="/images/Logo1.png"
          alt=""
          className="h-10 w-10 flex-shrink-0 object-contain"
          decoding="async"
        />
        <div className="min-w-0">
          <p className="font-heading text-base font-bold leading-tight text-[#2b5c3b]">
            PAMANA
          </p>
          <p className="text-xs font-medium text-[#7a8a7d]">Parent Portal</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa79c]">
          Menu
        </p>
        <ul className="space-y-1">
          {PARENT_NAV.map(({ label, to, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={() => {
                  if (window.innerWidth < 1024) onNavigate()
                }}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]/40',
                    isActive
                      ? 'bg-[#eaf3e8] text-[#2E7D32] before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-[#2E7D32]'
                      : 'text-[#4a5d4d] hover:bg-[#f4f8f2] hover:text-[#2b5c3b]'
                  )
                }
              >
                <Icon
                  className="h-[18px] w-[18px] flex-shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-[#eef3ec] p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e3ebe0] bg-[#f4f8f2] text-sm font-bold text-[#2b5c3b]">
            {avatar}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#2b5c3b]">
              {user?.name || 'Magulang'}
            </p>
            <p className="text-xs text-[#7a8a7d]">Parent account</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#e3ebe0] px-3 py-2 text-sm font-medium text-[#5a6b5d] transition-colors hover:border-[#f3d1d1] hover:bg-[#fdf2f2] hover:text-[#b91c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]/40"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

export default ParentSidebar
