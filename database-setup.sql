-- ============================================
-- TECHRAJ DIGITAL BAZAR - DATABASE SETUP
-- ============================================

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Tables (if they don't exist)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.users(id),
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    parent_id UUID REFERENCES public.categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id),
    featured_image TEXT,
    gallery_images TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    has_variants BOOLEAN DEFAULT false,
    requires_manual_delivery BOOLEAN DEFAULT false,
    delivery_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    sku TEXT,
    stock_type TEXT DEFAULT 'unlimited' CHECK (stock_type IN ('limited', 'unlimited', 'codes')),
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ... (Add other tables from your schema: orders, order_items, etc.)

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Insert Categories
INSERT INTO public.categories (id, name, slug, description, icon, sort_order, is_active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Game Top-ups', 'game-top-ups', 'In-game currency and items for popular games', '🎮', 1, true),
    ('22222222-2222-2222-2222-222222222222', 'Gift Cards', 'gift-cards', 'Digital gift cards for international platforms', '🎁', 2, true),
    ('33333333-3333-3333-3333-333333333333', 'VPN Services', 'vpn-services', 'Secure and fast VPN subscriptions', '🛡️', 3, true),
    ('44444444-4444-4444-4444-444444444444', 'Software & Tools', 'software-tools', 'Premium software licenses and tools', '💻', 4, true),
    ('55555555-5555-5555-5555-555555555555', 'Subscriptions', 'subscriptions', 'Digital service subscriptions', '📱', 5, true)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

-- Insert Sample Products
INSERT INTO public.products (id, name, slug, description, category_id, featured_image, is_featured, has_variants, is_active) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Free Fire Diamonds', 'free-fire-diamonds', 'Official Free Fire diamonds for in-game purchases. Instant delivery to your email.', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1618331833071-1c0c6ee3d19e?w=800&h=600&fit=crop', true, true, true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PUBG Mobile UC', 'pubg-mobile-uc', 'Get PUBG Mobile Unknown Cash (UC) instantly. Top up your account and unlock premium items.', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop', true, true, true),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Mobile Legends Diamonds', 'mobile-legends-diamonds', 'Mobile Legends diamonds for heroes, skins, and battle passes.', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=600&fit=crop', false, true, true),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Netflix Gift Card', 'netflix-gift-card', 'Redeem for Netflix subscription. Works worldwide.', '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&h=600&fit=crop', true, true, true),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Premium VPN - 1 Year', 'premium-vpn-1-year', 'High-speed VPN with unlimited bandwidth and 24/7 support.', '33333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&h=600&fit=crop', true, false, true)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category_id = EXCLUDED.category_id,
    featured_image = EXCLUDED.featured_image,
    is_featured = EXCLUDED.is_featured;

-- Insert Product Variants
INSERT INTO public.product_variants (id, product_id, variant_name, price, original_price, stock_type, stock_quantity) VALUES
    -- Free Fire Diamonds variants
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '100 Diamonds', 100.00, 120.00, 'codes', 50),
    ('ffffffff-ffff-ffff-ffff-fffffffffffa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '310 Diamonds', 280.00, 350.00, 'codes', 30),
    ('ffffffff-ffff-ffff-ffff-fffffffffffb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '520 Diamonds', 450.00, 550.00, 'codes', 20),
    ('ffffffff-ffff-ffff-ffff-fffffffffffc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1060 Diamonds', 850.00, 1000.00, 'codes', 15),
    
    -- PUBG Mobile UC variants
    ('ffffffff-ffff-ffff-ffff-fffffffffffd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '60 UC', 60.00, 75.00, 'codes', 40),
    ('ffffffff-ffff-ffff-ffff-fffffffffffe', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '325 UC', 300.00, 375.00, 'codes', 25),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '660 UC', 550.00, 680.00, 'codes', 20),
    
    -- Netflix Gift Card variants
    ('ffffffff-ffff-ffff-ffff-fffffffffff1', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '$10 Gift Card', 1100.00, 1300.00, 'codes', 10),
    ('ffffffff-ffff-ffff-ffff-fffffffffff2', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '$25 Gift Card', 2600.00, 3000.00, 'codes', 8),
    ('ffffffff-ffff-ffff-ffff-fffffffffff3', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '$50 Gift Card', 5000.00, 5800.00, 'codes', 5),
    
    -- VPN variant
    ('ffffffff-ffff-ffff-ffff-fffffffffff4', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '1 Year Subscription', 2500.00, 3000.00, 'unlimited', 0)
ON CONFLICT (id) DO UPDATE SET 
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    stock_quantity = EXCLUDED.stock_quantity;

-- Insert a sample admin user (if auth user exists)
-- Note: You need to create the auth user first, then run this
INSERT INTO public.users (id, email, full_name, phone, wallet_balance, role, referral_code) VALUES
    ('aaaaaaaa-0000-0000-0000-000000000000', 'admin@tronlinebazar.com', 'Admin User', '+9779846908072', 10000.00, 'admin', 'ADMIN001')
ON CONFLICT (email) DO UPDATE SET 
    role = EXCLUDED.role,
    wallet_balance = EXCLUDED.wallet_balance;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view active variants" ON public.product_variants;

-- Create new policies
CREATE POLICY "Users can view their own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Anyone can view active products" 
ON public.products FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can view active categories" 
ON public.categories FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can view active variants" 
ON public.product_variants FOR SELECT 
USING (is_active = true);

-- Admin policies
CREATE POLICY "Admins have full access" 
ON public.users FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

CREATE POLICY "Admins can manage products" 
ON public.products FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order number (for future use)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    order_num TEXT;
BEGIN
    order_num := 'TR-' || 
                 TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                 LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Database setup complete!';
    RAISE NOTICE '📊 Summary:';
    RAISE NOTICE '   Categories: %', (SELECT COUNT(*) FROM public.categories);
    RAISE NOTICE '   Products: %', (SELECT COUNT(*) FROM public.products);
    RAISE NOTICE '   Variants: %', (SELECT COUNT(*) FROM public.product_variants);
END $$;