# PAMANA Refactoring Status

> Compiled on **2026-11-25** from the local repository history at HEAD `eb87893`.
>
> This summary tracks refactoring work completed through commit `eb87893` and
> work still open after that point.

---

## Executive summary

The MVP validation form defined five refactoring priorities:

1. Interactive instructions, error scaffolding, and Focus View.
2. Audio replay, synchronized captions, and audio normalization.
3. Adaptive difficulty tiers and a database-backed Content Bank.
4. Answer-based progress tracking with a shared HUD.
5. Voice-clarity / pronunciation remediation.

Work completed so far:

- **Priority 1:** largely implemented, including shared learning primitives, guided tutorials, three-stage scaffolding, Focus View, and a dismissible gesture demo.
- **Priority 2:** implemented for replay controls, replay telemetry, synchronized NPC captions, and audio normalization.
- **Priority 3:** implemented for vocabulary and syllables only, with automatic server-side tiers, a seeded Content Bank, and served-tier telemetry.
- **Priority 4:** implemented end to end with append-only answer events, answer-based progress, and a shared HUD.
- **Priority 5:** only partially addressed by normalization; re-recording and teacher pronunciation sign-off are still on hold.

All changes are **local commits only**. Nothing has been pushed, reviewed, or merged.

---

## Completed refactoring work

### 0. Enabling cleanup — Klase / Hamon removal

These changes removed the teacher-facing and classroom/challenge features so the product could converge on the adaptive-only learner experience.

Relevant commits:

- `58e425f` — remove teacher role, leaderboard, and Klase Mode from frontend UI
- `4079610` — remove Hamon challenge popup and fix hook ordering
- `1ac8e31` — disable backend Hamon trigger and remove Hamon route
- `cc700fa` — replace Hamon card with Mastery completion stats
- `ac0ff97` — remove Hamon and Klase features from backend, add session logging
- `6782f40` — reconcile branches while keeping removed features dropped
- `c733fda` — practice redesign / cleanup
- `24dd585` — implementation plan for removal work

Migration:

- `backend/src/main/resources/db/migration/V1__remove_hamon_and_klase.sql`

Notes:

- The validation document still mentions **Hamon ng Pamana** and **Klase Mode** as affected objectives. The current implementation deliberately does **not** restore them.
- Priority 3 is adaptive-only: no teacher UI, no manual tier picker, and no Klase Mode.

---

### Priority 1 — Instructions, scaffolding, and Focus View

**Goal:** reduce cognitive friction by showing learners how to interact, narrowing wrong choices progressively, and hiding scenery during active answering.

Commits:

- `553c0d4` — shared tutorial, scaffolding, and Focus View primitives
- `a10641d` — guided tutorials and error scaffolding in modules
- `a60909e` — guided tutorials and stage-based scaffolding in practice screens
- `8e5b264` — make gesture demo dismissible and relocate focus toggle

What shipped:

- A shared hand-cursor **GestureDemo** with a **5-second** demonstration that can be tapped to dismiss early.
- **ScaffoldMessage** / stage-based guidance for wrong answers:
  - soft encouragement and replay prompt,
  - one distractor faded,
  - explicit comparison/explanation at the final stage.
- **Focus View** toggling on six gameplay screens:
  - `SyllableModulePage`
  - `VocabularyModulePage`
  - `SyllablePracticePage`
  - `WordPracticePage`
  - `ImagePracticePage`
  - `SentencePracticePage`
- Focus View hides decorative scenery while keeping the HUD and answer controls visible.
- Page tests mock `NPCDialogue`, so `FocusViewToggle` is rendered by each page rather than inside `NPCDialogue`.

Current UI placement:

- Focus View is rendered in the top-left control column under `Pamana Trail` / `Bumalik` with extra spacing.

Remaining gaps:

- `SentenceModulePage.tsx` still lacks full P1 wiring for `GestureDemo`, `ScaffoldMessage`, and `FocusView`.
- Official Q4/Q5 ≥85%, ≤1.4 wrong attempts/item, and teacher layout ≥4.5 have not been measured with post-refactor learner data.

---

### Priority 2 — Audio replay, captions, and normalization

**Goal:** support emergent readers who miss the first playback by providing on-demand replay and readable speech text.

Commits:

- `f6f8236` — log in-game replay button taps
- `522f890` — add prominent replay control and synchronized NPC captions
- `8b676bb` — normalize voiceover peaks to −1.0 dBFS with vocal EQ
- `57656a3` — rebalance replay control and HUD chip sizing
- `b1660ab` — relocate replay below the speech bubble
- `eb87893` — clear replay overlap with English panel and answer chips

What shipped:

- **ReplayButton**: high-contrast, pulse-animated, ≥56 px touch target.
- **Replay telemetry**: `replay_events` records taps separately from answer attempts.
- **Synchronized NPC captions** with large 32 px Filipino text and optional English toggle.
- **173 MP3 assets** normalized to −1.0 dBFS with vocal EQ.
- English translation now renders in normal flow inside the speech bubble, so replay follows it instead of overlapping.
- NPC scale transforms were removed and bottom spacing increased so replay no longer sits on answer/step chips.

Important invariant:

- Replays never create answer attempts and never change progress. Answer telemetry (`answer_events`) and replay telemetry (`replay_events`) are separate append-only streams.

Remaining gaps:

- No in-app analytics view for replay frequency yet; telemetry is captured but not surfaced in reports/dashboards.
- Child Q2 ≥90% and teacher Item 14 ≥4.5 have not been measured post-refactor.
- Priority 5 pronunciation/clarity remediation is still outstanding.

---

### Priority 3 — Adaptive difficulty tiers and Content Bank

**Goal:** stop serving the same fixed distractors to every learner; adapt difficulty from the learner's own answer history.

Commits:

- `de3a7e6` — adaptive tier resolver over answer history
- `4b089d6` — seed tiered Content Bank distractor pools
- `a05639d` — adaptive vocabulary distractors and served-tier logging
- `0a8fdc2` — adaptive syllable distractors from Content Bank
- `f56dc48` — document adaptive difficulty tiers and tier telemetry
- `e17b8b4` — record served tier for practice answer events

Documentation:

- `docs/adaptive-difficulty-tiers.md`

Implemented policy:

- Reads the latest **10** scored answers per learner per `item_type`.
- Fewer than **3** scored answers → `STANDARD`.
- Accuracy `<60%` → `FOUNDATIONAL`.
- Accuracy `>85%` → `CHALLENGE`.
- Otherwise → `STANDARD`.

Scope and decisions:

- Applies to **vocabulary (Modules 2–3)** and **syllables (Module 1)** only.
- Module 4 sentence tier `1 → 2` progression is intentionally untouched.
- Vocabulary excludes passive `pakinggan` events so listening cannot inflate a tier.
- Vocabulary and syllable histories are resolved independently.
- `STANDARD` preserves legacy distractor pools.
- Tier is part of deterministic shuffle seeds, so options are stable within a tier and change when the tier changes.
- No teacher UI, manual tier selection, or Klase Mode.

Data/telemetry:

- `content_bank` is DB-backed and seeded once in Java so H2 tests see it without Flyway.
- Flyway `V7__add_answer_difficulty_tier.sql` adds `answer_events.difficulty_tier`.
- Served tier is recorded on vocabulary, syllable, and practice answer events.
- `sentence_task` remains `STANDARD`.

Remaining gaps:

- Evaluator rating ≥4.5 and longitudinal retention ≥85% require real multi-week data.
- `docs/adaptive-difficulty-tiers.md` still says “Latest full backend result: 86/86”; the latest full backend run after `e17b8b4` was **89/89**.
- No teacher-facing reporting of tier distribution was added, by design.

---

### Priority 4 — Answer-based progress and shared HUD

**Goal:** make correct answers immediately visible in progress, keep accuracy as a separate honest number, and preserve an append-only answer log.

Commits:

- `8c8b3ba` — log every answer and compute honest progress
- `b01e9f0` — shared answer-based HUD across mastery screens
- `c419277` — module bars driven by saved answers
- `4649c58` — accept practice answers without touching mastery
- `3efe400` — persist practice answers as telemetry
- `5ef790d` — align priority 4 documentation with answer-based progress
- `b1660ab` / `eb87893` — HUD placement and sizing polish

What shipped:

- **ProgressPill** and **AccuracyChip** shared across module and practice screens.
- Progress is computed from distinct items answered correctly at least once.
- Wrong answers never reduce the bar.
- Accuracy is reported separately from progress.
- Practice answers are saved as telemetry without mutating mastery/progress.
- HUD stays visible in Focus View.
- Current placement: upper-right HUD group, compact chips, stacked on small screens and side-by-side at `md+`.

Remaining gaps:

- Child Q5 ≥85% and “displayed progress equals saved progress in 100% of sessions” still need validation with real learner data.
- No dedicated dashboard/report showing the answer-event audit trail to teachers or parents was added.

---

### Priority 5 — Voice narration clarity and pronunciation

**Current status:** partially addressed, not complete.

Done indirectly:

- Audio peak normalization and EQ from `8b676bb`.
- Replay and captions from `522f890` make existing clips easier to process.

Not done:

- Narration audit against a pronunciation/clarity checklist.
- Teacher sign-off from Mrs. Eleanor Sindangan.
- Re-recorded, warmer, child-friendly Lolo/Lola voice assets.
- Replacement of clips with incorrect pronunciations.

Blocker:

- P5 remains **on hold until re-recorded Lolo/Lola audio assets exist** and teacher pronunciation sign-off is obtained. After that, `npm run normalize:audio` should be re-run on the new assets.

---

### UI polish / localhost playtest fixes

These are not new refactoring priorities; they are usability fixes from local playtesting.

Commits:

- `8e5b264` — gesture demo dismissible; focus toggle relocation
- `57656a3` — replay control and HUD chip sizing rebalanced
- `b1660ab` — clear title overlap; compact HUD below title; replay below bubble; focus near mascot
- `eb87893` — restore top-right HUD; return focus under back button; clear replay overlap

Current control layout:

- **Focus View** sits under the back button with padding.
- **Progress + Katumpakan** sit in the upper-right HUD group.
- **Makinig Ulit** sits below the speech bubble and after the English panel, right-aligned.
- English translation is in normal flow, so it cannot overlay replay.
- NPC scale transforms were removed, so replay does not overlap answer/step chips.

---

## Key design decisions and invariants

- Telemetry is **append-only**; replays do not pollute answer attempts or progress.
- Practice answers are telemetry-only; they do not touch mastery records.
- Adaptive tiers are backend-owned and deterministic for a given answer history.
- `STANDARD` preserves legacy behavior and distractor pools.
- Tier selection is scoped to vocabulary and syllables; Module 4 sentence progression is unchanged.
- There is deliberately no tier badge in the UI; tier changes are observed through option changes and `answer_events.difficulty_tier`.
- Focus View hides decorative content only; HUD and interactive controls remain visible.
- `FocusViewToggle` is page-level because page tests mock `NPCDialogue` to `null`.
- No Klase Mode, teacher role, manual tier picker, or Hamon challenge was restored.

---

## Verification history

| Area | Result |
|---|---|
| Backend at `e17b8b4` | **89/89 tests pass** |
| Focused tier/telemetry backend tests at `e17b8b4` | **40/40 tests pass** |
| Frontend at `57656a3` | **174 passed, 2 failed**; ESLint clean; TypeScript clean |
| Focused UI tests at `b1660ab` | 8 files, **31 tests pass** |
| Full frontend at `b1660ab` | **174 passed, 2 failed**; ESLint/TypeScript clean |
| Focused UI tests at `eb87893` | 8 files, **31 tests pass** |
| Full frontend at `eb87893` | **174 passed, 2 failed**; ESLint/TypeScript/`git diff --check` clean |
| Backend | Unchanged by UI commits after `e17b8b4` |

Pre-existing frontend failures, unrelated to the refactoring:

- `RegisterPage.test.tsx` — `Home Page Target`
- `SettingsPage.test.tsx` — `Girl (Babae)`

---

## Not yet tackled / still open

### 1. Priority 5 narration remediation

- Re-record Lolo/Lola voice assets.
- Teacher pronunciation/clarity audit and sign-off covering 100% of narration clips.
- Re-run `npm run normalize:audio` after replacement.
- Re-measure Child Q2 ≥90% and teacher Items 11/14 ≥4.5.

### 2. Outcome measurement from real users

The following targets are defined in the validation form but cannot be confirmed from local tests:

- Child Q4 ≥85% — understood questions.
- Child Q5 ≥85% — understood feedback.
- Child Q2 ≥90% — voices clear.
- Average wrong attempts per item ≤1.4.
- Replay usage frequency from `replay_events`.
- Evaluator ratings ≥4.5 for layout, audio support, and content progression.
- Longitudinal retention/completion ≥85% across multi-week sessions.

### 3. Documentation drift

Docs still describe removed or pre-refactor behavior:

- `docs/sdd/02_user_management.md` — still describes teacher role, Klase join code, Klase creation, and `/klase` redirect.
- `docs/sdd/04_modules_2_3_vocabulary.md` — still describes `HamonGame` and Hamon auto-trigger mechanics.
- `docs/project-brain.md`, several `docs/srs/*`, `docs/proposal/*`, and `docs/engineering/*` files still reference Klase Mode and Hamon ng Pamana as active features.
- `docs/adaptive-difficulty-tiers.md` — verification result is stale (`86/86` instead of `89/89`).
- Section 7 of the validation form calls for SRS/SDD/SPMP updates that have not been fully applied:
  - FR IDs for replay, subtitles, and scaffolded distractor elimination.
  - NFR for −1 dBFS normalization and replay latency.
  - Component names such as `AudioReplayButton`, `DialogueSubtitles`, and `InteractiveTutorialCursor`.
  - Schema updates for `difficulty_tier` / `distractor_set`.
  - Sequence diagrams for the three-attempt scaffolded flow.

### 4. P1 wiring gap

- `SentenceModulePage.tsx` still lacks full P1 `GestureDemo`, `ScaffoldMessage`, and Focus View wiring.
- Focus View is not present on `SentenceModulePage`, unlike the other six gameplay screens.

### 5. Telemetry consumption

- Replay events and served-tier fields exist, but there is no dashboard/report/query layer that turns them into evaluator-facing metrics.
- No replay-usage visualization for parents or teachers.

### 6. Test debt

- Two pre-existing frontend failures remain: `RegisterPage` and `SettingsPage`.
- Backend tests should be re-run after any future migration or content-bank change.
- Visual overlap checks are currently covered structurally in tests but not with real browser layout measurements.

### 7. Visual/responsive validation

- The upper-right HUD and centered title are compact but have not been re-validated across all viewport sizes after the `eb87893` layout change.
- Focus View, replay, and English toggle placement should be checked again on a phone-width viewport and with English enabled.

### 8. Delivery hygiene

- All refactoring commits are local only; none were pushed, reviewed, or merged.
- `backend/.env` points at a Supabase pooler; starting the backend applies Flyway `V1–V7` to that database. Use caution with local runs.

---

## Suggested next steps

1. **Sync documentation** with the current code: remove active Klase/Hamon claims, update SDD/SRS, and fix the stale backend test count in `docs/adaptive-difficulty-tiers.md`.
2. **Finish P1** by wiring `GestureDemo`, `ScaffoldMessage`, and Focus View into `SentenceModulePage`.
3. **Unblock P5** once re-recorded Lolo/Lola audio exists; obtain teacher pronunciation sign-off and re-normalize.
4. **Run a validation round** to collect Q4/Q5/Q2, wrong-attempts-per-item, replay usage, evaluator ratings, and retention data.
5. **Surface telemetry** in a simple report/query so the Priority 2 and 3 measures can be read without inspecting raw tables.
6. **Fix the two pre-existing frontend test failures** so the baseline becomes fully green.
7. **Re-check responsive layout** with English captions enabled and Focus View toggled on small screens.
