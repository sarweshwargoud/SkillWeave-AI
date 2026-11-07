import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Sparkles, 
  Search, 
  ArrowRight, 
  ArrowLeft,
  Loader2, 
  BookOpen, 
  BookmarkCheck,
  Palette,
  Plus,
  Edit2,
  Trash2,
  Check,
  Link2,
  ShieldCheck
} from 'lucide-react';
import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';
import AuthGateModal from '../components/AuthGateModal';
import HandwrittenNotesViewer from '../components/HandwrittenNotesViewer';
import { generateHandwrittenNotes, parseYouTube } from '../services/api';
import { getClient } from '../services/supabaseClient';
import './HandwrittenNotesPage.css';

const DEFAULT_NOTE_DATA = {
  title: "Python Memory Architecture & Scope",
  video_id: "_uQrJ0TkZlc",
  summary: "Python uses a private heap for all its objects and data structures. Variable names are essentially references pointing to objects allocated in memory rather than storing the value directly inside the variable box.",
  sections: [
    {
      heading: "1. The Private Heap & Reference Counting",
      content: "All objects (integers, strings, lists) reside in the heap. CPython tracks the number of references pointing to each object. When refcount hits zero, memory is reclaimed instantly by garbage collection."
    },
    {
      heading: "2. The LEGB Scope Hierarchy",
      content: "Variables are looked up in strict order: Local -> Enclosing -> Global -> Built-in. Modifying a global requires the explicit `global` keyword."
    }
  ],
  key_takeaways: [
    "Variables are pointers to memory objects, not memory slots",
    "Immutable types (ints, tuples) cannot be altered in-place",
    "Mutable objects (lists, dicts) mutate in-place across references"
  ],
  definitions: [
    { term: "Reference Counting", definition: "CPython memory management algorithm that frees memory when references drop to 0." },
    { term: "LEGB Rule", definition: "Namespace search order: Local, Enclosing, Global, Built-in." }
  ]
};

const HandwrittenNotesPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=_uQrJ0TkZlc');
  const [noteStyle, setNoteStyle] = useState('detailed');
  const [loading, setLoading] = useState(false);
  const [notesList, setNotesList] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [notesData, setNotesData] = useState(DEFAULT_NOTE_DATA);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteTitle, setEditNoteTitle] = useState('');
  const [showAuthGate, setShowAuthGate] = useState(false);

  const client = getClient();

  const sampleVideos = [
    { label: "Python Memory Models", url: "https://www.youtube.com/watch?v=_uQrJ0TkZlc" },
    { label: "React Deep Dive", url: "https://www.youtube.com/watch?v=bMknfKXIFA8" },
    { label: "Vector Databases & RAG", url: "https://www.youtube.com/watch?v=ySus5ZS0b94" }
  ];

  // 1. Initial Load of Saved Notes from Supabase
  useEffect(() => {
    let mounted = true;
    const initNotes = async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        const currentUser = session?.user || null;
        if (mounted) {
          setUser(currentUser);
          if (!currentUser) setShowAuthGate(true);
        }

        if (currentUser) {
          const { data, error } = await client
            .from('notes')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0 && mounted) {
            setNotesList(data);
            setActiveNoteId(data[0].id);
            setNotesData(data[0].notes_data || DEFAULT_NOTE_DATA);
            return;
          }
        }

        // LocalStorage fallback
        const cached = localStorage.getItem('skillweave_saved_notes_list');
        if (cached && mounted) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.length > 0) {
              setNotesList(parsed);
              setActiveNoteId(parsed[0].id);
              setNotesData(parsed[0].notes_data || DEFAULT_NOTE_DATA);
              return;
            }
          } catch (e) {}
        }

        // Default item
        const defaultItem = {
          id: `note_${Date.now()}`,
          title: DEFAULT_NOTE_DATA.title,
          video_id: DEFAULT_NOTE_DATA.video_id,
          notes_data: DEFAULT_NOTE_DATA,
          created_at: new Date().toISOString()
        };
        if (mounted) {
          setNotesList([defaultItem]);
          setActiveNoteId(defaultItem.id);
        }
      } catch (err) {
        console.warn('Init notes error:', err);
      }
    };

    initNotes();
    return () => { mounted = false; };
  }, [client]);

  // 2. Start a New Note
  const handleNewNote = () => {
    if (!user) {
      setShowAuthGate(true);
      return;
    }
    setVideoUrl('');
    setNotesData(null);
    setActiveNoteId(null);
  };

  // 3. Generate Notes
  const handleGenerate = async (customUrl = null) => {
    if (!user) {
      setShowAuthGate(true);
      return;
    }
    const urlToUse = customUrl || videoUrl;
    if (!urlToUse.trim()) return;
    setLoading(true);

    try {
      const generated = await generateHandwrittenNotes(urlToUse, noteStyle);
      setNotesData(generated);

      const newNoteItem = {
        id: `note_${Date.now()}`,
        title: generated.title || 'New Study Note',
        video_id: generated.video_id || 'custom',
        notes_data: generated,
        created_at: new Date().toISOString()
      };

      const updated = [newNoteItem, ...notesList];
      setNotesList(updated);
      setActiveNoteId(newNoteItem.id);

      // Save to Supabase if authenticated
      if (user?.id) {
        try {
          const { data } = await client.from('notes').insert({
            user_id: user.id,
            video_id: newNoteItem.video_id,
            title: newNoteItem.title,
            notes_data: generated,
            created_at: new Date().toISOString()
          }).select();
          if (data && data[0]) {
            newNoteItem.id = data[0].id;
            setActiveNoteId(data[0].id);
          }
        } catch (dbErr) {
          console.warn('Note save notice:', dbErr);
        }
      }

      try {
        localStorage.setItem('skillweave_saved_notes_list', JSON.stringify(updated));
      } catch (e) {}

    } catch (err) {
      alert("Failed to generate handwritten notes. Please check the YouTube link.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Select Note from Sidebar
  const handleSelectNote = (item) => {
    setActiveNoteId(item.id);
    setNotesData(item.notes_data);
    if (item.video_id && !item.video_id.startsWith('note_')) {
      setVideoUrl(`https://www.youtube.com/watch?v=${item.video_id}`);
    }
  };

  // 5. Rename Note Title
  const handleStartRename = (item, e) => {
    e.stopPropagation();
    setEditingNoteId(item.id);
    setEditNoteTitle(item.title);
  };

  const handleSaveRename = async (noteId, e) => {
    if (e) e.stopPropagation();
    if (!editNoteTitle.trim()) {
      setEditingNoteId(null);
      return;
    }

    const updated = notesList.map(n => n.id === noteId ? { ...n, title: editNoteTitle.trim() } : n);
    setNotesList(updated);
    setEditingNoteId(null);

    if (user?.id) {
      try {
        await client.from('notes').update({ title: editNoteTitle.trim(), updated_at: new Date().toISOString() }).eq('id', noteId);
      } catch (e) {}
    }

    try {
      localStorage.setItem('skillweave_saved_notes_list', JSON.stringify(updated));
    } catch (e) {}
  };

  // 6. Delete Note
  const handleDeleteNote = async (noteId, e) => {
    e.stopPropagation();
    const filtered = notesList.filter(n => n.id !== noteId);
    setNotesList(filtered);

    if (activeNoteId === noteId) {
      if (filtered.length > 0) {
        handleSelectNote(filtered[0]);
      } else {
        handleNewNote();
      }
    }

    if (user?.id) {
      try {
        await client.from('notes').delete().eq('id', noteId);
      } catch (e) {}
    }

    try {
      localStorage.setItem('skillweave_saved_notes_list', JSON.stringify(filtered));
    } catch (e) {}
  };

  return (
    <div className="chatgpt-studio-page">
      <Navbar />

      <div className="chatgpt-workspace-container">
        {/* MAIN STAGE: NOTES GENERATION & PAPER VIEWER (MIDDLE) */}
        <div className="chatgpt-main-stage">
          {/* Top Paste Link & Options Bar */}
          <div className="chatgpt-grounding-header">
            <div className="grounding-left">
              <BackButton fallback="/" label="Back" style={{ marginRight: '0.65rem' }} />
              <span className="grounding-pill" style={{ color: '#d97706', background: 'rgba(217, 119, 6, 0.1)' }}>
                <Sparkles size={13} /> Notes Studio
              </span>
              <div className="grounding-video-meta">
                <h3 className="grounding-video-title">
                  {notesData?.title || 'Synthesize Handwritten Study Notes'}
                </h3>
              </div>
            </div>

            <div className="grounding-right-controls">
              {/* Density Toggle */}
              <div className="density-toggle-group">
                <button 
                  className={`density-pill-btn ${noteStyle === 'detailed' ? 'is-active' : ''}`}
                  onClick={() => setNoteStyle('detailed')}
                >
                  Detailed Guide
                </button>
                <button 
                  className={`density-pill-btn ${noteStyle === 'concise' ? 'is-active' : ''}`}
                  onClick={() => setNoteStyle('concise')}
                >
                  High-Yield
                </button>
              </div>

              {/* Paste Link Field */}
              <div className="grounding-url-field" style={{ width: '340px' }}>
                <Link2 size={15} className="link-icon-muted" />
                <input
                  type="text"
                  placeholder="Paste YouTube Video URL to Synthesize..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button 
                  className="grounding-load-btn" 
                  onClick={() => handleGenerate()}
                  disabled={loading || !videoUrl.trim()}
                >
                  {loading ? 'Synthesizing...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="grounding-presets-strip">
            <span className="presets-label">Quick Samples:</span>
            {sampleVideos.map((s, idx) => (
              <button
                key={idx}
                className="preset-chip"
                onClick={() => {
                  setVideoUrl(s.url);
                  handleGenerate(s.url);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Canvas Scroll Area */}
          <div className="chatgpt-notes-canvas-scroll">
            {loading ? (
              <div className="notes-loading-state-card">
                <Loader2 size={36} className="animate-spin text-amber-600 mb-2" />
                <h4>Synthesizing Authentic Handwritten Notebook Page</h4>
                <p>Analyzing video transcript, extracting formulas, definitions, and applying ink typography...</p>
              </div>
            ) : notesData ? (
              <div className="handwritten-viewer-embed">
                <HandwrittenNotesViewer
                  notesData={notesData}
                  onSaveNote={() => alert("Note is automatically synchronized to your library!")}
                />
              </div>
            ) : (
              <div className="notes-empty-create-box">
                <FileText size={48} className="text-slate-300" />
                <h3>Ready to Create Notes</h3>
                <p>Paste any YouTube lecture link above to generate authentic handwritten study sheets.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR: ChatGPT-Style Notes History */}
        <aside className="chatgpt-right-sidebar">
          <div className="sidebar-top-action">
            <button className="chatgpt-new-chat-btn" onClick={handleNewNote}>
              <Plus size={16} /> <span>New Note</span>
            </button>
          </div>

          <div className="sidebar-section-label">
            <span>Saved Notes ({notesList.length})</span>
          </div>

          <div className="sidebar-threads-scroll">
            {notesList.map((item) => {
              const isActive = item.id === activeNoteId;
              const isEditing = editingNoteId === item.id;

              return (
                <div 
                  key={item.id} 
                  className={`sidebar-thread-item ${isActive ? 'active-thread' : ''}`}
                  onClick={() => handleSelectNote(item)}
                >
                  <FileText size={15} className="thread-msg-icon" style={{ color: isActive ? '#d97706' : '#94a3b8' }} />

                  {isEditing ? (
                    <div className="thread-edit-inline" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        autoFocus
                        value={editNoteTitle}
                        onChange={(e) => setEditNoteTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(item.id, e);
                          if (e.key === 'Escape') setEditingNoteId(null);
                        }}
                      />
                      <button className="edit-confirm-btn" onClick={(e) => handleSaveRename(item.id, e)}>
                        <Check size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="thread-title-meta">
                      <span className="thread-title-text" title={item.title}>{item.title}</span>
                      <span className="thread-video-sub">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="thread-actions-hover">
                      <button 
                        className="thread-action-icon"
                        onClick={(e) => handleStartRename(item, e)}
                        title="Rename Note"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        className="thread-action-icon delete-icon"
                        onClick={(e) => handleDeleteNote(item.id, e)}
                        title="Delete Note"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="sidebar-footer-note">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>Encrypted in Supabase PostgreSQL</span>
          </div>
        </aside>
      </div>

      {/* Feature Access Sign-In Gate */}
      <AuthGateModal
        isOpen={showAuthGate}
        onClose={() => setShowAuthGate(false)}
        featureName="AI Handwritten Notes"
        featureIcon={FileText}
        featureDescription="Sign in with your account to generate authentic handwritten study sheets, download printable PDFs, and save your notes in the cloud."
      />
    </div>
  );
};

export default HandwrittenNotesPage;
