import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
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

interface SyllableStatus {
  currentSubLevel: SubLevel
  currentSetId: number
  subLevelAccuracies: Record<SubLevel, number>
  moduleAccuracy: number
  module2Unlocked: boolean
  overallAccuracy?: number
  isComplete?: boolean
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

export const SyllableModulePage: React.FC = () => {
  const { user } = useAuth()
  const { stopAudio } = useAudio()
  const navigate = useNavigate()
  const { playWrong } = useSfx()

  const [status, setStatus] = useState<SyllableStatus | null>(null)
  const [currentSet, setCurrentSet] = useState<SyllableSet | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [correctId, setCorrectId] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [moduleComplete, setModuleComplete] = useState(false)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [celebrate, setCelebrate] = useState(0)

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
      // Check if BGM is enabled in settings before playing
      const isBgmEnabled = localStorage.getItem('pamana_bgm') !== 'false'
      if (isBgmEnabled && audio.paused) {
        audio.play()?.catch(() => console.log("Autoplay blocked by browser"))
      }
    }

    startAudio()

    // Listen for changes from the Settings page
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
    if (moduleComplete && bgmRef.current) {
      bgmRef.current.pause()
    }
  }, [moduleComplete])
  // --------------------------------

  const { replay: replayVoice } = useAudioElement(currentSet?.audioUrl ?? null)

  useScrollToTop(`${currentSet?.subLevel ?? ''}-${currentSet?.setId ?? ''}`)

  useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [stopAudio])

  const fetchStatus = useCallback(async (): Promise<SyllableStatus> => {
    const res = await api.get('/syllables/status')
    const data = res.data

    let currentSubLevel: SubLevel = 'pagsama'
    if (data.pagsamaAccuracy >= 80) currentSubLevel = 'pakinggan'
    if (data.pakingganAccuracy >= 80) currentSubLevel = 'kilalanin'
    if (data.kilalaninAccuracy >= 80) currentSubLevel = 'rhyming'

    return {
      currentSubLevel,
      currentSetId: 1,
      subLevelAccuracies: {
        pagsama: data.pagsamaAccuracy || 0,
        pakinggan: data.pakingganAccuracy || 0,
        kilalanin: data.kilalaninAccuracy || 0,
        rhyming: data.rhymingAccuracy || 0,
      },
      moduleAccuracy: data.module1Accuracy || 0,
      module2Unlocked: Boolean(data.module2Unlocked),
      overallAccuracy:
        (data.overallAccuracy !== undefined
          ? data.overallAccuracy
          : data.module1Accuracy) ?? 0,
      isComplete: Boolean(data.isComplete),
    }
  }, [])

  const fetchSet = useCallback(
    async (subLevel: SubLevel, setId: number): Promise<SyllableSet> => {
      const res = await api.get<SyllableSet>(
        `/syllables/set?subLevel=${subLevel}&setId=${setId}`
      )
      const set = res.data
      if (!set?.targetSyllable || !Array.isArray(set.options)) {
        throw new Error('Malformed syllable set response')
      }
      return set
    },
    []
  )

  const init = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const s = await fetchStatus()
      setStatus(s)
      const set = await fetchSet(s.currentSubLevel, s.currentSetId)
      setCurrentSet(set)
    } catch (err) {
      setLoadError(err)
    } finally {
      setIsLoading(false)
    }
  }, [fetchStatus, fetchSet])

  useEffect(() => {
    if (user?.id) void init()
  }, [user?.id, init])

  const advance = useCallback(
    async (subLevel: SubLevel, setId: number) => {
      setSelectedId(null)
      setCorrectId(null)
      setAttempts(0)
      setFeedback(null)
      try {
        const updatedStatus = await fetchStatus()
        setStatus(updatedStatus)
        const set = await fetchSet(subLevel, setId)
        setCurrentSet(set)
      } catch {
        toast.error('Hindi ma-load ang susunod na gawain.')
      }
    },
    [fetchStatus, fetchSet]
  )

  const handleSelect = useCallback(
    async (optionId: string) => {
      if (!currentSet || selectedId || isSubmitting) return
      
      duckBGM(2000)

      const isCorrect =
        optionId.toLowerCase() === currentSet.targetSyllable.toLowerCase()
      setSelectedId(optionId)
      setFeedback(isCorrect ? 'correct' : 'incorrect')

      if (isCorrect) {
        setCelebrate((count) => count + 1)
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
      const accuracy = isCorrect ? 100 : Math.max(0, 100 - newAttempts * 25)

      setIsSubmitting(true)
      let progress: { nextSetId?: number | null }
      try {
        const res = await api.post('/syllables/progress', {
          userId: user?.id,
          subLevel: currentSet.subLevel,
          setId: currentSet.setId,
          selectedAnswer: optionId,
          correct: isCorrect,
          accuracy,
        })
        progress = res.data
      } catch {
        toast.error('Hindi naitala ang sagot', {
          description: 'Pakitingnan ang koneksyon at subukan muli.',
        })
        setSelectedId(null)
        setCorrectId(null)
        setFeedback(null)
        setAttempts((a) => Math.max(0, a - 1))
        setIsSubmitting(false)
        return
      }
      setIsSubmitting(false)

      if (!isCorrect) {
        setTimeout(() => {
          setSelectedId(null)
          setFeedback(null)
        }, 1200)
        return
      }

      if (currentSet.subLevel === 'rhyming' && !progress.nextSetId) {
        try {
          const updatedStatus = await fetchStatus()
          setStatus(updatedStatus)
        // eslint-disable-next-line no-empty
        } catch {}
        setTimeout(() => setModuleComplete(true), 1200)
      } else if (progress.nextSetId) {
        const nextSetId = progress.nextSetId
        setTimeout(() => {
          void advance(currentSet.subLevel, nextSetId)
        }, 1500)
      } else {
        const currentIndex = SUB_LEVELS.indexOf(currentSet.subLevel)
        if (currentIndex < SUB_LEVELS.length - 1) {
          const nextSubLevel = SUB_LEVELS[currentIndex + 1]
          setTimeout(() => {
            void advance(nextSubLevel, 1)
          }, 1500)
        }
      }
    },
    [
      isSubmitting,
      currentSet,
      selectedId,
      attempts,
      user?.id,
      fetchStatus,
      advance,
      replayVoice,
      playWrong,
      duckBGM,
    ]
  )

  const handleResetModule = useCallback(async () => {
    setIsLoading(true)
    try {
      await api.delete(`/modules/reset/${user?.id}/1`)
      setModuleComplete(false)
      setSelectedId(null)
      setCorrectId(null)
      setFeedback(null)
      setAttempts(0)
      await init()
      if (bgmRef.current) {
        bgmRef.current.play()?.catch(() => {})
      }
    } catch {
      toast.error('Hindi na-reset ang module')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, init])

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#EAF0D8] flex items-center justify-center">
        <LoadingState message="Naglo-load ng aralin..." />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen w-full bg-[#EAF0D8] flex items-center justify-center">
        <ErrorState
          description="Hindi ma-load ang aralin ngayon. Pakisubukan muli."
          onRetry={() => void init()}
        />
      </div>
    )
  }

  if (moduleComplete) {
    const hasPassed = Boolean(
      status?.module2Unlocked ||
        (status?.overallAccuracy ?? 0) >= 80 ||
        status?.isComplete
    )
    const accuracy = Math.round(status?.overallAccuracy ?? 0)

    return (
      <div className="min-h-screen w-full bg-[#EAF0D8] flex items-center justify-center p-4">
        <PracticeCompletion
          title="Natapos mo na ang Module 1!"
          message={
            hasPassed
              ? 'Napakahusay! Na-unlock mo na ang susunod na aralin sa Pamana Trail.'
              : 'Ang iyong score ay hindi umabot sa 80%. Maaari mong subukan muli upang ma-unlock ang susunod na aralin, o magpatuloy sa Pamana Trail.'
          }
          messageEn={
            hasPassed
              ? 'Great job! You unlocked the next lesson in the Pamana Trail.'
              : 'Your score did not reach 80%. You can try again to unlock the next lesson, or continue along the Pamana Trail.'
          }
          score={accuracy}
          total={100}
          onRetry={() => void handleResetModule()}
          retryLabel="Subukan Ulit"
          retryLabelEn="Try Again"
          retrying={isLoading}
          onExit={() => navigate('/trail')}
          exitLabel="Pumunta sa Pamana Trail"
          illustration={
            <img
              src="/images/Lola-C.png"
              alt="Lola"
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

  if (!currentSet || !status) return null

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
          onClick={() => navigate('/trail')}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-4 py-2 rounded-full border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all shadow-lg z-30"
        >
          <ArrowLeft className="w-5 h-5 stroke-[3]" />
          Pamana Trail
        </button>

        {/* Center: Title Image */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-full flex justify-center pointer-events-none pt-2 md:pt-4">
          <img
            src="/images/moduletitles/C_m1.png"
            alt="Module 1"
            className="w-[300px] md:w-[400px] lg:w-[500px] object-contain drop-shadow-2xl"
          />
        </div>

        {/* Right: Progress Bar */}
        <div className="flex items-center z-30">
          <div className="flex items-center bg-[#8CC63F] border-[4px] border-[#6A9C2C] rounded-full p-1.5 pr-5 shadow-[0_4px_6px_rgba(0,0,0,0.3)] w-64 md:w-[22rem] lg:w-[26rem]">
            <div className="flex-1 h-6 md:h-8 bg-[#2F6A3E] rounded-full border-[3px] border-[#204D2B] shadow-[inset_0_3px_5px_rgba(0,0,0,0.6)] overflow-hidden relative">
              <div
                className="absolute top-0 left-0 h-full bg-[#8CC63F] rounded-full transition-all duration-500 border-r-2 border-[#6A9C2C]"
                style={{ width: `${Math.round(status.moduleAccuracy)}%` }}
              />
            </div>
            <span className="ml-3 text-white font-black text-xl md:text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] min-w-[3.5ch] text-right tracking-wide">
              {Math.round(status.moduleAccuracy)}%
            </span>
          </div>
        </div>
      </div>

      {/* Sub-level Steps */}
      <div className="relative z-20 flex justify-center flex-wrap gap-2 md:gap-4 mt-8 md:mt-12 px-4">
        {SUB_LEVELS.map((sl) => {
          const acc = status.subLevelAccuracies[sl] ?? 0
          const label = SUB_LEVEL_LABELS[sl].fil.split('. ')[1]
          const isCurrent = status.currentSubLevel === sl
          const isDone = acc >= 80

          return (
            <div
              key={sl}
              className={cn(
                'px-5 py-2 md:px-7 md:py-2.5 rounded-full font-bold text-sm md:text-base border-b-4 shadow-md whitespace-nowrap transition-all',
                isCurrent
                  ? 'bg-amber-400 border-amber-500 text-amber-950 scale-105'
                  : isDone
                  ? 'bg-green-500 border-green-600 text-white'
                  : 'bg-gray-200 border-gray-300 text-gray-600'
              )}
            >
              {acc > 0 ? `${label} - ${Math.round(acc)}%` : label}
            </div>
          )
        })}
      </div>

      {/* Main Game Content */}
      <div className="flex-1 relative flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 pb-6 mt-8 z-10 gap-4 md:gap-6">
        
        {/* NPC Dialogue */}
        <div className="w-full flex justify-center z-30 scale-110 md:scale-125 origin-top mb-4 md:mb-6">
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

        {/* Equation Board (Border only on bottom) */}
        <div
          className="relative w-full max-w-2xl bg-cover bg-center bg-no-repeat rounded-3xl p-6 shadow-2xl flex flex-col items-center min-h-[160px] justify-center border-b-[8px] border-[#C2410C]"
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
                  <span className="font-black text-3xl md:text-4xl text-white drop-shadow-md">
                    {currentSet.consonant}
                  </span>
                  <span className="text-xs text-white/90 font-bold drop-shadow-sm">
                    {UI_TEXT.consonant.fil}
                  </span>
                </div>
                <span className="text-4xl font-black text-white/50">+</span>
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
                  <span className="font-black text-3xl md:text-4xl text-white drop-shadow-md">
                    {currentSet.vowel}
                  </span>
                  <span className="text-xs text-white/90 font-bold drop-shadow-sm">
                    {UI_TEXT.vowel.fil}
                  </span>
                </div>
                <span className="text-4xl font-black text-white/50">=</span>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-16 h-16 border-4 border-dashed border-white/60 rounded-xl flex items-center justify-center bg-black/10 shadow-inner">
                    <span className="text-4xl font-black text-white/60">?</span>
                  </div>
                  <span className="text-xs text-white/90 font-bold drop-shadow-sm mt-1">
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
                  // ✅ REMOVED disabled:opacity-80 so it stays 100% bright
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

export default SyllableModulePage