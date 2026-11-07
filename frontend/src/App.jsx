import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CourseInputPage from './pages/CourseInputPage';
import RoadmapPage from './pages/RoadmapPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import HandwrittenNotesPage from './pages/HandwrittenNotesPage';
import AITutorPage from './pages/AITutorPage';
import LearningWorkspacePage from './pages/LearningWorkspacePage';
import MyLearningPage from './pages/MyLearningPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import NotFoundPage from './pages/NotFoundPage';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

/**
 * Global Scroll Restoration Helper
 * Ensures browser back, forward, and client route navigation
 * scroll to top cleanly rather than leaving users in blank bottom space.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Learning Workspace manages its own internal 3-column scroll panes
    if (pathname !== '/workspace' && pathname !== '/workplace') {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Landing / Showcase */}
          <Route path="/" element={<LandingPage />} />

          {/* Roadmap Generator / Studio */}
          <Route path="/create" element={<CourseInputPage />} />

          {/* Visual Milestone Roadmap */}
          <Route path="/roadmap" element={<RoadmapPage />} />

          {/* Learning Workspace (Primary Route and /workplace Alias) */}
          <Route path="/workspace" element={<LearningWorkspacePage />} />
          <Route path="/workplace" element={<LearningWorkspacePage />} />

          {/* Autonomous Feature Studios */}
          <Route path="/notes" element={<HandwrittenNotesPage />} />
          <Route path="/tutor" element={<AITutorPage />} />
          <Route path="/my-learning" element={<MyLearningPage />} />

          {/* Auth & Identity Routes */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Legal Pages */}
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Dedicated 404 Recovery Boundary */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
