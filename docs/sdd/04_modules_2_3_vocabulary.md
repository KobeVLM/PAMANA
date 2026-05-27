## **Modules 2-3 - Vocabulary Learning (Spiral Loop)**

### **2.1 Word Introduction (Pakinggan Step)**

**User Interface Design**

The Word Introduction screen displays: (1) Lolo NPC with speech bubble 'Pakinggan natin ang bagong salita!', (2) a centered large image tile of the vocabulary word loaded from Supabase Storage, (3) the written Filipino word below the image in large bold text, (4) an audio play button that automatically fires on screen load and is tappable for replay. After audio completes, a 'Susunod' (Next) button appears. No input is required - this is a passive introduction step.

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                                                  | **Component Type / Format**       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| VocabularyModule   | Container managing the 4-step vocabulary spiral loop state (Pakinggan → Kilalanin → Basahin → Gamitin) for the current word. Fetches word data from VocabularyController on mount. Manages step transitions. | React Functional Component (.jsx) |
| WordIntro          | Displays the word image, written label, and auto-plays audio on mount. Shows 'Susunod' button after audio completes. Accepts word object prop from VocabularyModule.                                         | React Functional Component (.jsx) |
| AudioPlayer        | Plays vocabulary word audio from Supabase Storage URL. Called automatically on mount.                                                                                                                        | React Functional Component (.jsx) |
| NPCDialogue        | Lolo NPC rendering word introduction instruction line.                                                                                                                                                       | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name**       | **Description and Purpose**                                                                                                                                                                   | **Component Type / Format**                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| VocabularyController     | GET /api/vocabulary/word/{wordId} - returns vocabulary word data (word, audioUrl, imageUrl, domain). GET /api/vocabulary/next/{userId} - returns next unmastered word in the learner's queue. | Spring Boot @RestController                           |
| VocabularyService        | Extends BaseGameService. getNextWord(userId): queries vocabulary_items joined with word_mastery to find next unmastered word for the learner. Returns VocabularyWordResponse.                 | Spring Boot @Service extends BaseGameService          |
| VocabularyItemRepository | JPA repository for vocabulary_items table. Provides findByDomain() and findUnmasteredByUserId() using native query joining word_mastery.                                                      | Spring Boot JpaRepository&lt;VocabularyItem, UUID&gt; |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface**                     | **Key Attributes**                                                                                                         | **Key Methods**                                                                                                                                                                          |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VocabularyItem (Entity)                   | id: UUID word: String domain: String (self_body / family_home) audioUrl: String imageUrl: String ordinal: Integer          | getId() getWord() getDomain() getAudioUrl() getImageUrl()                                                                                                                                |
| VocabularyService extends BaseGameService | vocabularyItemRepository: VocabularyItemRepository wordMasteryRepository: WordMasteryRepository hamonService: HamonService | getNextWord(UUID userId): VocabularyWordResponse recordStepAccuracy(UUID userId, UUID wordId, String step, double accuracy): WordMasteryResponse checkHamonTrigger(UUID userId): boolean |
| VocabularyController                      | vocabularyService: VocabularyService                                                                                       | getWord(UUID wordId): ResponseEntity getNextWord(UUID userId): ResponseEntity recordProgress(VocabularyProgressRequest): ResponseEntity                                                  |

**_Sequence Diagram_**

| **Step** | **Actor**            | **Action / Message**                                                                               |
| -------- | -------------------- | -------------------------------------------------------------------------------------------------- |
| 1        | VocabularyModule     | On mount: GET /api/vocabulary/next/{userId} to determine next word                                 |
| 2        | VocabularyService    | Queries VocabularyItemRepository.findUnmasteredByUserId(userId) - returns word with lowest mastery |
| 3        | VocabularyController | Returns VocabularyWordResponse { wordId, word, audioUrl, imageUrl, domain }                        |
| 4        | WordIntro            | Renders word image and label; AudioPlayer.play(audioUrl) fires automatically                       |
| 5        | Learner              | Listens to audio; may tap AudioPlayer to replay; clicks 'Susunod'                                  |
| 6        | VocabularyModule     | Transitions to Step 2 (Kilalanin - ImageMatch)                                                     |

**Data Design**

| **Table**        | **Column**       | **Type**                        | **Constraints / Notes**                          |
| ---------------- | ---------------- | ------------------------------- | ------------------------------------------------ |
| vocabulary_items | id               | UUID (PK)                       | Generated                                        |
| vocabulary_items | word             | VARCHAR(50)                     | NOT NULL; the Filipino vocabulary word           |
| vocabulary_items | domain           | VARCHAR(20)                     | CHECK IN ('self_body','family_home')             |
| vocabulary_items | audio_url        | TEXT                            | Supabase Storage URL for native speaker audio    |
| vocabulary_items | image_url        | TEXT                            | Supabase Storage URL for word illustration       |
| vocabulary_items | ordinal          | INTEGER                         | NOT NULL; defines word introduction order        |
| word_mastery     | id               | UUID (PK)                       | Generated                                        |
| word_mastery     | user_id          | UUID (FK → users.id)            | NOT NULL; CASCADE DELETE                         |
| word_mastery     | vocab_item_id    | UUID (FK → vocabulary_items.id) | NOT NULL                                         |
| word_mastery     | overall_accuracy | DECIMAL(5,2)                    | Computed across all 4 spiral steps               |
| word_mastery     | hamon_fail_count | INTEGER                         | DEFAULT 0; incremented on Hamon fail             |
| word_mastery     | status           | VARCHAR(10)                     | green / yellow / red / grey - computed indicator |
| word_mastery     | last_updated     | TIMESTAMPTZ                     | DEFAULT NOW()                                    |

### **2.2 Audio-to-Image Matching (Kilalanin Step)**

**User Interface Design**

The Kilalanin step screen displays: (1) Lolo NPC with 'Kilalanin! Alin ang larawan?', (2) a large audio play button playing the target word, (3) a 2×2 OptionGrid showing 4 word images (target + 3 distractors from the same domain), (4) no written words - audio only. On correct: green image highlight + Lolo confirmation. On incorrect: audio replays and incorrect image flashes red.

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                        | **Component Type / Format**       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| ImageMatch         | Manages audio-to-image matching step. Loads 4 image URLs (1 target + 3 distractors from VocabularyController). Renders image OptionGrid. Handles selection and accuracy recording. | React Functional Component (.jsx) |
| AudioPlayer        | Plays target word audio. Fires auto on step load. Tappable for replay.                                                                                                             | React Functional Component (.jsx) |
| OptionGrid         | 2×2 image tile grid with feedback color state. Images loaded from Supabase Storage URLs.                                                                                           | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name**   | **Description and Purpose**                                                                                                                                                                             | **Component Type / Format**                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| VocabularyController | GET /api/vocabulary/match/{wordId}?step=kilalanin - returns target word image URL and 3 distractor image URLs from same domain. POST /api/vocabulary/progress - records step accuracy.                  | Spring Boot @RestController                  |
| VocabularyService    | getMatchOptions(wordId, 'kilalanin'): selects 3 distractor vocab items from same domain, shuffles, returns image URLs. recordStepAccuracy(userId, wordId, 'kilalanin', accuracy): updates word_mastery. | Spring Boot @Service extends BaseGameService |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface**                     | **Key Attributes**                                                                              | **Key Methods**                                                                                                                                                                                                          |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| VocabularyService extends BaseGameService | vocabularyItemRepository: VocabularyItemRepository wordMasteryRepository: WordMasteryRepository | getMatchOptions(UUID wordId, String step): MatchOptionsResponse recordStepAccuracy(UUID userId, UUID wordId, String step, double accuracy): WordMasteryResponse computeOverallAccuracy(UUID userId, UUID wordId): double |
| MatchOptionsResponse (DTO)                | targetWordId: UUID targetImageUrl: String distractors: List&lt;DistractorOption&gt;             | -                                                                                                                                                                                                                        |

**_Sequence Diagram_**

| **Step** | **Actor**         | **Action / Message**                                                                                   |
| -------- | ----------------- | ------------------------------------------------------------------------------------------------------ |
| 1        | VocabularyModule  | Transitions to Kilalanin step after WordIntro 'Susunod' is clicked                                     |
| 2        | ImageMatch        | GET /api/vocabulary/match/{wordId}?step=kilalanin - fetches 4 image options                            |
| 3        | VocabularyService | VocabularyItemRepository.findByDomain(domain, exclude=wordId, limit=3) for distractors; shuffles all 4 |
| 4        | Learner           | AudioPlayer auto-plays word; learner selects image from OptionGrid                                     |
| 5        | ImageMatch        | POST /api/vocabulary/progress { userId, wordId, step:'kilalanin', correct, accuracy }                  |
| 6        | VocabularyService | recordStepAccuracy() - updates word_mastery kilalanin_accuracy; recomputes overall_accuracy            |
| 7        | VocabularyModule  | On correct: transitions to Basahin step (Step 3)                                                       |

**Data Design**

| **Table**    | **Column**       | **Type**     | **Constraints / Notes**                               |
| ------------ | ---------------- | ------------ | ----------------------------------------------------- |
| word_mastery | vocab_item_id    | UUID (FK)    | Links to the vocabulary word being practiced          |
| word_mastery | overall_accuracy | DECIMAL(5,2) | Recomputed after each step as rolling average         |
| word_mastery | status           | VARCHAR(10)  | Updated to green/yellow/red based on overall_accuracy |

### **2.3 Audio-to-Written Matching (Basahin Step)**

**User Interface Design**

The Basahin step screen displays: (1) Lolo NPC with 'Basahin! Alin ang tamang salita?', (2) word image of the target word shown at top center (context), (3) a large audio button playing the target word, (4) a 2×2 OptionGrid showing 4 written Filipino word options (target + 3 distractors). On correct: green tile highlight + Lolo confirmation 'Tama! Mabasa mo na ito!'. On incorrect: audio hint replays.

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                    | **Component Type / Format**       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| WordSelect         | Manages audio-to-written word selection. Renders word image for context, audio playback, and OptionGrid with 4 written Filipino words. Handles selection and records accuracy. | React Functional Component (.jsx) |
| AudioPlayer        | Plays word audio. Auto-fires on step load.                                                                                                                                     | React Functional Component (.jsx) |
| OptionGrid         | 2×2 grid of written word tile buttons with feedback state.                                                                                                                     | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name**   | **Description and Purpose**                                                                                                                    | **Component Type / Format**                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| VocabularyController | GET /api/vocabulary/match/{wordId}?step=basahin - returns 4 written word options (strings). POST /api/vocabulary/progress with step='basahin'. | Spring Boot @RestController                  |
| VocabularyService    | getMatchOptions(wordId, 'basahin'): returns target word string + 3 distractor word strings from same domain.                                   | Spring Boot @Service extends BaseGameService |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface**                     | **Key Attributes**                                                    | **Key Methods**                                                                                                                            |
| ----------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| VocabularyService extends BaseGameService | vocabularyItemRepository: VocabularyItemRepository                    | getMatchOptions(UUID wordId, 'basahin'): MatchOptionsResponse recordStepAccuracy(userId, wordId, 'basahin', accuracy): WordMasteryResponse |
| MatchOptionsResponse (DTO)                | targetWordId: UUID targetWord: String distractors: List&lt;String&gt; | -                                                                                                                                          |

**_Sequence Diagram_**

| **Step** | **Actor**         | **Action / Message**                                                           |
| -------- | ----------------- | ------------------------------------------------------------------------------ |
| 1        | VocabularyModule  | Transitions to Basahin step after Kilalanin correct response                   |
| 2        | WordSelect        | GET /api/vocabulary/match/{wordId}?step=basahin - 4 written word options       |
| 3        | Learner           | Hears audio; sees word image for context; selects written word from OptionGrid |
| 4        | WordSelect        | POST /api/vocabulary/progress { step:'basahin', correct, accuracy }            |
| 5        | VocabularyService | recordStepAccuracy() → word_mastery updated; overall_accuracy recomputed       |
| 6        | VocabularyModule  | On correct: transitions to Gamitin step (Step 4)                               |

**Data Design**

| **Table**        | **Column**       | **Type**     | **Constraints / Notes**                    |
| ---------------- | ---------------- | ------------ | ------------------------------------------ |
| vocabulary_items | word             | VARCHAR(50)  | Used as written word options in OptionGrid |
| vocabulary_items | domain           | VARCHAR(20)  | Distractors selected from same domain      |
| word_mastery     | overall_accuracy | DECIMAL(5,2) | Updated after Basahin accuracy recorded    |

### **2.4 NPC Dialogue Completion (Gamitin Step)**

**User Interface Design**

The Gamitin step screen displays: (1) Lolo NPC with a speech bubble containing a sentence with one blank (e.g., 'Ang akin ay \_\_\_\_\_.') with a speaker icon on the NPC bubble to hear the full sentence audio, (2) the correct vocabulary word audio plays as a hint when the speaker icon is tapped, (3) a 1×3 or 1×2 tile row of written word options below the NPC, (4) the learner taps the correct word to complete Lolo's dialogue. On correct: NPC bubble fills with the completed sentence + celebration audio. On incorrect: NPC audio replays the cue sentence.

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                     | **Component Type / Format**       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| DialogueComplete   | Manages NPC dialogue completion step. Renders NPC speech bubble with blank sentence, word options, and handles word selection to fill the blank. Records accuracy on selection. | React Functional Component (.jsx) |
| NPCDialogue        | Renders Lolo NPC character, animated speech bubble with blank sentence text, and audio playback for the full dialogue cue and completion confirmation.                          | React Functional Component (.jsx) |
| OptionGrid         | 1-row tile options for word selection within the dialogue context.                                                                                                              | React Functional Component (.jsx) |
| AudioPlayer        | Plays NPC dialogue cue audio and the word hint audio on speaker icon tap.                                                                                                       | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name**   | **Description and Purpose**                                                                                                                                                                         | **Component Type / Format**                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| VocabularyController | GET /api/vocabulary/gamitin/{wordId} - returns the dialogue template sentence, blank position, correct word, and 2 distractor words. POST /api/vocabulary/progress with step='gamitin'.             | Spring Boot @RestController                  |
| VocabularyService    | getGamitinDialogue(wordId): returns DialogueResponse with sentence template and options. After correct Gamitin: marks word as mastered (status='green' tentative). Calls checkHamonTrigger(userId). | Spring Boot @Service extends BaseGameService |
| HamonService         | Checks if mastered word count mod 5 == 0 (Hamon ng Pamana trigger condition). Generates Hamon session if triggered.                                                                                 | Spring Boot @Service                         |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface**                     | **Key Attributes**                                                                                               | **Key Methods**                                                                                                                                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VocabularyService extends BaseGameService | hamonService: HamonService wordMasteryRepository: WordMasteryRepository                                          | getGamitinDialogue(UUID wordId): DialogueResponse recordStepAccuracy(userId, wordId, 'gamitin', accuracy): WordMasteryResponse markWordMastered(UUID userId, UUID wordId): void checkHamonTrigger(UUID userId): boolean |
| HamonService                              | hamonSessionRepository: HamonSessionRepository wordMasteryRepository: WordMasteryRepository                      | shouldTriggerHamon(UUID userId): boolean generateHamonSession(UUID userId): HamonSession recordHamonResult(UUID hamonSessionId, Map&lt;UUID,Double&gt; results): void                                                   |
| DialogueResponse (DTO)                    | sentence: String blankPosition: int correctWord: String distractors: List&lt;String&gt; dialogueAudioUrl: String | -                                                                                                                                                                                                                       |

**_Sequence Diagram_**

| **Step** | **Actor**            | **Action / Message**                                                                             |
| -------- | -------------------- | ------------------------------------------------------------------------------------------------ |
| 1        | VocabularyModule     | Transitions to Gamitin step after Basahin correct response                                       |
| 2        | DialogueComplete     | GET /api/vocabulary/gamitin/{wordId} - receives sentence template and options                    |
| 3        | Learner              | Reads/hears dialogue cue; selects correct word from options                                      |
| 4        | DialogueComplete     | POST /api/vocabulary/progress { step:'gamitin', correct, accuracy }                              |
| 5        | VocabularyService    | recordStepAccuracy() → word_mastery updated; overall_accuracy recomputed                         |
| 6        | VocabularyService    | If all 4 steps ≥75% average: markWordMastered(userId, wordId)                                    |
| 7        | VocabularyService    | checkHamonTrigger(userId): HamonService.shouldTriggerHamon() - count mastered words mod 5        |
| 8        | HamonService         | If trigger: generateHamonSession(userId) - creates hamon_sessions record with all mastered words |
| 9        | VocabularyController | Returns WordMasteryResponse { mastered: true, hamonTriggered: true/false }                       |
| 10       | VocabularyModule     | If hamonTriggered: routes to HamonChallenge; else: loads next word (Step 1 of next word)         |

**Data Design**

| **Table**      | **Column**   | **Type**             | **Constraints / Notes**                    |
| -------------- | ------------ | -------------------- | ------------------------------------------ |
| word_mastery   | status       | VARCHAR(10)          | Set to 'green' when all 4 steps avg ≥75%   |
| hamon_sessions | id           | UUID (PK)            | Generated                                  |
| hamon_sessions | user_id      | UUID (FK → users.id) | NOT NULL                                   |
| hamon_sessions | triggered_at | TIMESTAMPTZ          | DEFAULT NOW()                              |
| hamon_sessions | word_ids     | UUID\[\]             | Array of all mastered word IDs to retest   |
| hamon_sessions | pass_rate    | DECIMAL(5,2)         | NULLABLE; computed after session completes |
| hamon_sessions | is_complete  | BOOLEAN              | DEFAULT FALSE                              |

### **2.5 Hamon ng Pamana (Vocabulary Review Challenge)**

**User Interface Design**

The Hamon ng Pamana screen displays: (1) a special challenge banner with Lola announcing 'Handa ka na ba sa Hamon ng Pamana?', (2) a sequence of Gamitin-format dialogue tasks (NPC dialogue completion) for every previously mastered word in shuffled order, (3) a progress counter showing (current/total words), (4) a results screen at the end showing pass rate, mastered count, and words re-queued for review. Words scoring below 60% are flagged Red and re-queued.

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                                                                 | **Component Type / Format**       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| HamonChallenge     | Top-level Hamon screen. Fetches the active hamon_session from HamonService. Iterates through all mastered words using DialogueComplete tasks. Tracks per-word accuracy in local state. Submits results batch on completion. | React Functional Component (.jsx) |
| HamonResults       | Displays Hamon completion summary: pass rate, mastered words count, re-queued words count (Red indicators), and a list of at-risk words for parent dashboard notification.                                                  | React Functional Component (.jsx) |
| DialogueComplete   | Reused for each word in the Hamon challenge sequence.                                                                                                                                                                       | React Functional Component (.jsx) |
| NPCDialogue        | Lola NPC for Hamon-specific instruction and result announcement audio.                                                                                                                                                      | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name**    | **Description and Purpose**                                                                                                                                                                                      | **Component Type / Format**                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| VocabularyController  | POST /api/hamon/results/{sessionId} - accepts batch result map of { wordId: accuracy } for all words in the Hamon session.                                                                                       | Spring Boot @RestController                        |
| HamonService          | recordHamonResult(hamonSessionId, results): iterates word results, updates word_mastery.hamon_fail_count for words <60%, updates word_mastery.status, computes pass_rate, marks hamon_sessions.is_complete=TRUE. | Spring Boot @Service                               |
| WordMasteryRepository | JPA repository for word_mastery table. findByUserIdAndVocabItemId(), findAllByUserId(), save().                                                                                                                  | Spring Boot JpaRepository&lt;WordMastery, UUID&gt; |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface**     | **Key Attributes**                                                                                        | **Key Methods**                                                                                                                                                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HamonService              | hamonSessionRepository: HamonSessionRepository wordMasteryRepository: WordMasteryRepository               | shouldTriggerHamon(UUID userId): boolean generateHamonSession(UUID userId): HamonSession recordHamonResult(UUID sessionId, Map&lt;UUID,Double&gt; results): HamonResultResponse computePassRate(Map&lt;UUID,Double&gt; results): double |
| HamonSession (Entity)     | id: UUID userId: UUID wordIds: UUID\[\] passRate: Decimal isComplete: boolean triggeredAt: Timestamp      | getId() getWordIds() setPassRate(double) setIsComplete(boolean)                                                                                                                                                                         |
| HamonResultResponse (DTO) | passRate: double masteredCount: int reQueuedWords: List&lt;String&gt; atRiskWords: List&lt;WordStatus&gt; | -                                                                                                                                                                                                                                       |

**_Sequence Diagram_**

| **Step** | **Actor**        | **Action / Message**                                                                       |
| -------- | ---------------- | ------------------------------------------------------------------------------------------ |
| 1        | HamonChallenge   | On mount: GET /api/hamon/session/{userId} - fetches active hamon_session with word list    |
| 2        | HamonChallenge   | Renders DialogueComplete for Word 1 (shuffled order)                                       |
| 3        | Learner          | Completes Gamitin dialogue task for each word in sequence                                  |
| 4        | HamonChallenge   | Accumulates { wordId: accuracy } map in local state per word                               |
| 5        | HamonChallenge   | After last word: POST /api/hamon/results/{sessionId} with full results map                 |
| 6        | HamonService     | Iterates results: for words accuracy <60%: word_mastery.hamon_fail_count++; status = 'red' |
| 7        | HamonService     | Updates word_mastery.status for all words based on hamon result                            |
| 8        | HamonService     | Computes pass_rate; updates hamon_sessions.pass_rate, is_complete=TRUE                     |
| 9        | HamonChallenge   | Renders HamonResults screen with pass_rate, re-queued words list                           |
| 10       | VocabularyModule | Returns to vocabulary word queue; re-queued words inserted at front of queue               |

**Data Design**

| **Table**      | **Column**       | **Type**     | **Constraints / Notes**                                       |
| -------------- | ---------------- | ------------ | ------------------------------------------------------------- |
| hamon_sessions | word_ids         | UUID\[\]     | All mastered word IDs at time of trigger; shuffled in service |
| hamon_sessions | pass_rate        | DECIMAL(5,2) | Computed: words ≥60% / total words × 100                      |
| hamon_sessions | is_complete      | BOOLEAN      | TRUE after recordHamonResult() completes                      |
| word_mastery   | hamon_fail_count | INTEGER      | Incremented when word scores <60% in any Hamon session        |
| word_mastery   | status           | VARCHAR(10)  | Re-evaluated after each Hamon: green/yellow/red/grey          |

