import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import api from '@/lib/api'
import type { DashboardMetrics, WordMasteryStatus } from '@/types'
import { Loader2, Download, AlertTriangle, TrendingUp, BookOpen, Trophy, Clock, Map } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface ModuleAttemptHistory {
  id: string
  userId: string
  moduleNumber: number
  attemptNumber: number
  accuracy: number
  completedAt: string
}

const STATUS_COLORS = {
  green: { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-300', dot: 'bg-green-400' },
  yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-300', dot: 'bg-yellow-400' },
  red: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-300', dot: 'bg-red-400' },
  grey: { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/40', dot: 'bg-white/30' },
}

const STATUS_LABELS = {
  green: 'Natuto na',
  yellow: 'Nag-aaral pa',
  red: 'Kailangan ng tulong',
  grey: 'Hindi pa nagsisimula',
}

const MODULE_NAMES = ['Module 1', 'Module 2', 'Module 3', 'Module 4']

interface PDFDownloadButtonProps {
  userId: string
  moduleNumber: number
  isComplete: boolean
}

const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({ userId, moduleNumber, isComplete }) => {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState('')

  const handleDownload = async () => {
    setIsDownloading(true)
    setError('')
    try {
      const res = await api.get(`/reports/generate/${userId}/${moduleNumber}`, {
        responseType: 'blob',
        timeout: 12000,
      })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `pamana_module${moduleNumber}_report.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Hindi na-generate ang report. Subukan ulit.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={!isComplete || isDownloading}
        aria-label={`I-download ang report para sa Module ${moduleNumber}`}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
          isComplete
            ? 'bg-pamana-green/20 border border-pamana-green/40 text-green-300 hover:bg-pamana-green/30'
            : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
        )}
      >
        {isDownloading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        Module {moduleNumber} Report
      </button>
      {error && <p className="text-red-300 text-xs mt-1">{error}</p>}
    </div>
  )
}

export const ParentDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [targetUserId, setTargetUserId] = useState<string>('')
  const [moduleCompletion, setModuleCompletion] = useState<boolean[]>([false, false, false, false])
  const [linkedLearnerName, setLinkedLearnerName] = useState<string | null>(null)
  const [learnerEmail, setLearnerEmail] = useState('')
  const [isLinking, setIsLinking] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [moduleHistory, setModuleHistory] = useState<ModuleAttemptHistory[]>([])

  const handleUnlinkLearner = async () => {
    setIsUnlinking(true)
    try {
      await api.post('/parent/unlink-learner')
      setTargetUserId('')
      setLinkedLearnerName(null)
      setMetrics(null)
      setModuleHistory([])
      setModuleCompletion([false, false, false, false])
    } catch (err) {
      alert('Nagkaroon ng error sa pag-unlink. Subukan ulit.')
    } finally {
      setIsUnlinking(false)
    }
  }

  const formatHistoryData = (history: ModuleAttemptHistory[]) => {
    if (!history.length) return [];
    const maxAttempt = Math.max(...history.map(h => h.attemptNumber));
    const data = [];
    for (let i = 1; i <= maxAttempt; i++) {
      const row: any = { attempt: `Attempt ${i}` };
      history.filter(h => h.attemptNumber === i).forEach(h => {
        row[`module${h.moduleNumber}`] = h.accuracy;
      });
      data.push(row);
    }
    return data;
  }

  const loadDashboard = async () => {
    try {
      const linkedRes = await api.get('/parent/linked-learner')
      if (linkedRes.data.hasLinkedLearner) {
        const uid = linkedRes.data.learnerId
        setTargetUserId(uid)
        setLinkedLearnerName(linkedRes.data.learnerName)

        const [metricsRes, progressRes, historyRes] = await Promise.all([
          api.get(`/progress/${uid}/dashboard`),
          api.get(`/modules/progress/${uid}`),
          api.get(`/modules/history/${uid}`)
        ])
        setMetrics(metricsRes.data)
        setModuleHistory(historyRes.data)
        const completions = [false, false, false, false]
        ;(progressRes.data as { moduleNumber: number; isComplete: boolean }[]).forEach((p) => {
          if (p.moduleNumber >= 1 && p.moduleNumber <= 4) {
            completions[p.moduleNumber - 1] = p.isComplete
          }
        })
        setModuleCompletion(completions)
      } else {
        setMetrics(null)
        setTargetUserId('')
      }
    } catch {
      // Ignore errors for MVP if not fully wired
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadDashboard()
  }, [user])

  const handleLinkLearner = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLinking(true)
    setLinkError('')
    try {
      await api.post('/parent/link-learner', { learnerEmail })
      await loadDashboard()
    } catch (err: any) {
      setLinkError(err.response?.data?.error || 'Failed to link learner. Make sure the email is correct.')
    } finally {
      setIsLinking(false)
    }
  }

  const atRiskWords = metrics?.wordMasteryList.filter((w) => w.status === 'red') ?? []
  const pieData = metrics
    ? [
        { name: 'Natuto na', value: metrics.masteredCount, color: '#22c55e' },
        { name: 'Kailangan ng Tulong', value: metrics.needsReviewCount, color: '#ef4444' },
      ]
    : []

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

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-white mb-1">
              Dashboard ng Magulang 📊
            </h1>
            <p className="text-green-300">
              {linkedLearnerName 
                ? `Subaybayan ang pag-unlad ni ${linkedLearnerName} sa PAMANA.`
                : 'Subaybayan ang pag-unlad ng iyong anak sa PAMANA.'}
            </p>
          </div>
          {targetUserId && (
            <Dialog>
              <DialogTrigger asChild>
                <button
                  disabled={isUnlinking}
                  className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/40 rounded-xl hover:bg-red-500/30 transition-colors text-sm font-semibold flex items-center gap-2"
                >
                  {isUnlinking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'I-unlink ang Account'}
                </button>
              </DialogTrigger>
              <DialogContent className="bg-[#1A2E1A] border border-white/20 text-white sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold font-heading text-red-400">Sigurado ka ba?</DialogTitle>
                  <DialogDescription className="text-green-300/80">
                    Kapag i-unlink mo ang account na ito, mawawala ang access mo sa progreso at reports ng iyong anak hanggang i-link mo ulit ito.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 flex sm:justify-end gap-2">
                  <DialogClose asChild>
                    <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm font-semibold">
                      I-cancel
                    </button>
                  </DialogClose>
                  <button 
                    onClick={handleUnlinkLearner}
                    className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-xl transition-colors text-sm font-semibold"
                  >
                    Oo, i-unlink ito
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!targetUserId && (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 max-w-md mx-auto text-center mb-8">
            <h2 className="text-xl font-bold text-white mb-2">I-link ang iyong anak</h2>
            <p className="text-sm text-green-300 mb-6">Pakilagay ang email account ng iyong anak (Learner) upang masubaybayan ang kanilang progreso.</p>
            <form onSubmit={handleLinkLearner} className="space-y-4">
              <input
                type="email"
                placeholder="Email ng anak..."
                value={learnerEmail}
                onChange={(e) => setLearnerEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/30 outline-none focus:border-pamana-green"
                required
              />
              <button
                type="submit"
                disabled={isLinking}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pamana-green to-emerald-500 text-white font-bold hover:scale-105 transition-transform disabled:opacity-50"
              >
                {isLinking ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'I-link ang Account'}
              </button>
              {linkError && <p className="text-red-400 text-sm mt-2">{linkError}</p>}
            </form>
          </div>
        )}

        {targetUserId && (
          <>
            {/* At-Risk Alerts */}
        {atRiskWords.length > 0 && (
          <div className="mb-6 space-y-2">
            {atRiskWords.map((word) => (
              <Alert key={word.wordId} className="bg-red-500/10 border-red-500/40">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200 text-sm">
                  Ang iyong anak ay nahihirapan sa salitang <strong>"{word.word}"</strong>.
                  Katumpakan: {word.overallAccuracy}%. Subukan ulit!
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Trail Completion */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-pamana-green/20 flex items-center justify-center">
                <Map className="w-5 h-5 text-pamana-green" />
              </div>
              <span className="text-green-300 font-medium text-sm">Trail Completion</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2">{metrics?.trailCompletion ?? 0}%</div>
            <Progress
              value={metrics?.trailCompletion ?? 0}
              className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-pamana-green [&>div]:to-emerald-400"
            />
          </div>

          {/* Mastered Words */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-green-300 font-medium text-sm">Mga Salitang Natuto</span>
            </div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-white">{metrics?.masteredCount ?? 0}</div>
              <div className="text-sm text-red-400 mb-1">/ {(metrics?.masteredCount ?? 0) + (metrics?.needsReviewCount ?? 0)} na natuklas</div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-green-300">Natuto: {metrics?.masteredCount}</span>
              <div className="w-2 h-2 rounded-full bg-red-400 ml-2" />
              <span className="text-xs text-red-300">Kailangan: {metrics?.needsReviewCount}</span>
            </div>
          </div>

          {/* Hamon Pass Rate */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-pamana-gold/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-pamana-gold" />
              </div>
              <span className="text-green-300 font-medium text-sm">Hamon ng Pamana</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2">{metrics?.hamonPassRate ?? 0}%</div>
            <div className="text-xs text-green-400">Pass Rate sa mga hamon</div>
          </div>

          {/* Avg Session Duration */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-green-300 font-medium text-sm">Avg Session</span>
            </div>
            <div className="text-3xl font-bold text-white">{metrics?.avgSessionDuration ?? 0}<span className="text-lg text-green-400 ml-1">min</span></div>
            <div className="text-xs text-green-400 mt-1">bawat linggo</div>
          </div>

          {/* Accuracy Trend Chart */}
          <div className="md:col-span-2 bg-white/10 border border-white/20 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-green-300 font-medium text-sm">Katumpakan sa bawat Module</span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={metrics?.accuracyTrend.map((t, i) => ({ name: MODULE_NAMES[i], accuracy: t.accuracy }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{ fill: '#86efac', fontSize: 11 }} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#86efac', fontSize: 11 }} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#86efac' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="accuracy" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Learning Curve Line Chart */}
        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Learning Curve</h3>
              <p className="text-green-300 text-sm">Pag-unlad ng accuracy sa bawat attempt</p>
            </div>
          </div>
          
          {moduleHistory.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatHistoryData(moduleHistory)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="attempt" axisLine={false} tick={{fill: '#86efac', fontSize: 12}} />
                  <YAxis domain={[0, 100]} axisLine={false} tick={{fill: '#86efac', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}}
                  />
                  <Line type="monotone" connectNulls dataKey="module1" name="Module 1" stroke="#3B82F6" strokeWidth={2} dot={{r: 4}} />
                  <Line type="monotone" connectNulls dataKey="module2" name="Module 2" stroke="#EF4444" strokeWidth={2} dot={{r: 4}} />
                  <Line type="monotone" connectNulls dataKey="module3" name="Module 3" stroke="#F59E0B" strokeWidth={2} dot={{r: 4}} />
                  <Line type="monotone" connectNulls dataKey="module4" name="Module 4" stroke="#10B981" strokeWidth={2} dot={{r: 4}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-green-300/50">
              Wala pang history ng retake.
            </div>
          )}
        </div>

        {/* Mastered vs Needs-Review Pie + Word Mastery List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Pie chart */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-5 flex flex-col items-center justify-center">
            <h3 className="text-green-300 font-medium text-sm mb-3">Katayuan ng mga Salita</h3>
            <PieChart width={160} height={160}>
              <Pie data={pieData} cx={75} cy={75} innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="flex gap-4 mt-2">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs text-white/60">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Word Mastery List */}
          <div className="lg:col-span-2 bg-white/10 border border-white/20 rounded-2xl p-5">
            <h3 className="text-green-300 font-medium text-sm mb-3">Listahan ng mga Salita</h3>
            <ScrollArea className="h-52">
              {metrics?.wordMasteryList.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-8">Hindi pa nagsisimula ang pag-aaral ng salita.</p>
              ) : (
                <div className="space-y-2 pr-2">
                  {metrics?.wordMasteryList.map((word: WordMasteryStatus) => {
                    const colors = STATUS_COLORS[word.status]
                    return (
                      <div
                        key={word.wordId}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-xl border',
                          colors.bg, colors.border
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', colors.dot)} />
                          <span className={cn('font-semibold text-sm', colors.text)}>{word.word}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn('text-xs border', colors.border, colors.text)}>
                            {STATUS_LABELS[word.status]}
                          </Badge>
                          <span className="text-white/50 text-xs font-mono">{word.overallAccuracy}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* PDF Download buttons */}
        <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
          <h3 className="text-green-300 font-medium text-sm mb-4">I-download ang mga Report</h3>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4].map((moduleNum) => (
              <PDFDownloadButton
                key={moduleNum}
                userId={targetUserId}
                moduleNumber={moduleNum}
                isComplete={moduleCompletion[moduleNum - 1] ?? false}
              />
            ))}
          </div>
          <p className="text-white/30 text-xs mt-3">
            * Ang PDF report ay available lamang pagkatapos makumpleto ang bawat module.
          </p>
        </div>
        </>
        )}
      </div>
    </AppShell>
  )
}
