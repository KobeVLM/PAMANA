# Mastery Practice + Teacher/Leaderboard Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fully functional free-practice mode for the 4 Mastery tiles on the home page, and strip out all Teacher, Leaderboard, and Klase Mode UI from the frontend — keeping only Student (LEARNER) and Parent roles visible.

**Architecture:** The mastery practice pages are pure-client sessions — they fetch real game data from existing API endpoints but write no progress back to the server (Option A). Teacher role stays in the backend untouched; only the frontend visibility is removed. All four mastery types (syllable, word-matching, image-matching, sentence) get dedicated practice pages that reuse existing game component logic.

**Tech Stack:** React 18, TypeScript, React Router v7, Tailwind CSS 3 with PAMANA custom colors (`pamana-green`, `pamana-gold`, `from-green-950`), Vite 8, axios via `@/lib/api`

**Branch:** `feature/mastery-practice-remove-teacher`

**Spec:** `docs/superpowers/plans/2026-09-23-mastery-practice-remove-teacher.md` (this file)

## Global Constraints

- All UI colors must use existing PAMANA Tailwind tokens: `pamana-green` (#2D7D46), `pamana-gold` (#F59E0B), `green-950`, `green-900`, `emerald-900`
- Font: `font-heading` (Nunito) for headings; default sans for body
- All new routes are `LEARNER`-only via `ProtectedRoute allowedRoles={['LEARNER']}`
- No backend changes in this plan — all mastery practice is read-only client-side
- Do NOT delete klase/teacher page files — just remove their imports and routes from `App.tsx` and `AppShell.tsx`
- TypeScript strict mode — no `any` unless already used in sibling files
- Minimum touch target: `min-h-[44px] min-w-[44px]` on interactive game elements (existing `.game-tile` class)

---

## Task 1: Create the Git Branch & Verify Starting State

**Files:**
- No source changes — verification only

**Interfaces:**
- Produces: confirmed branch `feature/mastery-practice-remove-teacher` at HEAD

- [x] **Step 1: Confirm branch**

```bash
git branch --show-current
```
Expected: `feature/mastery-practice-remove-teacher`

- [x] **Step 2: Confirm frontend builds cleanly before any changes**

```bash
cd frontend && npm run build 2>&1 | tail -5
```
Expected: `✓ built in` with no TypeScript errors.

- [x] **Step 3: Commit baseline**

```bash
git add docs/superpowers/plans/2026-09-23-mastery-practice-remove-teacher.md
git commit -m "docs: add implementation plan for mastery practice + teacher removal"
```

---

## Task 2: Remove Teacher Role, Leaderboard & Klase from Frontend

Remove all Teacher/Leaderboard/Klase UI surface from the frontend. Backend is NOT touched.

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/components/ProtectedRoute.tsx`
- Modify: `frontend/src/components/layout/AppShell.tsx`
- Modify: `frontend/src/pages/auth/RegisterPage.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: `User.role` union becomes `'LEARNER' | 'PARENT'`; no routes for `/klase`, `/leaderboard`; sidebar shows only `Home` (LEARNER) and `Dashboard` (PARENT) and `Settings`

- [ ] **Step 1: Narrow the `User.role` type in `types/index.ts`**

Replace line 5 in `frontend/src/types/index.ts`:
```typescript
// BEFORE
role: 'LEARNER' | 'PARENT' | 'TEACHER'

// AFTER
role: 'LEARNER' | 'PARENT'
```

Also update `AuthContextType.register` signature on line 14 — change `'LEARNER' | 'PARENT' | 'TEACHER'` to `'LEARNER' | 'PARENT'`.

- [ ] **Step 2: Update `AuthContext.tsx` register signature**

In `frontend/src/contexts/AuthContext.tsx` line 45, change:
```typescript
// BEFORE
role: 'LEARNER' | 'PARENT' | 'TEACHER',

// AFTER
role: 'LEARNER' | 'PARENT',
```

- [ ] **Step 3: Update `ProtectedRoute.tsx` — remove TEACHER from roleHome logic**

In `frontend/src/components/ProtectedRoute.tsx` lines 6 and 36:
```typescript
// BEFORE (line 6)
allowedRoles?: ('LEARNER' | 'PARENT' | 'TEACHER')[]

// AFTER (line 6)
allowedRoles?: ('LEARNER' | 'PARENT')[]

// BEFORE (line 36)
const roleHome = user.role === 'PARENT' ? '/dashboard' : user.role === 'TEACHER' ? '/klase' : '/trail'

// AFTER (line 36)
const roleHome = user.role === 'PARENT' ? '/dashboard' : '/trail'
```

- [ ] **Step 4: Update `AppShell.tsx` — remove Klase Mode, Leaderboard; remove TEACHER from NavItem roles**

In `frontend/src/components/layout/AppShell.tsx`:

Remove imports for `Trophy` and `Users` from lucide-react (lines 8-9).

Replace the `NAV_ITEMS` array (lines 25–56) with:
```typescript
const NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    to: '/home',
    icon: <Map className="w-5 h-5" />,
    roles: ['LEARNER'],
  },
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: <BarChart2 className="w-5 h-5" />,
    roles: ['PARENT'],
  },
  {
    label: 'Settings',
    to: '/settings',
    icon: <Settings className="w-5 h-5" />,
    roles: ['LEARNER', 'PARENT'],
  },
]
```

Update the `NavItem` interface `roles` type (line 22):
```typescript
// BEFORE
roles: ('LEARNER' | 'PARENT' | 'TEACHER')[]

// AFTER
roles: ('LEARNER' | 'PARENT')[]
```

Update the `roleLabel` block (lines 79–83):
```typescript
// BEFORE
const roleLabel = user?.role === 'LEARNER'
  ? 'Mag-aaral'
  : user?.role === 'PARENT'
  ? 'Magulang'
  : 'Guro'

// AFTER
const roleLabel = user?.role === 'LEARNER' ? 'Mag-aaral' : 'Magulang'
```

- [ ] **Step 5: Update `RegisterPage.tsx` — remove Teacher button, 2-col grid**

In `frontend/src/pages/auth/RegisterPage.tsx`:

Change the role state type (line 17):
```typescript
// BEFORE
const [role, setRole] = useState<'LEARNER' | 'PARENT' | 'TEACHER'>('LEARNER')

// AFTER
const [role, setRole] = useState<'LEARNER' | 'PARENT'>('LEARNER')
```

Remove the joinCode state and its JSX (lines 18, 183–202) — teacher-class-code flow is no longer relevant for these two roles. *(Keep `joinCode` state removed since both remaining roles don't use it.)*

Actually, keep joinCode for now since Parent might link to a learner — but remove TEACHER from the role button grid. Replace lines 164–180:
```tsx
{/* Role Selection — 2 columns */}
<div className="space-y-1.5">
  <Label className="text-green-200 font-medium text-sm">Role</Label>
  <div className="grid grid-cols-2 gap-2">
    {(['LEARNER', 'PARENT'] as const).map((r) => (
      <button
        key={r}
        type="button"
        onClick={() => setRole(r)}
        className={`h-10 text-xs font-bold rounded-xl transition-all ${
          role === r
            ? 'bg-pamana-gold text-green-950 shadow-md scale-105'
            : 'bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        {r === 'LEARNER' ? 'Learner' : 'Parent'}
      </button>
    ))}
  </div>
</div>
```

Remove joinCode JSX block (lines 182–202) — Class Code field was for teacher-assigned classes, which is removed. Remove `joinCode` state (line 18) and its usage in `handleSubmit` (line 52 — change `joinCode || undefined` to `undefined`).

Remove `Info` from the lucide-react import (line 7).

Update the `register` call redirect in `useEffect` (line 25):
```typescript
// BEFORE
const dest = user.role === 'PARENT' ? '/dashboard' : user.role === 'TEACHER' ? '/klase' : '/trail'

// AFTER
const dest = user.role === 'PARENT' ? '/dashboard' : '/trail'
```

- [ ] **Step 6: Update `App.tsx` — remove Teacher/Klase/Leaderboard routes**

In `frontend/src/App.tsx`:

Remove imports (lines 24–25):
```typescript
// REMOVE these two lines:
import { KlaseLeaderboardPage } from '@/pages/klase/KlaseLeaderboardPage'
import { TeacherKlasePage } from '@/pages/klase/TeacherKlasePage'
// REMOVE this line:
import { TeacherDashboardPage } from '@/pages/dashboard/TeacherDashboardPage'
```

Remove the `/klase` route block (lines 127–134).
Remove the `/leaderboard` route block (lines 135–142).

Update `/settings` route allowed roles (line 148):
```tsx
// BEFORE
<ProtectedRoute allowedRoles={['LEARNER', 'PARENT', 'TEACHER']}>

// AFTER
<ProtectedRoute allowedRoles={['LEARNER', 'PARENT']}>
```

Update `/dashboard` route allowed roles (line 158):
```tsx
// BEFORE
<ProtectedRoute allowedRoles={['PARENT', 'TEACHER']}>

// AFTER
<ProtectedRoute allowedRoles={['PARENT']}>
```

Replace `RoleBasedDashboardRoute` (lines 174–180):
```tsx
function RoleBasedDashboardRoute() {
  return <ParentDashboardPage />
}
```

Delete `RoleBasedKlaseRoute` function entirely (lines 182–188).

- [ ] **Step 7: Verify TypeScript compiles with no errors**

```bash
cd frontend && npx tsc --noEmit
```
Expected: zero errors

- [ ] **Step 8: Commit**

```bash
git add frontend/src/types/index.ts \
        frontend/src/contexts/AuthContext.tsx \
        frontend/src/components/ProtectedRoute.tsx \
        frontend/src/components/layout/AppShell.tsx \
        frontend/src/pages/auth/RegisterPage.tsx \
        frontend/src/App.tsx
git commit -m "feat: remove teacher role, leaderboard, and klase mode from frontend UI"
```

---

## Task 3: Wire Mastery Tiles on HomePage to Routes

Before building the practice pages, connect the tiles to their routes so navigation works end-to-end.

**Files:**
- Modify: `frontend/src/pages/homepage/HomePage.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: clicking each mastery tile navigates to `/mastery/1`, `/mastery/2`, `/mastery/3`, `/mastery/4`

- [ ] **Step 1: Update `masteryItems` to include routes and update `onClick` handlers**

In `frontend/src/pages/homepage/HomePage.tsx`, replace the `masteryItems` array and update the tile `onClick`:

```typescript
const masteryItems = [
  { id: 1, title: 'Syllable Matching',  route: '/mastery/1', bgImage: '/images/Farm.png'    },
  { id: 2, title: 'Word Matching',      route: '/mastery/2', bgImage: '/images/Garden.png'  },
  { id: 3, title: 'Image Matching',     route: '/mastery/3', bgImage: '/images/Kitchen.png' },
  { id: 4, title: 'Sentence Creation',  route: '/mastery/4', bgImage: '/images/House.png'   },
]
```

Remove `completed` field — practice mode has no locked/unlocked state (all tiles always clickable).

Update tile `onClick` (line 85):
```tsx
// BEFORE
onClick={() => console.log(`Open ${item.title}`)}

// AFTER
onClick={() => navigate(item.route)}
```

Remove all `item.completed` conditional rendering — simplify the tile content to always use the active style:
```tsx
{masteryItems.map((item) => (
  <div
    key={item.id}
    className="relative overflow-hidden p-5 rounded-xl border border-white/10 hover:border-pamana-green/60 hover:shadow-xl hover:shadow-pamana-green/20 transition-all duration-300 cursor-pointer text-center flex flex-col items-center justify-center group"
    onClick={() => navigate(item.route)}
  >
    {/* Background image */}
    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${item.bgImage}')` }} />
    {/* Overlay */}
    <div className="absolute inset-0 bg-green-950/60 group-hover:bg-green-950/40 transition-colors duration-300" />

    {/* Content */}
    <div className="relative z-10 flex flex-col items-center justify-center h-full">
      <div className="w-14 h-14 rounded-full bg-white/10 group-hover:bg-pamana-green/30 flex items-center justify-center text-xl font-bold text-green-200/80 group-hover:text-white transition-all duration-300">
        {item.id}
      </div>
      <p className="text-sm font-semibold mt-2 text-green-200/80 group-hover:text-white transition-all duration-300">
        {item.title}
      </p>
    </div>
  </div>
))}
```

Remove `Star`, `Award` imports that are no longer needed; keep `Map`, `BookOpen`, `Trophy`, `ChevronRight`.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/homepage/HomePage.tsx
git commit -m "feat: wire mastery tiles to /mastery/:id routes"
```

---

## Task 4: Build Syllable Matching Practice Page (`/mastery/1`)

**Files:**
- Create: `frontend/src/pages/mastery/SyllablePracticePage.tsx`

**Interfaces:**
- Consumes: `GET /api/syllables/set?subLevel=<subLevel>&setId=<setId>&userId=<userId>` (existing) — read-only, no POST
- Consumes: `useAuth()` for `user.id`; `AppShell`, `NPCDialogue`, `AudioPlayer`, `OptionGrid` game components
- Produces: `export const SyllablePracticePage: React.FC` — navigable via `/mastery/1`

The practice page cycles through all 4 sub-levels (pagsama → pakinggan → kilalanin → rhyming), set 1 for each. On answering, it shows correct/incorrect feedback, then advances. No progress POST. When all 4 sub-levels are done, shows a completion card with a "Play Again" button.

- [ ] **Step 1: Create `frontend/src/pages/mastery/SyllablePracticePage.tsx`**

```tsx
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { OptionGrid } from '@/components/game/OptionGrid'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react'

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

const SUB_LEVELS: SubLevel[] = ['pagsama', 'pakinggan', 'kilalanin', 'rhyming']

const SUB_LEVEL_LABELS: Record<SubLevel, string> = {
  pagsama:   '1. Pagsama ng Tunog',
  pakinggan: '2. Pakinggan',
  kilalanin: '3. Kilalanin',
  rhyming:   '4. Tumalinghaga',
}

const NPC_LINES: Record<SubLevel, string> = {
  pagsama:   'Pakinggan at pagsamahin ang mga tunog! Alin ang resulta?',
  pakinggan: 'Pakinggan nang mabuti! Alin ang pantig na narinig mo?',
  kilalanin: 'Kilalanin ang pantig na nagsisimula sa salitang ito!',
  rhyming:   'Alin sa mga salitang ito ang magkatunog sa narinig?',
}

export const SyllablePracticePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [subLevelIndex, setSubLevelIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState<SyllableSet | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [correctId, setCorrectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const [score, setScore] = useState(0)

  const currentSubLevel = SUB_LEVELS[subLevelIndex]

  const loadSet = useCallback(async (subLevel: SubLevel) => {
    if (!user) return
    setIsLoading(true)
    setSelectedId(null)
    setCorrectId(null)
    try {
      const { data } = await api.get<SyllableSet>('/syllables/set', {
        params: { subLevel, setId: 1, userId: user.id },
      })
      setCurrentSet(data)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadSet(currentSubLevel)
  }, [currentSubLevel, loadSet])

  const handleAnswer = (optionId: string) => {
    if (selectedId || !currentSet) return
    setSelectedId(optionId)
    const isCorrect = optionId === currentSet.targetSyllable ||
      currentSet.options.find(o => o.id === optionId)?.label === currentSet.targetSyllable
    const correctOpt = currentSet.options.find(
      o => o.label === currentSet.targetSyllable || o.id === currentSet.targetSyllable
    )
    setCorrectId(correctOpt?.id ?? currentSet.targetSyllable)
    if (isCorrect) setScore(s => s + 1)

    // Auto-advance after 1.5 s
    setTimeout(() => {
      const next = subLevelIndex + 1
      if (next >= SUB_LEVELS.length) {
        setIsComplete(true)
      } else {
        setSubLevelIndex(next)
      }
    }, 1500)
  }

  const handlePlayAgain = () => {
    setSubLevelIndex(0)
    setScore(0)
    setIsComplete(false)
  }

  if (isComplete) {
    return (
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 flex items-center justify-center p-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10 flex flex-col items-center gap-6 max-w-sm w-full text-center">
            <CheckCircle2 className="w-16 h-16 text-pamana-green" />
            <h2 className="text-3xl font-heading font-bold text-white">Magaling!</h2>
            <p className="text-green-200">
              Nakakuha ka ng <span className="text-pamana-gold font-bold">{score}</span> sa {SUB_LEVELS.length} tanong.
            </p>
            <button
              onClick={handlePlayAgain}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pamana-green to-emerald-500 text-white font-bold rounded-xl hover:opacity-90 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Maglaro Ulit
            </button>
            <button
              onClick={() => navigate('/home')}
              className="text-green-300 hover:text-white text-sm transition-colors"
            >
              Bumalik sa Home
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/home')}
            className="p-2 rounded-xl text-green-300 hover:bg-white/10 hover:text-white transition-all"
            aria-label="Bumalik"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-green-400 text-xs font-medium uppercase tracking-wider">Mastery Practice</p>
            <h1 className="text-white font-heading font-bold text-xl">Syllable Matching</h1>
          </div>
          <div className="ml-auto text-right">
            <p className="text-green-400 text-xs">Sub-level</p>
            <p className="text-pamana-gold font-bold">{subLevelIndex + 1} / {SUB_LEVELS.length}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/10 rounded-full h-2 mb-8">
          <div
            className="bg-gradient-to-r from-pamana-green to-emerald-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((subLevelIndex) / SUB_LEVELS.length) * 100}%` }}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-pamana-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : currentSet ? (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Sub-level label */}
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-pamana-green/20 border border-pamana-green/40 rounded-full text-pamana-green text-sm font-semibold">
                {SUB_LEVEL_LABELS[currentSubLevel]}
              </span>
            </div>

            {/* NPC */}
            <NPCDialogue message={NPC_LINES[currentSubLevel]} />

            {/* Audio player */}
            {currentSet.audioUrl && <AudioPlayer audioUrl={currentSet.audioUrl} />}

            {/* Pagsama: show C + V */}
            {currentSubLevel === 'pagsama' && currentSet.consonant && currentSet.vowel && (
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-5xl font-heading font-bold text-white bg-white/10 rounded-2xl px-6 py-4">
                  {currentSet.consonant}
                </div>
                <span className="text-2xl text-green-300">+</span>
                <div className="text-5xl font-heading font-bold text-white bg-white/10 rounded-2xl px-6 py-4">
                  {currentSet.vowel}
                </div>
              </div>
            )}

            {/* Options */}
            <OptionGrid
              options={currentSet.options}
              selectedId={selectedId}
              correctId={correctId}
              onSelect={handleAnswer}
              disabled={!!selectedId}
            />
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/mastery/SyllablePracticePage.tsx
git commit -m "feat: add SyllablePracticePage for mastery practice mode"
```

---

## Task 5: Build Word Matching Practice Page (`/mastery/2`)

**Files:**
- Create: `frontend/src/pages/mastery/WordPracticePage.tsx`

**Interfaces:**
- Consumes: `GET /api/vocabulary/next` (existing, read-only) — fetches next vocabulary word for user
- Consumes: `GET /api/vocabulary/match/:wordId?step=kilalanin` (existing) — gets word-label options for matching
- Consumes: `GET /api/vocabulary/match/:wordId?step=basahin` (existing) — gets text options
- Produces: `export const WordPracticePage: React.FC`

Cycles through words from `/api/vocabulary/next` (up to 5 words), at step `basahin` (text-based word matching). Shows word audio + text options. No POST. Completion card after 5 words.

- [ ] **Step 1: Create `frontend/src/pages/mastery/WordPracticePage.tsx`**

```tsx
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { OptionGrid } from '@/components/game/OptionGrid'
import { useAudio } from '@/contexts/AudioContext'
import api from '@/lib/api'
import { ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react'

interface VocabWord {
  wordId: string
  word: string
  audioUrl: string
  imageUrl: string
  domain: string
}

interface MatchOption {
  id: string
  label: string
}

interface MatchOptionsResponse {
  options: MatchOption[]
  correctId: string
}

const MAX_WORDS = 5

export const WordPracticePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { playAudio } = useAudio()

  const [words, setWords] = useState<VocabWord[]>([])
  const [wordIndex, setWordIndex] = useState(0)
  const [options, setOptions] = useState<MatchOption[]>([])
  const [correctId, setCorrectId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const [score, setScore] = useState(0)

  // Fetch up to MAX_WORDS vocabulary words
  const loadWords = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    const collected: VocabWord[] = []
    try {
      // Fetch multiple words by calling /next repeatedly up to MAX_WORDS
      // Note: /next returns the current "next" word; we gather a fixed set for the session
      const { data } = await api.get<VocabWord>('/vocabulary/next')
      if (data) collected.push(data)
      // For a practice session, we use all seeded vocabulary items via a single fetch
      // Fall back to just the one word if that's all available
    } catch {
      // silently fail — show what we have
    }
    // Use the backend's vocabulary list endpoint to get all words
    try {
      const { data: allWords } = await api.get<VocabWord[]>('/vocabulary')
      const selection = allWords.slice(0, MAX_WORDS)
      setWords(selection)
    } catch {
      // Fallback: use the single word fetched above
      setWords(collected)
    }
    setIsLoading(false)
  }, [user])

  useEffect(() => {
    loadWords()
  }, [loadWords])

  const loadOptions = useCallback(async (word: VocabWord) => {
    try {
      const { data } = await api.get<MatchOptionsResponse>(`/vocabulary/match/${word.wordId}`, {
        params: { step: 'basahin' },
      })
      setOptions(data.options)
      setCorrectId(data.correctId)
    } catch {
      setOptions([])
      setCorrectId(null)
    }
  }, [])

  useEffect(() => {
    const word = words[wordIndex]
    if (word) {
      setSelectedId(null)
      setCorrectId(null)
      loadOptions(word)
    }
  }, [words, wordIndex, loadOptions])

  const currentWord = words[wordIndex]

  const handleAnswer = (optId: string) => {
    if (selectedId || !correctId) return
    setSelectedId(optId)
    if (optId === correctId) setScore(s => s + 1)

    setTimeout(() => {
      const next = wordIndex + 1
      if (next >= words.length || next >= MAX_WORDS) {
        setIsComplete(true)
      } else {
        setWordIndex(next)
      }
    }, 1500)
  }

  const handlePlayAgain = () => {
    setWordIndex(0)
    setScore(0)
    setIsComplete(false)
    setSelectedId(null)
  }

  if (isComplete) {
    return (
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 flex items-center justify-center p-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10 flex flex-col items-center gap-6 max-w-sm w-full text-center">
            <CheckCircle2 className="w-16 h-16 text-pamana-green" />
            <h2 className="text-3xl font-heading font-bold text-white">Magaling!</h2>
            <p className="text-green-200">
              Nakakuha ka ng <span className="text-pamana-gold font-bold">{score}</span> sa {words.length} salita.
            </p>
            <button
              onClick={handlePlayAgain}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pamana-green to-emerald-500 text-white font-bold rounded-xl hover:opacity-90 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Maglaro Ulit
            </button>
            <button
              onClick={() => navigate('/home')}
              className="text-green-300 hover:text-white text-sm transition-colors"
            >
              Bumalik sa Home
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 p-4 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/home')}
            className="p-2 rounded-xl text-green-300 hover:bg-white/10 hover:text-white transition-all"
            aria-label="Bumalik"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-green-400 text-xs font-medium uppercase tracking-wider">Mastery Practice</p>
            <h1 className="text-white font-heading font-bold text-xl">Word Matching</h1>
          </div>
          <div className="ml-auto text-right">
            <p className="text-green-400 text-xs">Salita</p>
            <p className="text-pamana-gold font-bold">{wordIndex + 1} / {words.length || MAX_WORDS}</p>
          </div>
        </div>

        <div className="w-full bg-white/10 rounded-full h-2 mb-8">
          <div
            className="bg-gradient-to-r from-pamana-green to-emerald-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(wordIndex / (words.length || MAX_WORDS)) * 100}%` }}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-pamana-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : currentWord ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <NPCDialogue message="Basahin! Alin ang tamang salitang nakasulat?" />

            {currentWord.audioUrl && (
              <AudioPlayer audioUrl={currentWord.audioUrl} />
            )}

            {/* Word display */}
            <div className="flex justify-center">
              <div className="bg-white/10 border border-white/20 rounded-2xl px-8 py-6">
                <p className="text-4xl font-heading font-bold text-white">{currentWord.word}</p>
              </div>
            </div>

            <OptionGrid
              options={options}
              selectedId={selectedId}
              correctId={correctId}
              onSelect={handleAnswer}
              disabled={!!selectedId}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-green-300">Walang available na salita.</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/mastery/WordPracticePage.tsx
git commit -m "feat: add WordPracticePage for mastery practice mode"
```

---

## Task 6: Build Image Matching Practice Page (`/mastery/3`)

**Files:**
- Create: `frontend/src/pages/mastery/ImagePracticePage.tsx`

**Interfaces:**
- Consumes: `GET /api/vocabulary/next` + `GET /api/vocabulary/match/:wordId?step=kilalanin` (existing, read-only) — kilalanin step returns image-URL options
- Produces: `export const ImagePracticePage: React.FC`

Shows a word's audio, then presents image options. Student picks the correct image. Uses `step=kilalanin` which returns `{ options: [{ id, imageUrl }], correctId }`.

- [ ] **Step 1: Create `frontend/src/pages/mastery/ImagePracticePage.tsx`**

```tsx
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react'

interface VocabWord {
  wordId: string
  word: string
  audioUrl: string
  imageUrl: string
  domain: string
}

interface ImageOption {
  id: string
  imageUrl: string
}

interface MatchOptionsResponse {
  options: ImageOption[]
  correctId: string
}

const MAX_WORDS = 5

export const ImagePracticePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [words, setWords] = useState<VocabWord[]>([])
  const [wordIndex, setWordIndex] = useState(0)
  const [options, setOptions] = useState<ImageOption[]>([])
  const [correctId, setCorrectId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const [score, setScore] = useState(0)

  const loadWords = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const { data } = await api.get<VocabWord[]>('/vocabulary')
      setWords(data.slice(0, MAX_WORDS))
    } catch {
      setWords([])
    }
    setIsLoading(false)
  }, [user])

  useEffect(() => { loadWords() }, [loadWords])

  const loadOptions = useCallback(async (word: VocabWord) => {
    setSelectedId(null)
    setCorrectId(null)
    setOptions([])
    try {
      const { data } = await api.get<MatchOptionsResponse>(`/vocabulary/match/${word.wordId}`, {
        params: { step: 'kilalanin' },
      })
      setOptions(data.options)
      setCorrectId(data.correctId)
    } catch {
      setOptions([])
    }
  }, [])

  useEffect(() => {
    const word = words[wordIndex]
    if (word) loadOptions(word)
  }, [words, wordIndex, loadOptions])

  const currentWord = words[wordIndex]

  const handleAnswer = (optId: string) => {
    if (selectedId || !correctId) return
    setSelectedId(optId)
    if (optId === correctId) setScore(s => s + 1)
    setTimeout(() => {
      const next = wordIndex + 1
      if (next >= words.length) setIsComplete(true)
      else setWordIndex(next)
    }, 1500)
  }

  const handlePlayAgain = () => {
    setWordIndex(0)
    setScore(0)
    setIsComplete(false)
    setSelectedId(null)
  }

  if (isComplete) {
    return (
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 flex items-center justify-center p-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10 flex flex-col items-center gap-6 max-w-sm w-full text-center">
            <CheckCircle2 className="w-16 h-16 text-pamana-green" />
            <h2 className="text-3xl font-heading font-bold text-white">Magaling!</h2>
            <p className="text-green-200">
              Nakakuha ka ng <span className="text-pamana-gold font-bold">{score}</span> sa {words.length} larawan.
            </p>
            <button onClick={handlePlayAgain} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pamana-green to-emerald-500 text-white font-bold rounded-xl hover:opacity-90 transition-all">
              <RefreshCw className="w-4 h-4" /> Maglaro Ulit
            </button>
            <button onClick={() => navigate('/home')} className="text-green-300 hover:text-white text-sm transition-colors">
              Bumalik sa Home
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 p-4 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/home')} className="p-2 rounded-xl text-green-300 hover:bg-white/10 hover:text-white transition-all" aria-label="Bumalik">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-green-400 text-xs font-medium uppercase tracking-wider">Mastery Practice</p>
            <h1 className="text-white font-heading font-bold text-xl">Image Matching</h1>
          </div>
          <div className="ml-auto text-right">
            <p className="text-green-400 text-xs">Salita</p>
            <p className="text-pamana-gold font-bold">{wordIndex + 1} / {words.length || MAX_WORDS}</p>
          </div>
        </div>

        <div className="w-full bg-white/10 rounded-full h-2 mb-8">
          <div className="bg-gradient-to-r from-pamana-green to-emerald-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(wordIndex / (words.length || MAX_WORDS)) * 100}%` }} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-pamana-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : currentWord ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <NPCDialogue message="Kilalanin! Alin ang larawan ng narinig na salita?" />

            {currentWord.audioUrl && <AudioPlayer audioUrl={currentWord.audioUrl} />}

            {/* Image options grid */}
            <div className="grid grid-cols-2 gap-4">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleAnswer(opt.id)}
                  disabled={!!selectedId}
                  className={cn(
                    'relative overflow-hidden rounded-2xl border-2 min-h-[120px] transition-all duration-200 game-tile',
                    selectedId === null
                      ? 'border-white/20 hover:border-pamana-green/60 hover:shadow-lg hover:shadow-pamana-green/20'
                      : opt.id === correctId
                      ? 'border-pamana-green shadow-lg shadow-pamana-green/30'
                      : opt.id === selectedId
                      ? 'border-red-500 shadow-lg shadow-red-500/30'
                      : 'border-white/10 opacity-50'
                  )}
                >
                  <img
                    src={opt.imageUrl}
                    alt=""
                    className="w-full h-full object-cover rounded-2xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  {selectedId && opt.id === correctId && (
                    <div className="absolute inset-0 bg-pamana-green/20 flex items-center justify-center rounded-2xl">
                      <CheckCircle2 className="w-8 h-8 text-pamana-green" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-green-300">Walang available na salita.</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/mastery/ImagePracticePage.tsx
git commit -m "feat: add ImagePracticePage for mastery practice mode"
```

---

## Task 7: Build Sentence Creation Practice Page (`/mastery/4`)

**Files:**
- Create: `frontend/src/pages/mastery/SentencePracticePage.tsx`

**Interfaces:**
- Consumes: `GET /api/sentences/task?tier=1` (existing, read-only) — returns `{ taskId, tier, scrambledWords, correctOrder, audioUrl, sentence }`
- Consumes: `DndProvider`, `useDrag`, `useDrop` from `react-dnd` + `HTML5Backend` (already in package.json)
- Produces: `export const SentencePracticePage: React.FC`

Fetches a tier-1 sentence task. Student drags words into order. On submit, checks against `correctOrder` client-side (no POST). Shows result inline, then "Next" button fetches a new task.

- [ ] **Step 1: Create `frontend/src/pages/mastery/SentencePracticePage.tsx`**

```tsx
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { NPCDialogue } from '@/components/game/NPCDialogue'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { useAudio } from '@/contexts/AudioContext'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { ArrowLeft, RefreshCw, CheckCircle2, XCircle, GripVertical } from 'lucide-react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

interface SentenceTask {
  taskId: string
  tier: 1 | 2
  scrambledWords: string[]
  correctOrder: string[]
  audioUrl: string
  sentence: string
}

interface DraggableWordProps {
  word: string
  index: number
  onMove: (from: number, to: number) => void
}

const DraggableWord: React.FC<DraggableWordProps> = ({ word, index, onMove }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'PRACTICE_WORD',
    item: { index },
    collect: (m) => ({ isDragging: m.isDragging() }),
  }))

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'PRACTICE_WORD',
    drop: (item: { index: number }) => onMove(item.index, index),
    collect: (m) => ({ isOver: m.isOver() }),
  }))

  return (
    <div
      ref={(node) => { drag(node); drop(node) }}
      className={cn(
        'flex items-center gap-2 px-4 py-3 rounded-xl border-2 cursor-grab active:cursor-grabbing',
        'min-h-[52px] font-heading font-bold text-base transition-all duration-200 select-none',
        isDragging
          ? 'opacity-40 border-pamana-green/50 bg-pamana-green/10'
          : isOver
          ? 'border-pamana-gold bg-pamana-gold/10 scale-105'
          : 'border-white/20 bg-white/5 text-white hover:border-pamana-green/50 hover:bg-pamana-green/10'
      )}
    >
      <GripVertical className="w-4 h-4 text-white/40 flex-shrink-0" />
      <span>{word}</span>
    </div>
  )
}

const MAX_ROUNDS = 3

export const SentencePracticePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { playAudio } = useAudio()

  const [task, setTask] = useState<SentenceTask | null>(null)
  const [arranged, setArranged] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const loadTask = useCallback(async () => {
    setIsLoading(true)
    setSubmitted(false)
    setIsCorrect(null)
    try {
      const { data } = await api.get<SentenceTask>('/sentences/task', { params: { tier: 1 } })
      if (data) {
        setTask(data)
        setArranged([...data.scrambledWords])
      }
    } catch {
      setTask(null)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { loadTask() }, [loadTask])

  const moveWord = useCallback((from: number, to: number) => {
    setArranged(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }, [])

  const handleSubmit = () => {
    if (!task || submitted) return
    const correct = arranged.join(' ') === task.correctOrder.join(' ')
    setIsCorrect(correct)
    setSubmitted(true)
    if (correct) setScore(s => s + 1)
  }

  const handleNext = () => {
    if (round >= MAX_ROUNDS) {
      setIsComplete(true)
    } else {
      setRound(r => r + 1)
      loadTask()
    }
  }

  const handlePlayAgain = () => {
    setRound(1)
    setScore(0)
    setIsComplete(false)
    loadTask()
  }

  if (isComplete) {
    return (
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 flex items-center justify-center p-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10 flex flex-col items-center gap-6 max-w-sm w-full text-center">
            <CheckCircle2 className="w-16 h-16 text-pamana-green" />
            <h2 className="text-3xl font-heading font-bold text-white">Magaling!</h2>
            <p className="text-green-200">
              Nakakuha ka ng <span className="text-pamana-gold font-bold">{score}</span> sa {MAX_ROUNDS} pangungusap.
            </p>
            <button onClick={handlePlayAgain} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pamana-green to-emerald-500 text-white font-bold rounded-xl hover:opacity-90 transition-all">
              <RefreshCw className="w-4 h-4" /> Maglaro Ulit
            </button>
            <button onClick={() => navigate('/home')} className="text-green-300 hover:text-white text-sm transition-colors">
              Bumalik sa Home
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <DndProvider backend={HTML5Backend}>
        <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 p-4 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate('/home')} className="p-2 rounded-xl text-green-300 hover:bg-white/10 hover:text-white transition-all" aria-label="Bumalik">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-green-400 text-xs font-medium uppercase tracking-wider">Mastery Practice</p>
              <h1 className="text-white font-heading font-bold text-xl">Sentence Creation</h1>
            </div>
            <div className="ml-auto text-right">
              <p className="text-green-400 text-xs">Pangungusap</p>
              <p className="text-pamana-gold font-bold">{round} / {MAX_ROUNDS}</p>
            </div>
          </div>

          <div className="w-full bg-white/10 rounded-full h-2 mb-8">
            <div className="bg-gradient-to-r from-pamana-green to-emerald-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((round - 1) / MAX_ROUNDS) * 100}%` }} />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-10 h-10 border-4 border-pamana-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : task ? (
            <div className="max-w-2xl mx-auto space-y-6">
              <NPCDialogue message="Ayusin ang mga salita upang bumuo ng tamang pangungusap!" />

              {task.audioUrl && <AudioPlayer audioUrl={task.audioUrl} />}

              {/* Draggable word tiles */}
              <div className="space-y-2">
                <p className="text-green-400 text-sm font-medium">I-drag at ayusin ang mga salita:</p>
                <div className="flex flex-wrap gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl min-h-[80px]">
                  {arranged.map((word, i) => (
                    <DraggableWord key={`${word}-${i}`} word={word} index={i} onMove={moveWord} />
                  ))}
                </div>
              </div>

              {/* Feedback */}
              {submitted && (
                <div className={cn(
                  'flex items-center gap-3 p-4 rounded-2xl border',
                  isCorrect
                    ? 'bg-pamana-green/10 border-pamana-green/40 text-pamana-green'
                    : 'bg-red-500/10 border-red-500/40 text-red-400'
                )}>
                  {isCorrect
                    ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    : <XCircle className="w-5 h-5 flex-shrink-0" />}
                  <div>
                    <p className="font-bold">{isCorrect ? 'Tama!' : 'Mali.'}</p>
                    {!isCorrect && (
                      <p className="text-sm text-white/70 mt-0.5">
                        Tamang sagot: <span className="font-semibold text-white">{task.correctOrder.join(' ')}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {!submitted ? (
                  <button
                    onClick={handleSubmit}
                    className="flex-1 py-3 bg-gradient-to-r from-pamana-green to-emerald-500 text-white font-bold rounded-xl hover:opacity-90 transition-all"
                  >
                    Isumite
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex-1 py-3 bg-gradient-to-r from-pamana-gold to-amber-500 text-white font-bold rounded-xl hover:opacity-90 transition-all"
                  >
                    {round >= MAX_ROUNDS ? 'Tapusin' : 'Susunod →'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-green-300">Walang available na gawain.</p>
            </div>
          )}
        </div>
      </DndProvider>
    </AppShell>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/mastery/SentencePracticePage.tsx
git commit -m "feat: add SentencePracticePage for mastery practice mode"
```

---

## Task 8: Register Mastery Routes in `App.tsx`

**Files:**
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `SyllablePracticePage`, `WordPracticePage`, `ImagePracticePage`, `SentencePracticePage` (all from Task 4–7)
- Produces: `/mastery/1–4` routes accessible to LEARNER

- [ ] **Step 1: Add lazy imports for mastery pages in `App.tsx`**

After the existing lazy imports (around line 40), add:
```tsx
const SyllablePracticePage = React.lazy(() =>
  import('@/pages/mastery/SyllablePracticePage').then(m => ({ default: m.SyllablePracticePage }))
)
const WordPracticePage = React.lazy(() =>
  import('@/pages/mastery/WordPracticePage').then(m => ({ default: m.WordPracticePage }))
)
const ImagePracticePage = React.lazy(() =>
  import('@/pages/mastery/ImagePracticePage').then(m => ({ default: m.ImagePracticePage }))
)
const SentencePracticePage = React.lazy(() =>
  import('@/pages/mastery/SentencePracticePage').then(m => ({ default: m.SentencePracticePage }))
)
```

- [ ] **Step 2: Add mastery routes to the `<Routes>` block, after the `/modules/:moduleNumber/hamon` route**

```tsx
{/* Mastery Practice Routes */}
<Route
  path="/mastery/1"
  element={
    <ProtectedRoute allowedRoles={['LEARNER']}>
      <SyllablePracticePage />
    </ProtectedRoute>
  }
/>
<Route
  path="/mastery/2"
  element={
    <ProtectedRoute allowedRoles={['LEARNER']}>
      <WordPracticePage />
    </ProtectedRoute>
  }
/>
<Route
  path="/mastery/3"
  element={
    <ProtectedRoute allowedRoles={['LEARNER']}>
      <ImagePracticePage />
    </ProtectedRoute>
  }
/>
<Route
  path="/mastery/4"
  element={
    <ProtectedRoute allowedRoles={['LEARNER']}>
      <SentencePracticePage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: register /mastery/1-4 routes in App.tsx"
```

---

## Task 9: Final Verification & Build

**Files:**
- No source changes — verification only

- [ ] **Step 1: TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```
Expected: zero errors

- [ ] **Step 2: Production build**

```bash
cd frontend && npm run build 2>&1 | tail -10
```
Expected: `✓ built in` with no errors

- [ ] **Step 3: Smoke-test checklist (manual)**

Start `npm run dev` and verify:
1. Navigate to `/home` as a LEARNER — sidebar shows only **Home** and **Settings**. No Leaderboard item.
2. Click each Mastery tile — navigates to `/mastery/1`, `/mastery/2`, `/mastery/3`, `/mastery/4`
3. Each practice page loads, shows questions, gives feedback, and shows completion card.
4. "Maglaro Ulit" resets the session. "Bumalik sa Home" navigates back.
5. Register page shows only **Learner** and **Parent** role buttons (2-col grid, no Teacher).

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete mastery practice feature and teacher/leaderboard removal"
```

---

## Verification Plan

### Automated
```bash
cd frontend && npx tsc --noEmit   # zero TypeScript errors
cd frontend && npm run build      # clean production build
```

### Manual Verification
- Register as LEARNER: only 2 role buttons (Learner, Parent)
- Login as LEARNER: sidebar has no Leaderboard or Klase Mode
- Home page Mastery tiles: all 4 navigate to correct routes
- Each `/mastery/N` page: loads game data, feedback works, Play Again resets
- Login as PARENT: sidebar shows Dashboard only (no Home tile)
- No 404s on any practiced routes
