import { create } from 'zustand';
import { getCartHeaders } from '@/lib/cart-session';

export interface CartItem {
  id: string;
  productId?: string;
  variantId: string;
  productName?: string;
  variantName?: string | null;
  sku?: string;
  image?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
  totalPrice?: number;
  variant?: {
    id: string;
    sku: string;
    name?: string;
    price: number;
    product?: {
      id: string;
      name: string;
      slug: string;
      images?: Array<{ url: string }>;
    };
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  shippingAmount?: number;
  discountTotal?: number;
  taxTotal?: number;
  taxAmount?: number;
  grandTotal?: number;
  totalAmount?: number;
}

interface AddItemDto {
  productId?: string;
  variantId?: string;
  quantity: number;
  name?: string;
  price?: number;
  sku?: string;
  productName?: string;
  image?: string;
}

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
  fetchCart: () => Promise<void>;
  addItem: (item: AddItemDto) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const countCartItems = (cartData: any): number =>
  (cartData?.items || []).reduce(
    (sum: number, it: any) => sum + (it.quantity || 1),
    0,
  );

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  itemCount: 0,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/v1/cart', {
        headers: getCartHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        const cartData = json.data || json;
        set({ cart: cartData, itemCount: countCartItems(cartData) });
      }
    } catch (e) {
      console.error('Error fetching cart:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (item: AddItemDto) => {
    const qty = Math.max(1, Number(item.quantity || 1));
    const prevCount = get().itemCount;
    // Optimistic count update so the header badge & toast respond instantly
    set({ itemCount: prevCount + qty });
    try {
      const res = await fetch('/api/v1/cart/items', {
        method: 'POST',
        headers: getCartHeaders(true),
        credentials: 'include',
        body: JSON.stringify({
          ...(item.productId ? { productId: item.productId } : {}),
          ...(item.variantId ? { variantId: item.variantId } : {}),
          quantity: qty,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const cartData = json.data || json;
        if (cartData && Array.isArray(cartData.items)) {
          set({ cart: cartData, itemCount: countCartItems(cartData) });
        } else {
          await get().fetchCart();
        }
      } else {
        set({ itemCount: prevCount });
      }
    } catch (e) {
      set({ itemCount: prevCount });
      console.error('Error adding to cart:', e);
    }
  },

  removeItem: async (itemId: string) => {
    const prevCart = get().cart;
    if (prevCart?.items) {
      const nextItems = prevCart.items.filter((i) => i.id !== itemId);
      set({
        cart: { ...prevCart, items: nextItems },
        itemCount: countCartItems({ items: nextItems }),
      });
    }
    try {
      const res = await fetch(`/api/v1/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: getCartHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        const cartData = json.data || json;
        if (cartData && Array.isArray(cartData.items)) {
          set({ cart: cartData, itemCount: countCartItems(cartData) });
        }
      }
    } catch (e) {
      console.error('Error removing from cart:', e);
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    const prevCart = get().cart;
    if (prevCart?.items) {
      const nextItems = prevCart.items.map((i) =>
        i.id === itemId ? { ...i, quantity } : i,
      );
      set({
        cart: { ...prevCart, items: nextItems },
        itemCount: countCartItems({ items: nextItems }),
      });
    }
    try {
      const res = await fetch(`/api/v1/cart/items/${itemId}`, {
        method: 'PUT',
        headers: getCartHeaders(true),
        credentials: 'include',
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        const json = await res.json();
        const cartData = json.data || json;
        if (cartData && Array.isArray(cartData.items)) {
          set({ cart: cartData, itemCount: countCartItems(cartData) });
        }
      }
    } catch (e) {
      console.error('Error updating cart quantity:', e);
    }
  },

  clearCart: async () => {
    set({ cart: { id: '', items: [], subtotal: 0 }, itemCount: 0 });
    try {
      await fetch('/api/v1/cart', {
        method: 'DELETE',
        headers: getCartHeaders(),
        credentials: 'include',
      });
    } catch (e) {
      console.error('Error clearing cart:', e);
    }
  },
}));
