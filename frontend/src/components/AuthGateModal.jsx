import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  X, 
  Loader2,
  ShieldCheck,
  Compass,
  FileText,
  MessageSquare,
  Play
} from 'lucide-react';
import { getClient } from '../services/supabaseClient';
import './AuthGateModal.css';

/**
 * AuthGateModal
 * Prompts unauthenticated users to sign in to access core features
 * (Roadmap Generator, AI Video Tutor, Handwritten Notes, Learning Workspace).
 */
const AuthGateModal = ({ 
  isOpen = true, 
  onClose = null, 
  featureName = "this feature",
  featureIcon: FeatureIcon = Sparkles,
  featureDescription = "Sign in to unlock personalized AI generation, progress tracking, and cloud persistence."
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const client = getClient();
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState('');

  const currentPath = location.pathname + location.search;

  const handleGoogleSignIn = async () => {
    setError('');
    setOauthLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth`;
      const { data, error: oauthErr } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      if (oauthErr) throw oauthErr;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err.message || 'Google sign-in initialization failed');
      setOauthLoading(false);
    }
  };

  const handleEmailSignIn = () => {
    navigate('/auth', { state: { from: currentPath } });
  };

  if (!isOpen) return null;

  return (
    <div className="auth-gate-overlay">
      <motion.div 
        className="auth-gate-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose || (() => navigate('/'))}
      />

      <motion.div
        className="auth-gate-modal-card"
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {onClose && (
          <button className="auth-gate-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        )}

        <div className="auth-gate-badge-row">
          <div className="auth-gate-lock-icon">
            <Lock size={20} className="text-rose-500" />
          </div>
          <span className="auth-gate-pill">AUTHENTICATION REQUIRED</span>
        </div>

        <h2 className="auth-gate-title">
          Sign In to Start Using {featureName}
        </h2>
        <p className="auth-gate-desc">
          {featureDescription}
        </p>

        {error && (
          <div className="auth-gate-error-banner">
            {error}
          </div>
        )}

        {/* Feature Perquisites List */}
        <div className="auth-gate-benefits">
          <div className="benefit-item">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>AI Roadmap Synthesis & Video-to-Curriculum Extraction</span>
          </div>
          <div className="benefit-item">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>Context-Grounded Video Tutor with Timestamp Seeking</span>
          </div>
          <div className="benefit-item">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>Autosaved Handwritten Notes, Chat History & Progress in DB</span>
          </div>
        </div>

        {/* Direct Actions */}
        <div className="auth-gate-actions">
          <button 
            type="button"
            className="auth-gate-google-btn"
            onClick={handleGoogleSignIn}
            disabled={oauthLoading}
          >
            {oauthLoading ? (
              <Loader2 size={18} className="animate-spin text-gray-600" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <button 
            type="button"
            className="auth-gate-email-btn"
            onClick={handleEmailSignIn}
            disabled={oauthLoading}
          >
            <span>Sign In with Email / Password</span>
            <ArrowRight size={16} />
          </button>

          {onClose && (
            <button 
              type="button"
              className="auth-gate-guest-btn"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '0.5rem',
                textDecoration: 'underline'
              }}
            >
              Continue in Guest Demo Mode
            </button>
          )}
        </div>

        <div className="auth-gate-footer">
          <ShieldCheck size={14} className="text-gray-400" />
          <span>Secure authentication powered by Supabase Auth with Google OAuth</span>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthGateModal;
