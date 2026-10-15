-- DEIVAKARAM CHARITABLE TRUST DATABASE SCHEMA
-- Target Database: Supabase PostgreSQL
-- Setup for: User roles, Admin Users, Donors, Donations, Campaigns, Volunteers, Beneficiaries, Events, Audit Logs

-- 0. Clean prior tables and triggers if re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

DROP TABLE IF EXISTS public.webhook_events CASCADE;
DROP TABLE IF EXISTS public.payment_orders CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.receipts CASCADE;
DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.assistance_records CASCADE;
DROP TABLE IF EXISTS public.beneficiaries CASCADE;
DROP TABLE IF EXISTS public.volunteers CASCADE;
DROP TABLE IF EXISTS public.donations CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.donors CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.celebration_bookings CASCADE;
DROP TABLE IF EXISTS public.packages CASCADE;
DROP TABLE IF EXISTS public.addons CASCADE;
DROP TABLE IF EXISTS public.news CASCADE;
DROP TABLE IF EXISTS public.gallery_items CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.success_stories CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------------------------------
-- 1. USERS Table (Custom profile synced with Supabase Auth or CRM Invitations)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE, -- Link to auth.users(id)
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'donor' CHECK (role IN ('donor', 'sub_admin', 'super_admin')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

--------------------------------------------------------------------------------
-- 2. ADMIN USERS Table (Configurable permissions for sub-admins and super-admins)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    permissions TEXT[] DEFAULT '{}'::TEXT[], -- e.g. {'donations', 'donors', 'volunteers', 'beneficiaries', 'campaigns', 'events', 'reports', 'settings', 'admins', 'logs'}
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended'))
);

--------------------------------------------------------------------------------
-- 3. DONORS Table (Details of individual donors)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.donors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    pan TEXT,
    donor_type TEXT DEFAULT 'New Donor' CHECK (donor_type IN ('New Donor', 'Regular Donor', 'Major Donor', 'Monthly Donor', 'Inactive Donor', 'Campaign Donor', 'Anonymous Donor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

--------------------------------------------------------------------------------
-- 4. CAMPAIGNS Table
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cover_image TEXT,
    target_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    raised_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    beneficiary_info TEXT,
    location TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'draft')),
    gallery TEXT[] DEFAULT '{}'::TEXT[],
    updates JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

--------------------------------------------------------------------------------
-- 5. DONATIONS Table (Integrates Payment Gateway details)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donation_id TEXT UNIQUE NOT NULL, -- DVK-DON-YYYY-XXXXXX
    donor_id UUID REFERENCES public.donors(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    purpose TEXT NOT NULL,
    plan TEXT DEFAULT 'One-Time Contribution',
    payment_method TEXT NOT NULL, -- UPI, Credit Card, Debit Card, Net Banking
    transaction_id TEXT UNIQUE NOT NULL,
    razorpay_order_id TEXT,
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'processing', 'successful', 'failed', 'refunded', 'cancelled')),
    receipt_number TEXT UNIQUE, -- DVK-REC-XXXXXX
    is_anonymous BOOLEAN DEFAULT FALSE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

--------------------------------------------------------------------------------
-- 6. VOLUNTEERS Table
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_id TEXT UNIQUE NOT NULL, -- DVK-VOL-XXXXXX
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    age INTEGER CHECK (age >= 18),
    location TEXT NOT NULL,
    occupation TEXT,
    skills TEXT[] DEFAULT '{}'::TEXT[],
    interests TEXT[] DEFAULT '{}'::TEXT[],
    availability TEXT,
    experience TEXT,
    emergency_contact TEXT,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

--------------------------------------------------------------------------------
-- 7. BENEFICIARIES Table (Assistance / Support request system)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beneficiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id TEXT UNIQUE NOT NULL, -- DVK-CASE-XXXXXX
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Medical', 'Education', 'Food', 'Child Welfare', 'Senior Citizen', 'Women Support', 'Emergency', 'Other')),
    description TEXT NOT NULL,
    family_info TEXT,
    income_info TEXT,
    required_assistance TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'documents_required', 'approved', 'rejected', 'assistance_provided', 'closed')),
    supporting_docs TEXT[] DEFAULT '{}'::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

--------------------------------------------------------------------------------
-- 8. ASSISTANCE RECORDS (Funds allocated to specific beneficiary cases)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assistance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id UUID NOT NULL REFERENCES public.beneficiaries(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    assistance_type TEXT NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

--------------------------------------------------------------------------------
-- 9. EVENTS Table
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    time_str TEXT NOT NULL,
    cover_image TEXT,
    volunteer_required INTEGER DEFAULT 0,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    registrations JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

--------------------------------------------------------------------------------
-- 10. CONTACT MESSAGES Table
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_id TEXT UNIQUE NOT NULL, -- DVK-INQ-XXXXXX
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

--------------------------------------------------------------------------------
-- 11. RECEIPTS Table (Reference to generated receipts)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donation_id UUID UNIQUE NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
    receipt_number TEXT UNIQUE NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

--------------------------------------------------------------------------------
-- 12. SYSTEM NOTIFICATIONS Table
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('donation', 'volunteer', 'case', 'message', 'alert')),
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

--------------------------------------------------------------------------------
-- 13. AUDIT LOGS (Super Admin viewable logs of all modifications)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

--------------------------------------------------------------------------------
-- 14. CELEBRATION BOOKINGS Table
--------------------------------------------------------------------------------
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

--------------------------------------------------------------------------------
-- 15. DYNAMIC PACKAGES Table (Super Admin Configurable)
--------------------------------------------------------------------------------
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

--------------------------------------------------------------------------------
-- 16. DYNAMIC ADDONS Table (Super Admin Configurable)
--------------------------------------------------------------------------------
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
-- 21. PAYMENT ORDERS Table (Tracks authoritative gateway orders created server-side)
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT UNIQUE NOT NULL, -- Razorpay order ID (order_...)
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    donor_id UUID REFERENCES public.donors(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
    item_type TEXT NOT NULL CHECK (item_type IN ('donation', 'celebration_package', 'campaign', 'general')),
    item_id TEXT,
    receipt TEXT,
    notes JSONB DEFAULT '{}'::JSONB,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id ON public.payment_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_donor_id ON public.payment_orders(donor_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON public.payment_orders(status);

--------------------------------------------------------------------------------
-- 22. WEBHOOK EVENTS Table (Idempotent processing of gateway webhooks)
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);

--------------------------------------------------------------------------------
-- HELPER FUNCTION: IS ADMIN
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.users 
        WHERE (auth_id = auth.uid() OR id = auth.uid()) 
          AND role IN ('super_admin', 'sub_admin')
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

--------------------------------------------------------------------------------
-- PRODUCTION ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------------

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.celebration_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- 1. Users policies
DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users 
    FOR SELECT USING (auth_id = auth.uid() OR id = auth.uid() OR public.is_admin() OR auth.role() = 'service_role' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_update" ON public.users 
    FOR UPDATE USING (auth_id = auth.uid() OR id = auth.uid() OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "users_insert" ON public.users;
CREATE POLICY "users_insert" ON public.users 
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "users_delete" ON public.users;
CREATE POLICY "users_delete" ON public.users 
    FOR DELETE USING (public.is_admin() OR auth.role() = 'service_role');

-- 2. Admin Users policies
DROP POLICY IF EXISTS "admin_users_select" ON public.admin_users;
CREATE POLICY "admin_users_select" ON public.admin_users 
    FOR SELECT USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_users_modify" ON public.admin_users;
CREATE POLICY "admin_users_modify" ON public.admin_users 
    FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

-- 3. Donors policies
DROP POLICY IF EXISTS "donors_select" ON public.donors;
CREATE POLICY "donors_select" ON public.donors 
    FOR SELECT USING (
        user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid())
        OR email = (SELECT email FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid())
        OR public.is_admin()
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "donors_insert" ON public.donors;
CREATE POLICY "donors_insert" ON public.donors FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "donors_update" ON public.donors;
CREATE POLICY "donors_update" ON public.donors 
    FOR UPDATE USING (
        user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid())
        OR email = (SELECT email FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid())
        OR public.is_admin()
        OR auth.role() = 'service_role'
    );

-- 4. Donations policies
DROP POLICY IF EXISTS "donations_select" ON public.donations;
CREATE POLICY "donations_select" ON public.donations 
    FOR SELECT USING (
        donor_id IN (SELECT id FROM public.donors WHERE user_id = auth.uid() OR email = (SELECT email FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid()))
        OR public.is_admin()
        OR auth.role() = 'service_role'
        OR is_anonymous = false
    );

DROP POLICY IF EXISTS "donations_insert" ON public.donations;
CREATE POLICY "donations_insert" ON public.donations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "donations_update" ON public.donations;
CREATE POLICY "donations_update" ON public.donations FOR UPDATE USING (public.is_admin() OR auth.role() = 'service_role');

-- 5. Payment Orders policies
DROP POLICY IF EXISTS "payment_orders_select" ON public.payment_orders;
CREATE POLICY "payment_orders_select" ON public.payment_orders 
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "payment_orders_insert" ON public.payment_orders;
CREATE POLICY "payment_orders_insert" ON public.payment_orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "payment_orders_update" ON public.payment_orders;
CREATE POLICY "payment_orders_update" ON public.payment_orders FOR UPDATE USING (public.is_admin() OR auth.role() = 'service_role');

-- 6. Webhook Events policies
DROP POLICY IF EXISTS "webhook_events_all" ON public.webhook_events;
CREATE POLICY "webhook_events_all" ON public.webhook_events FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

-- 7. Celebration Bookings policies
DROP POLICY IF EXISTS "celebration_bookings_select" ON public.celebration_bookings;
CREATE POLICY "celebration_bookings_select" ON public.celebration_bookings 
    FOR SELECT USING (
        donor_id IN (SELECT id FROM public.donors WHERE user_id = auth.uid() OR email = (SELECT email FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid()))
        OR customer_email = (SELECT email FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid())
        OR public.is_admin()
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "celebration_bookings_insert" ON public.celebration_bookings;
CREATE POLICY "celebration_bookings_insert" ON public.celebration_bookings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "celebration_bookings_update" ON public.celebration_bookings;
CREATE POLICY "celebration_bookings_update" ON public.celebration_bookings FOR UPDATE USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "celebration_bookings_delete" ON public.celebration_bookings;
CREATE POLICY "celebration_bookings_delete" ON public.celebration_bookings FOR DELETE USING (public.is_admin() OR auth.role() = 'service_role');

-- 8. Campaigns policies
DROP POLICY IF EXISTS "campaigns_select" ON public.campaigns;
CREATE POLICY "campaigns_select" ON public.campaigns FOR SELECT USING (status = 'active' OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "campaigns_admin_modify" ON public.campaigns;
CREATE POLICY "campaigns_admin_modify" ON public.campaigns FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

-- 9. Packages & Addons policies
DROP POLICY IF EXISTS "packages_select" ON public.packages;
CREATE POLICY "packages_select" ON public.packages FOR SELECT USING (is_active = true OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "packages_admin_modify" ON public.packages;
CREATE POLICY "packages_admin_modify" ON public.packages FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "addons_select" ON public.addons;
CREATE POLICY "addons_select" ON public.addons FOR SELECT USING (is_active = true OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "addons_admin_modify" ON public.addons;
CREATE POLICY "addons_admin_modify" ON public.addons FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

-- 10. News & Media policies
DROP POLICY IF EXISTS "news_select" ON public.news;
CREATE POLICY "news_select" ON public.news FOR SELECT USING (status = 'published' OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "news_admin_modify" ON public.news;
CREATE POLICY "news_admin_modify" ON public.news FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "gallery_select" ON public.gallery_items;
CREATE POLICY "gallery_select" ON public.gallery_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "gallery_admin_modify" ON public.gallery_items;
CREATE POLICY "gallery_admin_modify" ON public.gallery_items FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

-- 11. Events policies
DROP POLICY IF EXISTS "events_select" ON public.events;
CREATE POLICY "events_select" ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "events_admin_modify" ON public.events;
CREATE POLICY "events_admin_modify" ON public.events FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

-- 12. Volunteers policies
DROP POLICY IF EXISTS "volunteers_insert" ON public.volunteers;
CREATE POLICY "volunteers_insert" ON public.volunteers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "volunteers_select" ON public.volunteers;
CREATE POLICY "volunteers_select" ON public.volunteers FOR SELECT USING (user_id = auth.uid() OR email = (SELECT email FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid()) OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "volunteers_modify" ON public.volunteers;
CREATE POLICY "volunteers_modify" ON public.volunteers FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

-- 13. Beneficiaries & Assistance Records
DROP POLICY IF EXISTS "beneficiaries_insert" ON public.beneficiaries;
CREATE POLICY "beneficiaries_insert" ON public.beneficiaries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "beneficiaries_select" ON public.beneficiaries;
CREATE POLICY "beneficiaries_select" ON public.beneficiaries FOR SELECT USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "beneficiaries_modify" ON public.beneficiaries;
CREATE POLICY "beneficiaries_modify" ON public.beneficiaries FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "assistance_records_all" ON public.assistance_records;
CREATE POLICY "assistance_records_all" ON public.assistance_records FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

-- 14. Contact Messages
DROP POLICY IF EXISTS "contact_insert" ON public.contact_messages;
CREATE POLICY "contact_insert" ON public.contact_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "contact_select_modify" ON public.contact_messages;
CREATE POLICY "contact_select_modify" ON public.contact_messages FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

-- 15. Settings
DROP POLICY IF EXISTS "settings_select" ON public.settings;
CREATE POLICY "settings_select" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "settings_admin_modify" ON public.settings;
CREATE POLICY "settings_admin_modify" ON public.settings FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

-- 16. Notifications & Audit Logs
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (user_id = auth.uid() OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (user_id = auth.uid() OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- 17. Success Stories
DROP POLICY IF EXISTS "success_stories_select" ON public.success_stories;
CREATE POLICY "success_stories_select" ON public.success_stories FOR SELECT USING (true);

DROP POLICY IF EXISTS "success_stories_admin_modify" ON public.success_stories;
CREATE POLICY "success_stories_admin_modify" ON public.success_stories FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

-- 18. Receipts
DROP POLICY IF EXISTS "receipts_select" ON public.receipts;
CREATE POLICY "receipts_select" ON public.receipts FOR SELECT USING (
    donation_id IN (
        SELECT id FROM public.donations 
        WHERE donor_id IN (
            SELECT id FROM public.donors 
            WHERE user_id = auth.uid() OR email = (SELECT email FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid())
        )
    ) OR public.is_admin() OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "receipts_insert_modify" ON public.receipts;
CREATE POLICY "receipts_insert_modify" ON public.receipts FOR ALL USING (public.is_admin() OR auth.role() = 'service_role');

--------------------------------------------------------------------------------
-- TRIGGER FOR AUTOMATIC USER PROFILES SYNCHRONIZATION FROM SUPABASE AUTH
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert or update in public.users profile table
  INSERT INTO public.users (id, auth_id, name, email, phone, role, status)
  VALUES (
    new.id,
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
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
      new.email,
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

-- Drop trigger if already exists then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

--------------------------------------------------------------------------------
-- SEED INITIAL CORE ADMINS AND DONORS (Run Once)
--------------------------------------------------------------------------------

-- Super Admin User
INSERT INTO public.users (id, name, email, phone, role, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'Super Admin User', 'admin@deivakaram.org', '+919876543210', 'super_admin', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.admin_users (id, permissions, status)
VALUES ('00000000-0000-0000-0000-000000000001', ARRAY['donations', 'donors', 'volunteers', 'beneficiaries', 'campaigns', 'events', 'content', 'reports', 'settings', 'admins', 'logs'], 'active')
ON CONFLICT (id) DO NOTHING;

-- Sub-Admin 1: Ramanathan K
INSERT INTO public.users (id, name, email, phone, role, status)
VALUES ('00000000-0000-0000-0000-000000000002', 'Ramanathan K', 'ramanathan@deivakaram.org', '+919876543211', 'sub_admin', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.admin_users (id, permissions, status)
VALUES ('00000000-0000-0000-0000-000000000002', ARRAY['donations', 'donors', 'volunteers', 'events'], 'active')
ON CONFLICT (id) DO NOTHING;

-- Sub-Admin 2: Meera S
INSERT INTO public.users (id, name, email, phone, role, status)
VALUES ('00000000-0000-0000-0000-000000000003', 'Meera S', 'meera@deivakaram.org', '+919876543212', 'sub_admin', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.admin_users (id, permissions, status)
VALUES ('00000000-0000-0000-0000-000000000003', ARRAY['beneficiaries', 'reports', 'content'], 'active')
ON CONFLICT (id) DO NOTHING;

-- Demo Donors
INSERT INTO public.users (id, name, email, phone, role, status)
VALUES ('00000000-0000-0000-0000-000000000004', 'Ananth Kumar', 'ananth@gmail.com', '+919876543213', 'donor', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.donors (id, user_id, name, email, phone, address, pan, donor_type)
VALUES ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'Ananth Kumar', 'ananth@gmail.com', '+919876543213', '14 Gandhipuram, Coimbatore', 'ABCDE1234F', 'Regular Donor')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.users (id, name, email, phone, role, status)
VALUES ('00000000-0000-0000-0000-000000000005', 'Deepa Lakshmi', 'deepa@gmail.com', '+919876543214', 'donor', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.donors (id, user_id, name, email, phone, address, pan, donor_type)
VALUES ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 'Deepa Lakshmi', 'deepa@gmail.com', '+919876543214', '22 Anna Nagar, Chennai', 'WXYZP9876Q', 'Major Donor')
ON CONFLICT (email) DO NOTHING;

-- Seed Default Packages
INSERT INTO public.packages (id, name, base_price, min_food_count, tagline, badge, icon, inclusions, note, is_active)
VALUES 
  ('birthday_anniversary', '1. Birthday / Anniversary Donation', 2500, 25, 'Starts from Rs. 2,500', 'Celebrate Life', 'cake', ARRAY['25 food meals - Rs. 70 each', '1 kg Cake - Rs. 550', 'Photo Banner - Rs. 150'], 'Celebrate your special milestones with those who need it most. We share food and joy in your name.', true),
  ('virtual_birthday', '2. Virtual Birthday Celebration', 3500, 20, 'Rs. 3,500', 'Interactive Meet', 'video', ARRAY['20 food meals for children', 'Cake', 'Chocolates & Juice', 'Festive items such as balloons and caps'], 'You can join a virtual meet and celebrate your special day with the children.', true),
  ('old_age_home', '3. Old Age Home Donation', 10000, 50, 'Total: Rs. 10,000', 'Senior Respect', 'elder', ARRAY['Food', 'Cake', 'Essential items for elders'], 'A meaningful way to share love, care and respect with senior citizens.', true),
  ('orphanage_home', '4. Orphanage Home Donation', 7500, 35, 'Total: Rs. 7,500', 'Brighten Childhood', 'child', ARRAY['Food', 'Cake', 'Essential items for children'], 'Make a special occasion brighter by sharing it with children in need.', true),
  ('feed_stray_animals', '5. Feed Stray Animals', 750, 25, 'Starts from Rs. 750', 'Compassion for All', 'animal', ARRAY['Minimum: 25 food portions', 'Rs. 30 per food portion', 'Minimum contribution for 25 portions - Rs. 750'], 'Help provide nourishment and care to animals in need.', true),
  ('general_custom', '6. General / Custom Contribution', 1000, 1, 'Flexible Amount', 'Where Most Needed', 'general', ARRAY['Disaster and emergency hospital relief', 'Daily Annadhanam free kitchen supplies', 'Elder medical aid and children education'], 'Support general operational relief funds where the urgent need is greatest.', true)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Addons
INSERT INTO public.addons (id, name, price, description, is_per_unit, is_active)
VALUES
  ('photo_cake', 'Photo Cake', 800, 'Photo Cake - Rs. 800', false, true),
  ('rose_milk', 'Rose Milk (10 glasses)', 150, 'Rose Milk - 10 glasses - Rs. 150', false, true),
  ('grocery_kit', 'Grocery Kit (1 family)', 500, 'Grocery Kit - 1 family - Rs. 500', false, true),
  ('stationery_kit', 'Stationery Kit', 25, 'Stationery Kit - Rs. 25 each', true, true)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Settings
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
ON CONFLICT (id) DO NOTHING;

-- Seed Default News
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

-- Seed Default Gallery Items
INSERT INTO public.gallery_items (title, category, media_type, url, thumbnail_url, google_drive_file_id, google_drive_folder_id, file_name, file_size)
VALUES
  ('Scholarship Presentation Chennai', 'Education', 'image', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=600', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=300', '1aBcDeFgHiJkLmNoPqRsTuVwXyZ01', '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs', 'scholarship_presentation_2026.jpg', 1420500),
  ('Eye Diagnostics Jawadhu Hills', 'Medical Camps', 'image', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=300', '1bBcDeFgHiJkLmNoPqRsTuVwXyZ02', '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs', 'eye_diagnostics_camp.jpg', 2180400),
  ('Annadanam Feeding Koyambedu', 'Food Distribution', 'image', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=300', '1cBcDeFgHiJkLmNoPqRsTuVwXyZ03', '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs', 'annadanam_koyambedu_feeding.jpg', 1890200)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- PROFILES TABLE SCHEMA (auth.users extension, RLS, and Auto-Create Trigger)
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_service_role" ON public.profiles;
CREATE POLICY "profiles_service_role" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

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

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();


