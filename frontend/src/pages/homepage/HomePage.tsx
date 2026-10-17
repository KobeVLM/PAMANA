import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Lock, Play, Star } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import type { ModuleProgress } from '@/types'
import { cn } from '@/lib/utils'

const HomePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([])
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return
    const fetchProgress = async () => {
      try {
        const res = await api.get(`/modules/progress/${user.id}`)
        setModuleProgress(res.data)
      } catch (e) {
        console.warn('Could not fetch module progress', e)
      }
    }
    fetchProgress()
  }, [user?.id])

  const isUnlocked = (moduleId: number) => {
    return moduleProgress.some((p) => p.moduleNumber === moduleId && p.isComplete)
  }

  const masteryItems = [
    { 
      id: 1, 
      title: 'Syllable Matching', 
      moduleNum: 1, 
      route: '/mastery/1', 
      icon: '🐃', 
      bg: 'bg-gradient-to-b from-[#00d2ff] to-[#0096c7]', 
      shadow: 'shadow-[0_8px_0_#0077b6]' 
    },
    { 
      id: 2, 
      title: 'Word Matching', 
      moduleNum: 2, 
      route: '/mastery/2', 
      icon: '🍪', 
      bg: 'bg-gradient-to-b from-[#f5b041] to-[#d68910]', 
      shadow: 'shadow-[0_8px_0_#a66310]' 
    },
    { 
      id: 3, 
      title: 'Image Matching', 
      moduleNum: 3, 
      route: '/mastery/3', 
      icon: '🖼️', 
      bg: 'bg-gradient-to-b from-[#af7ac5] to-[#8e44ad]', 
      shadow: 'shadow-[0_8px_0_#6c3483]' 
    },
    { 
      id: 4, 
      title: 'Sentence Creation', 
      moduleNum: 4, 
      route: '/mastery/4', 
      icon: '💬', 
      bg: 'bg-gradient-to-b from-[#f1948a] to-[#e74c3c]', 
      shadow: 'shadow-[0_8px_0_#b03a2e]' 
    },
  ]

  const handleMasteryClick = (item: typeof masteryItems[0]) => {
    if (isUnlocked(item.moduleNum)) {
      navigate(item.route)
    } else {
      setToastMessage(`Tapusin muna ang Module ${item.moduleNum} sa Pamana Trail upang mabuksan ang Mastery!`)
      setTimeout(() => setToastMessage(null), 3500)
    }
  }

  // Balanced text size
  const headerStyle = "text-2xl md:text-3xl font-black text-white tracking-widest mb-3 uppercase [-webkit-text-stroke:1.5px_#1a2e05] [paint-order:stroke_fill] drop-shadow-[0_4px_0_#1a2e05]";

  return (
    <div 
      className="min-h-screen p-6 md:p-10 bg-cover bg-center bg-no-repeat relative overflow-y-auto"
      style={{ backgroundImage: "url('/images/HomeB.png')" }}
    >
      {/* Balanced top padding and max-width */}
      <div className="max-w-5xl mx-auto relative z-10 pt-6 md:pt-10 pb-8">
        
        {/* CHALLENGES IMAGE */}
        <div className="w-full flex justify-center mb-6 md:mb-8 -mt-4 md:-mt-6">
          <img
            src="/images/CH.png"
            alt="Challenges"
            className="w-[90%] max-w-[700px] object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.4)]"
          />
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 mb-10">
          
          {/* LEFT: Beginner - TRAIL MAP */}
          <div className="flex flex-col">
            <h2 className={headerStyle}>
              Beginner
            </h2>
            
            <div className="relative w-full h-[310px] md:h-[330px] rounded-[2rem] border-[6px] border-white shadow-[0_8px_0_rgba(0,0,0,0.15)] overflow-hidden group transition-all duration-200 hover:-translate-y-1 hover:brightness-105 hover:shadow-[0_12px_0_rgba(0,0,0,0.15)] active:translate-y-1 active:shadow-none cursor-pointer">
              
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/TrailMap1.png')" }} />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

              <div className="absolute top-4 left-0 w-full text-center z-10">
                <h3 className="text-3xl font-black text-white tracking-wider [-webkit-text-stroke:1.5px_#1a2e05] [paint-order:stroke_fill] drop-shadow-[0_3px_0_#1a2e05]">
                  TRAIL MAP
                </h3>
              </div>

              <div className="absolute bottom-5 left-0 w-full flex justify-center z-20">
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); 
                    navigate('/trail');
                  }}
                  className="flex items-center gap-2 bg-gradient-to-b from-[#66BB6A] to-[#4CAF50] text-white px-8 py-2.5 rounded-full border-4 border-white shadow-[0_6px_0_#2E7D32] hover:brightness-110 active:border-b-0 active:translate-y-1.5 active:shadow-none transition-all font-black text-xl tracking-wider"
                >
                  PLAY <Play className="w-5 h-5 fill-white" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Mastery */}
          <div className="flex flex-col">
            <h2 className={headerStyle}>
              Mastery
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              {masteryItems.map((item) => {
                const unlocked = isUnlocked(item.moduleNum)
                return (
                  <div
                    key={item.id}
                    onClick={() => handleMasteryClick(item)}
                    className={cn(
                      "relative h-[165px] md:h-[175px] rounded-[1.5rem] border-[5px] border-white flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-200 group",
                      item.bg,
                      unlocked 
                        ? cn(item.shadow, "hover:-translate-y-1 hover:brightness-105 active:translate-y-1 active:shadow-none") 
                        : "shadow-[0_6px_0_rgba(0,0,0,0.3)] brightness-[0.6] grayscale-[0.2] active:translate-y-1"
                    )}
                  >
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 rounded-t-[1.2rem] pointer-events-none" />

                    <div className="absolute top-2 right-2 z-20">
                      {unlocked ? (
                        <span className="bg-[#A8E6CF] text-[#1E5631] border-2 border-white px-2 py-0.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                          BUKAS <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        </span>
                      ) : (
                        <span className="bg-[#3E2723] text-white border-2 border-[#5D4037] px-2 py-0.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <img src="/images/Lock.png" alt="lock" className="w-3 h-3 md:w-4 md:h-4 object-contain brightness-150" /> LOCK
                        </span>
                      )}
                    </div>

                    <div className="relative z-10 flex items-center justify-center w-full px-4 gap-2 mt-2">
                      
                      <div className={cn(
                        "text-5xl md:text-6xl drop-shadow-lg transition-all",
                        !unlocked && "opacity-30 grayscale"
                      )}>
                        {item.icon}
                      </div>

                      {unlocked && (
                        <div className="relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rotate-12">
                          <Star className="absolute inset-0 w-full h-full text-yellow-400 fill-yellow-400 drop-shadow-md stroke-[#b45309] stroke-[2px]" />
                          <span className="relative z-10 text-white font-black text-xl md:text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] mt-0.5">
                            {item.moduleNum}
                          </span>
                        </div>
                      )}

                      {/* GLOWING AND LIGHTENED LOCK */}
                      {!unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <img 
                            src="/images/Lock.png" 
                            alt="Locked" 
                            className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.9)] brightness-150 contrast-125" 
                          />
                        </div>
                      )}
                    </div>

                    <p className="text-white font-black text-sm md:text-base drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-10 text-center px-2 leading-tight mt-1">
                      {item.title}
                    </p>

                    <div className="absolute bottom-2 right-2 flex gap-0.5 z-10">
                      <Star strokeWidth={2} className={cn("w-4 h-4 drop-shadow-sm", unlocked ? "text-yellow-300 fill-yellow-400 stroke-[#b45309]" : "text-gray-400 fill-gray-500/50 stroke-gray-600")} />
                      <Star strokeWidth={2} className={cn("w-4 h-4 drop-shadow-sm", unlocked ? "text-yellow-300 fill-yellow-400 stroke-[#b45309]" : "text-gray-400 fill-gray-500/50 stroke-gray-600")} />
                      <Star strokeWidth={2} className={cn("w-4 h-4 drop-shadow-sm", unlocked ? "text-yellow-300 fill-yellow-400 stroke-[#b45309]" : "text-gray-400 fill-gray-500/50 stroke-gray-600")} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* STORY Section */}
        <div className="w-full">
          <h2 className={headerStyle}>
            Story
          </h2>
          
          <button 
            onClick={() => console.log('Open Story')}
            className="w-full bg-gradient-to-b from-[#5BC0EB] to-[#4CA8D6] hover:brightness-110 border-[5px] border-white rounded-[1.5rem] p-2 md:p-3 flex items-center shadow-[0_6px_0_rgba(0,0,0,0.15)] transition-all active:translate-y-1 active:shadow-none group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50 pointer-events-none" />
            
            <div className="flex items-center gap-3 z-10 px-2 md:px-4">
              <div className="bg-white/30 p-2 rounded-xl backdrop-blur-sm shadow-inner">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <span className="text-xl md:text-3xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)] tracking-wide">
                Pamana Story
              </span>
            </div>

            <div className="ml-auto z-10 flex items-center gap-1 bg-white/20 hover:bg-white/30 border-2 border-white/50 px-4 py-1.5 rounded-full backdrop-blur-sm transition-colors shadow-sm">
              <span className="text-white font-black text-xl drop-shadow-md">GO</span>
              <Play className="w-6 h-6 text-white fill-white drop-shadow-md" />
            </div>
          </button>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 border-2 border-amber-500/70 text-amber-200 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce-in text-sm font-bold backdrop-blur-md">
            <Lock className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

      </div>
    </div>
  )
}

export default HomePage