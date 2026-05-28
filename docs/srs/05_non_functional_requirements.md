## 3.3 Non-Functional Requirements

### Performance

| **Requirement ID** | **Description**                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NFR-P1             | Audio playback shall initiate within ≤2 seconds of learner interaction under 5 Mbps or higher network conditions.                                                  |
| NFR-P2             | Visual feedback (correct/incorrect highlight) shall render within ≤0.3 seconds of learner input to maintain game responsiveness and prevent learner disengagement. |
| NFR-P3             | The Parent/Guardian Dashboard shall load and display all 5 progress metrics within ≤5 seconds of page access under normal network conditions.                      |
| NFR-P4             | The Klase Mode leaderboard shall update within ≤5 seconds of any learner sub-level completion via Spring Boot WebSockets (STOMP) WebSocket subscription.                        |
| NFR-P5             | PDF session reports shall be generated and available for download within ≤10 seconds of the parent's download request.                                             |
| NFR-P6             | The system shall support a minimum of 40 concurrent learner sessions per Klase without performance degradation on the local database and Spring Boot infrastructure.     |

### Usability

| **Requirement ID** | **Description**                                                                                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-U1             | All game interaction instructions shall be delivered via NPC audio. No written instruction text shall be required for a Grade 2 learner to complete any game interaction without adult assistance.                                          |
| NFR-U2             | All tappable or clickable interaction targets (option tiles, navigation buttons, NPC response areas) shall have minimum dimensions of 44×44 pixels to accommodate Grade 2 learner motor accuracy on a touchpad or mouse.                    |
| NFR-U3             | The system shall implement a Hint-First feedback approach throughout all game modules - incorrect responses trigger an audio hint and allow unlimited retries. No progress score shall be deducted as a penalty for any incorrect response. |

### Reliability

| **Requirement ID** | **Description**                                                                                                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-R1             | Learner progress shall be auto-saved to local database after every sub-level completion. No progress shall be lost due to browser closure, tab switch, or session interruption between auto-save points. |
| NFR-R2             | On next login, the system shall automatically resume the learner at their last saved Pamana Trail module position without requiring any learner or parent action.                                  |
| NFR-R3             | System availability shall target 99.5% uptime during the 4-week validation intervention period, contingent on local database managed infrastructure availability and Railway/Render hosting uptime.      |
| NFR-R4             | All Local PostgreSQL data shall be covered by local database's point-in-time recovery (PITR) infrastructure, ensuring data durability in the event of infrastructure failure.                         |

### Security

Data Privacy

The system shall comply with the Data Privacy Act of 2012 (RA 10173). Learner records shall only be accessible to authorized parent, teacher, and administrator accounts through role-based access control and local database Spring Security JPA Authorization policies. Personally identifiable learner information shall not be publicly accessible.

| **Requirement ID** | **Description**                                                                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-S1             | All client-server communication shall use HTTPS (TLS 1.2 or higher). No HTTP connections are permitted in the production environment.                                                                       |
| NFR-S2             | All Spring Boot REST API endpoints shall validate the local database-issued JWT token on every request. Requests with missing, expired, or invalid tokens shall return HTTP 401 Unauthorized.                     |
| NFR-S3             | Spring Security JPA Row Authorization (RLS) policies shall be enforced on all local database database tables, ensuring each authenticated user can only read and write their own data records.                                       |
| NFR-S4             | Teacher accounts shall have read-only access exclusively to learner progress data within their own Klase. Cross-Klase data access shall be denied at the database Spring Security authorization filter level.                         |
| NFR-S5             | No personally identifiable information (PII) beyond learner name and grade level shall be collected or stored. No photographs, contact details, or geolocation data shall be collected.                     |
| NFR-S6             | All user passwords shall be managed exclusively by Spring Security JWT Authentication using bcrypt hashing. Plain-text passwords shall never be stored, logged, or transmitted in any system layer.                              |
| NFR-S7             | The system shall comply with Republic Act 10173 (Data Privacy Act of 2012). All learner data is collected solely for academic research purposes and shall not be disclosed to or shared with third parties. |

### Accessibility

| **Requirement ID** | **Description**                                                                                                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-A1             | All audio assets shall be playable through standard device speakers or headphones. No specialized audio hardware is required beyond what is standard on a laptop or desktop computer.                                              |
| NFR-A2             | Color-coded At-Risk Word Indicators (Green/Yellow/Red) shall include accompanying text labels (Mastered / Developing / At-Risk) to maintain accessibility for users with color vision deficiencies accessing the Parent Dashboard. |

### Compatibility

| **Requirement ID** | **Description**                                                                                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NFR-C1             | The application shall be compatible with desktop and laptop browsers at a minimum screen resolution of 1024×768 pixels. Mobile browser support is not guaranteed for the Capstone 1 validation period. |
| NFR-C2             | The application shall function correctly on Chrome 110+, Firefox 110+, Edge 110+, and Safari 16+. Internet Explorer is not supported in any form.                                                      |
| NFR-C3             | The React SPA shall be deployable to Vercel. The Spring Boot API shall be deployable to Railway or Render. The system shall not require on-premises server infrastructure for deployment or operation. |

