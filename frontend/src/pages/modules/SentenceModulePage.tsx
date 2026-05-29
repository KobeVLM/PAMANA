import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { ArrowLeft, GripVertical, CheckCircle2, XCircle } from 'lucide-react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

interface SentenceTask {
  taskId: string
  tier: 1 | 2
  scrambledWords: string[]
  correctOrder: string[]
  audioUrl: string
  sentence: string
}

interface DraggableWordProps {
  word: string
  index: number
  onMove: (from: number, to: number) => void
  isPlaced: boolean
}

const DraggableWord: React.FC<DraggableWordProps> = ({ word, index, onMove, isPlaced }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'WORD',
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }))

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'WORD',
    drop: (item: { index: number }) => onMove(item.index, index),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }))

  return (
    <div
      ref={(node) => { drag(node); drop(node) }}
      className={cn(
        'flex items-center gap-2 px-4 py-3 rounded-xl border-2 cursor-grab active:cursor-grabbing',
        'min-h-[52px] font-heading font-bold text-base transition-all duration-200',
        'select-none',
        isPlaced
          ? 'bg-pamana-green/20 border-pamana-green/50 text-green-200'
          : 'bg-white/10 border-white/20 text-white',
        isDragging && 'opacity-40 scale-95',
        isOver && 'border-pamana-gold bg-pamana-gold/10 scale-105',
        'hover:bg-white/20 hover:border-white/40'
      )}
    >
      <GripVertical className="w-4 h-4 text-white/40 flex-shrink-0" />
      <span>{word}</span>
    </div>
  )
}

export const SentenceModulePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [task, setTask] = useState<SentenceTask | null>(null)
  const [orderedWords, setOrderedWords] = useState<string[]>([])
  const [tier, setTier] = useState<1 | 2>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [showReunionEnding, setShowReunionEnding] = useState(false)
  const [showTierAnnouncement, setShowTierAnnouncement] = useState(false)
  const [taskIndex, setTaskIndex] = useState(0) // 0-based index within current tier
  const TOTAL_TASKS_PER_TIER = 5

  const fetchTask = useCallback(async (tierNum: 1 | 2, currentIndex?: number) => {
    setIsLoading(true)
    setFeedback(null)
    setAttempts(0)
    try {
      const res = await api.get(`/sentences/task?userId=${user?.id}&tier=${tierNum}`)
      if (res.data) {
        setTask({ ...res.data, correctOrder: res.data.correctOrder ?? [] })
        setOrderedWords([...res.data.scrambledWords])
        if (currentIndex !== undefined) setTaskIndex(currentIndex)
      }
    } catch {
      // Fallback mock
      const mock: SentenceTask = {
        taskId: 'mock-task-1',
        tier: tierNum,
        scrambledWords: tierNum === 1
          ? ['maliit', 'ang', 'Malaki', 'at', 'mata', 'ko']
          : ['mo?', 'Malaki', 'ang', 'ba', 'mata'],
        correctOrder: tierNum === 1
          ? ['Malaki', 'at', 'maliit', 'ang', 'mata', 'ko']
          : ['Malaki', 'ba', 'ang', 'mata', 'mo?'],
        audioUrl: '/audio/sentences/sample.mp3',
        sentence: tierNum === 1
          ? 'Malaki at maliit ang mata ko.'
          : 'Malaki ba ang mata mo?',
      }
      setTask(mock)
      setOrderedWords([...mock.scrambledWords])
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) fetchTask(1, 0)
  }, [user?.id, fetchTask])

  const handleMove = useCallback((from: number, to: number) => {
    setOrderedWords((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!task || isSubmitting) return
    const isCorrect = orderedWords.join(' ') === (task.correctOrder ?? []).join(' ')
    setFeedback(isCorrect ? 'correct' : 'incorrect')
    const newAttempts = attempts + 1
    setAttempts(newAttempts)
    const accuracy = isCorrect ? 100 : Math.max(0, 100 - (newAttempts * 25))

    setIsSubmitting(true)
    try {
      const res = await api.post('/sentences/progress', {
        userId: user?.id,
        taskId: task.taskId,
        submittedOrder: orderedWords,
        accuracy,
      })

      if (res.data.moduleComplete) {
        setTimeout(() => setShowReunionEnding(true), 1500)
      } else if (isCorrect && res.data.tierComplete && tier === 1) {
        // Tier 1 complete → show announcement before Tier 2
        setTimeout(() => {
          setShowTierAnnouncement(true)
        }, 1500)
      } else if (isCorrect) {
        // More tasks in same tier - fetch next
        const nextIndex = taskIndex + 1
        setTimeout(() => fetchTask(tier, nextIndex), 1500)
      }
    } catch {
      if (isCorrect) {
        setTimeout(() => {
          if (tier === 1) { setShowTierAnnouncement(true) }
          else setShowReunionEnding(true)
        }, 1500)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [task, isSubmitting, orderedWords, attempts, user?.id, tier, taskIndex, fetchTask])

  const handleStartTier2 = useCallback(() => {
    setShowTierAnnouncement(false)
    setTier(2)
    fetchTask(2, 0)
  }, [fetchTask])

  // ── Tier 2 announcement screen ──────────────────────────────────────────
  if (showTierAnnouncement) {
    return (
      <AppShell>
        <div className="min-h-full flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-6">
            <div className="text-6xl animate-bounce">🌟</div>
            <div className="p-6 bg-pamana-green/20 border border-pamana-green/40 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-pamana-gold/30 flex items-center justify-center text-2xl">👵</div>
                <span className="text-pamana-gold font-bold">Lola</span>
              </div>
              <p className="text-white text-lg font-heading font-bold leading-relaxed">
                "Napakahusay mo, apo! Handa na tayo sa susunod na hamon!"
              </p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-green-300 font-semibold text-sm mb-1">✅ Tier 1: Paturol — Natapos na!</p>
              <p className="text-white/70 text-sm">Susunod: Tier 2 — Patanong (Tanong)</p>
              <p className="text-white/50 text-xs mt-1">Gawing tanong ang mga pangungusap!</p>
            </div>
            <audio src="/audio/tier2_unlock.mp3" />
            <button
              onClick={handleStartTier2}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-pamana-gold to-amber-500 text-white font-bold text-base hover:opacity-90 transition-opacity"
            >
              Simulan ang Tier 2! →
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  // ── Reunion ending screen ────────────────────────────────────────────────
  if (showReunionEnding) {
    return (
      <AppShell>
        <div className="min-h-full flex items-center justify-center p-8">
          <div className="max-w-md text-center animate-bounce-in">
            <div className="text-6xl mb-4">🎊</div>
            <h2 className="text-3xl font-heading font-bold text-white mb-3">Tagpuan!</h2>
            <div className="text-5xl mb-4">👨‍👩‍👧</div>
            <p className="text-green-200 text-base leading-relaxed mb-6">
              Nagawa mo! Nakausap mo na ang iyong mga magulang sa Filipino.
              Ipinagmamalaki ka ng iyong pamilya!
            </p>
            <div className="p-4 bg-pamana-gold/20 border border-pamana-gold/40 rounded-2xl mb-6">
              <p className="text-pamana-gold italic">
                "Anak, ipinagmamalaki kita. Natuto ka ng wikang Filipino at naihanda ka ng pamana ng aming wika."
              </p>
              <p className="text-white/60 text-sm mt-2">— Lolo at Lola</p>
            </div>
            <button onClick={() => navigate('/trail')} className="w-full py-3 rounded-xl bg-gradient-to-r from-pamana-gold to-amber-500 text-white font-bold">
              Bumalik sa Pamana Trail 🏠
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <DndProvider backend={HTML5Backend}>
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          <button onClick={() => navigate('/trail')} className="flex items-center gap-2 text-green-300 hover:text-white transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Pamana Trail</span>
          </button>

          <div className="mb-4">
            <h1 className="text-2xl font-heading font-bold text-white mb-0.5">Module 4: Bumuo ng Pangungusap</h1>
            <p className="text-green-400 text-sm">Sala ng Tagpuan · {tier === 1 ? 'Paturol (Pahayag)' : 'Patanong (Tanong)'}</p>
          </div>

          {/* Tier badges + Task counter */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-3">
              {[1, 2].map((t) => (
                <Badge
                  key={t}
                  className={cn(
                    'px-3 py-1.5 text-xs border',
                    tier === t
                      ? 'bg-pamana-gold/20 border-pamana-gold text-pamana-gold'
                      : tier > t
                      ? 'bg-green-500/20 border-green-500/40 text-green-300'
                      : 'bg-white/5 border-white/10 text-white/30'
                  )}
                >
                  {t === 1 ? 'Tier 1: Paturol' : 'Tier 2: Patanong'}
                </Badge>
              ))}
            </div>
            {/* Task progress counter */}
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-xs font-medium">
                Gawain {Math.min(taskIndex + 1, TOTAL_TASKS_PER_TIER)} ng {TOTAL_TASKS_PER_TIER}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: TOTAL_TASKS_PER_TIER }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all',
                      i < taskIndex ? 'bg-green-400' : i === taskIndex ? 'bg-pamana-gold' : 'bg-white/20'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-pamana-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : task ? (
            <div className="space-y-6">
              <NPCDialogue
                npc="lolo"
                line={tier === 1
                  ? 'Ayusin ang mga salita para bumuo ng pangungusap! I-drag ang mga salita sa tamang pagkakasunod.'
                  : 'Gawing tanong ang pangungusap! Paano mo itatanong ito kay Lolo?'
                }
              />

              {/* Audio player */}
              <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                <AudioPlayer audioUrl={task.audioUrl} size="sm" label="Pakinggan ang pangungusap" />
                <p className="text-green-300 text-sm">Pakinggan ang tamang pagkakasunod</p>
              </div>

              {/* Draggable word tiles */}
              <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-green-300 text-xs mb-3 font-medium">I-drag ang mga salita sa tamang pagkakasunod:</p>
                <div className="flex flex-wrap gap-2">
                  {orderedWords.map((word, idx) => (
                    <DraggableWord
                      key={`${word}-${idx}`}
                      word={word}
                      index={idx}
                      onMove={handleMove}
                      isPlaced={false}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-white/40 text-xs mb-1">Iyong pangungusap:</p>
                <p className="text-white font-heading font-bold text-lg">
                  {orderedWords.join(' ')}
                </p>
              </div>

              {/* Feedback */}
              {feedback && (
                <div className={cn(
                  'p-4 rounded-xl border flex items-center gap-3 animate-bounce-in',
                  feedback === 'correct'
                    ? 'bg-green-500/20 border-green-500/40'
                    : 'bg-red-500/20 border-red-500/40'
                )}>
                  {feedback === 'correct'
                    ? <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  }
                  <div>
                    <p className={cn('font-semibold text-sm', feedback === 'correct' ? 'text-green-300' : 'text-red-300')}>
                      {feedback === 'correct' ? '✅ Tama! Napakahusay!' : '❌ Mali. Subukan ulit!'}
                    </p>
                    {feedback === 'incorrect' && attempts >= 3 && (
                      <p className="text-yellow-300 text-xs mt-1">
                        💡 Tamang sagot: <strong>{task.correctOrder.join(' ')}</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || feedback === 'correct'}
                className={cn(
                  'w-full py-4 rounded-xl font-bold text-white text-base transition-all duration-200',
                  'bg-gradient-to-r from-pamana-green to-emerald-500',
                  'hover:opacity-90 active:scale-95',
                  (isSubmitting || feedback === 'correct') && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isSubmitting ? 'Sinusuri...' : 'Isumite ang Pangungusap'}
              </button>

              {attempts > 0 && feedback !== 'correct' && (
                <p className="text-center text-yellow-400/70 text-xs">
                  Pagsubok {attempts}/3 · {attempts < 3 ? `Pa-${3 - attempts} bago lumabas ang pahiwatig` : 'Lalabas na ang tamang sagot sa itaas'}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </DndProvider>
    </AppShell>
  )
}
