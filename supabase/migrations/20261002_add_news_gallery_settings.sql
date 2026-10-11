-- DEIVAKARAM CHARITABLE TRUST DATABASE MIGRATION
-- Migration: Add news, gallery_items, settings, and success_stories tables
-- Target: Supabase PostgreSQL
-- Safe to run in Supabase SQL Editor without affecting existing tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------------------------------
-- 17. NEWS Table (Trust Bulletins, Announcements, and Press Releases)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Education Support', 'Healthcare Support', 'Women Empowerment', 'General', 'Community Welfare', 'Elder Care')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    author TEXT NOT NULL DEFAULT 'Trust Secretariat',
    image TEXT,
    status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

--------------------------------------------------------------------------------
-- 18. GALLERY ITEMS Table (Google Drive and Cloud Media Sync)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gallery_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General' CHECK (category IN ('Education', 'Medical Camps', 'Food Distribution', 'Volunteers', 'Events', 'Senior Citizens', 'Child Welfare', 'Animal Welfare', 'General')),
    media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    google_drive_file_id TEXT,
    google_drive_folder_id TEXT,
    file_name TEXT,
    file_size BIGINT,
    uploaded_by TEXT DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

--------------------------------------------------------------------------------
-- 19. SETTINGS Table (Enterprise Trust Configuration & Payment Credentials)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    org_name TEXT NOT NULL DEFAULT 'Deivakaram Charitable Trust',
    org_address TEXT DEFAULT '14 Gandhipuram, Coimbatore, Tamil Nadu - 641012',
    org_email TEXT DEFAULT 'contact@deivakaram.org',
    org_phone TEXT DEFAULT '+91 98765 43210',
    trust_upi_id TEXT DEFAULT 'ashwinop58@okicici',
    social_facebook TEXT,
    social_twitter TEXT,
    social_instagram TEXT,
    social_linkedin TEXT,
    payment_gateway TEXT DEFAULT 'Razorpay',
    payment_api_key TEXT,
    payment_secret_key TEXT,
    payment_webhook_url TEXT,
    smtp_host TEXT,
    smtp_port TEXT,
    smtp_user TEXT,
    smtp_pass TEXT,
    smtp_sender_name TEXT,
    smtp_sender_email TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    google_drive_folder_id TEXT DEFAULT '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    google_drive_folder_name TEXT DEFAULT 'Deivakaram Official Trust Media Drive',
    google_drive_webhook_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

--------------------------------------------------------------------------------
-- 20. SUCCESS STORIES Table (Impact stories of transformed lives)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.success_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    story TEXT NOT NULL,
    before_status TEXT,
    after_status TEXT,
    location TEXT,
    program TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------------
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read news' AND tablename = 'news') THEN
    CREATE POLICY "Public read news" ON public.news FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public write news' AND tablename = 'news') THEN
    CREATE POLICY "Public write news" ON public.news FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read gallery_items' AND tablename = 'gallery_items') THEN
    CREATE POLICY "Public read gallery_items" ON public.gallery_items FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public write gallery_items' AND tablename = 'gallery_items') THEN
    CREATE POLICY "Public write gallery_items" ON public.gallery_items FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read settings' AND tablename = 'settings') THEN
    CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public write settings' AND tablename = 'settings') THEN
    CREATE POLICY "Public write settings" ON public.settings FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read success_stories' AND tablename = 'success_stories') THEN
    CREATE POLICY "Public read success_stories" ON public.success_stories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public write success_stories' AND tablename = 'success_stories') THEN
    CREATE POLICY "Public write success_stories" ON public.success_stories FOR ALL USING (true);
  END IF;
END $$;

--------------------------------------------------------------------------------
-- SEED INITIAL DATA
--------------------------------------------------------------------------------

-- 1. Seed Default Settings
INSERT INTO public.settings (id, org_name, org_address, org_email, org_phone, trust_upi_id, payment_gateway, google_drive_folder_id, google_drive_folder_name)
VALUES (
  'default',
  'Deivakaram Charitable Trust',
  '14 Gandhipuram, Coimbatore, Tamil Nadu - 641012',
  'contact@deivakaram.org',
  '+91 98765 43210',
  'ashwinop58@okicici',
  'Razorpay',
  '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
  'Deivakaram Official Trust Media Drive'
)
ON CONFLICT (id) DO UPDATE 
SET updated_at = NOW();

-- 2. Seed Default News Bulletins
INSERT INTO public.news (title, description, category, date, author, image, status)
VALUES 
  (
    'Over 120 Students Empowered with Scholarships this Academic Year',
    'Deivakaram Charitable Trust holds its academic distribution meet to clear pending college dues and distribute textbooks to underprivileged scholars.',
    'Education Support',
    '2026-07-28',
    'Trust Secretariat',
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=400',
    'published'
  ),
  (
    'Emergency Medical Camps Organized in Coastal Villages',
    'Medical camps screen 450+ patients, offering free diagnostics, pediatric screenings, cardiac support, and free pharmaceutical medicines.',
    'Healthcare Support',
    '2026-07-15',
    'Dr. Ramesh Kumar (Chief Medical Trustee)',
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=400',
    'published'
  ),
  (
    'Trust Establishes Free Skill Tailoring Center for Kanchipuram Women',
    'Aiming to build entrepreneurship, the trust sets up a self-reliance center with sewing machines, technical trainers, and marketing support.',
    'Women Empowerment',
    '2026-06-30',
    'Trustee Board',
    'https://images.unsplash.com/photo-1489533119213-66a5cd877091?auto=format&fit=crop&q=80&w=400',
    'published'
  )
ON CONFLICT DO NOTHING;

-- 3. Seed Default Gallery Items
INSERT INTO public.gallery_items (title, category, media_type, url, thumbnail_url, google_drive_file_id, google_drive_folder_id, file_name, file_size)
VALUES
  ('Scholarship Presentation Chennai', 'Education', 'image', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=600', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=300', '1aBcDeFgHiJkLmNoPqRsTuVwXyZ01', '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs', 'scholarship_presentation_2026.jpg', 1420500),
  ('Eye Diagnostics Jawadhu Hills', 'Medical Camps', 'image', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=300', '1bBcDeFgHiJkLmNoPqRsTuVwXyZ02', '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs', 'eye_diagnostics_camp.jpg', 2180400),
  ('Annadanam Feeding Koyambedu', 'Food Distribution', 'image', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=300', '1cBcDeFgHiJkLmNoPqRsTuVwXyZ03', '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs', 'annadanam_koyambedu_feeding.jpg', 1890200)
ON CONFLICT DO NOTHING;
