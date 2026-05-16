-- Migration: Add PPOM (Product Page Option Modifier) columns to order_items table
-- Purpose: Store PPOM option selections and combination IDs for orders
-- These columns allow admins to see what customizations users selected for products

-- 1. First, update the status constraint to include 'completed' status
-- Drop the existing constraint
ALTER TABLE public.order_items 
DROP CONSTRAINT IF EXISTS order_items_status_check;

-- Update status check constraint to include 'completed'
ALTER TABLE public.order_items
ADD CONSTRAINT order_items_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'delivered'::text, 'completed'::text, 'refunded'::text]));

-- 2. Add missing PPOM columns to order_items table
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS combination_id uuid,
ADD COLUMN IF NOT EXISTS option_selections jsonb;

-- 3. Add comments for clarity
COMMENT ON COLUMN public.order_items.combination_id IS 'Reference to the specific product option combination that was selected';
COMMENT ON COLUMN public.order_items.option_selections IS 'JSON object containing the user-selected PPOM options (e.g., {"color": "red", "size": "large"})';

-- 4. Ensure order_items table has proper timestamp tracking
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 5. Create trigger to update updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_order_items_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_order_items_updated_at ON public.order_items;

CREATE TRIGGER update_order_items_updated_at
BEFORE UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_items_timestamp();
