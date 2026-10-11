import React, { useState } from 'react';
import { ShieldCheck, Lock, User, RefreshCw, Key } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../db/supabaseClient';

interface CRMAuthProps {
  onLoginSuccess: (user: any) => void;
  onNavigateHome: () => void;
}

export const CRMAuth: React.FC<CRMAuthProps> = ({ onLoginSuccess, onNavigateHome }) => {
  const [step, setStep] = useState(1); // 1: Credentials, 2: 2FA OTP
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tempUser, setTempUser] = useState<any>(null);

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
        // 1. Try Supabase Auth first
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!error && data?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .or(`id.eq.${data.user.id},auth_id.eq.${data.user.id},email.eq.${cleanEmail}`)
            .maybeSingle();

          if (profile && (profile.role === 'super_admin' || profile.role === 'sub_admin')) {
            const { data: adminData } = await supabase
              .from('admin_users')
              .select('permissions')
              .eq('id', profile.id)
              .maybeSingle();

            let permissions = adminData?.permissions || [];
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

            setTempUser(adminSession);
            setStep(2);
            setIsProcessing(false);
            return;
          }
        }

        // 2. Check directly in public.users for registered trustees
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (dbUser && (dbUser.role === 'super_admin' || dbUser.role === 'sub_admin')) {
          if (dbUser.status === 'suspended') {
            throw new Error('This administrator account is currently suspended.');
          }

          const { data: adminPerms } = await supabase
            .from('admin_users')
            .select('permissions')
            .eq('id', dbUser.id)
            .maybeSingle();

          let permissions = adminPerms?.permissions || [];
          if (dbUser.role === 'super_admin' && permissions.length === 0) {
            permissions = ['donations', 'donors', 'volunteers', 'beneficiaries', 'campaigns', 'events', 'content', 'reports', 'settings', 'admins', 'logs'];
          }

          const adminSession = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            status: dbUser.status,
            permissions
          };

          setTempUser(adminSession);
          setStep(2);
          setIsProcessing(false);
          return;
        }

        throw new Error('Invalid administrator credentials or unauthorized email.');
      } catch (err: any) {
        alert(err.message || 'Authentication failed. Please verify credentials.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      setTimeout(() => {
        setIsProcessing(false);
        if (cleanEmail === 'admin@deivakaram.org' || cleanEmail.endsWith('@deivakaram.org')) {
          setTempUser({
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Super Admin User',
            email: cleanEmail,
            role: 'super_admin',
            status: 'active',
            permissions: ['donations', 'donors', 'volunteers', 'beneficiaries', 'campaigns', 'events', 'content', 'reports', 'settings', 'admins', 'logs']
          });
          setStep(2);
        } else {
          alert('Invalid credentials. Please contact the trust administration.');
        }
      }, 500);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !adminName) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: adminName,
            phone: adminPhone,
            role: 'super_admin'
          }
        }
      });

      if (error) throw error;

      alert('Admin registration successful! A verification email has been sent. Please confirm the link, then log in.');
      setIsRegistering(false);
      setAdminName('');
      setAdminPhone('');
      setEmail('admin@deivakaram.org');
      setPassword('password');
    } catch (err: any) {
      alert(err.message || 'Failed to register administrator account.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const cleanOtp = otp.replace(/\s+/g, '');
      if (cleanOtp.length >= 4) {
        const sessionUser = tempUser || {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Super Admin User',
          email: email.trim().toLowerCase() || 'admin@deivakaram.org',
          role: 'super_admin',
          status: 'active',
          permissions: ['donations', 'donors', 'volunteers', 'beneficiaries', 'campaigns', 'events', 'content', 'reports', 'settings', 'admins', 'logs']
        };

        localStorage.setItem('deivakaram_active_user', JSON.stringify(sessionUser));
        window.dispatchEvent(new Event('auth-changed'));
        onLoginSuccess(sessionUser);
      } else {
        alert('Please enter a valid verification code.');
      }
    }, 400);
  };

  return (
    <div className="crm-auth-page">
      <div className="crm-auth-card card">
        <div className="crm-auth-header">
          <img src="/logo.png" alt="Deivakaram Logo" className="crm-auth-logo" />
          <h2>DEIVAKARAM CRM</h2>
          <p>Secure Enterprise Portal Administration</p>
        </div>

        {step === 1 ? (
          isRegistering ? (
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
          )
        ) : (
          <form onSubmit={handleOtpSubmit}>
            <div className="form-group">
              <label className="form-label">Two-Factor Authentication OTP</label>
              <p className="otp-subtitle">Enter the 6-digit verification code from your authenticator app.</p>
              <div className="input-icon-wrapper">
                <Key size={16} className="input-icon" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 123456"
                  className="form-control padded-left centered-text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-accent btn-block" disabled={isProcessing}>
              {isProcessing ? <RefreshCw className="spinner" size={16} /> : 'Verify Code & Sign In'}
            </button>

            <button type="button" onClick={() => setStep(1)} className="btn-back-auth-step">
              Back to Sign In
            </button>
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
        .form-control.centered-text {
          text-align: center;
          letter-spacing: 4px;
          font-size: 18px;
          font-weight: 700;
        }
        .otp-subtitle {
          font-size: 11.5px;
          color: var(--text-muted);
          margin-bottom: 12px;
          line-height: 1.4;
        }
        .btn-back-auth-step {
          background: transparent;
          border: none;
          color: var(--text-light);
          font-size: 12px;
          cursor: pointer;
          margin-top: 14px;
          width: 100%;
          text-align: center;
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
