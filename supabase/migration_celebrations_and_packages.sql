-- ==============================================================================
-- DEIVAKARAM CELEBRATION BOOKINGS, DYNAMIC PACKAGES & ADDONS MIGRATION
-- Paste this script directly into Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ggjuvgyleograndnjrob/sql/new
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Ensure 'plan' column exists on donations table
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'One-Time Contribution';

-- 2. CELEBRATION BOOKINGS Table
CREATE TABLE IF NOT EXISTS public.celebration_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id TEXT UNIQUE NOT NULL, -- DVK-CEL-YYYY-XXXXXX
    donor_id UUID REFERENCES public.donors(id) ON DELETE SET NULL,
    donation_id UUID REFERENCES public.donations(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    celebrant_name TEXT NOT NULL,
    occasion_type TEXT DEFAULT 'Birthday' CHECK (occasion_type IN ('Birthday', 'Anniversary', 'Memorial', 'Other')),
    occasion_date DATE NOT NULL,
    banner_photo_url TEXT NOT NULL,
    banner_photo_name TEXT,
    is_virtual BOOLEAN DEFAULT FALSE,
    virtual_time_slot TEXT,
    food_count INTEGER DEFAULT 25,
    package_id TEXT NOT NULL,
    package_name TEXT NOT NULL,
    cake_details TEXT,
    selected_addons JSONB DEFAULT '[]'::JSONB,
    total_amount NUMERIC(12, 2) NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_order_id TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'successful', 'failed')),
    booking_status TEXT DEFAULT 'confirmed' CHECK (booking_status IN ('pending', 'confirmed', 'banner_printed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. DYNAMIC PACKAGES Table (Super Admin Configurable)
CREATE TABLE IF NOT EXISTS public.packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    base_price NUMERIC(10, 2) NOT NULL,
    min_food_count INTEGER DEFAULT 25,
    tagline TEXT,
    badge TEXT,
    icon TEXT DEFAULT 'cake',
    inclusions TEXT[] DEFAULT '{}'::TEXT[],
    note TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. DYNAMIC ADDONS Table (Super Admin Configurable)
CREATE TABLE IF NOT EXISTS public.addons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    description TEXT,
    is_per_unit BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.celebration_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Public read celebration_bookings" ON public.celebration_bookings;
DROP POLICY IF EXISTS "Public write celebration_bookings" ON public.celebration_bookings;
DROP POLICY IF EXISTS "Public read packages" ON public.packages;
DROP POLICY IF EXISTS "Public write packages" ON public.packages;
DROP POLICY IF EXISTS "Public read addons" ON public.addons;
DROP POLICY IF EXISTS "Public write addons" ON public.addons;

CREATE POLICY "Public read celebration_bookings" ON public.celebration_bookings FOR SELECT USING (true);
CREATE POLICY "Public write celebration_bookings" ON public.celebration_bookings FOR ALL USING (true);

CREATE POLICY "Public read packages" ON public.packages FOR SELECT USING (true);
CREATE POLICY "Public write packages" ON public.packages FOR ALL USING (true);

CREATE POLICY "Public read addons" ON public.addons FOR SELECT USING (true);
CREATE POLICY "Public write addons" ON public.addons FOR ALL USING (true);

-- 6. SEED DEFAULT PACKAGES
INSERT INTO public.packages (id, name, base_price, min_food_count, tagline, badge, icon, inclusions, note, is_active)
VALUES 
  ('birthday_anniversary', '1. Birthday / Anniversary Donation', 2500, 25, 'Starts from Rs. 2,500', 'Celebrate Life', 'cake', ARRAY['25 food meals - Rs. 70 each', '1 kg Cake - Rs. 550', 'Photo Banner - Rs. 150'], 'Celebrate your special milestones with those who need it most. We share food and joy in your name.', true),
  ('virtual_birthday', '2. Virtual Birthday Celebration', 3500, 20, 'Rs. 3,500', 'Interactive Meet', 'video', ARRAY['20 food meals for children', 'Cake', 'Chocolates & Juice', 'Festive items such as balloons and caps'], 'You can join a virtual meet and celebrate your special day with the children.', true),
  ('old_age_home', '3. Old Age Home Donation', 10000, 50, 'Total: Rs. 10,000', 'Senior Respect', 'elder', ARRAY['Food', 'Cake', 'Essential items for elders'], 'A meaningful way to share love, care and respect with senior citizens.', true),
  ('orphanage_home', '4. Orphanage Home Donation', 7500, 35, 'Total: Rs. 7,500', 'Brighten Childhood', 'child', ARRAY['Food', 'Cake', 'Essential items for children'], 'Make a special occasion brighter by sharing it with children in need.', true),
  ('feed_stray_animals', '5. Feed Stray Animals', 750, 25, 'Starts from Rs. 750', 'Compassion for All', 'animal', ARRAY['Minimum: 25 food portions', 'Rs. 30 per food portion', 'Minimum contribution for 25 portions - Rs. 750'], 'Help provide nourishment and care to animals in need.', true),
  ('general_custom', '6. General / Custom Contribution', 1000, 1, 'Flexible Amount', 'Where Most Needed', 'general', ARRAY['Disaster and emergency hospital relief', 'Daily Annadhanam free kitchen supplies', 'Elder medical aid and children education'], 'Support general operational relief funds where the urgent need is greatest.', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  base_price = EXCLUDED.base_price,
  min_food_count = EXCLUDED.min_food_count,
  tagline = EXCLUDED.tagline,
  badge = EXCLUDED.badge,
  icon = EXCLUDED.icon,
  inclusions = EXCLUDED.inclusions,
  note = EXCLUDED.note,
  is_active = EXCLUDED.is_active;

-- 7. SEED DEFAULT ADDONS
INSERT INTO public.addons (id, name, price, description, is_per_unit, is_active)
VALUES
  ('photo_cake', 'Photo Cake', 800, 'Photo Cake - Rs. 800', false, true),
  ('rose_milk', 'Rose Milk (10 glasses)', 150, 'Rose Milk - 10 glasses - Rs. 150', false, true),
  ('grocery_kit', 'Grocery Kit (1 family)', 500, 'Grocery Kit - 1 family - Rs. 500', false, true),
  ('stationery_kit', 'Stationery Kit', 25, 'Stationery Kit - Rs. 25 each', true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  is_per_unit = EXCLUDED.is_per_unit,
  is_active = EXCLUDED.is_active;
