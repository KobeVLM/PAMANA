import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useAudio } from '@/contexts/AudioContext'
import { WordTiles, type WordTile } from '@/components/practice/WordTiles'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { HINT_AFTER_ATTEMPTS } from '@/components/game/constants'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { useSfx } from '@/hooks/useGameAudio'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { STRINGS } from '@/lib/i18n'
import api from '@/lib/api'
import { ArrowLeft, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SentenceTask {
  taskId: string
  tier: 1 | 2
  scrambledWords: string[]
  correctOrder: string[]
  audioUrl: string
  sentence: string
}

const TOTAL_TASKS_PER_TIER = 5

const toTiles = (words: string[]): WordTile[] =>
  words.map((word, index) => ({ id: `word-${index}-${word}`, word }))

export const SentenceModulePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { playAudio, stopAudio } = useAudio()
  const { playWrong } = useSfx()

  const [tier, setTier] = useState<1 | 2>(1)
  const [taskIndex, setTaskIndex] = useState(0)
  const [task, setTask] = useState<SentenceTask | null>(null)
  const [tiles, setTiles] = useState<WordTile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [showReunionEnding, setShowReunionEnding] = useState(false)
  const [showTierAnnouncement, setShowTierAnnouncement] = useState(false)
  const [celebrate, setCelebrate] = useState(0)

  useScrollToTop(`${tier}-${taskIndex}`)

  useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [stopAudio])

  const fetchTask = useCallback(
    async (tierNum: 1 | 2) => {
      setIsLoading(true)
      setLoadError(null)
      setFeedback(null)
      setAttempts(0)
      try {
        const res = await api.get<SentenceTask>(
          `/sentences/task?userId=${user?.id}&tier=${tierNum}`
        )
        const data = res.data
        if (
          !data?.taskId ||
          !Array.isArray(data.scrambledWords) ||
          !Array.isArray(data.correctOrder)
        ) {
          throw new Error('Malformed sentence task response')
        }
        setTask(data)
        setTiles(toTiles(data.scrambledWords))
      } catch (err) {
        setLoadError(err)
      } finally {
        setIsLoading(false)
      }
    },
    [user?.id]
  )

  useEffect(() => {
    if (user?.id) void fetchTask(1)
  }, [user?.id, fetchTask])

  const handleStartTier2 = useCallback(() => {
    setShowTierAnnouncement(false)
    setTier(2)
    setTaskIndex(0)
    void fetchTask(2)
  }, [fetchTask])

  const handleSubmit = useCallback(async () => {
    if (!task || isSubmitting || feedback === 'correct') return

    const orderedWords = tiles.map((t) => t.word)
    const isCorrect = orderedWords.join(' ') === task.correctOrder.join(' ')
    const newAttempts = attempts + 1
    setFeedback(isCorrect ? 'correct' : 'incorrect')
    setAttempts(newAttempts)
    if (isCorrect) setCelebrate((count) => count + 1)
    const accuracy = isCorrect ? 100 : Math.max(0, 100 - newAttempts * 25)

    setIsSubmitting(true)

    if (isCorrect && task.audioUrl) {
      try {
        await playAudio(task.audioUrl, {
          fallbackText: task.correctOrder.join(' '),
        })
      } catch {
        // Playback failure should not block progress
      }
    } else if (!isCorrect) {
      playWrong()
    }

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
        setTimeout(() => setShowTierAnnouncement(true), 1500)
      } else if (isCorrect) {
        const nextIndex = taskIndex + 1
        setTimeout(() => {
          setTaskIndex(nextIndex)
          void fetchTask(tier)
        }, 1500)
      }
    } catch {
      toast.error('Hindi naitala ang sagot', {
        description: 'Pakitingnan ang koneksyon at subukan muli.',
      })
      setFeedback(null)
      setAttempts((a) => Math.max(0, a - 1))
    } finally {
      setIsSubmitting(false)
    }
  }, [
    task,
    isSubmitting,
    feedback,
    tiles,
    attempts,
    user?.id,
    tier,
    taskIndex,
    fetchTask,
    playAudio,
    playWrong,
  ])

  // ── Tier 2 announcement screen ──────────────────────────────────────────
  if (showTierAnnouncement) {
    return (
      <div className="min-h-screen w-full bg-[#EAF0D8] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm text-center shadow-2xl border-b-8 border-gray-200">
          <div className="animate-bounce text-6xl mb-4" aria-hidden="true">🌟</div>
          <h2 className="mb-2 font-heading text-2xl font-bold text-[#2b5c3b]">Tier 1 Complete!</h2>
          <p className="text-[#3f7d52] mb-6">Napakahusay mo, apo! Handa na tayo sa susunod na hamon!</p>
          <button
            onClick={handleStartTier2}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-6 py-4 rounded-full border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
          >
            Simulan ang Tier 2!
          </button>
        </div>
      </div>
    )
  }

  // ── Reunion ending screen ────────────────────────────────────────────────
  if (showReunionEnding) {
    return (
      <div className="min-h-screen w-full bg-[#EAF0D8] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm text-center shadow-2xl border-b-8 border-gray-200">
          <div className="mb-4 text-6xl" aria-hidden="true">🎊</div>
          <h2 className="mb-3 font-heading text-3xl font-bold text-[#2b5c3b]">Tagpuan!</h2>
          <div className="mb-4 text-5xl" aria-hidden="true">👨‍👩‍👧</div>
          <p className="text-[#3f7d52] mb-6 text-sm">
            Nagawa mo! Nakausap mo na ang iyong mga magulang sa Filipino. Ipinagmamalaki ka ng iyong pamilya!
          </p>
          <button
            onClick={() => navigate('/trail')}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-6 py-4 rounded-full border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
          >
            <Home className="w-5 h-5" />
            Bumalik sa Pamana Trail
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#EAF0D8] flex items-center justify-center">
        <LoadingState message="Inihahanda ang gawain..." />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen w-full bg-[#EAF0D8] flex items-center justify-center">
        <ErrorState description="Hindi ma-load ang gawain." onRetry={() => void fetchTask(tier)} />
      </div>
    )
  }

  if (!task) return null

  return (
    <div
      className="relative h-screen w-full bg-cover bg-center flex flex-col font-sans overflow-hidden"
      style={{ backgroundImage: "url('/images/module-bg/m-House.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/20 z-0 pointer-events-none" />

      {/* Top Bar */}
      <div className="relative w-full z-20 flex justify-between items-start p-4 md:p-6 min-h-[100px] md:min-h-[140px]">
        <button
          onClick={() => navigate('/trail')}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-4 py-2 rounded-full border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all shadow-lg z-30"
        >
          <ArrowLeft className="w-5 h-5 stroke-[3]" />
          Pamana Trail
        </button>

        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-full flex justify-center pointer-events-none pt-6 md:pt-8">
          <img
            src="/images/moduletitles/C_m4.png"
            alt="Module 4"
            className="w-[300px] md:w-[400px] lg:w-[500px] object-contain drop-shadow-2xl"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>

        <div className="flex items-center z-30">
          <div className="flex items-center bg-[#8CC63F] border-[4px] border-[#6A9C2C] rounded-full p-1.5 pr-5 shadow-[0_4px_6px_rgba(0,0,0,0.3)] w-64 md:w-[22rem] lg:w-[26rem]">
            <div className="flex-1 h-6 md:h-8 bg-[#2F6A3E] rounded-full border-[3px] border-[#204D2B] shadow-[inset_0_3px_5px_rgba(0,0,0,0.6)] overflow-hidden relative">
              <div
                className="absolute top-0 left-0 h-full bg-[#8CC63F] rounded-full transition-all duration-500 border-r-2 border-[#6A9C2C]"
                style={{ width: `${(Math.min(taskIndex + 1, TOTAL_TASKS_PER_TIER) / TOTAL_TASKS_PER_TIER) * 100}%` }}
              />
            </div>
            <span className="ml-3 text-white font-black text-xl md:text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] min-w-[3.5ch] text-right tracking-wide">
              {Math.round((Math.min(taskIndex + 1, TOTAL_TASKS_PER_TIER) / TOTAL_TASKS_PER_TIER) * 100)}%
            </span>
          </div>
        </div>
      </div>

            {/* Main Game Content */}
      <div className="flex-1 relative flex flex-col items-center justify-start w-full max-w-4xl mx-auto px-4 pb-6 mt-4 z-10 gap-3 md:gap-4">
        
        {/* NPC Dialogue */}
        <div className="w-full flex justify-center z-30 scale-110 md:scale-125 origin-top mb-2 md:mb-4">
          <NPCDialogue
            npc="lolo"
            moduleNumber={4}
            line={
              tier === 1
                ? 'Ayusin ang mga salita para bumuo ng pangungusap! I-drag ang mga salita sa tamang pagkakasunod.'
                : 'Gawing tanong ang pangungusap! Paano mo itatanong ito kay Lolo?'
            }
            lineEn={
              tier === 1
                ? 'Arrange the words to build a sentence! Drag the words into the correct order.'
                : 'Turn the sentence into a question! How would you ask this to Lolo?'
            }
            audioUrl={`/static/assets/audio/npc/lolo_mod4_intro_tier${tier}.mp3`}
            celebrate={celebrate}
            resetKey={`${tier}-${taskIndex}`}
          />
        </div>

        {/* Wooden Board */}
        <div
          className="relative w-full max-w-2xl bg-cover bg-center bg-no-repeat rounded-3xl p-6 shadow-2xl flex flex-col items-center min-h-[160px] justify-center border-b-[8px] border-[#C2410C]"
          style={{ backgroundImage: "url('/images/module-bg/m4_w.png')" }}
        >
          <div className="relative z-10 w-full flex flex-col items-center justify-center gap-4">
            {task.audioUrl && (
              <div>
                <AudioPlayer
                  audioUrl={task.audioUrl}
                  fallbackText={task.correctOrder.join(' ')}
                  size="lg"
                  label=""
                  labelEn=""
                />
              </div>
            )}

            <div className="text-center">
              <p className="text-sm font-bold text-white drop-shadow-md mb-1">
                Your sentence so far:
              </p>
              <p className="text-xl md:text-2xl font-black text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)] flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-2">
                {tiles.map((t) => t.word).join(' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Area */}
        <div className="w-full min-h-[4rem] flex flex-col items-center justify-start z-20 mt-1">
          {feedback && (
            <div className="flex flex-row items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              
              {/* Red/Green Feedback Banner */}
              <div
                className={cn(
                  'px-6 py-2 rounded-full font-black text-white shadow-lg text-base md:text-lg',
                  feedback === 'correct' ? 'bg-green-500 animate-bounce' : 'bg-red-500'
                )}
              >
                {feedback === 'correct' ? STRINGS.correct.fil : 'Not quite ... try again!'}
              </div>
              
              {/* Solid Green Hint Box (Now with a gentle bounce) */}
              {feedback === 'incorrect' && attempts >= HINT_AFTER_ATTEMPTS && (
                <div className="bg-green-500 px-5 py-2 rounded-xl border-b-4 border-green-700 shadow-md flex items-center gap-2 animate-[bounce_1s_infinite]">
                  <span className="text-sm md:text-base text-white font-black">Hint :</span>
                  <strong className="text-white text-base md:text-lg font-black drop-shadow-sm">{task.correctOrder.join(' ')}</strong>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Word Tiles Tray */}
        <div className="w-full max-w-2xl bg-[#F0DFC8] p-4 rounded-3xl shadow-[0_8px_16px_rgba(0,0,0,0.15),inset_0_-4px_6px_rgba(0,0,0,0.1)] border-2 border-[#D1B894]">
          
          <p className="text-sm font-black text-[#8A6D4D] mb-2 text-center drop-shadow-sm">
            Drag the words to form the correct sentence:
          </p>
          
          <div className="bg-[#E8D5B5] p-2 rounded-xl shadow-[inset_0_3px_6px_rgba(0,0,0,0.15)]">
            <WordTiles
              items={tiles}
              onReorder={setTiles}
              disabled={isSubmitting || feedback === 'correct'}
              ariaLabel="Mga salita ng pangungusap (Sentence words)"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="w-full max-w-2xl flex justify-center mt-2 z-20">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || feedback === 'correct'}
            className="flex items-center gap-3 bg-[#43A047] hover:bg-[#2E7D32] disabled:opacity-50 text-white font-black px-10 py-3 rounded-full border-b-[6px] border-[#1B5E20] active:border-b-0 active:translate-y-1 transition-all shadow-xl text-lg"
          >
            {isSubmitting ? 'Checking...' : 'Submit Answer'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default SentenceModulePage