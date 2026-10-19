# Module Stage & Tray Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Rebuild all module + mastery practice screens into a Stage & Tray layout with a compact sticky HUD, zero feedback layout-shift, a live TrailMap-consistent star meter, tap-to-fill `gamitin`, a sentence canvas for Module 4, and a two-column split on large screens.

**Architecture:** New shared practice components (`StepDots`, `StarMeter`, `FeedbackSlot`, `PromptStage`, `PracticeStage`) sit on top of the existing `PracticePageLayout`/`PracticeHeader` (refactored into a compact HUD). Medal thresholds move into `lib/medals.ts` shared by `TrailMapPage` and `StarMeter`. Modules 1–4 and mastery pages 1–4 all compose: HUD → PracticeStage(stage: NPC + PromptStage + FeedbackSlot, tray: answers).

**Tech Stack:** React 19, TypeScript, Tailwind CSS 3.4, framer-motion, dnd-kit, Vitest + RTL.

---

## Global Constraints
- Working directory: `frontend/`
- No new npm dependencies.
- `npx tsc -b`, `npm run lint`, `npm test`, `npm run build` must all pass (52 existing tests stay green).
- Bilingual rule: Filipino chrome first, English partner only on instructions/progress/status text.
- Medal thresholds must match the Trail Map: gold ≥ 95, silver ≥ 85, else bronze.
- The AppShell chrome is hidden on `/modules/*`; on `/mastery/*` the AppShell topbar exists.
- Do not commit unless the user asks.

---

### Task 1: Shared foundations

**Files:**
- Create: `frontend/src/lib/medals.ts`
- Create: `frontend/src/components/practice/StepDots.tsx`
- Create: `frontend/src/components/practice/StarMeter.tsx`
- Create: `frontend/src/components/practice/FeedbackSlot.tsx`
- Create: `frontend/src/components/practice/PromptStage.tsx`
- Create: `frontend/src/components/practice/PracticeStage.tsx`
- Create: `frontend/src/hooks/useScrollToTop.ts`
- Modify: `frontend/src/components/practice/PracticePageLayout.tsx` (add `maxWidth`)
- Modify: `frontend/src/components/practice/PracticeHeader.tsx` (compact HUD: StepDots + StarMeter + sticky)
- Modify: `frontend/src/pages/trail/TrailMapPage.tsx` (import medals from `lib/medals.ts`)

- [x] Create `lib/medals.ts` with `MedalTier`, `MEDAL_THRESHOLDS`, `getMedalTier`, `MEDAL_STYLES`, `starsForAccuracy`.
- [x] Create `StepDots` (done/current/pending, `aria-current="step"`, sr-only labels, current label visible).
- [x] Create `StarMeter` (0–3 stars from `accuracy: number | null`).
- [x] Create `FeedbackSlot` (reserved `min-h`, wraps FeedbackBanner so nothing shifts).
- [x] Create `PromptStage` (variants: `equation` / `audio` / `image-word` / `blank` / `canvas`).
- [x] Create `PracticeStage` (one column on phones, `lg:grid-cols-2` split, sticky tray).
- [x] Create `useScrollToTop(key)` scrolling `#main-content`.
- [x] `PracticePageLayout`: add `maxWidth` prop (`xl | 2xl | 3xl | 5xl`, default `2xl`).
- [x] `PracticeHeader`: compact HUD — back + stars/badge row, title + score row, progress card row (StepDots + label + bar); `accuracy` and `sticky` props.
- [x] `TrailMapPage`: remove local medal helpers, import from `lib/medals.ts`.

---

### Task 2: Module 1 — SyllableModulePage

**Files:**
- Modify: `frontend/src/pages/modules/SyllableModulePage.tsx`

- [x] HUD: `steps` dots, module-accuracy bar, live `StarMeter` (`status.moduleAccuracy`), `sticky`.
- [x] `PromptStage` variant `equation` for `pagsama`, `audio` for the rest.
- [x] `FeedbackSlot` wraps the correct/incorrect banner; hint rendered in the slot as `FeedbackBanner variant="hint"` (replaces bare `<p>`).
- [x] `PracticeStage` wraps prompt + `OptionGrid`.
- [x] `useScrollToTop` on `subLevel/setId` change (also on advance timers).
- [x] Update `SyllableModulePage.test.tsx` if DOM changed (hint/option behavior assertions stay).

---

### Task 3: Modules 2/3 — VocabularyModulePage

**Files:**
- Modify: `frontend/src/pages/modules/VocabularyModulePage.tsx`
- Create: `frontend/src/components/practice/FillBlank.tsx`
- Modify: `frontend/src/components/game/WordSlotMachine.tsx` (CSS typo `justify-center;` → `justify-content: center;`)

- [x] HUD + `PracticeStage`; remove `max-w-5xl` + `mt-24` hacks.
- [x] Live `StarMeter` from `GET /modules/progress/{userId}` (module accuracy).
- [x] `pakinggan` prompt in `PromptStage` (`image-word`).
- [x] `FillBlank` for `gamitin`: tappable sentence blank + word chips (tap-to-fill), correct→green, wrong→red+retry.
- [x] Slot machine only on tall **and** wide viewports.

---

### Task 4: Module 4 — SentenceModulePage

**Files:**
- Modify: `frontend/src/pages/modules/SentenceModulePage.tsx`

- [x] HUD (tier dots, task X of 5 bar, star meter).
- [x] Audio prompt in `PromptStage` (`audio`).
- [x] Sentence canvas: `WordTiles` styled as the sentence strip; remove duplicate "Iyong pangungusap:" preview.
- [x] `FeedbackSlot` keeps the inline hint.
- [x] Tier announcement + reunion screens onto `card-story`.
- [x] `useScrollToTop` per task.

---

### Task 5: Mastery pages (4)

**Files:**
- Modify: `frontend/src/pages/mastery/SyllablePracticePage.tsx`
- Modify: `frontend/src/pages/mastery/WordPracticePage.tsx`
- Modify: `frontend/src/pages/mastery/ImagePracticePage.tsx`
- Modify: `frontend/src/pages/mastery/SentencePracticePage.tsx`

- [x] Adopt HUD + `PracticeStage`/`PromptStage`/`FeedbackSlot` consistently.

---

### Task 6: Tests & verification

**Files:**
- Create: `frontend/src/components/practice/StarMeter.test.tsx`
- Create: `frontend/src/components/practice/FillBlank.test.tsx`
- Create: `frontend/src/components/practice/StepDots.test.tsx`
- Create: `frontend/src/components/practice/FeedbackSlot.test.tsx`

- [x] StarMeter: null/0 → 0 stars; 50 → 1 bronze; 85 → 2 silver; 95 → 3 gold.
- [x] FillBlank: tap chip fills blank; correct → success callback; wrong → retry state.
- [x] StepDots: renders states + `aria-current`.
- [x] FeedbackSlot: reserved height with/without children.
- [x] Full chain: `npx tsc -b` → `npm run lint` → `npm test` → `npm run build`.
- [ ] Manual QA: 360px / 768px / 1024px+, reduced motion, `/modules/*` vs `/mastery/*`.
