-- ============================================================================
-- DEIVAKARAM PLATFORM: PROFILES TABLE SCHEMA, RLS POLICIES & DATABASE TRIGGER
-- Migration: 20261013_create_profiles_table.sql
-- ============================================================================

-- 1. Create profiles table linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Comment on table and columns for documentation
COMMENT ON TABLE public.profiles IS 'User profiles storing full name and optional phone number linked to Supabase auth.users';
COMMENT ON COLUMN public.profiles.id IS 'Primary key referencing auth.users(id)';
COMMENT ON COLUMN public.profiles.full_name IS 'User full display name';
COMMENT ON COLUMN public.profiles.phone_number IS 'User contact phone number (optional, nullable)';
COMMENT ON COLUMN public.profiles.created_at IS 'Timestamp with time zone when profile was created';

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security (RLS) Policies
-- Ensure users can only read their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Ensure users can only insert their own profile
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Ensure users can only update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Ensure users can only delete their own profile
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles
    FOR DELETE
    USING (auth.uid() = id);

-- Allow service role full access for backend administrative tasks
DROP POLICY IF EXISTS "profiles_service_role" ON public.profiles;
CREATE POLICY "profiles_service_role" ON public.profiles
    FOR ALL
    USING (auth.role() = 'service_role');

-- 4. Secure Database Trigger Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number, created_at)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    COALESCE(
      new.raw_user_meta_data->>'phone_number',
      new.raw_user_meta_data->>'phone'
    ),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      phone_number = COALESCE(EXCLUDED.phone_number, public.profiles.phone_number);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach Trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
