import React, { useState, useEffect } from 'react';
import { Heart, Calendar, LogIn, Download, Key, Shield, User, Settings, Lock, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { getDonors, getDonations, getSettings, Donation, Donor } from '../db';
import { supabase, isSupabaseConfigured } from '../db/supabaseClient';
import { ReceiptPDF } from '../components/ReceiptPDF';

export const DonorPortal: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [donorProfile, setDonorProfile] = useState<Donor | null>(null);
  const [myDonations, setMyDonations] = useState<Donation[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Authentication UI Modes
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [isResetMode, setIsResetMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // SignUp Form States
  const [signUpName, setSignUpName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpAddress, setSignUpAddress] = useState('');
  const [signUpPAN, setSignUpPAN] = useState('');

  // Password Recovery / Reset States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Edit Profile States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pan, setPan] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Change Password State (Dashboard)
  const [dashboardNewPassword, setDashboardNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Recurring Donations States
  const [recurringFreq, setRecurringFreq] = useState<'none' | 'monthly' | 'quarterly' | 'yearly'>('none');
  const [recurringAmount, setRecurringAmount] = useState(1000);

  // Selected Donation for Receipt PDF
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);

  useEffect(() => {
    // 1. Detect if page is in password recovery mode (redirected from Supabase reset email)
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token=') || hash.includes('type=recovery'))) {
        setIsResetMode(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);

    // 2. Check for active session in localStorage
    const checkSession = async () => {
      const active = localStorage.getItem('deivakaram_active_user');
      if (active) {
        const parsed = JSON.parse(active);
        if (parsed.role === 'donor') {
          setActiveUser(parsed);
          setIsLoggedIn(true);
          loadDonorData(parsed.email);
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

    return () => {
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('auth-changed', checkSession);
    };
  }, []);

  const loadDonorData = async (userEmail: string) => {
    let resolvedDonor: Donor | null = null;
    let resolvedDonations: Donation[] = [];
    const searchEmail = userEmail.trim().toLowerCase();

    if (isSupabaseConfigured) {
      try {
        // Query the public.donors table
        const { data: donor } = await supabase
          .from('donors')
          .select('*')
          .eq('email', searchEmail)
          .maybeSingle();

        if (donor) {
          resolvedDonor = donor;
          // Query donations for this donor
          const { data: donations } = await supabase
            .from('donations')
            .select('*')
            .eq('donor_id', donor.id)
            .order('created_at', { ascending: false });

          if (donations) {
            resolvedDonations = donations;
          }
        }
      } catch (err) {
        console.warn('Supabase donor profile fetch error:', err);
      }
    }

    // Fallback if not yet in database
    if (!resolvedDonor) {
      const donors = await getDonors();
      resolvedDonor = donors.find(d => d.email.toLowerCase() === searchEmail) || null;
      if (resolvedDonor) {
        const allDons = await getDonations();
        resolvedDonations = allDons.filter(d => d.donor_id === resolvedDonor!.id);
      }
    }

    if (!resolvedDonor) {
      resolvedDonor = {
        id: `donor-${Date.now()}`,
        name: activeUser?.name || 'Registered Donor',
        email: searchEmail,
        phone: '',
        address: '',
        pan: '',
        donor_type: 'New Donor',
        created_at: new Date().toISOString()
      };
      resolvedDonations = [];
    }

    setDonorProfile(resolvedDonor);
    setName(resolvedDonor.name);
    setPhone(resolvedDonor.phone || '');
    setAddress(resolvedDonor.address || '');
    setPan(resolvedDonor.pan || '');
    setMyDonations(resolvedDonations);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsProcessing(true);
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured) {
      try {
        // 1. Try Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!error && data?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profile && profile.role !== 'donor') {
            throw new Error('This account belongs to an administrator. Please log in via the CRM dashboard.');
          }

          const activeUser = {
            id: data.user.id,
            name: profile?.name || data.user.user_metadata?.name || 'Donor Profile',
            email: data.user.email,
            role: 'donor',
            status: 'active'
          };

          localStorage.setItem('deivakaram_active_user', JSON.stringify(activeUser));
          window.dispatchEvent(new Event('auth-changed'));
          setIsLoggedIn(true);
          setActiveUser(activeUser);
          await loadDonorData(data.user.email!);
          setIsProcessing(false);
          return;
        }

        // 2. Check registered donors in public.donors
        const { data: donorRecord } = await supabase
          .from('donors')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (donorRecord) {
          const activeUser = {
            id: donorRecord.id,
            name: donorRecord.name,
            email: donorRecord.email,
            role: 'donor',
            status: 'active'
          };
          localStorage.setItem('deivakaram_active_user', JSON.stringify(activeUser));
          window.dispatchEvent(new Event('auth-changed'));
          setIsLoggedIn(true);
          setActiveUser(activeUser);
          await loadDonorData(cleanEmail);
          setIsProcessing(false);
          return;
        }

        throw new Error(error?.message || 'Login failed. Please verify credentials or create an account below.');
      } catch (err: any) {
        alert(err.message || 'Login failed. Please verify your credentials.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      const donors = await getDonors();
      const matched = donors.find(d => d.email.toLowerCase() === cleanEmail);
      const activeUser = {
        id: matched?.id || `usr-${Date.now()}`,
        name: matched?.name || 'Donor Profile',
        email: cleanEmail,
        role: 'donor',
        status: 'active'
      };
      localStorage.setItem('deivakaram_active_user', JSON.stringify(activeUser));
      window.dispatchEvent(new Event('auth-changed'));
      setIsLoggedIn(true);
      setActiveUser(activeUser);
      await loadDonorData(cleanEmail);
      setIsProcessing(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !signUpName) return;

    setIsProcessing(true);
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name: signUpName,
              phone: signUpPhone,
              address: signUpAddress,
              pan: signUpPAN ? signUpPAN.toUpperCase() : '',
              role: 'donor'
            }
          }
        });

        // Ensure public.donors has this entry immediately
        await supabase.from('donors').upsert({
          user_id: data?.user?.id || null,
          name: signUpName,
          email: cleanEmail,
          phone: signUpPhone || null,
          address: signUpAddress || null,
          pan: signUpPAN ? signUpPAN.toUpperCase() : null,
          donor_type: 'New Donor'
        }, { onConflict: 'email' });

        const activeUser = {
          id: data?.user?.id || `donor-${Date.now()}`,
          name: signUpName,
          email: cleanEmail,
          role: 'donor',
          status: 'active'
        };

        localStorage.setItem('deivakaram_active_user', JSON.stringify(activeUser));
        window.dispatchEvent(new Event('auth-changed'));
        setIsLoggedIn(true);
        setActiveUser(activeUser);
        await loadDonorData(cleanEmail);
        alert('Welcome! Your donor account has been successfully created.');
      } catch (err: any) {
        alert(err.message || 'Registration failed. Please check details and try again.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      const newDonor: Donor = {
        id: `donor-${Date.now()}`,
        user_id: `user-${Date.now()}`,
        name: signUpName,
        email: cleanEmail,
        phone: signUpPhone,
        address: signUpAddress,
        pan: signUpPAN.toUpperCase(),
        donor_type: 'New Donor',
        created_at: new Date().toISOString()
      };
      const activeUser = {
        id: newDonor.id,
        name: newDonor.name,
        email: cleanEmail,
        role: 'donor',
        status: 'active'
      };
      localStorage.setItem('deivakaram_active_user', JSON.stringify(activeUser));
      window.dispatchEvent(new Event('auth-changed'));
      setIsLoggedIn(true);
      setActiveUser(activeUser);
      await loadDonorData(cleanEmail);
      setIsProcessing(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsProcessing(true);
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/donor',
        });

        if (error) throw error;

        alert('Password recovery link has been sent to your registered email address. Please follow the instructions.');
        setAuthMode('login');
      } catch (err: any) {
        alert(err.message || 'Failed to send password reset email.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Mock Forgot Password
      setTimeout(() => {
        alert(`(Simulated Mode) Password reset link has been dispatched to ${email}. Check your spam/inbox folders.`);
        setAuthMode('login');
        setIsProcessing(false);
      }, 600);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    setIsProcessing(true);
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;

        alert('Your password has been successfully reset! You can now log in using your new credentials.');
        setIsResetMode(false);
        setAuthMode('login');
        window.history.pushState('', document.title, window.location.pathname);
      } catch (err: any) {
        alert(err.message || 'Failed to update password.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Mock Reset Password
      setTimeout(() => {
        alert('(Simulated Mode) Password changed successfully. You can now log in.');
        setIsResetMode(false);
        setAuthMode('login');
        setIsProcessing(false);
      }, 600);
    }
  };

  const handleDashboardChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboardNewPassword) return;

    setIsChangingPassword(true);
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.updateUser({ password: dashboardNewPassword });
        if (error) throw error;

        alert('Your account password has been updated successfully.');
        setDashboardNewPassword('');
      } catch (err: any) {
        alert(err.message || 'Failed to update password.');
      } finally {
        setIsChangingPassword(false);
      }
    } else {
      // Mock Change Password
      setTimeout(() => {
        alert('(Simulated Mode) Password updated successfully.');
        setDashboardNewPassword('');
        setIsChangingPassword(false);
      }, 500);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorProfile) return;

    setIsProcessing(true);
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('donors')
          .update({
            name,
            phone,
            address,
            pan: pan.toUpperCase(),
          })
          .eq('id', donorProfile.id);

        if (error) throw error;

        // Also update public.users if linked
        if (donorProfile.user_id) {
          try {
            await supabase
              .from('users')
              .update({ name, phone })
              .eq('id', donorProfile.user_id);
          } catch (uErr) {
            console.warn('User profile sync notice:', uErr);
          }
        }

        alert('Profile saved successfully.');
        setIsEditing(false);
        loadDonorData(activeUser.email);
      } catch (err: any) {
        alert(err.message || 'Failed to save profile changes.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Mock Profile Update
      donorProfile.name = name;
      donorProfile.phone = phone;
      donorProfile.address = address;
      donorProfile.pan = pan.toUpperCase();
      
      const mockDB = JSON.parse(localStorage.getItem('deivakaram_mock_db') || 'null');
      if (mockDB) {
        const idx = mockDB.donors.findIndex((d: any) => d.id === donorProfile.id);
        if (idx !== -1) {
          mockDB.donors[idx] = donorProfile;
          localStorage.setItem('deivakaram_mock_db', JSON.stringify(mockDB));
        }
      }
      setIsEditing(false);
      setIsProcessing(false);
      alert('Profile updated successfully.');
    }
  };

  const handleLogout = () => {
    if (isSupabaseConfigured) {
      supabase.auth.signOut().then(() => {
        localStorage.removeItem('deivakaram_active_user');
        window.dispatchEvent(new Event('auth-changed'));
      });
    } else {
      localStorage.removeItem('deivakaram_active_user');
      window.dispatchEvent(new Event('auth-changed'));
    }
  };

  const totalDonated = myDonations
    .filter(d => d.payment_status === 'successful')
    .reduce((sum, d) => sum + d.amount, 0);

  const donationCount = myDonations.filter(d => d.payment_status === 'successful').length;

  return (
    <div className="donor-portal-page" style={{ paddingTop: 'var(--header-height)' }}>
      
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
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={isProcessing}>
                  {isProcessing ? 'Updating...' : 'Set new password'}
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECURE AUTHENTICATION FLOW (LOGIN / SIGNUP / FORGOT) */}
      {/* ---------------------------------------------------- */}
      {!isResetMode && !isLoggedIn && (
        <section className="section login-section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '40px 0' }}>
          <div className="container" style={{ maxWidth: '480px' }}>
            
            {/* LOGIN PANEL */}
            {authMode === 'login' && (
              <div className="card login-card">
                <div className="login-logo-wrapper">
                  <img src="/logo.png" alt="Deivakaram Logo" className="login-brand-logo" />
                </div>
                
                <h3>Donor Login Portal</h3>
                <p className="text-light" style={{ fontSize: '13px', marginBottom: '24px', textAlign: 'center' }}>
                  Access your donation history, print tax receipts, and manage recurring payments.
                </p>

                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label className="form-label">Registered Email</label>
                    <input
                      type="email"
                      className="form-control"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label">Password</label>
                      <button 
                        type="button" 
                        onClick={() => setAuthMode('forgot')} 
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', padding: 0, cursor: 'pointer' }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-light)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-block" disabled={isProcessing}>
                    {isProcessing ? 'Verifying...' : 'Login securely'}
                  </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px' }}>
                  Don't have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setAuthMode('signup'); setEmail(''); setPassword(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline', padding: 0, cursor: 'pointer' }}
                  >
                    Register here
                  </button>
                </div>
              </div>
            )}

            {/* REGISTRATION SIGNUP PANEL */}
            {authMode === 'signup' && (
              <div className="card login-card">
                <div className="login-logo-wrapper">
                  <img src="/logo.png" alt="Deivakaram Logo" className="login-brand-logo" />
                </div>
                
                <h3>Create Donor Account</h3>
                <p className="text-light" style={{ fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>
                  Register to get 80G tax benefits and track your charity contributions.
                </p>

                <form onSubmit={handleSignUp}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="Ananth Kumar"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                    />
                  </div>

                  <div className="grid-2" style={{ gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        placeholder="name@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password (Min 6 chars)</label>
                      <input
                        type="password"
                        className="form-control"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid-2" style={{ gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">Mobile Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="+9198765..."
                        value={signUpPhone}
                        onChange={(e) => setSignUpPhone(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">PAN Number (for 80G Tax Exemption)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="ABCDE1234F"
                        style={{ textTransform: 'uppercase' }}
                        maxLength={10}
                        value={signUpPAN}
                        onChange={(e) => setSignUpPAN(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Residential Address</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Street, City, State, ZIP"
                      value={signUpAddress}
                      onChange={(e) => setSignUpAddress(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-block" disabled={isProcessing}>
                    {isProcessing ? 'Registering...' : 'Create Account'}
                  </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px' }}>
                  Already have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setAuthMode('login'); setEmail(''); setPassword(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline', padding: 0, cursor: 'pointer' }}
                  >
                    Log In
                  </button>
                </div>
              </div>
            )}

            {/* FORGOT PASSWORD RESET REQUEST PANEL */}
            {authMode === 'forgot' && (
              <div className="card login-card">
                <div className="login-logo-wrapper">
                  <img src="/logo.png" alt="Deivakaram Logo" className="login-brand-logo" />
                </div>
                
                <h3>Recover Password</h3>
                <p className="text-light" style={{ fontSize: '13px', marginBottom: '24px', textAlign: 'center' }}>
                  Enter your registered email address. We will send a secure link to reset your account password.
                </p>

                <form onSubmit={handleForgotPassword}>
                  <div className="form-group">
                    <label className="form-label">Registered Email</label>
                    <input
                      type="email"
                      className="form-control"
                      required
                      placeholder="yourmail@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-block" disabled={isProcessing}>
                    {isProcessing ? 'Sending...' : 'Send Recovery Link'}
                  </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px' }}>
                  Remember your details?{' '}
                  <button 
                    type="button" 
                    onClick={() => setAuthMode('login')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline', padding: 0, cursor: 'pointer' }}
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            )}

          </div>
        </section>
      )}

      {/* ---------------------------------------------------- */}
      {/* LOGGED IN DONOR PORTAL WORKSPACE (DASHBOARD)         */}
      {/* ---------------------------------------------------- */}
      {isLoggedIn && !isResetMode && (
        <section className="section">
          <div className="container">
            {/* Header row */}
            <div className="donor-dashboard-header">
              <div>
                <span className="section-subtitle">Welcome Back</span>
                <h2>{donorProfile?.name || activeUser?.name}</h2>
                <p className="text-muted" style={{ fontSize: '13.5px' }}>
                  Registered email: {activeUser?.email}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="donor-segment-tag">
                  🏷️ {donorProfile?.donor_type || 'New Donor'}
                </div>
                <button onClick={handleLogout} className="btn btn-outline btn-sm">
                  Sign Out
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
                      : 'None'}
                  </h2>
                </div>
              </div>
            </div>

            {/* Main Area grid */}
            <div className="grid-2" style={{ gridTemplateColumns: '1.8fr 1fr', gap: '40px' }}>
              
              {/* Left Column: History */}
              <div className="dashboard-main-col">
                <div className="card table-responsive" style={{ margin: 0, padding: 0 }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--primary)' }}>My Donation History</h3>
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
                            No donations logged for this email account.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Profile & Security Settings */}
              <div className="dashboard-side-col">
                
                {/* Profile Detail Card */}
                <div className="card profile-card" style={{ marginBottom: '24px' }}>
                  <h3>Profile Credentials</h3>
                  {!isEditing ? (
                    <div className="profile-display-details">
                      <p><strong>Name:</strong> {donorProfile?.name || activeUser?.name}</p>
                      <p><strong>Email:</strong> {activeUser?.email}</p>
                      <p><strong>Mobile:</strong> {donorProfile?.phone || 'Not added'}</p>
                      <p><strong>Address:</strong> {donorProfile?.address || 'Not added'}</p>
                      <p><strong>PAN Number:</strong> <span style={{ textTransform: 'uppercase' }}>{donorProfile?.pan || 'Not added'}</span></p>
                      <button onClick={() => setIsEditing(true)} className="btn btn-outline btn-sm btn-block" style={{ marginTop: '20px' }}>
                        Edit Details
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleProfileSave}>
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Mobile Phone</label>
                        <input type="tel" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Tax Exemption PAN</label>
                        <input type="text" className="form-control" style={{ textTransform: 'uppercase' }} value={pan} onChange={(e) => setPan(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Address</label>
                        <input type="text" className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setIsEditing(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={isProcessing}>
                          {isProcessing ? 'Saving...' : 'Save Profile'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Password / Security Update Card */}
                <div className="card profile-card" style={{ marginBottom: '24px' }}>
                  <h3>Update Password</h3>
                  <form onSubmit={handleDashboardChangePassword}>
                    <div className="form-group">
                      <label className="form-label">New Password</label>
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
                    <button type="submit" className="btn btn-primary btn-sm btn-block" disabled={isChangingPassword}>
                      {isChangingPassword ? 'Updating...' : 'Change Password'}
                    </button>
                  </form>
                </div>

                {/* Recurring Options */}
                <div className="card recurring-card">
                  <h3>Recurring Contributions</h3>
                  <p className="text-light" style={{ fontSize: '12px', marginBottom: '20px', lineHeight: '1.4' }}>
                    Configure automatic monthly, quarterly or yearly contributions to support general operational relief funds.
                  </p>

                  <div className="form-group">
                    <label className="form-label">Select Frequency</label>
                    <select
                      className="form-control"
                      value={recurringFreq}
                      onChange={(e) => setRecurringFreq(e.target.value as any)}
                    >
                      <option value="none">No Recurring Plan</option>
                      <option value="monthly">Monthly Donation</option>
                      <option value="quarterly">Quarterly Donation</option>
                      <option value="yearly">Yearly Donation</option>
                    </select>
                  </div>

                  {recurringFreq !== 'none' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Donation Amount (₹)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={recurringAmount}
                          onChange={(e) => setRecurringAmount(parseFloat(e.target.value))}
                        />
                      </div>
                      <button 
                        onClick={() => alert(`Simulated recurring configuration set! ₹${recurringAmount} will charge automatically.`)} 
                        className="btn btn-accent btn-sm btn-block"
                      >
                        Activate Plan
                      </button>
                    </>
                  )}
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
          font-size: 20px;
          color: var(--primary);
          text-align: center;
          margin-bottom: 4px;
        }
        .login-test-tips {
          margin-top: 24px;
          background-color: var(--bg-secondary);
          border: 1px dashed var(--border-color);
          padding: 12px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          color: var(--text-light);
          line-height: 1.4;
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
        .profile-card h3, .recurring-card h3 {
          font-size: 16px;
          color: var(--primary);
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 6px;
        }
      `}</style>
    </div>
  );
};

export default DonorPortal;
