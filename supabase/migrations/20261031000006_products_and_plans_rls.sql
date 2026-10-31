-- ==============================================================================
-- SubscriptIQ — Migration: Products, Variants, and Plans RLS Policies
-- ==============================================================================

-- 1. Full access for Admins and Staff to Products
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Admins and Staff have full access to products'
    ) THEN
        CREATE POLICY "Admins and Staff have full access to products" ON public.products
            FOR ALL USING (public.get_auth_role() IN ('admin', 'staff'));
    END IF;

    -- 2. Full access for Admins and Staff to Product Variants
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'product_variants' AND policyname = 'Admins and Staff have full access to product_variants'
    ) THEN
        CREATE POLICY "Admins and Staff have full access to product_variants" ON public.product_variants
            FOR ALL USING (public.get_auth_role() IN ('admin', 'staff'));
    END IF;

    -- 3. Full access for Admins and Staff to Plans
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'plans' AND policyname = 'Admins and Staff have full access to plans'
    ) THEN
        CREATE POLICY "Admins and Staff have full access to plans" ON public.plans
            FOR ALL USING (public.get_auth_role() IN ('admin', 'staff'));
    END IF;
END $$;
