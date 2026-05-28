import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Loader2, Users, AlertTriangle, ChevronRight, BookOpen, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface WordMasteryStatus {
  wordId: string
  word: string
  overallAccuracy: number
  hamonFailCount: number
  status: 'green' | 'yellow' | 'red' | 'grey'
}

interface LearnerDetail {
  learnerId: string
  learnerName: string
  modulesCompleted: number
  hamonPassRate: number
  atRiskWordCount: number
  wordMasteryList: WordMasteryStatus[]
}

export const TeacherDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [klase, setKlase] = useState<{ id: string; name: string; joinCode: string } | null>(null)
  const [learners, setLearners] = useState<LearnerDetail[]>([])
  const [expandedLearner, setExpandedLearner] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const klaseRes = await api.get('/klase/teacher')
        setKlase(klaseRes.data)
        
        const learnersRes = await api.get(`/klase/${klaseRes.data.id}/teacher-view`)
        setLearners(learnersRes.data)
      } catch (err: any) {
        if (err.response?.status === 404) {
          setKlase(null)
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <AppShell>
        <div className="min-h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-pamana-gold animate-spin" />
            <p className="text-green-300">Naglo-load ng datos...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!klase) {
    return (
      <AppShell>
        <div className="p-6 lg:p-8 max-w-4xl mx-auto flex flex-col items-center justify-center text-center mt-20">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-pamana-gold" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Walang Klase</h1>
          <p className="text-green-300 mb-8 max-w-md">
            Wala ka pang nagagawang klase. Gumawa na ng klase para magsimulang subaybayan ang iyong mga mag-aaral.
          </p>
          <button
            onClick={() => navigate('/klase')}
            className="px-6 py-3 bg-gradient-to-r from-pamana-gold to-amber-500 text-white font-bold rounded-xl shadow-lg hover:shadow-amber-500/25 transition-all"
          >
            Gumawa ng Klase
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-white mb-1">
              Dashboard ng Guro 👩‍🏫
            </h1>
            <p className="text-green-300">
              Klase: <span className="text-pamana-gold font-bold">{klase.name}</span>
            </p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/20 flex flex-col">
            <span className="text-xs text-green-300">Join Code:</span>
            <span className="font-mono text-xl font-bold tracking-widest text-white">
              {klase.joinCode}
            </span>
          </div>
        </div>

        {learners.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-white/40 mb-2">Wala pang mag-aaral sa iyong klase.</p>
            <p className="text-sm text-green-400">
              Ibigay ang Join Code ({klase.joinCode}) sa iyong mga mag-aaral para sila'y makasali.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {learners.map((learner) => (
              <div
                key={learner.learnerId}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-colors hover:bg-white/10"
              >
                <div
                  className="p-5 flex items-center justify-between cursor-pointer"
                  onClick={() =>
                    setExpandedLearner(expandedLearner === learner.learnerId ? null : learner.learnerId)
                  }
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pamana-green to-emerald-400 flex items-center justify-center text-white font-bold text-lg">
                      {learner.learnerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{learner.learnerName}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-green-300">
                          <BookOpen className="w-3.5 h-3.5" />
                          {learner.modulesCompleted}/4 Modules
                        </span>
                        <span className="flex items-center gap-1 text-xs text-pamana-gold">
                          <Trophy className="w-3.5 h-3.5" />
                          {Math.round(learner.hamonPassRate)}% Hamon
                        </span>
                        {learner.atRiskWordCount > 0 && (
                          <span className="flex items-center gap-1 text-xs text-red-400 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {learner.atRiskWordCount} At-Risk Words
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      'w-5 h-5 text-white/30 transition-transform',
                      expandedLearner === learner.learnerId && 'rotate-90'
                    )}
                  />
                </div>

                {/* Expanded Details */}
                {expandedLearner === learner.learnerId && (
                  <div className="p-5 border-t border-white/10 bg-black/20">
                    <h4 className="text-sm font-semibold text-green-300 mb-3">Katayuan ng mga Salita</h4>
                    {learner.wordMasteryList.length === 0 ? (
                      <p className="text-xs text-white/40 italic">Wala pang datos.</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {learner.wordMasteryList.map((word) => {
                          const isRed = word.status === 'red'
                          const isYellow = word.status === 'yellow'
                          const isGreen = word.status === 'green'
                          return (
                            <div
                              key={word.wordId}
                              className={cn(
                                'flex items-center justify-between p-2 rounded-lg border',
                                isRed
                                  ? 'bg-red-500/10 border-red-500/30'
                                  : isYellow
                                  ? 'bg-yellow-500/10 border-yellow-500/30'
                                  : isGreen
                                  ? 'bg-green-500/10 border-green-500/30'
                                  : 'bg-white/5 border-white/10'
                              )}
                            >
                              <span
                                className={cn(
                                  'text-sm font-medium',
                                  isRed ? 'text-red-300' : isYellow ? 'text-yellow-300' : isGreen ? 'text-green-300' : 'text-white/50'
                                )}
                              >
                                {word.word}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px] px-1 py-0 border',
                                  isRed ? 'text-red-300 border-red-500/30' : isYellow ? 'text-yellow-300 border-yellow-500/30' : isGreen ? 'text-green-300 border-green-500/30' : 'text-white/30 border-white/10'
                                )}
                              >
                                {word.overallAccuracy}%
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
