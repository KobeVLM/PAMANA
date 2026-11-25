import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAudio } from '@/contexts/AudioContext'
import { PracticeCompletion } from '@/components/practice/PracticeCompletion'
import {
  AccuracyChip,
  PracticeModeBadge,
  PracticeStepRail,
  ProgressPill,
} from '@/components/practice/PracticeHud'
import { WordTiles, type WordTile } from '@/components/practice/WordTiles'
import { FocusViewToggle } from '@/components/learning/FocusViewToggle'
import { GestureDemo } from '@/components/learning/GestureDemo'
import { ScaffoldMessage } from '@/components/learning/ScaffoldMessage'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { useAudioElement, useSfx } from '@/hooks/useGameAudio'
import { usePracticeAnswerProgress } from '@/hooks/usePracticeAnswerProgress'
import { useFocusView } from '@/hooks/useFocusView'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { STRINGS, bi } from '@/lib/i18n'
import { scaffoldStage } from '@/lib/scaffolding'
import api from '@/lib/api'
import type { ModuleProgress } from '@/types'
import { ArrowLeft, ChevronRight, MousePointerClick, Undo2 } from 'lucide-react'

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
const GESTURE_LABEL = bi(
  'Pindutin ang dalawang salita para pagpalitin',
  'Tap two words to swap their order'
)
const PIN_MESSAGE = bi(
  'Isang salita ang naitama na. Ayusin ang iba pang salita!',
  'One word is now in place. Arrange the other words!'
)
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
  const [isComplete, setIsComplete] = useState(false)
  const [arranged, setArranged] = useState<WordTile[]>([])
  const [initialScrambled, setInitialScrambled] = useState<WordTile[]>([])
  const [selectedSwapIndex, setSelectedSwapIndex] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [introPlayed, setIntroPlayed] = useState(false)
  const [celebrate, setCelebrate] = useState(0)

  const [task, setTask] = useState<SentenceTask | null>(null)
  // Wrong submissions drive the 3-stage guidance; a guided confirm at stage 3
  // records the solved item without erasing these earlier attempts.
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [lockedTileId, setLockedTileId] = useState<string | null>(null)
  const [showGesture, setShowGesture] = useState(true)
  const { focusView, toggleFocusView } = useFocusView()
  const { replay: replaySentence } = useAudioElement(task?.audioUrl ?? null)
  const answerProgress = usePracticeAnswerProgress(MAX_ROUNDS, {
    itemType: 'sentence_task',
    moduleNumber: 4,
  })
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
      setShowGesture(true)
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
    setWrongAttempts(0)
    setLockedTileId(null)
    setShowGesture(true)
  }, [task])

  const lockedIndex = lockedTileId
    ? arranged.findIndex((tile) => tile.id === lockedTileId)
    : -1

  const handleReorder = useCallback(
    (items: WordTile[]) => {
      setSelectedSwapIndex(null)
      if (!lockedTileId) {
        setArranged(items)
        return
      }
      // Keep the stage-2 pinned tile in place even if a drag moves it.
      const current = items.findIndex((tile) => tile.id === lockedTileId)
      if (current === -1) {
        setArranged(items)
        return
      }
      const target = lockedIndex >= 0 ? lockedIndex : 0
      if (current === target) {
        setArranged(items)
        return
      }
      const next = [...items]
      const [pinned] = next.splice(current, 1)
      next.splice(target, 0, pinned)
      setArranged(next)
    },
    [lockedTileId, lockedIndex]
  )

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
      if (submitted || showGesture) return
      // The stage-2 pinned word cannot be swapped out.
      if (lockedIndex >= 0 && index === lockedIndex) return
      setSelectedSwapIndex((prev) => {
        if (prev === null) return index
        if (prev === lockedIndex) return null
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
    [submitted, showGesture, lockedIndex]
  )

  const handleResetOrder = () => {
    if (submitted || showGesture) return
    setSelectedSwapIndex(null)
    const reset = [...initialScrambled]
    if (lockedTileId && lockedIndex >= 0) {
      const current = reset.findIndex((tile) => tile.id === lockedTileId)
      if (current !== -1 && current !== lockedIndex) {
        const [pinned] = reset.splice(current, 1)
        reset.splice(lockedIndex, 0, pinned)
      }
    }
    setArranged(reset)
  }

  const handleSubmit = () => {
    if (!task || submitted || showGesture) return

    const correct = arranged.map((i) => i.word).join(' ') === task.correctOrder.join(' ')
    answerProgress.recordAnswer(task.taskId, correct, 'tier1')
    setIsCorrect(correct)
    setSubmitted(true)
    setSelectedSwapIndex(null)

    if (correct) {
      setCelebrate((count) => count + 1)
      playVictorySound()
    } else {
      const nextWrong = wrongAttempts + 1
      setWrongAttempts(nextWrong)
      playWrong()
      // Stage 1 replays the sentence; stage 2 pins the first word in place.
      if (nextWrong === 1) replaySentence()
      if (nextWrong === 2 && !lockedTileId) {
        const firstWord = task.correctOrder[0]
        const tileIndex = arranged.findIndex((tile) => tile.word === firstWord)
        if (tileIndex >= 0) {
          setLockedTileId(arranged[tileIndex].id)
          if (tileIndex !== 0) {
            setArranged((items) => {
              const next = [...items]
              const [pinned] = next.splice(tileIndex, 1)
              next.splice(0, 0, pinned)
              return next
            })
          }
        }
      }
    }
  }

  const handleGuidedConfirm = () => {
    if (!task || isCorrect) return
    // A stage-3 confirm is a guided success; the wrong attempts remain logged.
    answerProgress.recordAnswer(task.taskId, true, 'tier1')
    setSubmitted(true)
    setIsCorrect(true)
    setCelebrate((count) => count + 1)
    playVictorySound()
  }

  const handleRetry = () => {
    if (!task) return
    // Keep the current arrangement (and any pinned word) so the learner can
    // act on the stage-2/3 guidance instead of starting from scratch.
    setSubmitted(false)
    setIsCorrect(null)
    setSelectedSwapIndex(null)
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
    answerProgress.reset()
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
          score={answerProgress.accuracy ?? 0}
          total={100}
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
  const stage = scaffoldStage(wrongAttempts)

  return (
    <div
      className="relative h-screen w-full bg-cover bg-center flex flex-col font-sans overflow-hidden"
      style={{ backgroundImage: "url('/images/module-bg/m-House.jpg')" }}
    >
      <div data-decorative className="absolute inset-0 bg-black/15 z-0 pointer-events-none" />

      {/* Top Bar */}
      <div className="relative w-full z-20 flex justify-between items-start p-4 md:p-6 min-h-[100px] md:min-h-[140px]">
        
        {/* Left: Back button + Focus View, kept clear of the title. */}
        <div className="flex flex-col items-start gap-2 z-30">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-4 py-2 mt-2 rounded-full border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 stroke-[3]" />
            Bumalik
          </button>
          <FocusViewToggle enabled={focusView} onToggle={toggleFocusView} />
        </div>

        {/* Center: Title (decorative in Focus View) */}
        <div data-decorative className="absolute left-1/2 -translate-x-1/2 top-2 md:top-4 pointer-events-none z-20 flex flex-col items-center justify-center w-full leading-tight">
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

        {/* Right: HUD stays visible in Focus View; toggle is on the left. */}
        <div className="flex flex-col items-end z-30 mt-1 gap-3">
          <ProgressPill
            value={answerProgress.progress}
            label={`${answerProgress.correctItems}/${MAX_ROUNDS}`}
          />
          <AccuracyChip accuracy={answerProgress.accuracy} />
          <PracticeModeBadge />
        </div>
      </div>

      {/* Sub-level Steps are decorative in Focus View; the HUD stays visible. */}
      <div data-decorative>
        <PracticeStepRail
          className="mt-2 md:mt-4"
          steps={steps.map((step, idx) => ({
            label: STEP_LABELS[step].split(". ")[1],
            state: idx === currentStepIndex ? "current" : idx < currentStepIndex ? "done" : "pending",
          }))}
        />
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

        {/* Feedback Area: progressive scaffolding for ordering mistakes */}
        <div className="w-full min-h-[4rem] flex flex-col items-center justify-start z-20 mt-1">
          {submitted && isCorrect && (
            <div className="px-6 py-2 rounded-full font-black text-white shadow-lg text-base md:text-lg bg-green-500 animate-bounce">
              {STRINGS.correct.fil}
            </div>
          )}
          {!isCorrect && (
            <ScaffoldMessage
              stage={stage}
              target={task.correctOrder.join(' ')}
              message={stage === 2 ? PIN_MESSAGE : undefined}
              onReplay={replaySentence}
              onConfirm={handleGuidedConfirm}
            />
          )}
        </div>

        {/* Word Tiles Tray */}
        <div className="relative w-full max-w-2xl bg-[#F0DFC8] p-4 rounded-3xl shadow-[0_8px_16px_rgba(0,0,0,0.15),inset_0_-4px_6px_rgba(0,0,0,0.1)] border-2 border-[#D1B894]">
          {showGesture && (
            <GestureDemo label={GESTURE_LABEL} onComplete={() => setShowGesture(false)} />
          )}

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
              disabled={submitted || showGesture}
              lockedIndices={lockedIndex >= 0 ? [lockedIndex] : []}
              ariaLabel="Mga salita ng pangungusap (Sentence words)"
            />
          </div>
        </div>

        {/* Submit / Next Button */}
        <div className="w-full max-w-2xl flex justify-center mt-2 z-20">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={arranged.length === 0 || showGesture}
              className="flex items-center gap-3 bg-[#43A047] hover:bg-[#2E7D32] disabled:opacity-50 text-white font-black px-10 py-3 rounded-full border-b-[6px] border-[#1B5E20] active:border-b-0 active:translate-y-1 transition-all shadow-xl text-lg"
            >
              Isumite
            </button>
          ) : isCorrect ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-3 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black px-10 py-3 rounded-full border-b-[6px] border-amber-600 active:border-b-0 active:translate-y-1 transition-all shadow-xl text-lg"
            >
              {round >= MAX_ROUNDS ? 'Tapusin' : 'Susunod'}
              <ChevronRight className="w-6 h-6 stroke-[3]" />
            </button>
          ) : (
            <button
              onClick={handleRetry}
              className="flex items-center gap-3 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black px-10 py-3 rounded-full border-b-[6px] border-amber-600 active:border-b-0 active:translate-y-1 transition-all shadow-xl text-lg"
            >
              Subukan Ulit
              <Undo2 className="w-6 h-6 stroke-[3]" />
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

export default SentencePracticePage