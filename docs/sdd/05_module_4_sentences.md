## **Module 4 - Bumuo ng Pangungusap (Sentence Construction)**

### **4.1 Drag-and-Drop Word Arrangement**

**User Interface Design**

The Sentence Construction screen displays: (1) Lola NPC with 'Ayusin ang mga salita!', (2) an audio button playing the target sentence, (3) a drop zone row at the top with empty labeled slots corresponding to sentence word positions, (4) a pool of scrambled DraggableWordTile components below, (5) a 'Suriin' (Check) button enabled only when all slots are filled. On submit: correct sequence triggers green slot highlights + Lola celebration; incorrect triggers red flash + audio hint replaying the correct sentence. Tap-to-select-and-place is implemented as an alternative to drag-and-drop for accessibility (Grade 2 motor skill support).

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                   | **Component Type / Format**                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| SentenceModule     | Container managing Module 4 tier state (Tier 1 Paturol → Tier 2 Patanong). Fetches sentence tasks from SentenceController. Manages lock/unlock between tiers. | React Functional Component (.jsx)                         |
| WordArrangement    | Main drag-and-drop game component. Manages DraggableWordTile and DroppableSlot state. Validates arrangement on 'Suriin' click. Records result.                | React Functional Component (.jsx)                         |
| DraggableWordTile  | Individual word tile implementing react-dnd useDrag hook. Supports both HTML5 drag-and-drop and tap-to-select-and-place fallback for touchpad/touch users.    | React Functional Component (.jsx) using react-dnd useDrag |
| DroppableSlot      | Individual drop zone slot implementing react-dnd useDrop hook. Displays placeholder or dropped word tile. Supports tap-to-place when a tile is selected.      | React Functional Component (.jsx) using react-dnd useDrop |
| NPCDialogue        | Lola NPC rendering instruction and feedback audio for correct/incorrect arrangement.                                                                          | React Functional Component (.jsx)                         |
| AudioPlayer        | Plays target sentence audio for reference. Tappable for replay.                                                                                               | React Functional Component (.jsx)                         |

**Back-end Component(s)**

| **Component Name**         | **Description and Purpose**                                                                                                                                                                                                                       | **Component Type / Format**                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| SentenceController         | GET /api/sentences/task/{userId}?tier=1 - returns sentence task (words, correct order, audio URL). POST /api/sentences/progress - records attempt result.                                                                                         | Spring Boot @RestController                             |
| SentenceService            | Extends BaseGameService. getSentenceTask(userId, tier): returns next sentence task for the learner's current tier. evaluateSentenceAnswer(userId, taskId, submittedOrder): validates submitted word order against correct order. recordAttempt(). | Spring Boot @Service extends BaseGameService            |
| SentenceProgressRepository | JPA repository for sentence_progress table. findByUserIdAndTier(), save().                                                                                                                                                                        | Spring Boot JpaRepository&lt;SentenceProgress, UUID&gt; |
| ModuleLockService          | Called by SentenceService when Tier 1 (Paturol) ≥75% accuracy to unlock Tier 2 (Patanong). Called when Tier 2 ≥75% to mark Module 4 complete.                                                                                                     | Spring Boot @Service                                    |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface**                   | **Key Attributes**                                                                                                                                    | **Key Methods**                                                                                                                                                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SentenceService extends BaseGameService | sentenceProgressRepository: SentenceProgressRepository moduleLockService: ModuleLockService                                                           | getSentenceTask(UUID userId, int tier): SentenceTaskResponse evaluateSentenceAnswer(UUID userId, UUID taskId, List&lt;String&gt; order): SentenceResultResponse computeTierAccuracy(UUID userId, int tier): double |
| SentenceProgress (Entity)               | id: UUID userId: UUID tier: Integer (1 or 2) taskId: UUID isCorrect: boolean attempts: Integer accuracy: Decimal updatedAt: Timestamp                 | getUserId() getTier() getAccuracy()                                                                                                                                                                                |
| SentenceTaskResponse (DTO)              | taskId: UUID sentenceAudioUrl: String scrambledWords: List&lt;String&gt; correctOrder: List&lt;String&gt; (omitted from frontend response) tier: int  | -                                                                                                                                                                                                                  |
| WordArrangement                         | currentArrangement: List&lt;String&gt; dropZones: List&lt;SlotState&gt; draggedTile: String (nullable) selectedTile: String (nullable - tap fallback) | handleDrop(slotIdx, word): void handleTapSelect(word): void handleTapPlace(slotIdx): void submitArrangement(): void                                                                                                |

**_Sequence Diagram_**

| **Step** | **Actor**          | **Action / Message**                                                                                 |
| -------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| 1        | SentenceModule     | On mount: GET /api/sentences/task/{userId}?tier=1 - fetch sentence task                              |
| 2        | WordArrangement    | Renders scrambled DraggableWordTile pool and empty DroppableSlot row                                 |
| 3        | Learner            | Drags DraggableWordTile to DroppableSlot (or uses tap-to-select-and-place)                           |
| 4        | WordArrangement    | Updates currentArrangement state; enables 'Suriin' when all slots filled                             |
| 5        | Learner            | Clicks 'Suriin'                                                                                      |
| 6        | WordArrangement    | POST /api/sentences/progress { taskId, submittedOrder: \[...\] }                                     |
| 7        | SentenceController | Delegates to SentenceService.evaluateSentenceAnswer()                                                |
| 8        | SentenceService    | Compares submittedOrder to correctOrder; records to sentence_progress via SentenceProgressRepository |
| 9        | SentenceService    | computeTierAccuracy(userId, tier); if ≥75%: ModuleLockService.evaluateAndUnlock()                    |
| 10       | WordArrangement    | Renders green/red feedback; NPCDialogue plays appropriate audio                                      |

**Data Design**

| **Table**         | **Column** | **Type**             | **Constraints / Notes**                                 |
| ----------------- | ---------- | -------------------- | ------------------------------------------------------- |
| sentence_progress | id         | UUID (PK)            | Generated                                               |
| sentence_progress | user_id    | UUID (FK → users.id) | NOT NULL; CASCADE DELETE                                |
| sentence_progress | tier       | INTEGER              | 1 = Paturol (declarative); 2 = Patanong (interrogative) |
| sentence_progress | task_id    | UUID                 | Identifies the sentence task attempted                  |
| sentence_progress | is_correct | BOOLEAN              | TRUE if submitted order matches correct order           |
| sentence_progress | attempts   | INTEGER              | Total attempts for this task                            |
| sentence_progress | accuracy   | DECIMAL(5,2)         | correct_count / attempts × 100 per task                 |
| sentence_progress | updated_at | TIMESTAMPTZ          | DEFAULT NOW()                                           |

### **4.2 NPC Dialogue Completion (Sentence Level)**

**User Interface Design**

The Sentence-Level Dialogue screen displays: (1) Lolo NPC with a multi-word sentence containing one or more blanks using vocabulary words from Modules 2-3, (2) a pool of DraggableWordTile options (only Module 2-3 mastered vocabulary), (3) DroppableSlot placeholders within the NPC speech bubble itself, (4) on correct completion: NPC celebrates with the full sentence audio and a brief transition animation. This integrates vocabulary from Modules 2-3 into sentence-level use, reinforcing cross-module mastery.

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                            | **Component Type / Format**       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| SentenceDialogue   | Extends WordArrangement for sentence-level NPC dialogue integration. The blank is embedded within the NPC speech bubble. Filters word pool to only show learner's mastered vocabulary. | React Functional Component (.jsx) |
| DraggableWordTile  | Reused from 4.1. Word options are filtered to learner's mastered vocabulary_items.                                                                                                     | React Functional Component (.jsx) |
| DroppableSlot      | Reused from 4.1. Embedded within NPCDialogue speech bubble.                                                                                                                            | React Functional Component (.jsx) |
| NPCDialogue        | Renders Lolo NPC with sentence template containing embedded DroppableSlots.                                                                                                            | React Functional Component (.jsx) |
| ReunionEnding      | Special ending screen shown on Module 4 completion: Lola and Lolo reunion animation with congratulations audio for completing the Pamana journey.                                      | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name**    | **Description and Purpose**                                                                                                                                                                             | **Component Type / Format**                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| SentenceController    | GET /api/sentences/dialogue/{userId}?tier={tier} - returns NPC dialogue template with embedded blanks and mastered vocabulary word options. POST /api/sentences/progress records dialogue completion.   | Spring Boot @RestController                        |
| SentenceService       | getSentenceDialogue(userId, tier): builds dialogue task using learner's mastered words as options (queried from word_mastery where status='green'). evaluateSentenceAnswer() reused for dialogue tasks. | Spring Boot @Service extends BaseGameService       |
| WordMasteryRepository | findMasteredByUserId(userId): returns word_mastery records with status='green' for dialogue option filtering.                                                                                           | Spring Boot JpaRepository&lt;WordMastery, UUID&gt; |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface**                   | **Key Attributes**                                                                                                                                 | **Key Methods**                                                                                                                                                                                 |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SentenceService extends BaseGameService | wordMasteryRepository: WordMasteryRepository sentenceProgressRepository: SentenceProgressRepository                                                | getSentenceDialogue(UUID userId, int tier): DialogueTaskResponse getMasteredVocabOptions(UUID userId): List&lt;String&gt; evaluateSentenceAnswer(userId, taskId, order): SentenceResultResponse |
| DialogueTaskResponse (DTO)              | dialogueTemplate: String blankPositions: List&lt;Integer&gt; wordPool: List&lt;String&gt; (mastered vocab only) sentenceAudioUrl: String tier: int | -                                                                                                                                                                                               |

**_Sequence Diagram_**

| **Step** | **Actor**        | **Action / Message**                                                                                 |
| -------- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| 1        | SentenceModule   | Transitions to SentenceDialogue after all WordArrangement tasks in tier are complete                 |
| 2        | SentenceDialogue | GET /api/sentences/dialogue/{userId}?tier=1 - receives template + mastered word pool                 |
| 3        | SentenceService  | WordMasteryRepository.findMasteredByUserId(userId) - fetches all green-status words as options       |
| 4        | Learner          | Drags/taps mastered vocabulary word into blank slot in NPC speech bubble                             |
| 5        | SentenceDialogue | POST /api/sentences/progress with dialogue attempt result                                            |
| 6        | SentenceService  | evaluateSentenceAnswer(); recordAttempt(); computeTierAccuracy()                                     |
| 7        | SentenceModule   | If Module 4 complete (Tier 2 ≥75%): renders ReunionEnding; ModuleLockService marks Module 4 complete |

**Data Design**

| **Table**         | **Column**  | **Type**    | **Constraints / Notes**                    |
| ----------------- | ----------- | ----------- | ------------------------------------------ |
| sentence_progress | tier        | INTEGER     | 1 = Paturol tasks; 2 = Patanong tasks      |
| sentence_progress | task_id     | UUID        | Dialogue task identifier                   |
| word_mastery      | status      | VARCHAR(10) | Filtered to 'green' for dialogue word pool |
| module_progress   | is_complete | BOOLEAN     | Module 4 row set TRUE on Tier 2 ≥75%       |

### **4.3 Sentence Tier Progression Lock and Module 4 Completion**

**User Interface Design**

This is a system-triggered transaction. After Tier 1 (Paturol) tasks reach ≥75% average accuracy, Tier 2 (Patanong) unlocks: Lola announces 'Handa na tayo sa susunod na hamon!'. The PamanaTrail map shows the Tier 2 indicator as active. After both tiers complete at ≥75%, Module 4 completes: the ReunionEnding animation plays, Lola and Lolo celebrate the learner's completion of the full Pamana trail, and the parent PDF download button for Module 4 becomes enabled.

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                             | **Component Type / Format**       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| PamanaTrail        | Updates to reflect Module 4 tier progress. Shows Tier 1 and Tier 2 completion status within Module 4 node. Triggers ReunionEnding on Module 4 complete. | React Functional Component (.jsx) |
| ReunionEnding      | Full-screen celebration animation with Lola and Lolo NPCs for Module 4 and trail completion.                                                            | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                                      | **Component Type / Format**                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| SentenceService    | computeTierAccuracy(userId, tier): calculates average accuracy across all sentence_progress records for the tier. If ≥75%: calls ModuleLockService to unlock Tier 2 (or mark Module 4 complete). | Spring Boot @Service extends BaseGameService |
| ModuleLockService  | evaluateAndUnlock(userId, 4): marks Module 4 is_complete=TRUE. No next module to unlock. Also triggers ReportService to enable Module 4 PDF download.                                            | Spring Boot @Service                         |
| ReportService      | Registers Module 4 report as available for PDF generation when Module 4 is marked complete.                                                                                                      | Spring Boot @Service                         |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface**                   | **Key Attributes**                                                                          | **Key Methods**                                                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| SentenceService extends BaseGameService | sentenceProgressRepository: SentenceProgressRepository moduleLockService: ModuleLockService | computeTierAccuracy(UUID userId, int tier): double evaluateTierCompletion(UUID userId, int tier): TierLockResult                       |
| TierLockResult (DTO)                    | tierComplete: boolean moduleComplete: boolean nextTier: Integer (nullable) message: String  | -                                                                                                                                      |
| ReportService                           | reportRepository: ParentReportRepository moduleProgressRepository: ModuleProgressRepository | enableModuleReport(UUID userId, int moduleNumber): void generateReport(UUID userId, int moduleNumber): byte\[\] (PDF bytes via PDFBox) |

**_Sequence Diagram_**

| **Step** | **Actor**         | **Action / Message**                                                                         |
| -------- | ----------------- | -------------------------------------------------------------------------------------------- |
| 1        | SentenceService   | After each sentence attempt: computeTierAccuracy(userId, 1)                                  |
| 2        | SentenceService   | If Tier 1 average ≥75%: creates sentence_progress tier_complete marker                       |
| 3        | ModuleLockService | Sets sentence_progress Tier 2 is_unlocked=TRUE; SentenceModule enables Patanong tasks        |
| 4        | Lola NPC          | Audio plays: 'Handa na tayo sa susunod na hamon!'                                            |
| 5        | SentenceService   | After Tier 2 tasks: computeTierAccuracy(userId, 2)                                           |
| 6        | SentenceService   | If Tier 2 ≥75%: calls ModuleLockService.evaluateAndUnlock(userId, 4)                         |
| 7        | ModuleLockService | module_progress Module 4 is_complete=TRUE; calls ReportService.enableModuleReport(userId, 4) |
| 8        | SentenceModule    | Renders ReunionEnding celebration screen                                                     |
| 9        | ParentDashboard   | Module 4 PDF Download button becomes enabled                                                 |

**Data Design**

| **Table**         | **Column**    | **Type**             | **Constraints / Notes**                                    |
| ----------------- | ------------- | -------------------- | ---------------------------------------------------------- |
| sentence_progress | tier          | INTEGER              | Tier 1 (Paturol) and Tier 2 (Patanong) tracked separately  |
| sentence_progress | accuracy      | DECIMAL(5,2)         | Per-task accuracy; tier accuracy averaged across all tasks |
| module_progress   | module_number | INTEGER              | 4 = Module 4 (Sentence Construction)                       |
| module_progress   | is_complete   | BOOLEAN              | Set TRUE when Tier 1 and Tier 2 both ≥75%                  |
| parent_reports    | id            | UUID (PK)            | Generated                                                  |
| parent_reports    | user_id       | UUID (FK → users.id) | NOT NULL                                                   |
| parent_reports    | module_number | INTEGER              | Module number for which report is generated                |
| parent_reports    | generated_at  | TIMESTAMPTZ          | Timestamp of PDF generation                                |

