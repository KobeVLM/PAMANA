# PAMANA Software Requirements Specifications (SRS) - Modular Documentation

This directory contains the modularized version of the **PAMANA Software Requirements Specifications (SRS)**.

## Document Index

1. **[01_introduction.md](01_introduction.md)**
   - Document change history and Table of Contents.
   - Purpose, Scope, Definitions, Acronyms, and References.

2. **[02_overall_description.md](02_overall_description.md)**
   - Product Perspective and High-Level Architecture.
   - User Characteristics and Product Functions.
   - Project Constraints, Assumptions, Dependencies, Risks, and Mitigations.

3. **[03_ext_interfaces.md](03_ext_interfaces.md)**
   - Hardware interfaces (Speaker, Display resolution, Mouse/Touchpad, Connection).
   - Software interfaces (Browsers, React, Spring Boot, Supabase).
   - Communications interfaces (HTTPS/TLS, REST APIs, WebSockets).

4. **Functional Requirements (`04_functional_requirements/`)**
   - **[04_01_user_management.md](04_functional_requirements/04_01_user_management.md)**
     - SF.1 Learner Account Registration (Use cases, Diagrams, Descriptions, Activity diagrams, and Wireframes).
     - SF.2 User Login.
     - SF.3 Teacher Klase Creation.
   - **[04_02_module_1_syllable.md](04_functional_requirements/04_02_module_1_syllable.md)**
     - Module 1: Phonics & Syllable Recognition (Pagsama, Pakinggan, Kilalanin, Rhyming, and progression locks).
   - **[04_03_module_2_3_vocabulary.md](04_functional_requirements/04_03_module_2_3_vocabulary.md)**
     - Modules 2-3: Vocabulary Learning (Word intro, matching steps, NPC dialogs, and Hamon ng Pamana).
   - **[04_04_module_4_sentences.md](04_functional_requirements/04_04_module_4_sentences.md)**
     - Module 4: Simple Sentence Construction (Paturol and Patanong scrambled word arrange, dialogue completions).
   - **[04_05_support_features.md](04_functional_requirements/04_05_support_features.md)**
     - Dashboard modules (Parent/Guardian Dashboard, At-risk color coding indicators, PDF generation, Klase leaderboard).

5. **[05_non_functional_requirements.md](05_non_functional_requirements.md)**
   - Performance targets (Sub-second visual/audio latency, database updates).
   - Usability (Simple interfaces, child-friendly layouts, no-penalty Hints).
   - Reliability, Security (JWT, role validation, DB RLS), Accessibility, and Compatibility.

6. **[06_requirements_validation.md](06_requirements_validation.md)**
   - Requirements Validation Table (VR.1 to VR.7) mapping functional tests.
   - Complete System Traceability Matrix tracing SRS sections to Objectives.
