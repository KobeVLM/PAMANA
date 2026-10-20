import React, { useCallback, useEffect } from 'react'
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
import { useAsyncData } from '@/hooks/useAsyncData'
import { useRoundFlow } from '@/hooks/useRoundFlow'
import { useAudioElement, useSfx } from '@/hooks/useGameAudio'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { BilingualText } from '@/components/common/BilingualText'
import { STRINGS, bi } from '@/lib/i18n'
import type { Bi } from '@/lib/i18n'
import api from '@/lib/api'
import type { ModuleProgress } from '@/types'

type SubLevel = 'pagsama' | 'pakinggan' | 'kilalanin' | 'rhyming'

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
}

interface SyllableOption {
  id: string
  label: string
}

interface SyllableSet {
  setId: number
  subLevel: SubLevel
  consonant?: string
  vowel?: string
  targetSyllable: string
  options: SyllableOption[]
  audioUrl: string
  consonantAudioUrl?: string
  vowelAudioUrl?: string
}

export const SyllablePracticePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [setId, setSetId] = React.useState(1)
  const [celebrate, setCelebrate] = React.useState(0)

  const flow = useRoundFlow({
    totalRounds: SUB_LEVELS.length,
    onAnswer: (isCorrect) => {
      if (isCorrect) {
        setCelebrate((count) => count + 1)
        playTarget()
      } else playWrong()
    },
  })

  const subLevel = SUB_LEVELS[flow.roundIndex]

  useScrollToTop(`${subLevel}-${setId}`)

  // Route guard: the learner must have completed Module 1 first.
  const checkPrerequisite = useCallback(async () => {
    if (!user?.id) return { allowed: false }
    const res = await api.get(`/modules/progress/${user.id}`)
    const mod = (res.data as ModuleProgress[]).find((p) => p.moduleNumber === 1)
    return { allowed: Boolean(mod?.isComplete) }
  }, [user?.id])

  const { data: guard, error: guardError, isLoading: guardLoading, retry: retryGuard } =
    useAsyncData(checkPrerequisite)

  useEffect(() => {
    if (guard && !guard.allowed) {
      navigate('/trail', { replace: true })
    }
  }, [guard, navigate])

  // Fetch the current syllable set; failures surface as a retryable error.
  const loadSet = useCallback(async () => {
    const res = await api.get(`/syllables/set?subLevel=${subLevel}&setId=${setId}`)
    const data = res.data as SyllableSet | null
    if (!data?.targetSyllable || !Array.isArray(data.options)) {
      throw new Error('Malformed syllable set response')
    }
    return data
  }, [subLevel, setId])

  const { data: currentSet, error: setError, isLoading: setLoading, retry: retrySet } =
    useAsyncData(loadSet)

  const { replay: playTarget } = useAudioElement(currentSet?.audioUrl)
  const { playWrong } = useSfx()

  const handleSelect = useCallback(
    (optionId: string) => {
      if (!currentSet) return
      const target = currentSet.targetSyllable.toLowerCase()
      flow.answer({
        selectedId: optionId,
        correctId: target,
        isCorrect: optionId.toLowerCase() === target,
      })
    },
    [currentSet, flow]
  )

  const handlePlayAgain = useCallback(() => {
    flow.reset()
    setSetId((prev) => (prev % 5) + 1)
  }, [flow])

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
          message="Matagumpay mong nasubukan ang lahat ng 4 na sub-level sa pagtutugma ng pantig."
          messageEn="You completed all 4 sub-levels of syllable matching."
          score={flow.score}
          total={SUB_LEVELS.length}
          onRetry={handlePlayAgain}
          onExit={() => navigate('/home')}
        />
      </PracticePageLayout>
    )
  }

  const steps = SUB_LEVELS.map((level, index) => ({
    label: SUB_LEVEL_LABELS[level].fil.split('. ')[1],
    state:
      index < flow.roundIndex
        ? ('done' as const)
        : index === flow.roundIndex
          ? ('current' as const)
          : ('pending' as const),
  }))

  return (
    <PracticePageLayout maxWidth="5xl">
      <PracticeHeader
        title="Pagsasanay: Pagtutugma ng Pantig"
        subtitle="Sanayin ang iyong kakayahan sa pagkilala ng mga tunog at pantig."
        badge="Practice Mode"
        backLabel="Bumalik sa Home"
        onBack={() => navigate('/home')}
        progressLabel={`${SUB_LEVEL_LABELS[subLevel].fil} (${flow.roundIndex + 1} of ${SUB_LEVELS.length})`}
        progressLabelEn={`${SUB_LEVEL_LABELS[subLevel].en} (${flow.roundIndex + 1} of ${SUB_LEVELS.length})`}
        progressValue={((flow.roundIndex + 1) / SUB_LEVELS.length) * 100}
        steps={steps}
      />

      {setLoading ? (
        <LoadingState message="Inihahanda ang pagsasanay..." />
      ) : setError ? (
        <ErrorState onRetry={retrySet} />
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

              {currentSet.subLevel === 'pagsama' && (
                <PromptStage
                  variant="equation"
                  ariaLabel="Pagsamahin ang mga tunog (Blend the sounds)"
                >
                  <div className="flex flex-wrap flex-col items-center justify-center gap-4 py-2 sm:flex-row sm:gap-4">
                    <div className="flex min-w-0 flex-col items-center gap-2">
                      <AudioPlayer
                        audioUrl={currentSet.consonantAudioUrl ?? ''}
                        fallbackText={currentSet.consonant}
                        size="md"
                        label={STRINGS.listenConsonant.fil}
                        labelEn={STRINGS.listenConsonant.en}
                      />
                      <span className="font-heading text-2xl font-bold text-[#2b5c3b]">
                        {currentSet.consonant}
                      </span>
                      <BilingualText
                        as="span"
                        fil={UI_TEXT.consonant.fil}
                        en={UI_TEXT.consonant.en}
                        className="text-center"
                        filClassName="text-xs text-[#3f7d52]"
                        enClassName="text-[10px] text-[#5a7a63]"
                      />
                    </div>
                    <span className="text-3xl font-bold text-[#2b5c3b]/50" aria-hidden="true">
                      +
                    </span>
                    <div className="flex min-w-0 flex-col items-center gap-2">
                      <AudioPlayer
                        audioUrl={currentSet.vowelAudioUrl ?? ''}
                        fallbackText={currentSet.vowel}
                        size="md"
                        label={STRINGS.listenVowel.fil}
                        labelEn={STRINGS.listenVowel.en}
                      />
                      <span className="font-heading text-2xl font-bold text-[#2b5c3b]">
                        {currentSet.vowel}
                      </span>
                      <BilingualText
                        as="span"
                        fil={UI_TEXT.vowel.fil}
                        en={UI_TEXT.vowel.en}
                        className="text-center"
                        filClassName="text-xs text-[#3f7d52]"
                        enClassName="text-[10px] text-[#5a7a63]"
                      />
                    </div>
                    <span className="text-3xl font-bold text-[#2b5c3b]/50" aria-hidden="true">
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
                        className="text-center"
                        filClassName="text-xs text-[#3f7d52]"
                        enClassName="text-[10px] text-[#5a7a63]"
                      />
                    </div>
                  </div>
                </PromptStage>
              )}

              {currentSet.subLevel !== 'pagsama' && (
                <PromptStage
                  variant="audio"
                  ariaLabel="Pakinggan ang pantig (Listen to the syllable)"
                >
                  <AudioPlayer
                    audioUrl={currentSet.audioUrl}
                    fallbackText={currentSet.targetSyllable}
                    size="lg"
                    label={STRINGS.listenSound.fil}
                    labelEn={STRINGS.listenSound.en}
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
                        fil="Hindi pa tama — susunod na lang!"
                        en="Not quite — we’ll try it again soon!"
                      />
                    )}
                  </FeedbackBanner>
                )}
              </FeedbackSlot>
            </>
          }
          tray={
            <OptionGrid
              options={currentSet.options}
              selectedId={flow.selectedId}
              correctId={flow.correctId}
              onSelect={handleSelect}
              type="text"
              disabled={flow.isProcessing}
            />
          }
        />
      ) : (
        <ErrorState onRetry={retrySet} />
      )}
    </PracticePageLayout>
  )
}

export default SyllablePracticePage
