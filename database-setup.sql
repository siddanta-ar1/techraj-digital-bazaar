-- 1. EXTENSIONS
-- Required for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & TYPES
-- (Optionally, we can define enums here if we wanted to replace the text checks,
-- but we will stick to your text constraints for compatibility with existing code)

-- 3. TABLES

CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  parent_id uuid,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id)
);

CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category_id uuid,
  featured_image text,
  gallery_images ARRAY DEFAULT '{}'::text[],
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  has_variants boolean DEFAULT false,
  requires_manual_delivery boolean DEFAULT false,
  delivery_instructions text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);

CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid,
  variant_name text NOT NULL,
  price numeric NOT NULL,
  original_price numeric,
  sku text,
  stock_type text DEFAULT 'unlimited'::text CHECK (stock_type = ANY (ARRAY['limited'::text, 'unlimited'::text, 'codes'::text])),
  stock_quantity integer DEFAULT 0,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT product_variants_pkey PRIMARY KEY (id),
  CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  phone text,
  wallet_balance numeric DEFAULT 0.00,
  role text DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'admin'::text])),
  referral_code text UNIQUE,
  referred_by uuid,
  email_verified boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT users_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.users(id)
);

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_number text NOT NULL UNIQUE,
  user_id uuid,
  total_amount numeric NOT NULL,
  discount_amount numeric DEFAULT 0.00,
  final_amount numeric NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'cancelled'::text, 'refunded'::text])),
  payment_method text CHECK (payment_method = ANY (ARRAY['wallet'::text, 'esewa'::text, 'bank_transfer'::text])),
  payment_status text DEFAULT 'pending'::text CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text])),
  payment_screenshot_url text,
  delivery_type text DEFAULT 'auto'::text CHECK (delivery_type = ANY (ARRAY['auto'::text, 'manual'::text])),
  delivery_details jsonb DEFAULT '{}'::jsonb,
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  variant_id uuid,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  delivered_code text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'delivered'::text, 'refunded'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);

CREATE TABLE public.product_codes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  variant_id uuid,
  code text NOT NULL,
  is_used boolean DEFAULT false,
  order_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT product_codes_pkey PRIMARY KEY (id),
  CONSTRAINT product_codes_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);

CREATE TABLE public.site_settings (
  key text NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT site_settings_pkey PRIMARY KEY (key)
);

CREATE TABLE public.topup_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  amount numeric NOT NULL,
  payment_method text CHECK (payment_method = ANY (ARRAY['esewa'::text, 'bank_transfer'::text])),
  transaction_id text,
  screenshot_url text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT topup_requests_pkey PRIMARY KEY (id),
  CONSTRAINT topup_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.wallet_transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  amount numeric NOT NULL,
  type text CHECK (type = ANY (ARRAY['credit'::text, 'debit'::text])),
  transaction_type text CHECK (transaction_type = ANY (ARRAY['topup'::text, 'purchase'::text, 'refund'::text, 'commission'::text])),
  reference_id uuid,
  description text,
  balance_after numeric NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- 4. FUNCTIONS & TRIGGERS

-- Function to auto-update 'updated_at' columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_topup_requests_updated_at BEFORE UPDATE ON public.topup_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- CRITICAL: Wallet Security Functions (Prevents Race Conditions)
-- Function to safely deduct balance
CREATE OR REPLACE FUNCTION deduct_wallet_balance(
  user_id uuid,
  amount numeric
) RETURNS numeric AS $$
DECLARE
  current_bal numeric;
  new_bal numeric;
BEGIN
  -- Lock row
  SELECT wallet_balance INTO current_bal FROM public.users WHERE id = user_id FOR UPDATE;

  IF current_bal < amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  new_bal := current_bal - amount;

  UPDATE public.users SET wallet_balance = new_bal, updated_at = now() WHERE id = user_id;

  RETURN new_bal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment balance (for refunds/topups)
CREATE OR REPLACE FUNCTION increment_wallet(
  p_user_id uuid,
  p_amount numeric
) RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET wallet_balance = wallet_balance + p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- CATEGORIES: Public Read, Admin All
CREATE POLICY "Public read active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- PRODUCTS: Public Read, Admin All
CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- PRODUCT VARIANTS: Public Read, Admin All
CREATE POLICY "Public read active variants" ON public.product_variants FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access variants" ON public.product_variants FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- USERS: Read/Update Own, Admin Read All
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
-- Allow Auth service to create new users trigger
CREATE POLICY "Allow insert for auth users" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- ORDERS: Read/Create Own, Admin All
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- ORDER ITEMS: Read/Create Own (via Order), Admin View
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Users can insert own order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- PRODUCT CODES: Admin View Unused, User View Delivered
CREATE POLICY "Admins view unused codes" ON public.product_codes FOR SELECT USING (
  (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')) AND is_used = false
);
CREATE POLICY "Users view delivered codes" ON public.product_codes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.delivered_code = product_codes.code  -- Assuming delivered_code stores the actual code string, if it stores UUID change to product_codes.id::text
    AND o.user_id = auth.uid()
  )
);

-- SITE SETTINGS: Public Read, Admin All
CREATE POLICY "Public read settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins all settings" ON public.site_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- TOPUP REQUESTS: User View/Create Own, Admin All
CREATE POLICY "Users view own topups" ON public.topup_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own topups" ON public.topup_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all topups" ON public.topup_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Admins update topups" ON public.topup_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- WALLET TRANSACTIONS: User View Own, Admin View All
CREATE POLICY "Users view own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
-- Note: Insert is handled by server-side logic usually, but if needed for client:
CREATE POLICY "Users insert own transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all transactions" ON public.wallet_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
