# Project Proposal Guide (Weeks 7-8)

## Team Information

Project Title: Real-Time Literacy Assessment Monitoring System (LITAMOS)

Project Short Description (<20 words): A gamified web-based adventure teaching Filipino to culturally disconnected Grade 2 learners - Generation Alpha

Team Code: 2526-sem2-it332-33

Members:

1\. Kyle Ed C. Maningo  
2\. Rudyard Axel L. Gersamio  
3\. Sharaine Allyson A. Salutan  
4\. Lyndon Luke A. Morre  
5\. Kobe Vincent L. Marikit

## PART 1: Introduction (Approx. 300 words)

**Background of the Problem**

The Philippines faces a growing Filipino language proficiency gap among Generation Alpha learners (born 2013 to present). Jubahib and Bayani (2024) documented that Gen Alpha children demonstrate significantly higher English proficiency than Filipino proficiency, driven by dominant exposure to English-language digital media, social platforms, and home communication patterns. This decline is most critical at Grade 2, where formal Filipino instruction begins under the MATATAG curriculum (DepEd, 2023). Under MATATAG, Grade 1 remains mother-tongue based; Grade 2 is the first year learners are formally introduced to Filipino phonics, vocabulary, and basic sentence construction. Quarter 1 focuses on syllable recognition and phonological awareness, while Quarter 2 extends to family and home vocabulary and simple sentence forms. If foundational Filipino skills are not established in Q1 and Q2, learners enter Q3 and Q4 with unresolved gaps that compound across each succeeding quarter.

Despite this curricular mandate, no gamified digital tool exists that delivers structured Filipino language practice aligned to MATATAG Grade 2 Q1-Q2 competencies for outside-classroom, self-paced use. Research confirms that playful, interactive, technology-based tasks consistently enhance young learners' language acquisition and motivation (Lena & Nikolov, 2025), and that game-based learning significantly improves Filipino vocabulary acquisition (Estomata et al., 2025). Parents actively use interactive applications to support home-based language learning for young children (Qiu et al., 2025). The absence of a MATATAG Q1-Q2-aligned, gamified Filipino language web application for Grade 2 outside-classroom use is the gap this project addresses.

**Problem Statement**

Grade 2 Gen Alpha learners in Philippine public schools lack access to a gamified, self-paced web-based application that develops foundational Filipino language skills - specifically syllable recognition, Q1-Q2 vocabulary, and basic declarative and interrogative sentence construction - aligned with MATATAG Grade 2 Filipino curriculum competencies for Quarter 1 and Quarter 2. Existing tools such as Duolingo are designed for older learners and carry no MATATAG Grade 2 Filipino content alignment. Traditional textbook-based methods provide no gamified engagement and no repetition-based skill reinforcement outside the classroom (Jubahib & Bayani, 2024). No existing solution delivers structured Filipino language practice using a spiral learning mechanic specifically designed for Grade 2 MATATAG Q1-Q2 learners in a self-paced web-based format.

**Research Gap**

The Review of Related Literature identifies three critical gaps. First, while game-based learning is validated for Filipino vocabulary acquisition (Estomata et al., 2025), no study has tested a gamified spiral learning mechanic for MATATAG Grade 2 Q1-Q2 Filipino competencies specifically. Second, while gamification consistently increases elementary learner engagement (Giray & Ballado, 2025), no gamified Filipino language web application exists for Grade 2 Q1-Q2 outside-classroom self-paced use. Third, while parental involvement is documented as critical to young learners' home-based e-learning outcomes (Qiu et al., 2025), no MATATAG-aligned Filipino application provides a parent progress dashboard for monitoring Grade 2 learner skill development outside the classroom. This project addresses these gaps by developing and evaluating PAMANA, a gamified web-based Filipino language application for Grade 2 MATATAG Q1-Q2 learners, with a 4-step spiral vocabulary loop, four skill-based content modules, a Klase Mode classroom leaderboard, and a Parent/Guardian Progress Dashboard with at-risk word indicators.

## PART 2: Objectives

A. **General Objectives**  
This study aims to develop foundational Filipino language skills in Grade 2 learners - specifically syllable recognition, vocabulary, and basic sentence construction - through a gamified web-based spiral learning application aligned with MATATAG Grade 2 Filipino curriculum competencies for Quarter 1 and Quarter 2, designed for self-paced learning outside the classroom.

Specifically, the system modules aim to achieve the following outcomes

**General Objective 1 (Syllable Recognition Module: "Pakinggan at Kilalanin")**

Develop Filipino phoneme blending and syllable recognition accuracy by executing three progressive sub-level mechanics - Pagsama (combine an isolated consonant and vowel sound to identify the resulting syllable blend), Pakinggan (listen to a complete syllable and select its matching written form), and Kilalanin (listen to a word and identify its starting syllable) - aligned with MATATAG Grade 2 Q1 competencies ("Natutukoy ang tunog ng Alpabetong Filipino" and "Natutukoy ang magkatunog na salita"). The module targets a minimum of ≥80% average accuracy across all three sub-levels before the vocabulary modules unlock.

**(Module 1: Syllable Recognition - "Pakinggan at Kilalanin")**

- Implement audio playback of all Filipino vowel sounds (a, e, i, o, u), consonant sounds, and CV syllable combinations (ba/be/bi/bo/bu through wa/we/wi/wo/wu), pre-recorded by a native Filipino speaker. Audio playback initiates within ≤2 seconds of learner request.
- Execute the Pagsama (blending) mechanic: the system plays an isolated consonant sound (e.g., /B/) followed by an isolated vowel sound (e.g., /A/) and the learner selects the correct resulting syllable blend from 4 written options (BA, BE, BI, BO), requiring ≥3 correct selections out of 4 items per consonant group before advancing. Audio confirmation of the correct blend ("B at A ay BA") is delivered within ≤0.3 seconds of correct input, directly targeting the MATATAG Q1 competency that learners must distinguish that letter B combined with letter A produces the syllable BA and not BE or BI.
- Execute the Pakinggan mechanic per syllable set: the system plays a complete syllable and displays 4 written syllable options. The learner selects the matching written syllable. Incorrect responses trigger an audio hint and allow unlimited retries. A minimum of 3 correct responses out of 4 attempts is required per set before the next syllable set unlocks.
- Execute the Kilalanin mechanic: the system plays a 1-to-2-syllable Filipino word and displays 4 written syllable options. The learner identifies the starting syllable. A minimum of 3 correct responses out of 4 attempts per set is required to advance.
- Implement rhyming word recognition tasks: the system plays two words and the learner selects whether they rhyme (binary Yes/No response), requiring ≥3 correct out of 4 items per round to pass, aligned with MATATAG Q1 competency "Natutukoy ang magkatunog na salita".
- Enforce a Supabase-tracked progression lock: Module 2 unlocks only when ≥80% average accuracy is recorded across all three Module 1 sub-levels - Pagsama, Pakinggan, and Kilalanin - as evaluated by Supabase records at session end. Visual and audio feedback is delivered within ≤0.3 seconds of each learner input.

**General Objective 2 (Vocabulary Development Module: "Basahin at Unawain")**

Develop Filipino vocabulary recognition and word-meaning connection across 25 words in two Q1-Q2 MATATAG topic domains - Self and Body (Q1) and Family and Home (Q1-Q2) - by executing a 4-step spiral learning loop (Pakinggan, Kilalanin, Basahin, Gamitin) where each word is introduced, matched, read, and applied in NPC dialogue context, with automatic spiral revisit via Hamon ng Pamana every 5 mastered words. The module targets ≥75% mastery accuracy per word across all 4 spiral steps.

**(Module 2: Vocabulary - Self & Body | Module 3: Family & Home | Module 4: Community)**

- Deliver 25 vocabulary items across two MATATAG Q1-Q2 topic domains: (a) Self & Body - 10 words (Q1: mata, kamay, ilong, bibig, tenga, ulo, paa, likod, tiyan, noo); (b) Family & Home - 15 words (Q1-Q2: Nanay, Tatay, Lola, Lolo, Kuya, Ate, bahay, kain, tulog, damit, sapatos, silya, mesa, pintuan, baso). All words sourced from MATATAG Grade 2 Q1-Q2 high-frequency word lists (DepEd, 2023).
- Execute the 4-step spiral loop per vocabulary word: Step 1 PAKINGGAN - Lola NPC speaks the target word with image display; no learner response (receptive exposure only). Step 2 KILALANIN - the system plays the word and displays 4 image options; the learner taps the matching image. Step 3 BASAHIN - the system plays the word and displays 4 written options; the learner selects the correct written form. Step 4 GAMITIN - the learner selects the correct word to complete Lola's or Lolo's Filipino dialogue prompt from 4 options. Immediate visual and audio feedback within ≤0.3 seconds of learner input.
- Mark a word "mastered" in Supabase when the learner achieves ≥75% accuracy across all 4 spiral steps. Mark as "needs review" when below threshold; auto-queue for revisit at the start of the next session without requiring manual teacher intervention.
- Trigger Hamon ng Pamana (Heritage Challenge) automatically every 5 words marked "mastered": the system retests all previously mastered words in shuffled order. Words scoring below ≥60% accuracy are flagged "needs review" and re-added to the active session queue. Target: ≥80% of learners showing accuracy improvement on Hamon ng Pamana revisit compared to initial word introduction accuracy.
- Enforce progression lock: Module 3 unlocks only after ≥75% mastery is achieved across ≥90% of Module 2 vocabulary items. Module 4 unlocks only after ≥75% mastery across ≥90% of Module 3 vocabulary items, as evaluated by Supabase records at session end

**General Objective 3 (Sentence Construction Module: "Bumuo ng Pangungusap")**

Develop basic Filipino sentence construction skills in declarative (paturol) and interrogative (patanong) sentence forms by executing a word-arrangement drag-and-drop mechanic and NPC dialogue completion tasks using vocabulary mastered in Modules 1-3, aligned with MATATAG Grade 2 Q1-Q2 grammar and sentence construction competencies. The module targets ≥75% sentence construction accuracy across both sentence tiers before Module 4 is marked complete.

**(Module 4: Simple Sentence Construction - "Bumuo ng Pangungusap")**

- Execute the drag-and-drop word arrangement mechanic: the system displays a set of scrambled Filipino words and the learner arranges them into a grammatically correct sentence. Sentences progress across 2 tiers: Tier 1 - 2-to-3-word paturol sentences using mastered vocabulary (Ako si \_**, Kumain si \_**); Tier 2 - simple patanong sentences with correct question mark punctuation (Saan si \_**?, Sino si \_**?). An audio hint reads the correct sentence after 3 failed attempts on any single item.
- Execute NPC dialogue completion tasks: the system displays Lolo's or Lola's Filipino dialogue prompt with a blank; the learner selects the correct word or phrase from 4 options to form a complete and correct sentence. All dialogue words are drawn exclusively from the 25 vocabulary items mastered in Modules 2-3. A minimum of ≥4 correct completions out of 5 dialogue tasks per set is required to advance.
- Enforce tier-by-tier progression lock: Tier 2 (patanong) unlocks only after the learner achieves ≥75% accuracy across all Tier 1 (paturol) tasks. Module 4 is marked complete in Supabase when Tier 2 average accuracy reaches ≥75%, triggering the Pamana Trail reunion ending and unlocking the Parent/Guardian Dashboard final report.
- Deliver immediate visual and audio feedback within ≤0.3 seconds of each drag-and-drop placement and dialogue selection. Incorrect arrangements display the correct word order as a hint after 3 failed attempts per item, with no progress penalty (Hint-First system).

**General Objective 4 (Mastery Progression & Parent/Guardian Dashboard Module)**

Ensure systematic skill-by-skill mastery and provide parents and teachers with actionable progress data by implementing a linear progression structure across 4 modules with Supabase-tracked accuracy thresholds, and generating an automated Parent/Guardian Dashboard displaying per-word and per-module performance metrics with at-risk word indicators. Learning improvement is measured by comparing each learner's initial accuracy on Module 1 (first syllable set attempt) against their final accuracy on Module 4 (sentence construction completion) after 4 weeks of using PAMANA.

**(Module 4 Completion: Mastery Progression & Reporting - Parent/Guardian Dashboard)**

- Store all learner performance data in Supabase, capturing per-word and per-syllable metrics including: accuracy percentage per spiral step (0-100%), attempts per sub-level (0+), Hamon ng Pamana pass/fail per word, session duration (seconds), and module completion timestamp.
- Generate an automated Parent/Guardian Dashboard displaying 5 progress metrics calculated from Supabase records:  
   (1) accuracy trend per module,  
   (2) mastered vs. needs-review word count,  
   (3) Hamon ng Pamana pass rate per domain,  
   (4) average session duration per week, and  
   (5) overall Pamana Trail completion percentage.  
   Dashboard accessible via separate parent login on any browser, no app installation required.
- Implement color-coded At-Risk Word Indicators for each vocabulary item: Green (≥75% accuracy, mastered), Yellow (50-74% accuracy, developing), Red (<50% accuracy or 3+ failed Hamon ng Pamana revisits, at-risk). Red-flagged words trigger an automatic parent-facing alert: "Si \[learner\] ay nahihirapan sa salitang \[word\]. Subukan ulit!"
- Generate a downloadable PDF session report for parents and teachers after each completed module, summarizing: words mastered count, words at-risk count, module completion date, and recommended words to review offline. PDF generation completes within ≤10 seconds of module completion.

**Research Questions**

- To what extent does the Pakinggan-Kilalanin mechanic achieve ≥80% syllable recognition accuracy across all Q1 syllable sets among Grade 2 Filipino learners within the 4-week intervention period?
- How effectively does the 4-step spiral learning loop (Pakinggan-Kilalanin-Basahin-Gamitin) achieve ≥75% per-word mastery accuracy across the 25-word Q1-Q2 vocabulary set, as measured by per-word mastery records and Hamon ng Pamana pass rates stored in Supabase?
- To what extent do the gamification elements - Pamana Trail progression lock, Hamon ng Pamana challenges, and Klase Mode classroom leaderboard - lead to module completion rates of ≥80% among Grade 2 learners across the 4-week intervention?
- To what degree does the Parent/Guardian Dashboard reduce parental effort in monitoring learner Filipino language progress, achieving a minimum of ≥50% reduction in manual tracking time compared to traditional paper-based monitoring methods, as measured by a parent time-motion study?

## PART 3: Methods

A. Proposed Solution Concept

PAMANA (Pamanang Heritage Quest) is proposed as a web-based Filipino language learning application for Grade 2 learners, built on React (frontend), Spring Boot (backend), and Supabase (PostgreSQL database and authentication). The system delivers four integrated capabilities:

(1) Pakinggan-Kilalanin - structured syllable recognition through audio-driven two-step identification;

(2) Basahin-Unawain - vocabulary mastery through a 4-step spiral loop with automatic Hamon ng Pamana revisit challenges;

(3) Bumuo ng Pangungusap - basic sentence construction through drag-and-drop word arrangement and NPC dialogue completion; and

(4) a Parent/Guardian Dashboard providing automated per-word progress reports and at-risk word indicators. Primary users are Grade 2 learners accessing the application outside the classroom on a desktop or laptop browser. Secondary users are parents and teachers monitoring learner progress through the Klase Mode dashboard.

PAMANA does not operate as a lesson or quiz system. Every sub-level is a game interaction - a repetition of the same skill with increasing difficulty - where the learner's accuracy is tracked automatically by Supabase across sessions. The game gets harder as the learner improves: words that are mastered reappear in harder dialogue contexts; syllables that are recognized unlock longer and more complex word sets. The system measures improvement by comparing each learner's initial Module 1 syllable accuracy against their Module 4 sentence construction accuracy after 4 weeks - the game's own data is the evidence of skill growth.

**Core Game Story**

A Grade 2 child (the player) visits Lolo and Lola in the province during summer vacation. Lolo and Lola speak only Filipino. The child must learn Filipino to communicate, complete household missions (Pamanang Gawain), and earn the family PAMANA before parents arrive. Lola serves as the primary learning guide - introducing each syllable and word, reacting to the learner's responses with immediate audio-visual feedback, and presenting each module's mission. Lolo serves as the secondary mission giver. Each completed module unlocks a new area of the family home on the Pamana Trail map. Completing Module 4 triggers the reunion ending: the child's parents call, and the child speaks to them in Filipino using learned sentences - demonstrating that the Pamanang Mission is complete.

**B. Development Methodology**

**Approach:** Agile/Scrum with 2-week sprints

| Sprint       | Duration | Module                                                | Key Deliverables                                                                                                                                                                                                                                                                                                                                     |
| ------------ | -------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sprint 1** | 2 weeks  | Module 1 - Syllable Recognition                       | React project setup, Supabase schema and auth, Spring Boot API, native Filipino speaker syllable audio assets, Pagsama phoneme blending mechanic, Pakinggan mechanic, Kilalanin mechanic, rhyming word recognition tasks, Hint-First system, Pamana Trail map UI, NPC Lola and Lolo engine                                                           |
| **Sprint 2** | 2 weeks  | Modules 2-3 - Vocabulary (Self & Body, Family & Home) | 4-step spiral loop engine, 25-word vocabulary set with native Filipino speaker audio and image assets, per-word mastery tracking in Supabase, Hamon ng Pamana auto-trigger logic, Klase Mode join-code system and leaderboard, Spring Boot API endpoints for progress sync                                                                           |
| **Sprint 3** | 2 weeks  | Module 4 - Simple Sentence Construction               | Drag-and-drop word arrangement mechanic (react-dnd), 2-tier sentence progression (paturol then patanong), NPC dialogue completion tasks, progression lock enforcement (Tier 2 unlocks after ≥75% Tier 1 accuracy), Pamana Trail reunion ending scene, module completion trigger for Dashboard unlock                                                 |
| **Sprint 4** | 2 weeks  | Parent/Guardian Dashboard                             | Progress metrics (accuracy per word, Hamon ng Pamana pass rate, session duration, Pamana Trail completion percentage), automated PDF session reports per module, at-risk word color indicators (Green/Yellow/Red), parent-facing at-risk alert system, parent time-motion study instrument, SUS questionnaire administration, system testing and UAT |

**C. Validation Approach**

System validation is conducted in two phases: functional system testing (unit and integration tests per sprint) and user acceptance testing (UAT) with the partner school. To measure learning impact, a single-group longitudinal design with internal benchmarking is implemented. Learning improvement is measured by comparing each learner's initial accuracy on Module 1 (first syllable set attempt, Week 1) against their final accuracy on Module 4 (sentence construction completion, Week 6) after 4 weeks of using PAMANA. Performance is also benchmarked against the MATATAG Grade 2 Q1-Q2 mastery standard of ≥75% accuracy per skill module.

**Participants:** 30 Grade 2 learners from one Cebu-based public elementary school (to be confirmed upon principal-level approval), and 2-3 Grade 2 Filipino subject teachers from the same school. 30 parents or guardians who will supervise home-based practice and access the Parent/Guardian Dashboard.

| Phase                | Week       | Activity                                                                                                                                                                                                                                               | Data Collected                                                                                                                                                                                                                                                                 |
| -------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Baseline**         | Week 1     | Parent orientation session + teacher pre-intervention interview (MATATAG Q1-Q2 alignment validation) + learner completes Module 1 first syllable set (Pakinggan and Kilalanin, first 5 syllable pairs)                                                 | Initial syllable recognition accuracy (%), attempts per set, session duration (seconds), teacher MATATAG alignment rating (recorded interview)                                                                                                                                 |
| **Intervention**     | Week 2 - 5 | Learners access PAMANA outside the classroom on a personal or family device. Minimum 3 sessions per week, 15 minutes per session. Hamon ng Pamana auto-triggers every 5 mastered words. Klase Mode leaderboard active for peer motivation.             | Weekly: module completion rate, per-word mastery accuracy per spiral step, Hamon ng Pamana pass rate, session duration, sub-level drop-off count, at-risk word flag count, Klase Mode leaderboard participation rate                                                           |
| **Final Assessment** | Week 6     | Learner completes Module 4 final sentence tier (Tier 2: patanong). Parent completes parent time-motion study instrument and SUS questionnaire. Teacher completes post-intervention interview on content alignment and learner engagement observations. | Final Module 4 sentence construction accuracy (%), accuracy improvement from Module 1 baseline vs. Module 4 final (internal benchmarking), SUS score (target ≥70), parent time reduction data (target ≥50% vs. paper tracking), teacher post-intervention qualitative feedback |

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

## PART 5: Discussion

A. Scope of the System

The scope of PAMANA is defined as follows: Filipino language instruction for Grade 2 MATATAG learners across four modules aligned exclusively to Q1-Q2 competencies - Module 1 (syllable recognition and phonics, Q1), Module 2 (self and body vocabulary, Q1), Module 3 (family and home vocabulary, Q1-Q2), Module 4 (simple paturol and patanong sentence construction, Q1-Q2). The system delivers a two-step Pakinggan-Kilalanin syllable mechanic, a 4-step spiral vocabulary loop (Pakinggan-Kilalanin-Basahin-Gamitin), automatic Hamon ng Pamana challenges every 5 mastered words, a drag-and-drop sentence construction mechanic, Pamana Trail progression locks (≥80% for Module 1; ≥75% for Modules 2-4), a Hint-First NPC dialogue system (no punishment, no quiz format), a Klase Mode classroom leaderboard, and a Parent/Guardian Progress Dashboard with PDF session reports and at-risk word indicators - all delivered as a web-based application (React, Spring Boot, Supabase) accessible on desktop and laptop browsers for outside-classroom, self-paced use.

Excluded from scope: community and environment vocabulary (Q3), pakiusap and padamdam sentence types (Q3-Q4), compound sentence structures (Q3-Q4), short paragraph writing (Q4), speech recognition and microphone input, mobile native app (iOS/Android) deployment, teacher lesson planning tools, offline mode, DepEd LMS integration, and any standalone pre-test or post-test quiz instrument separate from the game - all reserved for future work.

**B. Limitations of the Project**

| **Limitation**            | **Description**                                                                                                                                                                                                         | **Mitigation Strategy**                                                                                                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sample Size               | Validation involves 30 learners from one school, limiting generalizability of internal benchmarking findings to other schools, regions, or MATATAG Q1-Q2 implementation contexts.                                       | Document as limitation; use descriptive statistics appropriate for the sample size; recommend multi-school replication with larger sample in future work.                                                        |
| Internet Dependency       | Web-based platform requires stable internet connectivity per session. Learners in low-connectivity home environments may experience session interruptions.                                                              | Supabase auto-saves progress per sub-level completion; learners resume from last saved point. Target schools with existing device and internet access. Document as accessibility limitation.                     |
| No Speech Recognition     | Pronunciation practice is listening-based only. No microphone input is collected, so the system cannot provide corrective feedback on the learner's actual pronunciation output.                                        | Native Filipino speaker audio models allow learners to self-monitor pronunciation. Active voice input identified as future work (e.g., Filipino-calibrated offline speech recognition for Grade 2 child voices). |
| No Control Group          | Single-group longitudinal design with internal benchmarking cannot establish that PAMANA produces greater learning improvement than traditional classroom instruction or other tools.                                   | Document as limitation; use internal accuracy improvement (Module 1 vs. Module 4) to measure absolute skill growth; recommend controlled experimental design in future replication studies.                      |
| Q1-Q2 Scope Only          | PAMANA covers MATATAG Grade 2 Q1-Q2 competencies only. Q3 (community vocabulary, compound sentences) and Q4 (paragraph writing) are not addressed, limiting the system's coverage of the full Grade 2 Filipino year.    | Document as limitation; position PAMANA as a foundational Q1-Q2 tool; recommend Q3-Q4 module extensions in future capstone work using the same spiral loop architecture.                                         |
| Parent Technical Literacy | Self-paced home use assumes parents have basic familiarity with browser-based applications and can support minimum 3-session-per-week schedules. Learners with limited parental guidance may have irregular engagement. | Conduct parent orientation session at partner school before intervention; provide in-app parent-facing tutorial (≤3 minutes); include a printable session guide with recommended weekly schedule.                |

**C. Expected Contribution**

- **Practical contribution:** PAMANA provides the first freely accessible, gamified Filipino language web application specifically designed for Grade 2 MATATAG Q1-Q2 learners for outside-classroom, self-paced supplemental learning. Unlike Duolingo (adult-oriented, no MATATAG alignment) or traditional textbooks (no engagement features, no repetition-based feedback), PAMANA integrates MATATAG Q1-Q2 competency alignment, a repetition-based spiral vocabulary mechanic, a Hint-First no-punishment NPC system, and an automated Parent/Guardian Dashboard with at-risk word indicators. Measurable targets include ≥80% module completion rate across 30 Grade 2 learners, measurable accuracy improvement from Module 1 to Module 4, ≥50% parent monitoring time reduction, and a SUS score of ≥70.
- **Methodological contribution:** The project develops and validates a 4-step spiral learning loop (Pakinggan-Kilalanin-Basahin-Gamitin) as a structured, non-quiz game mechanic for Filipino vocabulary mastery in Grade 2 Q1-Q2. The loop architecture, Supabase mastery schema, and Hamon ng Pamana trigger logic will be documented for use by other researchers developing MATATAG-aligned Filipino e-learning tools at the Grade 2 level.
- **Theoretical contribution:** By implementing Bruner's spiral curriculum principle (Veladat & Mohammadi, 2011) as a game mechanic - not a lesson structure - in a Filipino language application aligned to MATATAG Q1-Q2, PAMANA provides empirical evidence on the effectiveness of repetition-based skill development for Gen Alpha Grade 2 Filipino learners. Findings contribute to the growing body of literature on outside-classroom e-learning effectiveness for early Filipino language acquisition under the MATATAG curriculum.

## PART 6: Traceability Matrix

| RRL Finding/Theme                                                                                                                                                                                                                  | Identified Gap                                                                                                                                 | Research Question                                                                                                                               | Proposed Function                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Gen Alpha shows declining Filipino proficiency as English dominates digital communication and home environments; Grade 2 is the critical MATATAG entry point for formal Filipino instruction (Jubahib & Bayani, 2024; DepEd, 2023) | No gamified web-based Filipino language tool aligned to MATATAG Grade 2 Q1-Q2 competencies for outside-classroom self-paced use                | RQ1: Does the Pagsama-Pakinggan-Kilalanin mechanic achieve ≥80% phoneme blending and syllable recognition accuracy across all Q1 syllable sets? | F1: MATATAG Q1-Q2 Aligned Modules; F3: Pamana Trail Progression Lock                        |
| Game-based learning significantly improves Filipino vocabulary acquisition and learner engagement; repetition-based mechanics produce measurable skill improvement (Estomata et al., 2025)                                         | No gamified vocabulary tool exists using a spiral repetition mechanic for MATATAG Grade 2 Q1-Q2 Filipino word domains                          | RQ2: Does the 4-step spiral loop achieve ≥75% per-word mastery accuracy across the 25-word Q1-Q2 vocabulary set?                                | F2: 4-Step Spiral Loop; F4: Hamon ng Pamana Challenge                                       |
| Gamification with progression locks and frequent feedback fosters higher engagement; shorter game segments sustain participation more effectively than longer lessons (Giray & Ballado, 2025)                                      | No game-mechanic progression system designed for self-paced outside-classroom Filipino Q1-Q2 learning at Grade 2 level                         | RQ3: Do gamification elements lead to ≥80% module completion rate among 30 enrolled Grade 2 learners across 4 weeks?                            | F3: Pamana Trail Progression Lock; F5: Hint-First NPC System; F6: Klase Mode Leaderboard    |
| Playful, interactive, technology-based tasks consistently enhance young learners' language motivation; repetition in a game context builds skill automaticity (Lena & Nikolov, 2025; Veladat & Mohammadi, 2011)                    | No repetition-based spiral learning mechanic applied to MATATAG Grade 2 Filipino Q1-Q2 vocabulary in a self-paced web-based format             | RQ3: Do gamification elements lead to ≥80% module completion rate?                                                                              | F2: Spiral Loop; F4: Hamon ng Pamana; F5: Hint-First NPC                                    |
| Parents actively use interactive apps for home-based language learning; parental involvement and progress visibility are critical to sustaining young learners' outside-classroom e-learning routines (Qiu et al., 2025)           | No parent-accessible automated progress dashboard with at-risk indicators exists for MATATAG Grade 2 Q1-Q2 Filipino outside-classroom learning | RQ4: Does the Parent/Guardian Dashboard achieve ≥50% reduction in parental monitoring time vs. paper-based tracking?                            | F7: Parent/Guardian Progress Dashboard with at-risk word indicators and PDF session reports |
| MATATAG Grade 2 Filipino curriculum organizes Q1-Q2 competencies in a spiral progression: Q1 introduces phonics and syllables; Q2 extends to family/home vocabulary and simple sentence forms (DepEd, 2023)                        | No application maps exclusively to MATATAG Grade 2 Q1-Q2 Filipino competencies in a gamified non-quiz format for self-paced use                | RQ1 and RQ2: Do Module 1 syllable and Module 2-3 vocabulary mechanics align to Q1-Q2 competencies as validated by teachers?                     | F1: All 4 Modules (MATATAG Q1-Q2 aligned); F7: Teacher Interview and Dashboard Reports      |
|                                                                                                                                                                                                                                    |                                                                                                                                                |                                                                                                                                                 |                                                                                             |

## PART 7: References

Department of Education (DepEd). (2023). MATATAG K to 10 Curriculum Guide - Filipino, Grades 2-10. Department of Education, Philippines.

Estomata, E. I., Pepito, M. Y. T., & Baluyos, G. R. (2025). Enhancing students' vocabulary in Filipino language using game-based learning. International Journal of Research and Innovation in Social Science.

Giray, A. L., Jr., & Ballado, R. S. (2025). Gamification techniques in enhancing English for elementary level students. Asian Journal of Advanced Research and Reports, 19(4), 176-184.

Jubahib, C. M., & Bayani, R. T. (2024). Filipino language in the mouth of Alpha Gen: A mixed-method research approach. International Journal of Advance Research and Innovative Ideas in Education, 10(3).

Lena, M. S., & Nikolov, M. (2025). Systematic review: Young EFL learners' motivation and task engagement. Sage Open.

Qiu, C., Zhu, R., Islam, M. M., & Al Murshidi, G. (2025). Parents' perceptions on young children's online English learning at home. Journal of Early Childhood Literacy.

Veladat, F., & Mohammadi, F. (2011). Spiral learning teaching method: Stair step of learning. Procedia - Social and Behavioral Sciences, 29, 1523-1528.