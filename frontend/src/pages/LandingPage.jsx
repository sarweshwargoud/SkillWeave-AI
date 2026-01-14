import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, PlayCircle, BookOpen, Layers } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-container">
            {/* Navbar */}
            <nav className="navbar fade-in">
                <div className="logo">SkillWeave AI</div>
                <button className="btn-secondary" onClick={() => navigate('/create')}>Get Started</button>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="hero-content"
                >
                    <h1 className="hero-title">SkillWeave <span className="gradient-text">AI</span></h1>
                    <h2 className="hero-subtitle">Master Any Skill with AI-Curated Playlists</h2>
                    <p className="hero-description">
                        Structure your learning. Verified continuity. Accent-matched teachers.
                        Stop wasting time searching, start learning.
                    </p>
                    <button className="btn-primary btn-lg" onClick={() => navigate('/create')}>
                        Generate Roadmap <ArrowRight size={20} />
                    </button>
                </motion.div>
            </section>

            {/* Features */}
            <section className="features">
                <div className="feature-card">
                    <BookOpen className="icon" />
                    <h3>Structured Syllabus</h3>
                    <p>AI breaks down complex topics into digestible modules.</p>
                </div>
                <div className="feature-card">
                    <Layers className="icon" />
                    <h3>Topic Continuity</h3>
                    <p>We ensure Video B starts exactly where Video A ended.</p>
                </div>
                <div className="feature-card">
                    <PlayCircle className="icon" />
                    <h3>Best Quality</h3>
                    <p>Filtered for clickbait, ranked for teaching density.</p>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
