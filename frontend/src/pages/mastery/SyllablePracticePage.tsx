import React, { useCallback, useEffect, useRef, useState } from 'react'
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
import { GestureDemo } from '@/components/learning/GestureDemo'
import { ScaffoldMessage } from '@/components/learning/ScaffoldMessage'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { BilingualText } from '@/components/common/BilingualText'
import { useAudioElement, useSfx } from '@/hooks/useGameAudio'
import { usePracticeAnswerProgress } from '@/hooks/usePracticeAnswerProgress'
import { useFocusView } from '@/hooks/useFocusView'
import { FocusViewToggle } from '@/components/learning/FocusViewToggle'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { STRINGS, bi, type Bi } from '@/lib/i18n'
import { fadedDistractorId, scaffoldStage } from '@/lib/scaffolding'
import api from '@/lib/api'
import type { ModuleProgress } from '@/types'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import bgmAudioFile from '@/components/music/ig-bgmusic.mp3'

type SubLevel = 'pagsama' | 'pakinggan' | 'kilalanin' | 'rhyming'

interface SyllableSet {
  setId: number
  subLevel: SubLevel
  consonant?: string
  vowel?: string
  targetSyllable: string
  options: { id: string; label: string }[]
  audioUrl: string
  consonantAudioUrl?: string
  vowelAudioUrl?: string
}

const SUB_LEVELS: SubLevel[] = ['pagsama', 'pakinggan', 'kilalanin', 'rhyming']

const SUB_LEVEL_LABELS: Record<SubLevel, Bi> = {
  pagsama: bi('1. Pagsama ng Tunog', '1. Blending Sounds'),
  pakinggan: bi('2. Pakinggan', '2. Listen'),
  kilalanin: bi('3. Kilalanin', '3. Identify'),
  rhyming: bi('4. Tumalinghaga', '4. Rhyming'),
}

const NPC_LINES: Record<SubLevel, Bi> = {
  pagsama: bi(
    'Pakinggan at pagsamahin ang mga tunog! Alin ang resulta?',
    'Listen and blend the sounds! Which one is the result?'
  ),
  pakinggan: bi(
    'Pakinggan nang mabuti! Alin ang pantig na narinig mo?',
    'Listen carefully! Which syllable did you hear?'
  ),
  kilalanin: bi(
    'Kilalanin ang pantig na nagsisimula sa salitang ito!',
    'Identify the syllable that begins this word!'
  ),
  rhyming: bi(
    'Alin sa mga salitang ito ang magkatunog sa narinig?',
    'Which of these words rhymes with what you heard?'
  ),
}

const UI_TEXT = {
  consonant: bi('Katinig', 'Consonant'),
  vowel: bi('Patinig', 'Vowel'),
  result: bi('Ano ang resulta?', 'What is the result?'),
  listenAgain: bi('Pindutin para marinig ulit', 'Tap to hear it again'),
}

const GESTURE_LABEL = bi(
  'Pindutin ang tamang pantig',
  'Tap the matching syllable'
)

export const SyllablePracticePage: React.FC = () => {
  const { user } = useAuth()
  const { stopAudio } = useAudio()
  const navigate = useNavigate()
  const { playWrong } = useSfx()

  // State
  const [currentSubLevelIndex, setCurrentSubLevelIndex] = useState(0)
  const [setId, setSetId] = useState(1)
  const [currentSet, setCurrentSet] = useState<SyllableSet | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [correctId, setCorrectId] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [practiceComplete, setPracticeComplete] = useState(false)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [celebrate, setCelebrate] = useState(0)

  const currentSubLevel = SUB_LEVELS[currentSubLevelIndex]

  // Two sets per sub-level, four sub-levels: eight scored items per run.
  const answerProgress = usePracticeAnswerProgress(SUB_LEVELS.length * 2, {
    itemType: 'syllable_set',
    moduleNumber: 1,
  })
  const { recordAnswer, reset: resetAnswerProgress } = answerProgress

  const { focusView, toggleFocusView } = useFocusView()
  const [showGesture, setShowGesture] = useState(true)
  const finishGesture = useCallback(() => setShowGesture(false), [])

  // --- BGM Volume Ducking Logic ---
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const bgmDuckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const defaultVolume = 0.3
  const duckedVolume = 0.05

  useEffect(() => {
    const audio = new Audio(bgmAudioFile)
    audio.loop = true
    audio.volume = defaultVolume
    bgmRef.current = audio

    const startAudio = () => {
      const isBgmEnabled = localStorage.getItem('pamana_bgm') !== 'false'
      if (isBgmEnabled && audio.paused) {
        audio.play()?.catch(() => console.log("Autoplay blocked by browser"))
      }
    }

    startAudio()

    const handleSettingsChange = () => {
      const isBgmEnabled = localStorage.getItem('pamana_bgm') !== 'false'
      if (!isBgmEnabled) {
        audio.pause()
      } else {
        audio.play()?.catch(() => {})
      }
    }

    window.addEventListener('pamana_settings_changed', handleSettingsChange)

    const handleInteraction = () => {
      if (audio.paused) startAudio()
      document.removeEventListener('click', handleInteraction)
    }
    document.addEventListener('click', handleInteraction)

    return () => {
      audio.pause()
      document.removeEventListener('click', handleInteraction)
      window.removeEventListener('pamana_settings_changed', handleSettingsChange)
      if (bgmDuckTimerRef.current) clearTimeout(bgmDuckTimerRef.current)
    }
  }, [])

  const duckBGM = useCallback((durationMs = 2000) => {
    if (bgmRef.current) bgmRef.current.volume = duckedVolume
    if (bgmDuckTimerRef.current) clearTimeout(bgmDuckTimerRef.current)
    bgmDuckTimerRef.current = setTimeout(() => {
      if (bgmRef.current) bgmRef.current.volume = defaultVolume
    }, durationMs)
  }, [])

  useEffect(() => {
    if (currentSet) {
      duckBGM(4000)
    }
  }, [currentSet, currentSet?.setId, currentSet?.subLevel, duckBGM])

  useEffect(() => {
    if (practiceComplete && bgmRef.current) {
      bgmRef.current.pause()
    }
  }, [practiceComplete])
  // --------------------------------

  const { replay: replayVoice } = useAudioElement(currentSet?.audioUrl ?? null)

  useScrollToTop(`${currentSet?.subLevel ?? ''}-${currentSet?.setId ?? ''}`)

  useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [stopAudio])

  // Route guard: The learner must have completed Module 1 first.
  const checkPrerequisite = useCallback(async () => {
    if (!user?.id) return { allowed: false }
    const res = await api.get(`/modules/progress/${user.id}`)
    const mod = (res.data as ModuleProgress[]).find((p) => p.moduleNumber === 1)
    return { allowed: Boolean(mod?.isComplete) }
  }, [user?.id])

  // Load the set
  const init = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const guard = await checkPrerequisite()
      if (!guard.allowed) {
        navigate('/trail', { replace: true })
        return
      }

      const res = await api.get<SyllableSet>(
        `/syllables/set?subLevel=${currentSubLevel}&setId=${setId}`
      )
      const set = res.data
      if (!set?.targetSyllable || !Array.isArray(set.options)) {
        throw new Error('Malformed syllable set response')
      }
      setCurrentSet(set)
      setShowGesture(true)
    } catch (err) {
      setLoadError(err)
    } finally {
      setIsLoading(false)
    }
  }, [checkPrerequisite, currentSubLevel, setId, navigate])

  useEffect(() => {
    void init()
  }, [init])

  const advance = useCallback(() => {
    setSelectedId(null)
    setCorrectId(null)
    setAttempts(0)
    setFeedback(null)
    setShowGesture(true)

    // Logic to advance: 
    // If we've done 2 questions per sublevel, move to next sublevel
    if (setId >= 2) {
      if (currentSubLevelIndex < SUB_LEVELS.length - 1) {
        setCurrentSubLevelIndex((prev) => prev + 1)
        setSetId(1)
      } else {
        setPracticeComplete(true)
      }
    } else {
      setSetId((prev) => prev + 1)
    }
  }, [setId, currentSubLevelIndex])

  const submitAnswer = useCallback(
    async (optionId: string, guided = false) => {
      if (!currentSet || (selectedId && !guided) || isSubmitting) return

      duckBGM(2000)

      const targetId = currentSet.targetSyllable.toLowerCase()
      // A stage-3 confirm is a guided success: the wrong attempts stay in the
      // telemetry, and the final acknowledgement counts as the solved item.
      const isCorrect = guided || optionId.toLowerCase() === targetId
      const newAttempts = attempts + 1
      const attemptStage = scaffoldStage(newAttempts)
      recordAnswer(`${currentSubLevel}:${setId}`, isCorrect, currentSubLevel)
      setSelectedId(optionId)
      setFeedback(isCorrect ? 'correct' : 'incorrect')
      setAttempts(newAttempts)
      setCorrectId(isCorrect || attemptStage >= 3 ? targetId : null)

      if (isCorrect) {
        setCelebrate((count) => count + 1)
        replayVoice()
      } else {
        playWrong()
        // Stage 1 replays the target sound with the encouragement.
        if (attemptStage === 1) replayVoice()
      }

      setIsSubmitting(true)
      // Simulate a brief delay for "processing" to let the animation play
      setTimeout(() => {
        setIsSubmitting(false)
        if (isCorrect) {
          setTimeout(advance, 1200)
        } else {
          setTimeout(() => {
            setSelectedId(null)
            setFeedback(null)
          }, 1200)
        }
      }, 500)
    },
    [
      currentSet,
      selectedId,
      isSubmitting,
      attempts,
      advance,
      replayVoice,
      playWrong,
      duckBGM,
      currentSubLevel,
      setId,
      recordAnswer,
    ]
  )

  const handleSelect = useCallback(
    (optionId: string) => submitAnswer(optionId),
    [submitAnswer]
  )

  const handleGuidedConfirm = useCallback(() => {
    if (currentSet) void submitAnswer(currentSet.targetSyllable.toLowerCase(), true)
  }, [currentSet, submitAnswer])

  // Handle Resets
  const handleResetPractice = useCallback(() => {
    setCurrentSubLevelIndex(0)
    setSetId(1)
    resetAnswerProgress()
    setPracticeComplete(false)
    if (bgmRef.current) {
      bgmRef.current.play()?.catch(() => {})
    }
  }, [resetAnswerProgress])

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#EAF0D8] flex items-center justify-center">
        <LoadingState message="Inihahanda ang pagsasanay..." />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen w-full bg-[#EAF0D8] flex items-center justify-center">
        <ErrorState
          description="Hindi ma-load ang pagsasanay. Pakisubukan muli."
          onRetry={() => void init()}
        />
      </div>
    )
  }

  if (practiceComplete) {
    const accuracy = answerProgress.accuracy ?? 0

    return (
      <div className="min-h-screen w-full bg-[#EAF0D8] flex items-center justify-center p-4">
        <PracticeCompletion
          title="Natapos mo ang Practice Mode!"
          message="Matagumpay mong nasubukan ang lahat ng 4 na sub-level sa pagtutugma ng pantig."
          messageEn="You successfully completed all 4 sub-levels of syllable matching."
          score={accuracy}
          total={100}
          onRetry={handleResetPractice}
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

  if (!currentSet) return null

  const stage = scaffoldStage(attempts)
  const targetId = currentSet.targetSyllable.toLowerCase()
  const fadedId = fadedDistractorId(stage, currentSet.options, targetId)

  return (
    <div
      className="relative h-screen w-full bg-cover bg-center flex flex-col font-sans overflow-hidden"
      style={{ backgroundImage: "url('/images/module-bg/m-Farm.jpg')" }}
    >
      <div data-decorative className="absolute inset-0 bg-black/15 z-0 pointer-events-none" />

      {/* Top Bar: title centred, controls left, HUD upper right. */}
      <div className="relative w-full z-20 flex justify-between items-start p-4 md:p-6 min-h-[100px] md:min-h-[140px]">
        <div className="flex flex-col items-start gap-3 z-30">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-4 py-2 rounded-full border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 stroke-[3]" />
            Bumalik
          </button>
          <FocusViewToggle enabled={focusView} onToggle={toggleFocusView} />
        </div>

        {/* Center: Title (decorative in Focus View) */}
        <div data-decorative className="absolute left-1/2 -translate-x-1/2 top-0 md:top-2 pointer-events-none z-20 flex flex-col items-center justify-center w-full leading-tight">
          <h1
            className="text-3xl md:text-5xl lg:text-6xl font-black text-center tracking-wide"
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
            className="text-2xl md:text-4xl lg:text-5xl font-black text-center tracking-wide -mt-1 md:-mt-2"
            style={{
              color: "#FFD700",
              WebkitTextStroke: "3px black",
              paintOrder: "stroke fill",
              textShadow: "0 4px 4px rgba(0,0,0,0.4)",
            }}
          >
            Pagtugma ng Pantig
          </h1>
        </div>

        <div className="relative z-30 flex flex-col items-end gap-2 md:flex-row md:items-center md:gap-3">
          <ProgressPill
            value={answerProgress.progress}
            label={`${answerProgress.correctItems}/${SUB_LEVELS.length * 2}`}
          />
          <AccuracyChip accuracy={answerProgress.accuracy} />
          <PracticeModeBadge />
        </div>
      </div>

      {/* Sub-level Steps are decorative in Focus View; the HUD stays visible. */}
      <div data-decorative>
        <PracticeStepRail
          className="mt-1 md:mt-2"
          steps={SUB_LEVELS.map((sl, idx) => ({
            label: SUB_LEVEL_LABELS[sl].fil.split('. ')[1],
            state: idx === currentSubLevelIndex ? 'current' : idx < currentSubLevelIndex ? 'done' : 'pending',
          }))}
        />
      </div>

      {/* Main Game Content */}
      <div className="flex-1 relative flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 pb-3 mt-1 md:mt-2 z-10 gap-3 md:gap-4">
        
        {/* NPC Dialogue */}
        <div className="w-full flex justify-center z-30 mb-4 md:mb-6">
          <NPCDialogue
            npc="lolo"
            line={NPC_LINES[currentSet.subLevel].fil}
            lineEn={NPC_LINES[currentSet.subLevel].en}
            audioUrl={`/static/assets/audio/npc/lolo_mod2_${currentSet.subLevel}.mp3`}
            celebrate={celebrate}
            resetKey={`${currentSet.subLevel}-${currentSet.setId}`}
            moduleNumber={1}
          />
        </div>

        {/* Equation Board */}
        <div
          className="relative w-full max-w-2xl bg-cover bg-center bg-no-repeat rounded-3xl p-6 shadow-2xl flex flex-col items-center min-h-[160px] justify-center border-b-[8px] border-[#5c2e16]"
          style={{ backgroundImage: "url('/images/module-bg/m1_w.png')" }}
        >
          <div className="relative z-10 w-full flex items-center justify-center">
            {currentSet.subLevel === 'pagsama' ? (
              <div className="flex flex-wrap flex-row items-center justify-center gap-4 sm:gap-8">
                <div className="flex flex-col items-center gap-1">
                  <div onClickCapture={() => duckBGM(2000)}>
                    <AudioPlayer
                      audioUrl={currentSet.consonantAudioUrl ?? ''}
                      fallbackText={currentSet.consonant}
                      size="md"
                      label=""
                      labelEn=""
                    />
                  </div>
                  <span 
                    className="font-black text-3xl md:text-4xl text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                    style={{ WebkitTextStroke: "2px black", paintOrder: "stroke fill" }}
                  >
                    {currentSet.consonant}
                  </span>
                  <span className="text-xs text-white font-bold drop-shadow-sm">
                    {UI_TEXT.consonant.fil}
                  </span>
                </div>
                <span className="text-4xl font-black text-white/70">+</span>
                <div className="flex flex-col items-center gap-1">
                  <div onClickCapture={() => duckBGM(2000)}>
                    <AudioPlayer
                      audioUrl={currentSet.vowelAudioUrl ?? ''}
                      fallbackText={currentSet.vowel}
                      size="md"
                      label=""
                      labelEn=""
                    />
                  </div>
                  <span 
                    className="font-black text-3xl md:text-4xl text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                    style={{ WebkitTextStroke: "2px black", paintOrder: "stroke fill" }}
                  >
                    {currentSet.vowel}
                  </span>
                  <span className="text-xs text-white font-bold drop-shadow-sm">
                    {UI_TEXT.vowel.fil}
                  </span>
                </div>
                <span className="text-4xl font-black text-white/70">=</span>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-16 h-16 border-4 border-dashed border-white/60 rounded-xl flex items-center justify-center bg-black/10 shadow-inner">
                    <span className="text-4xl font-black text-white/60">?</span>
                  </div>
                  <span className="text-xs text-white font-bold drop-shadow-sm mt-1">
                    {UI_TEXT.result.fil}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div onClickCapture={() => duckBGM(2000)}>
                  <AudioPlayer
                    audioUrl={currentSet.audioUrl}
                    fallbackText={currentSet.targetSyllable}
                    size="lg"
                    label=""
                    labelEn=""
                  />
                </div>
                <BilingualText
                  as="p"
                  fil={UI_TEXT.listenAgain.fil}
                  en={UI_TEXT.listenAgain.en}
                  className="text-center"
                  filClassName="text-sm font-black text-white drop-shadow-md"
                  enClassName="text-xs text-white/80 font-bold"
                />
              </div>
            )}
          </div>
        </div>

        {/* Options / Choices */}
        <div className="relative w-full max-w-2xl px-4 md:px-0 mt-2">
          {showGesture && (
            <GestureDemo label={GESTURE_LABEL} onComplete={finishGesture} />
          )}
          <div className="grid grid-cols-4 gap-3 md:gap-6 w-full">
            {currentSet.options.map((opt) => {
              const isSelected = selectedId === opt.id
              const isCorrect = correctId === opt.id
              const isWrong = isSelected && !isCorrect
              const isFaded = fadedId === opt.id

              let bgImg = '/images/Y_button.png'
              if (isCorrect) bgImg = '/images/G_button.png'
              else if (isWrong) bgImg = '/images/R_button.png'

              return (
                <button
                  key={opt.id}
                  aria-label={isFaded ? `${opt.label} (tinanggal)` : opt.label}
                  onClick={() => handleSelect(opt.id)}
                  disabled={
                    showGesture ||
                    isSubmitting ||
                    isFaded ||
                    (!!selectedId && !isWrong)
                  }
                  className={cn(
                    'relative aspect-square flex items-center justify-center bg-contain bg-center bg-no-repeat transition-transform hover:scale-105 active:scale-95 disabled:hover:scale-100 outline-none focus-visible:ring-4 focus-visible:ring-amber-400 rounded-[20%] overflow-hidden drop-shadow-md',
                    isFaded && 'opacity-25 grayscale'
                  )}
                  style={{ backgroundImage: `url(${bgImg})` }}
                >
                  <span 
                    className="text-3xl md:text-5xl font-black text-white mt-1 md:mt-2 drop-shadow-[0_4px_2px_rgba(0,0,0,0.4)]"
                    style={{ 
                      WebkitTextStroke: '2px #2A1B10',
                      paintOrder: 'stroke fill'
                    }}
                  >
                    {opt.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Feedback Area: stage-based guidance instead of a generic retry */}
        <div className="w-full flex items-center justify-center mt-2">
          {feedback === 'correct' && (
            <div className="px-6 py-2 rounded-full font-bold text-white shadow-lg animate-bounce bg-green-500">
              {STRINGS.correct.fil}
            </div>
          )}
          <ScaffoldMessage
            stage={stage}
            target={currentSet.targetSyllable.toUpperCase()}
            parts={
              currentSet.subLevel === 'pagsama'
                ? [currentSet.consonant ?? '', currentSet.vowel ?? ''].filter(Boolean)
                : []
            }
            onReplay={replayVoice}
            onConfirm={handleGuidedConfirm}
          />
        </div>
      </div>
    </div>
  )
}

export default SyllablePracticePage