import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAudio } from '@/contexts/AudioContext'
import { PracticeCompletion } from '@/components/practice/PracticeCompletion'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { HINT_AFTER_ATTEMPTS } from '@/components/game/constants'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { BilingualText } from '@/components/common/BilingualText'
import { useAudioElement, useSfx } from '@/hooks/useGameAudio'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { STRINGS, bi, type Bi } from '@/lib/i18n'
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
  
  // Score tracking
  const [totalScore, setTotalScore] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)

  const currentSubLevel = SUB_LEVELS[currentSubLevelIndex]

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

  const handleSelect = useCallback(
    async (optionId: string) => {
      if (!currentSet || selectedId || isSubmitting) return
      
      duckBGM(2000)

      const isCorrect = optionId.toLowerCase() === currentSet.targetSyllable.toLowerCase()
      setSelectedId(optionId)
      setFeedback(isCorrect ? 'correct' : 'incorrect')
      setTotalQuestions(prev => prev + 1)

      if (isCorrect) {
        setCelebrate((count) => count + 1)
        setTotalScore(prev => prev + 1)
        replayVoice()
      } else {
        playWrong()
      }

      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setCorrectId(
        isCorrect || newAttempts >= HINT_AFTER_ATTEMPTS
          ? currentSet.targetSyllable.toLowerCase()
          : null
      )

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
    [currentSet, selectedId, isSubmitting, attempts, advance, replayVoice, playWrong, duckBGM]
  )

  // Handle Resets
  const handleResetPractice = useCallback(() => {
    setCurrentSubLevelIndex(0)
    setSetId(1)
    setTotalScore(0)
    setTotalQuestions(0)
    setPracticeComplete(false)
    if (bgmRef.current) {
      bgmRef.current.play()?.catch(() => {})
    }
  }, [])

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
    const accuracy = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0

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

  return (
    <div
      className="relative h-screen w-full bg-cover bg-center flex flex-col font-sans overflow-hidden"
      style={{ backgroundImage: "url('/images/module-bg/m-Farm.jpg')" }}
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
            className="text-3xl md:text-5xl lg:text-6xl font-black text-center tracking-wide -mt-1 md:-mt-2"
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

        {/* Right: Progress Bar & Practice Mode */}
        <div className="flex flex-col items-end z-30 mt-1 gap-3">
          
          {/* Progress Bar (Original style) */}
          <div className="flex items-center bg-[#8CC63F] border-[4px] border-[#6A9C2C] rounded-full p-1.5 pr-5 shadow-[0_4px_6px_rgba(0,0,0,0.3)] w-48 md:w-64 lg:w-80">
            <div className="flex-1 h-5 md:h-8 bg-[#2F6A3E] rounded-full border-[3px] border-[#204D2B] shadow-[inset_0_3px_5px_rgba(0,0,0,0.6)] overflow-hidden relative">
              <div
                className="absolute top-0 left-0 h-full bg-[#8CC63F] rounded-full transition-all duration-500 border-r-2 border-[#6A9C2C]"
                style={{ width: `${Math.round(((currentSubLevelIndex + 1) / SUB_LEVELS.length) * 100)}%` }}
              />
            </div>
            <span className="ml-2 md:ml-3 text-white font-black text-lg md:text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] min-w-[3ch] text-right tracking-wide">
              {currentSubLevelIndex + 1}/4
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
        {SUB_LEVELS.map((sl, idx) => {
          const label = SUB_LEVEL_LABELS[sl].fil.split('. ')[1]
          const isCurrent = currentSubLevelIndex === idx
          const isDone = idx < currentSubLevelIndex

          return (
            <div
              key={sl}
              className={cn(
                'px-4 py-1.5 md:px-6 md:py-2 rounded-full font-bold text-xs md:text-sm border-b-4 shadow-md whitespace-nowrap transition-all',
                isCurrent
                  ? 'bg-amber-400 border-amber-500 text-amber-950 scale-105'
                  : isDone
                  ? 'bg-green-500 border-green-600 text-white'
                  : 'bg-gray-200 border-gray-300 text-gray-600'
              )}
            >
              {label}
            </div>
          )
        })}
      </div>

      {/* Main Game Content */}
      <div className="flex-1 relative flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 pb-6 mt-4 z-10 gap-4 md:gap-6">
        
        {/* NPC Dialogue */}
        <div className="w-full flex justify-center z-30 scale-110 md:scale-125 origin-top mb-2 md:mb-4">
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
        <div className="w-full max-w-2xl px-4 md:px-0 mt-2">
          <div className="grid grid-cols-4 gap-3 md:gap-6 w-full">
            {currentSet.options.map((opt) => {
              const isSelected = selectedId === opt.id
              const isCorrect = correctId === opt.id
              const isWrong = isSelected && !isCorrect

              let bgImg = '/images/Y_button.png'
              if (isCorrect) bgImg = '/images/G_button.png'
              else if (isWrong) bgImg = '/images/R_button.png'

              return (
                <button
                  key={opt.id}
                  aria-label={opt.label}
                  onClick={() => handleSelect(opt.id)}
                  disabled={isSubmitting || (!!selectedId && !isWrong)}
                  className="relative aspect-square flex items-center justify-center bg-contain bg-center bg-no-repeat transition-transform hover:scale-105 active:scale-95 disabled:hover:scale-100 outline-none focus-visible:ring-4 focus-visible:ring-amber-400 rounded-[20%] overflow-hidden drop-shadow-md"
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

        {/* Feedback Area */}
        <div className="h-12 w-full flex items-center justify-center mt-2">
          {feedback && (
            <div
              className={cn(
                'px-6 py-2 rounded-full font-bold text-white shadow-lg animate-bounce',
                feedback === 'correct' ? 'bg-green-500' : 'bg-red-500'
              )}
            >
              {feedback === 'correct'
                ? STRINGS.correct.fil
                : 'Almost ! Try again.'}
            </div>
          )}
          {attempts >= HINT_AFTER_ATTEMPTS && !selectedId && (
            <div className="px-6 py-2 rounded-full font-bold bg-green-500 text-white shadow-lg">
              Hint: It's color Green!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SyllablePracticePage