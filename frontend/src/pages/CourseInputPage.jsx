import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { generateCourse } from '../services/api';
import './CourseInputPage.css';

const CourseInputPage = () => {
    const [topic, setTopic] = useState('');
    const [level, setLevel] = useState('Beginner');
    const [accent, setAccent] = useState('Any');
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const navigate = useNavigate();

    const loadingMessages = [
        "Analyzing learning patterns...",
        "Scouring YouTube API...",
        "Filtering clickbait...",
        "Matching teaching accents...",
        "Building continuity graph...",
        "Finalizing your roadmap..."
    ];

    const handleGenerate = async () => {
        if (!topic) return;
        setLoading(true);
        try {
            // cycle through loading messages
            const interval = setInterval(() => {
                setLoadingStep(prev => (prev + 1) % loadingMessages.length);
            }, 1500);

            const courseData = await generateCourse(topic, level, accent);
            clearInterval(interval);
            navigate('/roadmap', { state: { courseData } });
        } catch (error) {
            alert("Failed to generate course. Please try again.");
        } finally {
            setLoading(false);
            setLoadingStep(0);
        }
    };

    return (
        <div className="input-page-container">
            <div className="background-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>
            <div className="card input-card">
                <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    Design Your Path
                </motion.h2>

                <div className="form-group">
                    <label>What do you want to learn?</label>
                    <div className="input-wrapper">
                        <Search className="input-icon" size={20} />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="e.g. Python for Data Science"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>
                </div>

                <div className="options-grid">
                    <div className="form-group">
                        <label>Level</label>
                        <select className="input-field" value={level} onChange={(e) => setLevel(e.target.value)}>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Teacher Style / Accent</label>
                        <select className="input-field" value={accent} onChange={(e) => setAccent(e.target.value)}>
                            <option value="Any">Any Style</option>
                            <option value="Indian English">Indian English (Detailed)</option>
                            <option value="US English">US English (Fast Paced)</option>
                            <option value="British English">British English (Formal)</option>
                        </select>
                    </div>
                </div>

                <button
                    className="btn-primary generate-btn"
                    onClick={handleGenerate}
                    disabled={loading || !topic}
                >
                    {loading ? (
                        <span className="flex-center">
                            <Loader2 className="spin" /> Generating...
                        </span>
                    ) : (
                        <span className="flex-center">
                            <Sparkles size={18} /> Generate Roadmap
                        </span>
                    )}
                </button>
            </div>

            {loading && (
                <div className="loading-overlay">
                    <div className="loader-animation">
                        <div className="orbital-ring"></div>
                        <div className="orbital-ring ring-2"></div>
                        <Sparkles className="loader-icon" />
                    </div>
                    <p className="loading-text">{loadingMessages[loadingStep]}</p>
                </div>
            )}
        </div>
    );
};

export default CourseInputPage;
