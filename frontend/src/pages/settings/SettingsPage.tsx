import React, { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/contexts/AuthContext'
import { User, Bell, Paintbrush, Check, Music, Copy, Star } from 'lucide-react'
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
      <div className="min-h-screen bg-gradient-to-b from-[#87CEEB] to-[#98FB98] p-4 md:p-8 pb-20">
        <div className="max-w-5xl mx-auto relative z-10 pt-4">
          
          {/* Header Section */}
          <div className="mb-10 flex flex-col items-center justify-center text-center">
            <img
              src="/images/ST.png"
              alt="Settings"
              className="h-20 md:h-28 object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.3)] mb-2"
            />
            <p className="text-[#2b5c3b] font-bold text-lg md:text-xl mt-2 bg-white/70 px-6 py-1 rounded-full border-2 border-white shadow-sm">
              Manage your account and customize your game!
            </p>
          </div>

          <div className="space-y-8">
            
            {/* PROFILE SECTION - Deeper Green for better contrast */}
            <section className="bg-[#4CAF50] border-[6px] border-white rounded-[2.5rem] p-6 md:p-8 shadow-[0_10px_0_#2E7D32] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 rounded-t-[2.5rem] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-[0_2px_0_#1B5E20] flex items-center gap-3">
                    <User className="w-8 h-8 text-yellow-300 drop-shadow-md" strokeWidth={3} />
                    YOUR PROFILE
                  </h2>
                  <div className="hidden sm:block">
                    <Star className="w-8 h-8 text-yellow-300 fill-yellow-300 drop-shadow-md" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                  <div className="space-y-2">
                    {/* Changed label text to white/light for contrast */}
                    <label className="text-sm text-[#E8F5E9] font-black uppercase tracking-wider ml-2">Name</label>
                    <div className="p-4 bg-[#f4f9f0] rounded-2xl border-4 border-[#388E3C] text-[#1B5E20] font-black text-lg shadow-inner">
                      {user?.name || 'Loading...'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[#E8F5E9] font-black uppercase tracking-wider ml-2">Email</label>
                    <div className="p-4 bg-[#f4f9f0] rounded-2xl border-4 border-[#388E3C] text-[#1B5E20] font-bold text-lg shadow-inner truncate">
                      {user?.email || 'Loading...'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[#E8F5E9] font-black uppercase tracking-wider ml-2">Role</label>
                    <div className="p-4 bg-[#f4f9f0] rounded-2xl border-4 border-[#388E3C] text-[#1B5E20] font-black text-lg capitalize shadow-inner">
                      {user?.role?.toLowerCase() || 'Loading...'}
                    </div>
                  </div>
                </div>

                {user?.role === 'LEARNER' && (
                  <div className="p-5 md:p-6 rounded-[1.5rem] bg-[#FFF8E1] border-[5px] border-[#FFC107] flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_6px_0_#D4A017]">
                    <div className="w-full">
                      <div className="text-sm text-[#8B5A2B] font-black uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Star className="w-5 h-5 fill-[#FFC107] text-[#FFC107]" /> 
                        Student Code (ID para sa Magulang)
                      </div>
                      <div className="font-mono text-sm md:text-base text-[#5D4037] bg-white px-4 py-3 rounded-xl border-2 border-[#FFC107] select-all inline-block break-all font-black shadow-sm w-full">
                        {user?.id}
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className={cn(
                        "px-6 py-3 rounded-2xl font-black text-xl flex items-center justify-center gap-2 transition-all w-full md:w-auto shrink-0 border-4",
                        copiedCode 
                          ? "bg-[#4CAF50] text-white border-white shadow-[0_6px_0_#2E7D32]" 
                          : "bg-gradient-to-b from-[#FFB74D] to-[#FF9800] text-white border-white shadow-[0_6px_0_#E65100] hover:brightness-110 active:border-b-0 active:translate-y-1.5 active:shadow-none"
                      )}
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-6 h-6 stroke-[4]" />
                          <span>Kopyado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-6 h-6 stroke-[3]" />
                          <span>Kopyahin</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* PREFERENCES - Deeper Blue */}
              <section className="bg-[#00B0FF] border-[6px] border-white rounded-[2.5rem] p-6 md:p-8 shadow-[0_10px_0_#0083B0] relative overflow-hidden flex flex-col">
                <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 rounded-t-[2.5rem] pointer-events-none" />
                
                <div className="relative z-10 flex-1 flex flex-col">
                  <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-[0_2px_0_#005A7A] flex items-center gap-3 mb-8">
                    <Paintbrush className="w-8 h-8 text-yellow-300 drop-shadow-md" strokeWidth={3} />
                    PREFERENCES
                  </h2>

                  <div className="space-y-8 flex-1">
                    <div className="space-y-3">
                      <label className="text-sm text-[#E1F5FE] font-black uppercase tracking-wider ml-2">Choose your character</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => handleCharacterChange('Lalaki')}
                          className={cn(
                            "flex flex-col items-center justify-center py-4 rounded-2xl font-black text-xl transition-all duration-150 border-4",
                            character === 'Lalaki'
                              ? "bg-[#FFC107] border-white text-[#5D4037] shadow-[0_6px_0_#D4A017] translate-y-0"
                              : "bg-white/30 border-white/40 text-white shadow-[0_6px_0_rgba(0,0,0,0.15)] hover:bg-white/40 active:translate-y-1 active:shadow-none"
                          )}
                        >
                          <span className="text-4xl mb-1">👦</span>
                          Male 
                          {character === 'Lalaki' && <Check className="w-6 h-6 stroke-[4] mt-1 text-[#5D4037]" />}
                        </button>
                        <button
                          onClick={() => handleCharacterChange('Babae')}
                          className={cn(
                            "flex flex-col items-center justify-center py-4 rounded-2xl font-black text-xl transition-all duration-150 border-4",
                            character === 'Babae'
                              ? "bg-[#FFC107] border-white text-[#5D4037] shadow-[0_6px_0_#D4A017] translate-y-0"
                              : "bg-white/30 border-white/40 text-white shadow-[0_6px_0_rgba(0,0,0,0.15)] hover:bg-white/40 active:translate-y-1 active:shadow-none"
                          )}
                        >
                          <span className="text-4xl mb-1">👧</span>
                          Female 
                          {character === 'Babae' && <Check className="w-6 h-6 stroke-[4] mt-1 text-[#5D4037]" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 pt-6 border-t-4 border-white/30 mt-auto">
                      <label className="text-sm text-[#E1F5FE] font-black uppercase tracking-wider ml-2">Music</label>
                      <div className="flex items-center justify-between p-4 rounded-2xl border-4 border-white bg-white/30 shadow-inner">
                        <div className="flex items-center gap-3 text-white">
                          <div className="bg-white/20 p-2 rounded-xl">
                            <Music className="w-6 h-6 text-white" strokeWidth={3} />
                          </div>
                          <span className="font-black text-lg drop-shadow-sm">Background Music</span>
                        </div>
                        <button
                          onClick={toggleMusic}
                          className={cn(
                            "w-20 h-10 rounded-full border-4 border-white transition-all duration-300 relative shadow-inner",
                            musicEnabled ? "bg-[#4CAF50]" : "bg-gray-400"
                          )}
                        >
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full bg-white absolute top-0.5 transition-transform duration-300 shadow-md flex items-center justify-center",
                              musicEnabled ? "translate-x-10" : "translate-x-0.5"
                            )}
                          >
                            {musicEnabled && <Check className="w-5 h-5 text-[#4CAF50] stroke-[4]" />}
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ALERTS - Deeper Purple */}
              <section className="bg-[#AB47BC] border-[6px] border-white rounded-[2.5rem] p-6 md:p-8 shadow-[0_10px_0_#7B1FA2] relative overflow-hidden flex flex-col">
                <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 rounded-t-[2.5rem] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-[0_2px_0_#4A148C] flex items-center gap-3 mb-8">
                    <Bell className="w-8 h-8 text-yellow-300 drop-shadow-md" strokeWidth={3} />
                    ALERTS
                  </h2>
                  
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white/10 rounded-[1.5rem] border-4 border-dashed border-white/40">
                    <div className="bg-white/20 p-4 rounded-full mb-4">
                      <Bell className="w-12 h-12 text-white drop-shadow-md" strokeWidth={2.5} />
                    </div>
                    <p className="text-white font-black text-lg drop-shadow-[0_2px_0_#4A148C]">
                      Notification settings will be added in a future update!
                    </p>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}