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
        const totalItems = (cartData.items || []).reduce(
          (sum: number, it: any) => sum + (it.quantity || 1),
          0,
        );
        set({ cart: cartData, itemCount: totalItems });
      }
    } catch (e) {
      console.error('Error fetching cart:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (item: AddItemDto) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/v1/cart/items', {
        method: 'POST',
        headers: getCartHeaders(true),
        credentials: 'include',
        body: JSON.stringify({
          ...(item.productId ? { productId: item.productId } : {}),
          ...(item.variantId ? { variantId: item.variantId } : {}),
          quantity: item.quantity || 1,
        }),
      });

      if (res.ok) {
        await get().fetchCart();
      }
    } catch (e) {
      console.error('Error adding to cart:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (itemId: string) => {
    try {
      const res = await fetch(`/api/v1/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: getCartHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        await get().fetchCart();
      }
    } catch (e) {
      console.error('Error removing from cart:', e);
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    try {
      const res = await fetch(`/api/v1/cart/items/${itemId}`, {
        method: 'PUT',
        headers: getCartHeaders(true),
        credentials: 'include',
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        await get().fetchCart();
      }
    } catch (e) {
      console.error('Error updating cart quantity:', e);
    }
  },

  clearCart: async () => {
    try {
      await fetch('/api/v1/cart', {
        method: 'DELETE',
        headers: getCartHeaders(),
        credentials: 'include',
      });
      set({ cart: { id: '', items: [], subtotal: 0 }, itemCount: 0 });
    } catch (e) {
      console.error('Error clearing cart:', e);
    }
  },
}));
