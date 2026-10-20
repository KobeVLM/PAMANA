import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useAudio } from '@/contexts/AudioContext'
import { PracticePageLayout } from '@/components/practice/PracticePageLayout'
import {
  PracticeHeader,
  type PracticeStep,
} from '@/components/practice/PracticeHeader'
import { PracticeStage } from '@/components/practice/PracticeStage'
import { PromptStage } from '@/components/practice/PromptStage'
import { FeedbackSlot } from '@/components/practice/FeedbackSlot'
import { FillBlank } from '@/components/practice/FillBlank'
import { PracticeCompletion } from '@/components/practice/PracticeCompletion'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { OptionGrid } from '@/components/game/OptionGrid'
import { HINT_AFTER_ATTEMPTS } from '@/components/game/constants'
import { FeedbackBanner } from '@/components/feedback/FeedbackBanner'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { BilingualText } from '@/components/common/BilingualText'
import { useAudioElement, useSfx } from '@/hooks/useGameAudio'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { STRINGS, bi, type Bi } from '@/lib/i18n'
import api from '@/lib/api'
import type { ModuleProgress } from '@/types'
import { ArrowRight } from 'lucide-react'

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

const NPC_LINES: Record<SpiralStep, Bi> = {
  pakinggan: bi(
    'Pakinggan natin ang bagong salita! Pindutin ang tunog at tandaan!',
    "Let's listen to the new word! Tap the sound and remember it!"
  ),
  kilalanin: bi(
    'Kilalanin! Alin ang larawan ng narinig na salita?',
    'Identify! Which picture shows the word you heard?'
  ),
  basahin: bi(
    'Basahin! Alin ang tamang salitang nakasulat?',
    'Read! Which is the correct written word?'
  ),
  gamitin: bi(
    'Gamitin ang salita sa pangungusap. Piliin ang tamang sagot!',
    'Use the word in a sentence. Choose the correct answer!'
  ),
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
  const [moduleAccuracy, setModuleAccuracy] = useState<number | null>(null)
  const [nextWordError, setNextWordError] = useState<unknown>(null)
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [optionsError, setOptionsError] = useState<unknown>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wordImageFailed, setWordImageFailed] = useState(false)
  const [wordComplete, setWordComplete] = useState(false)
  const [moduleComplete, setModuleComplete] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [celebrate, setCelebrate] = useState(0)
  const [gamitinSentence, setGamitinSentence] = useState<string>(
    'Ang aking _____ ay malaki at maliwanag.'
  )

  const { replay: replayWord } = useAudioElement(currentWord?.audioUrl ?? null)
  const optionsRequestRef = useRef(0)

  useScrollToTop(`${currentWord?.wordId ?? ''}-${currentStep}`)

  useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [stopAudio])

  useEffect(() => {
    setWordImageFailed(false)
  }, [currentWord?.imageUrl])

  /** Best-effort refresh of the live module accuracy for the star meter. */
  const refreshAccuracy = useCallback(async () => {
    try {
      const res = await api.get(`/modules/progress/${user?.id}`)
      const mod = (res.data as ModuleProgress[]).find(
        (p) => p.moduleNumber === moduleNumber
      )
      setModuleAccuracy(mod?.accuracy ?? null)
    } catch {
      // Keep the last known accuracy
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
      setCurrentStep('pakinggan')
      setSelectedId(null)
      setCorrectId(null)
      setAttempts(0)
      setMatchOptions([])
      setOptionsError(null)
      setOptionsLoading(false)
      void refreshAccuracy()
    } catch (err) {
      setNextWordError(err)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, moduleNumber, refreshAccuracy])

  useEffect(() => {
    if (user?.id) void fetchNextWord()
  }, [user?.id, fetchNextWord])

  /** Load the options for the current spiral step; retriable via ErrorState. */
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
          const mappedOptions = res.data.options.map(
            (opt: string, i: number) => ({
              id: opt === res.data.correctWord ? word.wordId : `opt${i}`,
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
              imageUrl: o.imageUrl,
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
    []
  )

  useEffect(() => {
    if (currentWord && currentStep !== 'pakinggan') {
      void loadStepOptions(currentWord, currentStep)
    }
  }, [currentWord, currentStep, loadStepOptions])

  const handleStepSelect = useCallback(
    async (optionId: string) => {
      if (!currentWord || selectedId || isSubmitting) return
      const isCorrect = optionId === currentWord.wordId
      setSelectedId(optionId)

      if (isCorrect) {
        setCelebrate((count) => count + 1)
        if (currentStep === 'gamitin') {
          try {
            await playAudio(
              `/static/assets/audio/npc/sentence_${currentWord.word.toLowerCase()}.mp3`,
              { fallbackText: gamitinSentence.replace(/_{3,}/g, currentWord.word) }
            )
          } catch {
            // Playback failure should not block progress
          }
        } else {
          replayWord()
        }
      } else {
        playWrong()
      }

      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      // Reveal the answer only when correct or after the hint attempt threshold.
      setCorrectId(isCorrect || newAttempts >= HINT_AFTER_ATTEMPTS ? currentWord.wordId : null)

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
          description: 'Pakitingnan ang koneksyon at subukan muli. (Check your connection and try again.)',
        })
        setSelectedId(null)
        setCorrectId(null)
        setAttempts((a) => Math.max(0, a - 1))
        setIsSubmitting(false)
        return
      }
      setIsSubmitting(false)
      void refreshAccuracy()

      setTimeout(() => {
        if (isCorrect) {
          const stepIdx = SPIRAL_STEPS.indexOf(currentStep)
          if (stepIdx < SPIRAL_STEPS.length - 1) {
            setCurrentStep(SPIRAL_STEPS[stepIdx + 1])
            setSelectedId(null)
            setCorrectId(null)
            setAttempts(0)
          } else {
            setWordComplete(true)
          }
        } else {
          setSelectedId(null)
        }
      }, 1200)
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
    ]
  )

  const handleResetModule = useCallback(async () => {
    setIsResetting(true)
    try {
      await api.delete(`/modules/reset/${user?.id}/${moduleNumber}`)
      setModuleComplete(false)
      await fetchNextWord()
    } catch {
      toast.error('Hindi na-reset ang module', {
        description: 'Subukan muli mamaya. (Try again later.)',
      })
    } finally {
      setIsResetting(false)
    }
  }, [user?.id, moduleNumber, fetchNextWord])

  const moduleTitle =
    moduleNumber === 2 ? 'Module 2: Salita ng Katawan' : 'Module 3: Salita ng Pamilya'
  const moduleLocation = moduleNumber === 2 ? 'Hardin ni Lola' : 'Kusina ni Lolo'
  const nextModuleNumber = moduleNumber === 2 ? 3 : 4
  const nextModuleTitle =
    moduleNumber === 2 ? 'Module 3: Salita ng Pamilya' : 'Module 4: Bumuo ng Pangungusap'

  if (moduleComplete) {
    return (
      <PracticePageLayout className="flex items-center justify-center">
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
              src="/images/Lolo-C.png"
              alt="Lolo"
              width={256}
              height={256}
              decoding="async"
              className="mx-auto h-52 w-52 object-contain drop-shadow-2xl sm:h-64 sm:w-64"
            />
          }
        />
      </PracticePageLayout>
    )
  }

  if (wordComplete) {
    return (
      <PracticePageLayout className="flex items-center justify-center">
        <div className="card-story max-w-sm p-6 text-center sm:p-8">
          <img
            src="/images/Lolo-C.png"
            alt="Lolo"
            width={256}
            height={256}
            decoding="async"
            className="mx-auto mb-4 h-40 w-40 object-contain drop-shadow-2xl sm:h-48 sm:w-48"
          />
          <h2 className="mb-2 font-heading text-xl font-bold text-[#2b5c3b]">
            Natuto ka ng bagong salita!
          </h2>
          <BilingualText
            as="p"
            fil={`"${currentWord?.word}" — naitala na sa iyong talasalitaan!`}
            en={`"${currentWord?.word}" — added to your vocabulary!`}
            className="mb-6"
            filClassName="text-[#3f7d52]"
            enClassName="text-sm text-[#5a7a63]"
          />
          <Button
            variant="pamana"
            onClick={() => void fetchNextWord()}
            className="w-full"
          >
            <BilingualText
              as="span"
              fil="Susunod na Salita"
              en="Next Word"
              filClassName="text-sm font-semibold"
              enClassName="text-xs font-normal opacity-80"
            />
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </PracticePageLayout>
    )
  }

  const stepIdx = SPIRAL_STEPS.indexOf(currentStep)
  const steps: PracticeStep[] = SPIRAL_STEPS.map((step, idx) => ({
    label: STEP_LABELS[step].split('. ')[1],
    state: idx < stepIdx ? 'done' : step === currentStep ? 'current' : 'pending',
  }))

  const renderOptions = () => {
    if (optionsLoading) {
      return <LoadingState skeletonRows={1} message="Inihahanda ang mga opsyon..." />
    }
    if (optionsError) {
      return (
        <ErrorState
          description="Hindi ma-load ang mga pagpipilian. Pakisubukan muli."
          onRetry={() => currentWord && void loadStepOptions(currentWord, currentStep)}
        />
      )
    }
    return (
      <OptionGrid
        options={matchOptions}
        selectedId={selectedId}
        correctId={correctId}
        onSelect={(id) => void handleStepSelect(id)}
        type={currentStep === 'kilalanin' ? 'image' : 'text'}
        size={currentStep === 'kilalanin' ? 'lg' : 'md'}
        showLabels={currentStep === 'kilalanin'}
        attempts={attempts}
        disabled={isSubmitting}
      />
    )
  }

  const isSplitStep = currentStep === 'kilalanin' || currentStep === 'basahin'

  return (
    <PracticePageLayout maxWidth="5xl">
      <PracticeHeader
        title={moduleTitle}
        subtitle={`${moduleLocation} · Spiral Loop`}
        backLabel="Pamana Trail"
        onBack={() => navigate('/trail')}
        sticky
        steps={steps}
        progressLabel={
          moduleAccuracy === null
            ? 'Katumpakan ng Module'
            : `Katumpakan: ${Math.round(moduleAccuracy)}%`
        }
        progressLabelEn={
          moduleAccuracy === null
            ? 'Module Accuracy'
            : `Accuracy: ${Math.round(moduleAccuracy)}%`
        }
        progressValue={moduleAccuracy ?? undefined}
      />

      {isLoading ? (
        <LoadingState message="Naglo-load ng salita..." />
      ) : nextWordError ? (
        <ErrorState
          description="Hindi ma-load ang susunod na salita. Pakisubukan muli."
          onRetry={() => void fetchNextWord()}
        />
      ) : currentWord ? (
        <PracticeStage
          split={isSplitStep}
          stage={
            <>
              <NPCDialogue
                npc="lolo"
                line={NPC_LINES[currentStep].fil}
                lineEn={NPC_LINES[currentStep].en}
                audioUrl={`/static/assets/audio/npc/lolo_mod3_${currentStep}.mp3`}
                autoPlay={!selectedId && !wordComplete}
                celebrate={celebrate}
                resetKey={`${currentWord.wordId}-${currentStep}`}
              />

              {currentStep === 'pakinggan' && (
                <PromptStage
                  variant="image-word"
                  ariaLabel="Pakinggan ang salita (Listen to the word)"
                >
                  {!wordImageFailed ? (
                    <img
                      src={currentWord.imageUrl}
                      alt={currentWord.word}
                      onError={() => setWordImageFailed(true)}
                      width={160}
                      height={160}
                      decoding="async"
                      className="h-40 w-40 rounded-2xl border-2 border-white/70 object-contain"
                    />
                  ) : (
                    <div className="flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-white/70 bg-white font-heading text-xl font-bold text-[#2b5c3b]/80">
                      {currentWord.word}
                    </div>
                  )}
                  <p className="font-heading text-3xl font-bold text-[#2b5c3b]">
                    {currentWord.word}
                  </p>
                  <AudioPlayer
                    audioUrl={currentWord.audioUrl}
                    fallbackText={currentWord.word}
                    size="lg"
                    label={STRINGS.listenWord.fil}
                    labelEn={STRINGS.listenWord.en}
                  />
                  <BilingualText
                    as="p"
                    fil={STRINGS.listenAgain.fil}
                    en={STRINGS.listenAgain.en}
                    filClassName="text-sm text-[#3f7d52]"
                    enClassName="text-xs text-[#5a7a63]"
                  />
                  <Button
                    variant="pamana"
                    onClick={() => {
                      setCurrentStep('kilalanin')
                    }}
                  >
                    <BilingualText
                      as="span"
                      fil="Susunod"
                      en="Next"
                      filClassName="text-sm font-semibold"
                      enClassName="text-xs font-normal opacity-80"
                    />
                    <ArrowRight aria-hidden="true" />
                  </Button>
                </PromptStage>
              )}

              {(currentStep === 'kilalanin' || currentStep === 'basahin') && (
                <PromptStage
                  variant="audio"
                  ariaLabel={
                    currentStep === 'kilalanin'
                      ? 'Kilalanin ang larawan (Identify the picture)'
                      : 'Basahin ang salita (Read the word)'
                  }
                >
                  <AudioPlayer
                    audioUrl={currentWord.audioUrl}
                    fallbackText={currentWord.word}
                    size="lg"
                    label={STRINGS.listenWord.fil}
                    labelEn={STRINGS.listenWord.en}
                  />
                  <BilingualText
                    as="p"
                    fil={STRINGS.listenAgain.fil}
                    en={STRINGS.listenAgain.en}
                    className="text-center"
                    filClassName="text-sm text-[#3f7d52]"
                    enClassName="text-xs text-[#5a7a63]"
                  />
                </PromptStage>
              )}

              {currentStep === 'gamitin' && (
                <PromptStage
                  variant="blank"
                  ariaLabel="Gamitin ang salita sa pangungusap (Use the word in a sentence)"
                >
                  <FillBlank
                    template={gamitinSentence}
                    options={matchOptions.map((option) => ({
                      id: option.id,
                      label: option.label ?? '',
                    }))}
                    selectedId={selectedId}
                    correctId={currentWord.wordId}
                    attempts={attempts}
                    disabled={isSubmitting}
                    onSelect={(id) => void handleStepSelect(id)}
                  />
                </PromptStage>
              )}

              <FeedbackSlot>
                {attempts >= HINT_AFTER_ATTEMPTS && (
                  <FeedbackBanner variant="hint">
                    <BilingualText
                      as="p"
                      fil={
                        currentStep === 'gamitin'
                          ? '💡 Ang gintong salita ang tamang sagot!'
                          : 'Ang gintong kahon ang tamang sagot!'
                      }
                      en={
                        currentStep === 'gamitin'
                          ? '💡 The golden word is the correct answer!'
                          : 'The golden box is the correct answer!'
                      }
                      filClassName="text-sm"
                      enClassName="text-xs opacity-80"
                    />
                  </FeedbackBanner>
                )}
              </FeedbackSlot>
            </>
          }
          tray={isSplitStep ? renderOptions() : null}
        />
      ) : null}
    </PracticePageLayout>
  )
}

export default VocabularyModulePage
