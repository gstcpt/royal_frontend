import { create } from 'zustand';

export interface WishlistItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
  category?: string;
  sku?: string;
  inStock?: boolean;
}

interface WishlistState {
  items: WishlistItem[];
  hydrated: boolean;
  hydrate: () => void;
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => {
  const persist = (items: WishlistItem[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('royal_wishlist', JSON.stringify(items));
    }
  };

  return {
    items: [],
    hydrated: false,

    hydrate: () => {
      if (typeof window === 'undefined' || get().hydrated) return;
      try {
        const stored = JSON.parse(localStorage.getItem('royal_wishlist') || '[]');
        set({ items: Array.isArray(stored) ? stored : [], hydrated: true });
      } catch {
        set({ items: [], hydrated: true });
      }
    },

    addItem: (item: WishlistItem) => {
      const { items } = get();
      if (!items.some((i) => i.id === item.id)) {
        const next = [...items, item];
        set({ items: next });
        persist(next);
      }
    },

    removeItem: (id: string) => {
      const { items } = get();
      const next = items.filter((i) => i.id !== id);
      set({ items: next });
      persist(next);
    },

    isInWishlist: (id: string) => {
      return get().items.some((i) => i.id === id);
    },

    clearWishlist: () => {
      set({ items: [] });
      persist([]);
    },
  };
});
