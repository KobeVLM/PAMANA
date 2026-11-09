# Fix Module Progression and Skip Bug Implementation Plan

**Goal:** Prevent unauthorized access and skipping to Module 4 (or any locked module) after Module 2 completion by enforcing route guards, backend unlock verification, strict completion logic in TrailMap, and restricting cheat commands.
**Architecture:** Implement defense-in-depth: (1) A reusable React `<ModuleRouteGuard moduleNumber={n}>` protecting all `/modules/:id` routes, (2) Spring Security / Controller-level `isModuleUnlocked` checks in `SentenceController` and `VocabularyController` returning HTTP 403 Forbidden on locked modules, (3) removal of the flawed `(p?.isUnlocked && nextP?.isUnlocked)` heuristic in `TrailMapPage.tsx`, and (4) conditioning console cheats to DEV mode only.
**Tech Stack:** React 18, React Router v6, TypeScript, TailwindCSS, Vitest, Spring Boot 3, Spring Security, JUnit 5, MockMvc.

---

### Task 1: Backend Lock Enforcement in `SentenceController`

**Files:**
- Modify: `backend/src/main/java/com/pamana/sentence/SentenceController.java`
- Modify: `backend/src/test/java/com/pamana/sentence/SentenceControllerTest.java`

**Details:**
1. Inject `ModuleLockService` into `SentenceController`.
2. In `getSentenceTask(@RequestParam int tier, Principal principal)`:
   - Check if Module 4 is unlocked: `if (!moduleLockService.isModuleUnlocked(userId, 4)) { return ResponseEntity.status(HttpStatus.FORBIDDEN).build(); }`.
3. In `recordProgress(@Valid @RequestBody SentenceProgressRequest request, Principal principal)`:
   - Check if Module 4 is unlocked: `if (!moduleLockService.isModuleUnlocked(userId, 4)) { return ResponseEntity.status(HttpStatus.FORBIDDEN).build(); }`.
4. In `SentenceControllerTest.java`:
   - Add test `getSentenceTask_whenModule4Locked_returnsForbidden()`.
   - Add test `recordProgress_whenModule4Locked_returnsForbidden()`.
   - Ensure existing tests still pass by preserving mock/database setup where Module 4 is unlocked.

---

### Task 2: Backend Lock Enforcement in `VocabularyController`

**Files:**
- Modify: `backend/src/main/java/com/pamana/vocabulary/VocabularyController.java`
- Modify: `backend/src/test/java/com/pamana/vocabulary/VocabularyControllerTest.java`

**Details:**
1. Inject `ModuleLockService` into `VocabularyController`.
2. In `getNextWord(@RequestParam(required = false) Integer moduleNumber, Principal principal)`:
   - If `moduleNumber != null` (e.g. 2 or 3), verify `moduleLockService.isModuleUnlocked(userId, moduleNumber)`.
   - If locked, return `ResponseEntity.status(HttpStatus.FORBIDDEN).build()`.
3. In `recordProgress(@Valid @RequestBody VocabularyProgressRequest request, Principal principal)`:
   - Determine target module from the vocabulary item domain: `"self_body"` is Module 2, `"family_home"` is Module 3.
   - Check if that module is unlocked: `if (!moduleLockService.isModuleUnlocked(userId, targetModule)) { return ResponseEntity.status(HttpStatus.FORBIDDEN).build(); }`.
4. In `VocabularyControllerTest.java`:
   - Add tests verifying HTTP 403 when requesting `next` word or submitting progress for locked Module 2 or Module 3.
   - Ensure existing tests pass.

---

### Task 3: Create Frontend `<ModuleRouteGuard>` Component

**Files:**
- Create: `frontend/src/components/ModuleRouteGuard.tsx`
- Create: `frontend/src/components/ModuleRouteGuard.test.tsx`

**Details:**
1. Implement `ModuleRouteGuard`:
   - Props: `moduleNumber: number`, `children: React.ReactNode`.
   - Fetches `/api/modules/progress/${user.id}` via `api.get`.
   - If `loading`, render standard loading spinner or skeleton.
   - If `isUnlocked === false` for `moduleNumber`:
     - Show warning toast notification: `"Naka-lock pa ang Module {moduleNumber}. Tapusin muna ang naunang aralin!"`
     - Navigate to `/trail` with `{ replace: true }`.
   - If `isUnlocked === true`, render `children`.
2. Write Vitest tests in `ModuleRouteGuard.test.tsx`:
   - Test 1: Renders children when the requested module is unlocked.
   - Test 2: Redirects to `/trail` and triggers toast when the requested module is locked.
   - Test 3: Renders loading state while progress is fetching.

---

### Task 4: Protect Module Routes in `frontend/src/App.tsx`

**Files:**
- Modify: `frontend/src/App.tsx`

**Details:**
1. Wrap each module route element with `<ModuleRouteGuard moduleNumber={...}>`:
   - `/modules/1` -> `<ModuleRouteGuard moduleNumber={1}><SyllableModulePage /></ModuleRouteGuard>`
   - `/modules/2` -> `<ModuleRouteGuard moduleNumber={2}><VocabularyModulePage moduleNumber={2} domain="self_body" /></ModuleRouteGuard>`
   - `/modules/3` -> `<ModuleRouteGuard moduleNumber={3}><VocabularyModulePage moduleNumber={3} domain="family_home" /></ModuleRouteGuard>`
   - `/modules/4` -> `<ModuleRouteGuard moduleNumber={4}><SentenceModulePage /></ModuleRouteGuard>`
2. Verify that manual URL navigation to `/modules/4` while Module 4 is locked immediately redirects back to `/trail`.

---

### Task 5: Fix TrailMap Completion Heuristic & Progression Integrity

**Files:**
- Modify: `frontend/src/pages/trail/TrailMapPage.tsx`
- Modify: `frontend/src/pages/trail/TrailMapPage.test.tsx` (or create if missing)

**Details:**
1. In `TrailMapPage.tsx`:
   - Refactor `checkIsComplete`:
     ```ts
     // Replace:
     // return p?.isComplete || (p?.isUnlocked && nextP?.isUnlocked) || false;
     // With:
     return Boolean(p?.isComplete);
     ```
   - A module is ONLY complete if `isComplete === true`. Unlocking the next module should never magically mark the previous module complete.
2. In `handleModuleClick`:
   - Ensure locked nodes display the lock toast when clicked:
     ```ts
     if (!progress?.isUnlocked) {
       setToastMessage(`Naka-lock pa ang Module ${node.moduleNumber}. Kumpletuhin muna ang naunang aralin!`);
       setTimeout(() => setToastMessage(null), 4000);
       return;
     }
     ```
3. Update tests to verify that Module 3 is not treated as complete when Module 4 happens to be unlocked without Module 3 completion.

---

### Task 6: Restrict Cheats to Development Environment

**Files:**
- Modify: `frontend/src/main.tsx`

**Details:**
1. In `frontend/src/main.tsx`:
   - Only initialize cheats when running in development mode:
     ```ts
     if (import.meta.env.DEV) {
       setupCheats();
     }
     ```
   - This prevents console spam and accidental/unauthorized cheat usage during testing and production.

---

### Task 7: Full Verification & Regression Testing

**Commands:**
- `mvn -f backend/pom.xml test`
- `cd frontend; npm test -- --run`
- Verify database state and simulation with end-to-end integration test.
