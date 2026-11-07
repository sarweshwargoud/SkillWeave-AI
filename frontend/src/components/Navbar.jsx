import { useState, useEffect, useRef } from 'react';
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
  Play,
  Compass,
  Home,
  LogOut,
  ChevronDown,
  Layers,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { getClient } from '../services/supabaseClient';
import ProfileDrawerModal from './ProfileDrawerModal';
import './Navbar.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const client = getClient();

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        const { data } = await client.auth.getUser();
        if (mounted) {
          setUser(data?.user || null);
        }
      } catch (err) {
        if (mounted) setUser(null);
      }
    };
    checkUser();

    // Subscribe to auth state updates
    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user || null);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, [location.pathname]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: "Overview", path: "/" },
    { name: "Roadmap Generator", path: "/create", icon: Map },
    { name: "Handwritten Notes", path: "/notes", icon: FileText },
    { name: "AI Video Tutor", path: "/tutor", icon: MessageSquare },
    { name: "Learning Workspace", path: "/workspace", icon: Play },
    { name: "My Learning", path: "/my-learning", icon: GraduationCap },
  ];

  const isActive = (path) => {
    if (path === "/" && location.pathname !== "/") return false;
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    try {
      await client.auth.signOut();
      setDropdownOpen(false);
      navigate('/');
      window.location.reload();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Learner';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <>
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

          {/* Right CTA / User Dropdown */}
          <div className="navbar-right-actions" ref={dropdownRef}>
            {user ? (
              <div 
                className="nav-user-dropdown-container"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button 
                  className="btn-secondary nav-user-btn" 
                  onClick={() => setDrawerOpen(true)}
                  title="Click to view full profile overlay"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="nav-btn-avatar" />
                  ) : (
                    <User size={15} />
                  )}
                  <span className="nav-user-name-text">{displayName}</span>
                  <ChevronDown size={13} className={`dropdown-caret ${dropdownOpen ? 'rotated' : ''}`} />
                </button>

                {/* Floating Hover/Click Dropdown Popover */}
                {dropdownOpen && (
                  <div className="nav-profile-popover">
                    <div className="popover-user-header" onClick={() => { setDropdownOpen(false); setDrawerOpen(true); }}>
                      <div className="popover-avatar-wrap">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={displayName} className="popover-avatar" />
                        ) : (
                          <div className="popover-avatar-placeholder"><User size={16} /></div>
                        )}
                      </div>
                      <div className="popover-name-meta">
                        <span className="popover-full-name">{displayName}</span>
                        <span className="popover-email">{user?.email}</span>
                      </div>
                    </div>

                    <div className="popover-action-list">
                      <button 
                        className="popover-item primary-action"
                        onClick={() => {
                          setDropdownOpen(false);
                          setDrawerOpen(true); // Open full view modal right on screen!
                        }}
                      >
                        <Maximize2 size={15} />
                        <span>View Full Profile</span>
                        <span className="popover-badge">Modal View</span>
                      </button>

                      <button 
                        className="popover-item"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/workspace');
                        }}
                      >
                        <Play size={15} />
                        <span>Learning Workspace</span>
                      </button>

                      <button 
                        className="popover-item"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/my-learning');
                        }}
                      >
                        <GraduationCap size={15} />
                        <span>My Roadmaps & Progress</span>
                      </button>

                      <button 
                        className="popover-item"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/notes');
                        }}
                      >
                        <FileText size={15} />
                        <span>Handwritten Notes</span>
                      </button>

                      <button 
                        className="popover-item"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/tutor');
                        }}
                      >
                        <MessageSquare size={15} />
                        <span>AI Video Tutor</span>
                      </button>

                      <div className="popover-divider" />

                      <button className="popover-item logout-action" onClick={handleSignOut}>
                        <LogOut size={15} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button className="nav-login-link" onClick={() => navigate('/auth')}>
                  Sign In
                </button>
                <button className="btn-primary nav-join-btn" onClick={() => navigate('/auth')}>
                  Sign In to Start
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
                <div className="mobile-user-actions-box">
                  <button
                    className="btn-primary mobile-full-btn"
                    onClick={() => {
                      setMobileOpen(false);
                      setDrawerOpen(true);
                    }}
                  >
                    <User size={16} /> View Profile & Projects
                  </button>
                  <button className="mobile-logout-btn" onClick={handleSignOut}>
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
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
                    Sign In to Start
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Webapp Bottom Tab Bar (Strictly mobile <= 768px) */}
      <nav className="mobile-app-bottom-bar" aria-label="Mobile Navigation">
        <Link to="/" className={`mobile-bottom-tab ${location.pathname === '/' ? 'active' : ''}`}>
          <Home size={19} />
          <span>Home</span>
        </Link>
        <Link to="/create" className={`mobile-bottom-tab ${location.pathname.startsWith('/create') ? 'active' : ''}`}>
          <Compass size={19} />
          <span>Roadmap</span>
        </Link>
        <Link to="/workspace" className={`mobile-bottom-tab ${location.pathname.startsWith('/workspace') ? 'active' : ''}`}>
          <Play size={19} />
          <span>Workspace</span>
        </Link>
        <Link to="/tutor" className={`mobile-bottom-tab ${location.pathname.startsWith('/tutor') ? 'active' : ''}`}>
          <MessageSquare size={19} />
          <span>AI Tutor</span>
        </Link>
        <Link to="/notes" className={`mobile-bottom-tab ${location.pathname.startsWith('/notes') ? 'active' : ''}`}>
          <FileText size={19} />
          <span>Notes</span>
        </Link>
      </nav>


      {/* Slide-over Profile Drawer Modal (Openable from ANY page without navigation loss!) */}
      <ProfileDrawerModal 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
      />
    </>
  );
};

export default Navbar;
