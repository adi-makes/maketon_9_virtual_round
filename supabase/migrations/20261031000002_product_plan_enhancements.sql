-- ==============================================================================
-- SubscriptIQ — Phase 3: Product & Plan Lifecycle Enhancements Migration
-- ==============================================================================

-- 1. Extend products table with type and cost_price
ALTER TABLE public.products 
    ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'service' 
    CHECK (type IN ('service', 'goods', 'consumable'));

ALTER TABLE public.products 
    ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) NOT NULL DEFAULT 0.00 
    CHECK (cost_price >= 0);

-- 2. Extend plans table billing_frequency constraint to support daily and weekly
ALTER TABLE public.plans 
    DROP CONSTRAINT IF EXISTS plans_billing_frequency_check;

ALTER TABLE public.plans 
    ADD CONSTRAINT plans_billing_frequency_check 
    CHECK (billing_frequency IN ('daily', 'weekly', 'monthly', 'yearly'));

-- 3. Extend plans table with minimum quantity, availability dates, and permission flags
ALTER TABLE public.plans 
    ADD COLUMN IF NOT EXISTS minimum_quantity INTEGER NOT NULL DEFAULT 1 
    CHECK (minimum_quantity > 0);

ALTER TABLE public.plans 
    ADD COLUMN IF NOT EXISTS availability_start TIMESTAMPTZ;

ALTER TABLE public.plans 
    ADD COLUMN IF NOT EXISTS availability_end TIMESTAMPTZ;

ALTER TABLE public.plans 
    ADD COLUMN IF NOT EXISTS auto_close_after_expiry BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.plans 
    ADD COLUMN IF NOT EXISTS allow_early_closure BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.plans 
    ADD COLUMN IF NOT EXISTS allow_pausing BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.plans 
    ADD COLUMN IF NOT EXISTS allow_renewal BOOLEAN NOT NULL DEFAULT true;
