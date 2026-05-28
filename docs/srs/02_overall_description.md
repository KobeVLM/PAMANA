# Overall Description

## Product perspective

PAMANA is a standalone three-tier web application. The React 18 + Vite single-page application (SPA) serves as the presentation layer, utilizing the **shadcn/ui** library to accelerate clean, modern, and accessible component creation. It handles all user interface rendering, game state management, audio playback via Web Audio API, and drag-and-drop interactions via react-dnd. The Spring Boot 3.x REST API serves as the application layer, managing all business logic including JWT validation, mastery threshold evaluation, Hamon ng Pamana trigger logic, module lock/unlock decisions, and PDF report generation via Apache PDFBox.

The data layer uses a **Dual Environment Database Strategy** to maximize speed and robustness:
* **Local Development Environment:** A local PostgreSQL 15+ instance (running on `localhost:5432`) handles data persistence for rapid, low-latency, and offline development.
* **Production & Deployment Environment (Final):** Supabase PostgreSQL cloud database serves as the final data layer.

The database also supports supplementary services accessed by the React SPA via the Axios HTTP Client: Spring Security JWT Authentication for local JWT-based user authentication, standard Spring Boot WebSockets (STOMP) for WebSocket subscriptions powering the Klase Mode leaderboard, and local static directories (Spring Boot) for hosting all audio and image assets (replicated in Supabase Storage for final production).

PAMANA does not depend on any DepEd LMS, external content API, or third-party assessment platform. All content is stored within the system's own database infrastructure (local PostgreSQL in development; Supabase in production).

## User characteristics

| **User Type**                 | **Characteristics**                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grade 2 Learner (Primary)     | Ages 7-8. Minimal independent reading ability - all game instructions are delivered via NPC audio. Uses the application outside the classroom on a shared family desktop or laptop with parental presence. Interacts via mouse click or touchpad. Does not manage accounts independently; parent assists with initial setup and session scheduling.      |
| Parent / Guardian (Secondary) | Adult with basic browser familiarity. Accesses the Parent/Guardian Dashboard to monitor word mastery status, at-risk word indicators, and download PDF session reports. Does not interact with game modules. Responsible for supervising the learner's sessions and maintaining the minimum 3-sessions-per-week schedule during the intervention period. |
| Teacher (Secondary)           | Grade 2 Filipino subject teacher. Creates Klase class groups via join code and views class-wide Pamana Trail progress. Validates MATATAG Q1-Q2 content alignment through pre-intervention and post-intervention interviews. Has read-only access to all learner data within their Klase only.                                                            |

## 2.3 Product Functions

- **Syllable Recognition and Phoneme Blending (Module 1)** - Delivers three progressive phonics activities (Pagsama, Pakinggan, Kilalanin) and a rhyming task that develop Filipino phonological awareness aligned with MATATAG Grade 2 Q1 competencies. Module 1 unlocks Module 2 when the learner achieves ≥80% average accuracy.
- **Vocabulary Learning via Spiral Loop (Modules 2-3)** - Delivers a 4-step word-learning cycle (Pakinggan → Kilalanin → Basahin → Gamitin) across 25 Filipino vocabulary words in two MATATAG Q1-Q2 domains: Self and Body (10 words) and Family and Home (15 words). Includes automatic Hamon ng Pamana review challenges every 5 mastered words.
- **Basic Sentence Construction (Module 4)** - Develops paturol (declarative) and patanong (interrogative) sentence formation through a drag-and-drop word arrangement mechanic (Tier 1 and Tier 2) and NPC dialogue completion tasks using vocabulary mastered in Modules 2-3.
- **Pamana Trail Progression Lock** - Tracks per-module accuracy in local database and enforces progression: each module is locked until the previous module's accuracy threshold is met (≥80% for Module 1; ≥75% for Modules 2-4). Visual trail map reflects unlock status in real time.
- **Hamon ng Pamana Spiral Revisit** - Automatically retests all previously mastered vocabulary words every 5 mastered words using the Gamitin dialogue format. Words scoring below ≥60% are re-queued for the next session, implementing the "repetition until better" game mechanic.
- **Parent/Guardian Progress Dashboard** - Provides parents with real-time visibility into 5 progress metrics, word-by-word mastery status, color-coded at-risk word indicators, and downloadable PDF session reports generated by the Spring Boot API via Apache PDFBox.
- **Klase Mode Classroom Leaderboard** - Enables Grade 2 Filipino teachers to create class groups (Klase) via join codes. Students in the same Klase see a shared Pamana Trail leaderboard that updates in real time via Spring Boot STOMP WebSocket subscriptions.
- **User Account Management** - Handles learner account registration and login via Spring Security JWT Authentication, teacher Klase creation with unique join code generation, and role-based routing (Learner → Pamana Trail, Parent → Dashboard, Teacher → Klase Dashboard).

## 2.4. Constraints

- PAMANA covers MATATAG Grade 2 Filipino Q1-Q2 competencies only. Q3 and Q4 content is explicitly excluded from scope.
- The system is web-browser-based only. No iOS or Android native application is included in scope.
- An active internet connection is required for all sessions. Offline mode is not supported.
- Core phonics audio (syllable sounds, vocabulary words) shall use pre-recorded native Filipino speaker audio. Secondary NPC dialogue audio may use validated neural TTS (Edge-TTS) where pre-recorded assets are unavailable.
- Speech recognition and microphone input are not supported. Pronunciation practice is listening-based only.
- The system is validated with a maximum of 30 Grade 2 learners from one Cebu-based public elementary school. Multi-school generalizability is a documented limitation.
- The system targets desktop and laptop browsers at a minimum screen resolution of 1024×768 pixels. Mobile browser support is not guaranteed during the Capstone 1 validation period.
- The system shall support a maximum of 40 concurrent learner sessions per Klase.
- Deployment infrastructure: React SPA on Vercel, Spring Boot API on Railway or Render, data on Local PostgreSQL. No on-premises server infrastructure is required.
- All learner data is collected and stored in compliance with Republic Act 10173 (Data Privacy Act of 2012). Data is used solely for academic research purposes and shall not be disclosed to third parties.

## 2.5. Assumptions and dependencies

- Learners have access to a desktop or laptop with working speaker or headphones and a stable internet connection at home during the 4-week intervention period (required for Supabase production database connection).
- A parent or guardian is present during learner sessions and maintains the minimum 3-sessions-per-week schedule.
- A Cebu-based public elementary school will provide principal-level approval for access to 30 Grade 2 learners as research respondents.
- The system depends on a local PostgreSQL instance for development and pivots to Supabase PostgreSQL cloud infrastructure for production deployment and final verification.
- Audio and image assets are finalized and uploaded to local static directories (for development) and Supabase Storage (for production) before Sprint 2 begins.
- React 18 + Vite with **shadcn/ui**, Spring Boot 3.x, and modern browser support for Web Audio API and HTML5 drag-and-drop events are available on the learner's device.
- The development team consists of 5 members working over 4 two-week sprints with a goal of achieving ≥60% MVP completion per module for Capstone 1.

## 2.6. Risks and Mitigation

| **_Risk_**                                | **Description**                                                                                                                      | **Likelihood** | **Mitigation**                                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Internet Instability at Home              | Learners' home internet may be unreliable, causing session drops or audio buffering during the 4-week intervention.                  | High           | local database auto-saves progress after every sub-level completion. Learners resume from last saved checkpoint on re-login. Audio retry button provided on all game screens.                                                                   |
| local database Infrastructure Downtime          | Local PostgreSQL database service may experience brief outages during the intervention period.                                               | Low            | Monitor local database status page actively during the 4-week window. Document as a study limitation. Schedule intervention dates to avoid known local database maintenance periods.                                                                  |
| Audio Asset Inconsistency                 | Recorded audio files may vary in quality, volume, or pacing if recorded across different sessions or different speakers.             | Medium         | Standardize recording conditions (quiet room, same microphone and speaker throughout). Normalize all audio files to −14 LUFS before upload to Local static asset directories (Spring Boot). Lock the audio strategy in Sprint 1 and do not change it mid-development. |
| Audio Strategy Change Mid-Development     | The team may switch from pre-recorded audio to TTS mid-sprint, creating asset inconsistency between modules.                         | Medium         | Decide and lock the audio strategy in Sprint 1 before any assets are produced. Document the chosen strategy in this SRS. After Sprint 2 begins, no audio strategy changes are permitted.                                                  |
| Limited Research Respondents              | Only 30 learners from one school are accessible under principal-level approval, limiting generalizability.                           | High           | Document explicitly as a study limitation. State the one-school scope clearly in findings. Recommend multi-school replication studies in future work.                                                                                     |
| Partner School Access Delay               | Principal-level approval from the partner school may be delayed, compressing the 4-week intervention window.                         | Medium         | Begin school outreach during Sprint 2. Prepare consent forms, interview protocols, and onboarding materials before outreach begins so they are ready upon approval.                                                                       |
| Browser Compatibility Issues              | Different browser versions may render the React SPA or react-dnd drag-and-drop differently across Chrome, Firefox, Edge, and Safari. | Medium         | Test all game modules manually on Chrome 110+, Firefox 110+, Edge 110+, and Safari 16+ before UAT begins in Sprint 4. Use CSS and JavaScript standards compliant with all four target browsers.                                           |
| Child Motor Difficulty with Drag-and-Drop | Grade 2 learners (ages 7-8) may struggle with the drag-and-drop mechanic in Module 4 due to motor skill limitations on a touchpad.   | Medium         | Implement tap-to-select-and-place as an alternative to drag-and-drop for Module 4. Conduct pilot testing of Module 4 with at least 3 Grade 2 child users before full UAT begins.                                                          |
| Spring Security JPA security Misconfiguration             | Incorrectly configured Spring Security JPA Row Authorization policies may accidentally expose learner data across different user accounts.              | Low            | Write and unit test all Spring Security authorization filters before Sprint 3. Use the Local PostgreSQL CLI/Admin console to verify cross-user data isolation. Include RLS verification as a mandatory step in the integration testing checklist.                                 |
| Incomplete Asset Production               | Audio files and vocabulary images may not be ready before Sprint 2 begins, blocking vocabulary module development.                   | Medium         | Begin asset production (recording, sourcing images) during Sprint 1 in parallel with UI setup. Assign one team member as asset lead responsible for delivery by Sprint 2 Day 1.                                                           |

# 3\. Specific Requirements

