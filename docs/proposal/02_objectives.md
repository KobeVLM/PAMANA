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

