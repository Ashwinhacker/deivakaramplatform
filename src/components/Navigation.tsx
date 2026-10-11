import React, { useState, useEffect } from 'react';
import { Menu, X, Heart, ShieldAlert, User, LogOut } from 'lucide-react';
import { getSettings } from '../db';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenDonate: () => void;
  onOpenVolunteer: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onNavigate,
  onOpenDonate,
  onOpenVolunteer
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Check if user is logged in
    const checkUser = () => {
      const usr = localStorage.getItem('deivakaram_active_user');
      if (usr) {
        setActiveUser(JSON.parse(usr));
      } else {
        setActiveUser(null);
      }
    };
    checkUser();
    
    // Listen for custom login events to update UI state
    window.addEventListener('auth-changed', checkUser);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('auth-changed', checkUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('deivakaram_active_user');
    window.dispatchEvent(new Event('auth-changed'));
    onNavigate('home');
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About Us' },
    { id: 'services', label: 'Services' },
    { id: 'donation-programs', label: 'Donation Plans' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'transparency', label: 'Transparency' },
    { id: 'events', label: 'Events & News' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'contact', label: 'Contact' }
  ];

  const handleLinkClick = (pageId: string) => {
    if (pageId === 'donation-programs') {
      const scrollToArea = () => {
        const el = document.getElementById('donation-programs') || document.getElementById('donation-area');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          onOpenDonate();
        }
      };

      if (currentPage !== 'home' && currentPage !== 'services') {
        onNavigate('home');
        setTimeout(scrollToArea, 150);
      } else {
        scrollToArea();
      }
      setMobileMenuOpen(false);
      return;
    }

    onNavigate(pageId);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <header className={`public-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-container">
        {/* Brand Logo & Name */}
        <div className="nav-logo-block" onClick={() => handleLinkClick('home')} style={{ cursor: 'pointer' }}>
          <div className="nav-logo-circle">
            <img src="/logo-circle.png" alt="Deivakaram Logo" className="nav-logo" />
          </div>
          <div className="nav-logo-text">
            <span className="brand-name">DEIVAKARAM</span>
            <span className="brand-sub">CHARITABLE TRUST</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => handleLinkClick(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Actions Block */}
        <div className="nav-actions-block">
          {activeUser ? (
            <div className="nav-user-menu">
              <button 
                onClick={() => handleLinkClick(activeUser.role !== 'donor' ? 'crm_dashboard' : 'donor_dashboard')} 
                className="btn btn-outline btn-sm nav-btn-user"
              >
                <User size={14} /> Dashboard ({activeUser.name.split(' ')[0]})
              </button>
              <button onClick={handleLogout} className="btn-logout-icon" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => handleLinkClick('donor_portal_login')} className="nav-login-link">
              Donor Login
            </button>
          )}

          <button onClick={onOpenVolunteer} className="btn btn-outline btn-sm btn-nav-volunteer desktop-only">
            Become Volunteer
          </button>

          <button onClick={onOpenDonate} className="btn btn-accent btn-sm btn-nav-donate">
            <Heart size={14} fill="currentColor" /> Donate Now
          </button>

          {/* CRM portal link (icon shortcut) */}
          <button 
            onClick={() => handleLinkClick('crm_login')} 
            className="crm-portal-link-icon" 
            title="Secure CRM Administration"
          >
            <ShieldAlert size={18} />
          </button>

          {/* Mobile Hamburguer */}
          <button className="mobile-toggle-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay">
          <div className="mobile-drawer">
            <div className="drawer-header">
              <div className="nav-logo-block">
                <div className="nav-logo-circle">
                  <img src="/logo-circle.png" alt="Logo" className="nav-logo" />
                </div>
                <div className="nav-logo-text">
                  <span className="brand-name" style={{ color: '#fff' }}>DEIVAKARAM</span>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X size={24} color="#fff" />
              </button>
            </div>
            
            <div className="drawer-links">
              {navItems.map(item => (
                <button
                  key={item.id}
                  className={`drawer-link ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => handleLinkClick(item.id)}
                >
                  {item.label}
                </button>
              ))}
              
              <div className="drawer-divider"></div>

              {activeUser ? (
                <>
                  <button 
                    className="drawer-link" 
                    onClick={() => handleLinkClick(activeUser.role !== 'donor' ? 'crm_dashboard' : 'donor_dashboard')}
                  >
                    Go to Dashboard ({activeUser.name})
                  </button>
                  <button className="drawer-link" onClick={handleLogout} style={{ color: '#ef4444' }}>
                    Logout Account
                  </button>
                </>
              ) : (
                <button className="drawer-link" onClick={() => handleLinkClick('donor_portal_login')}>
                  Donor Account Login
                </button>
              )}

              <button 
                onClick={() => { setMobileMenuOpen(false); onOpenDonate(); }} 
                className="btn btn-accent"
                style={{ width: '100%', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontWeight: 700 }}
              >
                <Heart size={16} fill="currentColor" /> Donate Now
              </button>

              <button 
                onClick={() => { setMobileMenuOpen(false); onOpenVolunteer(); }} 
                className="btn btn-outline"
                style={{ borderColor: '#fff', color: '#fff', width: '100%', marginTop: '10px' }}
              >
                Become a Volunteer
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .public-header {
          height: var(--header-height);
          background-color: rgba(8, 48, 107, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.14);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 999;
          transition: var(--transition-smooth);
          display: flex;
          align-items: center;
        }
        .public-header.scrolled {
          background-color: rgba(6, 38, 86, 0.98);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.28);
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }
        .nav-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 24px;
          gap: 16px;
        }
        .nav-logo-block {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          user-select: none;
        }
        .nav-logo-circle {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3px;
          border: 2px solid var(--accent);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25), 0 0 0 1.5px rgba(255, 255, 255, 0.25);
          flex-shrink: 0;
          transition: var(--transition-smooth);
          overflow: hidden;
        }
        .nav-logo-block:hover .nav-logo-circle {
          transform: scale(1.1);
          border-color: #ffd700;
          box-shadow: 0 6px 20px rgba(209, 161, 32, 0.45), 0 0 0 2px rgba(255, 255, 255, 0.5);
        }
        .nav-logo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          transition: var(--transition-smooth);
        }
        .public-header.scrolled .nav-logo-circle {
          width: 46px;
          height: 46px;
        }
        .nav-logo-text {
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .brand-name {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 18px;
          color: #ffffff;
          line-height: 1.15;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
        .brand-sub {
          font-size: 9.5px;
          font-weight: 700;
          color: var(--accent);
          letter-spacing: 1.2px;
          white-space: nowrap;
        }
        
        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-shrink: 1;
        }
        .nav-link {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.88);
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          padding: 6px 2px;
          position: relative;
          white-space: nowrap;
          transition: var(--transition-fast);
        }
        .nav-link:hover, .nav-link.active {
          color: #ffffff;
        }
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          right: 0;
          height: 3px;
          background-color: var(--accent);
          border-radius: var(--radius-round);
          box-shadow: 0 0 8px rgba(209, 161, 32, 0.6);
        }
        
        .nav-actions-block {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .nav-login-link {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.9);
          font-size: 13.5px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          padding: 6px 4px;
          transition: var(--transition-fast);
        }
        .nav-login-link:hover {
          color: var(--accent);
        }
        
        .crm-portal-link-icon {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.75);
          cursor: pointer;
          opacity: 0.85;
          transition: var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          padding: 6px;
          border-radius: var(--radius-sm);
        }
        .crm-portal-link-icon:hover {
          opacity: 1;
          color: var(--accent) !important;
          background-color: rgba(255, 255, 255, 0.1);
          transform: scale(1.08);
        }
        
        .btn-nav-volunteer {
          border: 1.5px solid rgba(255, 255, 255, 0.55) !important;
          color: #ffffff !important;
          background-color: rgba(255, 255, 255, 0.08);
          white-space: nowrap;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 600;
          border-radius: var(--radius-sm);
          transition: var(--transition-smooth);
        }
        .btn-nav-volunteer:hover {
          border-color: #ffffff !important;
          background-color: #ffffff !important;
          color: var(--primary) !important;
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.25);
        }

        .btn-nav-donate {
          white-space: nowrap;
          padding: 7px 16px;
          font-size: 13px;
          font-weight: 700;
          border-radius: var(--radius-sm);
          box-shadow: 0 4px 12px rgba(209, 161, 32, 0.35);
        }
        
        .nav-user-menu {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .nav-btn-user {
          border: 1.5px solid rgba(255, 255, 255, 0.55) !important;
          color: #fff !important;
          background-color: rgba(255, 255, 255, 0.08);
          white-space: nowrap;
        }
        .nav-btn-user:hover {
          border-color: #fff !important;
          background: #fff !important;
          color: var(--primary) !important;
        }
        .btn-logout-icon {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.75);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
        }
        .btn-logout-icon:hover {
          color: var(--danger);
        }
        
        .mobile-toggle-btn {
          display: none;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #ffffff;
          padding: 4px;
        }
        
        /* Mobile Menu overlay drawer */
        .mobile-drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 1001;
        }
        .mobile-drawer {
          position: absolute;
          top: 0;
          right: 0;
          width: 300px;
          height: 100vh;
          background-color: var(--primary);
          padding: 30px;
          box-shadow: -10px 0 30px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .drawer-links {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .drawer-link {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.85);
          font-size: 16px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: var(--transition-fast);
          padding: 6px 0;
        }
        .drawer-link:hover, .drawer-link.active {
          color: var(--accent);
          padding-left: 6px;
        }
        .drawer-divider {
          height: 1px;
          background-color: rgba(255,255,255,0.12);
          margin: 10px 0;
        }
        
        @media (max-width: 1280px) {
          .desktop-nav {
            gap: 12px;
          }
          .nav-link {
            font-size: 13px;
          }
          .nav-actions-block {
            gap: 8px;
          }
          .btn-nav-volunteer, .btn-nav-donate {
            padding: 6px 11px;
            font-size: 12.5px;
          }
        }

        @media (max-width: 1140px) {
          .desktop-nav {
            display: none;
          }
          .desktop-only {
            display: none;
          }
          .mobile-toggle-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
    </header>
  );
};
export default Navigation;
