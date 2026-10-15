import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  const proc = (globalThis as any)?.process;
  if (typeof proc !== 'undefined' && proc.env && proc.env[key]) {
    return proc.env[key] as string;
  }
  return '';
};

export const getSupabaseUrl = (): string => getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL') || '';
export const getSupabaseKey = (): string => getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_PUBLISHABLE_KEY') || getEnv('SUPABASE_PUBLISHABLE_KEY') || '';

export const isSupabaseConfigured = Boolean(getSupabaseUrl()) && Boolean(getSupabaseKey());

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseKey();

// Supabase createClient throws a runtime error if URL or Key is empty.
// We pass valid placeholder values to prevent startup crashes when running in Mock DB mode.
const finalUrl = supabaseUrl || 'https://placeholder-project.supabase.co';
const finalKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-key';

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

/**
 * Health check helper to test if Supabase backend is reachable and responsive
 */
export const checkSupabaseHealth = async (): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error && error.message?.includes('fetch failed')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export default supabase;
