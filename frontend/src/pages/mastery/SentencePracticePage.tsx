import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { PracticePageLayout } from '@/components/practice/PracticePageLayout'
import { PracticeHeader } from '@/components/practice/PracticeHeader'
import { PracticeCompletion } from '@/components/practice/PracticeCompletion'
import { WordTiles, type WordTile } from '@/components/practice/WordTiles'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { FeedbackBanner } from '@/components/feedback/FeedbackBanner'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useSfx } from '@/hooks/useGameAudio'
import { BilingualText } from '@/components/common/BilingualText'
import { STRINGS, bi } from '@/lib/i18n'
import api from '@/lib/api'
import type { ModuleProgress } from '@/types'
import { ChevronRight, MousePointerClick, Undo2 } from 'lucide-react'

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

const toTiles = (words: string[]): WordTile[] =>
  words.map((word, index) => ({ id: `word-${index}-${word}`, word }))

/** Ensure the tiles are genuinely scrambled relative to the correct order. */
const prepareScrambled = (words: string[], correctOrder: string[]): string[] => {
  const scrambled = [...words]
  if (scrambled.length <= 1) return scrambled

  let attempts = 0
  while (scrambled.join(' ') === correctOrder.join(' ') && attempts < 10) {
    scrambled.sort(() => Math.random() - 0.5)
    attempts++
  }
  return scrambled
}

export const SentencePracticePage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
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

  // Route guard: Module 4 must be complete first.
  const checkPrerequisite = useCallback(async () => {
    if (!user?.id) return { allowed: false }
    const res = await api.get(`/modules/progress/${user.id}`)
    const mod = (res.data as ModuleProgress[]).find((p) => p.moduleNumber === 4)
    return { allowed: Boolean(mod?.isComplete) }
  }, [user?.id])

  const { data: guard, error: guardError, isLoading: guardLoading, retry: retryGuard } =
    useAsyncData(checkPrerequisite)

  useEffect(() => {
    if (guard && !guard.allowed) {
      navigate('/trail', { replace: true })
    }
  }, [guard, navigate])

  // Fetch a sentence task. Round changes are driven by retryTask().
  const loadTask = useCallback(async () => {
    const res = await api.get<SentenceTask>('/sentences/task', {
      params: { tier: 1 },
    })
    const task = res.data
    if (
      !task?.taskId ||
      !Array.isArray(task.correctOrder) ||
      task.correctOrder.length === 0
    ) {
      throw new Error('Malformed sentence task response')
    }
    return task
  }, [])

  const {
    data: task,
    error: taskError,
    isLoading: taskLoading,
    retry: retryTask,
  } = useAsyncData(loadTask)

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
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
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
    } catch {
      // Audio synthesis not supported or blocked
    }
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

    const correct =
      arranged.map((i) => i.word).join(' ') === task.correctOrder.join(' ')
    setIsCorrect(correct)
    setSubmitted(true)
    setSelectedSwapIndex(null)

    if (correct) {
      setScore((s) => s + 1)
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
      retryTask()
    }
  }

  const handlePlayAgain = () => {
    setIntroPlayed(false)
    setScore(0)
    setIsComplete(false)
    setRound(1)
    retryTask()
  }

  const arrangedSentence = useMemo(
    () => arranged.map((i) => i.word).join(' '),
    [arranged]
  )

  if (guardLoading) {
    return (
      <PracticePageLayout>
        <LoadingState message="Inihahanda ang gawain..." />
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

  if (isComplete) {
    return (
      <PracticePageLayout className="flex items-center justify-center">
        <PracticeCompletion
          message={`Matagumpay mong natapos ang ${MAX_ROUNDS} pangungusap sa pagbuo ng pangungusap.`}
          messageEn={`You successfully built all ${MAX_ROUNDS} sentences.`}
          score={score}
          total={MAX_ROUNDS}
          onRetry={handlePlayAgain}
          onExit={() => navigate('/home')}
        />
      </PracticePageLayout>
    )
  }

  return (
    <PracticePageLayout>
      <PracticeHeader
        title="Pagsasanay: Pagbuo ng Pangungusap"
        subtitle="Sanayin ang iyong kakayahan sa pagbuo ng mga tamang pangungusap sa Filipino."
        badge="Practice Mode"
        backLabel="Bumalik sa Home"
        onBack={() => navigate('/home')}
        score={score}
        progressLabel={`Pangungusap ${round} ng ${MAX_ROUNDS}`}
        progressLabelEn={`Sentence ${round} of ${MAX_ROUNDS}`}
        progressValue={(round / MAX_ROUNDS) * 100}
      />

      <div className="mb-6">
        <NPCDialogue
          npc="lolo"
          line={NPC_LINE.fil}
          lineEn={NPC_LINE.en}
          audioUrl={NPC_AUDIO}
          autoPlay={!introPlayed}
          onAudioEnd={() => setIntroPlayed(true)}
        />
      </div>

      {taskLoading ? (
        <LoadingState message="Inihahanda ang gawain..." />
      ) : taskError ? (
        <ErrorState onRetry={retryTask} />
      ) : task ? (
        <div className="space-y-6">
          {task.audioUrl && (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <AudioPlayer
                audioUrl={task.audioUrl}
                size="sm"
                label={STRINGS.listenSentence.fil}
                labelEn={STRINGS.listenSentence.en}
              />
              <BilingualText
                as="p"
                fil="Pakinggan ang tamang pagkakasunod ng pangungusap"
                en="Listen to the correct order of the sentence"
                filClassName="text-sm text-green-300"
                enClassName="text-xs text-green-200/70"
              />
            </div>
          )}

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-green-300 sm:text-sm">
                <MousePointerClick
                  className="h-4 w-4 text-pamana-gold"
                  aria-hidden="true"
                />
                <BilingualText
                  as="span"
                  fil="I-drag o i-click ang dalawang salita para pagpalitin:"
                  en="Drag or click two words to swap them:"
                  filClassName="text-xs font-medium text-green-300 sm:text-sm"
                  enClassName="text-[10px] text-green-200/60"
                />
              </div>
              {!submitted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetOrder}
                  title="I-reset ang pagkakasunod (Reset the order)"
                  className="text-white/60 hover:text-white"
                >
                  <Undo2 aria-hidden="true" />
                  <BilingualText
                    as="span"
                    fil="I-reset"
                    en="Reset"
                    filClassName="text-sm"
                    enClassName="text-[10px] opacity-70"
                  />
                </Button>
              )}
            </div>

            <WordTiles
              items={arranged}
              onReorder={handleReorder}
              selectedIndex={selectedSwapIndex}
              onSelectIndex={handleSelectWord}
              disabled={submitted}
              ariaLabel="Mga salita ng pangungusap (Sentence words)"
            />

            {selectedSwapIndex !== null && !submitted && (
              <BilingualText
                as="p"
                fil="Pumili ng isa pang salita na nais mong ipalit sa napiling salita."
                en="Choose another word to swap with the selected word."
                className="animate-pulse"
                filClassName="text-xs text-amber-300"
                enClassName="text-[10px] text-amber-200/70"
              />
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="mb-1 text-xs font-medium text-white/40">
              Iyong pangungusap:
            </p>
            <p className="min-h-[28px] font-heading text-lg font-bold tracking-wide text-white sm:text-xl">
              {arrangedSentence}
            </p>
          </div>

          {submitted && (
            <FeedbackBanner
              variant={isCorrect ? 'correct' : 'incorrect'}
              assertive={!isCorrect}
              className="items-start"
            >
              <div className="flex w-full items-center justify-between gap-3">
                <div>
                  <BilingualText
                    fil={isCorrect ? STRINGS.correct.fil : 'Hindi pa tama — subukan ulit!'}
                    en={isCorrect ? STRINGS.correct.en : 'Not quite — try again!'}
                    filClassName="font-heading text-base font-bold"
                  />
                  {!isCorrect && (
                    <BilingualText
                      as="p"
                      fil="Tamang sagot:"
                      en="Correct answer:"
                      className="mt-0.5"
                      filClassName="text-sm text-pamana-gold"
                      enClassName="text-xs text-pamana-gold/70"
                    />
                  )}
                  {!isCorrect && (
                    <p className="font-semibold text-white">
                      {task.correctOrder.join(' ')}
                    </p>
                  )}
                </div>
                {task.audioUrl && (
                  <AudioPlayer
                    audioUrl={task.audioUrl}
                    size="sm"
                    label={STRINGS.listenSentence.fil}
                    labelEn={STRINGS.listenSentence.en}
                  />
                )}
              </div>
            </FeedbackBanner>
          )}

          {!submitted ? (
            <Button
              variant="pamana"
              onClick={handleSubmit}
              disabled={taskLoading || arranged.length === 0}
              className="w-full"
            >
              <BilingualText
                as="span"
                fil="Isumite"
                en="Submit"
                filClassName="text-sm font-semibold"
                enClassName="text-xs font-normal opacity-80"
              />
            </Button>
          ) : (
            <Button variant="gold" onClick={handleNext} className="w-full text-stone-900 [&_svg]:text-stone-900">
              <BilingualText
                as="span"
                fil={round >= MAX_ROUNDS ? 'Tapusin' : 'Susunod'}
                en={round >= MAX_ROUNDS ? 'Finish' : 'Next'}
                filClassName="text-sm font-semibold"
                enClassName="text-xs font-normal opacity-80"
              />
              <ChevronRight aria-hidden="true" />
            </Button>
          )}
        </div>
      ) : (
        <ErrorState onRetry={retryTask} />
      )}
    </PracticePageLayout>
  )
}

export default SentencePracticePage
