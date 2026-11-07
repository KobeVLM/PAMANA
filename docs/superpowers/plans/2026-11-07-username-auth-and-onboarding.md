# Username Authentication, Character Gender & Friendly Onboarding Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transition authentication from email-based to username-based for all users (learners and parents), introduce an English-language themed "Create Your Adventurer" onboarding popup where users pick both their character gender (Boy / Girl) and their display name, and add a placeholder email field in the settings page.

**Architecture Overview:**
- **Database:** Flyway migration `V2__add_username_and_gender_to_users.sql` adding `username VARCHAR(50) UNIQUE` and `gender VARCHAR(20) DEFAULT 'Lalaki'` to `users`, backfilling existing accounts, and making `email` nullable.
- **Backend Auth:** Update `User`, `UserRepository`, `LoginRequest`, `RegisterRequest`, `UserResponse`, `AuthService`, and `AuthController` to authenticate via `username` and persist `gender`. Add `PUT /api/auth/profile` for updating display name and gender. Update `JwtTokenProvider` to encode `username` in token subject.
- **Frontend Auth & Onboarding Modal:** Update `AuthContext` with username login and profile update. Build `AdventurerOnboardingModal.tsx` displaying character selection cards (👦 Boy with `/images/M_User.png` vs 👧 Girl with `/images/F_User.png`) and the name input in one cohesive, kid-friendly English dialog.
- **Support for Pre-Provisioned Users:** `AppShell.tsx` detects if a logged-in user has not completed onboarding (e.g., name is blank or placeholder), popping up the modal immediately so accounts prepared beforehand seamlessly guide the user through character/name setup.
- **Settings UI:** Update `SettingsPage.tsx` to display Username, Name, Role, sync character changes to backend, and provide an inert placeholder for Email ("Optional / Coming Soon").

---

## File Structure & Responsibilities

| File Path | Responsibility |
|---|---|
| `backend/src/main/resources/db/migration/V2__add_username_and_gender_to_users.sql` | Flyway migration: adds `username` and `gender`, makes `email` nullable, handles backfill. |
| `backend/src/main/java/com/pamana/auth/User.java` | JPA entity: adds `username` and `gender` fields, relaxes `email` constraint. |
| `backend/src/main/java/com/pamana/auth/UserRepository.java` | Spring Data repository: `findByUsername`, `existsByUsername`. |
| `backend/src/main/java/com/pamana/auth/dto/LoginRequest.java` | DTO: receives `username` and `password`. |
| `backend/src/main/java/com/pamana/auth/dto/RegisterRequest.java` | DTO: receives `username`, optional `name`, `password`, `role`, optional `gender`. |
| `backend/src/main/java/com/pamana/auth/dto/UpdateProfileRequest.java` | DTO: receives `name` and optional `gender` for updating adventurer profile. |
| `backend/src/main/java/com/pamana/auth/dto/UserResponse.java` | DTO: includes `username`, `gender`, and optional `email`. |
| `backend/src/main/java/com/pamana/auth/AuthService.java` | Service: login/register by username, profile update handler. |
| `backend/src/main/java/com/pamana/auth/AuthController.java` | Controller: endpoints for register, login, and profile update. |
| `backend/src/main/java/com/pamana/security/JwtTokenProvider.java` | Token provider: encodes and extracts username. |
| `backend/src/test/java/com/pamana/auth/AuthControllerTest.java` | Unit/integration tests for username auth, gender persistence & profile update. |
| `frontend/src/types/index.ts` | TypeScript definitions: `User` model with `username`, `gender`, and optional `email`. |
| `frontend/src/contexts/AuthContext.tsx` | State context: `login(username, password)`, `register(...)`, `updateProfile(name, gender)`. |
| `frontend/src/components/auth/AdventurerOnboardingModal.tsx` | Friendly PAMANA-themed English modal asking for character avatar (Boy/Girl) and player name. |
| `frontend/src/pages/auth/LoginPage.tsx` | Login page using username input with kid-friendly hints. |
| `frontend/src/pages/auth/RegisterPage.tsx` | Step 1 credentials form + triggers `AdventurerOnboardingModal`. |
| `frontend/src/components/layout/AppShell.tsx` | Detects missing name/onboarding on pre-provisioned accounts and triggers modal. |
| `frontend/src/pages/settings/SettingsPage.tsx` | Displays username, name, character selection synced with backend, and placeholder email input. |

---

## Tasks

### Task 1: Database Migration for Username and Gender (`V2__add_username_and_gender_to_users.sql`)

**Files:**
- Create: `backend/src/main/resources/db/migration/V2__add_username_and_gender_to_users.sql`

**Details:**
1. Add `username VARCHAR(50)` column to `users` table.
2. Backfill existing records: populate `username` from the prefix of `email` (e.g. `split_part(email, '@', 1)`), ensuring uniqueness.
3. Add `UNIQUE` constraint and `NOT NULL` constraint to `username`.
4. Add `gender VARCHAR(20) DEFAULT 'Lalaki'` to `users` table.
5. Alter `email` to drop `NOT NULL` so email is optional.

- [ ] **Step 1: Write migration SQL in `backend/src/main/resources/db/migration/V2__add_username_and_gender_to_users.sql`**
- [ ] **Step 2: Commit migration file**
```bash
git add backend/src/main/resources/db/migration/V2__add_username_and_gender_to_users.sql
git commit -m "db: add username and gender columns and make email optional in users table"
```

---

### Task 2: Backend Entities, DTOs & Repository Updates

**Files:**
- Modify: `backend/src/main/java/com/pamana/auth/User.java`
- Modify: `backend/src/main/java/com/pamana/auth/UserRepository.java`
- Modify: `backend/src/main/java/com/pamana/auth/dto/LoginRequest.java`
- Modify: `backend/src/main/java/com/pamana/auth/dto/RegisterRequest.java`
- Modify: `backend/src/main/java/com/pamana/auth/dto/UserResponse.java`
- Create: `backend/src/main/java/com/pamana/auth/dto/UpdateProfileRequest.java`

**Details:**
1. In `User.java`:
   - Add `@Column(nullable = false, unique = true, length = 50) private String username;`
   - Add `@Column(length = 20) private String gender = "Lalaki";`
   - Make `email` optional (`@Column(nullable = true, length = 255) private String email;`, remove `@NotBlank`).
   - Allow `name` to be optional or have a default ("Adventurer") for pre-created accounts.
2. In `UserRepository.java`:
   - Add `Optional<User> findByUsername(String username);`
   - Add `boolean existsByUsername(String username);`
3. In `LoginRequest.java`:
   - Replace `email` field with `@NotBlank(message = "Username is required") private String username;`
4. In `RegisterRequest.java`:
   - Replace `email` with `@NotBlank(message = "Username is required") @Pattern(regexp = "^[a-zA-Z0-9_]{3,30}$", message = "Username must be 3-30 alphanumeric characters or underscores") private String username;`
   - Make `name` optional in `RegisterRequest`.
   - Add optional `gender` field (defaults to `"Lalaki"`).
5. In `UserResponse.java`:
   - Include `username`, `gender`, and nullable `email`.
6. In `UpdateProfileRequest.java`:
   - Add `@NotBlank(message = "Name cannot be empty") @Size(max = 100) private String name;`
   - Add optional `@Pattern(regexp = "^(Lalaki|Babae)$") private String gender;`

- [ ] **Step 1: Update `User.java`, `UserRepository.java`, and DTOs**
- [ ] **Step 2: Verify code compiles with Maven**
```bash
mvn compile -f backend/pom.xml
```
- [ ] **Step 3: Commit backend model updates**
```bash
git add backend/src/main/java/com/pamana/auth/
git commit -m "feat(auth): update User entity and DTOs to support username and gender"
```

---

### Task 3: Backend Security, AuthService, & AuthController

**Files:**
- Modify: `backend/src/main/java/com/pamana/security/JwtTokenProvider.java`
- Modify: `backend/src/main/java/com/pamana/security/JwtAuthenticationFilter.java`
- Modify: `backend/src/main/java/com/pamana/auth/AuthService.java`
- Modify: `backend/src/main/java/com/pamana/auth/AuthController.java`
- Test: `backend/src/test/java/com/pamana/auth/AuthControllerTest.java`

**Details:**
1. `AuthService.java`:
   - `createAccount(RegisterRequest request)`:
     - Check `userRepository.existsByUsername(request.getUsername().toLowerCase().trim())`.
     - Create user with lowercase username, hashed password, role, gender, and name.
   - `authenticate(LoginRequest request)`:
     - Look up by `findByUsername(request.getUsername().toLowerCase().trim())`.
     - Validate password with `passwordEncoder.matches`.
     - Generate JWT token using user's username as subject.
   - Add `updateProfile(UUID userId, UpdateProfileRequest request)`:
     - Finds user by ID, updates `name` and `gender` (if provided), saves, and returns updated `UserResponse`.
2. `AuthController.java`:
   - Update `/login` and `/register` endpoints.
   - Add `@PutMapping("/profile")` with `@Valid @RequestBody UpdateProfileRequest request` (updates name and gender).
3. `JwtTokenProvider.java` & `JwtAuthenticationFilter.java`:
   - Ensure claims and subject use username.
4. Update `AuthControllerTest.java` to test:
   - Successful registration with username and gender.
   - Duplicate username rejection (409 Conflict).
   - Successful login with username.
   - Profile update for name and gender.

- [ ] **Step 1: Implement changes in `AuthService`, `AuthController`, and JWT security classes**
- [ ] **Step 2: Update and run `AuthControllerTest`**
```bash
mvn test -f backend/pom.xml -Dtest=AuthControllerTest
```
- [ ] **Step 3: Commit backend authentication logic**
```bash
git add backend/src/main/java/com/pamana/auth/ backend/src/main/java/com/pamana/security/ backend/src/test/java/com/pamana/auth/
git commit -m "feat(auth): implement username login, registration, and profile update endpoint"
```

---

### Task 4: Frontend Types and AuthContext Updates

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/contexts/AuthContext.tsx`

**Details:**
1. In `types/index.ts`:
   - Update `User`:
     ```ts
     export interface User {
       id: string
       username: string
       name: string
       gender?: 'Lalaki' | 'Babae'
       email?: string | null
       role: 'LEARNER' | 'PARENT'
     }
     ```
   - Update `AuthContextType`:
     - `login: (username: string, password: string) => Promise<void>`
     - `register: (username: string, password: string, role: 'LEARNER' | 'PARENT', name?: string, gender?: 'Lalaki' | 'Babae') => Promise<void>`
     - `updateProfile: (name: string, gender?: 'Lalaki' | 'Babae') => Promise<void>`
2. In `AuthContext.tsx`:
   - Update `login` method to send `{ username, password }`.
   - Update `register` to send `{ username, password, role, name, gender }`.
   - Implement `updateProfile`: calls `api.put('/auth/profile', { name, gender })`, updates local `user` state, `localStorage.pamana_character`, and `sessionStorage.pamana_user`.

- [ ] **Step 1: Update `frontend/src/types/index.ts` and `frontend/src/contexts/AuthContext.tsx`**
- [ ] **Step 2: Run frontend build check**
```bash
npm --prefix frontend run build
```
- [ ] **Step 3: Commit frontend auth context updates**
```bash
git add frontend/src/types/index.ts frontend/src/contexts/AuthContext.tsx
git commit -m "feat(frontend): update AuthContext for username authentication and profile updates"
```

---

### Task 5: Friendly "Create Your Adventurer" Onboarding Modal (Character Gender + Name)

**Files:**
- Create: `frontend/src/components/auth/AdventurerOnboardingModal.tsx`
- Modify: `frontend/src/components/layout/AppShell.tsx`

**Details:**
1. Build `AdventurerOnboardingModal.tsx`:
   - Design: Playful wooden/parchment PAMANA frame, bright banners, soft bouncing animations.
   - Header:
     - Title: *"Create Your Adventurer!"*
     - Subtitle: *"Customize your character to begin your PAMANA journey."*
   - Character / Gender Section:
     - Label: *"1. Choose your character"*
     - Two large interactive cards:
       - **Boy (Lalaki)**: Preview image `/images/M_User.png` with emoji `👦 Boy`.
       - **Girl (Babae)**: Preview image `/images/F_User.png` with emoji `👧 Girl`.
       - Selected card highlights with gold border `border-[#FFC107]`, bouncy checkmark, and active shadow.
   - Name Section:
     - Label: *"2. What is your name?"*
     - Input field: Placeholder `e.g. Juan dela Cruz or Captain Maria`.
   - Action Button:
     - *"Begin Adventure! 🚀"* with tactile press effect.
2. In `AppShell.tsx`:
   - Detects if `user` exists and their name is empty or default placeholder ("Adventurer").
   - Automatically shows `AdventurerOnboardingModal`. When saved, calls `updateProfile(name, character)`.
   - Perfectly handles pre-provisioned user accounts prepared by teachers/evaluators!

- [ ] **Step 1: Create `AdventurerOnboardingModal.tsx`**
- [ ] **Step 2: Connect missing-name trigger in `AppShell.tsx`**
- [ ] **Step 3: Verify modal layout on desktop and mobile viewports**
- [ ] **Step 4: Commit Adventurer Onboarding Modal**
```bash
git add frontend/src/components/auth/AdventurerOnboardingModal.tsx frontend/src/components/layout/AppShell.tsx
git commit -m "feat(ui): add English-language Adventurer Onboarding modal with character gender selection"
```

---

### Task 6: Redesign Login & Register Pages

**Files:**
- Modify: `frontend/src/pages/auth/LoginPage.tsx`
- Modify: `frontend/src/pages/auth/RegisterPage.tsx`

**Details:**
1. `LoginPage.tsx`:
   - Change "Email" label to "Username".
   - Input `type="text"`, placeholder `e.g. adventurer_juan`, autocomplete `username`.
   - Keep clean validation and error messages.
2. `RegisterPage.tsx`:
   - Step 1: Select Role (`LEARNER` / `PARENT`), input Username, Password, Confirm Password.
   - User clicks "Continue" -> opens the `AdventurerOnboardingModal`.
   - User picks character (Boy/Girl) and types their name, then clicks "Begin Adventure! 🚀".
   - Submits `register(username, password, role, name, gender)`.
   - On success, redirect to `/login` with credentials filled or automatic login.

- [ ] **Step 1: Update `LoginPage.tsx`**
- [ ] **Step 2: Update `RegisterPage.tsx` with onboarding modal step**
- [ ] **Step 3: Test UI in browser/build**
```bash
npm --prefix frontend run build
```
- [ ] **Step 4: Commit login and register pages**
```bash
git add frontend/src/pages/auth/LoginPage.tsx frontend/src/pages/auth/RegisterPage.tsx
git commit -m "feat(auth): transition LoginPage and RegisterPage to username flow with character onboarding"
```

---

### Task 7: Settings Page Placeholder Email & Profile Sync

**Files:**
- Modify: `frontend/src/pages/settings/SettingsPage.tsx`

**Details:**
1. Update Profile cards:
   - Card 1: Display Name (`user?.name`).
   - Card 2: Username (`user?.username`).
   - Card 3: Role (`user?.role`).
2. Add Email field in Account section:
   - Label: `Email Address (Optional)`
   - Input: Disabled/read-only placeholder (`"No email linked yet"`).
   - Badge / caption: *"Optional – Account recovery via email is coming soon in a future update."*
3. Connect Character Selection in Settings:
   - When user clicks Boy or Girl in Settings, call `updateProfile(user.name, char)` so their character preference persists to their account and syncs across devices.

- [ ] **Step 1: Update `SettingsPage.tsx` with username card, profile sync, and optional email placeholder**
- [ ] **Step 2: Run build verification**
```bash
npm --prefix frontend run build
```
- [ ] **Step 3: Commit settings page updates**
```bash
git add frontend/src/pages/settings/SettingsPage.tsx
git commit -m "feat(settings): display username, persist character gender, and add email placeholder"
```

---

### Task 8: Full End-to-End Verification

**Steps:**
1. Backend test suite:
   ```bash
   mvn test -f backend/pom.xml
   ```
2. Frontend build:
   ```bash
   npm --prefix frontend run build
   ```
3. Manual Verification Checklist:
   - [ ] Register new account: pick Username and Password -> click Continue.
   - [ ] Adventurer Onboarding modal pops up in English with Boy and Girl character options.
   - [ ] Select Girl (Babae) and enter name "Maria" -> complete registration.
   - [ ] Log in with username and password -> verify Trail Map displays Girl avatar (`/images/F_User.png`) and top bar displays "Maria".
   - [ ] Simulate pre-provisioned user (user with empty name) -> verify onboarding modal prompts on login.
   - [ ] Check Settings page -> verify Username, Name, persistent Character selection, and inactive Email placeholder.
