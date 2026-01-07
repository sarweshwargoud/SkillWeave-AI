# EduPath Engineering Blueprint & Roadmap

## 🏗️ PHASE 0 — Project Foundation
**Goal:** Create stable environment + core structure.

**Tasks:**
- [x] Setup VS Code workspace
- [x] Create folders: backend/, frontend/, docs/
- [x] Initialize backend (FastAPI)
- [ ] Initialize frontend (React or Dreamflow)
- [ ] Setup MongoDB
- [x] Setup Git repo

**Completion Criteria:**
- API running at localhost:8000
- Basic UI placeholder page working

---

## 🚀 PHASE 1 — YouTube Intelligence Engine
**Goal:** Fetch best possible learning videos fast.

**Module 1 → YouTube Search + Filter Engine**
- Integrate YouTube Data API
- Search by topic + intent
- Filter low quality (clickbait, length constraints)
- Compute base ranking (Views, Likes, Comments, Recency, Trust)

**Output:** Top 10 BEST candidate videos for each topic.

---

## 🧠 PHASE 2 — Transcript & Topic Understanding Engine
**Goal:** Make AI understand what each video teaches.

**Module 2 → Transcript Engine**
- Get YouTube captions
- Whisper fallback
- Store transcript in DB
- Create mini-chunks with timestamps

**Module 3 → Topic Extraction + Knowledge Map**
- Use LLM/NLP to extract Topics, Subtopics, Level, Knowledge depth
- Output structured JSON

---

## 🔗 PHASE 3 — Topic Continuity Engine
**Goal:** Ensure learning flows smoothly from video to video.

**Module 4 → Continuity Matching Engine**
- Extract END topic of previous video
- Extract START topic of next video
- Semantic similarity comparison
- Continuity confidence score

---

## 🎤 PHASE 4 — Accent + Speaking Style Intelligence
**Goal:** Group videos where teachers speak in similar understandable style.

**Module 5 → Speaker Analysis**
- Extract audio segments
- Analyze: Accent, Speed, Clarity, Pronunciation

**Module 6 → Accent Clustering**
- Group by accent (Indian, Neutral, etc.)
- Use speaker embeddings / FAISS

---

## 🎯 PHASE 5 — Final Playlist Intelligence
**Goal:** Generate full structured learning course automatically.

**Module 7 → Final AI Playlist Builder**
- Inputs: Course name, Level, Accent, Speed
- Build syllabus roadmap
- Select best videos
- Ensure continuity and accent match
- Output: Step-by-step roadmap + Playlist

---

## 🌐 PHASE 6 — Frontend & UX
**Goal:** Make it beautiful, premium & judge-winning.

**Pages:**
1. Landing Page
2. Course Input Page
3. Roadmap Screen
4. Playlist Screen
5. Progress Dashboard

**Tech:**
- React
- Vanilla CSS / Modern Styling
- Smooth animations

---

## ⚡ PHASE 7 — Speed + Production Optimization
- Parallel processing (Celery/Ray)
- Redis caching
- Precompute trending roadmaps

---

## 🧪 PHASE 8 — Testing + Buildathon Requirements
- Real user testing
- Demo Video
- Build-in-public posts

---

## System Agents
1. **Ranking Agent**: Fetches and scores videos.
2. **Transcript + Topic Agent**: Summarizes and maps topics.
3. **Continuity Agent**: Checks flow between videos.
4. **Accent / Voice Agent**: Analyzes audio/speech.
5. **Final Playlist Agent**: Builds the roadmap.

