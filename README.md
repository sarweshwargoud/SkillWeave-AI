# 🚀 SkillWeave AI
### Intelligent AI-Powered YouTube Learning Hub, Curriculum Architect & Study Companion

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff.svg?logo=vite)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%7C%20Postgres%20%7C%20Storage-3ecf8e.svg?logo=supabase)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Google-Gemini%20AI-4285F4.svg?logo=google)](https://ai.google.dev/)

**SkillWeave AI** transforms scattered, unstructured YouTube educational content into a **personalized, distraction-free, sequential university-grade learning experience**. It organizes videos into modular roadmaps, provides an in-app cinema player with synchronized curriculum tracking, generates handwritten-style study notes, and provides an interactive AI Video Tutor grounded directly in real-time video transcripts.

---

## 📌 Problem We Solve

Students and self-taught developers rely heavily on YouTube, but struggle with:
- ❌ **Scattered & Incomplete Playlists**: Skipping fundamental topics or repeating identical lessons.
- ❌ **Distraction & Fragmentation**: Being diverted by YouTube recommendations, ads, and comment sections.
- ❌ **Lack of Interactive Learning Aids**: Inability to quickly query what the instructor just said or get instant quizzes.
- ❌ **Accent & Teaching Style Mismatches**: Difficulty comprehending unfamiliar regional accents and pacing.
- ❌ **Zero Progress Persistence**: No unified platform to track progress, save custom roadmaps, and maintain handwritten notes across devices.

---

## 💡 The SkillWeave AI Solution

SkillWeave AI provides an end-to-end learning workspace:
- ✅ **AI Roadmap Architect**: Ingests any YouTube link, playlist, or topic query to create an optimal module-by-module curriculum.
- ✅ **In-App Cinema Player**: Watch lessons inside the platform with zero YouTube redirects or distractions.
- ✅ **Anchored Viewport Architecture**: Video player and side curriculum explorer remain pinned on top while generated notes, quizzes, and transcripts scroll smoothly beneath.
- ✅ **AI Handwritten Notes Generator**: Produces clean, readable study notes styled like authentic ruled notebook pages.
- ✅ **AI Video Tutor**: Context-aware chat assistant trained directly on video transcripts to answer questions and explain concepts with timestamps.
- ✅ **Cloud Sync with Supabase**: Full authentication, profile management, avatar uploads via Supabase Storage, and cloud-synced roadmaps with Row-Level Security (RLS).

---

## 🧠 Core Features & User Journey

### 1. 💻 VS Code-Style Learning Workspace IDE (`/workspace`)
- **Activity Bar (Far Left)**: Quick-switch navigation icons for Explorer, My Learning, Roadmaps, Courses, Saved Lessons, History, and Settings.
- **Primary Sidebar (Collapsible & Resizable)**: Dynamic sidebar with curriculum tree, folder toggle, lesson completion, and real-time search. Toggle with `Ctrl+B`.
- **Draggable Splitters**: Smooth horizontal and vertical splitters allowing custom resizing of sidebar, bottom terminal, and right AI copilot.
- **Multi-Tab Editor Area**: Top tab bar supporting Video Player, Handwritten Notes, Quizzes, Transcripts, and Roadmap Overview with Split-View and Theater mode.
- **AI Copilot Panel (Right Side)**: Resizable panel with Gemini 2.5, clickable timestamp seeking, suggested follow-ups, and transcript synchronization. Toggle with `Ctrl+\`.
- **Integrated Terminal & Console (Bottom Panel)**: Resizable bottom panel with live interactive Terminal, Output, Problems, and AI Activity logs. Toggle with `Ctrl+J`.
- **Status Bar (Bottom)**: Displays target Git branch (`feature-security`), video timestamp, Supabase sync status, and active E2EE/RLS indicators.
- **Theme Support**: Seamless VS Code Dark (`#1e1e1e`) and Light (`#ffffff`) theme switching with layout persistence.

### 2. 🔐 Enterprise Security & Privacy Architecture
- **Supabase Auth & Centralized JWT Verification**: Every protected API route enforces cryptographically verified Supabase JWTs (`get_current_user` dependency). Missing, expired, or malformed tokens return HTTP 401.
- **Strict User Isolation & Anti-IDOR**: All queries strictly enforce `(SELECT auth.uid()) = user_id`. Client-supplied `user_id` fields in request bodies or query params are strictly ignored and overwritten by the verified JWT identity.
- **Authenticated AES-256-GCM Encryption at Rest**: Sensitive user data is encrypted before database persistence using authenticated AES-256-GCM envelope encryption with versioned metadata (`version`, `iv`, `tag`, `ciphertext`).
- **Client-Side End-to-End Encryption (E2EE)**: Private notes can be encrypted directly on the client using the standard Web Crypto API (`AES-GCM-256` derived via PBKDF2 with 100,000 iterations). Plaintext never touches the server.
- **Transparent AI Processing**: AI features (Gemini tutor & syllabus synthesis) use transient in-memory processing over TLS with zero raw conversation retention on backend servers.
- **OWASP Defense-in-Depth**: Strict security headers (`nosniff`, `DENY`, `1; mode=block`, `strict-origin-when-cross-origin`), Pydantic model validation, token-bucket rate limiting (40 req/min), and sanitized error handling.

### 3. 🗺️ AI Roadmap Architect (`/create` & `/roadmap`)

- Enter any topic (e.g. *Machine Learning*, *React Architecture*, *Golang Microservices*) or paste a YouTube URL / Playlist.
- Customize by **Skill Level** (*Beginner*, *Intermediate*, *Advanced*) and **Instructor Accent** (*Any*, *US English*, *Indian English*, *British English*).
- AI verifies continuity, topic flow, and curriculum depth before assembling the syllabus.

### 3. 🔐 Supabase Cloud Authentication & User Hub (`/auth` & `/profile`)
- **Seamless Authentication**: Instant email/password sign-up and sign-in powered by Supabase Auth with auto-confirmation.
- **Custom Profile & Storage**: Upload and manage profile avatars stored directly in the `user-assets` Supabase Storage bucket.
- **Personal Workspace**: Track enrolled curricula, active projects, custom tasks, and completion percentages.
- **Cross-Device Sync**: All user projects and enrolled courses sync across devices via PostgreSQL Row-Level Security (RLS).

### 4. 📚 My Learning Hub (`/my-learning`)
- Comprehensive overview of all active and completed roadmaps.
- Track total videos, overall progress bars, and module milestones at a glance.

---

## ⚙️ Architecture & Tech Stack

```
SkillWeave AI Architecture
│
├── Frontend (React 19 + Vite 7 + Framer Motion)
│   ├── Responsive Dual-Pane In-App Player
│   ├── Handwritten Notes SVG/CSS Canvas
│   ├── Supabase Auth & Storage Client
│   └── SPA Routing with Vercel Rewrites
│
├── Backend (FastAPI + Python 3.10+)
│   ├── YouTube Data API v3 & Transcript Scraper
│   ├── Google Gemini API (LLM Syllabus & Tutor Engine)
│   └── Audio & Accent Classification Pipelines
│
└── Cloud & Database (Supabase)
    ├── PostgreSQL with Row Level Security (RLS)
    │   ├── profiles (auto-synced via auth.users triggers)
    │   ├── courses (syllabi, modules, progress tracking)
    │   ├── projects (personal workspace roadmaps)
    │   └── notes (AI study notes library)
    └── Storage Buckets
        └── user-assets (public avatar uploads & user assets)
```

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 7, React Router 7, Framer Motion, Lucide Icons, Axios |
| **Backend** | Python, FastAPI, Uvicorn, Pydantic, Python-dotenv |
| **AI / LLMs** | Google Gemini 1.5 / 2.0 API, Groq LLM, YouTube Transcript API |
| **Database & Auth** | Supabase (PostgreSQL, GoTrue Auth, Storage, Edge Policies) |
| **Hosting & CI/CD**| Vercel (Frontend with SPA rewrite fallbacks), Render / Cloud Run (Backend) |

---

## 🗄️ Database Schema & RLS Policies

All database access is protected by Supabase Row-Level Security (RLS):

- **`public.profiles`**: Tied to `auth.users(id) on delete cascade`. Trigger `handle_new_user()` auto-populates profiles on sign-up.
- **`public.courses`**: Tracks curriculum modules, progress, timestamps, and active lesson IDs. Protected by RLS: `(SELECT auth.uid()) = user_id`.
- **`public.projects`**: Stores custom syllabus data and roadmaps. RLS restricts access to `(SELECT auth.uid()) = user_id`.
- **`public.notes`**: Stores private user study notes with envelope encryption flags (`is_encrypted`, `encryption_metadata`). RLS restricts access to `(SELECT auth.uid()) = user_id`.
- **`public.workspace_settings`**: Stores VS Code workspace preferences (panel widths, heights, collapse state, active tabs, theme). RLS restricts access to `(SELECT auth.uid()) = user_id`.
- **`storage.buckets ('user-assets')`**: Public read bucket with authenticated upload/update/delete policies for profile pictures.


---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.10 or higher)
- YouTube Data API v3 Key
- Google Gemini API Key
- Supabase Project URL & Anon Key

### 1. Clone the Repository
```bash
git clone https://github.com/sarweshwargoud/SkillWeave-AI.git
cd youtube-playlist-generator
```

### 2. Configure Environment Variables

#### Backend (`backend/.env`):
```env
YOUTUBE_API_KEY=your_youtube_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_SECRET_KEY=your_secret_key_here
```

#### Frontend (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
```

### 3. Start the Backend Server
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Start the Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Run Automated Security & Anti-IDOR Test Suite
```bash
cd backend
pytest tests/test_security_auth.py
```
Verified checks include:
- OWASP security headers injection
- 401 unauthenticated request rejection on missing, invalid, or expired tokens
- Authenticated AES-256-GCM envelope encryption & decryption roundtrip
- Ciphertext tampering detection
- Strict User Isolation and Anti-IDOR (Insecure Direct Object Reference) prevention
- Mass-assignment body `user_id` spoofing override


---

## 🌐 Production Deployment

### Frontend (Vercel)
To prevent `404: NOT_FOUND` errors when refreshing routes in single-page applications, the repository includes rewrite rules in `vercel.json` and `frontend/public/_redirects`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Deploy directly by connecting your GitHub repository to [Vercel](https://vercel.com) with Root Directory set to `frontend` or the repository root.

---

## 🎯 Impact & Vision

SkillWeave AI bridges the gap between chaotic self-learning and structured academic courses. By combining **video transcript parsing**, **LLM-driven curriculum structuring**, and **distraction-free cinema playback**, learners can master complex technical subjects in a fraction of the time.

---

## 👨‍💻 Author

**Sarweshwar Buddolla**  
- GitHub: [@sarweshwargoud](https://github.com/sarweshwargoud)

---

## ⭐ Support the Project
If you find SkillWeave AI helpful, please star the repository on GitHub!
