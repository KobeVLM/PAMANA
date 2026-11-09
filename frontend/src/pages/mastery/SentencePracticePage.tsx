import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAudio } from '@/contexts/AudioContext'
import { PracticeCompletion } from '@/components/practice/PracticeCompletion'
import { WordTiles, type WordTile } from '@/components/practice/WordTiles'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { useSfx } from '@/hooks/useGameAudio'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { STRINGS, bi } from '@/lib/i18n'
import api from '@/lib/api'
import type { ModuleProgress } from '@/types'
import { ArrowLeft, ChevronRight, MousePointerClick, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SentenceTask {
  taskId: string
  scrambledWords: string[]
  correctOrder: string[]
  audioUrl: string
  tier: number
  completed: boolean
}

const NPC_LINE = bi(
  'Ayusin ang mga salita upang bumuo ng tamang pangungusap! Maaari mong i-drag o i-click ang mga salita para pagpalitin ang ayos.',
  'Arrange the words to form the correct sentence! You can drag or click the words to swap their order.'
)
const NPC_AUDIO = '/static/assets/audio/npc/lolo_mod4_intro_tier1.mp3'
const MAX_ROUNDS = 3

const STEP_LABELS: Record<string, string> = {
  pakinggan: "1. Pakinggan",
  kilalanin: "2. Kilalanin",
  basahin: "3. Basahin",
  gamitin: "4. Gamitin",
}

const toTiles = (words: string[]): WordTile[] =>
  words.map((word, index) => ({ id: `word-${index}-${word}`, word }))

const prepareScrambled = (words: string[], correctOrder: string[]): string[] => {
  const scrambled = [...words]
  if (scrambled.length <= 1) return scrambled

  if (scrambled.join(' ') === correctOrder.join(' ')) {
    return [...scrambled].reverse()
  }
  return scrambled
}

export const SentencePracticePage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { stopAudio } = useAudio()
  const { playWrong } = useSfx()

  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [arranged, setArranged] = useState<WordTile[]>([])
  const [initialScrambled, setInitialScrambled] = useState<WordTile[]>([])
  const [selectedSwapIndex, setSelectedSwapIndex] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [introPlayed, setIntroPlayed] = useState(false)
  const [celebrate, setCelebrate] = useState(0)

  const [task, setTask] = useState<SentenceTask | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [isNoTasks, setIsNoTasks] = useState(false) // 👈 NEW STATE for empty response

  useScrollToTop(String(round))

  // Cleanup audio on unmount
  useEffect(() => {
    return () => { stopAudio() }
  }, [stopAudio])

  // Route guard: Module 4 must be complete first.
  const checkPrerequisite = useCallback(async () => {
    if (!user?.id) return { allowed: false }
    const res = await api.get(`/modules/progress/${user.id}`)
    const mod = (res.data as ModuleProgress[]).find((p) => p.moduleNumber === 4)
    return { allowed: Boolean(mod?.isComplete) }
  }, [user?.id])

  const loadTask = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    setIsNoTasks(false) // reset
    try {
      const guard = await checkPrerequisite()
      if (!guard.allowed) {
        navigate('/trail', { replace: true })
        return
      }

      const res = await api.get<SentenceTask | null>('/sentences/task', {
        params: { tier: 1 },
      })

      // 👇 FIX: If backend returns 204 or null, it means all tasks are done
      if (res.status === 204 || !res.data) {
        setIsNoTasks(true)
        return
      }

      const data = res.data
      if (!data?.taskId || !Array.isArray(data.correctOrder) || data.correctOrder.length === 0) {
        throw new Error('Malformed sentence task response')
      }
      setTask(data)
    } catch (err) {
      setLoadError(err)
    } finally {
      setIsLoading(false)
    }
  }, [checkPrerequisite, navigate])

  useEffect(() => {
    void loadTask()
  }, [loadTask])

  // Prepare the tiles whenever a new task arrives.
  useEffect(() => {
    if (!task) return
    const scrambled = prepareScrambled(task.scrambledWords, task.correctOrder)
    const items = toTiles(scrambled)
    setArranged(items)
    setInitialScrambled(items)
    setSubmitted(false)
    setIsCorrect(null)
    setSelectedSwapIndex(null)
  }, [task])

  const handleReorder = useCallback((items: WordTile[]) => {
    setSelectedSwapIndex(null)
    setArranged(items)
  }, [])

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

      playTone(783.99, now, 0.2)
      playTone(1046.5, now + 0.1, 0.3)
    } catch { /* ignored */ }
  }, [])

  const handleSelectWord = useCallback(
    (index: number) => {
      if (submitted) return
      setSelectedSwapIndex((prev) => {
        if (prev === null) return index
        if (prev === index) return null
        setArranged((items) => {
          const next = [...items]
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

    const correct = arranged.map((i) => i.word).join(' ') === task.correctOrder.join(' ')
    setIsCorrect(correct)
    setSubmitted(true)
    setSelectedSwapIndex(null)

    if (correct) {
      setScore((s) => s + 1)
      setCelebrate((count) => count + 1)
      playVictorySound()
    } else {
      playWrong()
    }
  }

  const handleNext = () => {
    setIntroPlayed(true)
    if (round >= MAX_ROUNDS) {
      setIsComplete(true)
    } else {
      setRound((r) => r + 1)
      void loadTask()
    }
  }

  const handlePlayAgain = () => {
    setIntroPlayed(false)
    setScore(0)
    setIsComplete(false)
    setRound(1)
    void loadTask()
  }

  const arrangedSentence = useMemo(
    () => arranged.map((i) => i.word).join(' '),
    [arranged]
  )

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
        <ErrorState
          description="Hindi ma-load ang gawain. Pakisubukan muli."
          onRetry={() => void loadTask()}
        />
      </div>
    )
  }

  // 👇 NEW: Empty State if all tasks are done
  if (isNoTasks || (!isLoading && !task)) {
    return (
      <div className="min-h-screen w-full bg-[#EAF0D8] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm text-center shadow-2xl border-b-8 border-gray-200">
          <div className="text-6xl mb-4" aria-hidden="true">🎉</div>
          <h2 className="mb-2 font-heading text-2xl font-bold text-[#2b5c3b]">Wala nang Gawain!</h2>
          <p className="text-[#3f7d52] mb-6">
            Natapos mo na ang lahat ng sentence tasks. Magpatuloy sa ibang module o bumalik sa Home.
          </p>
          <button
            onClick={() => navigate('/home')}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-6 py-4 rounded-full border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
          >
            Bumalik sa Home
          </button>
        </div>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="min-h-screen w-full bg-[#EAF0D8] flex items-center justify-center p-4">
        <PracticeCompletion
          title="Natapos mo ang Practice Mode!"
          message={`Matagumpay mong natapos ang ${MAX_ROUNDS} pangungusap sa pagbuo ng pangungusap.`}
          messageEn={`You successfully built all ${MAX_ROUNDS} sentences.`}
          score={score}
          total={MAX_ROUNDS}
          onRetry={handlePlayAgain}
          retryLabel="Subukan Ulit"
          retryLabelEn="Try Again"
          retrying={false}
          onExit={() => navigate('/home')}
          exitLabel="Bumalik sa Home"
          illustration={
            <img
              src="/images/Lolo-C.png"
              alt="Lolo"
              width={256}
              height={256}
              decoding="async"
              className="mx-auto h-52 w-52 object-contain drop-shadow-2xl sm:h-64 sm:w-64"
            />
          }
        />
      </div>
    )
  }

  if (!task) return null

  // Visual steps
  const steps = ["pakinggan", "kilalanin", "basahin", "gamitin"]
  const currentStepIndex = 3; // Hardcoded to "gamitin" for this practice mode

  return (
    <div
      className="relative h-screen w-full bg-cover bg-center flex flex-col font-sans overflow-hidden"
      style={{ backgroundImage: "url('/images/module-bg/m-House.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/15 z-0 pointer-events-none" />

      {/* Top Bar */}
      <div className="relative w-full z-20 flex justify-between items-start p-4 md:p-6 min-h-[100px] md:min-h-[140px]">
        
        {/* Left: Back Button */}
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-4 py-2 mt-2 rounded-full border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all shadow-lg z-30"
        >
          <ArrowLeft className="w-5 h-5 stroke-[3]" />
          Bumalik
        </button>

        {/* Center: Title */}
        <div className="absolute left-1/2 -translate-x-1/2 top-2 md:top-4 pointer-events-none z-20 flex flex-col items-center justify-center w-full leading-tight">
          <h1 
            className="text-4xl md:text-6xl lg:text-7xl font-black text-center tracking-wide"
            style={{
              color: "#FFD700", 
              WebkitTextStroke: "3px black", 
              paintOrder: "stroke fill",
              textShadow: "0 4px 4px rgba(0,0,0,0.4)", 
            }}
          >
            Pagsasanay:
          </h1>
          <h1 
            className="text-3xl md:text-5xl lg:text-6xl font-black text-center tracking-wide mt-1 md:mt-2"
            style={{
              color: "#FFD700", 
              WebkitTextStroke: "3px black", 
              paintOrder: "stroke fill",
              textShadow: "0 4px 4px rgba(0,0,0,0.4)", 
            }}
          >
            Pagbuo ng Pangungusap
          </h1>
        </div>

        {/* Right: Progress Bar & Practice Mode */}
        <div className="flex flex-col items-end z-30 mt-1 gap-3">
          
          {/* Progress Bar */}
          <div className="flex items-center bg-[#8CC63F] border-[4px] border-[#6A9C2C] rounded-full p-1.5 pr-5 shadow-[0_4px_6px_rgba(0,0,0,0.3)] w-48 md:w-64 lg:w-80">
            <div className="flex-1 h-5 md:h-8 bg-[#2F6A3E] rounded-full border-[3px] border-[#204D2B] shadow-[inset_0_3px_5px_rgba(0,0,0,0.6)] overflow-hidden relative">
              <div
                className="absolute top-0 left-0 h-full bg-[#8CC63F] rounded-full transition-all duration-500 border-r-2 border-[#6A9C2C]"
                style={{ width: `${Math.round((round / MAX_ROUNDS) * 100)}%` }}
              />
            </div>
            <span className="ml-2 md:ml-3 text-white font-black text-lg md:text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] min-w-[3ch] text-right tracking-wide">
              {round}/{MAX_ROUNDS}
            </span>
          </div>

          {/* Practice Mode Badge */}
          <div className="bg-[#2d5e3e]/95 backdrop-blur-md px-4 py-1.5 md:px-6 md:py-2 rounded-full border-4 border-[#a4cba9] shadow-[0_4px_0_#1e422b]">
            <span className="text-sm md:text-base font-black text-white font-heading drop-shadow-md uppercase tracking-wider">
              Practice Mode
            </span>
          </div>
        </div>
      </div>

      {/* Sub-level Steps */}
      <div className="relative z-20 flex justify-center flex-wrap gap-2 md:gap-4 mt-2 md:mt-4 px-4">
        {steps.map((step, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isDone = idx < currentStepIndex;
          const label = STEP_LABELS[step].split(". ")[1];

          return (
            <div
              key={step}
              className={cn(
                "px-4 py-1.5 md:px-6 md:py-2 rounded-full font-bold text-xs md:text-sm border-b-4 shadow-md whitespace-nowrap transition-all",
                isCurrent
                  ? "bg-amber-400 border-amber-500 text-amber-950 scale-105 z-10"
                  : isDone
                  ? "bg-green-500 border-green-600 text-white"
                  : "bg-gray-200 border-gray-300 text-gray-600"
              )}
            >
              {label}
            </div>
          );
        })}
      </div>

      {/* Main Game Content */}
      <div className="flex-1 relative flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 pb-6 mt-4 z-10 gap-4 md:gap-6">
        
        {/* NPC Dialogue */}
        <div className="w-full flex justify-center z-30 scale-105 md:scale-110 origin-top mb-2">
          <NPCDialogue
            npc="lolo"
            line={NPC_LINE.fil}
            lineEn={NPC_LINE.en}
            audioUrl={NPC_AUDIO}
            autoPlay={!introPlayed}
            onAudioEnd={() => setIntroPlayed(true)}
            celebrate={celebrate}
            resetKey={round}
            moduleNumber={4}
          />
        </div>

        {/* Wooden Board */}
        <div
          className="relative w-full max-w-2xl bg-cover bg-center bg-no-repeat rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center border-b-[8px] border-[#5c2e16] min-h-[160px]"
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
                Iyong pangungusap:
              </p>
              <p className="text-xl md:text-2xl font-black text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)] flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-2">
                {arrangedSentence}
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Area */}
        <div className="w-full min-h-[4rem] flex flex-col items-center justify-start z-20 mt-1">
          {submitted && (
            <div className="flex flex-row items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              
              {/* Red/Green Feedback Banner */}
              <div
                className={cn(
                  'px-6 py-2 rounded-full font-black text-white shadow-lg text-base md:text-lg',
                  isCorrect ? 'bg-green-500 animate-bounce' : 'bg-red-500'
                )}
              >
                {isCorrect ? STRINGS.correct.fil : 'Not quite ... try again!'}
              </div>
              
              {/* Solid Green Hint Box */}
              {!isCorrect && (
                <div className="bg-green-500 px-5 py-2 rounded-xl border-b-4 border-green-700 shadow-md flex items-center gap-2 animate-[bounce_1s_infinite]">
                  <span className="text-sm md:text-base text-white font-black">Tamang sagot :</span>
                  <strong className="text-white text-base md:text-lg font-black drop-shadow-sm">{task.correctOrder.join(' ')}</strong>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Word Tiles Tray */}
        <div className="w-full max-w-2xl bg-[#F0DFC8] p-4 rounded-3xl shadow-[0_8px_16px_rgba(0,0,0,0.15),inset_0_-4px_6px_rgba(0,0,0,0.1)] border-2 border-[#D1B894]">
          
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#8A6D4D] sm:text-sm">
              <MousePointerClick className="h-4 w-4" aria-hidden="true" />
              <span>I-drag o i-click ang dalawang salita:</span>
            </div>
            {!submitted && (
              <button
                onClick={handleResetOrder}
                className="flex items-center gap-1 text-xs font-bold text-[#8A6D4D] hover:text-[#5C3A21] transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" /> I-reset
              </button>
            )}
          </div>
          
          <div className="bg-[#E8D5B5] p-2 rounded-xl shadow-[inset_0_3px_6px_rgba(0,0,0,0.15)]">
            <WordTiles
              items={arranged}
              onReorder={handleReorder}
              selectedIndex={selectedSwapIndex}
              onSelectIndex={handleSelectWord}
              disabled={submitted}
              ariaLabel="Mga salita ng pangungusap (Sentence words)"
            />
          </div>
        </div>

        {/* Submit / Next Button */}
        <div className="w-full max-w-2xl flex justify-center mt-2 z-20">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={arranged.length === 0}
              className="flex items-center gap-3 bg-[#43A047] hover:bg-[#2E7D32] disabled:opacity-50 text-white font-black px-10 py-3 rounded-full border-b-[6px] border-[#1B5E20] active:border-b-0 active:translate-y-1 transition-all shadow-xl text-lg"
            >
              Isumite
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-3 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black px-10 py-3 rounded-full border-b-[6px] border-amber-600 active:border-b-0 active:translate-y-1 transition-all shadow-xl text-lg"
            >
              {round >= MAX_ROUNDS ? 'Tapusin' : 'Susunod'}
              <ChevronRight className="w-6 h-6 stroke-[3]" />
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

export default SentencePracticePage