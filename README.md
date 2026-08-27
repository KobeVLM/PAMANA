<div align="center">
  <img src="frontend/public/images/Logo1.png" alt="PAMANA Logo" width="150" />

  # 🇵🇭 PAMANA: Heritage Quest
  **A gamified web-based adventure teaching Filipino to culturally disconnected Grade 2 learners - Generation Alpha.**

  [![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
</div>

---

## 📖 About The Project

**PAMANA** is a full-stack, standalone three-tier web application built as a Capstone Project. The system addresses a crucial gap in the MATATAG Grade 2 Filipino curriculum by re-engaging culturally disconnected Generation Alpha learners through gamification, immersive storytelling, and dynamic feedback.

The core game narrative follows a Grade 2 child visiting their grandparents (Lolo and Lola) in the province for the summer. To complete household tasks (*"Pamanang Gawain"*) and communicate with their grandparents who only speak Filipino, the child must progress along the **Pamana Trail** across four interactive language learning modules, culminating in the **Reunion Ending**.

## ✨ Key Features

### 🎓 For Learners
* **Immersive Map (Pamana Trail):** A visual module progression system acting as the game world.
* **Module 1 - Syllable Recognition:** Games like *Pagsama* (blending), *Pakinggan* (listening), and *Kilalanin* (recognition) with native Filipino audio.
* **Modules 2 & 3 - Vocabulary Spiraling:** A 4-step learning loop (Pakinggan-Kilalanin-Basahin-Gamitin) for body parts, family members, and home items.
* **Module 4 - Sentence Construction:** Drag-and-drop word arrangement to form declarative (*paturol*) and interrogative (*patanong*) sentences.
* **Hamon ng Pamana:** An auto-triggered assessment mini-game (Slot Machine & Wheel of Words) to test mastery before advancing.

### 👥 For Parents & Teachers
* **Parent Dashboard:** Real-time analytics, session PDF report generation, and tracking of at-risk vocabulary words.
* **Teacher "Klase Mode":** Real-time classroom leaderboards powered by WebSockets, allowing teachers to track all students actively playing.

---

## 🏗️ System Architecture & Tech Stack

PAMANA leverages a modern, high-performance tech stack designed for scalability and rapid development.

### Frontend
* **React 18 (Vite):** Single Page Application offering fast hot module reloading and fluid UI updates.
* **Tailwind CSS & shadcn/ui:** For clean, premium, and accelerated component-based UI design.
* **Web Audio API & HTML5 Drag-and-Drop:** Providing low-latency, immersive auditory feedback and motor interactions tailored for Grade 2 children.

### Backend
* **Spring Boot 3.x (Java):** RESTful API providing core business logic, module progression locks, and JWT token validation.
* **Spring Security & JPA:** Enterprise-grade security policies and data persistence.
* **Apache PDFBox:** Dynamic generation of Parent Progress PDF reports.
* **WebSockets (STOMP):** Asynchronous, event-driven updates for the live Klase Leaderboard.

### Database
* **Local Development:** PostgreSQL 15+ for zero-latency, offline development.
* **Production Deployment:** **Supabase PostgreSQL** via IPv4 Connection Pooler for scalable cloud hosting.

---

## 🚀 Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites
* **Node.js** (v18+) and **npm**
* **Java Development Kit** (JDK 17+)
* **PostgreSQL** (v15+) or a Supabase account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/KobeVLM/PAMANA.git
   cd PAMANA
   ```

2. **Setup the Backend (Spring Boot):**
   * Navigate to the backend directory:
     ```bash
     cd backend
     ```
   * Create a `.env` file and configure your database credentials:
     ```env
     DB_URL=jdbc:postgresql://localhost:5432/pamana_db
     DB_USERNAME=postgres
     DB_PASSWORD=your_password
     JWT_SECRET=your_super_secret_hex_key_here
     ```
   * Run the application via Maven:
     ```bash
     ./mvnw spring-boot:run
     ```
   *(The backend API will run on `http://localhost:8080`)*

3. **Setup the Frontend (React):**
   * Open a new terminal and navigate to the frontend directory:
     ```bash
     cd frontend
     ```
   * Install dependencies and start the Vite dev server:
     ```bash
     npm install
     npm run dev
     ```
   *(The application will be accessible at `http://localhost:5173`)*

---

## 📚 Documentation Structure

Our project documentation is modularized for quick indexing and reference:
* **`docs/proposal/`** - Project background, problem statement, scope, and MVP expectations.
* **`docs/srs/`** - Detailed Software Requirements Specification (Use cases, wireframes, validation matrices).
* **`docs/sdd/`** - Software Design Description (Database schemas, API endpoints, sequence diagrams).

> **Note to Contributors:** Always refer to `docs/project-brain.md` as the centralized source of truth before working on new features.

---

<div align="center">
  <i>Developed with ❤️ for Grade 2 Filipino Learners</i>
</div>
