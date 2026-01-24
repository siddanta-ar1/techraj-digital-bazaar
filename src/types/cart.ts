// src/types/cart.ts
export interface CartItem {
  id: string
  productId: string
  productName: string
  variantId: string
  variantName: string
  price: number
  quantity: number
  imageUrl?: string
  stockType?: 'limited' | 'unlimited' | 'codes'
  stockQuantity?: number
  // PPOM fields
  combinationId?: string
  optionSelections?: Record<string, string | string[]>
}

export interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

// src/types/order.ts
export interface OrderItem {
  variantId: string
  quantity: number
  price: number
  productName: string
  variantName: string
}

export interface OrderData {
  items: OrderItem[]
  paymentMethod: 'wallet' | 'esewa' | 'bank_transfer'
  totalAmount: number
  deliveryDetails?: {
    type: 'auto' | 'manual'
    instructions?: string
    credentials?: Record<string, any>
  }
}