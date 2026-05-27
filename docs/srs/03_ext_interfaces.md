## 3.1 External Requirement

### 3.1.1. Hardware interfaces

PAMANA does not interface directly with hardware peripherals beyond what a standard browser provides.

The following hardware is required on the learner's device:

| **Hardware Component**                        | **Description**                                                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Speaker or headphones                         | required for audio playback of all NPC dialogue, syllable sounds, vocabulary words, and sentence audio. The application cannot be used meaningfully without audio output. |
| Mouse or touchpad                             | required for click-based game interactions and drag-and-drop in Module 4. Touch input on touchscreen laptops is supported.                                                |
| Minimum display resolution of 1024×768 pixels | required for correct rendering of the game interface, option grids, and Pamana Trail map.                                                                                 |
| Internet connection                           | minimum 5 Mbps recommended for audio asset streaming without buffering delays.                                                                                            |

### 3.1.2. Software interfaces

| **Software / System**     | **Interface Description**                                                                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modern Web Browser        | Chrome 110+, Firefox 110+, Edge 110+, Safari 16+. Internet Explorer is not supported.                                                                                                              |
| React 18+                 | frontend SPA framework. Handles UI rendering, game state management (useState, useContext), audio playback (Web Audio API), and drag-and-drop (react-dnd with HTML5Backend).                       |
| Spring Boot 3.x           | backend REST API. Handles all business logic, Supabase JWT validation, mastery threshold evaluation, Hamon ng Pamana trigger, module lock/unlock decisions, and PDF generation via Apache PDFBox.  |
| Supabase (PostgreSQL 15+) | managed database and authentication service. Provides JWT-based auth, Row Level Security, Realtime WebSocket subscriptions for Klase leaderboard, and Supabase Storage for audio and image assets. |

### 3.1.3. Communications interfaces

- All client-to-server communication uses HTTPS (TLS 1.2 or higher) over port 443. No HTTP connections are permitted in production.
- The React SPA communicates with the Spring Boot API via RESTful HTTP/JSON requests using Axios.
- The React SPA communicates with Supabase Auth directly via the Supabase JavaScript client (supabase-js) for login, registration, and token refresh.
- The Klase Mode leaderboard uses Supabase Realtime (WebSocket) subscriptions to push updates within ≤5 seconds of any learner sub-level completion.
- PDF report downloads are served as binary file HTTP GET responses from the Spring Boot API.

## 3.2 Functional Requirements

