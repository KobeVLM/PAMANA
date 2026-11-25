# Adaptive Difficulty Tiers (Priority 3)

Vocabulary (Modules 2–3) and syllable (Module 1) questions are assigned one of
three difficulty tiers automatically. Module 4 sentences keep their existing
fixed `tier 1 → tier 2` content progression; they are **not** part of this
feature.

There is no teacher UI, no manual tier picker, and no Klase Mode. Tier choice
is entirely backend-owned and derived from the learner's own answer history.

## Tiers

| Code | Label | Meaning |
|---|---|---|
| `FOUNDATIONAL` | Madali | Clearly different distractors (different initial sounds/letters) |
| `STANDARD` | Katamtaman | Legacy pools; enough sample but no strong trend |
| `CHALLENGE` | Mahirap | Minimal pairs and multi-syllable/word-context distractors |

## Adaptive policy

`com.pamana.adaptive.AdaptiveTierResolver` reads the most recent **10** rows in
`answer_events` for one learner and one `item_type`:

- fewer than **3** scored answers → `STANDARD` (new learners are never penalised)
- accuracy **< 60%** → `FOUNDATIONAL`
- accuracy **> 85%** → `CHALLENGE`
- otherwise → `STANDARD`

Vocabulary excludes the passive `pakinggan` listening step from the sample, so
listening cannot inflate a learner's tier. Vocabulary (`vocabulary_word`) and
syllable (`syllable_set`) histories are resolved independently. The resolver is
read-only and deterministic for a given history, so repeated question requests
in one session keep the same tier.

## Content Bank

`content_bank` (Flyway `V6__add_adaptive_content_bank.sql`) stores one
structured distractor pool per `(activity, item_key, difficulty_tier)`:

- vocabulary: key = lowercased word (19 words × 3 tiers)
- syllables: key = `<subLevel>:<setId>` (4 sublevels × 5 sets × 3 tiers)

`ContentBankSeeder` seeds all **117** rows once at startup, in production and
in the H2 test profile (which disables Flyway and builds the schema from
entities). Seeding is idempotent; hand-edited pools are never overwritten.
`SyllableContent` is the shared source of truth for targets so the seeder's
pools and the runtime dispatcher always agree.

`STANDARD` pools reproduce the legacy behaviour exactly. If a pool is missing
or stale, services fall back to the deterministic `TieredDistractors` rules so a
partially migrated database still serves playable questions. The tier is part
of each shuffle seed, which keeps options stable within a tier and changes them
when the dispatcher moves the learner.

## Telemetry and measurement

Flyway `V7__add_answer_difficulty_tier.sql` adds
`answer_events.difficulty_tier` (default `STANDARD`). Vocabulary and syllable
answers record the tier that was actually served; older callers keep the
default. Telemetry stays append-only and separate from replay tracking
(`replay_events`): replays never create answer attempts or change progress.

This makes the Priority 3 measures computable in-app — accuracy and completion
by tier — alongside the evaluator rating and longitudinal retention targets in
the refactoring plan.

## Verification

```powershell
# Backend: all tiers, Content Bank, both dispatchers
& 'C:\Users\user\AppData\Local\Temp\opencode\maven\apache-maven-3.9.6\bin\mvn.cmd' test '-Dstyle.color=never'
```

Latest full backend result: **86/86 pass**. No frontend contract changed — the
question response shapes and option counts are unchanged.
