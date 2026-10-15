import React, { useState } from 'react';
import { ShieldCheck, Lock, User, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../db/supabaseClient';

interface CRMAuthProps {
  onLoginSuccess: (user: any) => void;
  onNavigateHome: () => void;
}

export const CRMAuth: React.FC<CRMAuthProps> = ({ onLoginSuccess, onNavigateHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Admin Registration States (for live Supabase setups)
  const [isRegistering, setIsRegistering] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsProcessing(true);
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured) {
      try {
        // 1. Authenticate with official Supabase Auth service
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (authErr) {
          throw new Error(authErr.message || 'Invalid administrator email or password.');
        }

        if (!authData?.user) {
          throw new Error('Authentication failed: No user returned from authentication service.');
        }

        // 2. Authoritatively verify admin role in public.users table
        const { data: profile, error: profErr } = await supabase
          .from('users')
          .select('*')
          .or(`id.eq.${authData.user.id},auth_id.eq.${authData.user.id},email.eq.${cleanEmail}`)
          .maybeSingle();

        if (profErr || !profile) {
          await supabase.auth.signOut();
          throw new Error('Administrator profile not found in trust database.');
        }

        if (profile.role !== 'super_admin' && profile.role !== 'sub_admin') {
          await supabase.auth.signOut();
          throw new Error('Access Denied: This account does not possess administrator privileges.');
        }

        if (profile.status === 'suspended') {
          await supabase.auth.signOut();
          throw new Error('Access Denied: This administrator account has been suspended by the Trust Board.');
        }

        // 3. Load administrator permissions from public.admin_users
        const { data: adminPerms } = await supabase
          .from('admin_users')
          .select('permissions')
          .eq('id', profile.id)
          .maybeSingle();

        let permissions = adminPerms?.permissions || [];
        if (profile.role === 'super_admin' && permissions.length === 0) {
          permissions = ['donations', 'donors', 'volunteers', 'beneficiaries', 'campaigns', 'events', 'content', 'reports', 'settings', 'admins', 'logs'];
        }

        const adminSession = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          status: profile.status,
          permissions
        };

        // Complete administrator authentication
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('deivakaram_active_user', JSON.stringify(adminSession));
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-changed'));
        }
        onLoginSuccess(adminSession);
        return;
      } catch (err: any) {
        alert(err.message || 'Authentication failed. Please verify your credentials.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      setIsProcessing(false);
      alert('Backend authentication requires a live Supabase connection. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !adminName) return;

    if (!isSupabaseConfigured) {
      alert('Supabase backend must be configured to register administrator accounts.');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: adminName.trim(),
            phone: adminPhone.trim(),
            role: 'super_admin'
          }
        }
      });

      if (error) throw error;

      alert('Admin registration submitted! If email confirmation is enabled on your Supabase project, please check your inbox and verify your email before logging in.');
      setIsRegistering(false);
      setAdminName('');
      setAdminPhone('');
      setEmail(email.trim().toLowerCase());
      setPassword('');
    } catch (err: any) {
      alert(err.message || 'Failed to register administrator account.');
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div className="crm-auth-page">
      <div className="crm-auth-card card">
        <div className="crm-auth-header">
          <img src="/logo.png" alt="Deivakaram Logo" className="crm-auth-logo" />
          <h2>DEIVAKARAM CRM</h2>
          <p>Secure Enterprise Portal Administration</p>
        </div>

        {isRegistering ? (
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="Admin Name"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input
                type="email"
                className="form-control"
                required
                placeholder="admin@deivakaram.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isProcessing}>
              {isProcessing ? <RefreshCw className="spinner" size={16} /> : 'Register Admin Account'}
            </button>

            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px' }}>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => { setIsRegistering(false); setEmail('admin@deivakaram.org'); setPassword('password'); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline', padding: 0, cursor: 'pointer' }}
              >
                Log In
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCredentialsSubmit}>
            <div className="form-group">
              <label className="form-label">Administrator Email</label>
              <div className="input-icon-wrapper">
                <User size={16} className="input-icon" />
                <input
                  type="email"
                  className="form-control padded-left"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-icon-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  type="password"
                  className="form-control padded-left"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isProcessing}>
              {isProcessing ? <RefreshCw className="spinner" size={16} /> : 'Authorize Credentials'}
            </button>

            {isSupabaseConfigured && (
              <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px' }}>
                Need to setup an admin?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegistering(true); setEmail(''); setPassword(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline', padding: 0, cursor: 'pointer' }}
                >
                  Register here
                </button>
              </div>
            )}
          </form>
        )}

        <div className="crm-auth-footer">
          <button onClick={onNavigateHome} className="btn-return-web">
            ← Return to public website
          </button>
        </div>
      </div>

      <style>{`
        .crm-auth-page {
          background-color: #0c1524;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          color: var(--text-main);
        }
        .crm-auth-card {
          max-width: 440px;
          width: 100%;
          padding: 40px;
          background-color: #ffffff;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border-radius: var(--radius-lg);
        }
        .crm-auth-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .crm-auth-logo {
          height: 64px;
          object-fit: contain;
          margin-bottom: 12px;
        }
        .crm-auth-header h2 {
          font-family: var(--font-heading);
          color: var(--primary);
          font-size: 20px;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        .crm-auth-header p {
          font-size: 11px;
          font-weight: 700;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .input-icon-wrapper {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-light);
        }
        .form-control.padded-left {
          padding-left: 42px;
        }

        .btn-back-auth-step:hover {
          color: var(--primary);
        }
        .crm-auth-footer {
          margin-top: 30px;
          border-top: 1px solid var(--border-color);
          padding-top: 20px;
          text-align: center;
        }
        .btn-return-web {
          background: transparent;
          border: none;
          font-size: 13px;
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .btn-return-web:hover {
          color: var(--primary);
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
export default CRMAuth;
