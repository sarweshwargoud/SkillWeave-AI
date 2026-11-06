import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Sparkles, 
  Map, 
  FileText, 
  MessageSquare, 
  GraduationCap, 
  User, 
  Menu, 
  X,
  PlaySquare
} from 'lucide-react';
import { getClient } from '../services/supabaseClient';
import './Navbar.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const client = getClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await client.auth.getUser();
      setUser(currentUser);
    };
    checkUser();
  }, [location.pathname]);

  const navLinks = [
    { name: "Overview", path: "/" },
    { name: "Roadmap Generator", path: "/create", icon: Map },
    { name: "Handwritten Notes", path: "/notes", icon: FileText },
    { name: "AI Video Tutor", path: "/tutor", icon: MessageSquare },
    { name: "Learning Workspace", path: "/workspace", icon: PlaySquare },
    { name: "My Learning", path: "/my-learning", icon: GraduationCap },
  ];

  const isActive = (path) => {
    if (path === "/" && location.pathname !== "/") return false;
    return location.pathname.startsWith(path);
  };

  return (
    <header className="global-navbar-wrapper">
      <div className="global-navbar">
        {/* Brand */}
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <div className="brand-icon-box">
            <span className="brand-dot"></span>
            <span className="brand-bar"></span>
          </div>
          <span className="brand-title">SKILLWEAVE</span>
          <span className="brand-ai-badge">AI</span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="navbar-desktop-menu">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-menu-item ${active ? 'active' : ''}`}
              >
                {Icon && <Icon size={14} className="menu-icon" />}
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right CTA / User */}
        <div className="navbar-right-actions">
          {user ? (
            <button className="btn-secondary nav-user-btn" onClick={() => navigate('/profile')}>
              <User size={15} />
              <span>{user?.user_metadata?.name || 'Workspace'}</span>
            </button>
          ) : (
            <>
              <button className="nav-login-link" onClick={() => navigate('/auth')}>
                Sign In
              </button>
              <button className="btn-primary nav-join-btn" onClick={() => navigate('/auth')}>
                Get Started
              </button>
            </>
          )}

          {/* Mobile hamburger toggle */}
          <button
            className="mobile-hamburger-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="mobile-menu-drawer">
          <div className="mobile-nav-links">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`mobile-nav-link ${active ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {Icon && <Icon size={18} />}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="mobile-menu-footer">
            {user ? (
              <button
                className="btn-primary mobile-full-btn"
                onClick={() => {
                  setMobileOpen(false);
                  navigate('/profile');
                }}
              >
                <User size={16} /> My Workspace
              </button>
            ) : (
              <div className="mobile-auth-btn-row">
                <button
                  className="btn-secondary mobile-auth-btn"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate('/auth');
                  }}
                >
                  Sign In
                </button>
                <button
                  className="btn-primary mobile-auth-btn"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate('/auth');
                  }}
                >
                  Get Started Free
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
