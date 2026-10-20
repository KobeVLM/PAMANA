import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAudio } from '@/contexts/AudioContext'
import { cn } from '@/lib/utils'
import { StoryModal } from '@/components/StoryModal'
import { ParentSidebar } from '@/components/layout/ParentSidebar'
import {
  BarChart2,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  User,
} from 'lucide-react'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  roles: ('LEARNER' | 'PARENT')[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    to: '/home',
    icon: <img src="/images/iHome.png" alt="Home" className="w-32 h-32 object-contain drop-shadow-md" />,
    roles: ['LEARNER'],
  },
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: <BarChart2 className="w-32 h-32 text-white drop-shadow-md" strokeWidth={2.5} />,
    roles: ['PARENT'],
  },
  {
    label: 'Settings',
    to: '/settings',
    icon: <img src="/images/iSettings.png" alt="Settings" className="w-32 h-32 object-contain drop-shadow-md" />,
    roles: ['LEARNER', 'PARENT'],
  },
]

interface AppShellProps {
  children: React.ReactNode
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const { stopAudio } = useAudio()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [isSidebarHidden, setIsSidebarHidden] = useState(false)

  const [character, setCharacter] = useState<'Lalaki' | 'Babae'>('Lalaki')
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const updateCharacter = () => {
      const savedChar = localStorage.getItem('pamana_character')
      if (savedChar === 'Lalaki' || savedChar === 'Babae') {
        setCharacter(savedChar)
        setImageError(false) 
      } else {
        setCharacter('Lalaki') 
      }
    }

    updateCharacter()
    window.addEventListener('pamana_settings_changed', updateCharacter)
    
    return () => {
      window.removeEventListener('pamana_settings_changed', updateCharacter)
    }
  }, [])

  const handleLogout = () => {
    stopAudio()
    logout()
    navigate('/login')
  }

  const isPracticePage =
    location.pathname.startsWith('/modules') ||
    location.pathname.startsWith('/mastery')

  const isParent = user?.role === 'PARENT'

  const filteredNav = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role)
  )

  const avatarSrc = character === 'Lalaki' 
    ? '/images/M_User.png' 
    : '/images/F_User.png'

  const renderAvatar = () => {
    if (!imageError) {
      return (
        <img 
          src={avatarSrc} 
          alt={`${character} Avatar`} 
          className="w-full h-full object-cover" 
          onError={() => {
            console.log(`Failed to load image at: ${avatarSrc}`);
            setImageError(true);
          }}
        />
      )
    }

    return (
      <span className="text-[#2b5c3b]">{user?.name?.charAt(0).toUpperCase() || <User className="w-10 h-10" />}</span>
    )
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-[#f4f9f0] flex font-sans select-none">
      
      {/* MOBILE OVERLAY */}
      {!isPracticePage && !isSidebarHidden && (
        <button
          type="button"
          aria-label="Isara ang menu"
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarHidden(true)}
        />
      )}

      {/* SIDEBAR */}
      {!isPracticePage && isParent && (
        <ParentSidebar
          user={user}
          isHidden={isSidebarHidden}
          avatar={renderAvatar()}
          onNavigate={() => setIsSidebarHidden(true)}
          onLogout={handleLogout}
        />
      )}

      {!isPracticePage && !isParent && (
        <aside
          className={cn(
            'fixed lg:static inset-y-0 left-0 z-40 flex flex-col',
            'w-[280px] bg-gradient-to-b from-[#2d5e3e] to-[#4b8a5c] border-r-8 border-[#33664a] shadow-2xl',
            'transition-all duration-300 ease-in-out',
            isSidebarHidden ? '-translate-x-full lg:-ml-[288px]' : 'translate-x-0 lg:ml-0'
          )}
        >
          <div className="p-4 pt-8 flex justify-center items-center">
            <div className="w-56 h-auto drop-shadow-lg hover:scale-105 transition-transform duration-200 cursor-pointer">
              <img
                src="/images/W-Logo.png"
                alt="PAMANA Heritage Quest"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
            {filteredNav.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 1024) setIsSidebarHidden(true)
                }}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center py-4 px-2 rounded-[2.5rem] transition-all duration-150 transform active:translate-y-2',
                    isActive
                      ? 'bg-[#d6d63f] shadow-[0_8px_0_#949420] scale-100'
                      : 'bg-transparent hover:bg-white/10 active:shadow-none'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="mb-1">
                      {item.icon}
                    </div>
                    <span className={cn(
                      "text-2xl font-black tracking-wider drop-shadow-md",
                      isActive ? "text-[#3b440a]" : "text-white/80"
                    )}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="px-4 pb-4 flex flex-col items-center justify-center mt-auto">
            <div className="relative flex flex-col items-center">
              
              <div className="w-28 h-28 rounded-full bg-[#4aa883] border-4 border-white shadow-lg flex items-center justify-center text-4xl z-10 overflow-hidden -translate-y-2">
                {renderAvatar()}
              </div>
              
              {/* Original Green/White Name Tag */}
              <div className="mt-[-20px] bg-[#f4f9f0] px-8 py-2 rounded-full border-4 border-[#a4cba9] shadow-md z-20">
                <p className="text-[#2b5c3b] font-black text-xl truncate max-w-[160px]">
                  {user?.name || 'Mag-aaral'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 pb-8">
            <button
              onClick={handleLogout}
              className="relative flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-[2rem]
                         bg-gradient-to-b from-[#ffb732] to-[#f57a00]
                         border-b-[8px] border-[#b54300]
                         shadow-[0_4px_0_#8c2f00]
                         hover:brightness-105 active:border-b-0 active:translate-y-2 active:shadow-none transition-all duration-100"
            >
              <span className="pointer-events-none absolute top-1.5 left-4 w-10 h-3 rounded-[100%] bg-white/50 -rotate-12 blur-[1.5px]" />
              <LogOut className="w-8 h-8 stroke-[3] text-white drop-shadow-[0_3px_0_#a33a00]" />
              
              <span 
                className="text-3xl font-black tracking-wide"
                style={{
                  color: '#ffffff',
                  WebkitTextStroke: '4px #9e3b00',
                  paintOrder: 'stroke fill',
                  textShadow: '0 4px 0 #9e3b00'
                }}
              >
                Logout
              </span>
            </button>
          </div>
        </aside>
      )}

      {/* DESKTOP TOGGLE BUTTON */}
      {!isPracticePage &&
        (isParent ? (
          <button
            onClick={() => setIsSidebarHidden(!isSidebarHidden)}
            className={cn(
              'hidden lg:flex fixed z-50 top-6 items-center justify-center w-10 h-10 rounded-xl',
              'bg-white border border-[#e3ebe0] text-[#2b5c3b] shadow-sm hover:bg-[#f4f8f2]',
              'transition-all duration-300 ease-in-out',
              isSidebarHidden ? 'left-6' : 'left-[276px]'
            )}
            title={isSidebarHidden ? 'Show Menu' : 'Hide Menu'}
            aria-label={isSidebarHidden ? 'Show Menu' : 'Hide Menu'}
          >
            {isSidebarHidden ? (
              <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        ) : (
          <button
            onClick={() => setIsSidebarHidden(!isSidebarHidden)}
            className={cn(
              "hidden lg:flex fixed z-50 top-6 transition-all duration-300 ease-in-out",
              "items-center justify-center w-14 h-14 rounded-[1.2rem]",
              "bg-gradient-to-b from-[#55cfff] to-[#1f9ee6]",
              "border-b-[6px] border-[#0d6cb5]",
              "shadow-[0_4px_0_#074e83]",
              "hover:brightness-110 active:border-b-0 active:translate-y-1.5 active:shadow-none",
              isSidebarHidden ? "left-6" : "left-[304px]" 
            )}
            title={isSidebarHidden ? "Show Menu" : "Hide Menu"}
          >
            <span className="pointer-events-none absolute top-1.5 left-3 w-7 h-2.5 rounded-[100%] bg-white/50 -rotate-12 blur-[1.5px]" />
            <img 
              src="/images/S-Logo.png" 
              alt="Toggle Sidebar" 
              className="relative w-9 h-9 object-contain drop-shadow-[0_3px_0_rgba(0,0,0,0.25)]" 
            />
          </button>
        ))}

      <div className="flex-1 flex flex-col min-w-0 bg-[#f4f9f0] relative overflow-hidden">
        {!isPracticePage &&
          (isParent ? (
            <header className="lg:hidden sticky top-0 z-20 h-16 bg-white border-b border-[#e3ebe0] flex items-center px-4 justify-between">
              <button
                onClick={() => setIsSidebarHidden(false)}
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-[#e3ebe0] text-[#2b5c3b] hover:bg-[#f4f8f2] transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>

              <div className="flex items-center gap-2">
                <img
                  src="/images/Logo1.png"
                  alt=""
                  className="h-8 w-8 object-contain"
                />
                <span className="font-heading text-sm font-bold text-[#2b5c3b]">
                  Parent Portal
                </span>
              </div>

              <div className="w-9 h-9 rounded-full border border-[#e3ebe0] bg-[#f4f8f2] flex items-center justify-center overflow-hidden text-[#2b5c3b] font-bold">
                {renderAvatar()}
              </div>
            </header>
          ) : (
            <header className="lg:hidden sticky top-0 z-20 h-20 bg-gradient-to-b from-[#2d5e3e] to-[#4b8a5c] border-b-4 border-[#33664a] flex items-center px-4 justify-between shadow-md">
              
              <button
                onClick={() => setIsSidebarHidden(false)}
                className="relative flex items-center justify-center w-12 h-12 rounded-[1rem] bg-gradient-to-b from-[#55cfff] to-[#1f9ee6] border-b-[4px] border-[#0d6cb5] shadow-[0_3px_0_#074e83] active:border-b-0 active:translate-y-1 active:shadow-none transition-all"
                aria-label="Open menu"
              >
                <span className="pointer-events-none absolute top-1 left-2 w-6 h-2 rounded-[100%] bg-white/50 -rotate-12 blur-[1px]" />
                <img src="/images/S-Logo.png" alt="Menu" className="relative w-8 h-8 object-contain drop-shadow-[0_2px_0_rgba(0,0,0,0.2)]" />
              </button>

              <img
                src="/images/Logo1.png"
                alt="PAMANA"
                className="h-12 object-contain drop-shadow-md"
              />

              <div className="w-12 h-12 rounded-full bg-[#4aa883] border-4 border-white shadow-sm flex items-center justify-center overflow-hidden text-[#2b5c3b] font-black">
                {renderAvatar()}
              </div>
            </header>
          ))}

        <main className="flex-1 overflow-auto relative">
          {children}
        </main>
      </div>

      {!isSidebarHidden && (
        <button
          onClick={() => setIsSidebarHidden(true)}
          className={cn(
            'fixed top-4 right-4 z-50 lg:hidden p-3 rounded-full shadow-xl transition-all',
            isParent
              ? 'bg-white border border-[#e3ebe0] text-[#5a6b5d] hover:bg-[#f4f8f2]'
              : 'bg-[#FCA5A5] border-b-4 border-[#EF4444] text-white active:border-b-0 active:translate-y-1'
          )}
        >
          <X className={cn('stroke-[3]', isParent ? 'w-5 h-5' : 'w-7 h-7')} />
        </button>
      )}

      <StoryModal />
    </div>
  )
}