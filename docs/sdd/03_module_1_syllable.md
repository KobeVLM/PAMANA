## **Module 1 - Pakinggan at Kilalanin (Syllable Recognition)**

### **1.1 Pagsama (Phoneme Blending)**

**User Interface Design**

The Pagsama screen displays: (1) Lola NPC character on the left with speech bubble 'Pakinggan at Pagsamahin!', (2) two audio play buttons (consonant and vowel separately) at the top center, (3) a 2×2 grid of syllable tile OptionGrid buttons below (e.g., BA, BE, BI, BO), (4) a progress indicator showing current set and overall accuracy. Correct selection triggers a green highlight and Lola's confirmation audio. Incorrect selection triggers a red flash and hint replay. An AudioPlayer retry button is visible at all times.

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                                                                | **Component Type / Format**       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| SyllableModule     | Container component managing the active Module 1 sub-level state. Routes between PagsamaGame, PakingganGame, KilalanGame, and RhymingGame based on sub-level progress. Fetches sub-level status from Spring Boot on mount. | React Functional Component (.jsx) |
| PagsamaGame        | Game component for phoneme blending. Loads consonant/vowel audio pairs, renders OptionGrid with 4 syllable tiles, handles selection, records accuracy, and triggers next set on 3/4 correct.                               | React Functional Component (.jsx) |
| AudioPlayer        | Reusable audio playback component using Web Audio API. Accepts an audioUrl prop from Supabase Storage. Shows retry button on playback failure.                                                                             | React Functional Component (.jsx) |
| OptionGrid         | Reusable 2×2 or 2×2 option button grid. Accepts options array and onSelect callback. Applies green/red feedback CSS classes on selection result. Minimum 44×44px per tile.                                                 | React Functional Component (.jsx) |
| NPCDialogue        | Renders Lola or Lolo NPC sprite with animated speech bubble containing the instruction text and audio cue. Accepts npcLine and audioUrl props.                                                                             | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name**         | **Description and Purpose**                                                                                                                                                                                            | **Component Type / Format**                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| SyllableController         | Exposes POST /api/syllables/progress (record attempt) and GET /api/syllables/status/{userId} (fetch current sub-level and set status). Also exposes POST /api/syllables/evaluate/{userId} (Module 1 completion check). | Spring Boot @RestController                             |
| SyllableService            | Extends BaseGameService. Implements evaluateAnswer(userId, subLevel, setId, selectedSyllable): records accuracy in syllable_progress. Implements computeModuleAccuracy(userId): averages all sub-level accuracies.     | Spring Boot @Service extends BaseGameService            |
| BaseGameService            | Abstract service providing shared game logic: recordAttempt(), computeAccuracy(), and evaluateThreshold(). All module-specific services extend this class.                                                             | Spring Boot abstract @Service                           |
| SyllableProgressRepository | JPA repository for syllable_progress table. Provides findByUserIdAndSubLevel(), findAllByUserId(), and save().                                                                                                         | Spring Boot JpaRepository&lt;SyllableProgress, UUID&gt; |
| ModuleLockService          | Evaluates module completion and updates module_progress.is_unlocked for the next module. Called by all game services after accuracy threshold is met.                                                                  | Spring Boot @Service                                    |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface**                   | **Key Attributes**                                                                                                                 | **Key Methods**                                                                                                                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BaseGameService (abstract)              | moduleProgressRepository: ModuleProgressRepository moduleLockService: ModuleLockService                                            | recordAttempt(userId, data): void computeAccuracy(List&lt;AttemptRecord&gt;): double evaluateThreshold(userId, moduleNum): boolean                                       |
| SyllableService extends BaseGameService | syllableProgressRepository: SyllableProgressRepository                                                                             | evaluateAnswer(userId, subLevel, setId, answer): SyllableProgressResponse computeModuleAccuracy(userId): double evaluateModule1Completion(userId): void                  |
| SyllableProgress (Entity)               | id: UUID userId: UUID subLevel: String (pagsama/pakinggan/kilalanin/rhyming) setId: Integer accuracy: Decimal updatedAt: Timestamp | getUserId() getSubLevel() getAccuracy() setAccuracy(double)                                                                                                              |
| SyllableController                      | syllableService: SyllableService                                                                                                   | recordProgress(SyllableProgressRequest): ResponseEntity getStatus(UUID userId): ResponseEntity&lt;SyllableStatusResponse&gt; evaluateModule(UUID userId): ResponseEntity |

**_Sequence Diagram_**

| **Step** | **Actor**          | **Action / Message**                                                                                              |
| -------- | ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| 1        | Learner            | Hears consonant + vowel audio; selects syllable tile in OptionGrid                                                |
| 2        | PagsamaGame        | Calls onSelect(selectedTile); evaluates correct/incorrect locally for immediate UI feedback                       |
| 3        | PagsamaGame        | Sends POST /api/syllables/progress { userId, subLevel:'pagsama', setId, selected, correct, accuracy }             |
| 4        | SyllableController | Receives request; validates JWT; delegates to SyllableService.evaluateAnswer()                                    |
| 5        | SyllableService    | Calls BaseGameService.recordAttempt() to persist to syllable_progress via SyllableProgressRepository              |
| 6        | SyllableService    | Checks if set complete (3/4 correct); if yes, unlocks next consonant group                                        |
| 7        | SyllableService    | Calls computeModuleAccuracy(userId); if ≥80% all sub-levels: calls ModuleLockService.evaluateAndUnlock(userId, 1) |
| 8        | ModuleLockService  | Updates module_progress set is_unlocked=TRUE where module_number=2 and user_id=userId                             |
| 9        | SyllableController | Returns SyllableProgressResponse (nextSet, moduleAccuracy, module2Unlocked)                                       |
| 10       | PagsamaGame        | Updates UI - next set loads or Module 1 complete screen shown                                                     |

**Data Design**

| **Table**         | **Column**    | **Type**             | **Constraints / Notes**                                |
| ----------------- | ------------- | -------------------- | ------------------------------------------------------ |
| syllable_progress | id            | UUID (PK)            | Generated                                              |
| syllable_progress | user_id       | UUID (FK → users.id) | NOT NULL; CASCADE DELETE                               |
| syllable_progress | sub_level     | VARCHAR(20)          | CHECK IN ('pagsama','pakinggan','kilalanin','rhyming') |
| syllable_progress | set_id        | INTEGER              | NOT NULL; identifies consonant/syllable group          |
| syllable_progress | attempts      | INTEGER              | NOT NULL; DEFAULT 0                                    |
| syllable_progress | correct_count | INTEGER              | NOT NULL; DEFAULT 0                                    |
| syllable_progress | accuracy      | DECIMAL(5,2)         | Computed: correct_count / attempts × 100               |
| syllable_progress | updated_at    | TIMESTAMPTZ          | DEFAULT NOW(); updated on each attempt                 |

### **1.2 Pakinggan (Syllable Recognition)**

**User Interface Design**

The Pakinggan screen displays: (1) Lola NPC with speech bubble 'Pakinggan!', (2) a single large audio play button showing a speaker icon that plays the target syllable, (3) a 2×2 OptionGrid of written syllable tiles, (4) accuracy progress bar. Correct: green tile highlight + Lola confirmation. Incorrect: red flash + syllable replays automatically as hint. Audio retry button always visible.

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                                                          | **Component Type / Format**       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| PakingganGame      | Loads syllable audio from Supabase Storage, renders OptionGrid with 4 written syllable options. Handles selection result, records accuracy, and advances set on 3/4 correct. Requires Pagsama sub-level is complete. | React Functional Component (.jsx) |
| AudioPlayer        | Plays the target syllable audio from Supabase Storage URL. Retry button on failure.                                                                                                                                  | React Functional Component (.jsx) |
| OptionGrid         | 2×2 grid of written syllable tile buttons with feedback color state.                                                                                                                                                 | React Functional Component (.jsx) |
| NPCDialogue        | Lola NPC with 'Pakinggan!' instruction audio and speech bubble.                                                                                                                                                      | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name**         | **Description and Purpose**                                                                                                 | **Component Type / Format**                  |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| SyllableController         | POST /api/syllables/progress with subLevel='pakinggan'. Same endpoint as Pagsama, sub-level differentiated by request body. | Spring Boot @RestController                  |
| SyllableService            | evaluateAnswer() called with subLevel='pakinggan'. Records to syllable_progress. Reuses BaseGameService.computeAccuracy().  | Spring Boot @Service extends BaseGameService |
| SyllableProgressRepository | findByUserIdAndSubLevel('pakinggan') used to check pre-condition (Pagsama ≥80%) before rendering.                           | Spring Boot JpaRepository                    |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface**                   | **Key Attributes**                                     | **Key Methods**                                                                                                            |
| --------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| SyllableService extends BaseGameService | syllableProgressRepository: SyllableProgressRepository | evaluateAnswer(userId, 'pakinggan', setId, answer): SyllableProgressResponse checkPreCondition(userId, 'pagsama'): boolean |
| SyllableProgress (Entity)               | subLevel: String setId: Integer accuracy: Decimal      | Same entity reused across all 4 sub-levels                                                                                 |

**_Sequence Diagram_**

| **Step** | **Actor**       | **Action / Message**                                                                                |
| -------- | --------------- | --------------------------------------------------------------------------------------------------- |
| 1        | SyllableModule  | On mount: GET /api/syllables/status/{userId} - confirms Pagsama ≥80% before rendering PakingganGame |
| 2        | Learner         | Clicks audio play button; hears target syllable; selects written syllable from OptionGrid           |
| 3        | PakingganGame   | Evaluates selection locally; applies green/red feedback immediately                                 |
| 4        | PakingganGame   | POST /api/syllables/progress { subLevel:'pakinggan', setId, accuracy }                              |
| 5        | SyllableService | recordAttempt() → SyllableProgressRepository.save()                                                 |
| 6        | SyllableService | If set complete (3/4 correct): unlocks next syllable set                                            |
| 7        | SyllableService | computeModuleAccuracy() - if ≥80% all sub-levels: ModuleLockService.evaluateAndUnlock(userId, 1)    |

**Data Design**

| **Table**         | **Column** | **Type**     | **Constraints / Notes**                                |
| ----------------- | ---------- | ------------ | ------------------------------------------------------ |
| syllable_progress | sub_level  | VARCHAR(20)  | Value: 'pakinggan' for this transaction                |
| syllable_progress | set_id     | INTEGER      | Identifies the syllable set within Pakinggan sub-level |
| syllable_progress | accuracy   | DECIMAL(5,2) | Updated after each set completion                      |

### **1.3 Kilalanin (Syllable in Word Identification)**

**User Interface Design**

The Kilalanin screen displays: (1) Lola NPC with 'Kilalanin ang unang pantig!', (2) a large audio play button playing a complete Filipino word, (3) a 2×2 OptionGrid of 4 written syllable options representing possible starting syllables, (4) accuracy progress. On correct answer, Lola highlights the starting syllable with audio 'Tama! Ang unang pantig ay \[syllable\]!' On incorrect: audio replays the word with emphasis on the starting syllable.

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                   | **Component Type / Format**       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| KilalanGame        | Loads word audio from Supabase Storage. Renders OptionGrid with 4 starting-syllable choices. Handles selection and accuracy recording. Requires Pakinggan sub-level complete. | React Functional Component (.jsx) |
| AudioPlayer        | Plays the complete word audio. On incorrect: replays with starting-syllable emphasis audio.                                                                                   | React Functional Component (.jsx) |
| OptionGrid         | 4-tile option grid for syllable selection.                                                                                                                                    | React Functional Component (.jsx) |
| NPCDialogue        | Lola NPC rendering instruction and confirmation lines.                                                                                                                        | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                           | **Component Type / Format**                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| SyllableController | POST /api/syllables/progress with subLevel='kilalanin'.                                                                                               | Spring Boot @RestController                  |
| SyllableService    | evaluateAnswer() with subLevel='kilalanin'. Also provides GET /api/syllables/words/{setId} to fetch word audio URLs and correct syllable for the set. | Spring Boot @Service extends BaseGameService |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface**                   | **Key Attributes**                                                           | **Key Methods**                                                                                                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SyllableService extends BaseGameService | syllableProgressRepository: SyllableProgressRepository                       | evaluateAnswer(userId, 'kilalanin', setId, answer): SyllableProgressResponse getWordSet(setId): WordSetResponse checkPreCondition(userId, 'pakinggan'): boolean |
| WordSetResponse (DTO)                   | wordAudioUrl: String correctSyllable: String distractors: List&lt;String&gt; | -                                                                                                                                                               |

**_Sequence Diagram_**

| **Step** | **Actor**       | **Action / Message**                                                              |
| -------- | --------------- | --------------------------------------------------------------------------------- |
| 1        | SyllableModule  | Confirms Pakinggan ≥80% via GET /api/syllables/status/{userId}; loads KilalanGame |
| 2        | KilalanGame     | GET /api/syllables/words/{setId} - receives word audio URL and 4 syllable options |
| 3        | Learner         | Clicks audio play; hears word; selects starting syllable from OptionGrid          |
| 4        | KilalanGame     | POST /api/syllables/progress { subLevel:'kilalanin', setId, selected, accuracy }  |
| 5        | SyllableService | recordAttempt() → SyllableProgressRepository.save()                               |
| 6        | SyllableService | If ≥80% average across Kilalanin sets: sub-level marked complete; Rhyming unlocks |

**Data Design**

| **Table**         | **Column** | **Type**     | **Constraints / Notes**                               |
| ----------------- | ---------- | ------------ | ----------------------------------------------------- |
| syllable_progress | sub_level  | VARCHAR(20)  | Value: 'kilalanin'                                    |
| syllable_progress | set_id     | INTEGER      | Each set is one Filipino word with 4 syllable options |
| syllable_progress | accuracy   | DECIMAL(5,2) | Updated per set completion                            |

### **1.4 Rhyming Word Recognition**

**User Interface Design**

The Rhyming screen displays: (1) Lola NPC with 'Magkatunog ba?', (2) audio buttons for Word 1 and Word 2 played sequentially with visual cues, (3) two large buttons: 'Oo' (Yes) and 'Hindi' (No) filling the lower portion of the screen, (4) a 30-second auto-replay timer if no selection is made. On correct: green button highlight + celebration audio. On incorrect: audio replays both words with emphasis on word endings.

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                                   | **Component Type / Format**       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| RhymingGame        | Manages the rhyming word pair sequence. Loads two word audio files, plays them in sequence on mount. Renders two large Yes/No buttons. Handles 30-second timeout auto-replay. Records result. | React Functional Component (.jsx) |
| AudioPlayer        | Used twice (Word 1, Word 2). Supports sequential playback callback chain.                                                                                                                     | React Functional Component (.jsx) |
| NPCDialogue        | Lola NPC rendering 'Magkatunog ba?' and feedback audio for correct/incorrect.                                                                                                                 | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                  | **Component Type / Format**                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| SyllableController | POST /api/syllables/progress with subLevel='rhyming'. GET /api/syllables/rhyming/{setId} returns word pair audio URLs and isRhyming boolean. | Spring Boot @RestController                  |
| SyllableService    | evaluateAnswer() for rhyming. Compares learner boolean selection to isRhyming. computes accuracy.                                            | Spring Boot @Service extends BaseGameService |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface**                   | **Key Attributes**                                             | **Key Methods**                                                                                                        |
| --------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| SyllableService extends BaseGameService | syllableProgressRepository: SyllableProgressRepository         | evaluateRhymingAnswer(userId, setId, selectedYes): SyllableProgressResponse getRhymingPair(setId): RhymingPairResponse |
| RhymingPairResponse (DTO)               | word1AudioUrl: String word2AudioUrl: String isRhyming: boolean | -                                                                                                                      |

**_Sequence Diagram_**

| **Step** | **Actor**       | **Action / Message**                                                                            |
| -------- | --------------- | ----------------------------------------------------------------------------------------------- |
| 1        | SyllableModule  | Confirms Kilalanin ≥80%; loads RhymingGame                                                      |
| 2        | RhymingGame     | GET /api/syllables/rhyming/{setId} - receives word pair audio URLs                              |
| 3        | RhymingGame     | Plays Word 1 audio then Word 2 audio sequentially via AudioPlayer                               |
| 4        | Learner         | Clicks 'Oo' or 'Hindi' before 30-second timeout; if timeout, audio auto-replays                 |
| 5        | RhymingGame     | POST /api/syllables/progress { subLevel:'rhyming', setId, selectedYes, accuracy }               |
| 6        | SyllableService | evaluateRhymingAnswer() compares selection to isRhyming; records result                         |
| 7        | SyllableService | computeModuleAccuracy(); if ≥80% all sub-levels: ModuleLockService.evaluateAndUnlock(userId, 1) |

**Data Design**

| **Table**         | **Column** | **Type**     | **Constraints / Notes**    |
| ----------------- | ---------- | ------------ | -------------------------- |
| syllable_progress | sub_level  | VARCHAR(20)  | Value: 'rhyming'           |
| syllable_progress | set_id     | INTEGER      | Each set is one word pair  |
| syllable_progress | accuracy   | DECIMAL(5,2) | Updated per set completion |

### **1.5 Module 1 Progression Lock Evaluation**

**User Interface Design**

This is a system-triggered transaction with no dedicated UI screen. After each sub-level completion, the Pamana Trail map automatically updates the Module 1 progress ring. If Module 2 unlocks, an animated sequence plays: Lola announces 'Magaling! Buksan na natin ang Hardin!' and the Module 2 trail node visually unlocks with a particle animation. The progress ring on Module 1 fills to 100% green.

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                     | **Component Type / Format**       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| PamanaTrail        | Renders the visual trail map. Listens to module_progress state from SyllableModule. On Module 2 unlock event: plays unlock animation and Lola audio, enables Module 2 node tap. | React Functional Component (.jsx) |
| NPCDialogue        | Plays Lola unlock audio 'Magaling! Buksan na natin ang Hardin!' on Module 2 unlock event.                                                                                       | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                              | **Component Type / Format**                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| SyllableController | POST /api/syllables/evaluate/{userId} - dedicated endpoint triggering Module 1 completion evaluation. Also called implicitly after each sub-level by SyllableService.                    | Spring Boot @RestController                  |
| SyllableService    | computeModuleAccuracy(userId): averages all syllable_progress records. If ≥80%: delegates to ModuleLockService.                                                                          | Spring Boot @Service extends BaseGameService |
| ModuleLockService  | evaluateAndUnlock(userId, completedModuleNumber): sets is_unlocked=TRUE on module_number=completedModuleNumber+1 in module_progress. Also sets is_complete=TRUE on the completed module. | Spring Boot @Service                         |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface**   | **Key Attributes**                                                                                | **Key Methods**                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ModuleLockService       | moduleProgressRepository: ModuleProgressRepository                                                | evaluateAndUnlock(UUID userId, int completedModule): ModuleLockResult unlockNextModule(UUID userId, int nextModule): void markModuleComplete(UUID userId, int module): void |
| ModuleLockResult (DTO)  | moduleUnlocked: boolean nextModuleNumber: int message: String                                     | -                                                                                                                                                                           |
| ModuleProgress (Entity) | id: UUID userId: UUID moduleNumber: int isUnlocked: boolean isComplete: boolean accuracy: Decimal | getIsUnlocked() setIsUnlocked(boolean) setIsComplete(boolean)                                                                                                               |

**_Sequence Diagram_**

| **Step** | **Actor**          | **Action / Message**                                                            |
| -------- | ------------------ | ------------------------------------------------------------------------------- |
| 1        | SyllableService    | After recording any sub-level attempt: calls computeModuleAccuracy(userId)      |
| 2        | SyllableService    | Queries SyllableProgressRepository.findAllByUserId() for all sub-level records  |
| 3        | SyllableService    | Computes average accuracy across all 4 sub-levels and all sets                  |
| 4        | SyllableService    | If average ≥80%: calls ModuleLockService.evaluateAndUnlock(userId, 1)           |
| 5        | ModuleLockService  | Calls markModuleComplete(userId, 1) - module_progress Module 1 is_complete=TRUE |
| 6        | ModuleLockService  | Calls unlockNextModule(userId, 2) - module_progress Module 2 is_unlocked=TRUE   |
| 7        | SyllableController | Returns ModuleLockResult { moduleUnlocked: true, nextModuleNumber: 2 }          |
| 8        | PamanaTrail        | Receives unlock response; plays Lola audio and trail unlock animation           |

**Data Design**

| **Table**       | **Column**    | **Type**             | **Constraints / Notes**                       |
| --------------- | ------------- | -------------------- | --------------------------------------------- |
| module_progress | user_id       | UUID (FK → users.id) | NOT NULL                                      |
| module_progress | module_number | INTEGER              | 1 = Module 1 (Syllable Recognition)           |
| module_progress | is_complete   | BOOLEAN              | Set TRUE when avg accuracy ≥80%               |
| module_progress | is_unlocked   | BOOLEAN              | Module 2 row: set TRUE when Module 1 complete |
| module_progress | accuracy      | DECIMAL(5,2)         | Final computed Module 1 accuracy stored       |

