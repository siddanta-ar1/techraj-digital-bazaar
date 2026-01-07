-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

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
