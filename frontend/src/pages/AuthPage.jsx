import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ShieldCheck, ArrowLeft, Sparkles } from 'lucide-react';
import { getClient } from '../services/supabaseClient';
import FloatingTiles from '../components/FloatingTiles';
import './AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const client = getClient();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await client.auth.getUser();
        if (data?.user) {
          navigate('/profile');
        }
      } catch (e) {}
    };
    checkUser();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (error) throw error;
        if (data.user) {
          navigate('/profile');
        }
      } else {
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { 
              full_name: name.trim(),
              name: name.trim()
            }
          }
        });
        if (error) throw error;
        if (data.user) {
          if (!data.session) {
            // Auto sign-in if session wasn't returned directly
            await client.auth.signInWithPassword({
              email: email.trim(),
              password
            });
          }
          navigate('/profile');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google'
      });
      if (error) throw error;
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Google Authentication failed.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-studio-page">
      <button className="auth-back-btn" onClick={() => navigate('/')}>
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </button>

      <motion.div
        className="auth-studio-card"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-card-header">
          <div className="auth-brand-badge">
            <Sparkles size={14} className="badge-sparkle" />
            <span>SkillWeave Studio</span>
          </div>
          <h2 className="auth-headline typo-hero-title">
            {isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
          </h2>
          <p className="auth-sub">
            {isLogin ? 'Access your AI roadmaps, notes, and milestones.' : 'Start generating and tracking your sequential learning paths.'}
          </p>
        </div>

        {error && (
          <div className="auth-error-banner">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-layout">
          {!isLogin && (
            <div className="auth-input-group">
              <label>Full Name</label>
              <div className="auth-field-wrapper">
                <User size={18} className="field-icon" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="auth-input-group">
            <label>Email Address</label>
            <div className="auth-field-wrapper">
              <Mail size={18} className="field-icon" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            <div className="auth-field-wrapper">
              <Lock size={18} className="field-icon" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-action-btn" disabled={loading}>
            <span>{loading ? 'Authenticating...' : isLogin ? 'Sign In to Workspace' : 'Get Started Free'}</span>
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-or-divider">
          <span>or continue with</span>
        </div>

        <button onClick={handleGoogleLogin} className="google-auth-button" disabled={loading}>
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.98 1 12 1 7.35 1 3.37 3.68 1.41 7.59l3.78 2.93C6.11 7.21 8.84 5.04 12 5.04z" />
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.48c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.49-4.92 3.49-8.56z" />
            <path fill="#FBBC05" d="M5.19 14.61c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.41 7.1C.51 8.9 0 10.9 0 13s.51 4.1 1.41 5.9l3.78-2.93z" />
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.16 0-5.89-2.17-6.81-5.48L1.41 15.9C3.37 20.32 7.35 23 12 23z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="auth-mode-switch">
          {isLogin ? (
            <p>
              Don't have an account yet?{' '}
              <button onClick={() => setIsLogin(false)} className="mode-toggle-link">
                Create one now
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setIsLogin(true)} className="mode-toggle-link">
                Sign in here
              </button>
            </p>
          )}
        </div>

        <div className="auth-security-footer">
          <ShieldCheck size={14} /> Encrypted Workspace Authentication
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
