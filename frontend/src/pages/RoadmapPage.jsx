import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Clock, CheckCircle, Download, Share2 } from 'lucide-react';
import './RoadmapPage.css';

const RoadmapPage = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const course = state?.courseData;

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

    if (!course) {
        return (
            <div className="roadmap-container center-error">
                <p>No course data found. <button className="link-btn" onClick={() => navigate('/create')}>Create one</button></p>
            </div>
        );
    }

    return (
        <div className="roadmap-container">
            <header className="roadmap-header">
                <button className="back-btn" onClick={() => navigate('/create')}>
                    <ArrowLeft size={20} />
                </button>
                <div className="header-content">
                    <h1>{course.title}</h1>
                    <p className="subtitle">{course.modules.length} Modules • AI Curated</p>
                </div>
                <button className="download-btn" onClick={handleDownload} title="Download Roadmap (DOCX)">
                    <Download size={20} />
                    <span className="btn-text">Download</span>
                </button>
            </header>

            <div className="timeline">
                {course.modules.map((mod, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
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
                                            <Play size={16} /> Watch
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>


            <footer className="roadmap-footer">
                <p>Created by Sarweshwar</p>
            </footer>
        </div >
    );
};

export default RoadmapPage;
