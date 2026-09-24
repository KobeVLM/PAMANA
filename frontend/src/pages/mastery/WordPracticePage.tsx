import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAudio } from '@/contexts/AudioContext'
import { AppShell } from '@/components/layout/AppShell'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { OptionGrid } from '@/components/game/OptionGrid'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { ArrowLeft, RotateCcw, Trophy, Sparkles, Home, CheckCircle2, XCircle } from 'lucide-react'

interface VocabWord {
  wordId: string
  word: string
  domain: string
  audioUrl: string
  imageUrl: string
  ordinal?: number
}

interface MatchOption {
  id: string
  label?: string
  imageUrl?: string
}

const NPC_LINE = 'Basahin! Alin ang tamang salitang nakasulat?'
const ROUND_TOTAL = 5

/**
 * Fallback vocabulary words when API is offline or returns empty.
 */
const FALLBACK_WORDS: VocabWord[] = [
  { wordId: 'mock-1', word: 'Mata', domain: 'self_body', audioUrl: '/audio/words/mata.mp3', imageUrl: '/images/vocab/mata.png', ordinal: 1 },
  { wordId: 'mock-2', word: 'Ilong', domain: 'self_body', audioUrl: '/audio/words/ilong.mp3', imageUrl: '/images/vocab/ilong.png', ordinal: 2 },
  { wordId: 'mock-3', word: 'Bibig', domain: 'self_body', audioUrl: '/audio/words/bibig.mp3', imageUrl: '/images/vocab/bibig.png', ordinal: 3 },
  { wordId: 'mock-4', word: 'Kamay', domain: 'self_body', audioUrl: '/audio/words/kamay.mp3', imageUrl: '/images/vocab/kamay.png', ordinal: 4 },
  { wordId: 'mock-5', word: 'Paa', domain: 'self_body', audioUrl: '/audio/words/paa.mp3', imageUrl: '/images/vocab/paa.png', ordinal: 5 },
  { wordId: 'mock-6', word: 'Tenga', domain: 'self_body', audioUrl: '/audio/words/tenga.mp3', imageUrl: '/images/vocab/tenga.png', ordinal: 6 },
  { wordId: 'mock-7', word: 'Nanay', domain: 'family_home', audioUrl: '/audio/words/nanay.mp3', imageUrl: '/images/vocab/nanay.png', ordinal: 7 },
  { wordId: 'mock-8', word: 'Tatay', domain: 'family_home', audioUrl: '/audio/words/tatay.mp3', imageUrl: '/images/vocab/tatay.png', ordinal: 8 },
]

/**
 * Helper to select 5 random items for a practice round.
 */
const pickRoundWords = (words: VocabWord[]): VocabWord[] => {
  const shuffled = [...words].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, ROUND_TOTAL)
}

/**
 * Fallback options generator if match options API call fails.
 */
const generateFallbackOptions = (word: VocabWord, pool: VocabWord[]): MatchOption[] => {
  const distractors = pool.filter((w) => w.wordId !== word.wordId)
  const selected = [...distractors].sort(() => Math.random() - 0.5).slice(0, 3)
  const choices: MatchOption[] = [
    { id: word.wordId, label: word.word },
    ...selected.map((d) => ({ id: d.wordId, label: d.word })),
  ]
  return choices.sort(() => Math.random() - 0.5)
}

export const WordPracticePage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Route guard: check if Module 2 is complete
  useEffect(() => {
    const checkPrerequisite = async () => {
      if (!user?.id) return
      try {
        const res = await api.get(`/modules/progress/${user.id}`)
        const mod = res.data.find((p: any) => p.moduleNumber === 2)
        if (!mod || !mod.isComplete) {
          navigate('/trail', { replace: true })
        }
      } catch (err) {
        console.warn('Could not verify module 2 completion', err)
      }
    }
    checkPrerequisite()
  }, [user?.id, navigate])

  const [allWords, setAllWords] = useState<VocabWord[]>([])
  const [roundWords, setRoundWords] = useState<VocabWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [options, setOptions] = useState<MatchOption[]>([])
  const [targetCorrectId, setTargetCorrectId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [correctId, setCorrectId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [score, setScore] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const { isAudioPlaying } = useAudio()
  const hasPlayedNpcRef = useRef(false)
  const [npcIntroDone, setNpcIntroDone] = useState(false)
  const prevIsAudioPlayingRef = useRef(false)

  const voiceAudioRef = useRef<HTMLAudioElement | null>(null)
  const wrongAudioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentWord = roundWords[currentIndex] || null

  // Preload wrong audio SFX
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

  // Update target audio when currentWord changes
  useEffect(() => {
    try {
      if (currentWord?.audioUrl && typeof Audio !== 'undefined') {
        voiceAudioRef.current = new Audio(currentWord.audioUrl)
        voiceAudioRef.current.preload = 'auto'
      }
    } catch {
      // Audio not supported in environment
    }
  }, [currentWord])

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

  // Sequence NPC dialogue first (question 1), then enable target word audio
  useEffect(() => {
    if (currentIndex > 0 || hasPlayedNpcRef.current) {
      setNpcIntroDone(true)
      return
    }

    // Safety timeout: in case NPC dialogue autoplay was blocked by browser or failed
    const fallbackTimer = setTimeout(() => {
      setNpcIntroDone(true)
      hasPlayedNpcRef.current = true
    }, 3500)

    return () => clearTimeout(fallbackTimer)
  }, [currentIndex])

  useEffect(() => {
    if (currentIndex === 0 && !hasPlayedNpcRef.current) {
      if (prevIsAudioPlayingRef.current && !isAudioPlaying) {
        // NPC speech finished playing
        setNpcIntroDone(true)
        hasPlayedNpcRef.current = true
      }
    }
    prevIsAudioPlayingRef.current = isAudioPlaying
  }, [isAudioPlaying, currentIndex])

  // 1. Fetch all vocabulary items on mount
  useEffect(() => {
    let isMounted = true

    const fetchAllVocabulary = async () => {
      setIsLoading(true)
      try {
        const res = await api.get('/vocabulary/all')
        if (isMounted) {
          let words: VocabWord[] = []
          if (Array.isArray(res.data) && res.data.length > 0) {
            words = res.data.map((item: any) => ({
              wordId: String(item.wordId),
              word: item.word,
              domain: item.domain,
              audioUrl: item.audioUrl,
              imageUrl: item.imageUrl,
              ordinal: item.ordinal,
            }))
          } else {
            words = FALLBACK_WORDS
          }
          setAllWords(words)
          const initialRound = pickRoundWords(words)
          setRoundWords(initialRound)
          setCurrentIndex(0)
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Failed to load vocabulary/all, using fallback words:', err)
          setAllWords(FALLBACK_WORDS)
          const initialRound = pickRoundWords(FALLBACK_WORDS)
          setRoundWords(initialRound)
          setCurrentIndex(0)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchAllVocabulary()

    return () => {
      isMounted = false
    }
  }, [])

  // 2. Fetch match options for current word (step=basahin)
  useEffect(() => {
    if (!currentWord) return

    let isMounted = true

    const fetchOptionsForWord = async () => {
      setIsLoadingOptions(true)
      setSelectedId(null)
      setCorrectId(null)
      setFeedback(null)

      try {
        const res = await api.get(`/vocabulary/match/${currentWord.wordId}?step=basahin`)
        if (isMounted) {
          if (res.data && Array.isArray(res.data.options) && res.data.options.length > 0) {
            const mapped: MatchOption[] = res.data.options.map((opt: any) => ({
              id: String(opt.wordId),
              label: opt.word,
              imageUrl: opt.imageUrl,
            }))
            setOptions(mapped)
            setTargetCorrectId(String(res.data.targetWordId || currentWord.wordId))
          } else {
            const fallback = generateFallbackOptions(currentWord, allWords.length ? allWords : FALLBACK_WORDS)
            setOptions(fallback)
            setTargetCorrectId(currentWord.wordId)
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Using fallback match options for word:', currentWord.word, err)
          const fallback = generateFallbackOptions(currentWord, allWords.length ? allWords : FALLBACK_WORDS)
          setOptions(fallback)
          setTargetCorrectId(currentWord.wordId)
        }
      } finally {
        if (isMounted) {
          setIsLoadingOptions(false)
        }
      }
    }

    fetchOptionsForWord()

    return () => {
      isMounted = false
    }
  }, [currentWord, allWords])

  // Handle user option selection
  const handleSelect = useCallback(
    (optionId: string) => {
      if (!currentWord || selectedId || isProcessing || !targetCorrectId) return

      const isCorrect = optionId === targetCorrectId
      setSelectedId(optionId)
      setCorrectId(targetCorrectId)
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

      // Auto-advance after ~1.5s
      timerRef.current = setTimeout(() => {
        if (currentIndex < roundWords.length - 1) {
          setCurrentIndex((prev) => prev + 1)
          setSelectedId(null)
          setCorrectId(null)
          setFeedback(null)
          setIsProcessing(false)
        } else {
          setIsProcessing(false)
          setIsComplete(true)
        }
      }, 1500)
    },
    [currentWord, selectedId, isProcessing, targetCorrectId, currentIndex, roundWords.length]
  )

  // Reset round and play again
  const handlePlayAgain = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    const pool = allWords.length >= ROUND_TOTAL ? allWords : FALLBACK_WORDS
    const newRound = pickRoundWords(pool)
    setRoundWords(newRound)
    setCurrentIndex(0)
    setScore(0)
    setSelectedId(null)
    setCorrectId(null)
    setFeedback(null)
    setIsProcessing(false)
    setIsComplete(false)
    hasPlayedNpcRef.current = false
    setNpcIntroDone(false)
    prevIsAudioPlayingRef.current = false
  }, [allWords])

  // Completion view after 5 questions
  if (isComplete) {
    const totalQuestions = roundWords.length || ROUND_TOTAL
    const percentage = Math.round((score / totalQuestions) * 100)

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
              Matagumpay mong natapos ang {totalQuestions} salita sa pagtutugma ng salita.
            </p>

            {/* Score Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
              <p className="text-xs uppercase tracking-wider text-green-300 mb-1 font-semibold">
                Iyong Iskor
              </p>
              <div className="text-4xl font-heading font-extrabold text-pamana-gold mb-1">
                {score} / {totalQuestions}
              </div>
              <p className="text-sm font-medium text-emerald-400">
                {percentage}% Katumpakan
              </p>
              <p className="text-xs text-white/70 mt-3">
                {percentage === 100
                  ? '🌟 Perpekto! Napakahusay mo sa pagbabasa ng mga salita!'
                  : percentage >= 75
                  ? '🎉 Napakagaling! Kaunting praktis na lang at perpekto na!'
                  : '💪 Magaling na simula! Ipagpatuloy ang pagsasanay upang lalong gumaling!'}
              </p>
            </div>

            {/* Action buttons */}
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

  const totalRounds = roundWords.length || ROUND_TOTAL
  const progressValue = ((currentIndex + 1) / totalRounds) * 100

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
              Word Matching
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-green-300">
                {currentIndex + 1} / {totalRounds}
              </span>
              <Badge variant="outline" className="text-xs border-pamana-gold/40 text-pamana-gold bg-pamana-gold/10">
                Practice Mode
              </Badge>
            </div>
          </div>
          <p className="text-green-300 text-sm">
            Sanayin ang iyong kakayahan sa pagbasa at pagtutugma ng mga salita.
          </p>
        </div>

        {/* Progress Card */}
        <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                Tanong {currentIndex + 1} ng {totalRounds}
              </span>
              <span className="text-green-300/80 text-xs">
                ({Math.round(progressValue)}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-pamana-gold">
              <Sparkles className="w-4 h-4" />
              <span>Iskor: {score}</span>
            </div>
          </div>
          <Progress
            value={progressValue}
            className="h-2.5 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-pamana-green [&>div]:to-emerald-400"
          />
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="w-12 h-12 border-4 border-pamana-gold border-t-transparent rounded-full animate-spin" />
            <p className="text-green-300 font-medium">Inihahanda ang mga salita...</p>
          </div>
        ) : currentWord ? (
          <div className="space-y-6">
            {/* NPC Instruction - Lolo */}
            <NPCDialogue
              npc="lolo"
              line={NPC_LINE}
              audioUrl="/static/assets/audio/npc/lolo_mod3_basahin.mp3"
              autoPlay={currentIndex === 0 && !hasPlayedNpcRef.current}
            />

            {/* Central Interactive Card: Prompt before answering, Reveal + Feedback after answering */}
            {selectedId === null ? (
              /* Listening Prompt Card (Answer Hidden) */
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center shadow-xl text-center space-y-4 min-h-[260px] sm:min-h-[290px] animate-fade-in">
                {currentWord.domain && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-green-300 border border-white/10">
                    {currentWord.domain === 'self_body'
                      ? 'Bahagi ng Katawan'
                      : currentWord.domain === 'family_home'
                      ? 'Pamilya at Tahanan'
                      : currentWord.domain}
                  </span>
                )}

                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white">
                    Pakinggan ang Salita
                  </h2>
                  <p className="text-green-300 text-sm max-w-sm">
                    Makinig nang mabuti at piliin ang tamang salita sa ibaba.
                  </p>
                </div>

                {/* Large interactive speaker */}
                <div className="flex flex-col items-center gap-2 py-2">
                  <AudioPlayer
                    key={`${currentWord.wordId}-${npcIntroDone}`}
                    audioUrl={currentWord.audioUrl}
                    autoPlay={npcIntroDone}
                    size="lg"
                    label="Pakinggan ang salita"
                  />
                  <p className="text-green-300/80 text-xs font-medium">
                    Pindutin para pakinggan muli
                  </p>
                </div>
              </div>
            ) : (
              /* Answer Reveal & Feedback Card (Answer Shown) */
              <div
                className={cn(
                  'backdrop-blur-md border rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center shadow-xl text-center space-y-3 min-h-[260px] sm:min-h-[290px] animate-fade-in transition-all',
                  feedback === 'correct'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                )}
              >
                {currentWord.domain && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-green-300 border border-white/10">
                    {currentWord.domain === 'self_body'
                      ? 'Bahagi ng Katawan'
                      : currentWord.domain === 'family_home'
                      ? 'Pamilya at Tahanan'
                      : currentWord.domain}
                  </span>
                )}

                {/* Revealed Image */}
                {currentWord.imageUrl && (
                  <img
                    src={currentWord.imageUrl}
                    alt={currentWord.word}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none'
                    }}
                    className="w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-2xl drop-shadow-md bg-white/5 p-2 border border-white/10 animate-bounce-in"
                  />
                )}

                {/* Revealed Target Word */}
                <div className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-wider uppercase">
                  {currentWord.word}
                </div>

                {/* Feedback Display */}
                <div
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-center font-semibold text-sm animate-bounce-in w-full max-w-sm',
                    feedback === 'correct'
                      ? 'bg-green-500/20 border border-green-500/40 text-green-300'
                      : 'bg-red-500/20 border border-red-500/40 text-red-300'
                  )}
                >
                  {feedback === 'correct' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span>Tama! Napakahusay!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span>
                        Mali. Ang tamang salita ay:{' '}
                        <span className="font-bold text-white underline ml-1">
                          {currentWord.word}
                        </span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Options 2x2 Grid */}
            {isLoadingOptions ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8">
                <div className="w-8 h-8 border-3 border-pamana-gold border-t-transparent rounded-full animate-spin" />
                <p className="text-green-300 text-xs">Kinukuha ang mga pagpipilian...</p>
              </div>
            ) : (
              <OptionGrid
                options={options}
                selectedId={selectedId}
                correctId={correctId}
                onSelect={handleSelect}
                type="text"
                disabled={isProcessing}
              />
            )}
          </div>
        ) : (
          <div className="text-center py-16 text-green-300 space-y-4">
            <p>Walang nakitang salita para sa pagsasanay.</p>
            <button
              onClick={handlePlayAgain}
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

export default WordPracticePage
