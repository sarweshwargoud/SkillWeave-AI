import { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Search, 
  ArrowRight, 
  Loader2, 
  BookOpen, 
  BookmarkCheck,
  Palette
} from 'lucide-react';
import Navbar from '../components/Navbar';
import FloatingTiles from '../components/FloatingTiles';
import HandwrittenNotesViewer from '../components/HandwrittenNotesViewer';
import { generateHandwrittenNotes, parseYouTube } from '../services/api';
import { getClient } from '../services/supabaseClient';
import './HandwrittenNotesPage.css';

const HandwrittenNotesPage = () => {
  const [videoUrl, setVideoUrl] = useState(() => {
    return localStorage.getItem('skillweave_notes_url') || '';
  });
  const [noteStyle, setNoteStyle] = useState('detailed');
  const [loading, setLoading] = useState(false);
  const [notesData, setNotesData] = useState(() => {
    const cached = localStorage.getItem('skillweave_notes_data');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return null;
  });
  const [videoDetails, setVideoDetails] = useState(null);
  const client = getClient();

  const sampleVideos = [
    { label: "Python Memory Architecture", url: "https://www.youtube.com/watch?v=t_k_k_t" },
    { label: "React Server Components", url: "https://www.youtube.com/watch?v=rsc_t" },
    { label: "LLM Vector Embeddings", url: "https://www.youtube.com/watch?v=emb_t" }
  ];

  const handleGenerate = async (targetUrl = null) => {
    const urlToUse = targetUrl || videoUrl;
    if (!urlToUse.trim()) return;
    setLoading(true);

    try {
      try {
        localStorage.setItem('skillweave_notes_url', urlToUse);
      } catch (e) {}

      // 1. Try to parse YouTube target
      try {
        const parsed = await parseYouTube(urlToUse);
        if (parsed.type === 'video') {
          setVideoDetails(parsed.data);
        }
      } catch (e) {
        console.warn("URL parse metadata preview skipped:", e);
      }

      // 2. Generate notes
      const notes = await generateHandwrittenNotes(urlToUse, noteStyle);
      setNotesData(notes);
      try {
        localStorage.setItem('skillweave_notes_data', JSON.stringify(notes));
      } catch (e) {}
    } catch (error) {
      alert("Failed to generate notes. Please verify the YouTube URL or ID.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (noteObj) => {
    try {
      const { data: { user } } = await client.auth.getUser();
      if (!user) {
        alert("Please sign in to save handwritten notes to your Supabase cloud library.");
        navigate('/auth');
        return;
      }
      await client.from('notes').insert({
        user_id: user.id,
        video_id: noteObj.video_id,
        title: noteObj.title,
        notes_data: noteObj,
        created_at: new Date().toISOString()
      });
      alert("Note successfully saved to your personal Supabase library!");
    } catch (e) {
      console.error("Save note error:", e);
      alert("Failed to save note: " + (e.message || "Please try again."));
    }
  };

  return (
    <div className="handwritten-page-container">
      <Navbar />

      <main className="studio-container notes-page-main">
        {/* Hero Section */}
        <div className="notes-hero-block">
          <div className="hero-status-pill">
            <Sparkles size={14} className="pill-sparkle" />
            <span>AI Handwritten Study Notes Generator</span>
          </div>

          <h1 className="notes-page-headline typo-hero-title">
            STUDY NOTES REIMAGINED
          </h1>
          <p className="notes-page-sub">
            Convert any educational YouTube video into visually stunning, handwritten-style notebook study pages.
            Complete with definitions, formulas, flow diagrams, and high-yield exam takeaways.
          </p>

          {/* URL Input Form */}
          <div className="notes-input-card">
            <div className="input-row-search">
              <Search size={20} className="search-icon-dim" />
              <input
                type="text"
                className="url-studio-input"
                placeholder="Paste any YouTube video URL or ID (e.g., https://www.youtube.com/watch?v=...)"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerate();
                }}
              />
              <button
                className="btn-primary notes-generate-btn"
                onClick={() => handleGenerate()}
                disabled={loading || !videoUrl.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spinner" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Generate Notes
                  </>
                )}
              </button>
            </div>

            <div className="notes-options-row">
              <div className="style-toggles">
                <span className="opt-label">Density:</span>
                <button
                  className={`density-pill ${noteStyle === 'detailed' ? 'active' : ''}`}
                  onClick={() => setNoteStyle('detailed')}
                >
                  Detailed Study Guide
                </button>
                <button
                  className={`density-pill ${noteStyle === 'concise' ? 'active' : ''}`}
                  onClick={() => setNoteStyle('concise')}
                >
                  Concise High-Yield Summary
                </button>
              </div>

              <div className="sample-presets">
                <span className="opt-label">Sample Videos:</span>
                {sampleVideos.map((s, idx) => (
                  <button
                    key={idx}
                    className="sample-chip"
                    onClick={() => {
                      setVideoUrl(s.url);
                      handleGenerate(s.url);
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="notes-loading-card">
            <div className="loading-orbit">
              <Sparkles size={28} className="orbit-sparkle" />
              <div className="orbit-ring"></div>
            </div>
            <h3>Generating Handwritten Study Notes</h3>
            <p>Analyzing video transcript, synthesizing formulas, definitions, and formatting your notebook page...</p>
          </div>
        )}

        {/* Notes Viewer Output */}
        {notesData && !loading && (
          <div className="notes-rendered-display">
            <HandwrittenNotesViewer
              notesData={notesData}
              onSaveNote={handleSaveNote}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default HandwrittenNotesPage;
