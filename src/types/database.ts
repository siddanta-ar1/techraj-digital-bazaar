// Auto-generated from Supabase schema — do not edit manually.
// Regenerate with: npx supabase gen types typescript --project-id <id> > src/types/database.ts
// Or via the Supabase MCP: mcp__supabase__generate_typescript_types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: { created_at: string; description: string | null; icon: string | null; id: string; is_active: boolean | null; name: string; parent_id: string | null; slug: string; sort_order: number | null }
        Insert: { created_at?: string; description?: string | null; icon?: string | null; id?: string; is_active?: boolean | null; name: string; parent_id?: string | null; slug: string; sort_order?: number | null }
        Update: { created_at?: string; description?: string | null; icon?: string | null; id?: string; is_active?: boolean | null; name?: string; parent_id?: string | null; slug?: string; sort_order?: number | null }
      }
      orders: {
        Row: { admin_notes: string | null; created_at: string; delivery_details: Json | null; delivery_type: string | null; discount_amount: number | null; final_amount: number; id: string; order_number: string; payment_method: string | null; payment_screenshot_url: string | null; payment_status: string | null; promo_code: string | null; status: string | null; total_amount: number; updated_at: string; user_id: string | null }
        Insert: { admin_notes?: string | null; created_at?: string; delivery_details?: Json | null; delivery_type?: string | null; discount_amount?: number | null; final_amount: number; id?: string; order_number: string; payment_method?: string | null; payment_screenshot_url?: string | null; payment_status?: string | null; promo_code?: string | null; status?: string | null; total_amount: number; updated_at?: string; user_id?: string | null }
        Update: { admin_notes?: string | null; created_at?: string; delivery_details?: Json | null; delivery_type?: string | null; discount_amount?: number | null; final_amount?: number; id?: string; order_number?: string; payment_method?: string | null; payment_screenshot_url?: string | null; payment_status?: string | null; promo_code?: string | null; status?: string | null; total_amount?: number; updated_at?: string; user_id?: string | null }
      }
      order_items: {
        Row: { combination_id: string | null; created_at: string; delivered_code: string | null; id: string; option_selections: string | null; order_id: string | null; quantity: number; status: string | null; total_price: number; unit_price: number; updated_at: string | null; variant_id: string | null }
        Insert: { combination_id?: string | null; created_at?: string; delivered_code?: string | null; id?: string; option_selections?: string | null; order_id?: string | null; quantity: number; status?: string | null; total_price: number; unit_price: number; updated_at?: string | null; variant_id?: string | null }
        Update: { combination_id?: string | null; created_at?: string; delivered_code?: string | null; id?: string; option_selections?: string | null; order_id?: string | null; quantity?: number; status?: string | null; total_price?: number; unit_price?: number; updated_at?: string | null; variant_id?: string | null }
      }
      products: {
        Row: { auto_generate_combinations: boolean | null; category_id: string | null; created_at: string; delivery_instructions: string | null; description: string | null; featured_image: string | null; gallery_images: string[] | null; has_variants: boolean | null; id: string; is_active: boolean | null; is_featured: boolean | null; legacy_variants_enabled: boolean | null; max_price: number | null; min_price: number | null; name: string; ppom_enabled: boolean | null; requires_manual_delivery: boolean | null; slug: string; updated_at: string }
        Insert: { auto_generate_combinations?: boolean | null; category_id?: string | null; created_at?: string; delivery_instructions?: string | null; description?: string | null; featured_image?: string | null; gallery_images?: string[] | null; has_variants?: boolean | null; id?: string; is_active?: boolean | null; is_featured?: boolean | null; legacy_variants_enabled?: boolean | null; max_price?: number | null; min_price?: number | null; name: string; ppom_enabled?: boolean | null; requires_manual_delivery?: boolean | null; slug: string; updated_at?: string }
        Update: { auto_generate_combinations?: boolean | null; category_id?: string | null; created_at?: string; delivery_instructions?: string | null; description?: string | null; featured_image?: string | null; gallery_images?: string[] | null; has_variants?: boolean | null; id?: string; is_active?: boolean | null; is_featured?: boolean | null; legacy_variants_enabled?: boolean | null; max_price?: number | null; min_price?: number | null; name?: string; ppom_enabled?: boolean | null; requires_manual_delivery?: boolean | null; slug?: string; updated_at?: string }
      }
      product_codes: {
        Row: { code: string; combination_id: string | null; created_at: string; discount_amount: number | null; id: string; is_used: boolean | null; order_id: string | null; used_at: string | null; variant_id: string | null }
        Insert: { code: string; combination_id?: string | null; created_at?: string; discount_amount?: number | null; id?: string; is_used?: boolean | null; order_id?: string | null; used_at?: string | null; variant_id?: string | null }
        Update: { code?: string; combination_id?: string | null; created_at?: string; discount_amount?: number | null; id?: string; is_used?: boolean | null; order_id?: string | null; used_at?: string | null; variant_id?: string | null }
      }
      product_variants: {
        Row: { created_at: string; id: string; is_active: boolean | null; original_price: number | null; price: number; product_id: string | null; sku: string | null; sort_order: number | null; stock_quantity: number | null; stock_type: string | null; variant_name: string }
        Insert: { created_at?: string; id?: string; is_active?: boolean | null; original_price?: number | null; price: number; product_id?: string | null; sku?: string | null; sort_order?: number | null; stock_quantity?: number | null; stock_type?: string | null; variant_name: string }
        Update: { created_at?: string; id?: string; is_active?: boolean | null; original_price?: number | null; price?: number; product_id?: string | null; sku?: string | null; sort_order?: number | null; stock_quantity?: number | null; stock_type?: string | null; variant_name?: string }
      }
      promo_codes: {
        Row: { code: string; created_at: string | null; discount_type: string; discount_value: number; expires_at: string | null; id: string; is_active: boolean | null; max_discount_amount: number | null; min_order_amount: number | null; updated_at: string | null; usage_count: number | null; usage_limit: number | null }
        Insert: { code: string; created_at?: string | null; discount_type: string; discount_value: number; expires_at?: string | null; id?: string; is_active?: boolean | null; max_discount_amount?: number | null; min_order_amount?: number | null; updated_at?: string | null; usage_count?: number | null; usage_limit?: number | null }
        Update: { code?: string; created_at?: string | null; discount_type?: string; discount_value?: number; expires_at?: string | null; id?: string; is_active?: boolean | null; max_discount_amount?: number | null; min_order_amount?: number | null; updated_at?: string | null; usage_count?: number | null; usage_limit?: number | null }
      }
      site_settings: {
        Row: { description: string | null; key: string; updated_at: string | null; value: Json }
        Insert: { description?: string | null; key: string; updated_at?: string | null; value: Json }
        Update: { description?: string | null; key?: string; updated_at?: string | null; value?: Json }
      }
      topup_requests: {
        Row: { admin_notes: string | null; amount: number; created_at: string; id: string; payment_method: string | null; screenshot_url: string | null; status: string | null; transaction_id: string | null; updated_at: string; user_id: string | null }
        Insert: { admin_notes?: string | null; amount: number; created_at?: string; id?: string; payment_method?: string | null; screenshot_url?: string | null; status?: string | null; transaction_id?: string | null; updated_at?: string; user_id?: string | null }
        Update: { admin_notes?: string | null; amount?: number; created_at?: string; id?: string; payment_method?: string | null; screenshot_url?: string | null; status?: string | null; transaction_id?: string | null; updated_at?: string; user_id?: string | null }
      }
      users: {
        Row: { avatar_url: string | null; created_at: string; email: string; email_verified: boolean | null; full_name: string | null; id: string; phone: string | null; referral_code: string | null; referred_by: string | null; role: string | null; updated_at: string; username: string | null; wallet_balance: number | null }
        Insert: { avatar_url?: string | null; created_at?: string; email: string; email_verified?: boolean | null; full_name?: string | null; id: string; phone?: string | null; referral_code?: string | null; referred_by?: string | null; role?: string | null; updated_at?: string; username?: string | null; wallet_balance?: number | null }
        Update: { avatar_url?: string | null; created_at?: string; email?: string; email_verified?: boolean | null; full_name?: string | null; id?: string; phone?: string | null; referral_code?: string | null; referred_by?: string | null; role?: string | null; updated_at?: string; username?: string | null; wallet_balance?: number | null }
      }
      wallet_transactions: {
        Row: { amount: number; balance_after: number; created_at: string; description: string | null; id: string; reference_id: string | null; status: string | null; transaction_type: string | null; type: string | null; user_id: string | null }
        Insert: { amount: number; balance_after: number; created_at?: string; description?: string | null; id?: string; reference_id?: string | null; status?: string | null; transaction_type?: string | null; type?: string | null; user_id?: string | null }
        Update: { amount?: number; balance_after?: number; created_at?: string; description?: string | null; id?: string; reference_id?: string | null; status?: string | null; transaction_type?: string | null; type?: string | null; user_id?: string | null }
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      claim_product_codes_atomic: { Args: { p_order_id: string; p_quantity: number; p_variant_id: string }; Returns: string[] }
      deduct_wallet_balance: { Args: { amount: number; user_id: string }; Returns: undefined }
      decrement_promo_usage: { Args: { promo_id: string }; Returns: undefined }
      increment_promo_usage: { Args: { promo_id: string }; Returns: undefined }
      increment_wallet: { Args: { p_amount: number; p_user_id: string }; Returns: undefined }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

// Convenience shorthand types used throughout the app
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type DbUser = Tables<"users">;
export type DbOrder = Tables<"orders">;
export type DbOrderItem = Tables<"order_items">;
export type DbProduct = Tables<"products">;
export type DbProductVariant = Tables<"product_variants">;
export type DbProductCode = Tables<"product_codes">;
export type DbPromoCode = Tables<"promo_codes">;
export type DbTopupRequest = Tables<"topup_requests">;
export type DbWalletTransaction = Tables<"wallet_transactions">;
export type DbCategory = Tables<"categories">;
export type DbSiteSetting = Tables<"site_settings">;
