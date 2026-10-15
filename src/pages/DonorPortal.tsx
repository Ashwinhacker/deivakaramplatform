import React, { useState, useEffect } from 'react';
import { 
  Heart, Calendar, Download, Shield, User, Lock, Eye, EyeOff, 
  AlertCircle, CheckCircle2, RefreshCw, KeyRound, UserMinus, LogOut,
  Smartphone, Mail, ArrowLeft, ArrowRight, Sparkles
} from 'lucide-react';
import { getSettings, Donation, Donor } from '../db';
import { supabase, isSupabaseConfigured } from '../db/supabaseClient';
import { ReceiptPDF } from '../components/ReceiptPDF';
import { 
  registerUser, 
  signInUser, 
  signOutUser, 
  updateAccountProfile, 
  changeAccountPassword, 
  deactivateAccount,
  validateIdentifier,
  resendVerificationEmail,
  syncUserProfile
} from '../utils/authService';

export interface DonorPortalProps {
  initialMode?: 'login' | 'signup' | 'verify_email_sent' | 'forgot';
  onNavigate?: (page: string) => void;
}

export const DonorPortal: React.FC<DonorPortalProps> = ({ initialMode = 'login', onNavigate }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [donorProfile, setDonorProfile] = useState<Donor | null>(null);
  const [myDonations, setMyDonations] = useState<Donation[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Authentication UI Modes: 'login' | 'signup' | 'verify_email_sent' | 'forgot'
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'verify_email_sent' | 'forgot'>(initialMode);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (initialMode) {
      setAuthMode(initialMode);
    }
  }, [initialMode]);

  // Email Verification States (Official Supabase Email Confirmation)
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Alert State Messages (Error / Success)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // SIGN IN Form State
  const [signInIdentifier, setSignInIdentifier] = useState(''); // Email or Mobile Number
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // SIGN UP Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpIdentifier, setSignUpIdentifier] = useState(''); // Mobile or Email (legacy fallback)
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirm, setShowSignUpConfirm] = useState(false);

  // Forgot / Reset Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Profile CRUD Edit States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pan, setPan] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Change State (Dashboard)
  const [dashboardNewPassword, setDashboardNewPassword] = useState('');
  const [dashboardConfirmPassword, setDashboardConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Recurring Donations States
  const [recurringFreq, setRecurringFreq] = useState<'none' | 'monthly' | 'quarterly' | 'yearly'>('none');
  const [recurringAmount, setRecurringAmount] = useState(1000);

  // Selected Donation for Receipt PDF
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);

  useEffect(() => {
    // 1. Detect email verification callback or password recovery mode from URL
    const handleAuthCallback = async () => {
      // Scenario A: Check URL query parameters (modern Supabase PKCE flow: ?code=... or error)
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const queryError = searchParams.get('error') || searchParams.get('error_description');

      if (queryError) {
        setErrorMessage(`Verification Notice: ${queryError.replace(/\+/g, ' ')}. Please request a fresh verification link.`);
        window.history.replaceState(null, '', window.location.pathname);
        return;
      }

      if (code && isSupabaseConfigured) {
        setIsProcessing(true);
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data?.session?.user) {
            const active = await syncUserProfile(data.session.user);
            if (active) {
              setActiveUser(active);
              setIsLoggedIn(true);
              setSuccessMessage(`🎉 Welcome, ${active.name}! Your email has been verified and your account is active.`);
              await loadDonorData(active.email, active.id);
              checkPendingDonationAndResume();
              setTimeout(() => {
                window.location.href = '/?verified=true';
              }, 1200);
            }
          } else if (error) {
            setErrorMessage(`Verification Notice: ${error.message}. Please sign in or request a fresh link.`);
          }
        } catch (err: any) {
          console.warn('[exchangeCodeForSession notice]:', err);
        } finally {
          setIsProcessing(false);
          window.history.replaceState(null, '', window.location.pathname);
        }
        return;
      }

      // Scenario B: Check URL hash (legacy hash tokens: #access_token=... or #type=signup or #type=recovery)
      const hash = window.location.hash;
      if (!hash) return;

      if (hash.includes('type=recovery')) {
        setIsResetMode(true);
        return;
      }

      if (hash.includes('error=') || hash.includes('error_description=')) {
        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const errorDesc = params.get('error_description') || params.get('error') || 'Verification link is invalid or has expired.';
        setErrorMessage(`Verification Notice: ${errorDesc.replace(/\+/g, ' ')}. Please request a fresh verification link below.`);
        window.history.replaceState(null, '', window.location.pathname);
        return;
      }

      if (hash.includes('type=signup') || (hash.includes('access_token=') && !hash.includes('type=recovery'))) {
        setIsProcessing(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const active = await syncUserProfile(session.user);
            if (active) {
              setActiveUser(active);
              setIsLoggedIn(true);
              setSuccessMessage(`🎉 Welcome, ${active.name}! Your email has been verified and your account is active.`);
              await loadDonorData(active.email, active.id);
              checkPendingDonationAndResume();
              setTimeout(() => {
                window.location.href = '/?verified=true';
              }, 1200);
            }
          }
        } catch (err: any) {
          console.warn('[Hash verification processing notice]:', err);
        } finally {
          setIsProcessing(false);
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    };

    handleAuthCallback();
    window.addEventListener('hashchange', handleAuthCallback);

    // 2. Check for active session in localStorage
    const checkSession = async () => {
      const active = localStorage.getItem('deivakaram_active_user');
      if (active) {
        try {
          const parsed = JSON.parse(active);
          setActiveUser(parsed);
          setIsLoggedIn(true);
          await loadDonorData(parsed.email, parsed.id);
        } catch {
          setIsLoggedIn(false);
          setActiveUser(null);
        }
      } else {
        setIsLoggedIn(false);
        setActiveUser(null);
        setDonorProfile(null);
      }
    };

    checkSession();
    window.addEventListener('auth-changed', checkSession);
    getSettings().then(setSettings);

    // 3. Supabase Auth state listener
    let authSubscription: any = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const active = await syncUserProfile(session.user);
          if (active) {
            setActiveUser(active);
            setIsLoggedIn(true);
            await loadDonorData(active.email, active.id);
          }
        }
      });
      authSubscription = data?.subscription;
    }

    return () => {
      window.removeEventListener('hashchange', handleAuthCallback);
      window.removeEventListener('auth-changed', checkSession);
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, []);

  // Check if redirected from a pending donation
  useEffect(() => {
    const notice = sessionStorage.getItem('deivakaram_auth_notice');
    if (notice) {
      setAuthNotice(notice);
    }
  }, []);

  // Timer countdown for resend verification link
  useEffect(() => {
    let timer: any;
    if (authMode === 'verify_email_sent' && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [authMode, resendCountdown]);

  // Active listener on verify_email_sent screen to auto-redirect to home once verified
  useEffect(() => {
    if (authMode !== 'verify_email_sent') return;

    const checkVerified = () => {
      const active = localStorage.getItem('deivakaram_active_user');
      if (active) {
        window.location.href = '/?verified=true';
      }
    };

    window.addEventListener('auth-changed', checkVerified);
    window.addEventListener('storage', checkVerified);

    let sub: any = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          window.location.href = '/?verified=true';
        }
      });
      sub = data?.subscription;
    }

    return () => {
      window.removeEventListener('auth-changed', checkVerified);
      window.removeEventListener('storage', checkVerified);
      if (sub) sub.unsubscribe();
    };
  }, [authMode]);

  const clearAlerts = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  /**
   * Automatically resume donation if user was redirected to login when clicking "Donate Now"
   */
  const checkPendingDonationAndResume = () => {
    const pendingProgram = sessionStorage.getItem('deivakaram_pending_donate_program');
    const pendingCampaign = sessionStorage.getItem('deivakaram_pending_donate_campaign');

    if (pendingProgram || pendingCampaign) {
      sessionStorage.removeItem('deivakaram_pending_donate_program');
      sessionStorage.removeItem('deivakaram_pending_donate_campaign');
      sessionStorage.removeItem('deivakaram_auth_notice');
      setAuthNotice(null);

      setSuccessMessage('Welcome! Your session is verified. Resuming your donation now...');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-donate-modal', {
          detail: { programId: pendingProgram || undefined, campaignId: pendingCampaign || undefined }
        }));
      }, 500);
    }
  };

  /**
   * Read (R) - Fetch latest donor profile and donations from Supabase
   */
  const loadDonorData = async (userEmail: string, userId?: string) => {
    let resolvedDonor: Donor | null = null;
    let resolvedDonations: Donation[] = [];
    const searchEmail = (userEmail || '').trim().toLowerCase();

    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('donors').select('*');
        if (userId) {
          query = query.or(`user_id.eq.${userId},email.eq.${searchEmail}`);
        } else {
          query = query.eq('email', searchEmail);
        }

        const { data: donor } = await query.maybeSingle();

        if (donor) {
          resolvedDonor = donor;

          const { data: donations } = await supabase
            .from('donations')
            .select('*')
            .or(`donor_id.eq.${donor.id},donor_email.eq.${searchEmail}`)
            .order('created_at', { ascending: false });

          if (donations) {
            resolvedDonations = donations;
          }
        }
      } catch (err) {
        console.warn('Supabase donor profile fetch error:', err);
      }
    }

    if (!resolvedDonor) {
      resolvedDonor = {
        id: userId || `donor-${Date.now()}`,
        user_id: userId,
        name: activeUser?.name || 'Registered Donor',
        email: searchEmail,
        phone: activeUser?.phone || '',
        address: '',
        pan: '',
        donor_type: 'New Donor',
        created_at: new Date().toISOString()
      };
      resolvedDonations = [];
    }

    setDonorProfile(resolvedDonor);
    setName(resolvedDonor.name || '');
    setPhone(resolvedDonor.phone || '');
    setAddress(resolvedDonor.address || '');
    setPan(resolvedDonor.pan || '');
    setMyDonations(resolvedDonations);
  };

  /**
   * SIGN IN: email or mobile number + password
   */
  /**
   * SIGN IN: email or mobile number + password
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!signInIdentifier.trim()) {
      setErrorMessage('Please enter your registered email address or mobile number.');
      return;
    }
    if (!signInPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await signInUser({
        identifier: signInIdentifier.trim(),
        password: signInPassword
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Login failed. Please verify your credentials.');
        if (res.needsEmailVerification && res.unconfirmedEmail) {
          setUnconfirmedEmail(res.unconfirmedEmail);
        }
        return;
      }

      setSuccessMessage('Logged in successfully! Redirecting to Home...');
      setIsLoggedIn(true);
      setActiveUser(res.user);
      await loadDonorData(res.user.email, res.user.id);
      checkPendingDonationAndResume();
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('home');
        } else {
          window.location.href = '/';
        }
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during login.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * SIGN UP: Create account in Supabase and send verification link to email
   */
  const handleInitiateSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!signUpName.trim() || signUpName.trim().length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }

    const cleanEmail = (signUpEmail || signUpIdentifier).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address so we can send your account verification link.');
      return;
    }

    if (!signUpPassword || signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both password fields.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await registerUser({
        name: signUpName.trim(),
        email: cleanEmail,
        phone: signUpPhone.trim() || undefined,
        password: signUpPassword,
        confirmPassword: signUpConfirmPassword
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to create account.');
        if (res.unconfirmedEmail) {
          setUnconfirmedEmail(res.unconfirmedEmail);
        }
        return;
      }

      if (res.needsEmailVerification) {
        setRegisteredEmail(cleanEmail);
        setResendCountdown(60);
        setCanResend(false);
        setAuthMode('verify_email_sent');
        setSuccessMessage(`Account created in Supabase! We have sent a verification link to ${cleanEmail}. Please check your mail.`);
      } else if (res.user) {
        setSuccessMessage('Welcome! Your account has been created. Redirecting to Home...');
        setIsLoggedIn(true);
        setActiveUser(res.user);
        await loadDonorData(res.user.email, res.user.id);
        checkPendingDonationAndResume();
        setTimeout(() => {
          if (onNavigate) {
            onNavigate('home');
          } else {
            window.location.href = '/';
          }
        }, 400);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during account registration.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Resend Account Verification Link to user's email
   */
  const handleResendVerificationLink = async (targetEmailOverride?: string) => {
    const emailToUse = targetEmailOverride || registeredEmail || unconfirmedEmail;
    if (!emailToUse) {
      setErrorMessage('No email address found to resend verification link.');
      return;
    }
    setIsResending(true);
    clearAlerts();
    try {
      const res = await resendVerificationEmail(emailToUse);
      if (res.success) {
        setResendCountdown(60);
        setCanResend(false);
        setSuccessMessage(res.message || `A fresh verification link has been sent to ${emailToUse}. Please check your mail.`);
      } else {
        setErrorMessage(res.error || 'Failed to resend verification link.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend verification link.');
    } finally {
      setIsResending(false);
    }
  };



  /**
   * FORGOT PASSWORD: Send email recovery link
   */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!forgotEmail.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsProcessing(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/donor`
        });
        if (error) throw error;
        setSuccessMessage(`Password recovery link has been dispatched to ${forgotEmail}. Please check your email inbox.`);
        setAuthMode('login');
      } else {
        setErrorMessage('Authentication service is not configured. Please check .env credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send recovery email. Please verify the address.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * RESET PASSWORD: Confirm new password after clicking reset link
   */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await changeAccountPassword(newPassword);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update password.');
        return;
      }
      setSuccessMessage('Your password has been successfully reset! You can now log in.');
      setIsResetMode(false);
      setAuthMode('login');
      window.history.pushState('', document.title, window.location.pathname);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Update (U) - Profile CRUD: Save updated name, phone, address, PAN
   */
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!donorProfile) return;
    if (!name.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await updateAccountProfile(donorProfile.id, {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        pan: pan.trim()
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to save profile changes.');
        return;
      }

      setSuccessMessage('Profile information saved successfully.');
      setIsEditing(false);
      await loadDonorData(activeUser.email, activeUser.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  /**
   * Update (U) - Password Update from Dashboard
   */
  const handleDashboardChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!dashboardNewPassword || dashboardNewPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }
    if (dashboardNewPassword !== dashboardConfirmPassword) {
      setErrorMessage('New password and confirmation password do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changeAccountPassword(dashboardNewPassword);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update password.');
        return;
      }

      setSuccessMessage('Account password updated successfully.');
      setDashboardNewPassword('');
      setDashboardConfirmPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  /**
   * Delete (D) - Deactivate Account
   */
  const handleDeactivateAccount = async () => {
    if (!window.confirm('Are you sure you want to deactivate your donor account? You will be signed out.')) {
      return;
    }

    clearAlerts();
    try {
      const res = await deactivateAccount(donorProfile?.user_id || donorProfile?.id || activeUser?.id);
      if (res.success) {
        setIsLoggedIn(false);
        setActiveUser(null);
        setDonorProfile(null);
        setSuccessMessage('Your account has been deactivated successfully.');
        if (onNavigate) {
          onNavigate('signin');
        }
      } else {
        setErrorMessage(res.error || 'Failed to deactivate account.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to deactivate account.');
    }
  };

  /**
   * Logout
   */
  const handleLogout = async () => {
    await signOutUser();
    setIsLoggedIn(false);
    setActiveUser(null);
    setDonorProfile(null);
    clearAlerts();
    if (onNavigate) {
      onNavigate('signin');
    }
  };

  const totalDonated = myDonations
    .filter(d => d.payment_status === 'successful')
    .reduce((sum, d) => sum + d.amount, 0);

  const donationCount = myDonations.filter(d => d.payment_status === 'successful').length;

  return (
    <div className="donor-portal-page" style={{ paddingTop: 'var(--header-height)' }}>

      {/* ---------------------------------------------------- */}
      {/* GLOBAL ALERT BANNER NOTIFICATIONS                    */}
      {/* ---------------------------------------------------- */}
      <div className="container" style={{ maxWidth: '640px', marginTop: '20px' }}>
        {errorMessage && (
          <div className="alert-banner alert-error" role="alert">
            <AlertCircle size={18} className="alert-icon" />
            <div className="alert-content">{errorMessage}</div>
            <button type="button" className="alert-close" onClick={() => setErrorMessage(null)}>✕</button>
          </div>
        )}

        {successMessage && (
          <div className="alert-banner alert-success" role="alert">
            <CheckCircle2 size={18} className="alert-icon" />
            <div className="alert-content">{successMessage}</div>
            <button type="button" className="alert-close" onClick={() => setSuccessMessage(null)}>✕</button>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* PASSWORD RECOVERY RESET FORM PAGE                    */}
      {/* ---------------------------------------------------- */}
      {isResetMode && (
        <section className="section login-section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
          <div className="container" style={{ maxWidth: '440px' }}>
            <div className="card login-card">
              <div className="login-logo-wrapper">
                <img src="/logo.png" alt="Deivakaram Logo" className="login-brand-logo" />
              </div>
              
              <h3>Reset Account Password</h3>
              <p className="text-light" style={{ fontSize: '13px', marginBottom: '24px', textAlign: 'center' }}>
                Please enter a secure new password for your Deivakaram profile.
              </p>

              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label className="form-label">New Password (Min 6 chars)</label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={isProcessing}>
                  {isProcessing ? <RefreshCw className="spinner" size={16} /> : 'Set New Password'}
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------- */}
      {/* AUTHENTICATION FLOW: SIGNIN / SIGNUP / FORGOT       */}
      {/* ---------------------------------------------------- */}
      {!isResetMode && !isLoggedIn && (
        <section className="section login-section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '40px 0' }}>
          <div className="container" style={{ maxWidth: '480px' }}>

            {/* NOTICE BANNER WHEN REDIRECTED FROM CLICKING 'DONATE NOW' */}
            {authNotice && !isLoggedIn && (
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #fdf2f8 100%)',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 2px 8px rgba(10, 74, 156, 0.06)'
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#0A4A9C',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Heart size={20} fill="currentColor" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#1e3a8a', fontSize: '13.5px', marginBottom: '2px' }}>
                    Donation in Progress
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.4 }}>
                    {authNotice} Your selected cause will open automatically once you sign in or create an account.
                  </div>
                </div>
              </div>
            )}
            
            {/* 1. SIGN IN (MAIL OR NUMBER + PASSWORD) */}
            {authMode === 'login' && (
              <div className="card login-card">
                <div className="login-logo-wrapper">
                  <img src="/logo.png" alt="Deivakaram Logo" className="login-brand-logo" />
                </div>
                
                <h3>Donor Sign In</h3>
                <p className="text-light" style={{ fontSize: '13px', marginBottom: '24px', textAlign: 'center' }}>
                  Sign in with your registered email or mobile number.
                </p>

                {unconfirmedEmail && (
                  <div style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    marginBottom: '18px',
                    textAlign: 'left',
                    fontSize: '12.5px',
                    color: '#1e40af'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={15} /> Email Verification Pending
                    </div>
                    <div style={{ marginBottom: '8px', lineHeight: 1.4 }}>
                      Your email (<strong>{unconfirmedEmail}</strong>) has not been confirmed yet. Click below to receive a new verification link.
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResendVerificationLink(unconfirmedEmail)}
                      disabled={isResending}
                      style={{
                        background: '#0A4A9C',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <RefreshCw className={isResending ? 'spinner' : ''} size={13} />
                      {isResending ? 'Sending...' : 'Resend Verification Link'}
                    </button>
                  </div>
                )}

                {errorMessage && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    marginBottom: '18px',
                    color: '#991b1b',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>{errorMessage}</div>
                  </div>
                )}

                <form onSubmit={handleSignIn}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      id="signin-email-input"
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. name@domain.com"
                      value={signInIdentifier}
                      onChange={(e) => setSignInIdentifier(e.target.value)}
                      autoComplete="username"
                    />
                    <small className="form-hint">Enter your registered email address</small>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label">Password</label>
                      <button 
                        type="button" 
                        id="forgot-password-link"
                        onClick={() => { clearAlerts(); setAuthMode('forgot'); }} 
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', padding: 0, cursor: 'pointer' }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="signin-password-input"
                        type={showSignInPassword ? 'text' : 'password'}
                        className="form-control"
                        required
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{ paddingRight: '40px' }}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-light)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                        aria-label="Toggle password visibility"
                      >
                        {showSignInPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-block" disabled={isProcessing} id="signin-submit-btn">
                    {isProcessing ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <RefreshCw className="spinner" size={16} /> Signing In...
                      </span>
                    ) : 'Sign In'}
                  </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }}>
                  Don't have an account?{' '}
                  <button 
                    type="button" 
                    id="switch-to-signup-btn"
                    onClick={() => { clearAlerts(); onNavigate ? onNavigate('signup') : setAuthMode('signup'); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline', padding: 0, cursor: 'pointer' }}
                  >
                    Create Account
                  </button>
                </div>
              </div>
            )}

            {/* 2. SIGN UP: (NAME, EMAIL, MOBILE (OPTIONAL), PASSWORD, CONFIRM PASSWORD) */}
            {authMode === 'signup' && (
              <div className="card login-card">
                <div className="login-logo-wrapper">
                  <img src="/logo.png" alt="Deivakaram Logo" className="login-brand-logo" />
                </div>
                
                <h3>Create Account</h3>
                <p className="text-light" style={{ fontSize: '13px', marginBottom: '22px', textAlign: 'center' }}>
                  Register as a verified donor to track your contributions and access 80G tax receipts.
                </p>

                {errorMessage && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    marginBottom: '20px',
                    color: '#991b1b',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '6px' }}>
                      <AlertCircle size={18} color="#dc2626" />
                      <span>Registration Notice</span>
                    </div>
                    <div style={{ marginBottom: '8px' }}>{errorMessage}</div>
                    {(errorMessage.toLowerCase().includes('confirm email') || errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('confirmation email')) && (
                      <div style={{ padding: '12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                        <div style={{ fontWeight: 700, color: '#1e3a8a', marginBottom: '6px', fontSize: '13px' }}>
                          ⚡ Quick 20-Second Fix in Supabase:
                        </div>
                        <ol style={{ margin: '0 0 10px 0', paddingLeft: '18px', fontSize: '12.5px', color: '#334155', lineHeight: 1.6 }}>
                          <li>Open your <strong>Supabase Dashboard</strong></li>
                          <li>Go to <strong>Authentication</strong> &gt; <strong>Providers</strong> &gt; <strong>Email</strong></li>
                          <li>Turn OFF <strong>"Confirm email"</strong> (Disabled) and click <strong>Save</strong></li>
                          <li>Return here and click <strong>Create Account</strong> for instant access!</li>
                        </ol>
                        <a 
                          href="https://supabase.com/dashboard/project/bmrgneqhklsyrkhrlurj/auth/providers" 
                          target="_blank" 
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#0A4A9C',
                            color: '#ffffff',
                            padding: '8px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          Open Supabase Email Settings ↗
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleInitiateSignUp}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      id="signup-name-input"
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Ananth Kumar"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address (For Verification Link)</label>
                    <input
                      id="signup-email-input"
                      type="email"
                      className="form-control"
                      required
                      placeholder="e.g. ananth@gmail.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                    />
                    <small className="form-hint" style={{ color: '#0A4A9C', fontWeight: 500 }}>
                      ✉️ Supabase will send an account verification link to this email
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mobile Number <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional)</span></label>
                    <input
                      id="signup-phone-input"
                      type="tel"
                      className="form-control"
                      placeholder="e.g. 9876543210"
                      value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value)}
                    />
                    <small className="form-hint">📱 For 80G tax receipts and instant WhatsApp donation updates</small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password (Min 6 characters)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="signup-password-input"
                        type={showSignUpPassword ? 'text' : 'password'}
                        className="form-control"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-light)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                        aria-label="Toggle password visibility"
                      >
                        {showSignUpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="signup-confirmpassword-input"
                        type={showSignUpConfirm ? 'text' : 'password'}
                        className="form-control"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpConfirm(!showSignUpConfirm)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-light)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                        aria-label="Toggle confirm password visibility"
                      >
                        {showSignUpConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {signUpConfirmPassword && signUpPassword !== signUpConfirmPassword && (
                      <small style={{ color: 'var(--color-danger, #e53e3e)', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                        Passwords do not match
                      </small>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary btn-block" disabled={isProcessing} id="signup-submit-btn">
                    {isProcessing ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <RefreshCw className="spinner" size={16} /> Creating Account...
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Mail size={16} /> Create Account
                      </span>
                    )}
                  </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }}>
                  Already have an account?{' '}
                  <button 
                    type="button" 
                    id="switch-to-signin-btn"
                    onClick={() => { clearAlerts(); onNavigate ? onNavigate('signin') : setAuthMode('login'); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline', padding: 0, cursor: 'pointer' }}
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}

            {/* 2.5. VERIFICATION LINK DISPATCHED NOTIFICATION */}
            {authMode === 'verify_email_sent' && (
              <div className="card login-card" style={{ textAlign: 'center' }}>
                <div style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  border: '2px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px auto',
                  boxShadow: '0 8px 16px -4px rgba(10, 74, 156, 0.15)'
                }}>
                  <Mail size={32} color="#0A4A9C" />
                </div>

                <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-dark)', fontSize: '22px' }}>
                  Verification Link Sent!
                </h3>
                <p className="text-light" style={{ fontSize: '13.5px', marginBottom: '16px', lineHeight: 1.5 }}>
                  Your account has been created in Supabase. We have sent a verification link to:
                </p>

                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  marginBottom: '20px',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  color: '#0A4A9C',
                  wordBreak: 'break-all'
                }}>
                  ✉️ {registeredEmail}
                </div>

                <div style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '22px',
                  textAlign: 'left',
                  fontSize: '13px',
                  color: '#1e3a8a',
                  lineHeight: 1.6
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} color="#0A4A9C" /> Next Steps:
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '18px' }}>
                    <li>Open your email inbox at <strong>{registeredEmail}</strong></li>
                    <li>Look for the verification email from <strong>Deivakaram</strong></li>
                    <li>Click the <strong>Confirm your mail</strong> link to activate your account</li>
                    <li style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                      <em>Note: If you don't see the email, please check your Spam or Junk folder.</em>
                    </li>
                  </ol>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-block"
                    disabled={!canResend || isResending}
                    onClick={() => handleResendVerificationLink(registeredEmail)}
                    id="resend-verification-link-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 16px'
                    }}
                  >
                    <RefreshCw className={isResending ? 'spinner' : ''} size={15} />
                    {isResending
                      ? 'Resending Verification Link...'
                      : canResend
                        ? 'Resend Verification Link'
                        : `Resend link available in ${resendCountdown}s`}
                  </button>
                </div>

                <button
                  type="button"
                  id="already-verified-signin-btn"
                  onClick={() => {
                    clearAlerts();
                    setSignInIdentifier(registeredEmail);
                    if (onNavigate) {
                      onNavigate('signin');
                    } else {
                      setAuthMode('login');
                    }
                  }}
                  className="btn btn-primary btn-block"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  Already Clicked Link? Sign In <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  id="go-to-home-btn"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('home');
                    } else {
                      window.location.href = '/';
                    }
                  }}
                  className="btn btn-outline btn-block"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}
                >
                  Go to Home Page
                </button>

                <div style={{ marginTop: '16px' }}>
                  <button
                    type="button"
                    id="change-email-signup-btn"
                    onClick={() => {
                      clearAlerts();
                      setAuthMode('signup');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-light)',
                      fontSize: '12.5px',
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                  >
                    ← Change Email Address
                  </button>
                </div>
              </div>
            )}


            {/* 3. FORGOT PASSWORD RECOVERY PANEL */}
            {authMode === 'forgot' && (
              <div className="card login-card">
                <div className="login-logo-wrapper">
                  <img src="/logo.png" alt="Deivakaram Logo" className="login-brand-logo" />
                </div>
                
                <h3>Recover Password</h3>
                <p className="text-light" style={{ fontSize: '13px', marginBottom: '24px', textAlign: 'center' }}>
                  Enter your registered email address. We will dispatch a secure link to reset your password.
                </p>

                <form onSubmit={handleForgotPassword}>
                  <div className="form-group">
                    <label className="form-label">Registered Email</label>
                    <input
                      type="email"
                      className="form-control"
                      required
                      placeholder="yourmail@domain.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-block" disabled={isProcessing}>
                    {isProcessing ? <RefreshCw className="spinner" size={16} /> : 'Send Recovery Link'}
                  </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px' }}>
                  Remember your password?{' '}
                  <button 
                    type="button" 
                    onClick={() => { clearAlerts(); setAuthMode('login'); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline', padding: 0, cursor: 'pointer' }}
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            )}

          </div>
        </section>
      )}

      {/* ---------------------------------------------------- */}
      {/* LOGGED IN DONOR DASHBOARD & ACCOUNT CRUD WORKSPACE  */}
      {/* ---------------------------------------------------- */}
      {isLoggedIn && !isResetMode && (
        <section className="section" style={{ minHeight: '80vh' }}>
          <div className="container">
            {/* Header row */}
            <div className="donor-dashboard-header">
              <div>
                <span className="section-subtitle">Authenticated Account</span>
                <h2>{donorProfile?.name || activeUser?.name}</h2>
                <p className="text-muted" style={{ fontSize: '13.5px' }}>
                  Account Identifier: {donorProfile?.phone || activeUser?.phone || activeUser?.email}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="donor-segment-tag">
                  🏷️ {donorProfile?.donor_type || 'Active Donor'}
                </div>
                <button onClick={handleLogout} className="btn btn-outline btn-sm" id="donor-logout-btn">
                  <LogOut size={14} style={{ marginRight: '6px' }} /> Sign Out
                </button>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid-3" style={{ margin: '30px 0' }}>
              <div className="card kpi-card">
                <Heart size={24} color="var(--primary)" />
                <div>
                  <h4>Total Contributions</h4>
                  <h2>₹ {totalDonated.toLocaleString('en-IN')}</h2>
                </div>
              </div>
              <div className="card kpi-card">
                <Shield size={24} color="var(--accent)" />
                <div>
                  <h4>Donations Made</h4>
                  <h2>{donationCount} successful</h2>
                </div>
              </div>
              <div className="card kpi-card">
                <Calendar size={24} color="var(--primary)" />
                <div>
                  <h4>Last Contribution</h4>
                  <h2>
                    {myDonations[0] 
                      ? new Date(myDonations[0].created_at).toLocaleDateString('en-IN') 
                      : 'None yet'}
                  </h2>
                </div>
              </div>
            </div>

            {/* Main Area grid */}
            <div className="grid-2" style={{ gridTemplateColumns: '1.8fr 1fr', gap: '40px' }}>
              
              {/* Left Column: Donation History (READ) */}
              <div className="dashboard-main-col">
                <div className="card table-responsive" style={{ margin: 0, padding: 0 }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--primary)' }}>My Donation History</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>{myDonations.length} records found</span>
                  </div>

                  <table className="crm-table">
                    <thead>
                      <tr>
                        <th>Donation ID</th>
                        <th>Date</th>
                        <th>Chosen Plan</th>
                        <th>Amount</th>
                        <th>Purpose</th>
                        <th>Status</th>
                        <th>Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myDonations.map(don => (
                        <tr key={don.id}>
                          <td><strong>{don.donation_id}</strong></td>
                          <td>{new Date(don.created_at).toLocaleDateString('en-IN')}</td>
                          <td>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0A4A9C' }}>
                              {don.plan || 'General Contribution'}
                            </span>
                          </td>
                          <td><strong>₹ {don.amount.toLocaleString('en-IN')}</strong></td>
                          <td>{don.purpose}</td>
                          <td>
                            <span className={`badge badge-${don.payment_status === 'successful' ? 'success' : don.payment_status === 'failed' ? 'danger' : 'warning'}`}>
                              {don.payment_status}
                            </span>
                          </td>
                          <td>
                            {don.payment_status === 'successful' ? (
                              <button
                                onClick={() => setSelectedDonation(don)}
                                className="btn btn-outline btn-sm"
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                              >
                                <Download size={12} /> Receipt
                              </button>
                            ) : (
                              <span className="text-light">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {myDonations.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)', fontStyle: 'italic' }}>
                            No donation transactions found for this account.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Account CRUD (PROFILE EDIT, PASSWORD CHANGE, DEACTIVATE) */}
              <div className="dashboard-side-col">
                
                {/* 1. Profile Credentials Card (READ & UPDATE) */}
                <div className="card profile-card" style={{ marginBottom: '24px' }}>
                  <h3>Profile Credentials</h3>
                  {!isEditing ? (
                    <div className="profile-display-details">
                      <p><strong>Name:</strong> {donorProfile?.name || activeUser?.name}</p>
                      <p><strong>Email:</strong> {activeUser?.email?.startsWith('donor') && activeUser?.email?.includes('@gmail.com') ? 'Registered via Mobile (' + (donorProfile?.phone || activeUser?.phone || '') + ')' : activeUser?.email}</p>
                      <p><strong>Mobile:</strong> {donorProfile?.phone || activeUser?.phone || 'Not added'}</p>
                      <p><strong>Address:</strong> {donorProfile?.address || 'Not added'}</p>
                      <p><strong>PAN Number:</strong> <span style={{ textTransform: 'uppercase' }}>{donorProfile?.pan || 'Not added'}</span></p>
                      
                      <button 
                        onClick={() => { clearAlerts(); setIsEditing(true); }} 
                        className="btn btn-outline btn-sm btn-block" 
                        style={{ marginTop: '20px' }}
                        id="edit-profile-btn"
                      >
                        Edit Profile Details
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleProfileSave}>
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Mobile Phone</label>
                        <input 
                          type="tel" 
                          className="form-control" 
                          value={phone} 
                          placeholder="e.g. 9876543210"
                          onChange={(e) => setPhone(e.target.value)} 
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Tax Exemption PAN</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          style={{ textTransform: 'uppercase' }} 
                          maxLength={10}
                          placeholder="ABCDE1234F"
                          value={pan} 
                          onChange={(e) => setPan(e.target.value)} 
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Address</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Street, City, Pin"
                          value={address} 
                          onChange={(e) => setAddress(e.target.value)} 
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button 
                          type="button" 
                          className="btn btn-outline btn-sm" 
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-primary btn-sm" 
                          disabled={isSavingProfile}
                        >
                          {isSavingProfile ? <RefreshCw className="spinner" size={14} /> : 'Save Profile'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* 2. Password / Security Update Card (UPDATE) */}
                <div className="card profile-card" style={{ marginBottom: '24px' }}>
                  <h3>Change Password</h3>
                  <form onSubmit={handleDashboardChangePassword}>
                    <div className="form-group">
                      <label className="form-label">New Password (Min 6 chars)</label>
                      <input 
                        type="password" 
                        className="form-control" 
                        required 
                        minLength={6} 
                        value={dashboardNewPassword}
                        onChange={(e) => setDashboardNewPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm New Password</label>
                      <input 
                        type="password" 
                        className="form-control" 
                        required 
                        minLength={6} 
                        value={dashboardConfirmPassword}
                        onChange={(e) => setDashboardConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm btn-block" disabled={isChangingPassword}>
                      {isChangingPassword ? <RefreshCw className="spinner" size={14} /> : 'Update Password'}
                    </button>
                  </form>
                </div>

                {/* 3. Account Settings & Deactivation (DELETE / DEACTIVATE) */}
                <div className="card profile-card" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <h3 style={{ color: 'var(--color-danger, #e53e3e)' }}>Account Management</h3>
                  <p className="text-light" style={{ fontSize: '12px', marginBottom: '16px', lineHeight: '1.4' }}>
                    Temporarily deactivate your donor account. Your past contribution receipts will remain safely archived with the Trust.
                  </p>
                  <button 
                    onClick={handleDeactivateAccount} 
                    className="btn btn-outline btn-sm btn-block"
                    style={{ color: '#e53e3e', borderColor: '#fca5a5' }}
                    id="deactivate-account-btn"
                  >
                    <UserMinus size={14} style={{ marginRight: '6px' }} /> Deactivate Account
                  </button>
                </div>

              </div>

            </div>
          </div>
        </section>
      )}

      {selectedDonation && donorProfile && settings && (
        <ReceiptPDF
          donation={selectedDonation}
          donor={donorProfile}
          settings={settings}
          onClose={() => setSelectedDonation(null)}
        />
      )}

      <style>{`
        .login-card {
          padding: 40px;
          border-color: rgba(10, 74, 156, 0.1);
          box-shadow: var(--shadow-lg);
        }
        .login-logo-wrapper {
          text-align: center;
          margin-bottom: 20px;
        }
        .login-brand-logo {
          height: 60px;
          object-fit: contain;
          margin: 0 auto;
        }
        .login-card h3 {
          font-size: 22px;
          color: var(--primary);
          text-align: center;
          margin-bottom: 4px;
        }
        .form-hint {
          display: block;
          font-size: 11.5px;
          color: var(--text-light);
          margin-top: 4px;
        }

        /* Alert Banners */
        .alert-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 13.5px;
          margin-bottom: 16px;
          animation: fadeIn 0.2s ease-in-out;
        }
        .alert-error {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
        }
        .alert-success {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
        }
        .alert-icon {
          flex-shrink: 0;
        }
        .alert-content {
          flex: 1;
        }
        .alert-close {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: inherit;
          opacity: 0.7;
          padding: 0 4px;
        }
        .alert-close:hover {
          opacity: 1;
        }

        /* Dashboard layout */
        .donor-dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 2px solid var(--border-color);
          padding-bottom: 20px;
        }
        .donor-segment-tag {
          font-weight: 700;
          font-size: 13px;
          color: var(--accent);
          background: var(--bg-accent);
          border: 1px solid #fde68a;
          padding: 6px 16px;
          border-radius: var(--radius-round);
        }
        .kpi-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
        }
        .kpi-card h4 {
          font-size: 13px;
          color: var(--text-light);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .kpi-card h2 {
          font-size: 24px;
          color: var(--primary);
          font-weight: 800;
          margin: 0;
        }
        .profile-display-details p {
          font-size: 13.5px;
          margin-bottom: 10px;
          color: var(--text-muted);
        }
        .profile-display-details strong {
          color: var(--text-main);
        }
        .profile-card h3 {
          font-size: 16px;
          color: var(--primary);
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 6px;
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default DonorPortal;
