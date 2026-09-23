import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { AppShell } from '@/components/layout/AppShell'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  Sparkles,
  Home,
  CheckCircle2,
  XCircle,
  GripVertical,
  ChevronRight,
  MousePointerClick,
  Undo2,
} from 'lucide-react'

export interface SentenceTask {
  taskId: string
  scrambledWords: string[]
  correctOrder: string[]
  audioUrl: string
  tier: number
  completed: boolean
}

const NPC_LINE = 'Ayusin ang mga salita upang bumuo ng tamang pangungusap! Maaari mong i-drag o i-click ang mga salita para pagpalitin ang ayos.'
const NPC_AUDIO = '/static/assets/audio/npc/lolo_mod4_intro_tier1.mp3'
const MAX_ROUNDS = 3

/**
 * Fallback static tasks if backend API is unreachable or returns 204.
 */
const FALLBACK_TASKS: SentenceTask[] = [
  {
    taskId: 'mock-sentence-1',
    tier: 1,
    scrambledWords: ['si', 'Ako', 'Lolo'],
    correctOrder: ['Ako', 'si', 'Lolo'],
    audioUrl: '/static/assets/audio/npc/sentence_1.mp3',
    completed: false,
  },
  {
    taskId: 'mock-sentence-2',
    tier: 1,
    scrambledWords: ['si', 'Nanay', 'Kumain'],
    correctOrder: ['Kumain', 'si', 'Nanay'],
    audioUrl: '/static/assets/audio/npc/sentence_2.mp3',
    completed: false,
  },
  {
    taskId: 'mock-sentence-3',
    tier: 1,
    scrambledWords: ['ang', 'bahay', 'Malinis'],
    correctOrder: ['Malinis', 'ang', 'bahay'],
    audioUrl: '/static/assets/audio/npc/sentence_3.mp3',
    completed: false,
  },
  {
    taskId: 'mock-sentence-4',
    tier: 1,
    scrambledWords: ['Ate', 'si', 'Bumasa'],
    correctOrder: ['Bumasa', 'si', 'Ate'],
    audioUrl: '/static/assets/audio/npc/sentence_4.mp3',
    completed: false,
  },
  {
    taskId: 'mock-sentence-5',
    tier: 1,
    scrambledWords: ['si', 'Kuya', 'Uminom'],
    correctOrder: ['Uminom', 'si', 'Kuya'],
    audioUrl: '/static/assets/audio/npc/sentence_5.mp3',
    completed: false,
  },
]

/**
 * Ensure the words are genuinely scrambled relative to correctOrder.
 */
const prepareScrambled = (words: string[], correctOrder: string[]): string[] => {
  const scrambled = [...words]
  if (scrambled.length <= 1) return scrambled

  let attempts = 0
  while (scrambled.join(' ') === correctOrder.join(' ') && attempts < 10) {
    scrambled.sort(() => Math.random() - 0.5)
    attempts++
  }
  return scrambled
}

interface DraggableWordProps {
  word: string
  index: number
  onMove: (from: number, to: number) => void
  onSelect: (index: number) => void
  isSelected: boolean
  disabled: boolean
}

const DraggableWord: React.FC<DraggableWordProps> = ({
  word,
  index,
  onMove,
  onSelect,
  isSelected,
  disabled,
}) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'WORD',
      item: { index },
      canDrag: !disabled,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [index, disabled]
  )

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: 'WORD',
      canDrop: () => !disabled,
      drop: (item: { index: number }) => {
        if (item.index !== index) {
          onMove(item.index, index)
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [index, disabled, onMove]
  )

  return (
    <div
      ref={(node) => {
        drag(node)
        drop(node)
      }}
      onClick={() => {
        if (!disabled) onSelect(index)
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect(index)
        }
      }}
      className={cn(
        'game-tile flex items-center gap-2.5 px-5 py-3.5 rounded-2xl border-2 transition-all duration-200 select-none min-h-[56px] text-base sm:text-lg font-heading font-bold shadow-md',
        disabled
          ? 'cursor-default opacity-85'
          : 'cursor-grab active:cursor-grabbing hover:border-pamana-gold/70 hover:scale-105 active:scale-95',
        isDragging && 'opacity-30 scale-95 border-pamana-gold',
        isOver && 'border-pamana-gold bg-pamana-gold/20 scale-110 shadow-lg ring-2 ring-pamana-gold',
        isSelected
          ? 'bg-pamana-gold/30 border-pamana-gold text-amber-200 ring-2 ring-pamana-gold shadow-lg shadow-amber-500/20 scale-105 animate-pulse'
          : 'bg-white/10 border-white/20 text-white'
      )}
    >
      <GripVertical
        className={cn(
          'w-4 h-4 flex-shrink-0 transition-colors',
          isSelected ? 'text-amber-300' : 'text-white/40'
        )}
      />
      <span>{word}</span>
    </div>
  )
}

export const SentencePracticePage: React.FC = () => {
  const navigate = useNavigate()

  const [task, setTask] = useState<SentenceTask | null>(null)
  const [arranged, setArranged] = useState<string[]>([])
  const [initialScrambled, setInitialScrambled] = useState<string[]>([])
  const [selectedSwapIndex, setSelectedSwapIndex] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [usedTaskIds, setUsedTaskIds] = useState<string[]>([])

  const hasPlayedIntroRef = useRef(false)
  const wrongAudioRef = useRef<HTMLAudioElement | null>(null)

  // Ensure intro is only auto-played once on initial session start
  useEffect(() => {
    hasPlayedIntroRef.current = true
  }, [])

  // Preload wrong audio SFX
  useEffect(() => {
    try {
      if (!wrongAudioRef.current && typeof Audio !== 'undefined') {
        wrongAudioRef.current = new Audio('/audio/sfx/wrong.mp3')
        wrongAudioRef.current.preload = 'auto'
      }
    } catch {
      // Audio not supported in environment
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wrongAudioRef.current) {
        wrongAudioRef.current.pause()
      }
    }
  }, [])

  // Play subtle victory chime on correct answer without blocking UI
  const playVictorySound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const now = ctx.currentTime

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, start)

        gain.gain.setValueAtTime(0.12, start)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(start)
        osc.stop(start + duration)
      }

      // Pleasant two-note subtle chime (G5 -> C6)
      playTone(783.99, now, 0.2)
      playTone(1046.5, now + 0.1, 0.3)
    } catch {
      // Audio synthesis not supported or blocked
    }
  }, [])

  /**
   * Fetch a task for the current round, using API or cycling through fallback pool.
   */
  const loadRoundTask = useCallback(async (currentRound: number, excludedIds: string[]) => {
    setIsLoading(true)
    setSubmitted(false)
    setIsCorrect(null)
    setSelectedSwapIndex(null)

    let loadedTask: SentenceTask | null = null

    try {
      const res = await api.get<SentenceTask>('/sentences/task', { params: { tier: 1 } })
      if (res.data && res.data.taskId && !excludedIds.includes(res.data.taskId)) {
        loadedTask = {
          ...res.data,
          scrambledWords: res.data.scrambledWords || [],
          correctOrder: res.data.correctOrder || [],
        }
      }
    } catch {
      // Ignore API error and fall back smoothly
    }

    if (!loadedTask) {
      const availableFallbacks = FALLBACK_TASKS.filter((t) => !excludedIds.includes(t.taskId))
      if (availableFallbacks.length > 0) {
        const picked = availableFallbacks[Math.floor(Math.random() * availableFallbacks.length)]
        loadedTask = { ...picked }
      } else {
        const picked = FALLBACK_TASKS[(currentRound - 1) % FALLBACK_TASKS.length]
        loadedTask = { ...picked }
      }
    }

    const scrambled = prepareScrambled(loadedTask.scrambledWords, loadedTask.correctOrder)
    setTask(loadedTask)
    setArranged([...scrambled])
    setInitialScrambled([...scrambled])
    setUsedTaskIds((prev) => (loadedTask?.taskId ? [...prev, loadedTask.taskId] : prev))
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadRoundTask(1, [])
  }, [loadRoundTask])

  const handleMove = useCallback((from: number, to: number) => {
    setSelectedSwapIndex(null)
    setArranged((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }, [])

  const handleSelectWord = useCallback(
    (index: number) => {
      if (submitted) return
      setSelectedSwapIndex((prev) => {
        if (prev === null) {
          return index
        }
        if (prev === index) {
          return null
        }
        // Swap items at prev and index
        setArranged((words) => {
          const next = [...words]
          const temp = next[prev]
          next[prev] = next[index]
          next[index] = temp
          return next
        })
        return null
      })
    },
    [submitted]
  )

  const handleResetOrder = () => {
    if (submitted) return
    setSelectedSwapIndex(null)
    setArranged([...initialScrambled])
  }

  const handleSubmit = () => {
    if (!task || submitted) return

    const correct = arranged.join(' ') === task.correctOrder.join(' ')
    setIsCorrect(correct)
    setSubmitted(true)
    setSelectedSwapIndex(null)

    if (correct) {
      setScore((s) => s + 1)
      playVictorySound()
    } else {
      try {
        wrongAudioRef.current?.play().catch(() => {})
      } catch {
        // SFX playback error handled
      }
    }
  }

  const handleNext = () => {
    hasPlayedIntroRef.current = true
    if (round >= MAX_ROUNDS) {
      setIsComplete(true)
    } else {
      const nextRound = round + 1
      setRound(nextRound)
      loadRoundTask(nextRound, usedTaskIds)
    }
  }

  const handlePlayAgain = () => {
    hasPlayedIntroRef.current = false
    setRound(1)
    setScore(0)
    setIsComplete(false)
    setUsedTaskIds([])
    loadRoundTask(1, [])
  }

  if (isComplete) {
    const percentage = Math.round((score / MAX_ROUNDS) * 100)

    return (
      <AppShell>
        <div className="p-4 sm:p-6 lg:p-8 max-w-xl mx-auto min-h-full flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 sm:p-8 w-full text-center shadow-2xl animate-bounce-in">
            {/* Trophy Icon */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-pamana-gold to-amber-500 flex items-center justify-center shadow-lg border-2 border-white/30">
                  <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-stone-900" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-pamana-green p-2 rounded-full border-2 border-white shadow">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-2">
              Pagsasanay Tapos Na!
            </h2>
            <p className="text-green-300 text-sm mb-6">
              Matagumpay mong natapos ang {MAX_ROUNDS} pangungusap sa pagbuo ng pangungusap.
            </p>

            {/* Score Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
              <p className="text-xs uppercase tracking-wider text-green-300 mb-1 font-semibold">
                Iyong Iskor
              </p>
              <div className="text-4xl font-heading font-extrabold text-pamana-gold mb-1">
                {score} / {MAX_ROUNDS}
              </div>
              <p className="text-sm font-medium text-emerald-400">
                {percentage}% Katumpakan
              </p>
              <p className="text-xs text-white/70 mt-3">
                {percentage === 100
                  ? '🌟 Perpekto! Napakahusay mong bumuo ng mga pangungusap!'
                  : percentage >= 66
                  ? '🎉 Napakagaling! Kaunting praktis na lang at perpekto na!'
                  : '💪 Magaling na simula! Ipagpatuloy ang pagsasanay upang lalong gumaling!'}
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={handlePlayAgain}
                className="game-tile w-full min-h-[44px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-pamana-gold to-amber-500 hover:from-amber-400 hover:to-pamana-gold text-stone-900 font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Maglaro Ulit</span>
              </button>
              <button
                onClick={() => navigate('/home')}
                className="game-tile w-full min-h-[44px] py-3.5 px-6 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                <span>Bumalik sa Home</span>
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  const progressValue = (round / MAX_ROUNDS) * 100

  return (
    <AppShell>
      <DndProvider backend={HTML5Backend}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto min-h-full">
          {/* Back navigation */}
          <button
            onClick={() => navigate('/home')}
            className="game-tile flex items-center gap-2 text-green-300 hover:text-white transition-colors mb-6 group min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Bumalik sa Home</span>
          </button>

          {/* Practice Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-1">
              <h1 className="text-2xl font-heading font-bold text-white">
                Sentence Creation
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-green-300">
                  {round} / {MAX_ROUNDS}
                </span>
                <Badge variant="outline" className="text-xs border-pamana-gold/40 text-pamana-gold bg-pamana-gold/10">
                  Practice Mode
                </Badge>
              </div>
            </div>
            <p className="text-green-300 text-sm">
              Sanayin ang iyong kakayahan sa pagbuo ng mga tamang pangungusap sa Filipino.
            </p>
          </div>

          {/* Progress Card */}
          <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">
                  Pangungusap {round} ng {MAX_ROUNDS}
                </span>
                <span className="text-green-300/80 text-xs">
                  ({Math.round(progressValue)}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-pamana-gold">
                <Sparkles className="w-4 h-4" />
                <span>Iskor: {score}</span>
              </div>
            </div>
            <Progress
              value={progressValue}
              className="h-2.5 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-pamana-green [&>div]:to-emerald-400"
            />
          </div>

          {/* NPC Instruction - Lolo */}
          <div className="mb-6">
            <NPCDialogue
              npc="lolo"
              line={NPC_LINE}
              audioUrl={NPC_AUDIO}
              autoPlay={!hasPlayedIntroRef.current}
              onAudioEnd={() => {
                hasPlayedIntroRef.current = true
              }}
            />
          </div>

          {/* Main Content Area */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="w-12 h-12 border-4 border-pamana-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-green-300 font-medium">Inihahanda ang gawain...</p>
            </div>
          ) : task ? (
            <div className="space-y-6">
              {/* Audio player if audioUrl is provided */}
              {task.audioUrl && (
                <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <AudioPlayer audioUrl={task.audioUrl} size="sm" label="Pakinggan ang pangungusap" />
                  <p className="text-green-300 text-sm">Pakinggan ang tamang pagkakasunod ng pangungusap</p>
                </div>
              )}

              {/* Draggable/Swappable word tiles */}
              <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-green-300 text-xs sm:text-sm font-medium flex items-center gap-1.5">
                    <MousePointerClick className="w-4 h-4 text-pamana-gold" />
                    <span>I-drag o i-click ang dalawang salita para pagpalitin:</span>
                  </p>
                  {!submitted && (
                    <button
                      onClick={handleResetOrder}
                      className="text-xs text-white/50 hover:text-white flex items-center gap-1 transition-colors min-h-[36px] px-2 py-1 rounded-lg hover:bg-white/5"
                      title="I-reset ang pagkakasunod"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>I-reset</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5 sm:gap-3 p-3 bg-black/20 rounded-xl min-h-[76px] items-center">
                  {arranged.map((word, idx) => (
                    <DraggableWord
                      key={`${task.taskId}-${word}-${idx}`}
                      word={word}
                      index={idx}
                      onMove={handleMove}
                      onSelect={handleSelectWord}
                      isSelected={selectedSwapIndex === idx}
                      disabled={submitted}
                    />
                  ))}
                </div>

                {selectedSwapIndex !== null && !submitted && (
                  <p className="text-amber-300 text-xs animate-pulse">
                    Pumili ng isa pang salita na nais mong ipalit sa napiling salita.
                  </p>
                )}
              </div>

              {/* Current arranged sentence preview */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-white/40 text-xs mb-1 font-medium">Iyong pangungusap:</p>
                <p className="text-white font-heading font-bold text-lg sm:text-xl tracking-wide min-h-[28px]">
                  {arranged.join(' ')}
                </p>
              </div>

              {/* Feedback Banner */}
              {submitted && (
                <div
                  className={cn(
                    'p-4 rounded-2xl border flex items-center justify-between gap-3 animate-bounce-in',
                    isCorrect
                      ? 'bg-green-500/20 border-green-500/40 text-green-200'
                      : 'bg-red-500/20 border-red-500/40 text-red-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                    )}
                    <div>
                      <p className={cn('font-heading font-bold text-base', isCorrect ? 'text-green-300' : 'text-red-300')}>
                        {isCorrect ? 'Tama! Napakahusay!' : 'Mali.'}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-red-100/90 mt-0.5">
                          Tamang sagot:{' '}
                          <span className="font-semibold text-white">
                            {task.correctOrder.join(' ')}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  {task.audioUrl && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <AudioPlayer
                        audioUrl={task.audioUrl}
                        size="sm"
                        label="Pakinggan ang pangungusap"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons: Submit / Next */}
              <div>
                {!submitted ? (
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || arranged.length === 0}
                    className={cn(
                      'game-tile w-full min-h-[48px] py-3.5 px-6 rounded-xl font-heading font-bold text-base transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2',
                      'bg-gradient-to-r from-pamana-green to-emerald-500 hover:from-emerald-500 hover:to-pamana-green text-white'
                    )}
                  >
                    Isumite
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="game-tile w-full min-h-[48px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-pamana-gold to-amber-500 hover:from-amber-400 hover:to-pamana-gold text-stone-900 font-heading font-bold text-base transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>{round >= MAX_ROUNDS ? 'Tapusin' : 'Susunod'}</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-green-300">Walang available na gawain sa kasalukuyan.</p>
              <button
                onClick={() => navigate('/home')}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                Bumalik sa Home
              </button>
            </div>
          )}
        </div>
      </DndProvider>
    </AppShell>
  )
}
