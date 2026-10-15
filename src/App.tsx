import React, { useState, useEffect, Component, type ErrorInfo, type ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
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
  const path = window.location.pathname.toLowerCase();
  const usr = localStorage.getItem('deivakaram_active_user');

  if (path === '/crm' || path === '/crm/') {
    if (usr && JSON.parse(usr).role !== 'donor') {
      return 'crm_dashboard';
    }
    return 'crm_login';
  }
  if (path === '/signin' || path === '/login') {
    return 'signin';
  }
  if (path === '/signup' || path === '/register') {
    return 'signup';
  }
  if (path === '/donor' || path === '/donor/') {
    if (!usr) {
      return 'signin';
    }
    return 'donor_dashboard';
  }
  const pageName = path.replace(/^\//, '').replace(/\/$/, '');
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
    // Check if donor is logged in
    const activeUser = localStorage.getItem('deivakaram_active_user');
    if (!activeUser) {
      // Save pending donation intent so we can resume automatically after signin
      if (programId) {
        sessionStorage.setItem('deivakaram_pending_donate_program', programId);
      }
      if (selectedCampaignId) {
        sessionStorage.setItem('deivakaram_pending_donate_campaign', selectedCampaignId);
      }
      sessionStorage.setItem('deivakaram_auth_notice', 'Please sign in or create an account to proceed with your donation.');
      
      // Redirect to sign in
      handleNavigate('signin');
      return;
    }

    // User is authenticated -> Open donation modal directly
    setSelectedProgramId(programId || null);
    setIsDonateOpen(true);
  };

  // Verification Celebration Notification
  const [verifiedNotification, setVerifiedNotification] = useState<string | null>(null);

  // Active Admin Session
  const [activeAdmin, setActiveAdmin] = useState<any>(null);

  useEffect(() => {
    // Check if user landed from email verification redirect (?verified=true or URL hash with signup access_token)
    const checkVerificationFromUrl = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const isVerifiedParam = searchParams.get('verified') === 'true';
      const hash = window.location.hash;
      const isSignupHash = hash.includes('type=signup') || (hash.includes('access_token=') && !hash.includes('type=recovery'));

      if (isVerifiedParam || isSignupHash) {
        setVerifiedNotification('🎉 Welcome! Your email address has been verified successfully. You are now logged in.');
        setCurrentPage('home');
        window.history.replaceState({}, '', '/');
        const timer = setTimeout(() => {
          setVerifiedNotification(null);
        }, 8000);
        return () => clearTimeout(timer);
      }
    };

    checkVerificationFromUrl();
  }, []);

  useEffect(() => {
    const handleLocationChange = () => {
      const initial = getInitialPage();
      setCurrentPage(initial);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Listen for open-donate-modal event (e.g. triggered after user signs in from a pending donation)
  useEffect(() => {
    const handleOpenDonateEvent = (e: any) => {
      const { programId, campaignId } = e.detail || {};
      if (campaignId) setSelectedCampaignId(campaignId);
      if (programId) setSelectedProgramId(programId);
      setIsDonateOpen(true);
    };

    window.addEventListener('open-donate-modal', handleOpenDonateEvent);
    return () => window.removeEventListener('open-donate-modal', handleOpenDonateEvent);
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured) {
      const syncSession = async (sessionUser: any) => {
        try {
          // Sync public.profiles (Requirement 5)
          let userProfile: any = null;
          try {
            const { data: prof } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', sessionUser.id)
              .maybeSingle();
            if (prof) {
              userProfile = prof;
            } else if (sessionUser.id) {
              const { data: newProf } = await supabase.from('profiles').upsert({
                id: sessionUser.id,
                full_name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Registered Donor',
                phone_number: sessionUser.user_metadata?.phone_number || sessionUser.user_metadata?.phone || null,
                created_at: new Date().toISOString()
              }, { onConflict: 'id' }).select('*').maybeSingle();
              if (newProf) userProfile = newProf;
            }
          } catch (pErr) {
            console.warn('[Sync profiles in App.tsx]:', pErr);
          }

          let { data: profile } = await supabase
            .from('users')
            .select('*')
            .or(`id.eq.${sessionUser.id},auth_id.eq.${sessionUser.id},email.eq.${sessionUser.email}`)
            .maybeSingle();

          let { data: donor } = await supabase
            .from('donors')
            .select('*')
            .or(`user_id.eq.${sessionUser.id},email.eq.${sessionUser.email}`)
            .maybeSingle();

          // Auto-provision profile in public.users if not yet created
          if (!profile && sessionUser.email) {
            try {
              const { data: newProf } = await supabase.from('users').upsert({
                id: sessionUser.id,
                auth_id: sessionUser.id,
                name: userProfile?.full_name || donor?.name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Registered Donor',
                email: sessionUser.email.toLowerCase(),
                phone: userProfile?.phone_number || donor?.phone || sessionUser.user_metadata?.phone || null,
                role: 'donor',
                status: 'active'
              }, { onConflict: 'email' }).select('*').maybeSingle();
              if (newProf) profile = newProf;
            } catch (uErr) {
              console.warn('[Auto-provision users in App.tsx]:', uErr);
            }
          }

          // Auto-provision donor in public.donors if not yet created
          if (!donor && sessionUser.email) {
            try {
              const { data: newDonor } = await supabase.from('donors').upsert({
                user_id: sessionUser.id,
                name: userProfile?.full_name || profile?.name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Registered Donor',
                email: sessionUser.email.toLowerCase(),
                phone: userProfile?.phone_number || profile?.phone || sessionUser.user_metadata?.phone || null,
                donor_type: 'Verified Donor'
              }, { onConflict: 'email' }).select('*').maybeSingle();
              if (newDonor) donor = newDonor;
            } catch (dErr) {
              console.warn('[Auto-provision donors in App.tsx]:', dErr);
            }
          }

          const activeUser = {
            id: userProfile?.id || profile?.id || donor?.id || sessionUser.id,
            auth_id: sessionUser.id,
            name: userProfile?.full_name || profile?.name || donor?.name || sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Registered Donor',
            email: sessionUser.email,
            phone: userProfile?.phone_number || profile?.phone || donor?.phone || sessionUser.user_metadata?.phone_number || sessionUser.user_metadata?.phone || null,
            role: profile?.role || sessionUser.user_metadata?.role || 'donor',
            status: profile?.status || 'active'
          };
          localStorage.setItem('deivakaram_active_user', JSON.stringify(activeUser));
          window.dispatchEvent(new Event('auth-changed'));
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
    const usr = localStorage.getItem('deivakaram_active_user');

    // Protect donor dashboard and CRM dashboard (Requirement 4)
    if (page === 'donor_dashboard' && !usr) {
      sessionStorage.setItem('deivakaram_auth_notice', 'Please sign in to access your donor dashboard.');
      page = 'signin';
    } else if (page === 'crm_dashboard' && !usr) {
      page = 'crm_login';
    }

    setCurrentPage(page);
    
    // Sync browser path
    let targetPath = '/';
    if (page === 'signin' || page === 'donor_portal_login') {
      targetPath = '/signin';
    } else if (page === 'signup') {
      targetPath = '/signup';
    } else if (page === 'crm_login' || page === 'crm_dashboard') {
      targetPath = '/crm';
    } else if (page === 'donor_dashboard') {
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

      {/* VERIFIED EMAIL CELEBRATION TOAST */}
      {verifiedNotification && (
        <div 
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '84px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            padding: '12px 22px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -4px rgba(5, 150, 105, 0.4), 0 4px 10px -2px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '92%',
            border: '1px solid #34d399'
          }}
        >
          <CheckCircle2 size={22} color="#ffffff" style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 600, fontSize: '14px', lineHeight: 1.4 }}>
            {verifiedNotification}
          </span>
          <button 
            type="button" 
            onClick={() => setVerifiedNotification(null)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              marginLeft: '8px',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700
            }}
            title="Dismiss notification"
          >
            ✕
          </button>
        </div>
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
        
        {/* Portal & Auth routes */}
        {currentPage === 'donor_portal_login' && <DonorPortal initialMode="login" onNavigate={handleNavigate} />}
        {currentPage === 'signin' && <DonorPortal initialMode="login" onNavigate={handleNavigate} />}
        {currentPage === 'signup' && <DonorPortal initialMode="signup" onNavigate={handleNavigate} />}
        {currentPage === 'donor_dashboard' && (
          localStorage.getItem('deivakaram_active_user') ? (
            <DonorPortal onNavigate={handleNavigate} />
          ) : (
            <DonorPortal initialMode="login" onNavigate={handleNavigate} />
          )
        )}

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
