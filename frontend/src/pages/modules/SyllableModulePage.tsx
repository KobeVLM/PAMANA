import React, { useState, useEffect, useCallback } from 'react'
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
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

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
}

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

export const SyllableModulePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [status, setStatus] = useState<SyllableStatus | null>(null)
  const [currentSet, setCurrentSet] = useState<SyllableSet | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [correctId, setCorrectId] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [moduleComplete, setModuleComplete] = useState(false)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get(`/syllables/status/${user?.id}`)
      setStatus(res.data)
      return res.data as SyllableStatus
    } catch {
      return null
    }
  }, [user?.id])

  const fetchCurrentSet = useCallback(async (subLevel: SubLevel, setId: number) => {
    try {
      const res = await api.get(`/syllables/set?subLevel=${subLevel}&setId=${setId}&userId=${user?.id}`)
      setCurrentSet(res.data)
    } catch {
      // Fallback mock data for development
      setCurrentSet({
        setId,
        subLevel,
        targetSyllable: 'BA',
        options: [
          { id: 'ba', label: 'BA' },
          { id: 'be', label: 'BE' },
          { id: 'bi', label: 'BI' },
          { id: 'bo', label: 'BO' },
        ],
        audioUrl: `/static/assets/audio/syllables/${subLevel}_${setId}.wav`,
        consonant: 'B',
        vowel: 'A',
        consonantAudioUrl: '/static/assets/audio/consonants/b.wav',
        vowelAudioUrl: '/static/assets/audio/vowels/a.wav',
      })
    }
  }, [user?.id])

  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      const s = await fetchStatus()
      if (s) {
        await fetchCurrentSet(s.currentSubLevel, s.currentSetId)
      }
      setIsLoading(false)
    }
    if (user?.id) init()
  }, [user?.id, fetchStatus, fetchCurrentSet])

  const handleSelect = useCallback(async (optionId: string) => {
    if (isSubmitting || !currentSet || selectedId) return
    const isCorrect = optionId === currentSet.targetSyllable.toLowerCase()
    setSelectedId(optionId)
    setCorrectId(currentSet.targetSyllable.toLowerCase())
    setFeedback(isCorrect ? 'correct' : 'incorrect')

    const newAttempts = attempts + 1
    setAttempts(newAttempts)
    const accuracy = isCorrect ? 100 : Math.max(0, 100 - (newAttempts * 25))

    setIsSubmitting(true)
    try {
      const res = await api.post('/syllables/progress', {
        userId: user?.id,
        subLevel: currentSet.subLevel,
        setId: currentSet.setId,
        selected: optionId,
        correct: isCorrect,
        accuracy,
      })

      if (res.data.module2Unlocked) {
        setTimeout(() => setModuleComplete(true), 1200)
      } else if (res.data.nextSet) {
        setTimeout(async () => {
          setSelectedId(null)
          setCorrectId(null)
          setAttempts(0)
          setFeedback(null)
          await fetchCurrentSet(res.data.subLevel, res.data.nextSet)
          const updatedStatus = await fetchStatus()
          if (updatedStatus) setStatus(updatedStatus)
        }, 1500)
      }
    } catch {
      // Still advance UI even if API fails
      setTimeout(() => {
        setSelectedId(null)
        setCorrectId(null)
        setAttempts(0)
        setFeedback(null)
      }, 1500)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, currentSet, selectedId, attempts, user?.id, fetchCurrentSet, fetchStatus])

  if (moduleComplete) {
    return (
      <AppShell>
        <div className="min-h-full flex items-center justify-center p-8">
          <div className="max-w-sm text-center animate-bounce-in">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-2xl font-heading font-bold text-white mb-3">Natapos mo na ang Module 1!</h2>
            <p className="text-green-300 mb-6">Napakahusay! Na-unlock na ang susunod na aralin.</p>
            <button
              onClick={() => navigate('/trail')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pamana-green to-emerald-500 text-white font-bold hover:opacity-90 transition-opacity"
            >
              Bumalik sa Pamana Trail
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/trail')}
          className="flex items-center gap-2 text-green-300 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Pamana Trail</span>
        </button>

        {/* Module header */}
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-white mb-1">Module 1: Pakinggan at Kilalanin</h1>
          <p className="text-green-400 text-sm">Pinto ng Probinsya · Pagsama ng mga Tunog</p>
        </div>

        {/* Sub-level progress tabs */}
        {status && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {(Object.keys(SUB_LEVEL_LABELS) as SubLevel[]).map((sl) => {
              const acc = status.subLevelAccuracies[sl] ?? 0
              const isCurrent = sl === status.currentSubLevel
              const isComplete = acc >= 80

              return (
                <div
                  key={sl}
                  className={cn(
                    'flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border transition-all',
                    isCurrent && 'bg-pamana-gold/20 border-pamana-gold text-pamana-gold',
                    isComplete && !isCurrent && 'bg-green-500/20 border-green-500/40 text-green-300',
                    !isCurrent && !isComplete && 'bg-white/5 border-white/10 text-white/40'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {isComplete && <CheckCircle2 className="w-3 h-3" />}
                    <span>{SUB_LEVEL_LABELS[sl].split('. ')[1]}</span>
                  </div>
                  {acc > 0 && <div className="text-center mt-0.5 opacity-70">{acc}%</div>}
                </div>
              )
            })}
          </div>
        )}

        {/* Module overall accuracy */}
        {status && (
          <div className="mb-6 p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
            <span className="text-green-300 text-sm">Katumpakan ng Module</span>
            <div className="flex-1">
              <Progress
                value={status.moduleAccuracy}
                className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-pamana-green [&>div]:to-emerald-400"
              />
            </div>
            <span className="text-white font-bold text-sm whitespace-nowrap">{status.moduleAccuracy}%</span>
            <Badge variant="outline" className="text-xs border-green-500/40 text-green-300">
              Kailangan: 80%
            </Badge>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center gap-6 py-16">
            <div className="w-12 h-12 border-4 border-pamana-gold border-t-transparent rounded-full animate-spin" />
            <p className="text-green-300">Naglo-load ng aralin...</p>
          </div>
        ) : currentSet ? (
          <div className="space-y-6">
            {/* NPC instruction */}
            <NPCDialogue
              npc="lola"
              line={NPC_LINES[currentSet.subLevel]}
            />

            {/* Pagsama: Show consonant + vowel audio pair */}
            {currentSet.subLevel === 'pagsama' && (
              <div className="flex items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <AudioPlayer audioUrl={currentSet.consonantAudioUrl ?? ''} size="lg" label="Pakinggan ang katinig" />
                  <span className="text-white font-heading font-bold text-2xl">{currentSet.consonant}</span>
                  <span className="text-green-300 text-xs">Katinig</span>
                </div>
                <span className="text-white/40 text-3xl">+</span>
                <div className="flex flex-col items-center gap-2">
                  <AudioPlayer audioUrl={currentSet.vowelAudioUrl ?? ''} size="lg" label="Pakinggan ang patinig" />
                  <span className="text-white font-heading font-bold text-2xl">{currentSet.vowel}</span>
                  <span className="text-green-300 text-xs">Patinig</span>
                </div>
                <span className="text-white/40 text-3xl">=</span>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 border-2 border-dashed border-white/20 flex items-center justify-center">
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
                    autoPlay
                    size="lg"
                    label="Pakinggan ang tunog"
                  />
                  <p className="text-green-300 text-sm">Pindutin para marinig ulit</p>
                </div>
              </div>
            )}

            {/* Feedback banner */}
            {feedback && (
              <div className={cn(
                'p-3 rounded-xl text-center font-semibold text-sm animate-bounce-in',
                feedback === 'correct'
                  ? 'bg-green-500/20 border border-green-500/40 text-green-300'
                  : 'bg-red-500/20 border border-red-500/40 text-red-300'
              )}>
                {feedback === 'correct' ? '✅ Tama! Napakahusay!' : '❌ Mali. Subukan ulit!'}
              </div>
            )}

            {/* Options grid */}
            <OptionGrid
              options={currentSet.options}
              selectedId={selectedId}
              correctId={correctId}
              onSelect={handleSelect}
              type="text"
              attempts={attempts}
              disabled={isSubmitting}
            />

            {/* Attempt counter hint */}
            {attempts > 0 && attempts < 3 && (
              <p className="text-center text-yellow-400/70 text-xs">
                Pagsubok: {attempts}/3 · Pa-{3 - attempts} bago lumabas ang pahiwatig
              </p>
            )}
            {attempts >= 3 && (
              <p className="text-center text-pamana-gold text-xs">
                💡 Ang gintong kahon ang tamang sagot!
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-16 text-green-300">
            <p>Hindi ma-load ang aralin. Subukan ulit.</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
