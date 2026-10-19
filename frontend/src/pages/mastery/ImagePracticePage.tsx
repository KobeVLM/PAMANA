import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { PracticePageLayout } from '@/components/practice/PracticePageLayout'
import { PracticeHeader } from '@/components/practice/PracticeHeader'
import { PracticeCompletion } from '@/components/practice/PracticeCompletion'
import { PracticeStage } from '@/components/practice/PracticeStage'
import { PromptStage } from '@/components/practice/PromptStage'
import { FeedbackSlot } from '@/components/practice/FeedbackSlot'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { OptionGrid } from '@/components/game/OptionGrid'
import { FeedbackBanner } from '@/components/feedback/FeedbackBanner'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useRoundFlow } from '@/hooks/useRoundFlow'
import { useAudioElement, useSfx } from '@/hooks/useGameAudio'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { BilingualText } from '@/components/common/BilingualText'
import { STRINGS, bi } from '@/lib/i18n'
import api from '@/lib/api'
import type { ModuleProgress } from '@/types'

interface VocabWord {
  wordId: string
  word: string
  domain: string
  audioUrl: string
  imageUrl: string
  ordinal?: number
}

interface VocabularyItemDto {
  wordId?: string
  id?: string
  word: string
  domain: string
  audioUrl: string
  imageUrl: string
  ordinal?: number
}

interface MatchOptionDto {
  wordId?: string
  id?: string
  word?: string
  label?: string
  imageUrl?: string
}

const NPC_LINE = bi(
  'Kilalanin! Alin ang larawan ng narinig na salita?',
  'Identify! Which picture shows the word you heard?'
)
const NPC_AUDIO = '/static/assets/audio/npc/lolo_mod3_kilalanin.mp3'
const ROUND_TOTAL = 5

const pickRoundWords = (words: VocabWord[]): VocabWord[] => {
  const shuffled = [...words].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, ROUND_TOTAL)
}

export const ImagePracticePage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [roundWords, setRoundWords] = useState<VocabWord[]>([])
  const [introDone, setIntroDone] = useState(false)
  const [celebrate, setCelebrate] = useState(0)
  const hasPlayedIntroRef = React.useRef(false)

  const totalRounds = roundWords.length || ROUND_TOTAL

  const flow = useRoundFlow({
    totalRounds,
    onAnswer: (isCorrect) => {
      if (isCorrect) {
        setCelebrate((count) => count + 1)
        playTarget()
      } else playWrong()
    },
  })

  const currentWord = roundWords[flow.roundIndex] ?? null

  useScrollToTop(String(flow.roundIndex))

  // Route guard: Module 3 must be complete first.
  const checkPrerequisite = useCallback(async () => {
    if (!user?.id) return { allowed: false }
    const res = await api.get(`/modules/progress/${user.id}`)
    const mod = (res.data as ModuleProgress[]).find((p) => p.moduleNumber === 3)
    return { allowed: Boolean(mod?.isComplete) }
  }, [user?.id])

  const { data: guard, error: guardError, isLoading: guardLoading, retry: retryGuard } =
    useAsyncData(checkPrerequisite)

  useEffect(() => {
    if (guard && !guard.allowed) {
      navigate('/trail', { replace: true })
    }
  }, [guard, navigate])

  // Load the vocabulary pool for this run.
  const loadVocabulary = useCallback(async () => {
    const res = await api.get('/vocabulary/all')
    if (!Array.isArray(res.data)) throw new Error('Malformed vocabulary response')
    return (res.data as VocabularyItemDto[]).map((item) => ({
      wordId: String(item.wordId ?? item.id),
      word: item.word,
      domain: item.domain,
      audioUrl: item.audioUrl,
      imageUrl: item.imageUrl,
      ordinal: item.ordinal,
    }))
  }, [])

  const {
    data: vocabulary,
    error: vocabularyError,
    isLoading: vocabularyLoading,
    retry: retryVocabulary,
  } = useAsyncData(loadVocabulary)

  useEffect(() => {
    if (vocabulary && vocabulary.length > 0) {
      setRoundWords(pickRoundWords(vocabulary))
    }
  }, [vocabulary])

  // Load picture options for the current word.
  const loadOptions = useCallback(async () => {
    if (!currentWord) return null
    const res = await api.get(`/vocabulary/match/${currentWord.wordId}?step=kilalanin`)
    const options = res.data?.options as MatchOptionDto[] | undefined
    if (!Array.isArray(options) || options.length < 2) {
      throw new Error('Malformed match options response')
    }
    return {
      options: options.map((opt) => ({
        id: String(opt.wordId ?? opt.id),
        imageUrl: opt.imageUrl,
        label: opt.word ?? opt.label,
      })),
      correctId: String(res.data?.correctId ?? res.data?.targetWordId ?? currentWord.wordId),
    }
  }, [currentWord])

  const {
    data: roundData,
    error: optionsError,
    isLoading: optionsLoading,
    retry: retryOptions,
  } = useAsyncData(loadOptions)

  const { replay: playTarget } = useAudioElement(currentWord?.audioUrl)
  const { playWrong } = useSfx()

  // Questions 2-5: play the target word as soon as the new round appears.
  useEffect(() => {
    if (flow.roundIndex === 0 || !currentWord) return
    const timer = setTimeout(() => playTarget(), 300)
    return () => clearTimeout(timer)
  }, [flow.roundIndex, currentWord, playTarget])

  const handleNpcAudioEnd = useCallback(() => {
    if (hasPlayedIntroRef.current) return
    hasPlayedIntroRef.current = true
    setIntroDone(true)
    playTarget()
  }, [playTarget])

  const handleSelect = useCallback(
    (optionId: string) => {
      if (!roundData) return
      flow.answer({
        selectedId: optionId,
        correctId: roundData.correctId,
        isCorrect: optionId === roundData.correctId,
      })
    },
    [roundData, flow]
  )

  const handlePlayAgain = useCallback(() => {
    if (vocabulary) setRoundWords(pickRoundWords(vocabulary))
    setIntroDone(false)
    hasPlayedIntroRef.current = false
    flow.reset()
  }, [vocabulary, flow])

  if (guardLoading) {
    return (
      <PracticePageLayout>
        <LoadingState message="Inihahanda ang pagsasanay..." />
      </PracticePageLayout>
    )
  }

  if (guardError) {
    return (
      <PracticePageLayout>
        <ErrorState onRetry={retryGuard} className="mt-10" />
      </PracticePageLayout>
    )
  }

  if (!guard?.allowed) return null

  if (flow.isComplete) {
    return (
      <PracticePageLayout className="flex items-center justify-center">
        <PracticeCompletion
          message={`Matagumpay mong natapos ang ${totalRounds} tanong sa pagtutugma ng larawan.`}
          messageEn={`You successfully finished all ${totalRounds} picture-matching questions.`}
          score={flow.score}
          total={totalRounds}
          onRetry={handlePlayAgain}
          onExit={() => navigate('/home')}
        />
      </PracticePageLayout>
    )
  }

  const gameContent = () => {
    if (vocabularyLoading) return <LoadingState message="Inihahanda ang mga tanong..." />
    if (vocabularyError) return <ErrorState onRetry={retryVocabulary} />
    if (vocabulary && vocabulary.length === 0) {
      return (
        <EmptyState
          title="Walang salitang nakita"
          description="Wala pang mga larawan para sa pagsasanay. Subukan muli mamaya."
          action={
            <Button variant="pamana" onClick={retryVocabulary}>
              <BilingualText
                as="span"
                fil={STRINGS.retry.fil}
                en={STRINGS.retry.en}
                filClassName="text-sm font-semibold"
                enClassName="text-xs font-normal opacity-80"
              />
            </Button>
          }
        />
      )
    }
    if (!currentWord) return <LoadingState message="Inihahanda ang mga tanong..." />

    if (optionsLoading) return <LoadingState message="Kinukuha ang mga larawan..." />
    if (optionsError || !roundData) return <ErrorState onRetry={retryOptions} />

    return (
      <PracticeStage
        stage={
          <>
            <NPCDialogue
              npc="lolo"
              line={NPC_LINE.fil}
              lineEn={NPC_LINE.en}
              audioUrl={NPC_AUDIO}
              autoPlay={flow.roundIndex === 0 && !introDone}
              onAudioEnd={handleNpcAudioEnd}
              celebrate={celebrate}
              resetKey={flow.roundIndex}
            />

            <PromptStage
              variant="audio"
              ariaLabel="Pakinggan ang salita (Listen to the word)"
            >
              <AudioPlayer
                key={currentWord.wordId}
                audioUrl={currentWord.audioUrl}
                autoPlay={false}
                size="lg"
                label={STRINGS.listenWord.fil}
                labelEn={STRINGS.listenWord.en}
              />
              <BilingualText
                as="p"
                fil={STRINGS.listenAgain.fil}
                en={STRINGS.listenAgain.en}
                className="text-center"
                filClassName="text-xs font-medium text-green-300/80"
                enClassName="text-[10px] text-green-200/60"
              />
            </PromptStage>

            <FeedbackSlot>
              {flow.feedback && (
                <FeedbackBanner
                  variant={flow.feedback}
                  assertive={flow.feedback === 'incorrect'}
                >
                  {flow.feedback === 'correct' ? (
                    <BilingualText fil={STRINGS.correct.fil} en={STRINGS.correct.en} />
                  ) : (
                    <BilingualText
                      fil="Halos! Narito ang tamang larawan."
                      en="Almost! Here is the correct picture."
                    />
                  )}
                </FeedbackBanner>
              )}
            </FeedbackSlot>
          </>
        }
        tray={
          <OptionGrid
            options={roundData.options}
            selectedId={flow.selectedId}
            correctId={flow.correctId}
            onSelect={handleSelect}
            type="image"
            size="lg"
            showLabels
            dimUnselected
            disabled={flow.isProcessing}
          />
        }
      />
    )
  }

  return (
    <PracticePageLayout maxWidth="5xl">
      <PracticeHeader
        title="Pagsasanay: Pagtutugma ng Larawan"
        subtitle="Sanayin ang iyong kakayahan sa pagkilala ng larawan batay sa salitang naririnig."
        badge="Practice Mode"
        backLabel="Bumalik sa Home"
        onBack={() => navigate('/home')}
        accuracy={(flow.score / totalRounds) * 100}
        progressLabel={`Tanong ${flow.roundIndex + 1} ng ${totalRounds}`}
        progressLabelEn={`Question ${flow.roundIndex + 1} of ${totalRounds}`}
        progressValue={((flow.roundIndex + 1) / totalRounds) * 100}
      />
      {gameContent()}
    </PracticePageLayout>
  )
}

export default ImagePracticePage
