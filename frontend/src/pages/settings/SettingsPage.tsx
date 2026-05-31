import React, { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/contexts/AuthContext'
import { Settings, User, Bell, Paintbrush, Check, Music } from 'lucide-react'
import { cn } from '@/lib/utils'

export const SettingsPage: React.FC = () => {
  const { user } = useAuth()
  const [character, setCharacter] = useState<'Lalaki' | 'Babae'>('Lalaki')
  const [musicEnabled, setMusicEnabled] = useState(true)

  useEffect(() => {
    const savedChar = localStorage.getItem('pamana_character')
    if (savedChar === 'Lalaki' || savedChar === 'Babae') {
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
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-heading font-bold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-pamana-gold" />
          Mga Setting
        </h1>
        
        <p className="text-green-200">
          I-manage ang iyong account at mga katangian ng app dito.
        </p>

        <div className="grid gap-6 mt-8">
          {/* Section: Profile */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-green-400" />
              Profile
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-green-300 font-medium">Pangalan</label>
                  <div className="p-3 bg-white/5 rounded-lg text-white">
                    {user?.name || 'Loading...'}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-green-300 font-medium">Username</label>
                  <div className="p-3 bg-white/5 rounded-lg text-white">
                    {user?.name || 'Loading...'}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-green-300 font-medium">Role</label>
                  <div className="p-3 bg-white/5 rounded-lg text-white capitalize">
                    {user?.role?.toLowerCase() || 'Loading...'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Preferences */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
              <Paintbrush className="w-5 h-5 text-green-400" />
              Mga Katangian (Preferences)
            </h2>
            
            <div className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <label className="text-sm text-green-300 font-medium">Piliin ang Iyong Karakter</label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <button
                    onClick={() => handleCharacterChange('Lalaki')}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all",
                      character === 'Lalaki' 
                        ? "border-pamana-gold bg-indigo-500/20 text-white" 
                        : "border-white/10 bg-white/5 text-green-200 hover:bg-white/10"
                    )}
                  >
                    Lalaki {character === 'Lalaki' && <Check className="w-4 h-4 text-pamana-gold" />}
                  </button>
                  <button
                    onClick={() => handleCharacterChange('Babae')}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all",
                      character === 'Babae' 
                        ? "border-pamana-gold bg-pink-500/20 text-white" 
                        : "border-white/10 bg-white/5 text-green-200 hover:bg-white/10"
                    )}
                  >
                    Babae {character === 'Babae' && <Check className="w-4 h-4 text-pamana-gold" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-white/10">
                <label className="text-sm text-green-300 font-medium">Musika</label>
                <div className="flex items-center justify-between p-4 rounded-xl border-2 border-white/10 bg-white/5">
                  <div className="flex items-center gap-3 text-green-200">
                    <Music className="w-5 h-5" />
                    <span className="font-medium">Background Music</span>
                  </div>
                  <button 
                    onClick={toggleMusic}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      musicEnabled ? "bg-pamana-gold/80" : "bg-white/20"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                      musicEnabled ? "translate-x-7" : "translate-x-1"
                    )} />
                  </button>
                </div>
              </div>
            </div>
            
            <p className="text-green-200/50 text-sm mt-6 italic">
              Ang ibapang settings para sa audio at visuals ay paparating pa lamang.
            </p>
          </section>

          {/* Section: Notifications (Placeholder) */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-green-400" />
              Notipikasyon
            </h2>
            <p className="text-green-200 text-sm">
              Mga notification settings (Paparating pa lamang).
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
