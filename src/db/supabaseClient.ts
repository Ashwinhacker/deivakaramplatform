import { createClient } from '@supabase/supabase-js';

const env: Record<string, any> = (typeof import.meta !== 'undefined' && import.meta.env) || (globalThis as any)?.process?.env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(env.VITE_SUPABASE_URL) && Boolean(env.VITE_SUPABASE_ANON_KEY);

// Supabase createClient throws a runtime error if URL or Key is empty.
// We pass valid placeholder values to prevent startup crashes when running in Mock DB mode.
const finalUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co';
const finalKey = isSupabaseConfigured ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-key';

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
