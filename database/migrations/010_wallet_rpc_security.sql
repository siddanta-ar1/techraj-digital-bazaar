-- Secure wallet/inventory RPC functions and add missing decrement_promo_usage.
--
-- Problem 1: increment_wallet, deduct_wallet_balance, claim_product_codes_atomic,
-- and increment_promo_usage were granted to the 'authenticated' role, meaning any
-- logged-in user could call them directly from the browser (e.g. via Supabase JS
-- client) to inflate their own wallet balance or drain another user's wallet.
-- Fix: revoke from authenticated, restrict to service_role only.
--
-- Problem 2: decrement_promo_usage was called in orders/create as a rollback but
-- was never defined, so every order-failure rollback silently logged an error and
-- left the promo usage_count permanently incremented.

-- 1. Revoke financial/inventory functions from authenticated users
REVOKE EXECUTE ON FUNCTION public.deduct_wallet_balance(uuid, numeric) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_wallet(uuid, numeric) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_product_codes_atomic(uuid, integer, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_promo_usage(uuid) FROM authenticated;

-- 2. Ensure service_role can still call them (it can by default, but be explicit)
GRANT EXECUTE ON FUNCTION public.deduct_wallet_balance(uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_wallet(uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_product_codes_atomic(uuid, integer, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_promo_usage(uuid) TO service_role;

-- 3. Create the missing decrement_promo_usage function
CREATE OR REPLACE FUNCTION public.decrement_promo_usage(promo_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.promo_codes
  SET usage_count = GREATEST(COALESCE(usage_count, 0) - 1, 0)
  WHERE id = promo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.decrement_promo_usage(uuid) TO service_role;
