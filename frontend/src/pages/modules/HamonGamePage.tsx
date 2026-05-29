import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { OptionGrid } from '@/components/game/OptionGrid'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import api from '@/lib/api'
import { ArrowLeft } from 'lucide-react'

interface VocabWord {
  wordId: string
  word: string
  audioUrl: string
  imageUrl: string
}

interface DialogueResponse {
  wordId: string
  sentenceTemplate: string
  correctWord: string
  options: string[]
  audioUrl: string
}

export const HamonGamePage: React.FC = () => {
  const { moduleNumber } = useParams<{ moduleNumber: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [words, setWords] = useState<VocabWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const [currentDialogue, setCurrentDialogue] = useState<DialogueResponse | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [correctId, setCorrectId] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  
  const [results, setResults] = useState<Record<string, number>>({})
  const [isComplete, setIsComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const [finalResult, setFinalResult] = useState<{ passRate: number, masteredCount: number, reQueuedWords: string[] } | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get('/hamon/session/active')
        setSessionId(res.data.sessionId)
        setWords(res.data.words)
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to fetch hamon session', err)
        navigate('/trail')
      }
    }
    if (user?.id) fetchSession()
  }, [user?.id, navigate])

  useEffect(() => {
    if (words.length > 0 && currentIndex < words.length) {
      const fetchDialogue = async () => {
        try {
          const res = await api.get(`/vocabulary/gamitin/${words[currentIndex].wordId}`)
          setCurrentDialogue(res.data)
        } catch (err) {
          console.error(err)
        }
      }
      fetchDialogue()
    } else if (words.length > 0 && currentIndex >= words.length && !isComplete) {
      setIsComplete(true)
      submitResults()
    }
  }, [currentIndex, words, isComplete])

  const submitResults = async () => {
    if (!sessionId) return
    try {
      const res = await api.post(`/hamon/results/${sessionId}`, results)
      setFinalResult(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSelect = (optionLabel: string) => {
    if (!currentDialogue || selectedId) return
    
    const isCorrect = optionLabel === currentDialogue.correctWord
    setSelectedId(optionLabel)
    setCorrectId(currentDialogue.correctWord)

    const currentAttempts = attempts + 1
    setAttempts(currentAttempts)
    
    if (isCorrect) {
      if (currentDialogue.audioUrl) {
        new Audio(currentDialogue.audioUrl).play().catch(console.warn)
      }
      // Calculate score for this word
      const accuracy = currentAttempts === 1 ? 100 : Math.max(0, 100 - ((currentAttempts - 1) * 30))
      setResults(prev => ({ ...prev, [currentDialogue.wordId]: accuracy }))
      
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
        setSelectedId(null)
        setCorrectId(null)
        setAttempts(0)
      }, 1500)
    } else {
      new Audio('/audio/sfx/wrong.mp3').play().catch(console.warn)
      setTimeout(() => {
        setSelectedId(null)
      }, 1200)
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-pamana-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    )
  }

  if (finalResult) {
    return (
      <AppShell>
        <div className="min-h-full flex items-center justify-center p-8">
          <div className="max-w-md text-center bg-white/10 p-8 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-md animate-bounce-in">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-heading font-bold text-white mb-2">Natapos ang Hamon!</h2>
            
            <div className="my-8 flex justify-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-black text-pamana-gold">{finalResult.passRate.toFixed(0)}%</div>
                <div className="text-sm text-green-300 font-medium">Pass Rate</div>
              </div>
              <div className="w-px bg-white/20"></div>
              <div className="text-center">
                <div className="text-4xl font-black text-emerald-400">{finalResult.masteredCount}</div>
                <div className="text-sm text-green-300 font-medium">Mastered</div>
              </div>
            </div>

            {finalResult.reQueuedWords.length > 0 && (
              <div className="bg-red-500/20 border border-red-500/30 p-4 rounded-xl mb-6">
                <p className="text-sm text-red-200 mb-2 font-medium">Mga salitang kailangan pang pag-aralan:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {finalResult.reQueuedWords.map(word => (
                    <span key={word} className="px-3 py-1 bg-red-500/40 text-red-100 rounded-full text-sm">{word}</span>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={() => navigate(`/modules/${moduleNumber}`)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pamana-green to-emerald-500 text-white font-bold hover:scale-105 transition-transform"
            >
              Bumalik sa Module
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <button onClick={() => navigate(`/modules/${moduleNumber}`)} className="flex items-center gap-2 text-green-300 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Bumalik</span>
          </button>
          <div className="px-4 py-1.5 bg-pamana-gold/20 text-pamana-gold font-bold text-sm rounded-full border border-pamana-gold/30">
            Hamon ng Pamana: {Math.min(currentIndex + 1, words.length)} / {words.length}
          </div>
        </div>

        {currentDialogue && (
          <div className="space-y-6">
            <NPCDialogue npc="lolo" line={currentDialogue.sentenceTemplate} />
            
            <div className="flex flex-col items-center gap-3 mt-4 mb-2">
              <p className="text-white/90 text-sm font-medium">Kumpletuhin ang pangungusap sa itaas. Pakinggan ang pahiwatig:</p>
              <AudioPlayer audioUrl={currentDialogue.audioUrl} />
            </div>

            <OptionGrid
              options={currentDialogue.options.map((opt) => ({ id: opt, label: opt }))}
              selectedId={selectedId}
              correctId={correctId}
              onSelect={handleSelect}
              type="text"
              attempts={attempts}
            />

            {attempts >= 3 && (
              <p className="text-center text-pamana-gold text-xs">💡 Ang gintong kahon ang tamang sagot!</p>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
