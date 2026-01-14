import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CourseInputPage from './pages/CourseInputPage';
import RoadmapPage from './pages/RoadmapPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<CourseInputPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
      </Routes>
    </Router>
  );
}

export default App;
