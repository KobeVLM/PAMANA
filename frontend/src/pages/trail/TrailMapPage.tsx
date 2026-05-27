import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import api from '@/lib/api'
import type { ModuleProgress } from '@/types'
import { Lock, CheckCircle2, PlayCircle, Star, Sparkles, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrailNode {
  moduleNumber: number
  title: string
  titleFil: string
  location: string
  description: string
  icon: string
  route: string
  color: string
  bgColor: string
}

const TRAIL_NODES: TrailNode[] = [
  {
    moduleNumber: 1,
    title: 'Pakinggan at Kilalanin',
    titleFil: 'Pinto ng Probinsya',
    location: 'Entrance Gate',
    description: 'Matuto ng mga tunog at pantig ng Filipino',
    icon: '🎵',
    route: '/modules/1',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-500/20',
  },
  {
    moduleNumber: 2,
    title: 'Basahin at Unawain',
    titleFil: 'Hardin ni Lola',
    location: "Lola's Garden",
    description: 'Kilalanin ang mga salita tungkol sa katawan',
    icon: '🌸',
    route: '/modules/2',
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-500/20',
  },
  {
    moduleNumber: 3,
    title: 'Salitang Pamilya',
    titleFil: 'Kusina ni Lolo',
    location: "Lolo's Kitchen",
    description: 'Alamin ang mga salita tungkol sa pamilya',
    icon: '🍚',
    route: '/modules/3',
    color: 'from-orange-500 to-amber-600',
    bgColor: 'bg-orange-500/20',
  },
  {
    moduleNumber: 4,
    title: 'Bumuo ng Pangungusap',
    titleFil: 'Sala ng Tagpuan',
    location: 'Living Room',
    description: 'Buuin ang mga pangungusap para makausap ang mga magulang',
    icon: '🗣️',
    route: '/modules/4',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/20',
  },
]

export const TrailMapPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<number | null>(null)

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

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-heading font-bold text-white mb-1">
                Pamana Trail 🗺️
              </h1>
              <p className="text-green-300 text-base">
                Kamusta, <span className="text-pamana-gold font-semibold">{user?.name}</span>!
                Ipagpatuloy ang iyong paglalakbay.
              </p>
            </div>
            <Badge className="bg-pamana-gold/20 text-pamana-gold border border-pamana-gold/40 px-4 py-2 text-sm font-bold">
              <Star className="w-4 h-4 mr-1.5" />
              {completedCount}/{totalModules} Natapos
            </Badge>
          </div>

          {/* Overall progress bar */}
          <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-300 text-sm font-medium">Kabuuang Pag-unlad</span>
              <span className="text-white font-bold text-sm">{overallPercent}%</span>
            </div>
            <Progress value={overallPercent} className="h-3 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-pamana-green [&>div]:to-emerald-400" />
          </div>
        </div>

        {/* NPC Welcome */}
        <div className="mb-8 p-5 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl flex-shrink-0 animate-float">
            👴
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-pamana-gold font-bold text-sm">Lolo</span>
              <button className="text-green-400 hover:text-green-300 transition-colors" aria-label="Pakinggan si Lolo">
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-green-100 text-sm leading-relaxed">
              "Maligayang pagdating sa aming probinsya! Piliin ang lugar na gusto mong puntahan at matuto ng wikang Filipino. Kaya mo yan!"
            </p>
          </div>
        </div>

        {/* Trail Nodes */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {TRAIL_NODES.map((node, idx) => {
              const progress = getProgress(node.moduleNumber)
              const isUnlocked = progress?.isUnlocked ?? false
              const isComplete = progress?.isComplete ?? false
              const accuracy = progress?.accuracy

              return (
                <div key={node.moduleNumber}>
                  {/* Trail connector */}
                  {idx > 0 && (
                    <div className="flex justify-center my-1">
                      <div
                        className={cn(
                          'w-0.5 h-8 rounded-full transition-colors',
                          getProgress(idx)?.isComplete ? 'bg-pamana-green' : 'bg-white/20'
                        )}
                      />
                    </div>
                  )}

                  {/* Module Card */}
                  <button
                    onClick={() => {
                      if (isUnlocked) {
                        if (selectedNode === node.moduleNumber) {
                          navigate(node.route)
                        } else {
                          setSelectedNode(node.moduleNumber)
                        }
                      }
                    }}
                    disabled={!isUnlocked}
                    className={cn(
                      'w-full text-left p-5 rounded-2xl border transition-all duration-300',
                      'flex items-center gap-4 group',
                      isUnlocked
                        ? 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30 hover:scale-[1.01] cursor-pointer'
                        : 'bg-white/5 border-white/10 opacity-60 cursor-not-allowed',
                      selectedNode === node.moduleNumber && isUnlocked && 'ring-2 ring-pamana-gold bg-white/15 scale-[1.01]'
                    )}
                    aria-label={isUnlocked ? `Pumunta sa ${node.titleFil}` : `Naka-lock ang ${node.titleFil}`}
                  >
                    {/* Module icon / status */}
                    <div
                      className={cn(
                        'w-16 h-16 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform',
                        `bg-gradient-to-br ${node.color}`,
                        isUnlocked && 'group-hover:scale-110',
                        !isUnlocked && 'grayscale'
                      )}
                    >
                      {isComplete ? '✅' : node.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className={cn(
                          'font-heading font-bold text-base',
                          isUnlocked ? 'text-white' : 'text-white/50'
                        )}>
                          {node.titleFil}
                        </h3>
                        <Badge variant="outline" className={cn(
                          'text-xs border',
                          isComplete
                            ? 'bg-pamana-green/20 text-green-300 border-green-500/40'
                            : isUnlocked
                            ? 'bg-white/10 text-green-300 border-white/20'
                            : 'bg-white/5 text-white/30 border-white/10'
                        )}>
                          Module {node.moduleNumber}
                        </Badge>
                      </div>
                      <p className={cn('text-xs mb-1', isUnlocked ? 'text-green-300' : 'text-white/30')}>
                        {node.location} · {node.title}
                      </p>
                      <p className={cn('text-xs leading-snug', isUnlocked ? 'text-white/60' : 'text-white/20')}>
                        {node.description}
                      </p>
                      {accuracy !== null && accuracy !== undefined && (
                        <div className="mt-2 flex items-center gap-2">
                          <Progress
                            value={accuracy}
                            className="h-1.5 flex-1 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-pamana-green [&>div]:to-emerald-400"
                          />
                          <span className="text-xs text-green-400 font-medium whitespace-nowrap">
                            {accuracy}% tama
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status icon */}
                    <div className="flex-shrink-0">
                      {isComplete ? (
                        <CheckCircle2 className="w-7 h-7 text-pamana-green" />
                      ) : isUnlocked ? (
                        <PlayCircle className={cn(
                          'w-7 h-7 text-pamana-gold transition-transform',
                          'group-hover:scale-110'
                        )} />
                      ) : (
                        <Lock className="w-7 h-7 text-white/30" />
                      )}
                    </div>
                  </button>

                  {/* Expanded start button */}
                  {selectedNode === node.moduleNumber && isUnlocked && !isComplete && (
                    <div className="mt-2 px-2 animate-bounce-in">
                      <button
                        onClick={() => navigate(node.route)}
                        className={cn(
                          'w-full py-3 rounded-xl font-bold text-white text-sm',
                          `bg-gradient-to-r ${node.color}`,
                          'shadow-lg transition-all duration-200 hover:opacity-90 active:scale-95'
                        )}
                      >
                        <Sparkles className="inline w-4 h-4 mr-1.5" />
                        Simulan ang {node.titleFil}!
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Reunion ending teaser (all modules complete) */}
        {completedCount === totalModules && (
          <div className="mt-8 p-6 bg-gradient-to-r from-pamana-gold/20 to-amber-500/20 border border-pamana-gold/30 rounded-2xl text-center animate-bounce-in">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-white font-heading font-bold text-xl mb-2">Tagumpay! Natapos mo na!</h3>
            <p className="text-green-200 text-sm">
              Nakapag-usap ka na sa iyong mga magulang sa Filipino. Salamat sa pagbabahagi ng pamana!
            </p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
