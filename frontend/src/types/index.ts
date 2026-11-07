export interface User {
  id: string
  name: string
  username: string
  gender?: 'Lalaki' | 'Babae'
  email?: string | null
  role: 'LEARNER' | 'PARENT'
}

export interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  register: {
    (
      username: string,
      password: string,
      role: 'LEARNER' | 'PARENT',
      name?: string,
      gender?: 'Lalaki' | 'Babae'
    ): Promise<void>
    (
      name: string,
      email: string,
      password: string,
      role: 'LEARNER' | 'PARENT'
    ): Promise<void>
  }
  updateProfile: (name: string, gender?: 'Lalaki' | 'Babae') => Promise<User>
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
  status: 'green' | 'yellow' | 'red' | 'grey'
}

export interface DashboardMetrics {
  accuracyTrend: { moduleNumber: number; accuracy: number }[]
  masteredCount: number
  needsReviewCount: number
  avgSessionDuration: number
  trailCompletion: number
  wordMasteryList: WordMasteryStatus[]
}
