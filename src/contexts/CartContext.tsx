"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  // PPOM fields
  combinationId?: string;
  optionSelections?: Record<string, string | string[]>;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id" | "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("tronlinebazar_cart");
    if (savedCart) {
      try {
        const parsedItems = JSON.parse(savedCart);
        if (Array.isArray(parsedItems)) {
          setItems(parsedItems);
        }
      } catch (error) {
        console.error("Failed to load cart from localStorage:", error);
        // Clear corrupted data
        localStorage.removeItem("tronlinebazar_cart");
      }
    }
    setIsInitialized(true);
  }, []);

  // Helper to persist state immediately with error handling
  const saveToStorage = (newItems: CartItem[]) => {
    if (typeof window !== "undefined" && isInitialized) {
      try {
        localStorage.setItem("tronlinebazar_cart", JSON.stringify(newItems));
      } catch (error) {
        console.error("Failed to save cart to localStorage:", error);
      }
    }
  };

  const addItem = (newItem: Omit<CartItem, "id" | "quantity">) => {
    if (!isInitialized) return;

    setItems((prev) => {
      // Check for duplicates: same product + variant + combination (for PPOM)
      const existing = prev.find(
        (item) =>
          item.productId === newItem.productId &&
          item.variantId === newItem.variantId &&
          // For PPOM items, also check combinationId
          item.combinationId === newItem.combinationId,
      );

      let updatedItems: CartItem[];

      if (existing) {
        updatedItems = prev.map((item) =>
          item.id === existing.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        updatedItems = [
          ...prev,
          {
            ...newItem,
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            quantity: 1,
          },
        ];
      }

      // Immediately save to localStorage
      saveToStorage(updatedItems);
      return updatedItems;
    });
  };

  const removeItem = (id: string) => {
    if (!isInitialized) return;

    setItems((prev) => {
      const updatedItems = prev.filter((item) => item.id !== id);
      saveToStorage(updatedItems);
      return updatedItems;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (!isInitialized) return;

    // Handle removal if quantity < 1
    if (quantity < 1) {
      removeItem(id);
      return;
    }

    setItems((prev) => {
      const updatedItems = prev.map((item) =>
        item.id === id ? { ...item, quantity } : item,
      );
      saveToStorage(updatedItems);
      return updatedItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    if (isInitialized) {
      saveToStorage([]);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items: isInitialized ? items : [],
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems: isInitialized ? totalItems : 0,
        totalPrice: isInitialized ? totalPrice : 0,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
