# Deterministic Sync Lab Mode Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make gameplay questions, distractors, and choice ordering completely deterministic across Module 1, Modules 2 & 3, and Mastery Practice, so that student PCs without sound stay 100% in sync with the demonstration laptop/TV.

**Architecture:**
- Backend: Seed all `Collections.shuffle(...)` calls in `SyllableService` and `VocabularyService` with stable hash-based seeds (`setId + subLevel.hashCode()`, `wordId.hashCode() + step.hashCode()`, etc.).
- Frontend: Remove `Math.random() - 0.5` sorting in mastery pages (`ImagePracticePage`, `WordPracticePage`, `SentencePracticePage`) in favor of deterministic slices and predefined orders.

---

## Tasks

### Task 1: Deterministic Syllable Options in Module 1 (`SyllableService.java`)

**Files:**
- Modify: `backend/src/main/java/com/pamana/syllable/SyllableService.java`
- Test: `backend/src/test/java/com/pamana/syllable/SyllableControllerTest.java`

**Details:**
Currently, `SyllableService.getSyllableSet` uses `new java.util.Random(setId + subLevel.hashCode())` for consonants, but calls unseeded `java.util.Collections.shuffle(options)` for `pagsama`/`pakinggan` (line 200), `kilalanin` (line 223), and `rhyming` (line 245). Replace these with seeded shuffling using `new java.util.Random(setId + subLevel.hashCode())`.

- [ ] **Step 1: Update `SyllableService.java` with seeded option shuffling**
- [ ] **Step 2: Add test in `SyllableControllerTest.java` verifying identical options across repeated calls**
- [ ] **Step 3: Run backend test suite**
```bash
mvn test -f backend/pom.xml -Dtest=SyllableControllerTest
```
- [ ] **Step 4: Commit changes**
```bash
git add backend/src/main/java/com/pamana/syllable/SyllableService.java backend/src/test/java/com/pamana/syllable/SyllableControllerTest.java
git commit -m "fix(module1): make syllable options ordering deterministic for lab sync"
```

---

### Task 2: Deterministic Vocabulary Distractors & Options in Modules 2 & 3 (`VocabularyService.java`)

**Files:**
- Modify: `backend/src/main/java/com/pamana/vocabulary/VocabularyService.java`
- Test: `backend/src/test/java/com/pamana/vocabulary/VocabularyControllerTest.java`

**Details:**
In `VocabularyService`:
1. In `getMatchOptions(UUID wordId, String step)`:
   - Sort `distractors` by ID or ordinal before shuffling.
   - Seed distractor selection with `new Random(wordId.hashCode() + step.hashCode())`.
   - Seed options shuffling with `new Random(wordId.hashCode() + step.hashCode())`.
2. In `getGamitinDialogue(UUID wordId)`:
   - Sort `distractors` alphabetically or by ID.
   - Seed distractor selection with `new Random(wordId.hashCode() + "gamitin".hashCode())`.
   - Seed options shuffling with `new Random(wordId.hashCode() + "gamitin".hashCode())`.

- [ ] **Step 1: Update `VocabularyService.java` with seeded distractor and option selection**
- [ ] **Step 2: Add test in `VocabularyControllerTest.java` verifying deterministic match and dialogue options**
- [ ] **Step 3: Run backend test suite**
```bash
mvn test -f backend/pom.xml -Dtest=VocabularyControllerTest
```
- [ ] **Step 4: Commit changes**
```bash
git add backend/src/main/java/com/pamana/vocabulary/VocabularyService.java backend/src/test/java/com/pamana/vocabulary/VocabularyControllerTest.java
git commit -m "fix(modules2-3): make vocabulary distractors and option placement deterministic"
```

---

### Task 3: Deterministic Word and Scramble Selection in Mastery Practice Pages

**Files:**
- Modify: `frontend/src/pages/mastery/ImagePracticePage.tsx`
- Modify: `frontend/src/pages/mastery/WordPracticePage.tsx`
- Modify: `frontend/src/pages/mastery/SentencePracticePage.tsx`

**Details:**
1. In `ImagePracticePage.tsx`: change `pickRoundWords` to sort by `ordinal` and slice `ROUND_TOTAL` without `Math.random()`.
2. In `WordPracticePage.tsx`: change `pickRoundWords` to sort by `ordinal` and slice `ROUND_TOTAL` without `Math.random()`.
3. In `SentencePracticePage.tsx`: remove `Math.random()` shuffling in `prepareScrambled` and preserve the static backend `task.scrambledWords`.

- [ ] **Step 1: Update mastery practice pages**
- [ ] **Step 2: Run frontend test suite**
```bash
npm test --prefix frontend
```
- [ ] **Step 3: Commit changes**
```bash
git add frontend/src/pages/mastery/
git commit -m "fix(mastery): make practice items and sentence scrambles deterministic"
```
