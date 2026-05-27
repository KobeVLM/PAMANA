**CEBU INSTITUTE OF TECHNOLOGY**

**UNIVERSITY**

COLLEGE OF COMPUTER STUDIES

Software Requirements Specifications

_for_

**PAMANA**

Change History

| **Version** | **Date**     | **Author**  | **Description**                                                                                                                                                                                                              |
| ----------- | ------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0         | May 2026     | PAMANA Team | Initial SRS document creation                                                                                                                                                                                                |
| 1.1         | May 22, 2026 | PAMANA Team | Updating the contents Updated module numbering consistency, added non-functional requirements, risks and mitigation, requirements validation, traceability matrix, and revised system constraints and security requirements. |
| 1.2         | May 23, 2026 | PAMANA Team | Module headers fixed, Added Requirements Validation table, and Full Traceability Matrix                                                                                                                                      |
| 1.3         | May 24, 2026 | PAMANA Team | Enhanced Use cases for each modules                                                                                                                                                                                          |
| 1.4         | May 25, 2026 | PAMANA Team | Added Wireframes for each modules                                                                                                                                                                                            |

Table of Contents

Change History 2

Table of Contents 3

1\. Introduction 4

1.1. Purpose 4

1.2. Scope 4

1.3. Definitions, Acronyms and Abbreviations 5

1.4. References 5

2\. Overall Description 6

2.1. Product perspective 6

2.2. User characteristics 6

2.3 Product Functions 7

2.4. Constraints 7

2.5. Assumptions and dependencies 8

2.6. Risks and Mitigation 9

3\. Specific Requirements 10

3.1 External Requirement 10

3.1.1. Hardware interfaces 10

3.1.2. Software interfaces 10

3.1.3. Communications interfaces 11

3.2 Functional Requirements 11

Features: User Management 11

Module 1 Syllable Recognition 11

Module 2-3 Vocabulary Learning 12

Module 4: Sentence Construction 12

3.3 Non-Functional Requirements 12

Performance 12

Usability 13

Reliability 13

Security 13

Accessibility 14

Compatibility 14

3.4 Requirements Validation 14

# Introduction

## Purpose

This Software Requirements Specifications (SRS) document provides a complete description of the functional and non-functional requirements for PAMANA, a gamified web-based Filipino language learning application for Grade 2 learners. It serves as the primary reference for the development team (Team 33), the capstone project adviser, and Grade 2 Filipino subject teachers who will validate content alignment against the MATATAG curriculum. All functional requirements in this document are traceable to the General Objectives stated in the approved PAMANA Software Project Proposal.

.

## Scope

PAMANA is a web-based application built on React + Vite (frontend), Spring Boot (backend), and Local PostgreSQL (database) that delivers gamified Filipino language practice for Grade 2 learners aligned with the MATATAG curriculum competencies for Quarter 1 and Quarter 2 only.

The system provides four content modules:  
Module 1 - Syllable Recognition through Pagsama-Pakinggan-Kilalanin mechanics;  
Modules 2-3 - Self and Body and Family and Home Vocabulary through a 4-step spiral loop;  
Module 4 - Simple Sentence Construction for paturol and patanong forms.  
Supporting features include the Pamana Trail progression lock, Hamon ng Pamana vocabulary review challenges, Klase Mode classroom leaderboard, and a Parent/Guardian Progress Dashboard with at-risk word indicators and PDF session reports.

All learning measurement is performed through game interaction accuracy tracked automatically by local database. No standalone pre-test or post-test quiz instrument is used. The game itself is the evidence of learning progress.

## Definitions, Acronyms and Abbreviations

| **Term / Acronym** | **Definition**                                                                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PAMANA             | The name of the system. Also means "heritage" in Filipino, serving as the core narrative theme. Official project title is one word: PAMANA.                                        |
| MATATAG            | DepEd launched the MATATAG K-10 curriculum on August 10, 2023, revising the K-12 curriculum. Formal Filipino instruction under MATATAG starts in Grade 2                           |
| Q1 / Q2            | Quarter 1 (phonics, syllable recognition, basic vocabulary) and Quarter 2 (family/home vocabulary, simple sentence forms) of the MATATAG Grade 2 Filipino curriculum.              |
| Pagsama            | Phoneme blending sub-level mechanic in Module 1. Learner hears isolated consonant and vowel sounds and selects the correct syllable blend. Filipino word meaning "to combine."     |
| Pakinggan          | "Listen" in Filipino. Sub-level mechanic in Module 1 where the learner hears a complete syllable and selects the matching written form. Also Step 1 of the vocabulary spiral loop. |
| Kilalanin          | "Recognize" in Filipino. Sub-level mechanic in Module 1 where learner identifies the starting syllable of a heard word. Also Step 2 of the vocabulary spiral loop.                 |
| Basahin            | "Read" in Filipino. Step 3 of the 4-step vocabulary spiral loop - learner identifies the correct written word when audio plays.                                                    |
| Gamitin            | "Use" in Filipino. Step 4 of the 4-step vocabulary spiral loop - learner uses the word to complete NPC dialogue.                                                                   |
| Hamon ng Pamana    | "Heritage Challenge" - automatic vocabulary review challenge triggered every 5 mastered words, retesting all previously mastered words in shuffled order.                          |
| Klase Mode         | Classroom social feature - teachers create a class group (Klase) via join code; students see a shared Pamana Trail leaderboard.                                                    |
| Pamana Trail       | Visual progression map across 4 modules from Entrance to Sala. Each module is locked until the previous module's accuracy threshold is met.                                        |
| NPC                | Non-Player Character - Lola and Lolo, the Filipino-speaking grandparent characters who guide the learner through each module's missions.                                           |
| Paturol            | Declarative sentence type in Filipino (e.g., "Kumain ako."). Tier 1 of Module 4.                                                                                                   |
| Patanong           | Interrogative sentence type in Filipino (e.g., "Saan si Nanay?"). Tier 2 of Module 4.                                                                                              |
| SRS                | Software Requirements Specifications - this document.                                                                                                                              |
| SDD                | Software Design Description - companion technical design document.                                                                                                                 |
| RLS                | Spring Security JPA Row Authorization - Local PostgreSQL feature ensuring each user can only access their own data.                                                                                |
| JWT                | JSON Web Token - authentication token issued by Spring Security JWT Authentication and validated by the Spring Boot API on every request.                                                               |
| NFR                | Non-Functional Requirement - a system quality constraint not directly related to a specific function.                                                                              |
| UC                 | Use Case - a specific interaction between an actor and the system.                                                                                                                 |
| MVP                | Minimum Viable Product - the development target for Capstone 1, defined as ≥60% completion of each module's objectives.                                                            |
| TTS                | Text-to-Speech - neural audio generation technology (Edge-TTS) used for secondary NPC dialogue where pre-recorded assets are unavailable.                                          |

## References

- Department of Education (DepEd). (2023). MATATAG K to 10 Curriculum Guide - Filipino, Grades 2-10. Department of Education, Philippines.
- PAMANA Software Project Proposal - Team 33, May 2026.
- IEEE Std 830-1998: IEEE Recommended Practice for Software Requirements Specifications.
- Republic Act 10173 - Data Privacy Act of 2012. Philippines.
- local database Documentation: <https://local database.com/docs>
- Spring Boot Reference Documentation: <https://docs.spring.io/spring-boot/>
- React Documentation: <https://react.dev/>
- react-dnd Documentation: <https://react-dnd.github.io/react-dnd/>

