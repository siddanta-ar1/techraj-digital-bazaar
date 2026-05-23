-- Extend wallet_transactions transaction_type constraint to allow admin_adjustment.
-- The original constraint only allowed: topup, purchase, refund, commission.
-- Admin wallet credit/debit operations use 'admin_adjustment' which violated the check.

ALTER TABLE public.wallet_transactions
  DROP CONSTRAINT IF EXISTS wallet_transactions_transaction_type_check;

ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_transaction_type_check
  CHECK (transaction_type = ANY (ARRAY[
    'topup'::text,
    'purchase'::text,
    'refund'::text,
    'commission'::text,
    'admin_adjustment'::text
  ]));
