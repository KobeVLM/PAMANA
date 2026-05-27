**CEBU INSTITUTE OF TECHNOLOGY - UNIVERSITY**

**COLLEGE OF COMPUTER STUDIES**

_Software Design Description_

_for_

**PAMANA**

_A Gamified Filipino Language Learning Application_

_for Grade 2 Learners_

Document Version: 1.1

Published Date: May 25, 2026

Prepared by: PAMANA Team (Team 33)

**Change History**

| **Version** | **Date**     | **Author**  | **Description**                                                               |
| ----------- | ------------ | ----------- | ----------------------------------------------------------------------------- |
| 1.0         | May 2026     | PAMANA Team | Initial SDD document creation                                                 |
| 1.1         | May 25, 2026 | PAMANA Team | Completed all module detailed designs, OO components, and data design schemas |

**Preface**

This Software Design Description (SDD) provides a complete specification of the architectural and detailed design for PAMANA - a gamified Filipino language learning application for Grade 2 learners aligned with the MATATAG Q1-Q2 curriculum. The document is organized according to the approved SDD template and translates all functional and non-functional requirements defined in the PAMANA Software Requirements Specifications (SRS v1.2) into concrete design artifacts.

The design specifications in this document shall be strictly followed during the implementation phase. Groups implementing PAMANA shall ensure a proper and honest translation of this SDD into code - particularly through a real object-oriented implementation using appropriate OOP principles, consistent with the class hierarchies, interfaces, and service patterns defined in Section 3 (Detailed Design).

# **Detailed Design**

This section provides the detailed design for each module and transaction in PAMANA. For each transaction, the following artifacts are provided: User Interface Design, Front-end Component(s), Back-end Component(s), Object-Oriented Components (Class Diagram and Sequence Diagram), and Data Design.

## **User Management**

### **SF.1 Learner Account Registration**

**User Interface Design**

The Registration screen presents a vertically centered card layout with: (1) PAMANA logo and heading, (2) an InputField for learner name, (3) an InputField for email, (4) a password InputField with show/hide toggle, (5) an optional InputField for Klase join code with tooltip, (6) a primary 'Magrehistro' submit button, and (7) a link to the Login page. A LoadingSpinner overlays the card during API calls. Error messages appear inline below each field. On successful registration, Lola NPC audio plays the welcome message.

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                  | **Component Type / Format**       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| RegisterPage       | Top-level page component orchestrating the registration flow. Manages form state (name, email, password, joinCode) and dispatches registration actions via AuthContext.      | React Functional Component (.jsx) |
| AuthContext        | React Context providing authentication state (user, role, JWT) and auth actions (register, login, logout) to the entire component tree. Wraps supabase-js calls.             | React Context + Provider (.jsx)   |
| InputField         | Reusable labeled input component supporting text, email, password, and optional validation state (error, success) with accessible ARIA labels. Minimum 44×44px touch target. | React Functional Component (.jsx) |
| LoadingSpinner     | Full-card overlay spinner displayed during async API calls to prevent duplicate submissions.                                                                                 | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                                                         | **Component Type / Format**                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| AuthController     | REST controller exposing POST /api/auth/register. Validates request body, delegates to AuthService, returns 201 Created with user record or 400/409 on error.                                                       | Spring Boot @RestController                  |
| AuthService        | Business logic for user registration: calls Supabase Auth to create the auth account, inserts the users record, initializes 4 module_progress rows (Module 1 unlocked), and optionally links a Klase via join code. | Spring Boot @Service                         |
| UserRepository     | JPA repository for the users table. Provides save(), findByEmail(), and findByKlaseId() operations.                                                                                                                 | Spring Boot JpaRepository&lt;User, UUID&gt;  |
| KlaseRepository    | JPA repository for the klases table. Provides findByJoinCode() used during optional Klase linking at registration.                                                                                                  | Spring Boot JpaRepository&lt;Klase, UUID&gt; |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface** | **Key Attributes**                                                                                                                                | **Key Methods**                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User (Entity)         | id: UUID name: String email: String role: Role (enum: LEARNER, PARENT, TEACHER) klaseId: UUID (nullable) createdAt: Timestamp                     | getId() getRole() getKlaseId() setKlaseId(UUID)                                                                                                                                 |
| AuthController        | - (stateless)                                                                                                                                     | register(RegisterRequest): ResponseEntity&lt;UserResponse&gt; login(LoginRequest): ResponseEntity&lt;AuthResponse&gt;                                                           |
| AuthService           | supabaseClient: SupabaseClient userRepository: UserRepository klaseRepository: KlaseRepository moduleProgressRepository: ModuleProgressRepository | createAccount(RegisterRequest): UserResponse initializeModuleProgress(UUID userId): void linkKlase(UUID userId, String joinCode): void authenticate(LoginRequest): AuthResponse |
| RegisterRequest (DTO) | name: String email: String password: String joinCode: String (optional)                                                                           | validate(): boolean                                                                                                                                                             |

**_Sequence Diagram_**

| **Step** | **Actor**        | **Action / Message**                                                          |
| -------- | ---------------- | ----------------------------------------------------------------------------- |
| 1        | Parent / Learner | Fills RegisterPage form and clicks 'Magrehistro'                              |
| 2        | RegisterPage     | Calls AuthContext.register(name, email, password, joinCode)                   |
| 3        | AuthContext      | Sends POST /api/auth/register to AuthController                               |
| 4        | AuthController   | Validates RegisterRequest DTO, delegates to AuthService.createAccount()       |
| 5        | AuthService      | Calls Supabase Auth API to create auth account; receives user UUID            |
| 6        | AuthService      | Calls UserRepository.save(new User(uuid, name, email, LEARNER))               |
| 7        | AuthService      | Calls initializeModuleProgress(userId) - inserts 4 module_progress rows       |
| 8        | AuthService      | If joinCode present: KlaseRepository.findByJoinCode(code) → User.setKlaseId() |
| 9        | AuthController   | Returns HTTP 201 with UserResponse                                            |
| 10       | AuthContext      | Stores JWT in session; redirects learner to /trail                            |
| 11       | Pamana Trail     | Lola NPC plays welcome audio                                                  |

**Data Design**

| **Table**       | **Column**    | **Type**                           | **Constraints / Notes**                    |
| --------------- | ------------- | ---------------------------------- | ------------------------------------------ |
| users           | id            | UUID (PK)                          | Generated; references Supabase auth.users  |
| users           | name          | VARCHAR(100)                       | NOT NULL                                   |
| users           | email         | VARCHAR(255)                       | NOT NULL, UNIQUE                           |
| users           | role          | ENUM('learner','parent','teacher') | NOT NULL; DEFAULT 'learner'                |
| users           | klase_id      | UUID (FK → klases.id)              | NULLABLE                                   |
| users           | created_at    | TIMESTAMPTZ                        | DEFAULT NOW()                              |
| module_progress | id            | UUID (PK)                          | Generated                                  |
| module_progress | user_id       | UUID (FK → users.id)               | NOT NULL; CASCADE DELETE                   |
| module_progress | module_number | INTEGER (1-4)                      | NOT NULL                                   |
| module_progress | is_unlocked   | BOOLEAN                            | Module 1: TRUE; Modules 2-4: FALSE on init |
| module_progress | is_complete   | BOOLEAN                            | DEFAULT FALSE                              |
| module_progress | accuracy      | DECIMAL(5,2)                       | NULLABLE; updated on completion            |

### **SF.2 User Login**

**User Interface Design**

The Login screen presents a centered card with: (1) PAMANA logo, (2) email InputField, (3) password InputField with show/hide toggle, (4) 'Mag-login' submit button, (5) link to registration. A LoadingSpinner overlays during authentication. On success, role-based redirect occurs: Learner → /trail, Parent → /dashboard, Teacher → /klase. Error messages appear inline for incorrect credentials.

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                   | **Component Type / Format**       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| LoginPage          | Page component managing login form state and calling AuthContext.login(). Displays inline error messages and loading state.                   | React Functional Component (.jsx) |
| AuthContext        | Handles supabase.auth.signInWithPassword(), reads user role from users table, stores JWT in session context, and triggers role-based routing. | React Context + Provider (.jsx)   |
| InputField         | Reusable labeled input. Used for email and password fields with validation feedback.                                                          | React Functional Component (.jsx) |
| LoadingSpinner     | Overlay spinner displayed during async authentication call.                                                                                   | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                      | **Component Type / Format**                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| AuthController     | Exposes POST /api/auth/login. Validates credentials, returns JWT and user role. On invalid credentials returns HTTP 401.                         | Spring Boot @RestController                 |
| AuthService        | Delegates authentication to Supabase Auth via supabase-js. Reads role from users table after successful auth. Returns AuthResponse (JWT + role). | Spring Boot @Service                        |
| UserRepository     | Provides findByEmail() and findById() for post-authentication role lookup.                                                                       | Spring Boot JpaRepository&lt;User, UUID&gt; |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface** | **Key Attributes**                                            | **Key Methods**                                                                                                       |
| --------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| AuthController        | - (stateless)                                                 | register(RegisterRequest): ResponseEntity&lt;UserResponse&gt; login(LoginRequest): ResponseEntity&lt;AuthResponse&gt; |
| AuthService           | supabaseClient: SupabaseClient userRepository: UserRepository | authenticate(LoginRequest): AuthResponse getUserRole(UUID userId): Role                                               |
| LoginRequest (DTO)    | email: String password: String                                | validate(): boolean                                                                                                   |
| AuthResponse (DTO)    | jwt: String role: Role userId: UUID                           | -                                                                                                                     |

**_Sequence Diagram_**

| **Step** | **Actor**      | **Action / Message**                                                                  |
| -------- | -------------- | ------------------------------------------------------------------------------------- |
| 1        | User           | Enters email and password on LoginPage; clicks 'Mag-login'                            |
| 2        | LoginPage      | Calls AuthContext.login(email, password)                                              |
| 3        | AuthContext    | Calls supabase.auth.signInWithPassword({email, password})                             |
| 4        | Supabase Auth  | Validates credentials; returns JWT if valid; error if invalid                         |
| 5        | AuthContext    | Sends POST /api/auth/login with JWT to verify role from Spring Boot                   |
| 6        | AuthController | Calls AuthService.getUserRole(userId) via UserRepository.findById()                   |
| 7        | AuthController | Returns AuthResponse (jwt, role, userId)                                              |
| 8        | AuthContext    | Stores JWT and role in session state                                                  |
| 9        | React Router   | Redirects: role=LEARNER → /trail \| role=PARENT → /dashboard \| role=TEACHER → /klase |

**Data Design**

| **Table** | **Column** | **Type**     | **Constraints / Notes**                   |
| --------- | ---------- | ------------ | ----------------------------------------- |
| users     | id         | UUID (PK)    | References Supabase auth.users.id         |
| users     | role       | ENUM         | Read during login for role-based redirect |
| users     | email      | VARCHAR(255) | Used for login lookup                     |

### **SF.3 Teacher Klase Creation**

**User Interface Design**

After Teacher login, the Klase Dashboard presents a 'Gumawa ng Klase' button. Clicking it opens a CreateKlaseModal overlay with: (1) a text InputField for Klase name, (2) a 'Gumawa' submit button, (3) a cancel button. On success, the modal transitions to a JoinCodeDisplay view showing the unique 6-character alphanumeric code in a large copyable box with a 'Kopyahin' button, and confirms the Klase was created. The Teacher Dashboard below shows 0 enrolled members.

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                     | **Component Type / Format**       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| CreateKlaseModal   | Modal overlay component managing Klase name input and form submission via KlaseController API call. On success, transitions to JoinCodeDisplay. | React Functional Component (.jsx) |
| JoinCodeDisplay    | Read-only display of the generated 6-character join code in a highlighted box. Includes a one-click clipboard copy button.                      | React Functional Component (.jsx) |
| TeacherDashboard   | Root teacher view showing the active Klase, enrolled member list, and per-learner progress summary. Hosts CreateKlaseModal.                     | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                          | **Component Type / Format**                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| KlaseController    | Exposes POST /api/klase (create Klase) and GET /api/klase/{id}/members. Returns created Klase record with join code.                                 | Spring Boot @RestController                  |
| KlaseService       | Generates unique 6-character alphanumeric join code (retries on collision). Inserts klases record. Provides getKlaseMembers() for teacher dashboard. | Spring Boot @Service                         |
| KlaseRepository    | JPA repository for the klases table. Provides save(), findByJoinCode(), and findByTeacherId().                                                       | Spring Boot JpaRepository&lt;Klase, UUID&gt; |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface** | **Key Attributes**                                                                   | **Key Methods**                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Klase (Entity)        | id: UUID joinCode: String (6-char) teacherId: UUID name: String createdAt: Timestamp | getId() getJoinCode() getTeacherId()                                                                                                              |
| KlaseController       | - (stateless)                                                                        | createKlase(CreateKlaseRequest): ResponseEntity&lt;KlaseResponse&gt; getMembers(UUID klaseId): ResponseEntity&lt;List<MemberSummary&gt;>          |
| KlaseService          | klaseRepository: KlaseRepository userRepository: UserRepository                      | createKlase(UUID teacherId, String name): KlaseResponse generateUniqueJoinCode(): String getKlaseMembers(UUID klaseId): List&lt;MemberSummary&gt; |

**_Sequence Diagram_**

| **Step** | **Actor**        | **Action / Message**                                                 |
| -------- | ---------------- | -------------------------------------------------------------------- |
| 1        | Teacher          | Opens CreateKlaseModal; enters Klase name; clicks 'Gumawa'           |
| 2        | CreateKlaseModal | Sends POST /api/klase with { name, teacherId } to KlaseController    |
| 3        | KlaseController  | Validates request; delegates to KlaseService.createKlase()           |
| 4        | KlaseService     | Calls generateUniqueJoinCode() - produces random 6-char alphanumeric |
| 5        | KlaseService     | Checks KlaseRepository.findByJoinCode(code) - if collision, retries  |
| 6        | KlaseService     | Calls KlaseRepository.save(new Klase(teacherId, name, joinCode))     |
| 7        | KlaseController  | Returns KlaseResponse with generated join code                       |
| 8        | CreateKlaseModal | Transitions to JoinCodeDisplay showing the join code                 |

**Data Design**

| **Table** | **Column** | **Type**             | **Constraints / Notes**        |
| --------- | ---------- | -------------------- | ------------------------------ |
| klases    | id         | UUID (PK)            | Generated                      |
| klases    | join_code  | VARCHAR(6)           | NOT NULL; UNIQUE               |
| klases    | teacher_id | UUID (FK → users.id) | NOT NULL; role must be TEACHER |
| klases    | name       | VARCHAR(100)         | NOT NULL                       |
| klases    | created_at | TIMESTAMPTZ          | DEFAULT NOW()                  |

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