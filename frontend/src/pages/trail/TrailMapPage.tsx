import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import api from '@/lib/api'
import type { ModuleProgress } from '@/types'
import { Lock, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrailNode {
  moduleNumber: number
  title: string
  titleFil: string
  x: number // left %
  y: number // top %
}

const TRAIL_NODES: TrailNode[] = [
  { moduleNumber: 1, titleFil: 'Pantig', title: 'Pakinggan at Kilalanin', x: 14, y: 54 },
  { moduleNumber: 2, titleFil: 'Salita', title: 'Basahin at Unawain', x: 38, y: 34 },
  { moduleNumber: 3, titleFil: 'Talasalitaan', title: 'Salitang Pamilya', x: 62, y: 43 },
  { moduleNumber: 4, titleFil: 'Pangungusap', title: 'Bumuo ng Pangungusap', x: 87, y: 26 },
]

export const TrailMapPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, node: TrailNode | null }>({ isOpen: false, node: null })

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await api.get(`/modules/progress/${user?.id}`)
        setModuleProgress(response.data)
      } catch {
        setModuleProgress([
          { moduleNumber: 1, isUnlocked: true, isComplete: false, accuracy: null },
          { moduleNumber: 2, isUnlocked: false, isComplete: false, accuracy: null },
          { moduleNumber: 3, isUnlocked: false, isComplete: false, accuracy: null },
          { moduleNumber: 4, isUnlocked: false, isComplete: false, accuracy: null },
        ])
      } finally {
        setIsLoading(false)
      }
    }
    if (user?.id) fetchProgress()
  }, [user?.id])

  const getProgress = (moduleNumber: number) =>
    moduleProgress.find((p) => p.moduleNumber === moduleNumber)

  const checkIsComplete = (moduleNumber: number) => {
    const p = getProgress(moduleNumber)
    const nextP = getProgress(moduleNumber + 1)
    return p?.isComplete || (p?.isUnlocked && nextP?.isUnlocked) || false
  }

  const completedCount = TRAIL_NODES.filter(node => checkIsComplete(node.moduleNumber)).length
  const totalModules = 4
  const overallPercent = Math.round((completedCount / totalModules) * 100)

  const sortedProgress = [...moduleProgress].sort((a, b) => a.moduleNumber - b.moduleNumber)

  const activeModule = sortedProgress.filter(p => p.isUnlocked && !p.isComplete).pop()?.moduleNumber 
    || sortedProgress.filter(p => p.isUnlocked).pop()?.moduleNumber 
    || 1

  const character = localStorage.getItem('pamana_character') || 'Lalaki'

  const handleModuleClick = async (node: TrailNode) => {
    const progress = getProgress(node.moduleNumber)
    if (!progress?.isUnlocked) return

    const isModule4Complete = getProgress(4)?.isComplete ?? false

    if (progress?.isComplete) {
      if (!isModule4Complete) {
        setToastMessage("Tatapusin muna ang buong Pamana Trail (Module 1 hanggang 4) bago ma-ulit ang aralin na ito para sa Mastery Mode!")
        setTimeout(() => setToastMessage(null), 4000)
        return
      }
      setConfirmModal({ isOpen: true, node })
    } else {
      navigate(`/modules/${node.moduleNumber}`)
    }
  }

  const handleConfirmRetake = async () => {
    if (!confirmModal.node) return
    try {
      await api.delete(`/modules/reset/${user?.id}/${confirmModal.node.moduleNumber}`)
      navigate(`/modules/${confirmModal.node.moduleNumber}`)
    } catch (e) {
      console.error("Failed to reset module", e)
      setToastMessage("Nagkaroon ng error sa pag-reset ng module. Subukan muli.")
      setTimeout(() => setToastMessage(null), 4000)
    } finally {
      setConfirmModal({ isOpen: false, node: null })
    }
  }

  const renderNodeButton = (node: TrailNode) => {
    const progress = getProgress(node.moduleNumber)
    const isUnlocked = progress?.isUnlocked ?? false
    const isComplete = checkIsComplete(node.moduleNumber)
    const isActive = activeModule === node.moduleNumber

    if (isComplete) {
      return (
        <div 
          key={node.moduleNumber} 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-auto"
          style={{ left: `${node.x}%`, top: `${node.y}%`, zIndex: 10 }}
        >
          <button
            onClick={() => handleModuleClick(node)}
            disabled={!isUnlocked}
            title={node.title}
            className={cn(
              "w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center transition-all duration-300",
              isUnlocked ? 'cursor-pointer hover:scale-105 active:translate-y-1' : 'cursor-not-allowed opacity-90'
            )}
          >
            <img 
              src="/images/Done-Module.png" 
              alt="Completed" 
              className="w-full h-full object-contain drop-shadow-md" 
            />
          </button>

          {/* BRIGHT YELLOW 3D LABEL */}
          <div className="relative bg-gradient-to-b from-[#FFEE58] to-[#FBC02D] px-4 py-2 rounded-2xl shadow-[0_5px_0_#F57F17] text-center border-2 border-[#F57F17] min-w-[130px] transition-transform hover:-translate-y-1">
            <div className="text-[11px] font-black text-[#E65100] uppercase tracking-wide leading-none mb-1.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">
              Module {node.moduleNumber}
            </div>
            <div className="text-base font-extrabold text-white leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              {node.titleFil}
            </div>
          </div>
        </div>
      )
    }

    let bgColor = 'bg-transparent'
    let ringColor = 'ring-transparent'
    let icon = <img src="/images/Lock-Module.png" alt="Locked" className="w-full h-full object-contain drop-shadow-md" />

    if (isActive && isUnlocked) {
      bgColor = 'bg-[#E88C30]'
      ringColor = 'ring-[#D17621]'
      icon = (
        <img 
          src={character === 'Lalaki' ? '/images/M_User.png' : '/images/F_User.png'} 
          alt="Character Avatar" 
          className="w-16 h-16 md:w-20 md:h-20 object-cover object-top rounded-full scale-110 border-2 border-orange-200/50 shadow-sm" 
        />
      )
    }

    return (
      <div 
        key={node.moduleNumber} 
        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-auto"
        style={{ left: `${node.x}%`, top: `${node.y}%`, zIndex: 10 }}
      >
        <button
          onClick={() => handleModuleClick(node)}
          disabled={!isUnlocked}
          title={node.title}
          className={cn(
            "w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center shadow-[0_6px_0_rgba(0,0,0,0.15)] transition-all duration-300 ring-4",
            bgColor, ringColor,
            isUnlocked ? 'cursor-pointer hover:scale-105 active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.15)]' : 'cursor-not-allowed opacity-90'
          )}
        >
          {icon}
        </button>

        {/* BRIGHT YELLOW 3D LABEL */}
        <div className="relative bg-gradient-to-b from-[#FFEE58] to-[#FBC02D] px-4 py-2 rounded-2xl shadow-[0_5px_0_#F57F17] text-center border-2 border-[#F57F17] min-w-[130px] transition-transform hover:-translate-y-1">
          <div className="text-[11px] font-black text-[#E65100] uppercase tracking-wide leading-none mb-1.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">
            Module {node.moduleNumber}
          </div>
          <div className="text-base font-extrabold text-white leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            {node.titleFil}
          </div>
        </div>
      </div>
    )
  }

  return (
    <AppShell>
      <div className="relative w-full h-full overflow-hidden bg-[#eef4eb]">
        
        {/* Full Bleed Map Image */}
        <img 
          src="/images/TrailMap1.jpg" 
          alt="Trail Map"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/9 pointer-events-none z-0" />

        {/* Top Header (Floating) */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-start pointer-events-none">
          
           {/* Module Button (Top Left) */}
          <button
            onClick={() => {
              // navigate('/modules')
            }}
            title="View Modules"
            className="absolute left-20 top-2 pointer-events-auto cursor-pointer hover:scale-110 hover:-translate-y-1 hover:drop-shadow-xl active:scale-95 active:translate-y-1 transition-all duration-200"
          >
            <img 
              src="/images/Module-btn.png" 
              alt="Modules Button" 
              className="h-12 md:h-14 w-auto object-contain drop-shadow-[0_6px_4px_rgba(0,0,0,0.5)]" 
            />
          </button>

          {/* TRAIL MAP Title (Centered) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 pointer-events-auto mt-2">
            <img 
              src="/images/TM.png" 
              alt="Trail Map" 
              className="h-14 md:h-16 lg:h-20 w-auto object-contain drop-shadow-md" 
            />
          </div>
        </div>

        {/* Map Nodes Overlay */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-pamana-green border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            TRAIL_NODES.map(renderNodeButton)
          )}
        </div>

      {/* Floating Kids Game Progress Bar (Bottom) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-20 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-full px-6 py-4 flex items-center gap-6 shadow-[0_12px_35px_rgba(0,0,0,0.25),inset_0_2px_6px_rgba(255,255,255,0.8)] border-[5px] border-amber-200">
          
          {/* Static Progress Icon (Made Smaller) */}
          <div className="relative flex-shrink-0">
            <img 
              src="/images/Progress-Icon.png" 
              alt="Progress Icon" 
              className="relative w-10 h-10 md:w-14 md:h-14 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)]" 
            />
          </div>
          
          {/* Chunky 3D Inset Track */}
          <div className="flex-1 h-9 md:h-12 bg-amber-100/80 rounded-full overflow-hidden shadow-[inset_0_6px_10px_rgba(0,0,0,0.15)] border-4 border-amber-300 relative p-1">
            
            {/* 3D Vibrant Yellow/Gold Fill */}
            <div 
              className="h-full bg-gradient-to-b from-yellow-300 via-amber-400 to-orange-500 rounded-full transition-all duration-700 ease-out shadow-[inset_0_3px_5px_rgba(255,255,255,0.7),0_2px_4px_rgba(0,0,0,0.2)] relative overflow-hidden flex items-center justify-end pr-2"
              style={{ width: `${Math.max(overallPercent, 6)}%` }} // Ensures minimum width so gloss doesn't break at 0%
            >
              {/* Animated Glossy Shimmer Sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]"></div>

              {/* Glossy top highlight */}
              <div className="absolute top-1 left-3 right-3 h-2 bg-white/60 rounded-full blur-[0.5px]"></div>
              
              {/* Optional mini star docked at the tip of the bar for extra game flair */}
              <div className="relative z-10 w-5 h-5 md:w-7 md:h-7 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-amber-300">
                <span className="text-[10px] md:text-xs">⭐</span>
              </div>
            </div>
          </div>
          
          {/* Playful Chunky Percentage Text */}
          <div className="flex items-center justify-end min-w-[5ch]">
            <span className="font-black text-amber-500 text-3xl md:text-4xl tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.15)] [-webkit-text-stroke:1px_#b45309]">
              {overallPercent}%
            </span>
          </div>
          
        </div>
      </div>

      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-800 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700">
            <Lock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <p className="font-medium">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && confirmModal.node && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 fill-current" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Mastery Mode</h2>
              <p className="text-gray-600">
                Gusto mo bang ulitin ang <strong className="text-gray-800">Module {confirmModal.node.moduleNumber}</strong>? Ang iyong panibagong score ay marerekord.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal({ isOpen: false, node: null })}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Kanselahin
              </button>
              <button 
                onClick={handleConfirmRetake}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all active:scale-95"
              >
                Oo, Ulitin
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}