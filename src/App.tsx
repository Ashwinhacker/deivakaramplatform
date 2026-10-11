import React, { useState, useEffect, Component, type ErrorInfo, type ReactNode } from 'react';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Campaigns from './pages/Campaigns';
import Transparency from './pages/Transparency';
import EventsNews from './pages/EventsNews';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import AssistanceRequest from './pages/AssistanceRequest';
import DonorPortal from './pages/DonorPortal';
import CRMAuth from './crm/CRMAuth';
import CRMPortal from './crm/CRMPortal';
import { DonateModal } from './components/DonateModal';
import { VolunteerModal } from './components/VolunteerModal';
import { supabase, isSupabaseConfigured } from './db/supabaseClient';

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', padding: '30px', maxWidth: '440px' }}>
            <h3 style={{ color: '#ef4444', marginBottom: '10px' }}>Notice</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
              {this.state.error?.message || 'Unable to open dialog.'}
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => {
                this.setState({ hasError: false });
                if (this.props.onReset) this.props.onReset();
              }}
            >
              Close & Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


const getInitialPage = () => {
  const path = window.location.pathname;
  if (path === '/crm' || path === '/crm/') {
    const usr = localStorage.getItem('deivakaram_active_user');
    if (usr && JSON.parse(usr).role !== 'donor') {
      return 'crm_dashboard';
    }
    return 'crm_login';
  }
  if (path === '/donor' || path === '/donor/') {
    return 'donor_dashboard';
  }
  const pageName = path.substring(1);
  const validPages = ['about', 'services', 'campaigns', 'transparency', 'events', 'gallery', 'contact', 'request_assistance'];
  if (validPages.includes(pageName)) {
    return pageName;
  }
  return 'home';
};

function App() {
  const [currentPage, setCurrentPage] = useState<string>(getInitialPage());
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // Modals Visibility
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [isVolunteerOpen, setIsVolunteerOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  const handleOpenDonate = (programId?: string) => {
    setSelectedProgramId(programId || null);
    setIsDonateOpen(true);
  };

  // Active Admin Session
  const [activeAdmin, setActiveAdmin] = useState<any>(null);

  useEffect(() => {
    const handleLocationChange = () => {
      const initial = getInitialPage();
      setCurrentPage(initial);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured) {
      const syncSession = async (sessionUser: any) => {
        try {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', sessionUser.id)
            .single();

          if (profile) {
            const activeUser = {
              id: sessionUser.id,
              name: profile.name,
              email: sessionUser.email,
              role: profile.role,
              status: profile.status
            };
            localStorage.setItem('deivakaram_active_user', JSON.stringify(activeUser));
            window.dispatchEvent(new Event('auth-changed'));
          }
        } catch (err) {
          console.error('Error syncing auth session:', err);
        }
      };

      // Check current session on mount
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          syncSession(session.user);
        }
      });

      // Listen for session changes (SIGN_IN, SIGN_OUT, TOKEN_REFRESHED)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
          await syncSession(session.user);
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('deivakaram_active_user');
          window.dispatchEvent(new Event('auth-changed'));
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  useEffect(() => {
    // Check if session contains active user
    const checkSession = () => {
      const usr = localStorage.getItem('deivakaram_active_user');
      if (usr) {
        const parsed = JSON.parse(usr);
        if (parsed.role !== 'donor') {
          setActiveAdmin(parsed);
          // If we refresh on CRM dashboard, keep it active
          if (currentPage === 'crm_login') {
            setCurrentPage('crm_dashboard');
          }
        }
      } else {
        setActiveAdmin(null);
        if (currentPage === 'crm_dashboard') {
          setCurrentPage('crm_login');
        }
      }
    };
    checkSession();
    window.addEventListener('auth-changed', checkSession);
    return () => window.removeEventListener('auth-changed', checkSession);
  }, [currentPage]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    
    // Sync browser path
    let targetPath = '/';
    if (page === 'crm_login' || page === 'crm_dashboard') {
      targetPath = '/crm';
    } else if (page === 'donor_dashboard' || page === 'donor_portal_login') {
      targetPath = '/donor';
    } else if (page !== 'home') {
      targetPath = `/${page}`;
    }
    
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }

    if (page !== 'campaigns') {
      setSelectedCampaignId(null);
    }
  };

  const handleSelectCampaign = (id: string | null) => {
    setSelectedCampaignId(id);
    setCurrentPage('campaigns');
    window.scrollTo(0, 0);
  };

  const handleAdminLoginSuccess = (admin: any) => {
    setActiveAdmin(admin);
    setCurrentPage('crm_dashboard');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('deivakaram_active_user');
    window.dispatchEvent(new Event('auth-changed'));
    setActiveAdmin(null);
    setCurrentPage('home');
  };

  // Render CRM screens separately (hides website navigation header & footer)
  const isCrmScreen = currentPage === 'crm_login' || currentPage === 'crm_dashboard';

  return (
    <>
      {!isCrmScreen && (
        <Navigation
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onOpenDonate={() => handleOpenDonate()}
          onOpenVolunteer={() => setIsVolunteerOpen(true)}
        />
      )}

      {/* RENDER VIEW ACCORDING TO STATE ROUTER */}
      <main className={!isCrmScreen ? 'public-main-content' : 'crm-main-container'}>
        {currentPage === 'home' && (
          <Home
            onNavigate={handleNavigate}
            onOpenDonate={handleOpenDonate}
            onOpenVolunteer={() => setIsVolunteerOpen(true)}
            onSelectCampaign={handleSelectCampaign}
          />
        )}
        {currentPage === 'about' && <About />}
        {currentPage === 'services' && (
          <Services
            onNavigate={handleNavigate}
            onOpenDonate={() => handleOpenDonate()}
            onOpenVolunteer={() => setIsVolunteerOpen(true)}
          />
        )}
        {currentPage === 'campaigns' && (
          <Campaigns
            selectedCampaignId={selectedCampaignId}
            onSelectCampaign={handleSelectCampaign}
            onOpenDonate={() => handleOpenDonate()}
          />
        )}
        {currentPage === 'transparency' && <Transparency />}
        {currentPage === 'events' && <EventsNews />}
        {currentPage === 'gallery' && <Gallery />}
        {currentPage === 'contact' && <Contact />}
        {currentPage === 'request_assistance' && <AssistanceRequest />}
        
        {/* Portal routes */}
        {currentPage === 'donor_portal_login' && <DonorPortal />}
        {currentPage === 'donor_dashboard' && <DonorPortal />}

        {/* Secure CRM views */}
        {currentPage === 'crm_login' && (
          <CRMAuth
            onLoginSuccess={handleAdminLoginSuccess}
            onNavigateHome={() => handleNavigate('home')}
          />
        )}
        {currentPage === 'crm_dashboard' && activeAdmin && (
          <CRMPortal onLogout={handleAdminLogout} />
        )}
      </main>

      {!isCrmScreen && (
        <Footer
          onNavigate={handleNavigate}
          onOpenDonate={() => handleOpenDonate()}
          onOpenVolunteer={() => setIsVolunteerOpen(true)}
        />
      )}

      {/* CORE MODAL DIALOGS */}
      {isDonateOpen && (
        <ErrorBoundary onReset={() => { setIsDonateOpen(false); setSelectedProgramId(null); }}>
          <DonateModal
            onClose={() => {
              setIsDonateOpen(false);
              setSelectedProgramId(null);
            }}
            initialCampaignId={selectedCampaignId || undefined}
            initialProgramId={selectedProgramId || undefined}
            onNavigate={handleNavigate}
          />
        </ErrorBoundary>
      )}
      {isVolunteerOpen && (
        <VolunteerModal onClose={() => setIsVolunteerOpen(false)} />
      )}
    </>
  );
}

export default App;
