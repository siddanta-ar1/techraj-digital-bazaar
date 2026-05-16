-- Fix for missing 'khalti' in payment_method check constraints

-- 1. Update orders table constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check 
  CHECK (payment_method = ANY (ARRAY['wallet'::text, 'esewa'::text, 'khalti'::text, 'bank_transfer'::text]));

-- 2. Update topup_requests table constraint
ALTER TABLE public.topup_requests DROP CONSTRAINT IF EXISTS topup_requests_payment_method_check;
ALTER TABLE public.topup_requests ADD CONSTRAINT topup_requests_payment_method_check 
  CHECK (payment_method = ANY (ARRAY['esewa'::text, 'khalti'::text, 'bank_transfer'::text]));
