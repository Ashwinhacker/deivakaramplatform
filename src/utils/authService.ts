import { supabase, isSupabaseConfigured } from '../db/supabaseClient.ts';

export interface IdentifierValidation {
  isValid: boolean;
  type: 'email' | 'phone';
  cleanValue: string;
  error?: string;
}

/**
 * Clean phone number into standard 10-digit Indian mobile format
 */
export const cleanPhoneNumber = (raw: string): string => {
  if (!raw) return '';
  // Remove spaces, hyphens, parentheses, dots
  let digits = raw.replace(/[^\d]/g, '');
  // Strip leading 0 or +91 / 91 if length is 12 and starts with 91
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
};

/**
 * Validate either Email or Mobile Number from a single unified input
 */
export const validateIdentifier = (input: string): IdentifierValidation => {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      isValid: false,
      type: 'email',
      cleanValue: '',
      error: 'Please enter your email address or mobile number.'
    };
  }

  // If contains @, validate as email
  if (trimmed.includes('@')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return {
        isValid: false,
        type: 'email',
        cleanValue: trimmed.toLowerCase(),
        error: 'Please enter a valid email address (e.g. name@domain.com).'
      };
    }
    return {
      isValid: true,
      type: 'email',
      cleanValue: trimmed.toLowerCase()
    };
  }

  // Otherwise, validate as mobile number
  const cleanedPhone = cleanPhoneNumber(trimmed);
  // Standard 10-digit Indian mobile starts with 6, 7, 8, or 9
  if (cleanedPhone.length === 10 && /^[6-9]\d{9}$/.test(cleanedPhone)) {
    return {
      isValid: true,
      type: 'phone',
      cleanValue: cleanedPhone
    };
  }

  return {
    isValid: false,
    type: 'phone',
    cleanValue: cleanedPhone,
    error: 'Please enter a valid 10-digit mobile number (e.g. 9876543210) or a valid email address.'
  };
};

/**
 * Resolves the Supabase Auth email from either an email or mobile number
 */
export const resolveAuthEmail = async (identifier: string): Promise<string> => {
  const check = validateIdentifier(identifier);
  if (!check.isValid) {
    throw new Error(check.error || 'Invalid email or mobile number format.');
  }

  if (check.type === 'email') {
    return check.cleanValue;
  }

  const phone = check.cleanValue;
  if (!isSupabaseConfigured) {
    return `${phone}@donor.deivakaram.org`;
  }

  try {
    // 1. Look up in public.users by phone
    const { data: userByPhone } = await supabase
      .from('users')
      .select('email')
      .or(`phone.eq.${phone},phone.eq.+91${phone},phone.eq.91${phone}`)
      .limit(1)
      .maybeSingle();

    if (userByPhone?.email) {
      return userByPhone.email.toLowerCase();
    }

    // 2. Look up in public.donors by phone
    const { data: donorByPhone } = await supabase
      .from('donors')
      .select('email')
      .or(`phone.eq.${phone},phone.eq.+91${phone},phone.eq.91${phone}`)
      .limit(1)
      .maybeSingle();

    if (donorByPhone?.email) {
      return donorByPhone.email.toLowerCase();
    }
  } catch (err) {
    console.warn('[resolveAuthEmail warning]:', err);
  }

  // 3. Fallback to synthesized valid phone email identifier
  return `donor${phone}@gmail.com`;
};

export interface SignUpParams {
  name: string;
  email?: string;
  identifier?: string; // Email or Mobile Number (backward compatibility)
  phone?: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  user?: any;
  needsEmailVerification?: boolean;
  unconfirmedEmail?: string;
  email?: string;
  message?: string;
  error?: string;
}

/**
 * Synchronize authenticated Supabase user profile into public.profiles, public.users, and public.donors database tables
 */
export const syncUserProfile = async (authUser: any, metadata?: { name?: string; phone?: string; full_name?: string; phone_number?: string }): Promise<any> => {
  if (!authUser) return null;
  const cleanEmail = (authUser.email || '').toLowerCase().trim();
  let userName = (metadata?.full_name || metadata?.name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || cleanEmail.split('@')[0] || 'Registered Donor').trim();
  let userPhone = metadata?.phone_number || metadata?.phone || authUser.user_metadata?.phone_number || authUser.user_metadata?.phone || null;

  if (isSupabaseConfigured) {
    // 0. Sync public.profiles (Requirement 5)
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
      if (prof) {
        if (prof.full_name) userName = prof.full_name;
        if (prof.phone_number) userPhone = prof.phone_number;
      } else {
        await supabase.from('profiles').upsert({
          id: authUser.id,
          full_name: userName,
          phone_number: userPhone,
          created_at: authUser.created_at || new Date().toISOString()
        }, { onConflict: 'id' });
      }
    } catch (pErr) {
      console.warn('[syncUserProfile profiles sync notice]:', pErr);
    }

    // 1. Sync public.users
    try {
      await supabase.from('users').upsert({
        id: authUser.id,
        auth_id: authUser.id,
        name: userName,
        email: cleanEmail,
        phone: userPhone,
        role: 'donor',
        status: 'active'
      }, { onConflict: 'email' });
    } catch (uErr) {
      console.warn('[syncUserProfile users sync notice]:', uErr);
    }

    // 2. Sync public.donors
    try {
      await supabase.from('donors').upsert({
        user_id: authUser.id,
        name: userName,
        email: cleanEmail,
        phone: userPhone,
        donor_type: 'Verified Donor'
      }, { onConflict: 'email' });
    } catch (dErr) {
      console.warn('[syncUserProfile donors sync notice]:', dErr);
    }
  }

  const sessionUser = {
    id: authUser.id,
    auth_id: authUser.id,
    name: userName,
    email: cleanEmail,
    phone: userPhone,
    role: 'donor',
    status: 'active'
  };

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('deivakaram_active_user', JSON.stringify(sessionUser));
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-changed'));
  }
  return sessionUser;
};

/**
 * Universal Registration (Name, Email, optional Phone, Password, Confirm Password)
 * Creates Supabase account and triggers official email verification link.
 */
export const registerUser = async (params: SignUpParams): Promise<AuthResponse> => {
  const { name, email, identifier, phone, password, confirmPassword } = params;

  // 1. Validate Full Name
  const cleanName = (name || '').trim();
  if (!cleanName || cleanName.length < 2) {
    return {
      success: false,
      error: 'Please enter your full name (at least 2 characters).'
    };
  }

  // 2. Resolve Target Email and Phone
  let targetEmail = (email || '').trim().toLowerCase();
  let phoneValue = phone ? cleanPhoneNumber(phone) : null;

  if (!targetEmail && identifier) {
    const val = validateIdentifier(identifier);
    if (val.type === 'email') {
      targetEmail = val.cleanValue;
    } else {
      phoneValue = val.cleanValue;
      targetEmail = `donor${phoneValue}@gmail.com`;
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!targetEmail || !emailRegex.test(targetEmail)) {
    return {
      success: false,
      error: 'Please enter a valid email address so we can send your account verification link.'
    };
  }

  // 3. Validate Password
  if (!password || password.length < 6) {
    return {
      success: false,
      error: 'Password must be at least 6 characters long.'
    };
  }

  // 4. Validate Password Confirmation
  if (password !== confirmPassword) {
    return {
      success: false,
      error: 'Passwords do not match. Please verify your confirmation password.'
    };
  }

  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: 'Backend authentication requires active Supabase connection. Check your .env file.'
    };
  }

  try {
    // Check if account already exists with this email in public.users
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', targetEmail)
      .maybeSingle();

    if (existingEmail) {
      return {
        success: false,
        unconfirmedEmail: targetEmail,
        error: `An account registered with ${targetEmail} already exists. Please log in, or resend your verification link if not yet confirmed.`
      };
    }

    // Call Supabase Auth signUp with emailRedirectTo pointing to Home with verified=true flag
    const origin = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost:5173';
    const redirectUrl = `${origin}/?verified=true`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: targetEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          name: cleanName,
          phone_number: phoneValue,
          phone: phoneValue,
          role: 'donor'
        },
        emailRedirectTo: redirectUrl
      }
    });

    if (authError) {
      if (authError.message?.toLowerCase().includes('already registered')) {
        return {
          success: false,
          unconfirmedEmail: targetEmail,
          error: `An account with ${targetEmail} is already registered. If you have not verified your email, click Resend Verification Link below.`
        };
      }
      if (authError.message?.toLowerCase().includes('error sending confirmation email') || authError.message?.toLowerCase().includes('rate limit')) {
        // Attempt backend admin fallback if service role key is configured in .env
        try {
          const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:5173';
          const apiUrl = origin.includes(':5173') ? 'http://localhost:5001/api/auth/register-admin' : '/api/auth/register-admin';
          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: cleanName,
              email: targetEmail,
              phone: phoneValue,
              password
            })
          });
          const adminResult = await res.json();
          if (adminResult.success && adminResult.user) {
            // Sign in immediately with credentials
            const loginRes = await supabase.auth.signInWithPassword({
              email: targetEmail,
              password
            });
            if (!loginRes.error && loginRes.data?.user) {
              const sessionUser = await syncUserProfile(loginRes.data.user, {
                full_name: cleanName,
                phone_number: phoneValue || undefined
              });
              return {
                success: true,
                user: sessionUser,
                message: 'Account created and confirmed successfully!'
              };
            }
          }
        } catch (adminErr) {
          console.warn('[Backend admin registration notice]:', adminErr);
        }

        return {
          success: false,
          error: 'Supabase email confirmation rate limit reached (default shared SMTP limit). In Supabase Dashboard: Go to Authentication > Providers > Email, turn OFF "Confirm email", and click Save to enable instant signups!'
        };
      }
      throw authError;
    }

    const userId = authData?.user?.id || `usr-${Date.now()}`;

    // Direct insert/upsert to public.profiles as initial record (Requirement 5)
    if (authData?.user) {
      try {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          full_name: cleanName,
          phone_number: phoneValue,
          created_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (pErr) {
        console.warn('[Profiles direct initial sync notice]:', pErr);
      }
    }

    // Direct insert/upsert to public.users as initial record
    if (authData?.user) {
      try {
        await supabase.from('users').upsert({
          id: authData.user.id,
          auth_id: authData.user.id,
          name: cleanName,
          email: targetEmail,
          phone: phoneValue,
          role: 'donor',
          status: 'active'
        }, { onConflict: 'email' });
      } catch (uErr) {
        console.warn('[User profile initial sync notice]:', uErr);
      }
    }

    // Direct insert/upsert to public.donors as initial record
    try {
      await supabase.from('donors').upsert({
        user_id: authData?.user?.id || null,
        name: cleanName,
        email: targetEmail,
        phone: phoneValue,
        donor_type: 'New Donor'
      }, { onConflict: 'email' });
    } catch (dbErr) {
      console.warn('[Donor profile initial sync notice]:', dbErr);
    }

    const sessionUser = {
      id: userId,
      auth_id: userId,
      name: cleanName,
      email: targetEmail,
      phone: phoneValue,
      role: 'donor',
      status: 'active'
    };

    // If auto-session was returned (when email confirmation is disabled in Supabase)
    if (authData?.session) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('deivakaram_active_user', JSON.stringify(sessionUser));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-changed'));
      }
      return {
        success: true,
        user: sessionUser,
        message: 'Account created successfully! You are now logged in.'
      };
    }

    // Default flow: Supabase dispatches the official confirmation link to user's mail
    return {
      success: true,
      needsEmailVerification: true,
      email: targetEmail,
      message: `A verification link has been sent to ${targetEmail}. Please check your inbox and click the verification link to activate your account.`
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to create account. Please check your details and try again.'
    };
  }
};

/**
 * Resend Supabase account verification link to user's email
 */
export const resendVerificationEmail = async (email: string): Promise<AuthResponse> => {
  if (!email || !email.trim()) {
    return { success: false, error: 'Email address is required.' };
  }
  const cleanEmail = email.trim().toLowerCase();
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'http://localhost:5173';
  const redirectUrl = `${origin}/?verified=true`;

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      if (error.message?.toLowerCase().includes('error sending confirmation email') || error.message?.toLowerCase().includes('rate limit')) {
        return {
          success: false,
          error: 'Supabase email limit reached. In Supabase Dashboard: Go to Project Settings > Authentication > SMTP Settings to configure Custom SMTP (e.g. Gmail App Password or Resend), or turn off "Confirm email" under Providers > Email.'
        };
      }
      return {
        success: false,
        error: error.message || 'Failed to resend verification link.'
      };
    }

    return {
      success: true,
      email: cleanEmail,
      message: `A fresh verification link has been sent to ${cleanEmail}. Please check your mail inbox and spam folder.`
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to resend verification email.'
    };
  }
};

export interface SignInParams {
  identifier: string; // Email or Mobile Number
  password: string;
}

/**
 * Universal Login (Mail or Number, Password)
 */
export const signInUser = async (params: SignInParams): Promise<AuthResponse> => {
  const { identifier, password } = params;

  if (!identifier || !identifier.trim()) {
    return {
      success: false,
      error: 'Please enter your registered email address or mobile number.'
    };
  }

  if (!password) {
    return {
      success: false,
      error: 'Please enter your password.'
    };
  }

  const validation = validateIdentifier(identifier);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error || 'Please enter a valid email or 10-digit mobile number.'
    };
  }

  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: 'Backend authentication requires active Supabase connection. Check your .env file.'
    };
  }

  try {
    const isPhone = validation.type === 'phone';
    let targetEmail = '';

    if (isPhone) {
      targetEmail = await resolveAuthEmail(validation.cleanValue);
    } else {
      targetEmail = validation.cleanValue;
    }

    // 1. Authoritative login attempt
    let authResult = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password
    });

    // If phone user failed with mapped email, attempt fallback synthesized email
    if (authResult.error && isPhone) {
      const fallbackEmail = `donor${validation.cleanValue}@gmail.com`;
      if (fallbackEmail !== targetEmail) {
        const retryResult = await supabase.auth.signInWithPassword({
          email: fallbackEmail,
          password
        });
        if (!retryResult.error) {
          authResult = retryResult;
          targetEmail = fallbackEmail;
        }
      }
    }

    if (authResult.error) {
      if (authResult.error.message?.includes('Invalid login credentials')) {
        return {
          success: false,
          error: 'Incorrect email/mobile or password. Please verify and try again.'
        };
      }
      if (authResult.error.message?.toLowerCase().includes('email not confirmed')) {
        return {
          success: false,
          needsEmailVerification: true,
          unconfirmedEmail: targetEmail,
          error: `Your email address (${targetEmail}) has not been verified yet. Please check your mail inbox for the verification link.`
        };
      }
      throw authResult.error;
    }

    const authUser = authResult.data?.user;
    if (!authUser) {
      throw new Error('No user data returned from authentication service.');
    }

    // 2. Fetch or initialize profile in public.users
    let { data: profile } = await supabase
      .from('users')
      .select('*')
      .or(`id.eq.${authUser.id},auth_id.eq.${authUser.id},email.eq.${targetEmail}`)
      .maybeSingle();

    if (!profile) {
      try {
        const { data: createdProf } = await supabase
          .from('users')
          .upsert({
            id: authUser.id,
            auth_id: authUser.id,
            name: authUser.user_metadata?.name || targetEmail.split('@')[0],
            email: targetEmail,
            phone: authUser.user_metadata?.phone || (isPhone ? validation.cleanValue : null),
            role: 'donor',
            status: 'active'
          }, { onConflict: 'email' })
          .select('*')
          .maybeSingle();
        if (createdProf) profile = createdProf;
      } catch (uErr) {
        console.warn('[Auto-provision public.users notice]:', uErr);
      }
    }

    if (profile?.status === 'suspended') {
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'This account has been deactivated. Please contact support.'
      };
    }

    // 3. Fetch or initialize synced donor profile in public.donors
    let { data: donor } = await supabase
      .from('donors')
      .select('*')
      .or(`user_id.eq.${authUser.id},email.eq.${targetEmail}`)
      .maybeSingle();

    if (!donor) {
      try {
        const { data: createdDonor } = await supabase
          .from('donors')
          .upsert({
            user_id: authUser.id,
            name: profile?.name || authUser.user_metadata?.name || targetEmail.split('@')[0],
            email: targetEmail,
            phone: profile?.phone || authUser.user_metadata?.phone || (isPhone ? validation.cleanValue : null),
            donor_type: 'Verified Donor'
          }, { onConflict: 'email' })
          .select('*')
          .maybeSingle();
        if (createdDonor) donor = createdDonor;
      } catch (dErr) {
        console.warn('[Auto-provision public.donors notice]:', dErr);
      }
    }

    const sessionUser = {
      id: profile?.id || donor?.id || authUser.id,
      auth_id: authUser.id,
      name: profile?.name || donor?.name || authUser.user_metadata?.name || 'Registered Donor',
      email: targetEmail,
      phone: profile?.phone || donor?.phone || authUser.user_metadata?.phone || (isPhone ? validation.cleanValue : ''),
      address: donor?.address || '',
      pan: donor?.pan || '',
      role: profile?.role || 'donor',
      status: 'active'
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('deivakaram_active_user', JSON.stringify(sessionUser));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-changed'));
    }

    return {
      success: true,
      user: sessionUser,
      message: 'Logged in successfully.'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Login failed. Please verify your credentials.'
    };
  }
};

/**
 * Universal Logout
 */
export const signOutUser = async (): Promise<void> => {
  try {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.warn('[Sign out error]:', err);
  } finally {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('deivakaram_active_user');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-changed'));
    }
  }
};

/**
 * Profile CRUD: Update Account Information in Supabase
 */
export const updateAccountProfile = async (
  userId: string,
  updates: { name: string; phone?: string; address?: string; pan?: string }
): Promise<AuthResponse> => {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Database service is not configured.' };
  }

  try {
    const cleanName = updates.name.trim();
    const cleanPhone = updates.phone ? cleanPhoneNumber(updates.phone) : null;
    const cleanAddress = updates.address ? updates.address.trim() : null;
    const cleanPan = updates.pan ? updates.pan.trim().toUpperCase() : null;

    // 0. Update public.profiles (Requirement 5)
    try {
      await supabase
        .from('profiles')
        .update({
          full_name: cleanName,
          phone_number: cleanPhone
        })
        .eq('id', userId);
    } catch (pErr) {
      console.warn('public.profiles update notice:', pErr);
    }

    // 1. Update public.donors
    const { error: donorErr } = await supabase
      .from('donors')
      .update({
        name: cleanName,
        phone: cleanPhone,
        address: cleanAddress,
        pan: cleanPan
      })
      .or(`id.eq.${userId},user_id.eq.${userId}`);

    if (donorErr) throw donorErr;

    // 2. Update public.users
    try {
      await supabase
        .from('users')
        .update({
          name: cleanName,
          phone: cleanPhone
        })
        .or(`id.eq.${userId},auth_id.eq.${userId}`);
    } catch (uErr) {
      console.warn('public.users update notice:', uErr);
    }

    // 3. Update active session in localStorage
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('deivakaram_active_user') : null;
    if (stored) {
      const parsed = JSON.parse(stored);
      const updatedUser = {
        ...parsed,
        name: cleanName,
        phone: cleanPhone || parsed.phone,
        address: cleanAddress || parsed.address,
        pan: cleanPan || parsed.pan
      };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('deivakaram_active_user', JSON.stringify(updatedUser));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-changed'));
      }
    }

    return {
      success: true,
      message: 'Account profile updated successfully.'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to update profile.'
    };
  }
};

/**
 * Profile CRUD: Change Password
 */
export const changeAccountPassword = async (newPassword: string): Promise<AuthResponse> => {
  if (!newPassword || newPassword.length < 6) {
    return {
      success: false,
      error: 'New password must be at least 6 characters long.'
    };
  }

  if (!isSupabaseConfigured) {
    return { success: false, error: 'Authentication service is not configured.' };
  }

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;

    return {
      success: true,
      message: 'Account password updated successfully.'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to update password.'
    };
  }
};

/**
 * Profile CRUD: Deactivate Account
 */
export const deactivateAccount = async (userId: string): Promise<AuthResponse> => {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Database service is not configured.' };
  }

  try {
    // Mark status as suspended/inactive in public.users
    await supabase
      .from('users')
      .update({ status: 'suspended' })
      .or(`id.eq.${userId},auth_id.eq.${userId}`);

    await signOutUser();
    return {
      success: true,
      message: 'Account has been deactivated successfully.'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to deactivate account.'
    };
  }
};

/**
 * Fetch profile directly from public.profiles table
 */
export const getProfile = async (userId: string): Promise<{ id: string; full_name: string; phone_number: string | null; created_at: string } | null> => {
  if (!isSupabaseConfigured || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('[getProfile error]:', err);
  }
  return null;
};

