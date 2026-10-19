import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useAudio } from '@/contexts/AudioContext'
import { PracticePageLayout } from '@/components/practice/PracticePageLayout'
import {
  PracticeHeader,
  type PracticeStep,
} from '@/components/practice/PracticeHeader'
import { WordTiles, type WordTile } from '@/components/practice/WordTiles'
import { PracticeStage } from '@/components/practice/PracticeStage'
import { PromptStage } from '@/components/practice/PromptStage'
import { FeedbackSlot } from '@/components/practice/FeedbackSlot'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { FeedbackBanner } from '@/components/feedback/FeedbackBanner'
import { HINT_AFTER_ATTEMPTS } from '@/components/game/constants'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { BilingualText } from '@/components/common/BilingualText'
import { useSfx } from '@/hooks/useGameAudio'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { STRINGS } from '@/lib/i18n'
import api from '@/lib/api'
import { Home } from 'lucide-react'

interface SentenceTask {
  taskId: string
  tier: 1 | 2
  scrambledWords: string[]
  correctOrder: string[]
  audioUrl: string
  sentence: string
}

const TOTAL_TASKS_PER_TIER = 5

const toTiles = (words: string[]): WordTile[] =>
  words.map((word, index) => ({ id: `word-${index}-${word}`, word }))

export const SentenceModulePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { playAudio, stopAudio } = useAudio()
  const { playWrong } = useSfx()

  useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [stopAudio])

  const [tier, setTier] = useState<1 | 2>(1)
  const [taskIndex, setTaskIndex] = useState(0)
  const [task, setTask] = useState<SentenceTask | null>(null)
  const [tiles, setTiles] = useState<WordTile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [showReunionEnding, setShowReunionEnding] = useState(false)
  const [showTierAnnouncement, setShowTierAnnouncement] = useState(false)
  const [celebrate, setCelebrate] = useState(0)

  useScrollToTop(`${tier}-${taskIndex}`)

  const fetchTask = useCallback(
    async (tierNum: 1 | 2) => {
      setIsLoading(true)
      setLoadError(null)
      setFeedback(null)
      setAttempts(0)
      try {
        const res = await api.get<SentenceTask>(
          `/sentences/task?userId=${user?.id}&tier=${tierNum}`
        )
        const data = res.data
        if (
          !data?.taskId ||
          !Array.isArray(data.scrambledWords) ||
          !Array.isArray(data.correctOrder)
        ) {
          throw new Error('Malformed sentence task response')
        }
        setTask(data)
        setTiles(toTiles(data.scrambledWords))
      } catch (err) {
        setLoadError(err)
      } finally {
        setIsLoading(false)
      }
    },
    [user?.id]
  )

  useEffect(() => {
    if (user?.id) void fetchTask(1)
  }, [user?.id, fetchTask])

  const handleStartTier2 = useCallback(() => {
    setShowTierAnnouncement(false)
    setTier(2)
    setTaskIndex(0)
    void fetchTask(2)
  }, [fetchTask])

  const handleSubmit = useCallback(async () => {
    if (!task || isSubmitting || feedback === 'correct') return

    const orderedWords = tiles.map((t) => t.word)
    const isCorrect = orderedWords.join(' ') === task.correctOrder.join(' ')
    const newAttempts = attempts + 1
    setFeedback(isCorrect ? 'correct' : 'incorrect')
    setAttempts(newAttempts)
    if (isCorrect) setCelebrate((count) => count + 1)
    const accuracy = isCorrect ? 100 : Math.max(0, 100 - newAttempts * 25)

    setIsSubmitting(true)

    if (isCorrect && task.audioUrl) {
      try {
        await playAudio(task.audioUrl, true)
      } catch {
        // Playback failure should not block progress
      }
    } else if (!isCorrect) {
      playWrong()
    }

    try {
      const res = await api.post('/sentences/progress', {
        userId: user?.id,
        taskId: task.taskId,
        submittedOrder: orderedWords,
        accuracy,
      })

      if (res.data.moduleComplete) {
        setTimeout(() => setShowReunionEnding(true), 1500)
      } else if (isCorrect && res.data.tierComplete && tier === 1) {
        setTimeout(() => setShowTierAnnouncement(true), 1500)
      } else if (isCorrect) {
        const nextIndex = taskIndex + 1
        setTimeout(() => {
          setTaskIndex(nextIndex)
          void fetchTask(tier)
        }, 1500)
      }
    } catch {
      toast.error('Hindi naitala ang sagot', {
        description: 'Pakitingnan ang koneksyon at subukan muli. (Check your connection and try again.)',
      })
      setFeedback(null)
      setAttempts((a) => Math.max(0, a - 1))
    } finally {
      setIsSubmitting(false)
    }
  }, [
    task,
    isSubmitting,
    feedback,
    tiles,
    attempts,
    user?.id,
    tier,
    taskIndex,
    fetchTask,
    playAudio,
    playWrong,
  ])

  // ── Tier 2 announcement screen ──────────────────────────────────────────
  if (showTierAnnouncement) {
    return (
      <PracticePageLayout className="flex items-center justify-center">
        <div className="card-story max-w-md space-y-6 p-6 text-center sm:p-8">
          <div className="animate-bounce text-6xl" aria-hidden="true">
            🌟
          </div>
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFC107]/40 text-2xl"
                aria-hidden="true"
              >
                👵
              </div>
              <span className="font-heading font-bold text-[#D4A017]">
                Lola
              </span>
            </div>
            <BilingualText
              as="p"
              fil='"Napakahusay mo, apo! Handa na tayo sa susunod na hamon!"'
              en='"Great job, my grandchild! We are ready for the next challenge!"'
              filClassName="font-heading text-lg font-bold leading-relaxed text-[#2b5c3b]"
              enClassName="text-sm leading-relaxed text-[#5a7a63]"
            />
          </div>
          <div className="rounded-2xl border-2 border-[#d5e5d0] bg-[#f4f9f0] p-4 text-left">
            <BilingualText
              as="p"
              fil="✅ Tier 1: Paturol — Natapos na!"
              en="✅ Tier 1: Statements — Finished!"
              className="mb-1"
              filClassName="text-sm font-semibold text-[#3f7d52]"
              enClassName="text-xs text-[#5a7a63]"
            />
            <BilingualText
              as="p"
              fil="Susunod: Tier 2 — Patanong (Tanong)"
              en="Next: Tier 2 — Questions"
              filClassName="text-sm text-[#5a7a63]"
              enClassName="text-xs text-[#5a7a63]"
            />
            <BilingualText
              as="p"
              fil="Gawing tanong ang mga pangungusap!"
              en="Turn the sentences into questions!"
              className="mt-1"
              filClassName="text-xs text-[#5a7a63]"
              enClassName="text-[10px] text-[#5a7a63]"
            />
          </div>
          <Button
            variant="gold"
            size="lg"
            onClick={handleStartTier2}
            className="w-full text-stone-900 [&_svg]:text-stone-900"
          >
            <BilingualText
              as="span"
              fil="Simulan ang Tier 2!"
              en="Start Tier 2!"
              filClassName="text-base font-bold"
              enClassName="text-sm font-normal opacity-80"
            />
          </Button>
        </div>
      </PracticePageLayout>
    )
  }

  // ── Reunion ending screen ────────────────────────────────────────────────
  if (showReunionEnding) {
    return (
      <PracticePageLayout className="flex items-center justify-center">
        <div className="card-story max-w-md animate-bounce-in p-6 text-center sm:p-8">
          <div className="mb-4 text-6xl" aria-hidden="true">
            🎊
          </div>
          <h2 className="mb-3 font-heading text-3xl font-bold text-[#2b5c3b]">
            Tagpuan!
          </h2>
          <div className="mb-4 text-5xl" aria-hidden="true">
            👨‍👩‍👧
          </div>
          <BilingualText
            as="p"
            fil="Nagawa mo! Nakausap mo na ang iyong mga magulang sa Filipino. Ipinagmamalaki ka ng iyong pamilya!"
            en="You did it! You spoke with your parents in Filipino. Your family is proud of you!"
            className="mb-6"
            filClassName="text-base leading-relaxed text-[#3f7d52]"
            enClassName="text-sm leading-relaxed text-[#5a7a63]"
          />
          <div className="mb-6 rounded-2xl border-2 border-[#FFC107] bg-[#fff7db] p-4">
            <BilingualText
              as="p"
              fil='"Anak, ipinagmamalaki kita. Natuto ka ng wikang Filipino at naihanda ka ng pamana ng aming wika."'
              en='"Child, we are proud of you. You learned the Filipino language and prepared for the heritage of our tongue."'
              filClassName="italic text-[#7a5200]"
              enClassName="text-sm italic text-[#7a5200]/80"
            />
            <p className="mt-2 text-sm text-[#5a7a63]">
              — Lolo at Lola{' '}
              <span className="text-xs text-[#5a7a63]">(Grandpa and Grandma)</span>
            </p>
          </div>
          <Button
            variant="gold"
            size="lg"
            onClick={() => navigate('/trail')}
            className="w-full text-stone-900 [&_svg]:text-stone-900"
          >
            <Home aria-hidden="true" />
            <BilingualText
              as="span"
              fil="Bumalik sa Pamana Trail"
              en="Back to the Pamana Trail"
              filClassName="text-base font-bold"
              enClassName="text-sm font-normal opacity-80"
            />
          </Button>
        </div>
      </PracticePageLayout>
    )
  }

  const steps: PracticeStep[] = [
    { label: 'Tier 1: Paturol', state: tier === 1 ? 'current' : 'done' },
    { label: 'Tier 2: Patanong', state: tier === 2 ? 'current' : 'pending' },
  ]
  const clampedTaskNumber = Math.min(taskIndex + 1, TOTAL_TASKS_PER_TIER)

  return (
    <PracticePageLayout maxWidth="5xl">
      <PracticeHeader
        title="Module 4: Bumuo ng Pangungusap"
        subtitle={`Sala ng Tagpuan · ${
          tier === 1 ? 'Paturol (Pahayag)' : 'Patanong (Tanong)'
        }`}
        backLabel="Pamana Trail"
        onBack={() => navigate('/trail')}
        sticky
        steps={steps}
        progressLabel={`Gawain ${clampedTaskNumber} ng ${TOTAL_TASKS_PER_TIER}`}
        progressLabelEn={`Task ${clampedTaskNumber} of ${TOTAL_TASKS_PER_TIER}`}
        progressValue={(clampedTaskNumber / TOTAL_TASKS_PER_TIER) * 100}
      />

      {isLoading ? (
        <LoadingState message="Inihahanda ang gawain..." />
      ) : loadError ? (
        <ErrorState onRetry={() => void fetchTask(tier)} />
      ) : task ? (
        <PracticeStage
          stage={
            <>
              <NPCDialogue
                npc="lolo"
                line={
                  tier === 1
                    ? 'Ayusin ang mga salita para bumuo ng pangungusap! I-drag ang mga salita sa tamang pagkakasunod.'
                    : 'Gawing tanong ang pangungusap! Paano mo itatanong ito kay Lolo?'
                }
                lineEn={
                  tier === 1
                    ? 'Arrange the words to build a sentence! Drag the words into the correct order.'
                    : 'Turn the sentence into a question! How would you ask this to Lolo?'
                }
                audioUrl={`/static/assets/audio/npc/lolo_mod4_intro_tier${tier}.mp3`}
                celebrate={celebrate}
                resetKey={`${tier}-${taskIndex}`}
              />

              {task.audioUrl && (
                <PromptStage
                  variant="audio"
                  ariaLabel="Pakinggan ang tamang pagkakasunod (Listen to the correct order)"
                >
                  <AudioPlayer
                    audioUrl={task.audioUrl}
                    size="lg"
                    label={STRINGS.listenSentence.fil}
                    labelEn={STRINGS.listenSentence.en}
                  />
                  <BilingualText
                    as="p"
                    fil="Pakinggan ang tamang pagkakasunod"
                    en="Listen to the correct order"
                    className="text-center"
                    filClassName="text-sm text-[#3f7d52]"
                    enClassName="text-xs text-[#5a7a63]"
                  />
                </PromptStage>
              )}

              <PromptStage
                variant="canvas"
                ariaLabel="Iyong pangungusap (Your sentence)"
              >
                <BilingualText
                  as="p"
                  fil="Iyong pangungusap:"
                  en="Your sentence:"
                  filClassName="text-xs font-medium text-[#3f7d52] sm:text-sm"
                  enClassName="text-[10px] text-[#5a7a63]"
                />
                <p className="font-heading text-lg font-bold leading-relaxed text-[#2b5c3b] sm:text-xl">
                  {tiles.map((t) => t.word).join(' ')}
                </p>
              </PromptStage>

              <FeedbackSlot>
                {feedback && (
                  <FeedbackBanner
                    variant={feedback}
                    assertive={feedback === 'incorrect'}
                  >
                    <BilingualText
                      fil={feedback === 'correct' ? STRINGS.correct.fil : 'Hindi pa tama — subukan ulit!'}
                      en={feedback === 'correct' ? STRINGS.correct.en : 'Not quite — try again!'}
                    />
                    {feedback === 'incorrect' && attempts >= HINT_AFTER_ATTEMPTS && (
                      <div className="mt-1">
                        <BilingualText
                          as="p"
                          fil="Tamang sagot:"
                          en="Correct answer:"
                          filClassName="text-xs text-[#8f1d1d]"
                          enClassName="text-[10px] text-[#8f1d1d]/80"
                        />
                        <strong className="text-[#8f1d1d]">
                          {task.correctOrder.join(' ')}
                        </strong>
                      </div>
                    )}
                  </FeedbackBanner>
                )}
              </FeedbackSlot>
            </>
          }
          tray={
            <div className="space-y-4">
              <div className="card-story space-y-3 p-5">
                <BilingualText
                  as="p"
                  fil="I-drag ang mga salita sa tamang pagkakasunod:"
                  en="Drag the words into the correct order:"
                  filClassName="text-xs font-medium text-[#3f7d52] sm:text-sm"
                  enClassName="text-[10px] text-[#5a7a63]"
                />
                <WordTiles
                  items={tiles}
                  onReorder={setTiles}
                  disabled={isSubmitting || feedback === 'correct'}
                  ariaLabel="Mga salita ng pangungusap (Sentence words)"
                />
              </div>

              <Button
                variant="pamana"
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={feedback === 'correct'}
                className="w-full"
              >
                <BilingualText
                  as="span"
                  fil={isSubmitting ? 'Sinusuri...' : 'Isumite ang Pangungusap'}
                  en={isSubmitting ? 'Checking...' : 'Submit Sentence'}
                  filClassName="text-sm font-semibold"
                  enClassName="text-xs font-normal opacity-80"
                />
              </Button>
            </div>
          }
        />
      ) : null}
    </PracticePageLayout>
  )
}

export default SentenceModulePage
