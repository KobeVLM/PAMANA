export interface User {
  id: string
  name: string
  email: string
  role: 'LEARNER' | 'PARENT' | 'TEACHER'
  klaseId?: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, role: 'LEARNER' | 'PARENT' | 'TEACHER', joinCode?: string) => Promise<void>
  logout: () => void
}

export interface ModuleProgress {
  moduleNumber: number
  isUnlocked: boolean
  isComplete: boolean
  accuracy: number | null
}

export interface VocabularyWord {
  wordId: string
  word: string
  audioUrl: string
  imageUrl: string
  domain: 'self_body' | 'family_home'
}

export interface WordMasteryStatus {
  wordId: string
  word: string
  overallAccuracy: number
  hamonFailCount: number
  status: 'green' | 'yellow' | 'red' | 'grey'
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  learnerName: string
  currentModuleName: string
  modulesCompleted: number
}

export interface DashboardMetrics {
  accuracyTrend: { moduleNumber: number; accuracy: number }[]
  masteredCount: number
  needsReviewCount: number
  hamonPassRate: number
  avgSessionDuration: number
  trailCompletion: number
  wordMasteryList: WordMasteryStatus[]
}
