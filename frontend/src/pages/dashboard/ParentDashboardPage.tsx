import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/modal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import api from '@/lib/api'
import type { DashboardMetrics, WordMasteryStatus } from '@/types'
import { Loader2, Download, AlertTriangle, TrendingUp, BookOpen, Trophy, Clock, Map, Users, UserPlus, Check } from 'lucide-react'
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

interface LinkedLearner {
  id: string
  name: string
  email: string
}

interface ModuleAttemptHistory {
  id: string
  userId: string
  moduleNumber: number
  attemptNumber: number
  accuracy: number
  completedAt: string
}

const STATUS_COLORS = {
  green: { bg: 'bg-[#e7f6e7]', border: 'border-[#4CAF50]', text: 'text-[#1B5E20]', dot: 'bg-[#4CAF50]' },
  yellow: { bg: 'bg-[#fff7db]', border: 'border-[#FFC107]', text: 'text-[#7a5200]', dot: 'bg-[#FFC107]' },
  red: { bg: 'bg-[#fdeaea]', border: 'border-[#EF5350]', text: 'text-[#8f1d1d]', dot: 'bg-[#EF5350]' },
  grey: { bg: 'bg-white/60', border: 'border-[#d5e5d0]', text: 'text-[#5a7a63]', dot: 'bg-[#b9cdb4]' },
}

const STATUS_LABELS = {
  green: 'Mastered',
  yellow: 'In Progress',
  red: 'Needs Help',
  grey: 'Not Started',
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
      setError('Could not generate report. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={!isComplete || isDownloading}
        aria-label={`Download report for Module ${moduleNumber}`}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
          isComplete
            ? 'bg-[#e7f6e7] border-2 border-[#4CAF50] text-[#1B5E20] hover:bg-[#d6efd6]'
            : 'bg-white/60 border-2 border-[#e2eee0] text-[#5a7a63]/60 cursor-not-allowed'
        )}
      >
        {isDownloading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        Module {moduleNumber} Report
      </button>
      {error && <p className="text-[#c62828] text-xs mt-1">{error}</p>}
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
  const [learners, setLearners] = useState<LinkedLearner[]>([])
  const [selectedLearnerId, setSelectedLearnerId] = useState<string>('')
  const [isSwitchingLearner, setIsSwitchingLearner] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [learnerIdentifier, setLearnerIdentifier] = useState('')
  const [isLinking, setIsLinking] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [linkSuccess, setLinkSuccess] = useState('')
  const [moduleHistory, setModuleHistory] = useState<ModuleAttemptHistory[]>([])

  const formatHistoryData = (history: ModuleAttemptHistory[]) => {
    if (!history.length) return [];
    const maxAttempt = Math.max(...history.map(h => h.attemptNumber));
    const data = [];
    for (let i = 1; i <= maxAttempt; i++) {
      const row: Record<string, string | number> = { attempt: `Attempt ${i}` };
      history.filter(h => h.attemptNumber === i).forEach(h => {
        row[`module${h.moduleNumber}`] = h.accuracy;
      });
      data.push(row);
    }
    return data;
  }

  const fetchLearnerData = async (uid: string) => {
    setIsSwitchingLearner(true)
    try {
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
    } catch (e) {
      console.error('Error fetching learner data', e)
    } finally {
      setIsSwitchingLearner(false)
    }
  }

  const loadDashboard = async (preferredLearnerId?: string) => {
    try {
      const linkedRes = await api.get('/parent/linked-learner')
      if (linkedRes.data.hasLinkedLearner && linkedRes.data.learners && linkedRes.data.learners.length > 0) {
        const learnerList: LinkedLearner[] = linkedRes.data.learners
        setLearners(learnerList)

        // Select either the preferred, previously selected, or first learner
        const activeId = preferredLearnerId || (learnerList.some(l => l.id === selectedLearnerId) ? selectedLearnerId : learnerList[0].id)
        setSelectedLearnerId(activeId)
        setTargetUserId(activeId)

        const activeLearner = learnerList.find(l => l.id === activeId) || learnerList[0]
        setLinkedLearnerName(activeLearner.name)

        await fetchLearnerData(activeId)
      } else {
        setLearners([])
        setMetrics(null)
        setTargetUserId('')
        setSelectedLearnerId('')
        setLinkedLearnerName(null)
      }
    } catch (e) {
      console.error('Error loading dashboard', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadDashboard()
    // Intentionally runs when the authenticated parent changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleSelectLearner = async (learnerId: string) => {
    if (learnerId === targetUserId) return
    setSelectedLearnerId(learnerId)
    setTargetUserId(learnerId)
    const active = learners.find(l => l.id === learnerId)
    if (active) {
      setLinkedLearnerName(active.name)
    }
    await fetchLearnerData(learnerId)
  }

  const handleLinkLearner = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLinking(true)
    setLinkError('')
    setLinkSuccess('')
    try {
      const res = await api.post('/parent/link-learner', { identifier: learnerIdentifier.trim() })
      setLinkSuccess(res.data?.message || 'Learner linked successfully!')
      const newLearnerId = res.data?.learnerId
      setLearnerIdentifier('')
      setTimeout(() => {
        setShowLinkModal(false)
        setLinkSuccess('')
      }, 1000)
      await loadDashboard(newLearnerId)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setLinkError(axiosErr.response?.data?.error || 'Could not link learner. Please check the Student ID and try again.')
    } finally {
      setIsLinking(false)
    }
  }

  const activeLearner = learners.find(l => l.id === targetUserId)

  const atRiskWords = metrics?.wordMasteryList.filter((w) => w.status === 'red') ?? []
  const pieData = metrics
    ? [
        { name: 'Mastered', value: metrics.masteredCount, color: '#22c55e' },
        { name: 'Needs Help', value: metrics.needsReviewCount, color: '#ef4444' },
      ]
    : []

  if (isLoading) {
    return (
      <AppShell>
        <div className="min-h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-[#D4A017] animate-spin" />
            <p className="text-[#3f7d52]">Loading data...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-bold text-[#2b5c3b] mb-1">
            Parent Dashboard 📊
          </h1>
          <p className="text-[#3f7d52]">
            {linkedLearnerName 
              ? `Tracking ${linkedLearnerName}'s progress in PAMANA.`
              : "Track your child's progress in PAMANA."}
          </p>
        </div>

        {/* Learner Switcher Bar (when learners exist) */}
        {learners.length > 0 && (
          <div className="bg-white border-2 border-white shadow-[0_6px_0_rgba(0,0,0,0.1)] rounded-2xl p-4 sm:p-5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Active Learner Identity */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFC107]/40 to-[#4CAF50]/40 border-2 border-white flex items-center justify-center text-[#7a5200] font-heading font-black text-xl shadow-inner shrink-0">
                {activeLearner?.name?.[0]?.toUpperCase() || 'L'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#3f7d52]/80 font-bold uppercase tracking-wider">Current Learner</span>
                  {isSwitchingLearner && <Loader2 className="w-3.5 h-3.5 text-[#D4A017] animate-spin" />}
                </div>
                <div className="text-xl font-heading font-bold text-[#2b5c3b] leading-tight">
                  {activeLearner?.name}
                </div>
                <div className="text-xs text-[#3f7d52]/60 font-mono">
                  ID: {activeLearner?.id?.slice(0, 8)}...
                </div>
              </div>
            </div>

            {/* Switcher & Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Learner Selector Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="learner-select" className="text-xs text-[#5a7a63] font-medium hidden sm:inline">Select Learner:</label>
                <div className="relative">
                  <select
                    id="learner-select"
                    value={targetUserId}
                    onChange={(e) => handleSelectLearner(e.target.value)}
                    disabled={isSwitchingLearner}
                    className="appearance-none bg-white border-2 border-[#d5e5d0] hover:border-[#4CAF50] rounded-xl px-4 py-2.5 pr-9 text-sm text-[#2b5c3b] font-medium outline-none focus:border-[#4CAF50] transition-all cursor-pointer"
                  >
                    {learners.map((l) => (
                      <option key={l.id} value={l.id} className="bg-white text-[#2b5c3b] py-1">
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <Users className="w-4 h-4 text-[#3f7d52] absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Link Another Student Button */}
              <button
                type="button"
                onClick={() => {
                  setLinkError('')
                  setLinkSuccess('')
                  setLearnerIdentifier('')
                  setShowLinkModal(true)
                }}
                className="px-4 py-2.5 rounded-xl bg-[#e7f6e7] hover:bg-[#d6efd6] border-2 border-[#4CAF50] text-[#1B5E20] font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all hover:scale-102 active:scale-98 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Link Another Learner</span>
              </button>
            </div>
          </div>
        )}

        {!targetUserId && (
          <div className="bg-white border-2 border-white shadow-[0_6px_0_rgba(0,0,0,0.1)] rounded-2xl p-6 sm:p-8 max-w-md mx-auto text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#e7f6e7] border-2 border-[#4CAF50] flex items-center justify-center text-[#2E7D32] mx-auto mb-3">
              <UserPlus className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#2b5c3b] mb-2">Link Your Child</h2>
            <p className="text-sm text-[#3f7d52] mb-6">
              Enter your child's <strong>Student ID</strong> to view their progress.
            </p>
            <form onSubmit={handleLinkLearner} className="space-y-4">
              <input
                type="text"
                placeholder="Enter Student ID..."
                value={learnerIdentifier}
                onChange={(e) => setLearnerIdentifier(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#f4f9f0] border-2 border-[#d5e5d0] text-[#2b5c3b] placeholder-[#7a9a83] text-sm outline-none focus:border-[#4CAF50]"
                required
              />
              <button
                type="submit"
                disabled={isLinking}
                className="w-full py-3 rounded-xl bg-gradient-to-b from-pamana-green to-emerald-600 border-2 border-white text-white font-bold shadow-[0_6px_0_rgba(0,0,0,0.25)] hover:brightness-110 active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLinking ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Link Account'}
              </button>
              {linkError && <p className="text-[#c62828] text-sm mt-2">{linkError}</p>}
              {linkSuccess && <p className="text-[#2E7D32] text-sm mt-2">{linkSuccess}</p>}
            </form>
          </div>
        )}

        {targetUserId && (
          <>
            {/* At-Risk Alerts */}
        {atRiskWords.length > 0 && (
          <div className="mb-6 space-y-2">
            {atRiskWords.map((word) => (
              <Alert key={word.wordId} className="bg-[#fdeaea] border-2 border-[#EF5350]">
                <AlertTriangle className="h-4 w-4 text-[#c62828]" />
                <AlertDescription className="text-[#8f1d1d] text-sm">
                  Your child is struggling with <strong>"{word.word}"</strong>.
                  Accuracy: {word.overallAccuracy}%. Keep practicing!
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Trail Completion */}
          <div className="bg-white border-2 border-white shadow-[0_6px_0_rgba(0,0,0,0.1)] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#e7f6e7] flex items-center justify-center">
                <Map className="w-5 h-5 text-[#2E7D32]" />
              </div>
              <span className="text-[#3f7d52] font-medium text-sm">Trail Completion</span>
            </div>
            <div className="text-3xl font-bold text-[#2b5c3b] mb-2">{metrics?.trailCompletion ?? 0}%</div>
            <Progress
              value={metrics?.trailCompletion ?? 0}
              className="h-2 bg-[#d9e8d3] [&>div]:bg-gradient-to-r [&>div]:from-pamana-green [&>div]:to-emerald-600"
            />
          </div>

          {/* Mastered Words */}
          <div className="bg-white border-2 border-white shadow-[0_6px_0_rgba(0,0,0,0.1)] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#e3f2fd] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#1565C0]" />
              </div>
              <span className="text-[#3f7d52] font-medium text-sm">Words Learned</span>
            </div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-[#2b5c3b]">{metrics?.masteredCount ?? 0}</div>
              <div className="text-sm text-[#c62828] mb-1">/ {(metrics?.masteredCount ?? 0) + (metrics?.needsReviewCount ?? 0)} discovered</div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-[#4CAF50]" />
              <span className="text-xs text-[#3f7d52]">Mastered: {metrics?.masteredCount}</span>
              <div className="w-2 h-2 rounded-full bg-[#EF5350] ml-2" />
              <span className="text-xs text-[#c62828]">Needs Help: {metrics?.needsReviewCount}</span>
            </div>
          </div>

          {/* Mastery Practice */}
          <div className="bg-white border-2 border-white shadow-[0_6px_0_rgba(0,0,0,0.1)] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#fff7db] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-[#D4A017]" />
              </div>
              <span className="text-[#3f7d52] font-medium text-sm">Mastery Practice</span>
            </div>
            <div className="text-3xl font-bold text-[#2b5c3b] mb-2">{metrics?.trailCompletion ?? 0}%</div>
            <div className="text-xs text-[#2E7D32]">Overall progress</div>
          </div>

          {/* Avg Session Duration */}
          <div className="bg-white border-2 border-white shadow-[0_6px_0_rgba(0,0,0,0.1)] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#f3e8fd] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#7B1FA2]" />
              </div>
              <span className="text-[#3f7d52] font-medium text-sm">Avg Session</span>
            </div>
            <div className="text-3xl font-bold text-[#2b5c3b]">{metrics?.avgSessionDuration ?? 0}<span className="text-lg text-[#2E7D32] ml-1">min</span></div>
            <div className="text-xs text-[#2E7D32] mt-1">per week</div>
          </div>

          {/* Accuracy Trend Chart */}
          <div className="md:col-span-2 bg-white border-2 border-white shadow-[0_6px_0_rgba(0,0,0,0.1)] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#e0f7fa] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#00838F]" />
              </div>
              <span className="text-[#3f7d52] font-medium text-sm">Accuracy by Module</span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={metrics?.accuracyTrend.map((t, i) => ({ name: MODULE_NAMES[i], accuracy: t.accuracy }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(43,92,59,0.15)" />
                <XAxis dataKey="name" tick={{ fill: '#3f7d52', fontSize: 11 }} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#3f7d52', fontSize: 11 }} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '2px solid #d5e5d0', borderRadius: '8px' }}
                  labelStyle={{ color: '#2b5c3b' }}
                  itemStyle={{ color: '#3f7d52' }}
                />
                <Line type="monotone" dataKey="accuracy" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Learning Curve Line Chart */}
        <div className="bg-white border-2 border-white shadow-[0_6px_0_rgba(0,0,0,0.1)] rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#e3f2fd] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#1565C0]" />
            </div>
            <div>
              <h3 className="text-[#2b5c3b] font-bold text-lg">Learning Curve</h3>
              <p className="text-[#3f7d52] text-sm">Accuracy improvement per attempt</p>
            </div>
          </div>
          
          {moduleHistory.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatHistoryData(moduleHistory)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(43,92,59,0.15)" />
                  <XAxis dataKey="attempt" axisLine={false} tick={{fill: '#3f7d52', fontSize: 12}} />
                  <YAxis domain={[0, 100]} axisLine={false} tick={{fill: '#3f7d52', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{background: '#ffffff', border: '2px solid #d5e5d0', borderRadius: '8px', color: '#2b5c3b'}}
                  />
                  <Line type="monotone" connectNulls dataKey="module1" name="Module 1" stroke="#3B82F6" strokeWidth={2} dot={{r: 4}} />
                  <Line type="monotone" connectNulls dataKey="module2" name="Module 2" stroke="#EF4444" strokeWidth={2} dot={{r: 4}} />
                  <Line type="monotone" connectNulls dataKey="module3" name="Module 3" stroke="#F59E0B" strokeWidth={2} dot={{r: 4}} />
                  <Line type="monotone" connectNulls dataKey="module4" name="Module 4" stroke="#10B981" strokeWidth={2} dot={{r: 4}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-[#3f7d52]/50">
              No retry history yet.
            </div>
          )}
        </div>

        {/* Mastered vs Needs-Review Pie + Word Mastery List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Pie chart */}
          <div className="bg-white border-2 border-white shadow-[0_6px_0_rgba(0,0,0,0.1)] rounded-2xl p-5 flex flex-col items-center justify-center">
            <h3 className="text-[#3f7d52] font-medium text-sm mb-3">Word Status</h3>
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
                  <span className="text-xs text-[#3f7d52]">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Word Mastery List */}
          <div className="lg:col-span-2 bg-white border-2 border-white shadow-[0_6px_0_rgba(0,0,0,0.1)] rounded-2xl p-5">
            <h3 className="text-[#3f7d52] font-medium text-sm mb-3">Word List</h3>
            <ScrollArea className="h-52">
              {metrics?.wordMasteryList.length === 0 ? (
                <p className="text-[#5a7a63] text-sm text-center py-8">Word learning hasn't started yet.</p>
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
                          <span className="text-[#5a7a63] text-xs font-mono">{word.overallAccuracy}%</span>
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
        <div className="bg-white border-2 border-white shadow-[0_6px_0_rgba(0,0,0,0.1)] rounded-2xl p-5">
          <h3 className="text-[#3f7d52] font-medium text-sm mb-4">Download Reports</h3>
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
          <p className="text-[#5a7a63] text-xs mt-3">
            * PDF reports are available after completing each module.
          </p>
        </div>
        </>
        )}

        {/* Link Another Learner Modal */}
        <Modal open={showLinkModal} onOpenChange={setShowLinkModal}>
          <ModalContent className="max-w-md">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#e7f6e7] border-2 border-[#4CAF50] flex items-center justify-center text-[#2E7D32] mx-auto mb-3 shadow-inner">
                <UserPlus className="w-7 h-7" aria-hidden="true" />
              </div>
              <ModalTitle className="text-2xl">Link a New Learner</ModalTitle>
              <ModalDescription className="text-xs sm:text-sm mt-1">
                Enter your child's <strong>Student ID</strong> to add them to your dashboard.
              </ModalDescription>
            </div>

            <form onSubmit={handleLinkLearner} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label htmlFor="learner-identifier" className="text-xs font-semibold text-[#3f7d52] uppercase tracking-wider">
                  Student ID
                </label>
                <input
                  id="learner-identifier"
                  type="text"
                  placeholder="Enter Student ID..."
                  value={learnerIdentifier}
                  onChange={(e) => setLearnerIdentifier(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#f4f9f0] border-2 border-[#d5e5d0] text-[#2b5c3b] placeholder-[#7a9a83] text-sm outline-none focus:border-[#4CAF50] transition-all"
                  required
                />
              </div>

              {linkError && (
                <p role="alert" className="text-xs text-[#8f1d1d] bg-[#fdeaea] border-2 border-[#EF5350] rounded-lg p-2.5 text-center">
                  {linkError}
                </p>
              )}
              {linkSuccess && (
                <p role="status" className="text-xs text-[#1B5E20] bg-[#e7f6e7] border-2 border-[#4CAF50] rounded-lg p-2.5 text-center flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4 text-[#2E7D32]" />
                  <span>{linkSuccess}</span>
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border-2 border-[#d5e5d0] text-[#5a7a63] hover:bg-[#f4f9f0] text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLinking}
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-b from-pamana-green to-emerald-600 border-2 border-white text-white font-bold text-sm shadow-[0_6px_0_rgba(0,0,0,0.25)] hover:brightness-110 active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Link'}
                </button>
              </div>
            </form>
          </ModalContent>
        </Modal>
      </div>
    </AppShell>
  )
}
