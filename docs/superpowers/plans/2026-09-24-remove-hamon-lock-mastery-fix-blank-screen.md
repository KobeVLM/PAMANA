# Remove Hamon ng Pamana, Lock Mastery Until Stage Completion, and Fix Blank Screen Bug Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove "Hamon ng Pamana" and replace its role with Mastery Practice; lock each Mastery practice mode until the student completes its corresponding stage on the Pamana Trail; fix the fatal React hooks crash causing blank screens in `VocabularyModulePage.tsx` upon completing vocabulary words.

**Architecture:** 
1. Fix the React hook ordering in `VocabularyModulePage.tsx` by removing hooks after early returns and removing the Hamon trigger popup.
2. In `HomePage.tsx`, fetch `/api/modules/progress/{userId}` and lock each Mastery card (1–4) until the corresponding module has `isComplete === true`. Add route guards to the 4 mastery pages.
3. Update `VocabularyService.java` to set `hamonTriggered = false` and update `ParentDashboardPage.tsx` metrics to focus on Mastery.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Spring Boot 3, Maven.

---

## Global Constraints
- Target branch: `staging`
- Working directory: `c:\Users\Kobe\Desktop\Capstone 2\PAMANA`
- All frontend changes must pass `npx tsc --noEmit && npm run build` with 0 errors.
- All backend changes must pass `mvn compile` and `mvn test` with 0 errors.
- Do NOT touch `main` branch directly.

---

### Task 1: Fix Blank Screen Bug and Remove Hamon UI in `VocabularyModulePage.tsx`

**Files:**
- Modify: `frontend/src/pages/modules/VocabularyModulePage.tsx`

**Interfaces:**
- Consumes: `GET /api/vocabulary/next?userId={uid}&moduleNumber={num}`
- Produces: Clean rendering without React hook order violations; glossy 3D completion buttons for Module 2 and 3.

- [ ] **Step 1: Inspect and eliminate hooks declared after early return**
Remove `isSkippingHamon` and `isSkippingHamonLoading` `useState` hooks declared at lines 249-250 (which follow `if (moduleComplete) return (...)`).

- [ ] **Step 2: Remove `hamonTriggered` state and popup UI**
Remove `const [hamonTriggered, setHamonTriggered] = useState(false)` and the entire `if (hamonTriggered)` render block (lines 252-325). Remove `if (res.data.hamonTriggered) setHamonTriggered(true)` on line 198.

- [ ] **Step 3: Enhance Module 2 & 3 Completion Screen with 3D Glossy Game Buttons**
In `if (moduleComplete)` screen:
Replace the flat button with the dual glossy 3D game pill buttons:
- **Red RETRY**: Resets module progress via `api.delete('/modules/reset/' + user?.id + '/' + moduleNumber)` and reloads.
- **Green NEXT**: Navigates to `/trail`.

- [ ] **Step 4: Verify frontend builds with no TypeScript errors**
Run: `cd frontend; npx tsc --noEmit; npm run build`
Expected: 0 errors.

- [ ] **Step 5: Commit**
```bash
git add frontend/src/pages/modules/VocabularyModulePage.tsx
git commit -m "fix(vocabulary): remove hooks after early return and remove Hamon challenge popup"
```

---

### Task 2: Remove Backend Hamon Triggering and Clean Up Hamon Routes

**Files:**
- Modify: `backend/src/main/java/com/pamana/vocabulary/VocabularyService.java`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- `VocabularyService.recordStepAccuracy` returns `hamonTriggered = false`.
- `App.tsx` redirects or cleans `/modules/:moduleNumber/hamon` route.

- [ ] **Step 1: Set `hamonTriggered` to false in `VocabularyService.java`**
In `backend/src/main/java/com/pamana/vocabulary/VocabularyService.java`, line 228:
Set `boolean hamonTriggered = false;` so vocabulary progression never triggers Hamon sessions.

- [ ] **Step 2: Update `App.tsx` Hamon route**
In `frontend/src/App.tsx`, remove or redirect `/modules/:moduleNumber/hamon` to `/trail`.

- [ ] **Step 3: Verify backend compilation and tests**
Run: `cd backend; mvn compile; mvn test -Dtest=SyllableControllerTest`
Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit**
```bash
git add backend/src/main/java/com/pamana/vocabulary/VocabularyService.java frontend/src/App.tsx
git commit -m "feat: disable backend Hamon trigger and remove hamon route"
```

---

### Task 3: Implement Mastery Lock Mechanism in `HomePage.tsx` and Route Guards

**Files:**
- Modify: `frontend/src/pages/homepage/HomePage.tsx`
- Modify: `frontend/src/pages/mastery/SyllablePracticePage.tsx`
- Modify: `frontend/src/pages/mastery/WordPracticePage.tsx`
- Modify: `frontend/src/pages/mastery/ImagePracticePage.tsx`
- Modify: `frontend/src/pages/mastery/SentencePracticePage.tsx`

**Interfaces:**
- Consumes: `GET /api/modules/progress/{userId}` -> `ModuleProgress[]`
- Produces: Locked mastery tiles with Lock icon and toast warning; route guards that prevent direct URL bypass.

- [ ] **Step 1: Fetch module progress in `HomePage.tsx`**
In `HomePage.tsx`:
- Import `useAuth` from `@/contexts/AuthContext`.
- Import `Lock` from `lucide-react`.
- Import `api` from `@/lib/api`.
- Fetch `GET /modules/progress/${user?.id}` and store in `moduleProgress`.
- Define helper `isUnlocked(moduleId: number)`: returns `true` if `moduleProgress.some(p => p.moduleNumber === moduleId && p.isComplete)`.

- [ ] **Step 2: Render locked/unlocked visual state on Mastery tiles**
For each mastery item (1 to 4):
- If locked (`!isUnlocked(item.id)`):
  - Visual: Dark overlay with `bg-black/70`, `Lock` icon, badge `"Naka-lock"`, subtext `"Tapusin ang Module X"`.
  - On click: Display interactive toast/banner: `"Tapusin muna ang Module X sa Pamana Trail upang mabuksan ang Mastery!"`.
- If unlocked (`isUnlocked(item.id)`):
  - Visual: Glowing green border, green badge `"Bukas na!"`, navigate to `item.route` on click.

- [ ] **Step 3: Add route guard check to the 4 Mastery Practice pages**
In `SyllablePracticePage.tsx`, `WordPracticePage.tsx`, `ImagePracticePage.tsx`, `SentencePracticePage.tsx`:
On load, verify if the corresponding module is complete. If not, redirect to `/trail` with warning toast.

- [ ] **Step 4: Verify frontend build**
Run: `cd frontend; npx tsc --noEmit; npm run build`
Expected: 0 errors.

- [ ] **Step 5: Commit**
```bash
git add frontend/src/pages/homepage/HomePage.tsx frontend/src/pages/mastery/
git commit -m "feat(mastery): lock mastery tiles until stage is completed in trail map"
```

---

### Task 4: Update Parent Dashboard Metrics and Final System Verification

**Files:**
- Modify: `frontend/src/pages/dashboard/ParentDashboardPage.tsx`

**Interfaces:**
- Consumes: `DashboardMetrics`
- Produces: Clean metrics without deprecated Hamon pass rate card.

- [ ] **Step 1: Update Parent Dashboard metric card**
In `frontend/src/pages/dashboard/ParentDashboardPage.tsx`:
Replace the "Hamon ng Pamana" card (lines 419-429) with "Mastery Completion" or "Pagsasanay" stats.

- [ ] **Step 2: Full automated test suite and builds**
Run:
- `cd backend; mvn test -Dtest=SyllableControllerTest`
- `cd frontend; npx tsc --noEmit; npm run build`

- [ ] **Step 3: Push all commits to `staging` branch**
Run: `git push origin staging`

- [ ] **Step 4: Commit**
```bash
git add frontend/src/pages/dashboard/ParentDashboardPage.tsx
git commit -m "feat(dashboard): replace Hamon metrics with Mastery and finalize staging release"
```
