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

### 1. 🎓 In-App Cinema Learning Workspace (`/workspace`)
- **Pinned Video Player**: Anchored on the top-left with custom controls, completion toggles, and seamless previous/next module traversal.
- **Hierarchical Curriculum Explorer**: Folder-tree style curriculum sidebar on the right showing step-by-step modules, active video indicators, and completion checkmarks.
- **Modular Sub-Video Feature Drawer**:
  - 📝 **Handwritten Notes**: Structured notes with summaries, key takeaways, code blocks, and diagrams.
  - 💬 **AI Video Tutor**: Real-time Q&A assistant referencing timestamps and transcript contexts with one-click follow-up prompts.
  - 🎯 **Interactive Quizzes**: On-demand comprehension quizzes with instant score feedback.
  - 📜 **Clickable Transcript**: Full timestamped transcripts that jump directly to specific parts of the video.
  - 📋 **Module Objectives**: Step-by-step learning outcomes and practical code exercises.

### 2. 🗺️ AI Roadmap Architect (`/create` & `/roadmap`)
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
- **`public.courses`**: Tracks curriculum modules, progress, timestamps, and active lesson IDs. Accessible only by the owning authenticated user.
- **`public.projects`**: Stores custom syllabus data and roadmaps. RLS restricts access to `auth.uid() = user_id`.
- **`public.notes`**: Stores generated notes tied to specific YouTube video IDs.
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
