-- ==============================================================================
-- Migration: Discount Usage Limits
-- Adds max_redemptions and times_redeemed for concurrency-safe usage capping.
-- ==============================================================================

-- Add max_redemptions: NULL means unlimited, a positive integer caps redemptions.
ALTER TABLE public.discounts
  ADD COLUMN IF NOT EXISTS max_redemptions INTEGER DEFAULT NULL CHECK (max_redemptions IS NULL OR max_redemptions > 0);

-- Add times_redeemed: monotonically increasing counter, enforced atomically.
ALTER TABLE public.discounts
  ADD COLUMN IF NOT EXISTS times_redeemed INTEGER NOT NULL DEFAULT 0 CHECK (times_redeemed >= 0);

-- Index on active discount codes for fast lookups during validation
CREATE INDEX IF NOT EXISTS idx_discounts_code_active
  ON public.discounts (code)
  WHERE is_active = true;

-- ==============================================================================
-- Atomic redemption function
-- Uses UPDATE ... WHERE times_redeemed < max_redemptions RETURNING to safely
-- increment the counter and reject concurrent over-limit redemptions.
-- Returns true if the redemption slot was claimed, false if limit is exhausted.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.claim_discount_redemption(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_max INTEGER;
  v_redeemed INTEGER;
  v_updated UUID;
BEGIN
  -- Lock the row for this discount code
  SELECT id, max_redemptions, times_redeemed
    INTO v_id, v_max, v_redeemed
    FROM public.discounts
   WHERE code = p_code AND is_active = true
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- If max_redemptions is NULL, unlimited — just increment
  IF v_max IS NULL THEN
    UPDATE public.discounts
       SET times_redeemed = times_redeemed + 1,
           updated_at     = now()
     WHERE id = v_id
    RETURNING id INTO v_updated;
    RETURN v_updated IS NOT NULL;
  END IF;

  -- Enforce the cap atomically
  IF v_redeemed >= v_max THEN
    RETURN FALSE;
  END IF;

  UPDATE public.discounts
     SET times_redeemed = times_redeemed + 1,
         updated_at     = now()
   WHERE id = v_id
     AND times_redeemed < max_redemptions   -- re-check inside transaction
  RETURNING id INTO v_updated;

  RETURN v_updated IS NOT NULL;
END;
$$;

-- Grant execute to authenticated users so server actions can call it
GRANT EXECUTE ON FUNCTION public.claim_discount_redemption(TEXT) TO authenticated;

COMMENT ON COLUMN public.discounts.max_redemptions IS
  'Maximum number of times this code can be redeemed. NULL means unlimited.';
COMMENT ON COLUMN public.discounts.times_redeemed IS
  'Monotonically increasing count of successful redemptions. Updated atomically by claim_discount_redemption().';
