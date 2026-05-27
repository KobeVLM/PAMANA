## **Support Features - Parent/Guardian Dashboard and Klase Mode**

### **5.1 Parent/Guardian Dashboard Access**

**User Interface Design**

The Parent Dashboard displays after Parent login: (1) a top header bar with the learner's name and Pamana Trail completion percentage, (2) five MetricCard panels arranged in a 2-column grid: (a) Accuracy Trend per Module (line chart), (b) Mastered vs. Needs-Review Word Count (donut chart), (c) Hamon ng Pamana Pass Rate per Domain, (d) Average Session Duration per Week, (e) Pamana Trail Completion Percentage, (3) a WordMasteryList below the metric cards with color-coded at-risk indicators per word, (4) a session history log, (5) PDF download buttons per completed module. All data loads within ≤5 seconds.

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                                                      | **Component Type / Format**       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| ParentDashboard    | Root parent view. Fetches all 5 metrics from ProgressController on mount. Renders MetricCard grid, WordMasteryList, session history, and PDF download buttons. Subscribes to Supabase Realtime for live updates. | React Functional Component (.jsx) |
| MetricCard         | Reusable card component displaying a single metric with title, value, and optional chart (line/donut). Accepts metric type prop and data array. Renders using recharts or CSS-only for simple values.            | React Functional Component (.jsx) |
| WordMasteryList    | Renders alphabetical list of all introduced vocabulary words with color-coded AtRiskIndicator badge and accuracy percentage per word. Filters to active module domain.                                           | React Functional Component (.jsx) |
| AtRiskIndicator    | Color-coded badge: Green (Mastered ≥75%), Yellow (Developing 50-74%), Red (At-Risk <50% or hamon_fail_count ≥3), Grey (Not Started). Includes accessible text label alongside color for color-blind users.       | React Functional Component (.jsx) |
| AlertBanner        | Renders parent alert notifications for each Red-flagged word: 'Si \[name\] ay nahihirapan sa salitang \[word\]. Subukan ulit!'                                                                                   | React Functional Component (.jsx) |
| PDFDownloadButton  | Disabled when module is_complete=FALSE. On click: triggers GET /api/reports/generate/{userId}/{moduleNumber} as binary file download.                                                                            | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                                     | **Component Type / Format**              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| ProgressController | GET /api/progress/{userId}/dashboard - returns all 5 metrics, word mastery list, and session log in a single composite response. Requires JWT with PARENT role.                                 | Spring Boot @RestController              |
| ProgressService    | Aggregates data from syllable_progress, word_mastery, sentence_progress, hamon_sessions, and session_logs tables. Computes all 5 metric values. Returns DashboardResponse.                      | Spring Boot @Service                     |
| ReportController   | GET /api/reports/generate/{userId}/{moduleNumber} - returns PDF as binary response. Calls ReportService.generateReport().                                                                       | Spring Boot @RestController              |
| ReportService      | Uses Apache PDFBox to generate structured PDF: words mastered count, at-risk words, module completion date, Hamon pass rate, recommended review word list. Returns byte\[\] within ≤10 seconds. | Spring Boot @Service using Apache PDFBox |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface**   | **Key Attributes**                                                                                                                                                                                                                                   | **Key Methods**                                                                                                                                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ProgressService         | syllableProgressRepository: SyllableProgressRepository wordMasteryRepository: WordMasteryRepository sentenceProgressRepository: SentenceProgressRepository hamonSessionRepository: HamonSessionRepository sessionLogRepository: SessionLogRepository | getDashboardMetrics(UUID userId): DashboardResponse computeModuleAccuracyTrend(UUID userId): List&lt;ModuleAccuracy&gt; getWordMasteryList(UUID userId): List&lt;WordMasteryStatus&gt; computeSessionAvgDuration(UUID userId): double |
| ReportService           | reportRepository: ParentReportRepository                                                                                                                                                                                                             | generateReport(UUID userId, int moduleNumber): byte\[\] buildReportContent(UUID userId, int module): ReportData enableModuleReport(UUID userId, int module): void                                                                     |
| DashboardResponse (DTO) | accuracyTrend: List&lt;ModuleAccuracy&gt; masteredCount: int needsReviewCount: int hamonPassRate: double avgSessionDuration: double trailCompletion: double wordMasteryList: List&lt;WordMasteryStatus&gt; sessionHistory: List&lt;SessionLog&gt;    | -                                                                                                                                                                                                                                     |
| ProgressController      | progressService: ProgressService                                                                                                                                                                                                                     | getDashboard(UUID userId): ResponseEntity&lt;DashboardResponse&gt;                                                                                                                                                                    |

**_Sequence Diagram_**

| **Step** | **Actor**          | **Action / Message**                                                                           |
| -------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| 1        | Parent             | Logs in with PARENT role; AuthService reads role; redirect to /dashboard                       |
| 2        | ParentDashboard    | GET /api/progress/{userId}/dashboard with Authorization: Bearer JWT                            |
| 3        | ProgressController | Validates JWT (PARENT role required); delegates to ProgressService.getDashboardMetrics(userId) |
| 4        | ProgressService    | Queries syllable_progress, word_mastery, sentence_progress, hamon_sessions, session_logs       |
| 5        | ProgressService    | Computes 5 metric values; builds DashboardResponse DTO                                         |
| 6        | ProgressController | Returns DashboardResponse with all metrics, word list, and session history                     |
| 7        | ParentDashboard    | Renders MetricCard × 5, WordMasteryList, AlertBanner (if Red words exist), session history     |
| 8        | ParentDashboard    | Subscribes to Supabase Realtime on module_progress table for live updates                      |

**Data Design**

| **Table**      | **Column**       | **Type**             | **Constraints / Notes**                    |
| -------------- | ---------------- | -------------------- | ------------------------------------------ |
| session_logs   | id               | UUID (PK)            | Generated                                  |
| session_logs   | user_id          | UUID (FK → users.id) | NOT NULL                                   |
| session_logs   | started_at       | TIMESTAMPTZ          | NOT NULL                                   |
| session_logs   | ended_at         | TIMESTAMPTZ          | NULLABLE; set on logout or session timeout |
| session_logs   | duration_minutes | INTEGER              | Computed: ended_at - started_at            |
| session_logs   | module_accessed  | INTEGER              | Module number active during the session    |
| parent_reports | user_id          | UUID (FK → users.id) | NOT NULL                                   |
| parent_reports | module_number    | INTEGER              | Report corresponds to this module          |
| parent_reports | generated_at     | TIMESTAMPTZ          | Report generation timestamp                |
| parent_reports | downloaded_at    | TIMESTAMPTZ          | NULLABLE; set when parent downloads        |

### **5.2 At-Risk Word Indicator**

**User Interface Design**

At-Risk indicators are embedded within the WordMasteryList on the Parent Dashboard and are automatically updated in real time via Supabase Realtime. Each vocabulary word row displays: (1) the Filipino word, (2) the AtRiskIndicator badge (Green/Yellow/Red/Grey with text label), (3) the current accuracy percentage. Red-flagged words additionally trigger an AlertBanner notification at the top of the dashboard. Each alert reads: 'Si \[learner name\] ay nahihirapan sa salitang \[word\]. Subukan ulit!'

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                                | **Component Type / Format**       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| AtRiskIndicator    | Stateless presentational component. Accepts status prop (green/yellow/red/grey) and renders corresponding color badge with accessibility text label. Badge min-width 80px for readability. | React Functional Component (.jsx) |
| AlertBanner        | Renders a dismissible banner per Red-flagged word. Banner includes word name and encouragement message for parent. Uses useEffect to re-evaluate when word_mastery data changes.           | React Functional Component (.jsx) |
| WordMasteryList    | Fetches word_mastery list from ProgressController. Re-renders on Supabase Realtime push events targeting word_mastery table.                                                               | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                                           | **Component Type / Format** |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| ProgressService    | evaluateWordRisk(WordMastery wm): applies threshold logic - Green: overall_accuracy ≥75%; Yellow: 50-74%; Red: <50% OR hamon_fail_count ≥3; Grey: word not yet introduced. Returns WordMasteryStatus. | Spring Boot @Service        |
| ProgressController | GET /api/progress/{userId}/words - returns word mastery list with status. Called on Dashboard load and after Realtime push events.                                                                    | Spring Boot @RestController |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface**   | **Key Attributes**                                                                                           | **Key Methods**                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ProgressService         | wordMasteryRepository: WordMasteryRepository                                                                 | evaluateWordRisk(WordMastery wm): WordRiskStatus getWordMasteryList(UUID userId): List&lt;WordMasteryStatus&gt; computeAtRiskWords(UUID userId): List&lt;String&gt; |
| WordMasteryStatus (DTO) | wordId: UUID word: String overallAccuracy: double hamonFailCount: int status: String (green/yellow/red/grey) | -                                                                                                                                                                   |

**_Sequence Diagram_**

| **Step** | **Actor**          | **Action / Message**                                                       |
| -------- | ------------------ | -------------------------------------------------------------------------- |
| 1        | Learner            | Completes any vocabulary spiral step in game                               |
| 2        | VocabularyService  | recordStepAccuracy() → word_mastery updated in Supabase                    |
| 3        | Supabase Realtime  | Pushes UPDATE event on word_mastery table to all subscribed clients        |
| 4        | ParentDashboard    | Receives Realtime event; triggers GET /api/progress/{userId}/words refresh |
| 5        | ProgressController | Calls ProgressService.getWordMasteryList(userId)                           |
| 6        | ProgressService    | For each word_mastery record: calls evaluateWordRisk() to assign status    |
| 7        | ProgressService    | Returns List&lt;WordMasteryStatus&gt; with updated statuses                |
| 8        | WordMasteryList    | Re-renders with updated AtRiskIndicator badges                             |
| 9        | AlertBanner        | For each Red-flagged word: renders alert notification                      |

**Data Design**

| **Table**    | **Column**       | **Type**     | **Constraints / Notes**                                           |
| ------------ | ---------------- | ------------ | ----------------------------------------------------------------- |
| word_mastery | overall_accuracy | DECIMAL(5,2) | ≥75% → Green; 50-74% → Yellow; <50% → Red                         |
| word_mastery | hamon_fail_count | INTEGER      | ≥3 → Red regardless of overall_accuracy                           |
| word_mastery | status           | VARCHAR(10)  | Persisted status after evaluateWordRisk() - green/yellow/red/grey |

### **5.3 PDF Session Report Generation**

**User Interface Design**

The PDF Download button (PDFDownloadButton) appears on the Parent Dashboard for each module. It is grayed-out/disabled while module is_complete=FALSE. When enabled, parent clicks the button, a loading spinner overlays the button, and the PDF downloads automatically within ≤10 seconds. If generation exceeds 10 seconds, an error message appears: 'Report generation failed. Please try again.' The generated PDF contains: PAMANA header, learner name, module name, words mastered count, at-risk words list, module completion date, Hamon ng Pamana pass rate, and a recommended words-to-review table.

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                                                                                                               | **Component Type / Format**       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| PDFDownloadButton  | Checks module is_complete from module_progress. On click: sends GET /api/reports/generate/{userId}/{moduleNumber} with Authorization header. Handles binary blob response and triggers browser download via URL.createObjectURL(). Shows loading spinner and error state. | React Functional Component (.jsx) |
| ParentDashboard    | Renders one PDFDownloadButton per module, passing is_complete state to enable/disable.                                                                                                                                                                                    | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name**     | **Description and Purpose**                                                                                                                                                                                                                                  | **Component Type / Format**                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| ReportController       | GET /api/reports/generate/{userId}/{moduleNumber} - authenticated endpoint (PARENT role). Validates module is_complete=TRUE. Calls ReportService.generateReport(). Sets Content-Type: application/pdf and Content-Disposition: attachment.                   | Spring Boot @RestController                         |
| ReportService          | buildReportContent(userId, moduleNumber): queries word_mastery, syllable_progress or sentence_progress, hamon_sessions, and module_progress. Uses Apache PDFBox PDDocument to construct the PDF with structured layout. Returns byte\[\] within ≤10 seconds. | Spring Boot @Service                                |
| ParentReportRepository | JPA repository for parent_reports table. save() to insert download log record after successful generation.                                                                                                                                                   | Spring Boot JpaRepository&lt;ParentReport, UUID&gt; |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface** | **Key Attributes**                                                                                                                                                                             | **Key Methods**                                                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| ReportService         | wordMasteryRepository: WordMasteryRepository moduleProgressRepository: ModuleProgressRepository hamonSessionRepository: HamonSessionRepository parentReportRepository: ParentReportRepository  | generateReport(UUID userId, int moduleNumber): byte\[\] buildReportContent(UUID userId, int module): ReportData renderPDF(ReportData data): byte\[\] |
| ReportData (DTO)      | learnerName: String moduleName: String completionDate: LocalDate masteredWords: List&lt;String&gt; atRiskWords: List&lt;String&gt; hamonPassRate: double recommendedReview: List&lt;String&gt; | -                                                                                                                                                    |
| ReportController      | reportService: ReportService moduleProgressRepository: ModuleProgressRepository                                                                                                                | generateReport(UUID userId, int moduleNumber): ResponseEntity&lt;byte\[\]&gt;                                                                        |

**_Sequence Diagram_**

| **Step** | **Actor**         | **Action / Message**                                                                  |
| -------- | ----------------- | ------------------------------------------------------------------------------------- |
| 1        | Parent            | Clicks 'Download Report' button for a completed module on ParentDashboard             |
| 2        | PDFDownloadButton | Sends GET /api/reports/generate/{userId}/{moduleNumber} with JWT Authorization header |
| 3        | ReportController  | Validates JWT (PARENT role); checks module_progress is_complete=TRUE for module       |
| 4        | ReportController  | Calls ReportService.generateReport(userId, moduleNumber)                              |
| 5        | ReportService     | Queries word_mastery, hamon_sessions, module_progress for the module                  |
| 6        | ReportService     | Calls buildReportContent() → ReportData DTO                                           |
| 7        | ReportService     | Creates PDFBox PDDocument; adds pages, paragraphs, tables using ReportData            |
| 8        | ReportService     | Closes PDDocument; returns byte\[\] PDF binary                                        |
| 9        | ReportController  | Returns HTTP 200 with Content-Type: application/pdf; Content-Disposition: attachment  |
| 10       | ReportService     | ParentReportRepository.save(new ParentReport(userId, moduleNumber, now()))            |
| 11       | PDFDownloadButton | Receives blob; URL.createObjectURL(blob); triggers browser download                   |

**Data Design**

| **Table**      | **Column**    | **Type**             | **Constraints / Notes**               |
| -------------- | ------------- | -------------------- | ------------------------------------- |
| parent_reports | id            | UUID (PK)            | Generated for each download event     |
| parent_reports | user_id       | UUID (FK → users.id) | Learner whose report was downloaded   |
| parent_reports | module_number | INTEGER              | Module covered by the report (1-4)    |
| parent_reports | generated_at  | TIMESTAMPTZ          | NOT NULL; timestamp of PDF generation |
| parent_reports | downloaded_at | TIMESTAMPTZ          | DEFAULT NOW() on successful download  |

### **5.4 Klase Mode Leaderboard**

**User Interface Design**

The Klase Mode screen displays: (1) a Pamana Trail-themed leaderboard header showing the class Klase name, (2) a ranked list of LeaderboardRow items showing rank number, learner name, current module name, and total modules completed, (3) a live update indicator showing 'Nag-a-update...' when a Supabase Realtime push event is received, (4) for unjoined learners: a 'Sumali sa Klase' prompt with a join code input. The Teacher Dashboard shows an expanded per-learner view with accuracy, Hamon pass rate, and at-risk word flags.

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                                                                   | **Component Type / Format**       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| KlaseLeaderboard   | Fetches leaderboard data for learner's Klase from KlaseController on mount. Subscribes to Supabase Realtime on module_progress table filtered by klase_id. Updates LeaderboardRow list within ≤5 seconds of any member event. | React Functional Component (.jsx) |
| LeaderboardRow     | Presentational row component displaying rank, learner name, current module label, and modules_completed count. Highlights the current learner's row.                                                                          | React Functional Component (.jsx) |
| TeacherDashboard   | Teacher-only read-only view. Loads per-learner detail data for all Klase members: module completion, word accuracy, Hamon pass rate, at-risk flags. Paginated for up to 40 members.                                           | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                                                            | **Component Type / Format** |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| KlaseController    | GET /api/klase/{klaseId}/leaderboard - returns ranked member list sorted by modules_completed DESC. GET /api/klase/{klaseId}/teacher-view - returns detailed per-learner progress for teacher (TEACHER role required). | Spring Boot @RestController |
| KlaseService       | getLeaderboard(klaseId): queries users joined with module_progress, aggregates modules_completed count per user. getTeacherView(klaseId, teacherId): returns detailed per-learner progress data for all Klase members. | Spring Boot @Service        |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface**  | **Key Attributes**                                                                                                                                                             | **Key Methods**                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KlaseService           | klaseRepository: KlaseRepository userRepository: UserRepository moduleProgressRepository: ModuleProgressRepository wordMasteryRepository: WordMasteryRepository                | getLeaderboard(UUID klaseId): List&lt;LeaderboardEntry&gt; getTeacherView(UUID klaseId, UUID teacherId): List&lt;LearnerDetail&gt; validateTeacherOwnership(UUID klaseId, UUID teacherId): boolean |
| LeaderboardEntry (DTO) | rank: int userId: UUID learnerName: String currentModuleName: String modulesCompleted: int                                                                                     | -                                                                                                                                                                                                  |
| LearnerDetail (DTO)    | learnerId: UUID learnerName: String moduleCompletionStatus: List&lt;ModuleStatus&gt; wordMasteryList: List&lt;WordMasteryStatus&gt; hamonPassRate: double atRiskWordCount: int | -                                                                                                                                                                                                  |
| KlaseController        | klaseService: KlaseService                                                                                                                                                     | getLeaderboard(UUID klaseId): ResponseEntity createKlase(CreateKlaseRequest): ResponseEntity getTeacherView(UUID klaseId): ResponseEntity                                                          |

**_Sequence Diagram_**

| **Step** | **Actor**         | **Action / Message**                                                                                  |
| -------- | ----------------- | ----------------------------------------------------------------------------------------------------- |
| 1        | Learner           | Navigates to Klase Mode screen                                                                        |
| 2        | KlaseLeaderboard  | GET /api/klase/{klaseId}/leaderboard - fetches ranked member list                                     |
| 3        | KlaseService      | Queries users WHERE klase_id={klaseId} JOIN module_progress; counts modules_completed; orders DESC    |
| 4        | KlaseController   | Returns List&lt;LeaderboardEntry&gt; ranked by modules_completed                                      |
| 5        | KlaseLeaderboard  | Renders LeaderboardRow list; activates Supabase Realtime subscription on module_progress for klase_id |
| 6        | Another Learner   | Completes a sub-level in their session (any Klase member)                                             |
| 7        | Supabase Realtime | Pushes module_progress UPDATE event to all KlaseLeaderboard subscribers                               |
| 8        | KlaseLeaderboard  | Receives event; re-fetches GET /api/klase/{klaseId}/leaderboard; re-renders within ≤5 seconds         |
| 9        | Teacher           | Navigates to Teacher Dashboard; GET /api/klase/{klaseId}/teacher-view                                 |
| 10       | KlaseService      | Validates teacher ownership; returns LearnerDetail list for all 40 members                            |

**Data Design**

| **Table**       | **Column**  | **Type**              | **Constraints / Notes**                            |
| --------------- | ----------- | --------------------- | -------------------------------------------------- |
| klases          | id          | UUID (PK)             | Identifies the class group                         |
| klases          | join_code   | VARCHAR(6)            | UNIQUE; used to link learners to Klase             |
| klases          | teacher_id  | UUID (FK → users.id)  | TEACHER role; validated in KlaseService            |
| users           | klase_id    | UUID (FK → klases.id) | NULLABLE; set on join; used for leaderboard filter |
| module_progress | user_id     | UUID (FK → users.id)  | Aggregated for leaderboard modules_completed count |
| module_progress | is_complete | BOOLEAN               | Counted in modules_completed aggregation           |