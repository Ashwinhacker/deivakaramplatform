-- =============================================================================
-- DEIVAKARAM CHARITABLE TRUST - PRODUCTION DATABASE UPGRADE
-- Migration: 20261011_production_backend_and_payments.sql
-- Description: Adds payment_orders & webhook_events tables, indexes, constraints,
--              and production-grade Row Level Security (RLS) policies.
-- 
-- NOTE FOR NEW PROJECTS:
-- If setting up a fresh Supabase database from scratch, run `supabase/schema.sql`!
-- `schema.sql` creates all 22 tables, policies, functions, triggers, and seed data.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure core prerequisite tables exist if running on a fresh database
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

CREATE TABLE IF NOT EXISTS public.donors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    pan TEXT,
    donor_type TEXT DEFAULT 'New Donor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 1. PAYMENT ORDERS TABLE
-- Tracks authoritative Razorpay orders created server-side before checkout
-- -----------------------------------------------------------------------------
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

-- Index for quick lookups during signature verification & webhooks
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id ON public.payment_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_donor_id ON public.payment_orders(donor_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON public.payment_orders(status);

-- -----------------------------------------------------------------------------
-- 2. WEBHOOK EVENTS TABLE
-- Guarantees idempotent webhook processing and auditability
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT UNIQUE NOT NULL, -- Razorpay event ID (x-razorpay-event-id or payload id)
    event_type TEXT NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);

-- -----------------------------------------------------------------------------
-- 3. ENSURE ALL TABLES HAVE REQUIRED COLUMNS AND CONSTRAINTS
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    -- Ensure celebration_bookings has razorpay_order_id and payment_status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'celebration_bookings' AND column_name = 'razorpay_order_id'
    ) THEN
        ALTER TABLE public.celebration_bookings ADD COLUMN razorpay_order_id TEXT;
    END IF;

    -- Ensure donations has plan and razorpay_order_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'donations' AND column_name = 'razorpay_order_id'
    ) THEN
        ALTER TABLE public.donations ADD COLUMN razorpay_order_id TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'donations' AND column_name = 'plan'
    ) THEN
        ALTER TABLE public.donations ADD COLUMN plan TEXT DEFAULT 'One-Time Contribution';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4. HELPER FUNCTION: CHECK IF CURRENT USER IS ADMIN
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 5. PRODUCTION ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

-- Enable RLS on all tables
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

-- DROP permissive existing policies if re-running
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- A. USERS POLICIES
-- Users can view their own profile, admins can view all profiles
CREATE POLICY "users_select" ON public.users 
    FOR SELECT USING (
        auth_id = auth.uid() 
        OR id = auth.uid() 
        OR public.is_admin()
        OR auth.role() = 'service_role'
    );

-- User can update own profile, admins can update any
CREATE POLICY "users_update" ON public.users 
    FOR UPDATE USING (
        auth_id = auth.uid() 
        OR id = auth.uid() 
        OR public.is_admin()
        OR auth.role() = 'service_role'
    );

-- Insert allowed for registration and service role
CREATE POLICY "users_insert" ON public.users 
    FOR INSERT WITH CHECK (
        auth_id = auth.uid() 
        OR id = auth.uid() 
        OR public.is_admin()
        OR auth.role() = 'service_role'
    );

-- Only super admin or service role can delete users
CREATE POLICY "users_delete" ON public.users 
    FOR DELETE USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

-- B. ADMIN_USERS POLICIES
CREATE POLICY "admin_users_select" ON public.admin_users 
    FOR SELECT USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "admin_users_modify" ON public.admin_users 
    FOR ALL USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

-- C. DONORS POLICIES
-- Donors can read own record, admins can read all
CREATE POLICY "donors_select" ON public.donors 
    FOR SELECT USING (
        user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid())
        OR email = (SELECT email FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid())
        OR public.is_admin()
        OR auth.role() = 'service_role'
    );

-- Anyone can register as a donor or create donor record on checkout
CREATE POLICY "donors_insert" ON public.donors 
    FOR INSERT WITH CHECK (true);

-- Donors can update own info, admins can update all
CREATE POLICY "donors_update" ON public.donors 
    FOR UPDATE USING (
        user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid())
        OR email = (SELECT email FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid())
        OR public.is_admin()
        OR auth.role() = 'service_role'
    );

-- D. DONATIONS POLICIES
-- Donors see own donations; public sees non-anonymous donations summary; admins see all
CREATE POLICY "donations_select" ON public.donations 
    FOR SELECT USING (
        donor_id IN (SELECT id FROM public.donors WHERE user_id = auth.uid() OR email = (SELECT email FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid()))
        OR public.is_admin()
        OR auth.role() = 'service_role'
        OR is_anonymous = false
    );

-- Anyone can submit a donation
CREATE POLICY "donations_insert" ON public.donations 
    FOR INSERT WITH CHECK (true);

-- Only admins and service role can update donation statuses
CREATE POLICY "donations_update" ON public.donations 
    FOR UPDATE USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

-- E. PAYMENT_ORDERS POLICIES
-- Donor or user can see own orders; admins see all
CREATE POLICY "payment_orders_select" ON public.payment_orders 
    FOR SELECT USING (
        user_id = auth.uid()
        OR public.is_admin()
        OR auth.role() = 'service_role'
    );

-- Anyone initiating payment or service role can insert
CREATE POLICY "payment_orders_insert" ON public.payment_orders 
    FOR INSERT WITH CHECK (true);

-- Only backend service role or admin can update order status
CREATE POLICY "payment_orders_update" ON public.payment_orders 
    FOR UPDATE USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

-- F. WEBHOOK_EVENTS POLICIES
-- Restricted to backend service role and admins
CREATE POLICY "webhook_events_all" ON public.webhook_events 
    FOR ALL USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

-- G. CELEBRATION_BOOKINGS POLICIES
CREATE POLICY "celebration_bookings_select" ON public.celebration_bookings 
    FOR SELECT USING (
        donor_id IN (SELECT id FROM public.donors WHERE user_id = auth.uid() OR email = (SELECT email FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid()))
        OR customer_email = (SELECT email FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid())
        OR public.is_admin()
        OR auth.role() = 'service_role'
    );

CREATE POLICY "celebration_bookings_insert" ON public.celebration_bookings 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "celebration_bookings_update" ON public.celebration_bookings 
    FOR UPDATE USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "celebration_bookings_delete" ON public.celebration_bookings 
    FOR DELETE USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

-- H. CAMPAIGNS POLICIES
-- Public can view active campaigns, admins can view all
CREATE POLICY "campaigns_select" ON public.campaigns 
    FOR SELECT USING (
        status = 'active' 
        OR public.is_admin() 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "campaigns_admin_modify" ON public.campaigns 
    FOR ALL USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

-- I. PACKAGES & ADDONS POLICIES
CREATE POLICY "packages_select" ON public.packages 
    FOR SELECT USING (
        is_active = true 
        OR public.is_admin() 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "packages_admin_modify" ON public.packages 
    FOR ALL USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "addons_select" ON public.addons 
    FOR SELECT USING (
        is_active = true 
        OR public.is_admin() 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "addons_admin_modify" ON public.addons 
    FOR ALL USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

-- J. NEWS POLICIES
CREATE POLICY "news_select" ON public.news 
    FOR SELECT USING (
        status = 'published' 
        OR public.is_admin() 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "news_admin_modify" ON public.news 
    FOR ALL USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

-- K. GALLERY ITEMS POLICIES
CREATE POLICY "gallery_select" ON public.gallery_items 
    FOR SELECT USING (true);

CREATE POLICY "gallery_admin_modify" ON public.gallery_items 
    FOR ALL USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

-- L. EVENTS POLICIES
CREATE POLICY "events_select" ON public.events 
    FOR SELECT USING (true);

CREATE POLICY "events_admin_modify" ON public.events 
    FOR ALL USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

-- M. VOLUNTEERS POLICIES
-- Anyone can submit volunteer application
CREATE POLICY "volunteers_insert" ON public.volunteers 
    FOR INSERT WITH CHECK (true);

-- Only admins or user themselves can view volunteer records
CREATE POLICY "volunteers_select" ON public.volunteers 
    FOR SELECT USING (
        user_id = auth.uid()
        OR email = (SELECT email FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid())
        OR public.is_admin()
        OR auth.role() = 'service_role'
    );

CREATE POLICY "volunteers_modify" ON public.volunteers 
    FOR ALL USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

-- N. BENEFICIARIES & ASSISTANCE RECORDS
CREATE POLICY "beneficiaries_insert" ON public.beneficiaries 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "beneficiaries_select" ON public.beneficiaries 
    FOR SELECT USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "beneficiaries_modify" ON public.beneficiaries 
    FOR ALL USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "assistance_records_all" ON public.assistance_records 
    FOR ALL USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

-- O. CONTACT MESSAGES
CREATE POLICY "contact_insert" ON public.contact_messages 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "contact_select_modify" ON public.contact_messages 
    FOR ALL USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

-- P. SETTINGS
-- Public can read org settings (contact, address, UPI ID), but only admin can modify
CREATE POLICY "settings_select" ON public.settings 
    FOR SELECT USING (true);

CREATE POLICY "settings_admin_modify" ON public.settings 
    FOR ALL USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

-- Q. NOTIFICATIONS & AUDIT LOGS
CREATE POLICY "notifications_select" ON public.notifications 
    FOR SELECT USING (
        user_id = auth.uid() 
        OR public.is_admin() 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "notifications_update" ON public.notifications 
    FOR UPDATE USING (
        user_id = auth.uid() 
        OR public.is_admin() 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "notifications_insert" ON public.notifications 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "audit_logs_select" ON public.audit_logs 
    FOR SELECT USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "audit_logs_insert" ON public.audit_logs 
    FOR INSERT WITH CHECK (true);

-- R. SUCCESS STORIES
CREATE POLICY "success_stories_select" ON public.success_stories 
    FOR SELECT USING (true);

CREATE POLICY "success_stories_admin_modify" ON public.success_stories 
    FOR ALL USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );

-- R. RECEIPTS
CREATE POLICY "receipts_select" ON public.receipts 
    FOR SELECT USING (
        donation_id IN (
            SELECT id FROM public.donations 
            WHERE donor_id IN (
                SELECT id FROM public.donors 
                WHERE user_id = auth.uid() 
                   OR email = (SELECT email FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid())
            )
        )
        OR public.is_admin()
        OR auth.role() = 'service_role'
    );

CREATE POLICY "receipts_insert_modify" ON public.receipts 
    FOR ALL USING (
        public.is_admin() 
        OR auth.role() = 'service_role'
    );
