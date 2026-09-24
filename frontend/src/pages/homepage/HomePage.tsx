import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Map, Award, BookOpen, ChevronRight, Trophy, Lock, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import type { ModuleProgress } from '@/types'

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
    { id: 1, title: 'Syllable Matching', moduleNum: 1, route: '/mastery/1', bgImage: '/images/Farm.png' },
    { id: 2, title: 'Word Matching', moduleNum: 2, route: '/mastery/2', bgImage: '/images/Garden.png' },
    { id: 3, title: 'Image Matching', moduleNum: 3, route: '/mastery/3', bgImage: '/images/Kitchen.png' },
    { id: 4, title: 'Sentence Creation', moduleNum: 4, route: '/mastery/4', bgImage: '/images/House.png' },
  ]

  const handleMasteryClick = (item: typeof masteryItems[0]) => {
    if (isUnlocked(item.moduleNum)) {
      navigate(item.route)
    } else {
      setToastMessage(`Tapusin muna ang Module ${item.moduleNum} sa Pamana Trail upang mabuksan ang Mastery!`)
      setTimeout(() => setToastMessage(null), 3500)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* CHALLENGES Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-pamana-green" />
            <h1 className="text-5xl md:text-6xl font-bold text-white font-heading tracking-tight">
              CHALLENGES
            </h1>
          </div>
          <p className="text-green-200 mt-2">
            Test your skills and unlock new levels.
          </p>
        </div>

        {/* 2-Column Layout: Beginner + Mastery - MORE BALANCED */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {/* LEFT: Beginner - TRAIL MAP (takes 3 columns) */}
          <div className="md:col-span-3">
            <div className="flex items-center gap-3 text-green-300 mb-3">
              <Map className="w-6 h-6 text-pamana-green" />
              <span className="font-semibold text-xl">Beginner</span>
            </div>
            <div 
              className="relative overflow-hidden rounded-2xl p-8 border border-white/10 hover:border-pamana-green/50 hover:shadow-2xl hover:shadow-pamana-green/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer group h-[290px] flex items-center"
              onClick={() => navigate('/trail')}
            >
              {/* Background image */}
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/TrailMap.png')" }} />
              {/* Overlay */}
              <div className="absolute inset-0 bg-green-950/60 group-hover:bg-green-950/40 transition-colors duration-300" />

              {/* Content */}
              <div className="relative z-10 flex items-center justify-between w-full">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-pamana-green/20 rounded-2xl group-hover:bg-pamana-green/30 group-hover:scale-125 transition-all duration-300">
                    <Map className="w-10 h-10 text-pamana-green group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-2xl group-hover:text-pamana-white group-hover:scale-105 transition-all duration-300">
                      TRAIL MAP
                    </p>
                    <p className="text-green-200/80 text-base mt-1 group-hover:text-green-300 transition-colors duration-300">
                      Start your learning journey
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-7 h-7 text-green-200/60 group-hover:text-pamana-green group-hover:translate-x-3 group-hover:scale-125 transition-all duration-300" />
              </div>
            </div>
          </div>

          {/* RIGHT: Mastery - 4 squares (takes 2 columns) - BIGGER */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 text-green-300 mb-3">
              <Award className="w-6 h-6 text-pamana-green" />
              <span className="font-semibold text-xl">Mastery</span>
            </div>
            <div className="grid grid-cols-2 gap-3 h-[280px]">
              {masteryItems.map((item) => {
                const unlocked = isUnlocked(item.moduleNum)
                return (
                  <div
                    key={item.id}
                    className={`relative overflow-hidden p-3 rounded-xl border transition-all duration-300 cursor-pointer text-center flex flex-col items-center justify-center group ${
                      unlocked
                        ? 'border-emerald-400/50 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/25 hover:scale-[1.02]'
                        : 'border-white/10 hover:border-amber-500/40 opacity-85 hover:opacity-100'
                    }`}
                    onClick={() => handleMasteryClick(item)}
                  >
                    {/* Background image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url('${item.bgImage}')` }}
                    />
                    {/* Overlay */}
                    <div
                      className={`absolute inset-0 transition-colors duration-300 ${
                        unlocked
                          ? 'bg-green-950/60 group-hover:bg-green-950/40'
                          : 'bg-black/75 backdrop-blur-[1.5px]'
                      }`}
                    />

                    {/* Lock badge or Unlocked indicator */}
                    <div className="absolute top-2 right-2 z-20">
                      {unlocked ? (
                        <span className="flex items-center gap-1 bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          Bukas
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 bg-black/60 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                          <Lock className="w-3 h-3 text-amber-400" />
                          Lock
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full pt-1">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                          unlocked
                            ? 'bg-emerald-500/20 text-emerald-200 group-hover:bg-emerald-500/30 group-hover:text-white'
                            : 'bg-white/10 text-stone-300'
                        }`}
                      >
                        {unlocked ? item.id : <Lock className="w-5 h-5 text-amber-300" />}
                      </div>
                      <p
                        className={`text-xs font-semibold mt-1.5 transition-all duration-300 ${
                          unlocked
                            ? 'text-green-100 group-hover:text-white'
                            : 'text-stone-300'
                        }`}
                      >
                        {item.title}
                      </p>
                      {!unlocked && (
                        <span className="text-[10px] text-amber-300/90 font-medium mt-0.5">
                          Module {item.moduleNum}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="h-10"></div>

        {/* STORY Section */}
        <div>
          <div className="flex items-center gap-3 text-green-300 mb-3">
            <BookOpen className="w-6 h-6 text-pamana-green" />
            <span className="font-semibold text-xl">STORY</span>
          </div>
          <div 
            className="bg-gradient-to-r from-pamana-green/10 to-transparent rounded-2xl p-6 border border-pamana-green/20 hover:border-pamana-green/40 hover:bg-pamana-green/10 hover:shadow-2xl hover:shadow-pamana-green/20 hover:scale-[1.01] transition-all duration-300 cursor-pointer group"
            onClick={() => console.log('Open Story')}
          >
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold text-2xl group-hover:text-pamana-green group-hover:scale-105 transition-all duration-300">
                Pamana Story
              </p>
              <ChevronRight className="w-7 h-7 text-pamana-green group-hover:translate-x-3 group-hover:scale-125 transition-all duration-300" />
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 border-2 border-amber-500/70 text-amber-200 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce-in text-sm font-bold backdrop-blur-md">
            <Lock className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Extra spacing at bottom */}
        <div className="h-12"></div>

      </div>
    </div>
  )
}

export default HomePage