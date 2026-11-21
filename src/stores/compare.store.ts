import { create } from 'zustand';

export interface ComparedProduct {
  id: string;
  sku: string;
  name: string;
  slug?: string;
  sellingPrice: number;
  discountPrice?: number | null;
  primaryImage: string;
  category?: { name: string };
  brand?: { name: string };
  specs?: Record<string, any>;
}

interface CompareState {
  items: ComparedProduct[];
  isOpen: boolean;
  hydrated: boolean;
  hydrate: () => void;
  addToCompare: (product: ComparedProduct) => boolean;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useCompareStore = create<CompareState>((set, get) => {
  const persist = (items: ComparedProduct[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('royal_compare_items', JSON.stringify(items));
    }
  };

  return {
    items: [],
    isOpen: false,
    hydrated: false,

    hydrate: () => {
      if (typeof window === 'undefined' || get().hydrated) return;
      try {
        const stored = localStorage.getItem('royal_compare_items');
        const parsed = stored ? JSON.parse(stored) : [];
        const items = Array.isArray(parsed) ? parsed : [];
        set({ items, isOpen: items.length > 0, hydrated: true });
      } catch {
        set({ items: [], isOpen: false, hydrated: true });
      }
    },

    addToCompare: (product: ComparedProduct) => {
      const { items } = get();
      if (items.some((i) => i.id === product.id)) {
        return false;
      }
      if (items.length >= 4) {
        return false;
      }

      const next = [...items, product];
      persist(next);
      set({ items: next, isOpen: true });
      return true;
    },

    removeFromCompare: (productId: string) => {
      const { items } = get();
      const next = items.filter((i) => i.id !== productId);
      persist(next);
      set({ items: next, isOpen: next.length > 0 });
    },

    clearCompare: () => {
      persist([]);
      set({ items: [], isOpen: false });
    },

    isInCompare: (productId: string) => {
      return get().items.some((i) => i.id === productId);
    },

    setIsOpen: (isOpen: boolean) => set({ isOpen }),
  };
});
