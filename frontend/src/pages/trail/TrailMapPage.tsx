import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { Progress } from '@/components/ui/progress'
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/modal'
import { useCelebration } from '@/components/feedback/Celebration'
import api from '@/lib/api'
import type { ModuleProgress } from '@/types'
import { MEDAL_STYLES, getMedalTier } from '@/lib/medals'
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
  const [displayPercent, setDisplayPercent] = useState(0)
  const celebrate = useCelebration()
  const hasCelebratedRef = useRef(false)

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

  // Grow the bar from 0 to the saved progress once the data is in.
  useEffect(() => {
    if (isLoading) return
    const id = window.setTimeout(() => setDisplayPercent(overallPercent), 120)
    return () => window.clearTimeout(id)
  }, [isLoading, overallPercent])

  // Confetti once when the learner first lands on a fully completed trail.
  useEffect(() => {
    if (isLoading || hasCelebratedRef.current) return
    if (completedCount === totalModules) {
      hasCelebratedRef.current = true
      void celebrate('large')
    }
  }, [isLoading, completedCount, totalModules, celebrate])

  const sortedProgress = [...moduleProgress].sort((a, b) => a.moduleNumber - b.moduleNumber)

  const activeModule = sortedProgress.filter(p => p.isUnlocked && !p.isComplete).pop()?.moduleNumber 
    || sortedProgress.filter(p => p.isUnlocked).pop()?.moduleNumber 
    || 1

  const character = localStorage.getItem('pamana_character') || 'Lalaki'

  const isBoy = character === 'Lalaki'
  const markerComplete = displayPercent >= 100
  const markerSrc = markerComplete
    ? isBoy
      ? '/images/boy_complete.png'
      : '/images/girl_complete.png'
    : isBoy
      ? '/images/boy_walking-transparent.png'
      : '/images/girl_walking-transparent.png'
  const markerPercent = Math.min(97, Math.max(3, displayPercent))

  const handleModuleClick = async (node: TrailNode) => {
    const progress = getProgress(node.moduleNumber)
    if (!progress?.isUnlocked) return

    if (progress?.isComplete) {
      // Allow retry of any completed module — show confirmation modal directly
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
      setToastMessage("Nagkaroon ng error sa pag-reset ng module. Subukan muli. (An error occurred while resetting the module. Please try again.)")
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
      const medal = getMedalTier(progress?.accuracy ?? null)
      const medalStyle = MEDAL_STYLES[medal]
      bgColor = medalStyle.bgColor
      ringColor = medalStyle.ringColor
      icon = <Star className="w-10 h-10 text-[#FDD835] fill-[#FDD835]" />
    } else if (isActive && isUnlocked) {
      bgColor = 'bg-[#E88C30]'
      icon = (
        <img 
          src={character === 'Lalaki' ? '/images/M_User.png' : '/images/F_User.png'} 
          alt="Character Avatar" 
          width={56}
          height={56}
          decoding="async"
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
          {isComplete && progress?.accuracy != null && (
            <div className={cn(
              "text-[10px] font-bold mt-1 leading-none",
              MEDAL_STYLES[getMedalTier(progress.accuracy)].textColor
            )}>
              ⭐ {Math.round(progress.accuracy)}%
            </div>
          )}
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
                width={1408}
                height={768}
                decoding="async"
                fetchPriority="high"
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
              <div className="relative">
                <Progress
                  value={displayPercent}
                  className="h-4 bg-green-900/50 rounded-full overflow-hidden [&>div]:bg-gradient-to-r [&>div]:from-green-300 [&>div]:to-green-500 [&>div]:rounded-full [&>div]:transition-all [&>div]:duration-1000 [&>div]:ease-out"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 -translate-y-[85%] transition-[left] duration-1000 ease-out"
                  style={{ left: `${markerPercent}%` }}
                >
                  <img
                    src={markerSrc}
                    alt=""
                    draggable={false}
                    className={cn(
                      'object-contain drop-shadow-lg',
                      markerComplete
                        ? 'h-16 w-16 animate-bounce-in sm:h-20 sm:w-20'
                        : 'h-12 w-12 animate-float sm:h-14 sm:w-14'
                    )}
                  />
                </div>
              </div>
            </div>
            <div className="font-bold text-white text-lg w-16 text-right">{overallPercent}%</div>
          </div>
          <p className="sr-only">
            {completedCount} ng {totalModules} na module ang natapos
          </p>
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

      {/* Retake confirmation dialog */}
      <Modal
        open={confirmModal.isOpen && Boolean(confirmModal.node)}
        onOpenChange={(open) => {
          if (!open) setConfirmModal({ isOpen: false, node: null })
        }}
      >
        <ModalContent className="max-w-md text-center">
          <div className="w-16 h-16 bg-pamana-gold/20 text-pamana-gold rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 fill-current" aria-hidden="true" />
          </div>
          <ModalTitle className="text-2xl mb-2">Ulitin ang Module</ModalTitle>
          <ModalDescription>
            Gusto mo bang ulitin ang{' '}
            <strong className="text-white">
              Module {confirmModal.node?.moduleNumber}
            </strong>
            ? Magsisimula muli ang mga gawain, ngunit mananatili ang iyong
            kasalukuyang score at medalya. Mapapalitan lamang ito kapag
            natapos mo ang bagong pagsubok na may mas mataas na score.
          </ModalDescription>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setConfirmModal({ isOpen: false, node: null })}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-green-100 bg-white/10 hover:bg-white/20 border border-white/15 transition-colors"
            >
              Kanselahin
            </button>
            <button
              type="button"
              onClick={handleConfirmRetake}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-green-950 bg-pamana-gold hover:bg-pamana-gold/90 shadow-md shadow-pamana-gold/20 transition-all active:scale-95"
            >
              Oo, Ulitin
            </button>
          </div>
        </ModalContent>
      </Modal>
    </AppShell>
  )
}