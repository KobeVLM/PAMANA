import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { AudioPlayer } from '@/components/game/AudioPlayer'
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

interface ImageOption {
  id: string
  imageUrl: string
  label?: string
}

const NPC_LINE = 'Kilalanin! Alin ang larawan ng narinig na salita?'
const NPC_AUDIO = '/static/assets/audio/npc/lolo_mod3_kilalanin.mp3'
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
 * Fallback image options generator if match options API call fails.
 */
const generateFallbackOptions = (word: VocabWord, pool: VocabWord[]): ImageOption[] => {
  const distractors = pool.filter((w) => w.wordId !== word.wordId)
  const selected = [...distractors].sort(() => Math.random() - 0.5).slice(0, 3)
  const choices: ImageOption[] = [
    { id: word.wordId, imageUrl: word.imageUrl, label: word.word },
    ...selected.map((d) => ({ id: d.wordId, imageUrl: d.imageUrl, label: d.word })),
  ]
  return choices.sort(() => Math.random() - 0.5)
}

export const ImagePracticePage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Route guard: check if Module 3 is complete
  useEffect(() => {
    const checkPrerequisite = async () => {
      if (!user?.id) return
      try {
        const res = await api.get(`/modules/progress/${user.id}`)
        const mod = res.data.find((p: any) => p.moduleNumber === 3)
        if (!mod || !mod.isComplete) {
          navigate('/trail', { replace: true })
        }
      } catch (err) {
        console.warn('Could not verify module 3 completion', err)
      }
    }
    checkPrerequisite()
  }, [user?.id, navigate])

  const [allWords, setAllWords] = useState<VocabWord[]>([])
  const [roundWords, setRoundWords] = useState<VocabWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [options, setOptions] = useState<ImageOption[]>([])
  const [targetCorrectId, setTargetCorrectId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [correctId, setCorrectId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [score, setScore] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const voiceAudioRef = useRef<HTMLAudioElement | null>(null)
  const wrongAudioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasPlayedIntroRef = useRef(false)

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

  // Update target audio when currentWord changes and auto-play on questions 2-5
  useEffect(() => {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause()
    }
    try {
      if (currentWord?.audioUrl && typeof Audio !== 'undefined') {
        const audio = new Audio(currentWord.audioUrl)
        audio.preload = 'auto'
        voiceAudioRef.current = audio

        // On questions 2 through 5, play target word audio directly
        if (currentIndex > 0) {
          audio.play().catch(console.warn)
        }
      }
    } catch {
      // Audio not supported in environment
    }
  }, [currentWord, currentIndex])

  // When NPC instruction finishes on question 1, play the target word audio
  const handleNpcAudioEnd = useCallback(() => {
    if (hasPlayedIntroRef.current) return
    hasPlayedIntroRef.current = true
    if (voiceAudioRef.current) {
      voiceAudioRef.current.currentTime = 0
      voiceAudioRef.current.play().catch(console.warn)
    } else if (currentWord?.audioUrl && typeof Audio !== 'undefined') {
      const audio = new Audio(currentWord.audioUrl)
      voiceAudioRef.current = audio
      audio.play().catch(console.warn)
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
              wordId: String(item.wordId || item.id),
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

  // 2. Fetch match options for current word (step=kilalanin)
  useEffect(() => {
    if (!currentWord) return

    let isMounted = true

    const fetchOptionsForWord = async () => {
      setIsLoadingOptions(true)
      setSelectedId(null)
      setCorrectId(null)
      setFeedback(null)

      try {
        const res = await api.get(`/vocabulary/match/${currentWord.wordId}?step=kilalanin`)
        if (isMounted) {
          if (res.data && Array.isArray(res.data.options) && res.data.options.length > 0) {
            const mapped: ImageOption[] = res.data.options.map((opt: any) => ({
              id: String(opt.wordId || opt.id),
              imageUrl: opt.imageUrl,
              label: opt.word || opt.label,
            }))
            setOptions(mapped)
            setTargetCorrectId(String(res.data.correctId || res.data.targetWordId || currentWord.wordId))
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

      const isAnswerCorrect = optionId === targetCorrectId
      setSelectedId(optionId)
      setCorrectId(targetCorrectId)
      setFeedback(isAnswerCorrect ? 'correct' : 'incorrect')
      setIsProcessing(true)

      if (isAnswerCorrect) {
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
    hasPlayedIntroRef.current = false
    setRoundWords(newRound)
    setCurrentIndex(0)
    setScore(0)
    setSelectedId(null)
    setCorrectId(null)
    setFeedback(null)
    setIsProcessing(false)
    setIsComplete(false)
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
              Matagumpay mong natapos ang {totalQuestions} tanong sa pagtutugma ng larawan.
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
                  ? '🌟 Perpekto! Napakahusay mo sa pagkilala ng mga larawan!'
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
              Image Matching
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
            Sanayin ang iyong kakayahan sa pagkilala ng larawan batay sa salitang naririnig.
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
            <p className="text-green-300 font-medium">Inihahanda ang mga tanong...</p>
          </div>
        ) : currentWord ? (
          <div className="space-y-6">
            {/* NPC Instruction - Lolo */}
            <NPCDialogue
              npc="lolo"
              line={NPC_LINE}
              audioUrl={NPC_AUDIO}
              autoPlay={currentIndex === 0 && !hasPlayedIntroRef.current}
              onAudioEnd={handleNpcAudioEnd}
            />

            {/* Audio Player with currentWord.audioUrl */}
            <div className="flex justify-center py-2">
              <div className="flex flex-col items-center gap-2">
                <AudioPlayer
                  key={currentWord.wordId}
                  audioUrl={currentWord.audioUrl}
                  autoPlay={false}
                  size="lg"
                  label="Pakinggan ang salita"
                />
                <p className="text-green-300 text-xs">Pindutin para pakinggan muli</p>
              </div>
            </div>

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
                {feedback === 'correct' ? '✅ Tama! Napakahusay!' : '❌ Mali. Narito ang tamang larawan!'}
              </div>
            )}

            {/* Interactive Grid with Image Options */}
            {isLoadingOptions ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <div className="w-10 h-10 border-4 border-pamana-gold border-t-transparent rounded-full animate-spin" />
                <p className="text-green-300 text-sm">Kinukuha ang mga larawan...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {options.map((opt) => {
                  const isSelected = selectedId === opt.id
                  const isCorrect = correctId === opt.id
                  const isWrong = isSelected && !isCorrect
                  const isRevealedCorrect = selectedId !== null && isCorrect

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelect(opt.id)}
                      disabled={isProcessing || selectedId !== null}
                      aria-label={opt.label || `Opsyon ${opt.id}`}
                      className={cn(
                        // Base touch target - minimum 64px (min-h-[140px]), rounded-2xl, border-2
                        'group relative min-h-[140px] sm:min-h-[170px] rounded-2xl border-2 p-3 sm:p-4',
                        'flex flex-col items-center justify-center gap-2 overflow-hidden',
                        'transition-all duration-200 select-none game-tile shadow-md',

                        // Default state before selection
                        !selectedId && 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40 hover:scale-105 active:scale-95',

                        // Correct answer revealed (green border feedback)
                        isRevealedCorrect && 'bg-green-500/30 border-green-400 text-green-200 scale-105 shadow-green-900/50 ring-2 ring-green-400/50',

                        // Wrong selection (red border feedback)
                        isWrong && 'bg-red-500/30 border-red-400 text-red-200 animate-shake ring-2 ring-red-400/50',

                        // Dim other choices once answered
                        selectedId !== null && !isCorrect && !isSelected && 'bg-white/5 border-white/10 opacity-40 cursor-not-allowed',

                        isProcessing && 'cursor-not-allowed'
                      )}
                    >
                      {opt.imageUrl ? (
                        <img
                          src={opt.imageUrl}
                          alt={opt.label || 'opsyon na larawan'}
                          className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-xl drop-shadow-md transition-transform duration-200 group-hover:scale-105"
                          draggable={false}
                          onError={(e) => {
                            const target = e.currentTarget
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent && !parent.querySelector('.img-fallback')) {
                              const fallbackDiv = document.createElement('div')
                              fallbackDiv.className = 'img-fallback flex flex-col items-center justify-center text-center p-2 text-white/80 font-heading font-bold text-lg'
                              fallbackDiv.innerText = opt.label || 'Larawan'
                              parent.appendChild(fallbackDiv)
                            }
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 text-white font-heading font-bold text-lg text-center p-2">
                          {opt.label || 'Larawan'}
                        </div>
                      )}

                      {/* Optional subtle label */}
                      {opt.label && (
                        <span className="text-xs sm:text-sm font-semibold text-green-200/90 tracking-wide mt-1">
                          {opt.label}
                        </span>
                      )}

                      {/* Feedback Icon */}
                      {selectedId !== null && isCorrect && (
                        <div className="absolute top-2.5 right-2.5 bg-green-500 rounded-full p-0.5 shadow-md">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                      )}
                      {isWrong && (
                        <div className="absolute top-2.5 right-2.5 bg-red-500 rounded-full p-0.5 shadow-md">
                          <XCircle className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
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

export default ImagePracticePage
