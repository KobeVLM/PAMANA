import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { Progress } from '@/components/ui/progress'
import api from '@/lib/api'
import type { ModuleProgress } from '@/types'
import { Lock, Star, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrailNode {
  moduleNumber: number
  title: string
  titleFil: string
  x: number // left %
  y: number // top %
}

const TRAIL_NODES: TrailNode[] = [
  { moduleNumber: 1, titleFil: 'Pantig', title: 'Pakinggan at Kilalanin', x: 14, y: 49 },
  { moduleNumber: 2, titleFil: 'Salita', title: 'Basahin at Unawain', x: 38, y: 24 },
  { moduleNumber: 3, titleFil: 'Talasalitaan', title: 'Salitang Pamilya', x: 62, y: 38 },
  { moduleNumber: 4, titleFil: 'Pangungusap', title: 'Bumuo ng Pangungusap', x: 87, y: 21 },
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

  const completedCount = moduleProgress.filter((p) => p.isComplete).length
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
    const isComplete = progress?.isComplete ?? false
    const isActive = activeModule === node.moduleNumber

    let bgColor = 'bg-[#E3D5C1]'
    let icon = <Lock className="w-8 h-8 text-[#A89A86]" />
    let ringColor = 'ring-[#D0C2AE]'

    if (isComplete) {
      bgColor = 'bg-[#2B6D4F]'
      icon = <Star className="w-10 h-10 text-[#FDD835] fill-[#FDD835]" />
      ringColor = 'ring-[#1F543C]'
    } else if (isActive && isUnlocked) {
      bgColor = 'bg-[#E88C30]'
      icon = (
        <img 
          src={character === 'Lalaki' ? '/images/M_User.png' : '/images/F_User.png'} 
          alt="Character Avatar" 
          className="w-14 h-14 object-cover object-top rounded-full scale-110 border-2 border-orange-200/50 shadow-sm" 
        />
      )
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
      <div className="p-4 lg:p-6 max-w-7xl mx-auto flex flex-col h-full min-h-[calc(100vh-80px)]">
        
        {/* TRAIL MAP Title */}
        <div className="text-center mb-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white font-heading tracking-tight inline-flex items-center gap-3">
            TRAIL MAP
          </h1>
        </div>

        {/* Map Container – fills available space */}
        <div className="flex-1 w-full bg-green-900/30 border-4 border-white/10 shadow-xl overflow-hidden relative rounded-2xl">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-pamana-green border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <img 
                src="/images/TrailMap.png" 
                alt="Trail Map"
                className="w-full h-full object-cover object-center"
              />
              
              {/* Overlay container for module nodes */}
              <div className="absolute inset-0 w-full h-full">
                {TRAIL_NODES.map(renderNodeButton)}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar Box – below map */}
        <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-pamana-green flex-shrink-0" />
            <div className="flex-1">
              <Progress 
                value={overallPercent} 
                className="h-4 bg-green-900/50 rounded-full overflow-hidden"
                indicatorClassName="bg-gradient-to-r from-green-300 to-green-500 rounded-full transition-all duration-500"
              />
            </div>
            <div className="font-bold text-white text-lg w-16 text-right">{overallPercent}%</div>
          </div>
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