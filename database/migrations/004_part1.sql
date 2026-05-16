-- Migration Part 1: Add missing columns and create functions
-- Run this first in Supabase SQL Editor

-- 1. Add missing columns to existing tables
ALTER TABLE public.product_codes
ADD COLUMN IF NOT EXISTS used_at timestamp with time zone;

-- 2. Add missing columns to promo_codes table to match our expected schema
ALTER TABLE public.promo_codes
ADD COLUMN IF NOT EXISTS max_discount_amount numeric,
ADD COLUMN IF NOT EXISTS usage_limit integer,
ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 3. Create missing functions first
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Add updated_at trigger for promo_codes
DROP TRIGGER IF EXISTS update_promo_codes_updated_at ON public.promo_codes;
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Create atomic product code claiming function
CREATE OR REPLACE FUNCTION claim_product_codes_atomic(
  p_variant_id uuid,
  p_quantity integer,
  p_order_id uuid
) RETURNS text[] AS $$
DECLARE
  claimed_codes text[];
  code_record RECORD;
BEGIN
  -- Initialize array
  claimed_codes := ARRAY[]::text[];

  -- Use FOR UPDATE to lock rows and prevent race conditions
  FOR code_record IN
    SELECT id, code
    FROM public.product_codes
    WHERE variant_id = p_variant_id
      AND is_used = false
    ORDER BY created_at ASC
    LIMIT p_quantity
    FOR UPDATE SKIP LOCKED  -- Skip already locked rows (other concurrent transactions)
  LOOP
    -- Mark the code as used
    UPDATE public.product_codes
    SET
      is_used = true,
      order_id = p_order_id,
      used_at = timezone('utc'::text, now())
    WHERE id = code_record.id;

    -- Add to result array
    claimed_codes := array_append(claimed_codes, code_record.code);
  END LOOP;

  RETURN claimed_codes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create promo usage increment function
CREATE OR REPLACE FUNCTION increment_promo_usage(
  promo_id uuid
) RETURNS void AS $$
BEGIN
  UPDATE public.promo_codes
  SET usage_count = COALESCE(usage_count, 0) + 1,
      current_uses = COALESCE(current_uses, 0) + 1
  WHERE id = promo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create/update wallet functions to be more robust
CREATE OR REPLACE FUNCTION deduct_wallet_balance(
  user_id uuid,
  amount numeric
) RETURNS numeric AS $$
DECLARE
  current_bal numeric;
  new_bal numeric;
BEGIN
  -- Lock row to prevent race conditions
  SELECT wallet_balance INTO current_bal
  FROM public.users
  WHERE id = user_id
  FOR UPDATE;

  IF current_bal IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF current_bal < amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Current: %, Required: %', current_bal, amount;
  END IF;

  new_bal := current_bal - amount;

  UPDATE public.users
  SET
    wallet_balance = new_bal,
    updated_at = timezone('utc'::text, now())
  WHERE id = user_id;

  RETURN new_bal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create increment wallet function
CREATE OR REPLACE FUNCTION increment_wallet(
  p_user_id uuid,
  p_amount numeric
) RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET wallet_balance = wallet_balance + p_amount,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
