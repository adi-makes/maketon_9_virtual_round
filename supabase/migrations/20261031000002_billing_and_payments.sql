-- SubscriptIQ — Billing & Payment System Migration
-- Maintained by Member 3 (Financial & Invoicing Engine Lead)
--
-- 1. Sequences for safe, monotonic invoice & payment numbering
-- 2. Missing RLS policies for invoice_items, discounts, and tax_rules
-- 3. Atomic stored procedures for invoice creation and payment processing

-- ==============================================================================
-- 1. NUMBERING SEQUENCES
-- ==============================================================================
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS public.payment_number_seq START WITH 1001;

-- Function to generate next formatted invoice number (e.g. INV-2026-001001)
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    year_str TEXT;
BEGIN
    next_val := nextval('public.invoice_number_seq');
    year_str := to_char(CURRENT_DATE, 'YYYY');
    RETURN 'INV-' || year_str || '-' || lpad(next_val::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate next formatted payment number (e.g. PAY-2026-001001)
CREATE OR REPLACE FUNCTION public.generate_payment_number()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    year_str TEXT;
BEGIN
    next_val := nextval('public.payment_number_seq');
    year_str := to_char(CURRENT_DATE, 'YYYY');
    RETURN 'PAY-' || year_str || '-' || lpad(next_val::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES FOR ITEMS, DISCOUNTS & TAXES
-- ==============================================================================

-- Policies for invoice_items
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'invoice_items' AND policyname = 'Admins and Staff have full access to invoice_items'
    ) THEN
        CREATE POLICY "Admins and Staff have full access to invoice_items" ON public.invoice_items
            FOR ALL USING (public.get_auth_role() IN ('admin', 'staff'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'invoice_items' AND policyname = 'Customers view own invoice_items'
    ) THEN
        CREATE POLICY "Customers view own invoice_items" ON public.invoice_items
            FOR SELECT USING (
                invoice_id IN (
                    SELECT id FROM public.invoices WHERE customer_id IN (
                        SELECT customer_id FROM public.profiles WHERE id = auth.uid()
                    )
                )
            );
    END IF;
END $$;

-- Policies for discounts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'discounts' AND policyname = 'Admins and Staff have full access to discounts'
    ) THEN
        CREATE POLICY "Admins and Staff have full access to discounts" ON public.discounts
            FOR ALL USING (public.get_auth_role() IN ('admin', 'staff'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'discounts' AND policyname = 'Anyone can view active discounts'
    ) THEN
        CREATE POLICY "Anyone can view active discounts" ON public.discounts
            FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- Policies for tax_rules
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tax_rules' AND policyname = 'Admins and Staff have full access to tax_rules'
    ) THEN
        CREATE POLICY "Admins and Staff have full access to tax_rules" ON public.tax_rules
            FOR ALL USING (public.get_auth_role() IN ('admin', 'staff'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tax_rules' AND policyname = 'Anyone can view active tax_rules'
    ) THEN
        CREATE POLICY "Anyone can view active tax_rules" ON public.tax_rules
            FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- ==============================================================================
-- 3. ATOMIC PAYMENT RECORDING WITH ROW LOCKING (Prevents Overpayments)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.record_invoice_payment(
    p_invoice_id UUID,
    p_amount NUMERIC(12,2),
    p_method TEXT,
    p_reference TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_invoice public.invoices%ROWTYPE;
    v_new_paid NUMERIC(12,2);
    v_new_balance NUMERIC(12,2);
    v_new_status TEXT;
    v_payment_number TEXT;
    v_payment_id UUID;
BEGIN
    -- 1. Validate payment amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero.';
    END IF;

    -- 2. Lock invoice row to prevent concurrent race condition overpayments
    SELECT * INTO v_invoice
    FROM public.invoices
    WHERE id = p_invoice_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice with ID % does not exist.', p_invoice_id;
    END IF;

    IF v_invoice.status = 'cancelled' THEN
        RAISE EXCEPTION 'Cannot record payment for a cancelled invoice.';
    END IF;

    IF v_invoice.outstanding_balance <= 0 THEN
        RAISE EXCEPTION 'Invoice is already settled in full.';
    END IF;

    IF p_amount > v_invoice.outstanding_balance THEN
        RAISE EXCEPTION 'Payment amount (%) exceeds outstanding balance (%). Overpayment rejected.',
            p_amount, v_invoice.outstanding_balance;
    END IF;

    -- 3. Calculate new financial balance
    v_new_paid := v_invoice.paid_amount + p_amount;
    v_new_balance := GREATEST(0.00, v_invoice.total_amount - v_new_paid);
    
    IF v_new_balance = 0.00 THEN
        v_new_status := 'paid';
    ELSE
        v_new_status := 'partially_paid';
    END IF;

    -- 4. Generate unique payment number
    v_payment_number := public.generate_payment_number();

    -- 5. Insert payment record
    INSERT INTO public.payments (
        payment_number,
        invoice_id,
        customer_id,
        amount,
        method,
        reference,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_payment_number,
        v_invoice.id,
        v_invoice.customer_id,
        p_amount,
        p_method,
        p_reference,
        'completed',
        now(),
        now()
    ) RETURNING id INTO v_payment_id;

    -- 6. Update invoice snapshot atomically
    UPDATE public.invoices
    SET
        paid_amount = v_new_paid,
        outstanding_balance = v_new_balance,
        status = v_new_status,
        updated_at = now()
    WHERE id = v_invoice.id;

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'payment_number', v_payment_number,
        'paid_amount', v_new_paid,
        'outstanding_balance', v_new_balance,
        'status', v_new_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
