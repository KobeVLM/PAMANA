import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { OptionGrid } from '@/components/game/OptionGrid'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, RotateCcw, Trophy, Sparkles, Home } from 'lucide-react'

type SubLevel = 'pagsama' | 'pakinggan' | 'kilalanin' | 'rhyming'

const SUB_LEVELS: SubLevel[] = ['pagsama', 'pakinggan', 'kilalanin', 'rhyming']

const SUB_LEVEL_LABELS: Record<SubLevel, string> = {
  pagsama: '1. Pagsama ng Tunog',
  pakinggan: '2. Pakinggan',
  kilalanin: '3. Kilalanin',
  rhyming: '4. Tumalinghaga',
}

const NPC_LINES: Record<SubLevel, string> = {
  pagsama: 'Pakinggan at pagsamahin ang mga tunog! Alin ang resulta?',
  pakinggan: 'Pakinggan nang mabuti! Alin ang pantig na narinig mo?',
  kilalanin: 'Kilalanin ang pantig na nagsisimula sa salitang ito!',
  rhyming: 'Alin sa mga salitang ito ang magkatunog sa narinig?',
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

/**
 * Fallback mock generator when API is offline or returns an error.
 * Ensures learners can still practice smoothly in all 4 sub-levels.
 */
const generateMockSet = (subLevel: SubLevel, setId: number): SyllableSet => {
  const syllables = [
    { c: 'B', v: 'A', syl: 'BA' },
    { c: 'M', v: 'A', syl: 'MA' },
    { c: 'T', v: 'A', syl: 'TA' },
    { c: 'S', v: 'A', syl: 'SA' },
    { c: 'P', v: 'A', syl: 'PA' },
    { c: 'K', v: 'A', syl: 'KA' },
    { c: 'L', v: 'A', syl: 'LA' },
    { c: 'N', v: 'A', syl: 'NA' },
  ]
  const idx = (Math.abs(setId - 1) + SUB_LEVELS.indexOf(subLevel)) % syllables.length
  const item = syllables[idx]
  const target = item.syl
  const c = item.c

  let options: SyllableOption[] = []
  if (subLevel === 'pagsama') {
    options = [
      { id: target.toLowerCase(), label: target },
      { id: `${c.toLowerCase()}e`, label: `${c}E` },
      { id: `${c.toLowerCase()}i`, label: `${c}I` },
      { id: `${c.toLowerCase()}o`, label: `${c}O` },
    ]
  } else {
    const distractors = syllables.filter((s) => s.syl !== target).slice(0, 3)
    options = [
      { id: target.toLowerCase(), label: target },
      ...distractors.map((d) => ({ id: d.syl.toLowerCase(), label: d.syl })),
    ]
  }

  // Shuffle options
  options = [...options].sort(() => Math.random() - 0.5)

  return {
    setId,
    subLevel,
    targetSyllable: target,
    options,
    audioUrl: `/audio/syllables/${target.toLowerCase()}.mp3`,
    consonant: c,
    vowel: item.v,
    consonantAudioUrl: `/audio/phonemes/${c.toLowerCase()}.mp3`,
    vowelAudioUrl: `/audio/phonemes/${item.v.toLowerCase()}.mp3`,
  }
}

export const SyllablePracticePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentSubLevelIndex, setCurrentSubLevelIndex] = useState(0)
  const [setId, setSetId] = useState(1)
  const [currentSet, setCurrentSet] = useState<SyllableSet | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [correctId, setCorrectId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [score, setScore] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const currentSubLevel = SUB_LEVELS[currentSubLevelIndex]

  const voiceAudioRef = useRef<HTMLAudioElement | null>(null)
  const wrongAudioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Preload sound effects
  useEffect(() => {
    try {
      if (!wrongAudioRef.current && typeof Audio !== 'undefined') {
        wrongAudioRef.current = new Audio('/audio/sfx/wrong.mp3')
        wrongAudioRef.current.preload = 'auto'
      }
    } catch {
      // Audio not supported in environment
    }
  }, [])

  // Update target audio when currentSet changes
  useEffect(() => {
    try {
      if (currentSet?.audioUrl && typeof Audio !== 'undefined') {
        voiceAudioRef.current = new Audio(currentSet.audioUrl)
        voiceAudioRef.current.preload = 'auto'
      }
    } catch {
      // Audio not supported in environment
    }
  }, [currentSet])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause()
      }
      if (wrongAudioRef.current) {
        wrongAudioRef.current.pause()
      }
    }
  }, [])

  const fetchCurrentSet = useCallback(
    async (subLevel: SubLevel, targetSetId: number) => {
      setIsLoading(true)
      try {
        const userIdParam = user?.id ? `&userId=${user.id}` : ''
        const res = await api.get(`/syllables/set?subLevel=${subLevel}&setId=${targetSetId}${userIdParam}`)
        if (res.data && res.data.targetSyllable && Array.isArray(res.data.options)) {
          setCurrentSet(res.data)
        } else {
          setCurrentSet(generateMockSet(subLevel, targetSetId))
        }
      } catch (error) {
        console.warn('Using fallback syllable set for practice mode:', error)
        setCurrentSet(generateMockSet(subLevel, targetSetId))
      } finally {
        setIsLoading(false)
      }
    },
    [user?.id]
  )

  useEffect(() => {
    fetchCurrentSet(SUB_LEVELS[0], 1)
  }, [fetchCurrentSet])

  const handleSelect = useCallback(
    (optionId: string) => {
      if (!currentSet || selectedId || isProcessing) return

      const isCorrect = optionId.toLowerCase() === currentSet.targetSyllable.toLowerCase()
      setSelectedId(optionId)
      setCorrectId(currentSet.targetSyllable.toLowerCase())
      setFeedback(isCorrect ? 'correct' : 'incorrect')
      setIsProcessing(true)

      if (isCorrect) {
        setScore((prev) => prev + 1)
        if (voiceAudioRef.current) {
          voiceAudioRef.current.currentTime = 0
          voiceAudioRef.current.play().catch(console.warn)
        }
      } else {
        if (wrongAudioRef.current) {
          wrongAudioRef.current.currentTime = 0
          wrongAudioRef.current.play().catch(console.warn)
        }
      }

      // Auto-advance after ~1.5s to the next sub-level
      timerRef.current = setTimeout(() => {
        if (currentSubLevelIndex < SUB_LEVELS.length - 1) {
          const nextIndex = currentSubLevelIndex + 1
          setCurrentSubLevelIndex(nextIndex)
          setSelectedId(null)
          setCorrectId(null)
          setFeedback(null)
          setIsProcessing(false)
          fetchCurrentSet(SUB_LEVELS[nextIndex], setId)
        } else {
          setIsProcessing(false)
          setIsComplete(true)
        }
      }, 1500)
    },
    [currentSet, selectedId, isProcessing, currentSubLevelIndex, setId, fetchCurrentSet]
  )

  const handlePlayAgain = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setIsComplete(false)
    setCurrentSubLevelIndex(0)
    setScore(0)
    setSelectedId(null)
    setCorrectId(null)
    setFeedback(null)
    setIsProcessing(false)
    const nextSetId = (setId % 5) + 1
    setSetId(nextSetId)
    fetchCurrentSet(SUB_LEVELS[0], nextSetId)
  }, [setId, fetchCurrentSet])

  if (isComplete) {
    const percentage = Math.round((score / SUB_LEVELS.length) * 100)

    return (
      <AppShell>
        <div className="min-h-full flex items-center justify-center p-6 lg:p-8">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 sm:p-8 text-center shadow-2xl animate-bounce-in">
            {/* Victory Badge */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-pamana-gold to-amber-500 flex items-center justify-center shadow-xl shadow-amber-950/40">
                  <Trophy className="w-12 h-12 sm:w-14 sm:h-14 text-stone-900" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-pamana-green p-2 rounded-full border-2 border-white shadow">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-2">
              Pagsasanay Tapos Na!
            </h2>
            <p className="text-green-300 text-sm mb-6">
              Matagumpay mong nasubukan ang lahat ng 4 na sub-level sa pagtutugma ng pantig.
            </p>

            {/* Score Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
              <p className="text-xs uppercase tracking-wider text-green-300 mb-1 font-semibold">
                Iyong Iskor
              </p>
              <div className="text-4xl font-heading font-extrabold text-pamana-gold mb-1">
                {score} / {SUB_LEVELS.length}
              </div>
              <p className="text-sm font-medium text-emerald-400">
                {percentage}% Katumpakan
              </p>
              <p className="text-xs text-white/70 mt-3">
                {percentage === 100
                  ? '🌟 Perpekto! Napakahusay mo sa mga pantig!'
                  : percentage >= 75
                  ? '🎉 Napakagaling! Kaunting praktis na lang at perpekto na!'
                  : '💪 Magaling na simula! Ipagpatuloy ang pagsasanay upang lalong gumaling!'}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handlePlayAgain}
                className="game-tile w-full min-h-[44px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-pamana-gold to-amber-500 hover:from-amber-400 hover:to-pamana-gold text-stone-900 font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Maglaro Ulit</span>
              </button>
              <button
                onClick={() => navigate('/home')}
                className="game-tile w-full min-h-[44px] py-3.5 px-6 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                <span>Bumalik sa Home</span>
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto min-h-full">
        {/* Back navigation */}
        <button
          onClick={() => navigate('/home')}
          className="game-tile flex items-center gap-2 text-green-300 hover:text-white transition-colors mb-6 group min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Bumalik sa Home</span>
        </button>

        {/* Practice Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h1 className="text-2xl font-heading font-bold text-white">
              Pagsasanay: Pagtutugma ng Pantig
            </h1>
            <Badge variant="outline" className="text-xs border-pamana-gold/40 text-pamana-gold bg-pamana-gold/10">
              Practice Mode
            </Badge>
          </div>
          <p className="text-green-300 text-sm">
            Subukan at sanayin ang iyong kakayahan sa pagkilala ng mga tunog at pantig.
          </p>
        </div>

        {/* Progress Card (1 of 4) */}
        <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {SUB_LEVEL_LABELS[currentSubLevel]}
              </span>
              <span className="text-green-300/80 text-xs">
                ({currentSubLevelIndex + 1} of {SUB_LEVELS.length})
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-pamana-gold">
              <Sparkles className="w-4 h-4" />
              <span>Iskor: {score}</span>
            </div>
          </div>
          <Progress
            value={((currentSubLevelIndex + 1) / SUB_LEVELS.length) * 100}
            className="h-2.5 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-pamana-green [&>div]:to-emerald-400"
          />
        </div>

        {/* Sub-level Step Indicators */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {SUB_LEVELS.map((sl, index) => {
            const isCurrent = index === currentSubLevelIndex
            const isDone = index < currentSubLevelIndex

            return (
              <div
                key={sl}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5',
                  isCurrent && 'bg-pamana-gold/20 border-pamana-gold text-pamana-gold',
                  isDone && 'bg-green-500/20 border-green-500/40 text-green-300',
                  !isCurrent && !isDone && 'bg-white/5 border-white/10 text-white/40'
                )}
              >
                {isDone && <CheckCircle2 className="w-3 h-3" />}
                <span>{SUB_LEVEL_LABELS[sl].split('. ')[1]}</span>
              </div>
            )
          })}
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="w-12 h-12 border-4 border-pamana-gold border-t-transparent rounded-full animate-spin" />
            <p className="text-green-300 font-medium">Inihahanda ang pagsasanay...</p>
          </div>
        ) : currentSet ? (
          <div className="space-y-6">
            {/* NPC Instruction - Lolo */}
            <NPCDialogue
              npc="lolo"
              line={NPC_LINES[currentSet.subLevel]}
              audioUrl={`/static/assets/audio/npc/lolo_mod2_${currentSet.subLevel}.mp3`}
            />

            {/* Pagsama: Display consonant + vowel audio pair */}
            {currentSet.subLevel === 'pagsama' && (
              <div className="flex items-center justify-center gap-4 sm:gap-6 py-4">
                <div className="flex flex-col items-center gap-2">
                  <AudioPlayer
                    audioUrl={currentSet.consonantAudioUrl ?? ''}
                    size="lg"
                    label="Pakinggan ang katinig"
                  />
                  <span className="text-white font-heading font-bold text-2xl">
                    {currentSet.consonant}
                  </span>
                  <span className="text-green-300 text-xs">Katinig</span>
                </div>
                <span className="text-white/40 text-3xl font-bold">+</span>
                <div className="flex flex-col items-center gap-2">
                  <AudioPlayer
                    audioUrl={currentSet.vowelAudioUrl ?? ''}
                    size="lg"
                    label="Pakinggan ang patinig"
                  />
                  <span className="text-white font-heading font-bold text-2xl">
                    {currentSet.vowel}
                  </span>
                  <span className="text-green-300 text-xs">Patinig</span>
                </div>
                <span className="text-white/40 text-3xl font-bold">=</span>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border-2 border-dashed border-white/20 flex items-center justify-center">
                    <span className="text-white/30 text-3xl font-bold">?</span>
                  </div>
                  <span className="text-green-300 text-xs">Ano ang resulta?</span>
                </div>
              </div>
            )}

            {/* Pakinggan / Kilalanin / Rhyming: Single audio player */}
            {currentSet.subLevel !== 'pagsama' && (
              <div className="flex justify-center py-4">
                <div className="flex flex-col items-center gap-3">
                  <AudioPlayer
                    audioUrl={currentSet.audioUrl}
                    size="lg"
                    label="Pakinggan ang tunog"
                  />
                  <p className="text-green-300 text-sm">Pindutin para marinig ulit</p>
                </div>
              </div>
            )}

            {/* Feedback Alert Banner */}
            {feedback && (
              <div
                className={cn(
                  'p-3 rounded-xl text-center font-semibold text-sm animate-bounce-in',
                  feedback === 'correct'
                    ? 'bg-green-500/20 border border-green-500/40 text-green-300'
                    : 'bg-red-500/20 border border-red-500/40 text-red-300'
                )}
              >
                {feedback === 'correct' ? '✅ Tama! Napakahusay!' : '❌ Mali. Subukan muli sa susunod!'}
              </div>
            )}

            {/* Options 2x2 Grid */}
            <OptionGrid
              options={currentSet.options}
              selectedId={selectedId}
              correctId={correctId}
              onSelect={handleSelect}
              type="text"
              disabled={isProcessing}
            />
          </div>
        ) : (
          <div className="text-center py-16 text-green-300 space-y-4">
            <p>Hindi ma-load ang pagsasanay. Subukan ulit.</p>
            <button
              onClick={() => fetchCurrentSet(currentSubLevel, setId)}
              className="game-tile px-6 py-2.5 bg-gradient-to-r from-pamana-green to-emerald-500 rounded-xl text-white font-bold min-h-[44px]"
            >
              Subukan Muli
            </button>
          </div>
        )}
      </div>
    </AppShell>
  )
}

export default SyllablePracticePage
