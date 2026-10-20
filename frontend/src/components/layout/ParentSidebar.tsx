import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  ChevronRight,
  LayoutDashboard,
  Leaf,
  Lightbulb,
  LogOut,
  Settings,
  type LucideIcon,
} from 'lucide-react'
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

type NavTone = 'green' | 'gold'

const PARENT_NAV: {
  label: string
  to: string
  icon: LucideIcon
  tone: NavTone
}[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, tone: 'green' },
  { label: 'Settings', to: '/settings', icon: Settings, tone: 'gold' },
]

const PARENT_TIPS = [
  {
    fil: 'Hikayatin ang inyong anak na basahin nang malakas ang mga bagong salita bago matulog.',
    en: 'Encourage your child to read the new words aloud before bed.',
  },
  {
    fil: 'Maglaan ng sampung minuto bawat araw para sanayin ang pagbigkas ng mga pantig.',
    en: 'Set aside ten minutes a day to practice pronouncing syllables.',
  },
  {
    fil: 'Purihin ang bawat pagsisikap, hindi lamang ang tamang sagot.',
    en: 'Praise the effort, not just the correct answer.',
  },
]

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const TIP_INDEX = Math.floor(Date.now() / WEEK_MS) % PARENT_TIPS.length

/**
 * Parent portal navigation: a calm white panel with sage gradients, green
 * and gold accents, and a weekly parent tip. Learners keep the playful sidebar.
 */
export const ParentSidebar: React.FC<ParentSidebarProps> = ({
  user,
  isHidden,
  avatar,
  onNavigate,
  onLogout,
}) => {
  const tip = PARENT_TIPS[TIP_INDEX]

  return (
    <aside
      aria-label="Parent navigation"
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col overflow-hidden border-r border-[#e3ebe0] bg-white shadow-xl transition-all duration-300 ease-in-out lg:static lg:shadow-none',
        isHidden ? '-translate-x-full lg:-ml-[260px]' : 'translate-x-0 lg:ml-0'
      )}
    >
      {/* Brand accent strip */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-20 h-1 bg-gradient-to-r from-[#4CAF50] via-[#2E7D32] to-[#D4A017]"
      />

      {/* Brand header */}
      <div className="relative border-b border-[#eef3ec] bg-gradient-to-br from-[#edf6e8] via-[#f6fbf2] to-white px-5 pb-5 pt-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(43,92,59,0.12) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-[#e3ebe0]">
            <img
              src="/images/Logo1.png"
              alt=""
              className="h-8 w-8 object-contain"
              decoding="async"
            />
          </div>
          <div className="min-w-0">
            <p className="font-heading text-base font-bold leading-tight text-[#2b5c3b]">
              PAMANA
            </p>
            <p className="flex items-center gap-1.5 text-xs font-medium text-[#7a8a7d]">
              <Leaf className="h-3.5 w-3.5 text-[#D4A017]" aria-hidden="true" />
              Parent Portal
            </p>
          </div>
        </div>
      </div>

      {/* Navigation + tip */}
      <div className="relative z-10 flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 flex items-center gap-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa79c]">
          Menu
          <span aria-hidden="true" className="h-px flex-1 bg-[#eef3ec]" />
        </p>

        <ul className="space-y-1">
          {PARENT_NAV.map(({ label, to, icon: Icon, tone }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={() => {
                  if (window.innerWidth < 1024) onNavigate()
                }}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]/40',
                    isActive
                      ? 'bg-[#eaf3e8] text-[#2E7D32] ring-1 ring-[#cfe3c8] before:absolute before:left-0 before:top-1/2 before:h-6 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-[#2E7D32]'
                      : 'text-[#4a5d4d] hover:translate-x-0.5 hover:bg-[#f4f8f2] hover:text-[#2b5c3b]'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
                        isActive
                          ? 'bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] text-white shadow-sm'
                          : tone === 'gold'
                            ? 'bg-[#fff4d6] text-[#B8860B] group-hover:bg-[#ffedb8]'
                            : 'bg-[#edf5e9] text-[#3f7d52] group-hover:bg-[#e2efdc]'
                      )}
                    >
                      <Icon
                        className="h-[18px] w-[18px]"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="flex-1">{label}</span>
                    {isActive && (
                      <ChevronRight
                        className="h-4 w-4 text-[#4CAF50]"
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-5 rounded-2xl border border-[#f3e6bd] bg-[#fffaf0] p-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#fff1c9] text-[#D4A017]">
              <Lightbulb className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#7a5200]">Tip ng Magulang</p>
              <p className="text-[10px] font-medium text-[#a3813d]">Parent tip</p>
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#6f5a2b]">{tip.fil}</p>
          <p lang="en" className="mt-1 text-[11px] leading-snug text-[#8a7440]">
            {tip.en}
          </p>
        </div>
      </div>

      {/* Account + sign out */}
      <div className="relative overflow-hidden border-t border-[#eef3ec] p-3.5">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full"
          viewBox="0 0 260 96"
          preserveAspectRatio="none"
        >
          <path
            d="M0 62 C 55 38, 130 78, 260 46 L260 96 L0 96 Z"
            fill="#e9f5e3"
            opacity="0.85"
          />
          <path
            d="M0 78 C 70 58, 160 92, 260 70 L260 96 L0 96 Z"
            fill="#dcefd6"
            opacity="0.9"
          />
        </svg>

        <div className="relative z-10">
          <div className="rounded-2xl bg-gradient-to-br from-[#f7fbf4]/95 to-[#eaf3e8]/95 p-3 ring-1 ring-[#e3ebe0]">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-bold text-[#2b5c3b] shadow-sm ring-2 ring-white">
                  {avatar}
                </div>
                <span
                  aria-hidden="true"
                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#4CAF50]"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#2b5c3b]">
                  {user?.name || 'Magulang'}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="rounded-full bg-[#fff1c9] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#8a6a10]">
                    Parent
                  </span>
                  <span className="text-[10px] text-[#7a8a7d]">Account</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-[#5a6b5d] ring-1 ring-[#e3ebe0] transition-colors hover:bg-[#fdf2f2] hover:text-[#b91c1c] hover:ring-[#f3d1d1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]/40"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}

export default ParentSidebar
