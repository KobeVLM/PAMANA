## PART 4: Expected System

**A. Key Features (MVP)**

| **#** | **Feature**                                              | **Module**                     | **Description**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | **Measurable Target**                                                                                                                                                                                                                                 | **RRL Source**                                     |
| ----- | -------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| F1    | MATATAG Q1-Q2 Aligned Filipino Modules                   | Modules 1-4 (Content Delivery) | Four content modules aligned to MATATAG Grade 2 Filipino Q1-Q2: Module 1 - Phoneme Blending and Syllable Recognition via Pagsama-Pakinggan-Kilalanin (Q1), Module 2 - Self & Body Vocabulary (Q1), Module 3 - Family & Home Vocabulary (Q1-Q2), Module 4 - Simple Sentence Construction: paturol and patanong only (Q1-Q2)                                                                                                                                                                                                                                                                       | 100% MATATAG Q1-Q2 competency coverage validated by ≥2 Grade 2 Filipino teachers in pre-intervention interview; 0 Q3-Q4 competencies included                                                                                                         | DepEd (2023)                                       |
| F2    | 4-Step Spiral Loop (Pakinggan-Kilalanin-Basahin-Gamitin) | Modules 2-3 (Vocabulary)       | Each of the 25 vocabulary words follows a 4-step cycle: Step 1 Pakinggan (audio + image, no response), Step 2 Kilalanin (audio-to-image match, 4 options), Step 3 Basahin (audio-to-written-word match, 4 options), Step 4 Gamitin (NPC dialogue completion, 4 options). Previously mastered words reappear in harder NPC dialogue contexts in subsequent sub-levels (spiral revisit - the same skill gets harder each time).                                                                                                                                                                    | ≥75% mastery accuracy across all 4 steps per word to mark "mastered"; visual and audio feedback within ≤0.3 seconds of learner input; spiral revisit auto-queued for words below threshold                                                            | Veladat & Mohammadi (2011); Lena & Nikolov (2025)  |
| F3    | Pamana Trail Progression Lock                            | All Modules (Gamification)     | Visual map of the 4-module journey from Entrance (Module 1) to Sala (Module 4). Each module is locked until the previous module's accuracy threshold is met: ≥80% for Module 1 syllable sets; ≥75% for Modules 2, 3, and 4. Lock status is enforced exclusively by Supabase database records evaluated at session end, with no manual teacher action required.                                                                                                                                                                                                                                   | 100% compliance with unlock rules; Pamana Trail map updates within ≤1 second of module threshold being met; target of ≥80% of 30 enrolled learners completing all 4 modules within the 4-week intervention                                            | Giray & Ballado (2025)                             |
| F4    | Hamon ng Pamana (Heritage Challenge)                     | Modules 2-4 (Spiral Revisit)   | Automatic review challenge triggered after every 5 words are marked "mastered" in Supabase. Retests all previously mastered words in shuffled order. Words scoring below ≥60% accuracy are flagged "needs review" and automatically re-queued for the start of the next session. This is the primary repetition-until-better mechanic - the same words keep coming back in shuffled, harder contexts until mastery is confirmed.                                                                                                                                                                 | Auto-triggered after exactly every 5 mastered words; ≥60% accuracy required to pass; target of ≥80% of learners showing measurable accuracy improvement on Hamon ng Pamana revisit vs. initial word introduction accuracy                             | Estomata et al. (2025); Veladat & Mohammadi (2011) |
| F5    | NPC Dialogue System - Hint-First, No Punishment          | All Modules (Engagement)       | Lola and Lolo NPCs speak Filipino, react to learner answers with immediate audio-visual feedback, and present each module's Pamanang Gawain mission. Incorrect answers deliver a contextual audio hint and allow unlimited retries - no score deduction, no progress penalty. This eliminates assessment anxiety and ensures the learner is always in a game state, never a test state.                                                                                                                                                                                                          | NPC audio playback within ≤2 seconds; visual feedback within ≤0.3 seconds of learner input; 0% progress penalty on incorrect responses (Hint-First only)                                                                                              | Lena & Nikolov (2025); Qiu et al. (2025)           |
| F6    | Klase Mode - Classroom Leaderboard                       | All Modules (Social Feature)   | Teachers generate a class join code. Students who join the same Klase see a shared Pamana Trail leaderboard displaying each classmate's module completion count - asynchronous peer motivation without real-time play. Teachers access a read-only class dashboard showing per-learner module completion, per-word mastery scores, and Hamon ng Pamana pass rates.                                                                                                                                                                                                                               | Leaderboard updates within ≤5 seconds of sub-level completion; supports up to 40 simultaneous learners per Klase; teacher dashboard read-only, accessible via separate teacher account                                                                | Giray & Ballado (2025); Qiu et al. (2025)          |
| F7    | Parent/Guardian Progress Dashboard                       | Module 4 (Reporting)           | Displays individual learner progress across all 4 modules. Metrics shown: accuracy per word (%), Hamon ng Pamana pass rate per domain, mastered vs. needs-review word count, session duration per week, and Pamana Trail completion percentage. Color-coded At-Risk Word Indicators: Green (≥75%, mastered), Yellow (50-74%, developing), Red (<50% or 3+ failed revisits, at-risk). Red words trigger automatic parent alert. Generates downloadable PDF session report per completed module. Accessible via parent login on any browser, no internet speed requirement beyond basic broadband. | Dashboard updates within ≤5 seconds of sub-level completion; PDF report generated within ≤10 seconds of module completion; at-risk alert auto-sent when word is flagged Red; target of ≥50% parent monitoring time reduction vs. paper-based tracking | Mendez et al. (2025); Qiu et al. (2025)            |

**Settings and Characters**

| **Area (Module)**                                                     | **Characters and Role**                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entrance - Module 1: Syllable Recognition                             | Lola (learning guide; introduces syllable mission: "Kailangan mong matutunan ang mga pantig!"); Lolo (mission giver). Lola reacts to each Pakinggan and Kilalanin response with immediate audio-visual feedback.                   |
| Garden - Module 2: Self & Body Vocabulary                             | Lola (introduces self and body vocabulary through garden activities; e.g., "Gamitin ang iyong kamay para..." - Step 4 GAMITIN dialogue uses garden-context prompts)                                                                |
| Kitchen - Module 3: Family & Home Vocabulary                          | Lola, Lolo (family and household vocabulary introduced through meal preparation and household dialogue. Step 4 GAMITIN uses kitchen and home-context NPC prompts.)                                                                 |
| Sala / Living Room - Module 4: Sentence Construction + Reunion Ending | Lolo (presents paturol and patanong sentence tasks through living room conversation). Parents NPC (final scene: parents call on the phone; learner speaks to them in Filipino using learned sentences - Pamanang Mission complete) |

**B. High-Level Workflow**

**Step 1: Account Setup**

The learner or parent creates a Grade 2 account on the PAMANA web application. Optionally, the teacher's Klase join code is entered to link the learner to a class group. Supabase initializes the learner's Pamana Trail progress record at Module 1, locked state for Modules 2-4.

**Module:** Account Setup (Auth & Supabase Init)

**Target:** Account creation and Pamana Trail initialization within ≤3 seconds; Klase join code validated and linked to class group record

**Step 2: Module 1 - Syllable Recognition**

Lola introduces the Pamanang Gawain mission. The learner completes Pakinggan syllable sets (hear syllable → select matching written syllable from 4 options), Kilalanin sets (hear word → identify starting syllable from 4 options), and rhyming recognition tasks. Supabase records accuracy per set after each completion. The Pamana Trail advances to the Garden when ≥80% average accuracy is achieved across all Module 1 sets.

**Module:** Module 1 (Syllable Recognition)

**Target:** Module 2 unlocks only when ≥80% average accuracy recorded in Supabase; Pamana Trail map updates within ≤1 second

**Step 3: Modules 2-3 - Vocabulary Spiral Loop**

The learner progresses through the 25-word vocabulary set across Self & Body and Family & Home domains using the 4-step spiral loop. Step 1 Pakinggan (listen), Step 2 Kilalanin (match image), Step 3 Basahin (identify written word), Step 4 Gamitin (complete NPC dialogue). A Hamon ng Pamana challenge triggers automatically every 5 mastered words, retesting all previously mastered words in shuffled order. The Pamana Trail advances to the Sala when ≥75% mastery is achieved across ≥90% of the 25-word vocabulary set.

**Module:** Modules 2-3 (Vocabulary & Spiral Revisit)

**Target:** Per-word mastery tracked in Supabase; Hamon ng Pamana triggered after exactly every 5 mastered words; Module 4 unlocks at ≥75% mastery across ≥90% of words

**Step 4: Module 4 - Simple Sentence Construction**

Lolo presents sentence construction tasks in the Sala. Tier 1: the learner arranges scrambled words into correct paturol sentences using drag-and-drop. Tier 2 unlocks after ≥75% Tier 1 accuracy: the learner arranges patanong sentences and completes Lolo's dialogue prompts. Module 4 marks complete in Supabase when Tier 2 accuracy reaches ≥75%, triggering the reunion ending scene.

**Module:** Module 4 (Sentence Construction)

**Target:** 2-tier progression enforced by Supabase; audio hint after 3 failed drag-and-drop attempts; Module 4 completion triggers reunion ending and Parent Dashboard full report unlock

**Step 5: Reunion Ending**

Upon completing Module 4, the parents' NPC calls on the phone. The learner speaks to them in Filipino using sentences formed from all learned vocabulary and sentence patterns, demonstrating completion of the Pamanang Mission. The Pamana Trail displays 100% complete.

**Module:** Pamana Hall - Narrative Ending

**Target:** Reunion scene unlocks only when Module 4 Tier 2 completion is confirmed in Supabase

**Step 6: Parent/Guardian Dashboard Access**

After each completed module, the parent or guardian accesses the dashboard via browser login to review the learner's progress report: accuracy per word, Hamon ng Pamana pass rates, mastered vs. needs-review word count, and Pamana Trail completion. At-risk words (Red indicators) display an alert. The parent downloads the PDF session report. The parent completes the time-motion study instrument and SUS questionnaire in Week 6.

**Module:** Parent/Guardian Dashboard (Reporting)

**Target:** Dashboard updates within ≤5 seconds of sub-level completion; PDF report within ≤10 seconds of module completion; SUS target ≥70; parent time reduction target ≥50% vs. paper-based tracking

