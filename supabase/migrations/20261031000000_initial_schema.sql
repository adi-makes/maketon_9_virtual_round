-- SubscriptIQ — Subscription Management System
-- Initial PostgreSQL Starter Migration (All 12 Core Tables, Constraints & Baseline RLS)

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. CUSTOMERS TABLE (Must precede profiles and subscriptions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    company_name TEXT,
    billing_address JSONB DEFAULT '{}'::jsonb,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 2. USER PROFILES TABLE (Extends Supabase auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'staff', 'customer')),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. PRODUCTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (base_price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 4. PRODUCT VARIANTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_adjustment NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    sku TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 5. PLANS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    billing_frequency TEXT NOT NULL CHECK (billing_frequency IN ('monthly', 'yearly')),
    interval_count INTEGER NOT NULL DEFAULT 1 CHECK (interval_count > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 6. SUBSCRIPTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'quotation', 'confirmed', 'active', 'paused', 'closed')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 7. SUBSCRIPTION ITEMS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 8. INVOICES TABLE (Includes duplicate billing protection)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    billing_period_start TIMESTAMPTZ NOT NULL,
    billing_period_end TIMESTAMPTZ NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    outstanding_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (outstanding_balance >= 0),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'partially_paid', 'paid', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Prevent duplicate billing runs for identical period
    CONSTRAINT unique_subscription_billing_period UNIQUE (subscription_id, billing_period_start, billing_period_end)
);

-- ==============================================================================
-- 9. INVOICE ITEMS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 10. PAYMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number TEXT NOT NULL UNIQUE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    method TEXT NOT NULL CHECK (method IN ('manual_entry', 'bank_transfer', 'stripe', 'razorpay')),
    reference TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 11. DISCOUNTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_percent NUMERIC(5,2) CHECK (discount_percent >= 0 AND discount_percent <= 100),
    fixed_amount NUMERIC(12,2) CHECK (fixed_amount >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 12. TAX RULES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    rate_percent NUMERIC(5,2) NOT NULL DEFAULT 18.00 CHECK (rate_percent >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;

-- Helper function to extract user role from profiles
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Public/Catalog Read access
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view variants" ON public.product_variants
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view active plans" ON public.plans
    FOR SELECT USING (is_active = true);

-- Admin & Staff Full Access Policy
CREATE POLICY "Admins and Staff have full access to customers" ON public.customers
    FOR ALL USING (public.get_auth_role() IN ('admin', 'staff'));

CREATE POLICY "Admins and Staff have full access to subscriptions" ON public.subscriptions
    FOR ALL USING (public.get_auth_role() IN ('admin', 'staff'));

CREATE POLICY "Admins and Staff have full access to invoices" ON public.invoices
    FOR ALL USING (public.get_auth_role() IN ('admin', 'staff'));

CREATE POLICY "Admins and Staff have full access to payments" ON public.payments
    FOR ALL USING (public.get_auth_role() IN ('admin', 'staff'));

-- Customer Isolated Access (Only see their own organization records)
CREATE POLICY "Customers view own customer record" ON public.customers
    FOR SELECT USING (
        id IN (SELECT customer_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Customers view own subscriptions" ON public.subscriptions
    FOR SELECT USING (
        customer_id IN (SELECT customer_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Customers view own invoices" ON public.invoices
    FOR SELECT USING (
        customer_id IN (SELECT customer_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Customers view own payments" ON public.payments
    FOR SELECT USING (
        customer_id IN (SELECT customer_id FROM public.profiles WHERE id = auth.uid())
    );
