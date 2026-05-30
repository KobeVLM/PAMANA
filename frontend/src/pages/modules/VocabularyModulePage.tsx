import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { OptionGrid } from '@/components/game/OptionGrid'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight } from 'lucide-react'

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

const NPC_LINES: Record<SpiralStep, string> = {
  pakinggan: 'Pakinggan natin ang bagong salita! Pindutin ang tunog at tandaan!',
  kilalanin: 'Kilalanin! Alin ang larawan ng narinig na salita?',
  basahin: 'Basahin! Alin ang tamang salitang nakasulat?',
  gamitin: 'Gamitin ang salita sa pangungusap. Piliin ang tamang sagot!',
}

const SPIRAL_STEPS: SpiralStep[] = ['pakinggan', 'kilalanin', 'basahin', 'gamitin']

import { WordSlotMachine } from '@/components/game/WordSlotMachine'

export const VocabularyModulePage: React.FC<Props> = ({ moduleNumber, domain: _domain }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null)
  const [currentStep, setCurrentStep] = useState<SpiralStep>('pakinggan')
  const [matchOptions, setMatchOptions] = useState<MatchOption[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [correctId, setCorrectId] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pakingganDone, setPakingganDone] = useState(false)
  const [wordComplete, setWordComplete] = useState(false)
  const [moduleComplete, setModuleComplete] = useState(false)
  const [hamonTriggered, setHamonTriggered] = useState(false)
  const [gamitinSentence, setGamitinSentence] = useState<string>("Ang aking _____ ay malaki at maliwanag.")
  const [upcomingWords, setUpcomingWords] = useState<string[]>([
    'Mata', 'Ilong', 'Bibig', 'Kamay', 
    'Paa', 'Tenga', 'Ulo', 'Tiyan', 
    'Likod', 'Buhok', 'Balikat', 'Tuhod'
  ])

  const fetchNextWord = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.get(`/vocabulary/next?userId=${user?.id}&moduleNumber=${moduleNumber}`)
      
      if (res.status === 204 || !res.data) {
        setModuleComplete(true)
        return
      }

      setCurrentWord(res.data)
      setCurrentStep('pakinggan')
      setPakingganDone(false)
      setSelectedId(null)
      setCorrectId(null)
      setAttempts(0)
      setWordComplete(false)
      setMatchOptions([]) // Clear options to prevent UI flicker
    } catch {
      setModuleComplete(true)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, moduleNumber])

  const fetchMatchOptions = useCallback(async (wordId: string, step: SpiralStep) => {
    try {
      const res = await api.get(`/vocabulary/match/${wordId}?step=${step}`)
      const mappedOptions = res.data.options.map((o: any) => ({
        id: o.wordId,
        label: o.word,
        imageUrl: o.imageUrl,
      }))
      setMatchOptions(mappedOptions)
    } catch {
      // Fallback mock options
      setMatchOptions([
        { id: wordId, label: currentWord?.word, imageUrl: currentWord?.imageUrl },
        { id: 'mock1', label: 'Buhok', imageUrl: '' },
        { id: 'mock2', label: 'Mata', imageUrl: '' },
        { id: 'mock3', label: 'Kamay', imageUrl: '' },
      ])
    }
  }, [currentWord])

  useEffect(() => {
    if (user?.id) fetchNextWord()
  }, [user?.id, fetchNextWord])

  useEffect(() => {
    if (currentWord && currentStep !== 'pakinggan' && currentStep !== 'gamitin') {
      fetchMatchOptions(currentWord.wordId, currentStep)
    } else if (currentWord && currentStep === 'gamitin') {
      const fetchGamitin = async () => {
        try {
          const res = await api.get(`/vocabulary/gamitin/${currentWord.wordId}`)
          setGamitinSentence(res.data.sentenceTemplate)
          
          const mappedOptions = res.data.options.map((opt: string, i: number) => ({
            id: opt === res.data.correctWord ? currentWord.wordId : `opt${i}`,
            label: opt
          }))
          setMatchOptions(mappedOptions)
        } catch {
          console.error('Failed to fetch gamitin dialogue')
        }
      }
      fetchGamitin()
    }
  }, [currentWord, currentStep, fetchMatchOptions])

  const voiceAudioRef = useRef<HTMLAudioElement | null>(null)
  const wrongAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!wrongAudioRef.current) {
      wrongAudioRef.current = new Audio('/audio/sfx/wrong.mp3')
      wrongAudioRef.current.preload = 'auto'
    }
    if (currentWord?.audioUrl) {
      voiceAudioRef.current = new Audio(currentWord.audioUrl)
      voiceAudioRef.current.preload = 'auto'
    }
  }, [currentWord])

  const handleStepSelect = useCallback(async (optionId: string) => {
    if (!currentWord || selectedId || isSubmitting) return
    const isCorrect = optionId === currentWord.wordId
    setSelectedId(optionId)
    setCorrectId(currentWord.wordId)

    if (isCorrect && voiceAudioRef.current) {
      voiceAudioRef.current.currentTime = 0
      voiceAudioRef.current.play().catch(console.warn)
    } else if (!isCorrect && wrongAudioRef.current) {
      wrongAudioRef.current.currentTime = 0
      wrongAudioRef.current.play().catch(console.warn)
    }

    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    setIsSubmitting(true)
    try {
      const res = await api.post('/vocabulary/progress', {
        userId: user?.id,
        wordId: currentWord.wordId,
        step: currentStep,
        correct: isCorrect,
      })

      if (res.data.hamonTriggered) {
        setHamonTriggered(true)
      }

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
            setUpcomingWords(prev => prev.filter(w => w.toLowerCase() !== currentWord?.word.toLowerCase()))
          }
        } else {
          // If incorrect, just clear the selection so they can try again
          setSelectedId(null)
        }
      }, 1200)
    } catch {
      setTimeout(() => {
        setSelectedId(null)
        setCorrectId(null)
      }, 1200)
    } finally {
      setIsSubmitting(false)
    }
  }, [currentWord, selectedId, isSubmitting, attempts, user?.id, currentStep])

  const moduleTitle = moduleNumber === 2 ? 'Module 2: Salita ng Katawan' : 'Module 3: Salita ng Pamilya'
  const moduleLocation = moduleNumber === 2 ? "Hardin ni Lola" : "Kusina ni Lolo"

  if (moduleComplete) {
    return (
      <AppShell>
        <div className="min-h-full flex items-center justify-center p-8">
          <div className="max-w-sm text-center animate-bounce-in">
            <div className="text-6xl mb-6">🌟</div>
            <h2 className="text-2xl font-heading font-bold text-white mb-3">Natapos ang {moduleTitle}!</h2>
            <p className="text-green-300 mb-6">Kahanga-hanga! Natuto ka ng lahat ng salita.</p>
            <button onClick={() => navigate('/trail')} className="w-full py-3 rounded-xl bg-gradient-to-r from-pamana-green to-emerald-500 text-white font-bold">
              Bumalik sa Pamana Trail
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  const [isSkippingHamon, setIsSkippingHamon] = useState(false)
  const [isSkippingHamonLoading, setIsSkippingHamonLoading] = useState(false)

  if (hamonTriggered) {
    if (isSkippingHamon) {
      return (
        <AppShell>
          <div className="min-h-full flex items-center justify-center p-8">
            <div className="max-w-sm text-center animate-bounce-in bg-pamana-surface p-6 rounded-2xl shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4">Lalaktawan ang Hamon?</h2>
              <p className="text-green-300 text-sm mb-6">Sigurado ka ba? Ang paglaktaw sa hamon ay itatala na "0%" para sa sesyon na ito.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsSkippingHamon(false)} 
                  className="flex-1 py-2 rounded-xl bg-gray-600 text-white font-bold hover:bg-gray-500 transition-colors"
                  disabled={isSkippingHamonLoading}
                >
                  Bumalik
                </button>
                <button 
                  onClick={async () => {
                    setIsSkippingHamonLoading(true)
                    try {
                      await api.post('/hamon/skip')
                      setHamonTriggered(false)
                      fetchNextWord()
                    } catch (e) {
                      console.error(e)
                    } finally {
                      setIsSkippingHamonLoading(false)
                      setIsSkippingHamon(false)
                    }
                  }} 
                  className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold disabled:opacity-50 hover:bg-red-400 transition-colors"
                  disabled={isSkippingHamonLoading}
                >
                  {isSkippingHamonLoading ? '...' : 'Oo, Laktawan'}
                </button>
              </div>
            </div>
          </div>
        </AppShell>
      )
    }

    return (
      <AppShell>
        <div className="min-h-full flex items-center justify-center p-8">
          <div className="max-w-sm text-center animate-bounce-in">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-heading font-bold text-white mb-2">Hamon ng Pamana!</h2>
            <p className="text-green-300 mb-6">Sulitin ang iyong natutunang mga salita sa espesyal na hamon!</p>
            <button
              onClick={() => navigate(`/modules/${moduleNumber}/hamon`)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pamana-gold to-amber-500 text-white font-bold mb-3 hover:opacity-90 transition-opacity"
            >
              Tumanggap ng Hamon!
            </button>
            <button onClick={() => setIsSkippingHamon(true)} className="w-full py-2 text-green-400 text-sm hover:text-green-300 transition-colors">
              Magpatuloy sa susunod na salita →
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  if (wordComplete) {
    return (
      <AppShell>
        <div className="min-h-full flex items-center justify-center p-8">
          <div className="max-w-sm text-center animate-bounce-in">
            <div className="text-5xl mb-4">⭐</div>
            <h2 className="text-xl font-heading font-bold text-white mb-2">Natuto ka ng bagong salita!</h2>
            <p className="text-green-300 mb-6">
              "<span className="text-pamana-gold font-bold">{currentWord?.word}</span>" — naitala na sa iyong talasalitaan!
            </p>
            <button onClick={fetchNextWord} className="w-full py-3 rounded-xl bg-gradient-to-r from-pamana-green to-emerald-500 text-white font-bold flex items-center justify-center gap-2">
              Susunod na Salita <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex justify-center items-start gap-8 xl:gap-16 max-w-[1200px] mx-auto w-full p-6 lg:p-8">
        
        {/* Left Side Slot Machine (Hidden on small screens) */}
        <div className="hidden lg:block w-56 mt-24">
          <WordSlotMachine words={upcomingWords} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 max-w-2xl w-full">
        <button onClick={() => navigate('/trail')} className="flex items-center gap-2 text-green-300 hover:text-white transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Pamana Trail</span>
        </button>

        <div className="mb-4">
          <h1 className="text-2xl font-heading font-bold text-white mb-0.5">{moduleTitle}</h1>
          <p className="text-green-400 text-sm">{moduleLocation} · Spiral Loop</p>
        </div>

        {/* Spiral step indicator */}
        <div className="flex gap-2 mb-6">
          {SPIRAL_STEPS.map((step, idx) => {
            const stepIdx = SPIRAL_STEPS.indexOf(currentStep)
            const isDone = idx < stepIdx
            const isCurrent = step === currentStep
            return (
              <div key={step} className={cn(
                'flex-1 py-2 px-1 rounded-xl text-xs font-semibold text-center border transition-all',
                isCurrent && 'bg-pamana-gold/20 border-pamana-gold text-pamana-gold',
                isDone && 'bg-green-500/20 border-green-500/40 text-green-300',
                !isCurrent && !isDone && 'bg-white/5 border-white/10 text-white/30'
              )}>
                {STEP_LABELS[step].split('. ')[1]}
              </div>
            )
          })}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-pamana-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : currentWord ? (
          <div className="space-y-6">
            <NPCDialogue npc="lolo" line={NPC_LINES[currentStep]} />

            {/* Pakinggan step: word intro + auto-play */}
            {currentStep === 'pakinggan' && (
              <div className="flex flex-col items-center gap-4 py-6">
                <img
                  src={currentWord.imageUrl}
                  alt={currentWord.word}
                  className="w-40 h-40 object-contain rounded-2xl border-2 border-white/20"
                />
                <p className="text-white font-heading font-bold text-3xl">{currentWord.word}</p>
                <AudioPlayer audioUrl={currentWord.audioUrl} size="lg" label="Pakinggan ang salita" />
                <p className="text-green-300 text-sm">Pindutin para marinig ulit</p>
                {!pakingganDone && (
                  <button
                    onClick={() => { setPakingganDone(true); setCurrentStep('kilalanin') }}
                    className="mt-4 px-8 py-3 rounded-xl bg-gradient-to-r from-pamana-green to-emerald-500 text-white font-bold hover:opacity-90 transition-all"
                  >
                    Susunod →
                  </button>
                )}
              </div>
            )}

            {/* Kilalanin step: audio → image match */}
            {currentStep === 'kilalanin' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <AudioPlayer audioUrl={currentWord.audioUrl} size="lg" label="Pakinggan ang salita" />
                </div>
                <OptionGrid
                  options={matchOptions}
                  selectedId={selectedId}
                  correctId={correctId}
                  onSelect={handleStepSelect}
                  type="image"
                  attempts={attempts}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* Basahin step: audio → written word match */}
            {currentStep === 'basahin' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <AudioPlayer audioUrl={currentWord.audioUrl} size="lg" label="Pakinggan ang salita" />
                </div>
                <OptionGrid
                  options={matchOptions}
                  selectedId={selectedId}
                  correctId={correctId}
                  onSelect={handleStepSelect}
                  type="text"
                  attempts={attempts}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* Gamitin step: dialogue completion (simplified) */}
            {currentStep === 'gamitin' && (
              <div className="space-y-4">
                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-white text-base leading-relaxed text-center">
                    "{gamitinSentence}"
                  </p>
                </div>
                <OptionGrid
                  options={matchOptions}
                  selectedId={selectedId}
                  correctId={correctId}
                  onSelect={handleStepSelect}
                  type="text"
                  attempts={attempts}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* Hint text */}
            {attempts >= 3 && (
              <p className="text-center text-pamana-gold text-xs">💡 Ang gintong kahon ang tamang sagot!</p>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <Badge className="bg-green-500/20 text-green-300 border-green-500/40 text-sm px-4 py-2">
              Natapos na ang lahat ng salita! 🎉
            </Badge>
          </div>
        )}
      </div>
      </div>
    </AppShell>
  )
}

