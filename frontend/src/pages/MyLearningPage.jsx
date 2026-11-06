import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Play, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  ArrowRight, 
  Plus, 
  Sparkles, 
  BookOpen,
  Trash2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import FloatingTiles from '../components/FloatingTiles';
import { getClient } from '../services/supabaseClient';
import './MyLearningPage.css';

const MyLearningPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const client = getClient();

  useEffect(() => {
    loadLearningData();
  }, []);

  const loadLearningData = async () => {
    try {
      const { data } = await client.from('courses').select('*');
      setCourses(data || []);
    } catch (e) {
      console.error("Load courses error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueCourse = (course) => {
    navigate('/workspace', { state: { courseData: course } });
  };

  const handleDeleteCourse = async (courseId, e) => {
    e.stopPropagation();
    if (!window.confirm("Remove this course from your learning dashboard?")) return;
    try {
      await client.from('courses').delete().eq('id', courseId);
      setCourses(prev => prev.filter(c => c.id !== courseId));
    } catch (e) {
      console.error("Delete course error:", e);
    }
  };

  return (
    <div className="mylearning-page-container">
      <Navbar />

      <main className="studio-container mylearning-main">
        {/* Header */}
        <div className="mylearning-header-bar">
          <div>
            <div className="mylearning-badge">
              <GraduationCap size={14} />
              <span>Personal Learning Hub</span>
            </div>
            <h1 className="mylearning-title typo-hero-title">MY LEARNING</h1>
            <p className="mylearning-sub">
              Track your active YouTube curriculum roadmaps, video milestones, and learning streaks.
            </p>
          </div>

          <div className="mylearning-actions">
            <button className="btn-primary" onClick={() => navigate('/create')}>
              <Plus size={16} /> New Roadmap
            </button>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="mylearning-loading">
            <p>Loading your courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="mylearning-empty-card">
            <BookOpen size={48} className="empty-icon" />
            <h3>No Courses in Progress</h3>
            <p>You haven't added any curriculum roadmaps yet. Turn any YouTube video or playlist into a structured course.</p>
            <button className="btn-primary" onClick={() => navigate('/create')}>
              Generate Your First Roadmap <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="courses-showcase-grid">
            {courses.map((course) => {
              // Calculate counts
              let totalVids = 0;
              let doneVids = 0;
              course.modules?.forEach(m => {
                const list = m.videos || (m.video ? [m.video] : []);
                list.forEach(v => {
                  totalVids++;
                  if (v.completed) doneVids++;
                });
              });

              const progress = course.progress !== undefined ? course.progress : (totalVids > 0 ? Math.round((doneVids / totalVids) * 100) : 0);

              return (
                <div
                  key={course.id || course.title}
                  className="course-dashboard-card"
                  onClick={() => handleContinueCourse(course)}
                >
                  {/* Thumbnail Banner */}
                  <div className="course-thumb-cover">
                    <img
                      src={course.thumbnail || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80'}
                      alt={course.title}
                    />
                    <div className="thumb-status-overlay">
                      <span className={`status-badge-pill ${progress === 100 ? 'done' : 'in-progress'}`}>
                        {progress === 100 ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="course-card-content">
                    <div className="card-top-row">
                      <h3 className="course-name">{course.title}</h3>
                      <button
                        className="delete-btn-ghost"
                        onClick={(e) => handleDeleteCourse(course.id, e)}
                        title="Remove course"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <p className="course-description">{course.description}</p>

                    {/* Stats strip */}
                    <div className="course-meta-strip">
                      <span className="meta-item">
                        <BookOpen size={13} /> {course.modules?.length || 1} Modules
                      </span>
                      <span className="meta-item">
                        <Clock size={13} /> {course.totalDuration || '30m'}
                      </span>
                      <span className="meta-item">
                        <CheckCircle2 size={13} /> {doneVids}/{totalVids || course.totalVideos || 1} Done
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="course-progress-section">
                      <div className="progress-labels">
                        <span>Course Completion</span>
                        <strong>{progress}%</strong>
                      </div>
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar-active"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Card Action Button */}
                    <button
                      className="btn-primary continue-course-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContinueCourse(course);
                      }}
                    >
                      <Play size={14} /> Continue Learning
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyLearningPage;
