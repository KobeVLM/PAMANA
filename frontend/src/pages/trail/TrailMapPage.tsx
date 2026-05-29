import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { Progress } from '@/components/ui/progress'
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
  { moduleNumber: 1, titleFil: 'Pantig', title: 'Pakinggan at Kilalanin', x: 20, y: 75 },
  { moduleNumber: 2, titleFil: 'Salita', title: 'Basahin at Unawain', x: 38, y: 45 },
  { moduleNumber: 3, titleFil: 'Talasalitaan', title: 'Salitang Pamilya', x: 62, y: 65 },
  { moduleNumber: 4, titleFil: 'Pangungusap', title: 'Bumuo ng Pangungusap', x: 80, y: 35 },
]

const DECORATIONS = [
  { top: '20%', left: '15%', size: 'text-4xl' },
  { top: '65%', left: '10%', size: 'text-3xl' },
  { top: '80%', left: '45%', size: 'text-4xl' },
  { top: '25%', left: '55%', size: 'text-5xl' },
  { top: '75%', left: '85%', size: 'text-3xl' },
  { top: '45%', left: '92%', size: 'text-4xl' },
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
        // Default: only module 1 unlocked
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

  const completedCount = moduleProgress.filter((p) => p.isComplete).length
  const totalModules = 4
  const overallPercent = Math.round((completedCount / totalModules) * 100)

  // Find the highest unlocked module that is not complete, or fallback to the max unlocked
  const activeModule = moduleProgress.filter(p => p.isUnlocked && !p.isComplete).pop()?.moduleNumber 
    || moduleProgress.filter(p => p.isUnlocked).pop()?.moduleNumber 
    || 1;

  const activeNode = TRAIL_NODES.find(n => n.moduleNumber === activeModule) || TRAIL_NODES[0];

  const handleModuleClick = async (node: TrailNode) => {
    const progress = getProgress(node.moduleNumber)
    if (!progress?.isUnlocked) return

    const isModule4Complete = getProgress(4)?.isComplete ?? false;

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
    const isComplete = progress?.isComplete ?? false
    const isActive = activeModule === node.moduleNumber

    // Styles based on status matching the provided image
    let bgColor = 'bg-[#E3D5C1]' // Locked beige
    let icon = <Lock className="w-8 h-8 text-[#A89A86]" />
    let ringColor = 'ring-[#D0C2AE]'

    if (isComplete) {
      bgColor = 'bg-[#2B6D4F]' // Dark green
      icon = <Star className="w-10 h-10 text-[#FDD835] fill-[#FDD835]" />
      ringColor = 'ring-[#1F543C]'
    } else if (isActive && isUnlocked) {
      bgColor = 'bg-[#E88C30]' // Orange
      icon = <div className="text-4xl leading-none pt-1">👦🏼</div> // Boy avatar
      ringColor = 'ring-[#D17621]'
    }

    return (
      <div 
        key={node.moduleNumber} 
        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
        style={{ left: `${node.x}%`, top: `${node.y}%`, zIndex: 10 }}
      >
        <button
          onClick={() => handleModuleClick(node)}
          disabled={!isUnlocked}
          title={node.title}
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center shadow-[0_6px_0_rgba(0,0,0,0.15)] transition-all duration-300 ring-4",
            bgColor, ringColor,
            isUnlocked ? 'cursor-pointer hover:scale-105 active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.15)]' : 'cursor-not-allowed opacity-90'
          )}
        >
          {icon}
        </button>

        <div className="bg-white px-3 py-1.5 rounded-2xl shadow-md text-center border-2 border-gray-100 min-w-[110px]">
          <div className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Module {node.moduleNumber}</div>
          <div className="text-sm font-extrabold text-gray-700 leading-none">{node.titleFil}</div>
        </div>
      </div>
    )
  }

  return (
    <AppShell>
      <div className="p-4 lg:p-6 max-w-5xl mx-auto flex flex-col h-full min-h-[calc(100vh-80px)]">
        
        {/* Top Progress Bar matching the image */}
        <div className="bg-[#FFF8E7] rounded-3xl p-4 flex items-center gap-4 mb-6 shadow-sm border-2 border-[#EEDFB6]">
          <div className="text-3xl drop-shadow-sm">🏡</div>
          <div className="font-bold text-gray-800 text-lg w-16">Sala</div>
          <div className="flex-1 px-2">
            <Progress 
              value={overallPercent} 
              className="h-5 bg-[#E6D6B3] [&>div]:bg-[#F28C28] rounded-full" 
            />
          </div>
          <div className="font-extrabold text-gray-800 text-lg">{overallPercent}%</div>
          <div className="text-3xl drop-shadow-sm">🚪</div>
        </div>

        {/* The Map Container */}
        <div className="flex-1 w-full bg-[#EAF0D8] rounded-3xl border-4 border-white/40 shadow-xl overflow-x-auto overflow-y-hidden relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-pamana-green border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="min-w-[800px] h-[500px] sm:h-full sm:min-h-[500px] relative w-full">
              
              {/* Winding Dirt Path SVG */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Thick base road */}
                <path 
                  d="M 15 100 
                     Q 20 85, 20 75 
                     Q 20 45, 38 45 
                     Q 62 45, 62 65 
                     Q 62 35, 80 35 
                     Q 90 35, 90 15" 
                  fill="none" 
                  stroke="#E3D5C1" 
                  strokeWidth="14" 
                  strokeLinecap="round" 
                />
                {/* Inner road color */}
                <path 
                  d="M 15 100 
                     Q 20 85, 20 75 
                     Q 20 45, 38 45 
                     Q 62 45, 62 65 
                     Q 62 35, 80 35 
                     Q 90 35, 90 15" 
                  fill="none" 
                  stroke="#D8C8B0" 
                  strokeWidth="10" 
                  strokeLinecap="round" 
                />
              </svg>

              {/* Palm Tree Decorations */}
              {DECORATIONS.map((d, i) => (
                <div key={i} className={`absolute drop-shadow-md ${d.size} pointer-events-none select-none`} style={{ top: d.top, left: d.left, zIndex: 5 }}>
                  🌴
                </div>
              ))}

              {/* Start (Pasukan) Marker */}
              <div className="absolute transform -translate-x-1/2 flex flex-col items-center" style={{ left: '15%', top: '88%', zIndex: 10 }}>
                <div className="bg-white px-3 py-1 rounded-full shadow-md font-bold text-gray-500 text-xs border-2 border-gray-100">
                  Pasukan
                </div>
              </div>

              {/* End (Sala) Marker */}
              <div className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: '90%', top: '15%', zIndex: 10 }}>
                <div className="text-5xl drop-shadow-lg mb-1">🏡</div>
                <div className="bg-white px-3 py-1.5 rounded-2xl shadow-md font-extrabold text-gray-700 text-sm border-2 border-gray-100 min-w-[80px] text-center">
                  Sala
                </div>
              </div>

              {/* Render Modules along the path */}
              {TRAIL_NODES.map(renderNodeButton)}

              {/* Walking Character - appears next to active module */}
              <div 
                className="absolute text-5xl transition-all duration-1000 ease-in-out drop-shadow-xl animate-bounce pointer-events-none"
                style={{ left: `${activeNode.x - 7}%`, top: `${activeNode.y + 4}%`, zIndex: 20 }}
              >
                🚶🏽
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
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
