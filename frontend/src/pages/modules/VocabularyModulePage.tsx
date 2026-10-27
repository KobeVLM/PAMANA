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
import { bi, type Bi } from '@/lib/i18n'
import api from '@/lib/api'
import type { ModuleProgress } from '@/types'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import bgmAudioFile from '@/components/music/ig-bgmusic.mp3'

type SpiralStep = 'pakinggan' | 'kilalanin' | 'basahin' | 'gamitin'

interface VocabWord {
  wordId: string
  word: string
  audioUrl: string
  imageUrl: string
  domain: string
}

interface MatchOption {
  id: string
  label?: string
  imageUrl?: string
}

interface Props {
  moduleNumber: 2 | 3
  domain?: 'self_body' | 'family_home'
}

const STEP_LABELS: Record<SpiralStep, string> = {
  pakinggan: '1. Pakinggan',
  kilalanin: '2. Kilalanin',
  basahin: '3. Basahin',
  gamitin: '4. Gamitin',
}

const getNpcLines = (moduleNumber: 2 | 3): Record<SpiralStep, Bi> => {
  const isLola = moduleNumber === 2
  return {
    pakinggan: bi(
      isLola
        ? 'Pakinggan natin ang bagong salita! Pindutin ang tunog at tandaan!'
        : 'Pakinggan natin ang bagong salita! Pindutin ang tunog at tandaan!',
      "Let's listen to the new word! Tap the sound and remember it!"
    ),
    kilalanin: bi(
      isLola
        ? 'Kilalanin! Alin ang larawan ng narinig na salita?'
        : 'Kilalanin! Alin ang larawan ng narinig na salita?',
      'Identify! Which picture shows the word you heard?'
    ),
    basahin: bi(
      isLola
        ? 'Basahin! Alin ang tamang salitang nakasulat?'
        : 'Basahin! Alin ang tamang salitang nakasulat?',
      'Read! Which is the correct written word?'
    ),
    gamitin: bi(
      isLola
        ? 'Gamitin ang salita sa pangungusap. Piliin ang tamang sagot!'
        : 'Gamitin ang salita sa pangungusap. Piliin ang tamang sagot!',
      'Use the word in a sentence. Choose the correct answer!'
    ),
  }
}

const SPIRAL_STEPS: SpiralStep[] = ['pakinggan', 'kilalanin', 'basahin', 'gamitin']

export const VocabularyModulePage: React.FC<Props> = ({ moduleNumber }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { playAudio, stopAudio } = useAudio()
  const { playWrong } = useSfx()

  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null)
  const [currentStep, setCurrentStep] = useState<SpiralStep>('pakinggan')
  const [matchOptions, setMatchOptions] = useState<MatchOption[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [correctId, setCorrectId] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [, setModuleAccuracy] = useState<number | null>(null)
  const [nextWordError, setNextWordError] = useState<unknown>(null)
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [optionsError, setOptionsError] = useState<unknown>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wordImageFailed, setWordImageFailed] = useState(false)
  const [wordComplete, setWordComplete] = useState(false)
  const [moduleComplete, setModuleComplete] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const totalWords = moduleNumber === 2 ? 10 : 9
  const [wordsCompleted, setWordsCompleted] = useState(0)
  const [celebrate, setCelebrate] = useState(0)
  const [gamitinSentence, setGamitinSentence] = useState<string>(
    'Ang aking _____ ay malaki at maliwanag.'
  )
  const [, setGamitinCorrectWord] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)

  const { replay: replayWord } = useAudioElement(currentWord?.audioUrl ?? null)
  const optionsRequestRef = useRef(0)
  const isFirstLoad = useRef(true)

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
    if (currentWord) {
      duckBGM(4000)
    }
  }, [currentWord, currentWord?.wordId, currentStep, duckBGM])

  useEffect(() => {
    if (moduleComplete && bgmRef.current) {
      bgmRef.current.pause()
    }
  }, [moduleComplete])

  const isModule2 = moduleNumber === 2
  const npc = isModule2 ? 'lola' : 'lolo'
  const npcName = isModule2 ? 'Lola' : 'Lolo'
  const npcImage = isModule2 ? '/images/Lola-C.png' : '/images/Lolo-C.png'
  const npcLines = getNpcLines(moduleNumber)

  useScrollToTop(`${currentWord?.wordId ?? ''}-${currentStep}`)

  useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [stopAudio])

  useEffect(() => {
    setWordImageFailed(false)
  }, [currentWord?.imageUrl])

  const refreshAccuracy = useCallback(async () => {
    try {
      const res = await api.get(`/modules/progress/${user?.id}`)
      const mod = (res.data as ModuleProgress[]).find(
        (p) => p.moduleNumber === moduleNumber
      )
      setModuleAccuracy(mod?.accuracy ?? null)
    } catch {
      /* empty */
    }
  }, [user?.id, moduleNumber])

  useEffect(() => {
    if (user?.id) void refreshAccuracy()
  }, [user?.id, refreshAccuracy])

  const fetchNextWord = useCallback(async () => {
    setIsLoading(true)
    setNextWordError(null)
    setWordComplete(false)
    try {
      const res = await api.get<VocabWord | null>(
        `/vocabulary/next?userId=${user?.id}&moduleNumber=${moduleNumber}`
      )
      if (res.status === 204 || !res.data) {
        setModuleComplete(true)
        return
      }
      setCurrentWord(res.data)
      if (!isFirstLoad.current) {
        setWordsCompleted((prev) => Math.min(prev + 1, totalWords))
      }
      isFirstLoad.current = false
      setCurrentStep('pakinggan')
      setSelectedId(null)
      setCorrectId(null)
      setAttempts(0)
      setMatchOptions([])
      setOptionsError(null)
      setOptionsLoading(false)
      setFeedback(null)
      setGamitinCorrectWord(null)
      void refreshAccuracy()
    } catch (err) {
      setNextWordError(err)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, moduleNumber, refreshAccuracy, totalWords])

  useEffect(() => {
    if (user?.id) void fetchNextWord()
  }, [user?.id, fetchNextWord])

  const loadStepOptions = useCallback(
    async (word: VocabWord, step: SpiralStep) => {
      const requestId = ++optionsRequestRef.current
      setOptionsError(null)
      setOptionsLoading(true)
      setMatchOptions([])
      try {
        if (step === 'gamitin') {
          const res = await api.get(`/vocabulary/gamitin/${word.wordId}`)
          if (optionsRequestRef.current !== requestId) return
          setGamitinSentence(res.data.sentenceTemplate)
          setGamitinCorrectWord(res.data.correctWord)
          
          const mappedOptions = res.data.options.map(
            (opt: string, i: number) => ({
              // Trim and lowercase both sides so casing/spaces don't break the match
              id: opt.trim().toLowerCase() === res.data.correctWord.trim().toLowerCase() 
                ? 'correct-answer' 
                : `opt${i}`,
              label: opt,
            })
          )
          setMatchOptions(mappedOptions)
        } else if (step !== 'pakinggan') {
          const res = await api.get(
            `/vocabulary/match/${word.wordId}?step=${step}`
          )
          if (optionsRequestRef.current !== requestId) return
          const mappedOptions = res.data.options.map(
            (o: { wordId: string; word: string; imageUrl: string }) => ({
              id: o.wordId,
              label: o.word,
              // ✅ Dynamically pick module2 or module3
              imageUrl: `/images/module${moduleNumber}/${o.word.toLowerCase()}.png`,
            })
          )
          setMatchOptions(mappedOptions)
        }
      } catch (err) {
        if (optionsRequestRef.current === requestId) {
          setOptionsError(err)
        }
      } finally {
        if (optionsRequestRef.current === requestId) {
          setOptionsLoading(false)
        }
      }
    },
    [moduleNumber] // ✅ Add moduleNumber to dependency array
  )

  useEffect(() => {
    if (currentWord && currentStep !== 'pakinggan') {
      void loadStepOptions(currentWord, currentStep)
    }
  }, [currentWord, currentStep, loadStepOptions])

  const handleStepSelect = useCallback(
    async (optionId: string) => {
      if (!currentWord || selectedId || isSubmitting) return
      
      duckBGM(2000)

      const isCorrect = 
        (currentStep === 'gamitin' && optionId === 'correct-answer') || 
        (currentStep !== 'gamitin' && optionId === currentWord.wordId)

      setSelectedId(optionId)
      setFeedback(isCorrect ? 'correct' : 'incorrect')

      if (isCorrect) {
        setCelebrate((count) => count + 1)
        if (currentStep === 'gamitin') {
          try {
            await playAudio(
              `/static/assets/audio/npc/sentence_${currentWord.word.toLowerCase()}.mp3`,
              { fallbackText: gamitinSentence.replace(/_{3,}/g, currentWord.word) }
            )
          } catch { /* empty */ }
        } else {
          replayWord()
        }
      } else {
        playWrong()
      }

      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setCorrectId(
        isCorrect || newAttempts >= HINT_AFTER_ATTEMPTS 
          ? (currentStep === 'gamitin' ? 'correct-answer' : currentWord.wordId) 
          : null
      )

      setIsSubmitting(true)
      try {
        await api.post('/vocabulary/progress', {
          userId: user?.id,
          wordId: currentWord.wordId,
          step: currentStep,
          correct: isCorrect,
        })
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
      void refreshAccuracy()

      if (!isCorrect) {
        setTimeout(() => {
          setSelectedId(null)
          setFeedback(null)
        }, 1200)
        return
      }

      setTimeout(() => {
        const stepIdx = SPIRAL_STEPS.indexOf(currentStep)
        if (stepIdx < SPIRAL_STEPS.length - 1) {
          setCurrentStep(SPIRAL_STEPS[stepIdx + 1])
          setSelectedId(null)
          setCorrectId(null)
          setFeedback(null)
          setAttempts(0)
        } else {
          setWordComplete(true)
        }
      }, 1500)
    },
    [
      currentWord,
      selectedId,
      isSubmitting,
      attempts,
      user?.id,
      currentStep,
      gamitinSentence,
      playAudio,
      replayWord,
      playWrong,
      refreshAccuracy,
      duckBGM,
    ]
  )

  const handleResetModule = useCallback(async () => {
    setIsResetting(true)
    try {
      await api.delete(`/modules/reset/${user?.id}/${moduleNumber}`)
      setModuleComplete(false)
      setWordsCompleted(0)
      isFirstLoad.current = true
      await fetchNextWord()
      if (bgmRef.current) {
        bgmRef.current.play()?.catch(() => {})
      }
    } catch {
      toast.error('Hindi na-reset ang module')
    } finally {
      setIsResetting(false)
    }
  }, [user?.id, moduleNumber, fetchNextWord])

  const formatWordAsSyllables = (word: string) => {
    const upperWord = word.toUpperCase()
    const syllables: Record<string, string> = {
      'MATA': 'MA - TA', 'KAMAY': 'KA - MAY', 'ILONG': 'I - LONG', 'BIBIG': 'BI - BIG', 'TENGA': 'TE - NGA',
      'ULO': 'U - LO', 'PAA': 'PA - A', 'LIKOD': 'LI - KOD', 'TIYAN': 'TI - YAN', 'NOO': 'NO - O',
      'NANAY': 'NA - NAY', 'TATAY': 'TA - TAY', 'LOLA': 'LO - LA', 'LOLO': 'LO - LO', 'KUYA': 'KU - YA',
      'ATE': 'A - TE', 'BUNSO': 'BUN - SO', 'TIYA': 'TI - YA', 'TIYO': 'TI - YO', 'BAHAY': 'BA - HAY',
      'KAIN': 'KA - IN', 'TULOG': 'TU - LOG', 'LARO': 'LA - RO', 'LUTO': 'LU - TO', 'LINIS': 'LI - NIS',
      'BASA': 'BA - SA', 'LIGO': 'LI - GO', 'KAPATID': 'KA - PA - TID',
    }
    if (syllables[upperWord]) return syllables[upperWord]
    if (upperWord.length <= 3) return upperWord
    const mid = Math.ceil(upperWord.length / 2)
    return `${upperWord.slice(0, mid)} - ${upperWord.slice(mid)}`
  }

  const moduleTitle = moduleNumber === 2 ? 'Module 2: Salita ng Katawan' : 'Module 3: Salita ng Pamilya'
  const nextModuleNumber = moduleNumber === 2 ? 3 : 4
  const nextModuleTitle = moduleNumber === 2 ? 'Module 3: Salita ng Pamilya' : 'Module 4: Bumuo ng Pangungusap'

  if (moduleComplete) {
    return (
      <div className="min-h-screen w-full bg-[#EAF0D8] flex items-center justify-center p-4">
        <PracticeCompletion
          title={`Natapos ang ${moduleTitle}!`}
          message={`Kahanga-hanga! Natapos mo ang ${moduleTitle}. Susunod: ${nextModuleTitle}.`}
          messageEn={`Amazing! You finished ${moduleTitle}. Next: ${nextModuleTitle}.`}
          onContinue={() => navigate(`/modules/${nextModuleNumber}`)}
          continueLabel={`Magpatuloy sa Module ${nextModuleNumber}`}
          continueLabelEn={`Continue to Module ${nextModuleNumber}`}
          onRetry={() => void handleResetModule()}
          retryLabel="Subukan Ulit"
          retryLabelEn="Try Again"
          retrying={isResetting}
          onExit={() => navigate('/trail')}
          exitLabel="Pumunta sa Pamana Trail"
          illustration={
            <img
              src={npcImage}
              alt={npcName}
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

  if (wordComplete) {
    return (
      <div className="min-h-screen w-full bg-[#EAF0D8] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm text-center shadow-2xl border-b-8 border-gray-200">
          <img src={npcImage} alt={npcName} className="mx-auto mb-4 h-40 w-40 object-contain drop-shadow-2xl" />
          <h2 className="mb-2 font-heading text-2xl font-bold text-[#2b5c3b]">Natuto ka ng bagong salita!</h2>
          <p className="text-[#3f7d52] mb-6">"{currentWord?.word}" — naitala na sa iyong talasalitaan!</p>
          <button
            onClick={() => void fetchNextWord()}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-6 py-4 rounded-full border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
          >
            Susunod na Salita
            <ArrowRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#EAF0D8] flex items-center justify-center">
        <LoadingState message="Naglo-load ng salita..." />
      </div>
    )
  }

  if (nextWordError) {
    return (
      <div className="min-h-screen w-full bg-[#EAF0D8] flex items-center justify-center">
        <ErrorState description="Hindi ma-load ang susunod na salita. Pakisubukan muli." onRetry={() => void fetchNextWord()} />
      </div>
    )
  }

  if (!currentWord) return null

  const stepIdx = SPIRAL_STEPS.indexOf(currentStep)

  return (
    <div
      className="relative h-screen w-full bg-cover bg-center flex flex-col font-sans overflow-hidden"
      style={{ 
        backgroundImage: isModule2 
          ? "url('/images/module-bg/m-Garden.jpg')" 
          : "url('/images/module-bg/m-Kitchen.jpg')" 
      }}
    >
      <div className="absolute inset-0 bg-black/10 z-0 pointer-events-none" />

      {/* Top Bar — Identical to Module 1 */}
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
            src={isModule2 ? "/images/moduletitles/C_m2.png" : "/images/moduletitles/C_m3.png"}
            alt={`Module ${moduleNumber}`}
            className={cn(
              "object-contain drop-shadow-2xl",
              isModule2 
                ? "w-[320px] md:w-[430px] lg:w-[510px]" 
                : "w-[280px] md:w-[360px] lg:w-[450px]"
            )}
          />
        </div>

        <div className="flex items-center z-30">
          <div className="flex items-center bg-[#8CC63F] border-[4px] border-[#6A9C2C] rounded-full p-1.5 pr-5 shadow-[0_4px_6px_rgba(0,0,0,0.3)] w-64 md:w-[22rem] lg:w-[26rem]">
            <div className="flex-1 h-6 md:h-8 bg-[#2F6A3E] rounded-full border-[3px] border-[#204D2B] shadow-[inset_0_3px_5px_rgba(0,0,0,0.6)] overflow-hidden relative">
              <div
                className="absolute top-0 left-0 h-full bg-[#8CC63F] rounded-full transition-all duration-500 border-r-2 border-[#6A9C2C]"
                style={{ width: `${moduleComplete ? 100 : Math.round((wordsCompleted / totalWords) * 100)}%` }}
              />
            </div>
            <span className="ml-3 text-white font-black text-xl md:text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] min-w-[3.5ch] text-right tracking-wide">
              {moduleComplete ? 100 : Math.round((wordsCompleted / totalWords) * 100)}%
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-20 flex justify-center flex-wrap gap-2 md:gap-4 mt-8 md:mt-12 px-4">
        {SPIRAL_STEPS.map((step, idx) => {
          const isCurrent = currentStep === step
          const isDone = idx < stepIdx
          const label = STEP_LABELS[step].split('. ')[1]

          return (
            <div
              key={step}
              className={cn(
                'px-5 py-2 md:px-7 md:py-2.5 rounded-full font-bold text-sm md:text-base border-b-4 shadow-md whitespace-nowrap transition-all',
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

      <div className="flex-1 relative flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 pb-6 mt-8 z-10 gap-4 md:gap-6">
        
        <div className="w-full flex justify-center z-30 scale-110 md:scale-125 origin-top mb-4 md:mb-6">
          <NPCDialogue
            npc={npc as 'lolo' | 'lola'}
            line={npcLines[currentStep].fil}
            lineEn={npcLines[currentStep].en}
            audioUrl={`/static/assets/audio/npc/${npc}_mod${moduleNumber}_${currentStep}.mp3`}
            celebrate={celebrate}
            resetKey={`${currentWord.wordId}-${currentStep}`}
            moduleNumber={moduleNumber}
          />
        </div>

        <div
          className="relative w-full max-w-2xl bg-cover bg-center bg-no-repeat rounded-3xl p-6 shadow-2xl flex flex-col items-center min-h-[160px] justify-center border-b-[8px] border-[#C2410C]"
          style={{ backgroundImage: isModule2 ? "url('/images/module-bg/m2_w.png')" : "url('/images/module-bg/m3_w.png')" }}
        >
          <div className="relative z-10 w-full flex items-center justify-center">
            
            {currentStep === 'pakinggan' && (
              <div className="flex flex-wrap flex-row items-center justify-center gap-4 sm:gap-8 w-full">
                <div className="flex flex-col items-center gap-2">
                  <p 
                    className="font-black text-4xl md:text-5xl uppercase tracking-wider"
                    style={{ color: 'white', WebkitTextStroke: '2px black', paintOrder: 'stroke fill' }}
                  >
                    {formatWordAsSyllables(currentWord.word)}
                  </p>
                  <div onClickCapture={() => duckBGM(2000)}>
                    <AudioPlayer 
                      audioUrl={currentWord.audioUrl} 
                      fallbackText={currentWord.word} 
                      size="md" 
                      label="" 
                      labelEn="" 
                    />
                  </div>
                </div>
                  <div className="flex flex-col items-center justify-center bg-white p-1 rounded-xl shadow-xl border-2 border-white">
                  {!wordImageFailed ? (
                    <img 
                      // ✅ Dynamically pick module2 or module3
                      src={`/images/module${moduleNumber}/${currentWord.word.toLowerCase()}.png`} 
                      alt={currentWord.word} 
                      onError={() => setWordImageFailed(true)} 
                      className="h-24 w-24 md:h-28 md:w-28 object-cover rounded-xl" 
                    />
                  ) : (
                    <div className="flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-xl bg-gray-100 font-heading text-xl font-bold text-gray-500">
                      {currentWord.word}
                    </div>
                  )}
                </div>
              </div>
            )}

            {(currentStep === 'kilalanin' || currentStep === 'basahin') && (
              <div className="flex flex-col items-center gap-4">
                <div onClickCapture={() => duckBGM(2000)}>
                  <AudioPlayer audioUrl={currentWord.audioUrl} fallbackText={currentWord.word} size="lg" label="" labelEn="" />
                </div>
                <BilingualText
                  as="p"
                  fil="Pakinggan muli"
                  en="Tap to hear it again"
                  className="text-center"
                  filClassName="text-sm font-black text-white drop-shadow-md"
                  enClassName="text-xs text-white/80 font-bold"
                />
              </div>
            )}

            {currentStep === 'gamitin' && (
              <div className="text-xl md:text-2xl font-black text-white text-center drop-shadow-md flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-4">
                {(() => {
                  const parts = gamitinSentence.split(/_{3,}/)
                  const selectedWord = selectedId ? matchOptions.find(o => o.id === selectedId)?.label : null
                  
                  return (
                    <>
                      <span>{parts[0]}</span>
                      <span className={cn(
                        "inline-block transition-all duration-300 text-amber-300",
                        selectedWord ? "scale-110" : "tracking-widest"
                      )}>
                        {selectedWord || '_____'}
                      </span>
                      <span>{parts[1]}</span>
                    </>
                  )
                })()}
              </div>
            )}

          </div>
        </div>

        {currentStep === 'pakinggan' && (
          <div className="w-full flex justify-center mt-2 z-20">
            <button
              onClick={() => setCurrentStep('kilalanin')}
              className="flex items-center gap-3 bg-[#43A047] hover:bg-[#2E7D32] text-white font-black px-10 py-4 rounded-full border-b-[6px] border-[#1B5E20] active:border-b-0 active:translate-y-1 transition-all shadow-xl text-xl"
            >
              Susunod <ArrowRight className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        )}

        <div className="w-full max-w-2xl px-4 md:px-0 mt-2">
          {optionsLoading ? (
            <div className="text-white font-bold text-center animate-pulse">Inihahanda ang mga opsyon...</div>
          ) : optionsError ? (
             <div className="text-red-400 font-bold text-center bg-black/50 p-4 rounded-xl">Hindi ma-load ang mga opsyon.</div>
          ) : currentStep !== 'pakinggan' && (
                                   <div className="grid grid-cols-4 gap-3 md:gap-6 w-full">
              {matchOptions.map((opt) => {
                const isSelected = selectedId === opt.id
                const isCorrect = correctId === opt.id
                const isWrong = isSelected && !isCorrect

                let bgImg = '/images/Y_button.png'
                if (isCorrect) bgImg = '/images/G_button.png'
                else if (isWrong) bgImg = '/images/R_button.png'

                return (
                  <button
                    key={opt.id}
                    onClick={() => void handleStepSelect(opt.id)}
                    disabled={isSubmitting || (!!selectedId && !isWrong)}
                    className="relative aspect-square flex items-center justify-center bg-contain bg-center bg-no-repeat transition-transform hover:scale-105 active:scale-95 disabled:hover:scale-100 outline-none focus-visible:ring-4 focus-visible:ring-amber-400 rounded-[20%] overflow-hidden drop-shadow-md"
                    style={{ backgroundImage: `url(${bgImg})` }}
                  >
                    {opt.imageUrl && currentStep === 'kilalanin' ? (
                      <div className="w-full h-full flex items-center justify-center p-2 md:p-3">
                        <img
                          src={opt.imageUrl}
                          alt={opt.label || 'Option'}
                          className="w-full h-full object-cover rounded-[15%] drop-shadow-md"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'block';
                          }}
                        />
                        <span
                          className="hidden absolute text-2xl md:text-4xl font-black text-white drop-shadow-[0_4px_2px_rgba(0,0,0,0.4)] text-center leading-tight px-2"
                          style={{ WebkitTextStroke: '2px #2A1B10', paintOrder: 'stroke fill' }}
                        >
                          {opt.label}
                        </span>
                      </div>
                    ) : (
                      <span
                        className="text-2xl md:text-4xl font-black text-white mt-1 md:mt-2 drop-shadow-[0_4px_2px_rgba(0,0,0,0.4)] text-center leading-tight px-2"
                        style={{ WebkitTextStroke: '2px #2A1B10', paintOrder: 'stroke fill' }}
                      >
                        {opt.label}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="h-12 w-full flex items-center justify-center mt-2">
          {feedback && (
            <div
              className={cn(
                'px-6 py-2 rounded-full font-bold text-white shadow-lg animate-bounce',
                feedback === 'correct' ? 'bg-green-500' : 'bg-red-500'
              )}
            >
              {feedback === 'correct' ? 'Tama! Magaling!' : 'Almost ! Try again.'}
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

export default VocabularyModulePage