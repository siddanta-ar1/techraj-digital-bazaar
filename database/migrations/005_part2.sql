-- Migration Part 2: Add indexes and constraints
-- Run this after Part 1 in Supabase SQL Editor

-- 1. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_product_codes_variant_unused
ON public.product_codes (variant_id, is_used, created_at)
WHERE is_used = false;

CREATE INDEX IF NOT EXISTS idx_promo_codes_active_code
ON public.promo_codes (code, is_active)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_orders_user_created
ON public.orders (user_id, created_at DESC);

-- 2. Add constraints to prevent negative values (with error handling)
DO $$
BEGIN
    -- Add wallet balance constraint
    BEGIN
        ALTER TABLE public.users
        ADD CONSTRAINT check_wallet_balance_non_negative
        CHECK (wallet_balance >= 0);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    -- Add discount value constraint
    BEGIN
        ALTER TABLE public.promo_codes
        ADD CONSTRAINT check_discount_value_positive
        CHECK (discount_value > 0);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    -- Add usage count constraint
    BEGIN
        ALTER TABLE public.promo_codes
        ADD CONSTRAINT check_usage_count_non_negative
        CHECK (usage_count >= 0);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 3. Insert sample promo codes for testing (optional)
INSERT INTO public.promo_codes (code, discount_type, discount_value, min_order_amount, is_active)
VALUES
  ('WELCOME10', 'percentage', 10, 100, true),
  ('SAVE50', 'fixed', 50, 200, true)
ON CONFLICT (code) DO NOTHING;

-- Migration Part 2 completed successfully!
-- Next: Run migration-part3.sql for policies
