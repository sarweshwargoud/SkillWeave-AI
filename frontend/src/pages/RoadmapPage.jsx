import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Clock, CheckCircle, Download, FolderHeart, Sparkles } from 'lucide-react';
import { getClient } from '../services/supabaseClient';
import './RoadmapPage.css';

const RoadmapPage = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const course = state?.courseData;
    const [user, setUser] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const client = getClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user: currentUser } } = await client.auth.getUser();
            setUser(currentUser);
        };
        checkUser();
    }, []);

    const handleDownload = async () => {
        if (!course) return;

        try {
            const response = await fetch('http://localhost:8000/api/v1/download-docx', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ course_data: course }),
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${course.title.replace(/\s+/g, '_')}_Roadmap.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading roadmap:', error);
            alert('Failed to download roadmap. Please try again.');
        }
    };

    const handleSaveToProfile = async () => {
        if (!user) {
            alert('Please login to save this roadmap to your profile workspace.');
            navigate('/auth');
            return;
        }

        setSaving(true);
        try {
            // Map modules to include completion status
            const structuredModules = course.modules.map(mod => ({
                ...mod,
                completed: false
            }));

            const newProject = {
                user_id: user.id,
                title: course.title,
                description: `AI-Curated Roadmap for learning ${course.title}. Contains ${course.modules.length} lessons.`,
                level: state?.level || 'Beginner',
                accent: state?.accent || 'Any',
                status: 'In Progress',
                progress: 0,
                roadmap_data: {
                    title: course.title,
                    modules: structuredModules
                },
                custom_tasks: []
            };

            const { data, error } = await client
                .from('projects')
                .insert(newProject);

            if (error) throw error;

            setSaved(true);
            alert('Roadmap saved successfully to your profile workspace!');
        } catch (error) {
            console.error('Error saving project:', error);
            alert('Failed to save project: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (!course) {
        return (
            <div className="roadmap-container center-error">
                <p>No course data found. <button className="link-btn" onClick={() => navigate('/create')}>Create one</button></p>
            </div>
        );
    }

    return (
        <div className="roadmap-container">
            {/* Top Navigation banner */}
            <nav className="roadmap-nav-top">
                <button className="nav-back-button" onClick={() => navigate('/create')}>
                    <ArrowLeft size={18} /> Back
                </button>
                <div className="nav-logo" onClick={() => navigate('/')}>SkillWeave AI</div>
                <div>
                    {user ? (
                        <button className="nav-profile-button" onClick={() => navigate('/profile')}>My Workspace</button>
                    ) : (
                        <button className="nav-profile-button" onClick={() => navigate('/auth')}>Login</button>
                    )}
                </div>
            </nav>

            <header className="roadmap-header">
                <div className="header-content">
                    <span className="ai-curated-badge"><Sparkles size={14} /> Gemini Verified Sequence</span>
                    <h1>{course.title}</h1>
                    <p className="subtitle">{course.modules.length} Modules • Topics Continuity Analyzed</p>
                </div>
                <div className="roadmap-header-actions">
                    {saved ? (
                        <button className="save-btn btn-success-saved" disabled>
                            <CheckCircle size={18} /> Saved to Profile
                        </button>
                    ) : (
                        <button className="save-btn" onClick={handleSaveToProfile} disabled={saving}>
                            <FolderHeart size={18} /> {saving ? 'Saving...' : 'Save to Profile'}
                        </button>
                    )}
                    <button className="download-btn" onClick={handleDownload} title="Download Roadmap (DOCX)">
                        <Download size={18} />
                        <span className="btn-text">Download</span>
                    </button>
                </div>
            </header>

            <div className="timeline">
                {course.modules.map((mod, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="timeline-item"
                    >
                        <div className="timeline-marker">{index + 1}</div>
                        <div className="timeline-content card">
                            <div className="module-info">
                                <h3>{mod.module_title}</h3>
                                <p>{mod.description}</p>
                            </div>

                            {mod.video && (
                                <div className="video-preview">
                                    <a
                                        href={`https://www.youtube.com/watch?v=${mod.video.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="thumbnail-wrapper"
                                    >
                                        <img src={mod.video.thumbnail} alt={mod.video.title} />
                                        <div className="duration-badge">
                                            {Math.floor(mod.video.duration / 60)}:{String(Math.floor(mod.video.duration % 60)).padStart(2, '0')}
                                        </div>
                                    </a>
                                    <div className="video-details">
                                        <a
                                            href={`https://www.youtube.com/watch?v=${mod.video.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="video-title-link"
                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                        >
                                            <h4>{mod.video.title}</h4>
                                        </a>
                                        <span className="channel-name">{mod.video.channelTitle}</span>
                                        <div className="badges">
                                            <span className="badge score-badge">Match: {Math.round(mod.video.final_score)}%</span>
                                        </div>
                                        <a
                                            href={`https://www.youtube.com/watch?v=${mod.video.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="play-link"
                                        >
                                            <Play size={16} /> Watch Lesson
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            <footer className="roadmap-footer">
                <p>Created by Sarweshwar • Powered by Gemini AI</p>
            </footer>
        </div >
    );
};

export default RoadmapPage;
