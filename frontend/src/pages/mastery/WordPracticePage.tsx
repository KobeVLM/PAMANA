import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAudio } from '@/contexts/AudioContext'
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
  'Basahin! Alin ang tamang salitang nakasulat?',
  'Read! Which is the correct written word?'
)
const ROUND_TOTAL = 5

const DOMAIN_LABELS: Record<string, string> = {
  self_body: 'Bahagi ng Katawan',
  family_home: 'Pamilya at Tahanan',
}

const pickRoundWords = (words: VocabWord[]): VocabWord[] => {
  const shuffled = [...words].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, ROUND_TOTAL)
}

export const WordPracticePage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isAudioPlaying } = useAudio()

  const [roundWords, setRoundWords] = useState<VocabWord[]>([])
  const [npcIntroDone, setNpcIntroDone] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const [celebrate, setCelebrate] = useState(0)
  const hasPlayedNpcRef = React.useRef(false)
  const prevIsAudioPlayingRef = React.useRef(false)

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

  // Route guard: Module 2 must be complete first.
  const checkPrerequisite = useCallback(async () => {
    if (!user?.id) return { allowed: false }
    const res = await api.get(`/modules/progress/${user.id}`)
    const mod = (res.data as ModuleProgress[]).find((p) => p.moduleNumber === 2)
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

  // Load the match options for the current word.
  const loadOptions = useCallback(async () => {
    if (!currentWord) return null
    const res = await api.get(`/vocabulary/match/${currentWord.wordId}?step=basahin`)
    const options = res.data?.options as MatchOptionDto[] | undefined
    if (!Array.isArray(options) || options.length < 2) {
      throw new Error('Malformed match options response')
    }
    return {
      options: options.map((opt) => ({
        id: String(opt.wordId ?? opt.id),
        label: opt.word ?? opt.label,
        imageUrl: opt.imageUrl,
      })),
      correctId: String(res.data?.targetWordId ?? currentWord.wordId),
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

  // NPC intro: play once on the first question, then unlock the word audio.
  useEffect(() => {
    if (flow.roundIndex > 0 || hasPlayedNpcRef.current) {
      setNpcIntroDone(true)
      return
    }

    const fallbackTimer = setTimeout(() => {
      setNpcIntroDone(true)
      hasPlayedNpcRef.current = true
    }, 3500)

    return () => clearTimeout(fallbackTimer)
  }, [flow.roundIndex])

  useEffect(() => {
    if (flow.roundIndex === 0 && !hasPlayedNpcRef.current) {
      if (prevIsAudioPlayingRef.current && !isAudioPlaying) {
        setNpcIntroDone(true)
        hasPlayedNpcRef.current = true
      }
    }
    prevIsAudioPlayingRef.current = isAudioPlaying
  }, [isAudioPlaying, flow.roundIndex])

  useEffect(() => setImageFailed(false), [currentWord?.wordId])

  const handleSelect = useCallback(
    (optionId: string) => {
      if (!roundData || !currentWord) return
      flow.answer({
        selectedId: optionId,
        correctId: roundData.correctId,
        isCorrect: optionId === roundData.correctId,
      })
    },
    [roundData, currentWord, flow]
  )

  const handlePlayAgain = useCallback(() => {
    if (vocabulary) setRoundWords(pickRoundWords(vocabulary))
    setNpcIntroDone(false)
    hasPlayedNpcRef.current = false
    prevIsAudioPlayingRef.current = false
    flow.reset()
  }, [vocabulary, flow])

  const domainLabel = useMemo(
    () =>
      currentWord
        ? DOMAIN_LABELS[currentWord.domain] ?? currentWord.domain
        : null,
    [currentWord]
  )

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
          message={`Matagumpay mong natapos ang ${totalRounds} salita sa pagtutugma ng salita.`}
          messageEn={`You successfully finished matching all ${totalRounds} words.`}
          score={flow.score}
          total={totalRounds}
          onRetry={handlePlayAgain}
          onExit={() => navigate('/home')}
        />
      </PracticePageLayout>
    )
  }

  const gameContent = () => {
    if (vocabularyLoading) return <LoadingState message="Inihahanda ang mga salita..." />
    if (vocabularyError) return <ErrorState onRetry={retryVocabulary} />
    if (vocabulary && vocabulary.length === 0) {
      return (
        <EmptyState
          title="Walang salitang nakita"
          description="Wala pang mga salita para sa pagsasanay. Subukan muli mamaya."
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
    if (!currentWord) return <LoadingState message="Inihahanda ang mga salita..." />

    if (optionsLoading) return <LoadingState message="Kinukuha ang mga pagpipilian..." />
    if (optionsError || !roundData) return <ErrorState onRetry={retryOptions} />

    return (
      <PracticeStage
        stage={
          <>
            <NPCDialogue
              npc="lolo"
              line={NPC_LINE.fil}
              lineEn={NPC_LINE.en}
              audioUrl="/static/assets/audio/npc/lolo_mod3_basahin.mp3"
              autoPlay={flow.roundIndex === 0 && !npcIntroDone}
              celebrate={celebrate}
              resetKey={flow.roundIndex}
            />

            <PromptStage
              variant="image-word"
              ariaLabel="Pakinggan at basahin ang salita (Listen and read the word)"
            >
              {domainLabel && (
                <span className="rounded-full border-2 border-white bg-white px-3 py-1 text-center text-xs font-semibold text-[#3f7d52]">
                  {domainLabel}
                </span>
              )}

              {flow.selectedId === null ? (
                <>
                  <div className="space-y-1">
                    <h2 className="font-heading text-2xl font-bold text-[#2b5c3b] sm:text-3xl">
                      Pakinggan ang Salita
                    </h2>
                    <BilingualText
                      as="p"
                      fil="Makinig nang mabuti at piliin ang tamang salita sa ibaba."
                      en="Listen carefully and choose the correct word below."
                      className="max-w-sm"
                      filClassName="text-sm text-[#3f7d52]"
                      enClassName="text-xs text-[#5a7a63]"
                    />
                  </div>

                  <div className="flex flex-col items-center gap-2 py-2">
                    <AudioPlayer
                      key={`${currentWord.wordId}-${npcIntroDone}`}
                      audioUrl={currentWord.audioUrl}
                      autoPlay={npcIntroDone}
                      size="lg"
                      label={STRINGS.listenWord.fil}
                      labelEn={STRINGS.listenWord.en}
                    />
                    <BilingualText
                      as="p"
                      fil="Pindutin para pakinggan muli"
                      en="Press to hear it again"
                      className="text-center"
                      filClassName="text-xs font-medium text-[#3f7d52]/80"
                      enClassName="text-[10px] text-[#5a7a63]"
                    />
                  </div>
                </>
              ) : (
                <>
                  {currentWord.imageUrl && !imageFailed && (
                    <img
                      src={currentWord.imageUrl}
                      alt={currentWord.word}
                      onError={() => setImageFailed(true)}
                      width={160}
                      height={160}
                      decoding="async"
                      className="h-32 w-32 animate-bounce-in rounded-2xl border-2 border-white/70 bg-white object-contain p-2 drop-shadow-md sm:h-40 sm:w-40"
                    />
                  )}

                  <div className="font-heading text-3xl font-extrabold uppercase tracking-wider text-[#2b5c3b] sm:text-4xl">
                    {currentWord.word}
                  </div>
                </>
              )}
            </PromptStage>

            <FeedbackSlot>
              {flow.selectedId !== null && (
                <FeedbackBanner
                  variant={flow.feedback ?? 'incorrect'}
                  assertive={flow.feedback === 'incorrect'}
                >
                  {flow.feedback === 'correct' ? (
                    <BilingualText fil={STRINGS.correct.fil} en={STRINGS.correct.en} />
                  ) : (
                    <span>
                      <BilingualText
                        as="span"
                        fil="Halos! Ang tamang salita ay:"
                        en="Almost! The correct word is:"
                      />
                      <span className="ml-1 font-bold text-[#8f1d1d] underline">
                        {currentWord.word}
                      </span>
                    </span>
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
            type="text"
            disabled={flow.isProcessing}
          />
        }
      />
    )
  }

  return (
    <PracticePageLayout maxWidth="5xl">
      <PracticeHeader
        title="Pagsasanay: Pagtutugma ng Salita"
        subtitle="Sanayin ang iyong kakayahan sa pagbasa at pagtutugma ng mga salita."
        badge="Practice Mode"
        backLabel="Bumalik sa Home"
        onBack={() => navigate('/home')}
        progressLabel={`Tanong ${flow.roundIndex + 1} ng ${totalRounds}`}
        progressLabelEn={`Question ${flow.roundIndex + 1} of ${totalRounds}`}
        progressValue={((flow.roundIndex + 1) / totalRounds) * 100}
      />
      {gameContent()}
    </PracticePageLayout>
  )
}

export default WordPracticePage
