# AIML Department & AISA Council: Official Aptitude Assessment Platform

A modern, high-reliability, restricted-mode aptitude assessment platform built with **Node.js, Express, Better-SQLite3, React, Tailwind CSS, and Vite**.

---

## 🌟 Key Features

- **2 Completely Independent Assessments**:
  - **Assessment 1 (Set A)**: Logical Reasoning (10 Marks), Basic Mathematics (10 Marks), Data Structures & Algorithms (10 Marks) — 30 Marks Total (30 Mins).
  - **Assessment 2 (Set B)**: Logical Reasoning (10 Marks), Basic Mathematics (10 Marks), Data Structures & Algorithms (10 Marks) — 30 Marks Total (30 Mins).
- **Restricted Server-Side Question Delivery**:
  - Single question delivered at a time (`/api/sessions/:sessionId/question/:qNum`).
  - Zero answer keys or future questions exposed to the frontend.
  - Randomized question sequence & option mappings per session locked in DB.
- **High Concurrency & Reliability (~300+ Students)**:
  - Benchmark tested with 300 simultaneous concurrent students with 0% error rate.
  - SQLite with WAL mode, parameterized statements, memory cache, and indexing.
- **Offline-Resilient Autosave & Sync Queue**:
  - Immediate local state feedback + background synchronization queue with automatic retries.
  - Live sync indicator (`🟢 All Answers Synced`, `🟡 Saving...`, `🔴 Offline Retrying`).
- **Dynamic Leaderboard with Strict Tie-Breakers**:
  - Separate **Set A** and **Set B** leaderboards.
  - Tie-breakers: 1) Higher Score $\rightarrow$ 2) Lower Time Taken $\rightarrow$ 3) Earlier Submission Timestamp.
- **Anti-Cheating Supervision**:
  - Tab-switch & window-blur detection with configurable violation policies.
  - Copy/paste/cut/drag/context-menu disabled.
- **Comprehensive Admin Command Center**:
  - Overall & Set A/B comparative statistics.
  - Question bank CRUD & JSON importer.
  - Student Response Inspector (question-by-question candidate analysis).
  - One-click CSV exports for Set A, Set B, and All Results.

---

## 🔐 Admin Credentials

- **Admin ID**: `Aayush-Killer-25`
- **Password**: `Aayush@22#`

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install root backend dependencies
npm install

# Install client dependencies
cd client
npm install
npm run build
cd ..
```

### 2. Start Application Server
```bash
npm start
```

Open **`http://localhost:5000`** in your web browser.

---

## 📁 Project Structure

```
├── client/                     # Frontend React + Tailwind + Vite application
│   ├── src/
│   │   ├── components/         # Navbar, Timer, QuestionCard, Palette, Modals, Badges
│   │   ├── pages/              # LandingPage, Instructions, Registration, ExamPortal, ResultPage, Leaderboard, AdminPortal
│   │   ├── api.js              # Client API service
│   │   └── App.jsx             # Main Router
├── server/                     # Backend Express REST API
│   ├── routes/                 # Candidate API and Admin API routes
│   ├── services/               # Assessment, Session, Evaluation, and Leaderboard services
│   ├── db.js                   # SQLite database configuration & schema
│   └── index.js                # Server entry point
├── set_a_data.json             # Set A question bank dataset
├── set_b_data.json             # Set B question bank dataset
├── Aptitude test set-A.pdf     # Source PDF 1
├── Aptitude test set-B.pdf     # Source PDF 2
└── package.json
```

---

## 📜 License
Developed for the **AIML Department & AISA Council**. All rights reserved.
