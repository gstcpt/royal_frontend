import { create } from 'zustand';
import { getCartHeaders } from '@/lib/cart-session';

export type ReactionValue = 'LIKE' | 'DISLIKE';

interface ReactionCounts {
  likeCount: number;
  dislikeCount: number;
}

interface ReactionState {
  reactions: Record<string, ReactionValue>;
  counts: Record<string, ReactionCounts>;
  loaded: boolean;
  isLoading: boolean;
  authPromptProductId: string | null;
  fetchMyReactions: () => Promise<void>;
  getCounts: (productId: string, initialLike?: number, initialDislike?: number) => ReactionCounts;
  toggleReaction: (
    productId: string,
    reaction: ReactionValue,
    initialLike?: number,
    initialDislike?: number,
  ) => Promise<{ ok: boolean; requiresAuth?: boolean }>;
  clearAuthPrompt: () => void;
}

let inFlightReactionsPromise: Promise<void> | null = null;

export const useReactionStore = create<ReactionState>((set, get) => ({
  reactions: {},
  counts: {},
  loaded: false,
  isLoading: false,
  authPromptProductId: null,

  fetchMyReactions: async () => {
    if (typeof window === 'undefined' || !localStorage.getItem('royal_token')) {
      set({ reactions: {}, loaded: true, isLoading: false });
      return;
    }
    if (get().loaded) return;
    if (inFlightReactionsPromise) return inFlightReactionsPromise;

    set({ isLoading: true });
    inFlightReactionsPromise = (async () => {
      try {
        const res = await fetch('/api/v1/storefront-cms/my-reactions', {
          headers: getCartHeaders(true),
          credentials: 'include',
        });
        if (!res.ok) {
          set({ loaded: true, isLoading: false });
          return;
        }
        const json = await res.json();
        const map = json?.data?.reactions || json?.reactions || {};
        set({ reactions: map, loaded: true, isLoading: false });
      } catch {
        set({ loaded: true, isLoading: false });
      } finally {
        inFlightReactionsPromise = null;
      }
    })();

    return inFlightReactionsPromise;
  },

  getCounts: (productId, initialLike = 0, initialDislike = 0) => {
    const stored = get().counts[productId];
    return stored || { likeCount: initialLike, dislikeCount: initialDislike };
  },

  toggleReaction: async (productId, reaction, initialLike = 0, initialDislike = 0) => {
    if (typeof window === 'undefined' || !localStorage.getItem('royal_token')) {
      set({ authPromptProductId: productId });
      setTimeout(() => {
        if (get().authPromptProductId === productId) {
          set({ authPromptProductId: null });
        }
      }, 4000);
      return { ok: false, requiresAuth: true };
    }

    const prevReaction = get().reactions[productId] || null;
    const prevCounts = get().counts[productId] || {
      likeCount: initialLike,
      dislikeCount: initialDislike,
    };

    // Optimistic update
    let nextReaction: ReactionValue | null = reaction;
    let nextLike = prevCounts.likeCount;
    let nextDislike = prevCounts.dislikeCount;

    if (prevReaction === reaction) {
      nextReaction = null;
      if (reaction === 'LIKE') nextLike = Math.max(0, nextLike - 1);
      else nextDislike = Math.max(0, nextDislike - 1);
    } else {
      if (prevReaction === 'LIKE') nextLike = Math.max(0, nextLike - 1);
      if (prevReaction === 'DISLIKE') nextDislike = Math.max(0, nextDislike - 1);
      if (reaction === 'LIKE') nextLike += 1;
      else nextDislike += 1;
    }

    const nextReactions = { ...get().reactions };
    if (nextReaction) nextReactions[productId] = nextReaction;
    else delete nextReactions[productId];

    set({
      reactions: nextReactions,
      counts: {
        ...get().counts,
        [productId]: { likeCount: nextLike, dislikeCount: nextDislike },
      },
    });

    try {
      const res = await fetch('/api/v1/storefront-cms/reactions/toggle', {
        method: 'POST',
        headers: getCartHeaders(true),
        credentials: 'include',
        body: JSON.stringify({ productId, reaction }),
      });
      if (res.ok) {
        const json = await res.json();
        const data = json?.data || json;
        const confirmed = { ...get().reactions };
        if (data.myReaction) confirmed[productId] = data.myReaction;
        else delete confirmed[productId];
        set({
          reactions: confirmed,
          counts: {
            ...get().counts,
            [productId]: {
              likeCount: Number(data.likeCount ?? nextLike),
              dislikeCount: Number(data.dislikeCount ?? nextDislike),
            },
          },
        });
      }
      return { ok: true };
    } catch {
      return { ok: false };
    }
  },

  clearAuthPrompt: () => set({ authPromptProductId: null }),
}));
