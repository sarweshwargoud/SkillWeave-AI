import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { getClient } from '../services/supabaseClient';
import TiltCard from '../components/TiltCard';
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
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        navigate('/profile');
      }
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
          email,
          password
        });
        if (error) throw error;
        if (data.user) {
          navigate('/profile');
        }
      } else {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        });
        if (error) throw error;
        if (data.user) {
          alert('Sign up successful! Welcome to SkillWeave AI.');
          navigate('/profile');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
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
    } catch (err) {
      setError(err.message || 'Google Authentication failed.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-mesh-grid"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="auth-card-wrapper"
      >
        <TiltCard className="auth-glass-card" maxTilt={6}>
          <div className="auth-header">
            <h2 className="auth-logo">SkillWeave <span className="gradient-text">AI</span></h2>
            <p className="auth-subtitle">
              {isLogin ? 'Access your AI roadmaps & projects' : 'Create an account to save progress'}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="auth-error-alert"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="auth-form-group">
                <label>Full Name</label>
                <div className="auth-input-wrapper">
                  <User className="auth-input-icon" size={18} />
                  <input
                    type="text"
                    required
                    className="auth-input-field"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="auth-form-group">
              <label>Email Address</label>
              <div className="auth-input-wrapper">
                <Mail className="auth-input-icon" size={18} />
                <input
                  type="email"
                  required
                  className="auth-input-field"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label>Password</label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" size={18} />
                <input
                  type="password"
                  required
                  minLength={6}
                  className="auth-input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Get Started'} 
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <button onClick={handleGoogleLogin} className="auth-google-btn" disabled={loading}>
            <svg className="google-svg" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.98 1 12 1 7.35 1 3.37 3.68 1.41 7.59l3.78 2.93C6.11 7.21 8.84 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.48c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.49-4.92 3.49-8.56z"
              />
              <path
                fill="#FBBC05"
                d="M5.19 14.61c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.41 7.1C.51 8.9 0 10.9 0 13s.51 4.1 1.41 5.9l3.78-2.93z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.16 0-5.89-2.17-6.81-5.48L1.41 15.9C3.37 20.32 7.35 23 12 23z"
              />
            </svg>
            Google Authenticator
          </button>

          <div className="auth-footer-toggle">
            {isLogin ? (
              <p>
                New to SkillWeave?{' '}
                <button onClick={() => setIsLogin(false)} className="toggle-btn">
                  Create an account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button onClick={() => setIsLogin(true)} className="toggle-btn">
                  Sign in here
                </button>
              </p>
            )}
          </div>
          
          <div className="auth-encryption-info">
            <ShieldCheck size={14} /> End-to-end Supabase credentials validation.
          </div>
        </TiltCard>
      </motion.div>
    </div>
  );
};

export default AuthPage;
