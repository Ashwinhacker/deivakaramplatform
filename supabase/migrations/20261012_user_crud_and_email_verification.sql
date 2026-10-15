-- ============================================================================
-- DEIVAKARAM DATABASE MIGRATION: DEFAULT SUPABASE EMAIL VERIFICATION & USER CRUD
-- Migration: 20261012_user_crud_and_email_verification.sql
-- ============================================================================

-- 1. Ensure public.users table exists with proper constraints
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'donor' CHECK (role IN ('donor', 'sub_admin', 'super_admin')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Ensure public.admin_users table exists with cascading delete
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    permissions TEXT[] DEFAULT '{}'::TEXT[],
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended'))
);

-- 3. Update Row Level Security (RLS) on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users 
    FOR SELECT USING (
        auth_id = auth.uid() 
        OR id = auth.uid() 
        OR public.is_admin() 
        OR auth.role() = 'service_role'
        OR auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "users_insert" ON public.users;
CREATE POLICY "users_insert" ON public.users 
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_update" ON public.users 
    FOR UPDATE USING (
        auth_id = auth.uid() 
        OR id = auth.uid() 
        OR public.is_admin() 
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "users_delete" ON public.users;
CREATE POLICY "users_delete" ON public.users 
    FOR DELETE USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

-- 4. Update Row Level Security on public.admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_select" ON public.admin_users;
CREATE POLICY "admin_users_select" ON public.admin_users 
    FOR SELECT USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
        OR auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "admin_users_modify" ON public.admin_users;
CREATE POLICY "admin_users_modify" ON public.admin_users 
    FOR ALL USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

-- 5. Trigger for automatic synchronization when a user confirms or registers in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert or update in public.users profile table
  INSERT INTO public.users (id, auth_id, name, email, phone, role, status)
  VALUES (
    new.id,
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    LOWER(new.email),
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'role', 'donor'),
    'active'
  )
  ON CONFLICT (email) DO UPDATE
  SET auth_id = EXCLUDED.auth_id,
      name = COALESCE(EXCLUDED.name, public.users.name),
      phone = COALESCE(EXCLUDED.phone, public.users.phone),
      role = COALESCE(public.users.role, EXCLUDED.role);

  -- If user role is donor, also sync to public.donors table
  IF COALESCE(new.raw_user_meta_data->>'role', 'donor') = 'donor' THEN
    INSERT INTO public.donors (user_id, name, email, phone, address, pan, donor_type)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      LOWER(new.email),
      new.raw_user_meta_data->>'phone',
      new.raw_user_meta_data->>'address',
      new.raw_user_meta_data->>'pan',
      'New Donor'
    )
    ON CONFLICT (email) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        name = EXCLUDED.name,
        phone = COALESCE(EXCLUDED.phone, public.donors.phone),
        address = COALESCE(EXCLUDED.address, public.donors.address),
        pan = COALESCE(EXCLUDED.pan, public.donors.pan);
  END IF;

  -- If user role is sub_admin or super_admin, sync to public.admin_users table
  IF COALESCE(new.raw_user_meta_data->>'role', 'donor') IN ('sub_admin', 'super_admin') THEN
    INSERT INTO public.admin_users (id, permissions, status)
    VALUES (
      new.id,
      CASE 
        WHEN new.raw_user_meta_data->>'role' = 'super_admin' THEN 
          ARRAY['donations', 'donors', 'volunteers', 'beneficiaries', 'campaigns', 'events', 'content', 'reports', 'settings', 'admins', 'logs']::TEXT[]
        ELSE 
          ARRAY['donations', 'donors', 'volunteers', 'events']::TEXT[]
      END,
      'active'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
