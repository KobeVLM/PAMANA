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
import { PracticeStage } from '@/components/practice/PracticeStage'
import { PromptStage } from '@/components/practice/PromptStage'
import { FeedbackSlot } from '@/components/practice/FeedbackSlot'
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
  const [advanceError, setAdvanceError] = useState<{
    subLevel: SubLevel
    setId: number
  } | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [celebrate, setCelebrate] = useState(0)

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

  /** Move to a sub-level/set, refreshing progress. Retriable via banner. */
  const advance = useCallback(
    async (subLevel: SubLevel, setId: number) => {
      setSelectedId(null)
      setCorrectId(null)
      setAttempts(0)
      setFeedback(null)
      setAdvanceError(null)
      try {
        const updatedStatus = await fetchStatus()
        setStatus(updatedStatus)
        const set = await fetchSet(subLevel, setId)
        setCurrentSet(set)
      } catch {
        setAdvanceError({ subLevel, setId })
      }
    },
    [fetchStatus, fetchSet]
  )

  const handleSelect = useCallback(
    async (optionId: string) => {
      if (!currentSet || selectedId || isSubmitting) return
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
      // Reveal the answer only when correct or after the hint attempt threshold.
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
          description: 'Pakitingnan ang koneksyon at subukan muli. (Check your connection and try again.)',
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
        // Stay on the same set so the tiles keep their order; clear only the
        // selection while keeping attempts and the revealed answer so the
        // hint appears once the learner reaches the third attempt.
        setTimeout(() => {
          setSelectedId(null)
          setFeedback(null)
        }, 1200)
        return
      }

      if (currentSet.subLevel === 'rhyming' && !progress.nextSetId) {
        // Module complete. Best effort refresh; the completion screen can
        // still render from the last known status if this fails.
        try {
          const updatedStatus = await fetchStatus()
          setStatus(updatedStatus)
        } catch {
          // Keep the last known status
        }
        setTimeout(() => setModuleComplete(true), 1200)
      } else if (progress.nextSetId) {
        const nextSetId = progress.nextSetId
        setTimeout(() => {
          void advance(currentSet.subLevel, nextSetId)
        }, 1500)
      } else {
        // Sub-level complete: move on to the next sub-level.
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
    ]
  )

  const handleResetModule = useCallback(async () => {
    setIsResetting(true)
    try {
      await api.delete(`/modules/reset/${user?.id}/1`)
      setModuleComplete(false)
      setSelectedId(null)
      setCorrectId(null)
      setFeedback(null)
      setAttempts(0)
      await init()
    } catch {
      toast.error('Hindi na-reset ang module', {
        description: 'Subukan muli mamaya. (Try again later.)',
      })
    } finally {
      setIsResetting(false)
    }
  }, [user?.id, init])

  if (moduleComplete) {
    const hasPassed = Boolean(
      status?.module2Unlocked ||
        (status?.overallAccuracy ?? 0) >= 80 ||
        status?.isComplete
    )
    const accuracy = Math.round(status?.overallAccuracy ?? 0)

    return (
      <PracticePageLayout className="flex items-center justify-center">
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
          retrying={isResetting}
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
      </PracticePageLayout>
    )
  }

  const steps: PracticeStep[] | undefined = status
    ? SUB_LEVELS.map((sl) => {
        const acc = status.subLevelAccuracies[sl] ?? 0
        const label = SUB_LEVEL_LABELS[sl].fil.split('. ')[1]
        return {
          label: acc > 0 ? `${label} · ${Math.round(acc)}%` : label,
          state:
            status.currentSubLevel === sl
              ? 'current'
              : acc >= 80
                ? 'done'
                : 'pending',
        }
      })
    : undefined

  return (
    <PracticePageLayout maxWidth="5xl">
      <PracticeHeader
        title="Module 1: Pakinggan at Kilalanin"
        subtitle="Pinto ng Probinsya · Pagsama ng mga Tunog"
        backLabel="Pamana Trail"
        onBack={() => navigate('/trail')}
        sticky
        steps={steps}
        progressLabel={
          status
            ? `Katumpakan ng Module · Kailangan: 80%`
            : undefined
        }
        progressLabelEn={
          status
            ? `Module Accuracy · Required: 80%`
            : undefined
        }
        progressValue={status ? Math.round(status.moduleAccuracy) : undefined}
      />

      {isLoading ? (
        <LoadingState message="Naglo-load ng aralin..." />
      ) : loadError ? (
        <ErrorState
          description="Hindi ma-load ang aralin ngayon. Pakisubukan muli."
          onRetry={() => void init()}
        />
      ) : currentSet ? (
        <PracticeStage
          split={currentSet.subLevel !== 'pagsama'}
          stage={
            <>
              <NPCDialogue
                npc="lolo"
                line={NPC_LINES[currentSet.subLevel].fil}
                lineEn={NPC_LINES[currentSet.subLevel].en}
                audioUrl={`/static/assets/audio/npc/lolo_mod2_${currentSet.subLevel}.mp3`}
                celebrate={celebrate}
                resetKey={`${currentSet.subLevel}-${currentSet.setId}`}
              />

              {advanceError && (
                <FeedbackBanner variant="info" assertive>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <BilingualText
                      as="p"
                      fil="Hindi ma-load ang susunod na gawain."
                      en="The next activity could not be loaded."
                      filClassName="text-sm"
                      enClassName="text-xs opacity-80"
                    />
                    <Button
                      size="sm"
                      variant="gold"
                      className="text-stone-900 [&_svg]:text-stone-900"
                      onClick={() =>
                        void advance(advanceError.subLevel, advanceError.setId)
                      }
                    >
                      <BilingualText
                        as="span"
                        fil={STRINGS.retry.fil}
                        en={STRINGS.retry.en}
                        filClassName="text-sm font-semibold"
                        enClassName="text-xs font-normal opacity-80"
                      />
                    </Button>
                  </div>
                </FeedbackBanner>
              )}

              {currentSet.subLevel === 'pagsama' ? (
                <PromptStage
                  variant="equation"
                  ariaLabel="Pagsamahin ang mga tunog (Blend the sounds)"
                >
                  <div className="flex flex-wrap flex-col items-center justify-center gap-4 sm:flex-row sm:gap-4">
                    <div className="flex min-w-0 flex-col items-center gap-2">
                      <AudioPlayer
                        audioUrl={currentSet.consonantAudioUrl ?? ''}
                        size="md"
                        label="Pakinggan ang katinig"
                        labelEn="Listen to the consonant"
                      />
                      <span className="font-heading text-2xl font-bold text-[#2b5c3b]">
                        {currentSet.consonant}
                      </span>
                      <BilingualText
                        as="span"
                        fil={UI_TEXT.consonant.fil}
                        en={UI_TEXT.consonant.en}
                        filClassName="text-xs text-[#3f7d52]"
                        enClassName="text-[10px] text-[#5a7a63]"
                      />
                    </div>
                    <span className="text-3xl text-[#2b5c3b]/50" aria-hidden="true">
                      +
                    </span>
                    <div className="flex min-w-0 flex-col items-center gap-2">
                      <AudioPlayer
                        audioUrl={currentSet.vowelAudioUrl ?? ''}
                        size="md"
                        label="Pakinggan ang patinig"
                        labelEn="Listen to the vowel"
                      />
                      <span className="font-heading text-2xl font-bold text-[#2b5c3b]">
                        {currentSet.vowel}
                      </span>
                      <BilingualText
                        as="span"
                        fil={UI_TEXT.vowel.fil}
                        en={UI_TEXT.vowel.en}
                        filClassName="text-xs text-[#3f7d52]"
                        enClassName="text-[10px] text-[#5a7a63]"
                      />
                    </div>
                    <span className="text-3xl text-[#2b5c3b]/50" aria-hidden="true">
                      =
                    </span>
                    <div className="flex min-w-0 flex-col items-center gap-2">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-[#D4A017]/70 bg-white sm:h-20 sm:w-20">
                        <span className="text-3xl font-bold text-[#2b5c3b]/30">?</span>
                      </div>
                      <BilingualText
                        as="span"
                        fil={UI_TEXT.result.fil}
                        en={UI_TEXT.result.en}
                        filClassName="text-xs text-[#3f7d52]"
                        enClassName="text-[10px] text-[#5a7a63]"
                      />
                    </div>
                  </div>
                </PromptStage>
              ) : (
                <PromptStage
                  variant="audio"
                  ariaLabel="Pakinggan ang tunog (Listen to the sound)"
                >
                  <AudioPlayer
                    audioUrl={currentSet.audioUrl}
                    size="lg"
                    label="Pakinggan ang tunog"
                    labelEn="Listen to the sound"
                  />
                  <BilingualText
                    as="p"
                    fil={UI_TEXT.listenAgain.fil}
                    en={UI_TEXT.listenAgain.en}
                    className="text-center"
                    filClassName="text-sm text-[#3f7d52]"
                    enClassName="text-xs text-[#5a7a63]"
                  />
                </PromptStage>
              )}

              <FeedbackSlot>
                {feedback && (
                  <FeedbackBanner
                    variant={feedback}
                    assertive={feedback === 'incorrect'}
                  >
                    <BilingualText
                      fil={
                        feedback === 'correct'
                          ? STRINGS.correct.fil
                          : 'Halos! Subukan ulit.'
                      }
                      en={
                        feedback === 'correct'
                          ? STRINGS.correct.en
                          : 'Almost! Try again.'
                      }
                    />
                  </FeedbackBanner>
                )}
              </FeedbackSlot>
            </>
          }
          tray={
            <div className="space-y-4">
              <OptionGrid
                options={currentSet.options}
                selectedId={selectedId}
                correctId={correctId}
                onSelect={(id) => void handleSelect(id)}
                type="text"
                attempts={attempts}
                disabled={isSubmitting}
              />

              {attempts >= HINT_AFTER_ATTEMPTS && (
                <FeedbackBanner variant="hint">
                  <BilingualText
                    as="p"
                    fil="💡 Ang gintong kahon ang tamang sagot!"
                    en="💡 The golden box is the correct answer!"
                    filClassName="text-sm"
                    enClassName="text-xs opacity-80"
                  />
                </FeedbackBanner>
              )}
            </div>
          }
        />
      ) : null}
    </PracticePageLayout>
  )
}

export default SyllableModulePage
