## **User Management**

### **SF.1 Learner Account Registration**

**User Interface Design**

The Registration screen presents a vertically centered card layout with: (1) PAMANA logo and heading, (2) an InputField for learner name, (3) an InputField for email, (4) a password InputField with show/hide toggle, (5) an optional InputField for Klase join code with tooltip, (6) a primary 'Magrehistro' submit button, and (7) a link to the Login page. A LoadingSpinner overlays the card during API calls. Error messages appear inline below each field. On successful registration, Lola NPC audio plays the welcome message.

**Front-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                  | **Component Type / Format**       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| RegisterPage       | Top-level page component orchestrating the registration flow. Manages form state (name, email, password, joinCode) and dispatches registration actions via AuthContext.      | React Functional Component (.jsx) |
| AuthContext        | React Context providing authentication state (user, role, JWT) and auth actions (register, login, logout) to the entire component tree. Wraps Axios API client calls.             | React Context + Provider (.jsx)   |
| InputField         | Reusable labeled input component supporting text, email, password, and optional validation state (error, success) with accessible ARIA labels. Minimum 44×44px touch target. | React Functional Component (.jsx) |
| LoadingSpinner     | Full-card overlay spinner displayed during async API calls to prevent duplicate submissions.                                                                                 | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                                                                                         | **Component Type / Format**                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| AuthController     | REST controller exposing POST /api/auth/register. Validates request body, delegates to AuthService, returns 201 Created with user record or 400/409 on error.                                                       | Spring Boot @RestController                  |
| AuthService        | Business logic for user registration: calls Spring Security JWT Authentication to create the auth account, inserts the users record, initializes 4 module_progress rows (Module 1 unlocked), and optionally links a Klase via join code. | Spring Boot @Service                         |
| UserRepository     | JPA repository for the users table. Provides save(), findByEmail(), and findByKlaseId() operations.                                                                                                                 | Spring Boot JpaRepository&lt;User, UUID&gt;  |
| KlaseRepository    | JPA repository for the klases table. Provides findByJoinCode() used during optional Klase linking at registration.                                                                                                  | Spring Boot JpaRepository&lt;Klase, UUID&gt; |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface** | **Key Attributes**                                                                                                                                | **Key Methods**                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User (Entity)         | id: UUID name: String email: String role: Role (enum: LEARNER, PARENT, TEACHER) klaseId: UUID (nullable) createdAt: Timestamp                     | getId() getRole() getKlaseId() setKlaseId(UUID)                                                                                                                                 |
| AuthController        | - (stateless)                                                                                                                                     | register(RegisterRequest): ResponseEntity&lt;UserResponse&gt; login(LoginRequest): ResponseEntity&lt;AuthResponse&gt;                                                           |
| AuthService           | jwtTokenProvider: JwtTokenProvider, passwordEncoder: BCryptPasswordEncoder userRepository: UserRepository klaseRepository: KlaseRepository moduleProgressRepository: ModuleProgressRepository | createAccount(RegisterRequest): UserResponse initializeModuleProgress(UUID userId): void linkKlase(UUID userId, String joinCode): void authenticate(LoginRequest): AuthResponse |
| RegisterRequest (DTO) | name: String email: String password: String joinCode: String (optional)                                                                           | validate(): boolean                                                                                                                                                             |

**_Sequence Diagram_**

| **Step** | **Actor**        | **Action / Message**                                                          |
| -------- | ---------------- | ----------------------------------------------------------------------------- |
| 1        | Parent / Learner | Fills RegisterPage form and clicks 'Magrehistro'                              |
| 2        | RegisterPage     | Calls AuthContext.register(name, email, password, joinCode)                   |
| 3        | AuthContext      | Sends POST /api/auth/register to AuthController                               |
| 4        | AuthController   | Validates RegisterRequest DTO, delegates to AuthService.createAccount()       |
| 5        | AuthService      | Hashes password using BCryptPasswordEncoder; generates a new local user UUID |
| 6        | AuthService      | Calls UserRepository.save(new User(uuid, name, email, role))                 |
| 7        | AuthService      | Calls initializeModuleProgress(userId) - inserts 4 module_progress rows       |
| 8        | AuthService      | If joinCode present: KlaseRepository.findByJoinCode(code) → User.setKlaseId() |
| 9        | AuthController   | Returns HTTP 201 with UserResponse                                            |
| 10       | AuthContext      | Stores JWT in session; redirects learner to /trail                            |
| 11       | Pamana Trail     | Lola NPC plays welcome audio                                                  |

**Data Design**

| **Table**       | **Column**    | **Type**                           | **Constraints / Notes**                    |
| --------------- | ------------- | ---------------------------------- | ------------------------------------------ |
| users           | id            | UUID (PK)                          | Generated locally using standard UUID generator |
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
| AuthContext        | Handles Spring Boot local auth API (/api/auth/login)(), reads user role from users table, stores JWT in session context, and triggers role-based routing. | React Context + Provider (.jsx)   |
| InputField         | Reusable labeled input. Used for email and password fields with validation feedback.                                                          | React Functional Component (.jsx) |
| LoadingSpinner     | Overlay spinner displayed during async authentication call.                                                                                   | React Functional Component (.jsx) |

**Back-end Component(s)**

| **Component Name** | **Description and Purpose**                                                                                                                      | **Component Type / Format**                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| AuthController     | Exposes POST /api/auth/login. Validates credentials, returns JWT and user role. On invalid credentials returns HTTP 401.                         | Spring Boot @RestController                 |
| AuthService        | Authenticates credentials using Spring Security local AuthenticationManager. Generates local JWT token on successful authentication. Returns AuthResponse (JWT + role). | Spring Boot @Service                        |
| UserRepository     | Provides findByEmail() and findById() for post-authentication role lookup.                                                                       | Spring Boot JpaRepository&lt;User, UUID&gt; |

**Object-Oriented Components**

**_Class Diagram_**

| **Class / Interface** | **Key Attributes**                                            | **Key Methods**                                                                                                       |
| --------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| AuthController        | - (stateless)                                                 | register(RegisterRequest): ResponseEntity&lt;UserResponse&gt; login(LoginRequest): ResponseEntity&lt;AuthResponse&gt; |
| AuthService           | jwtTokenProvider: JwtTokenProvider, passwordEncoder: BCryptPasswordEncoder userRepository: UserRepository | authenticate(LoginRequest): AuthResponse getUserRole(UUID userId): Role                                               |
| LoginRequest (DTO)    | email: String password: String                                | validate(): boolean                                                                                                   |
| AuthResponse (DTO)    | jwt: String role: Role userId: UUID                           | -                                                                                                                     |

**_Sequence Diagram_**

| **Step** | **Actor**      | **Action / Message**                                                                  |
| -------- | -------------- | ------------------------------------------------------------------------------------- |
| 1        | User           | Enters email and password on LoginPage; clicks 'Mag-login'                            |
| 2        | LoginPage      | Calls AuthContext.login(email, password)                                              |
| 3        | AuthContext    | Calls Spring Boot local auth API (/api/auth/login)({email, password})                             |
| 4        | AuthController | Delegates credential validation to AuthService.authenticate()                         |
| 5        | AuthService    | Authenticates credentials via local AuthenticationManager; generates JWT token        |
| 6        | AuthController | Returns AuthResponse (jwt, role, userId)                                              |
| 7        | AuthContext    | Stores JWT and role in session state                                                  |
| 8        | React Router   | Redirects: role=LEARNER → /trail \| role=PARENT → /dashboard \| role=TEACHER → /klase |

**Data Design**

| **Table** | **Column** | **Type**     | **Constraints / Notes**                   |
| --------- | ---------- | ------------ | ----------------------------------------- |
| users     | id         | UUID (PK)    | Primary key (locally generated UUID)      |
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

