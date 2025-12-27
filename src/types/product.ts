export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  parent_id?: string
  is_active: boolean
  sort_order: number
  created_at: string
  product_count?: number
}

export interface ProductVariant {
  id: string
  product_id: string
  variant_name: string
  price: number
  original_price?: number
  sku?: string
  stock_type: 'limited' | 'unlimited' | 'codes'
  stock_quantity: number
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  category_id: string
  featured_image: string
  gallery_images: string[]
  is_featured: boolean
  is_active: boolean
  has_variants: boolean
  requires_manual_delivery: boolean
  delivery_instructions?: string
  created_at: string
  updated_at: string
  
  // Relations (from Supabase joins)
  category?: Category
  variants?: ProductVariant[]
}

export interface ProductFilters {
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  featured?: boolean
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular'
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}