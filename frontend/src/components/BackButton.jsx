import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './BackButton.css';

/**
 * Reusable BackButton component
 * Requirements:
 * - Visually clear back-navigation arrow with accessible tooltip.
 * - Navigates to previous valid in-app page using router history (window.history.state?.idx > 0).
 * - Falls back to safe in-app page (default: '/') when opened in a new tab or after refresh.
 * - Responsive on desktop, tablet, and mobile.
 */
const BackButton = ({
  fallback = '/',
  label = 'Back',
  showLabel = true,
  className = '',
  style = {}
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // Check if there is valid in-app React Router history
    // window.history.state?.idx is incremented by React Router on each in-app push
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      // Safe fallback to application home or designated in-app landing
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      className={`app-back-button ${className}`}
      onClick={handleBack}
      title="Go back"
      aria-label="Go back"
      style={style}
    >
      <ArrowLeft size={16} className="back-arrow-icon" />
      {showLabel && <span className="back-button-label">{label}</span>}
    </button>
  );
};

export default BackButton;
