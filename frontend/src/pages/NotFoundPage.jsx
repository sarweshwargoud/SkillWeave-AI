import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';
import './NotFoundPage.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-page-wrapper">
      <Navbar />
      <div className="not-found-content-card">
        <div className="not-found-icon-box">
          <Compass size={40} className="text-rose-500 animate-spin-slow" />
        </div>
        <span className="not-found-tag">404 • ROUTE NOT FOUND</span>
        <h1>Lost in Curriculum Space?</h1>
        <p>The page or milestone you are looking for doesn't exist or has moved.</p>
        <div className="not-found-actions">
          <BackButton label="Go Back" fallback="/" />
          <button 
            type="button" 
            className="btn-primary"
            onClick={() => navigate('/')}
          >
            <Home size={16} /> Home Studio
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
