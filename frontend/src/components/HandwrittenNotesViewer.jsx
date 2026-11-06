import { useState } from 'react';
import { 
  Download, 
  Printer, 
  Sparkles, 
  BookOpen, 
  Edit3, 
  Check, 
  Palette, 
  FileCheck, 
  Share2,
  Bookmark
} from 'lucide-react';
import './HandwrittenNotesViewer.css';

const HandwrittenNotesViewer = ({ notesData, onSaveNote }) => {
  const [theme, setTheme] = useState('ruled'); // 'ruled' | 'grid' | 'parchment' | 'clean'
  const [fontMode, setFontMode] = useState('hand'); // 'hand' | 'cursive' | 'sans'
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(notesData);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!notes) {
    return (
      <div className="notes-empty-prompt">
        <p>No notes data provided.</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const textRep = `
# ${notes.title}
Subject: ${notes.subject}

## Overview
${notes.overview}

## Key Definitions
${notes.definitions?.map(d => `- **${d.term}** (${d.tag}): ${d.definition}`).join('\n')}

## Core Sections
${notes.sections?.map(s => `### ${s.heading}\n${s.points?.map(p => `- ${p}`).join('\n')}\n${s.highlight_box ? `> ${s.highlight_box}` : ''}`).join('\n\n')}

## Summary
${notes.summary}
    `.trim();

    navigator.clipboard.writeText(textRep);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToLibrary = () => {
    if (onSaveNote) {
      onSaveNote(notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const getThemeClass = () => {
    switch (theme) {
      case 'grid': return 'notebook-grid';
      case 'parchment': return 'notebook-parchment';
      case 'clean': return 'notebook-clean';
      default: return 'notebook-ruled';
    }
  };

  const getFontClass = () => {
    switch (fontMode) {
      case 'cursive': return 'handwritten-cursive';
      case 'sans': return '';
      default: return 'handwritten-font';
    }
  };

  return (
    <div className="handwritten-viewer-wrapper">
      {/* Notebook Toolbar */}
      <div className="notebook-toolbar">
        <div className="toolbar-left-group">
          <div className="theme-pill-selector">
            <span className="selector-label"><Palette size={13} /> Paper:</span>
            <button
              className={`pill-btn ${theme === 'ruled' ? 'active' : ''}`}
              onClick={() => setTheme('ruled')}
            >
              Ruled Lines
            </button>
            <button
              className={`pill-btn ${theme === 'grid' ? 'active' : ''}`}
              onClick={() => setTheme('grid')}
            >
              Grid Paper
            </button>
            <button
              className={`pill-btn ${theme === 'parchment' ? 'active' : ''}`}
              onClick={() => setTheme('parchment')}
            >
              Warm Parchment
            </button>
            <button
              className={`pill-btn ${theme === 'clean' ? 'active' : ''}`}
              onClick={() => setTheme('clean')}
            >
              Clean Studio
            </button>
          </div>

          <div className="font-pill-selector">
            <span className="selector-label">Ink Style:</span>
            <button
              className={`pill-btn ${fontMode === 'hand' ? 'active' : ''}`}
              onClick={() => setFontMode('hand')}
            >
              Study Script
            </button>
            <button
              className={`pill-btn ${fontMode === 'cursive' ? 'active' : ''}`}
              onClick={() => setFontMode('cursive')}
            >
              Cursive
            </button>
            <button
              className={`pill-btn ${fontMode === 'sans' ? 'active' : ''}`}
              onClick={() => setFontMode('sans')}
            >
              Print Typeset
            </button>
          </div>
        </div>

        <div className="toolbar-right-actions">
          <button 
            className={`tool-action-btn ${isEditing ? 'active-edit' : ''}`} 
            onClick={() => setIsEditing(!isEditing)}
            title="Edit notes"
          >
            <Edit3 size={15} />
            <span>{isEditing ? 'Done Editing' : 'Edit Notes'}</span>
          </button>

          <button className="tool-action-btn" onClick={handleCopy} title="Copy markdown notes">
            {copied ? <Check size={15} className="text-green" /> : <Share2 size={15} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button className="tool-action-btn" onClick={handlePrint} title="Print or Save as PDF">
            <Printer size={15} />
            <span>Print / PDF</span>
          </button>

          {onSaveNote && (
            <button className="btn-primary tool-save-btn" onClick={handleSaveToLibrary}>
              <Bookmark size={15} />
              <span>{saved ? 'Saved to Library!' : 'Save Notes'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Realistic Notebook Page */}
      <div className={`notebook-sheet ${getThemeClass()} ${getFontClass()}`}>
        {/* Notebook Tape / Binding Accent */}
        <div className="notebook-top-tape"></div>

        {/* Note Header */}
        <div className="note-page-header">
          <div className="note-date-stamp">
            DATE: <span>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="note-subject-tag">
            SUBJECT: <span>{notes.subject || 'Comprehensive Masterclass'}</span>
          </div>
        </div>

        {/* Note Title */}
        <div className="note-title-section">
          {isEditing ? (
            <input
              type="text"
              className="editable-title-input"
              value={notes.title}
              onChange={(e) => setNotes({ ...notes, title: e.target.value })}
            />
          ) : (
            <h1 className="note-handwritten-title">{notes.title}</h1>
          )}
          <div className="handwritten-underline" />
        </div>

        {/* Overview Synthesis */}
        <div className="note-overview-block">
          <span className="overview-marker">✦ Synthesis & Core Takeaway:</span>
          {isEditing ? (
            <textarea
              className="editable-textarea"
              rows={3}
              value={notes.overview}
              onChange={(e) => setNotes({ ...notes, overview: e.target.value })}
            />
          ) : (
            <p className="overview-paragraph">{notes.overview}</p>
          )}
        </div>

        {/* Highlighted Definitions Callouts */}
        {notes.definitions && notes.definitions.length > 0 && (
          <div className="note-definitions-grid">
            {notes.definitions.map((def, idx) => (
              <div key={idx} className="definition-card-callout">
                <div className="def-header">
                  <span className="def-term">{def.term}</span>
                  <span className="def-badge">{def.tag || 'DEFINITION'}</span>
                </div>
                <p className="def-text">{def.definition}</p>
              </div>
            ))}
          </div>
        )}

        {/* Core Sections */}
        <div className="note-sections-flow">
          {notes.sections && notes.sections.map((sec, idx) => (
            <div key={idx} className="note-section-container">
              <h3 className="section-ink-heading">
                <span className="section-bullet-num">§{idx + 1}</span> {sec.heading}
              </h3>

              <ul className="section-bullets-list">
                {sec.points && sec.points.map((pt, pIdx) => (
                  <li key={pIdx} className="section-bullet-item">
                    <span className="bullet-dash">–</span>
                    <span className="bullet-content">{pt}</span>
                  </li>
                ))}
              </ul>

              {sec.highlight_box && (
                <div className="section-highlight-box">
                  <span className="highlight-pin">📌 KEY OBSERVATION:</span>
                  <p>{sec.highlight_box}</p>
                </div>
              )}

              {sec.formula_or_code && (
                <div className="section-formula-box">
                  <span className="formula-tag">FORMULA / CODE / FLOW:</span>
                  <pre className="formula-code-body">{sec.formula_or_code}</pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Diagram Flowchart */}
        {notes.diagram && notes.diagram.steps && notes.diagram.steps.length > 0 && (
          <div className="note-diagram-wrapper">
            <h4 className="diagram-title">✎ {notes.diagram.title || 'Conceptual Execution Flow'}:</h4>
            <div className="diagram-steps-strip">
              {notes.diagram.steps.map((st, sIdx) => (
                <div key={sIdx} className="diagram-step-box">
                  <span className="step-num-badge">0{sIdx + 1}</span>
                  <span className="step-label">{st}</span>
                  {sIdx < notes.diagram.steps.length - 1 && (
                    <span className="step-arrow">➔</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* High-Yield Exam / Interview Takeaways */}
        {notes.exam_takeaways && notes.exam_takeaways.length > 0 && (
          <div className="exam-takeaways-card">
            <h4 className="exam-takeaways-title">
              ★ High-Yield Exam & Practical Points:
            </h4>
            <div className="exam-points-list">
              {notes.exam_takeaways.map((tip, tIdx) => (
                <div key={tIdx} className="exam-point-row">
                  <span className="exam-check-box">☑</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Footer */}
        {notes.summary && (
          <div className="note-summary-footer">
            <strong>FINAL SUMMARY:</strong> {notes.summary}
          </div>
        )}

        <div className="notebook-bottom-signature">
          <span>SkillWeave AI Study System</span> • <span>Verified from Video Transcript</span>
        </div>
      </div>
    </div>
  );
};

export default HandwrittenNotesViewer;
