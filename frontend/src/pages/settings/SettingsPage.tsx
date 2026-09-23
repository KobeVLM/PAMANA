import React, { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/contexts/AuthContext'
import { Settings, User, Bell, Paintbrush, Check, Music, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

export const SettingsPage: React.FC = () => {
  const { user } = useAuth()
  const [character, setCharacter] = useState<'Lalaki' | 'Babae'>('Lalaki')
  const [musicEnabled, setMusicEnabled] = useState(true)
  const [copiedCode, setCopiedCode] = useState(false)

  const handleCopyCode = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  useEffect(() => {
    const savedChar = localStorage.getItem('pamana_character')
    if (savedChar === 'Lalaki' || savedChar === 'Babae') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCharacter(savedChar as 'Lalaki' | 'Babae')
    }

    const savedBgm = localStorage.getItem('pamana_bgm')
    if (savedBgm === 'false') {
      setMusicEnabled(false)
    }
  }, [])

  const handleCharacterChange = (char: 'Lalaki' | 'Babae') => {
    setCharacter(char)
    localStorage.setItem('pamana_character', char)
    window.dispatchEvent(new Event('pamana_settings_changed'))
  }

  const toggleMusic = () => {
    const newVal = !musicEnabled
    setMusicEnabled(newVal)
    localStorage.setItem('pamana_bgm', newVal ? 'true' : 'false')
    window.dispatchEvent(new Event('pamana_settings_changed'))
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          {/* SETTINGS Header */}
          <div className="mb-10">
            <h1 className="text-5xl md:text-6xl font-bold text-white font-heading tracking-tight flex items-center gap-3">
              <Settings className="w-8 h-8 text-pamana-green" />
              SETTINGS
            </h1>
            <p className="text-green-200 mt-2">
              Manage your account and other aspects of the app here.
            </p>
          </div>

          {/* Profile Section (Full Width) */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-pamana-green/30 hover:bg-white/10 transition-all duration-300 mb-8">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-pamana-green" />
              Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-sm text-green-300 font-medium">Name</label>
                <div className="p-3 bg-white/5 rounded-lg text-white">
                  {user?.name || 'Loading...'}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-green-300 font-medium">Email</label>
                <div className="p-3 bg-white/5 rounded-lg text-white">
                  {user?.email || 'Loading...'}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-green-300 font-medium">Role</label>
                <div className="p-3 bg-white/5 rounded-lg text-white capitalize">
                  {user?.role?.toLowerCase() || 'Loading...'}
                </div>
              </div>
            </div>

            {/* Student Code / Account ID for linking */}
            {user?.role === 'LEARNER' && (
              <div className="p-4 rounded-xl bg-pamana-green/10 border border-pamana-green/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-green-300 font-semibold uppercase tracking-wider mb-1">
                    Student Code (ID para sa Magulang)
                  </div>
                  <div className="font-mono text-xs sm:text-sm text-white bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 select-all inline-block break-all">
                    {user?.id}
                  </div>
                  <p className="text-xs text-green-200/70 mt-1">
                    Maaari mong ibigay ang Student Code o ang iyong email sa iyong magulang upang ma-link ang iyong dashboard.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-4 py-2 rounded-lg bg-pamana-green/20 hover:bg-pamana-green/30 border border-pamana-green/40 text-green-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-all self-start sm:self-center shrink-0 cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Na-kopya na!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Kopyahin ang Code</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </section>

          {/* 2-Column Grid: Preferences + Notifications */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* LEFT: Preferences (3 columns) */}
            <div className="md:col-span-3">
              <section className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-pamana-green/30 hover:bg-white/10 transition-all duration-300 h-full">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                  <Paintbrush className="w-5 h-5 text-pamana-green" />
                  Change Preference
                </h2>

                <div className="space-y-4 max-w-sm">
                  <div className="space-y-2">
                    <label className="text-sm text-green-300 font-medium">Choose your character</label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <button
                        onClick={() => handleCharacterChange('Lalaki')}
                        className={cn(
                          "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all duration-300",
                          character === 'Lalaki'
                            ? "border-pamana-green bg-pamana-green/20 text-white"
                            : "border-white/10 bg-white/5 text-green-200 hover:bg-white/10 hover:border-white/30"
                        )}
                      >
                        Male {character === 'Lalaki' && <Check className="w-4 h-4 text-pamana-green" />}
                      </button>
                      <button
                        onClick={() => handleCharacterChange('Babae')}
                        className={cn(
                          "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all duration-300",
                          character === 'Babae'
                            ? "border-pamana-green bg-pamana-green/20 text-white"
                            : "border-white/10 bg-white/5 text-green-200 hover:bg-white/10 hover:border-white/30"
                        )}
                      >
                        Female {character === 'Babae' && <Check className="w-4 h-4 text-pamana-green" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-white/10">
                    <label className="text-sm text-green-300 font-medium">Music</label>
                    <div className="flex items-center justify-between p-4 rounded-xl border-2 border-white/10 bg-white/5">
                      <div className="flex items-center gap-3 text-green-200">
                        <Music className="w-5 h-5 text-pamana-green" />
                        <span className="font-medium">Background Music</span>
                      </div>
                      <button
                        onClick={toggleMusic}
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          musicEnabled ? "bg-pamana-green/80" : "bg-white/20"
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                            musicEnabled ? "translate-x-7" : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-green-200/50 text-sm mt-6 italic">
                  Other settings for audio and visuals are coming soon.
                </p>
              </section>
            </div>

            {/* RIGHT: Notifications (2 columns) */}
            <div className="md:col-span-2">
              <section className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-pamana-green/30 hover:bg-white/10 transition-all duration-300 h-full">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-pamana-green" />
                  Notifications
                </h2>
                <p className="text-green-200 text-sm">
                  Notification settings (to be added).
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}