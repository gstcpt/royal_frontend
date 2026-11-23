import { create } from 'zustand';
import { getCartHeaders } from '@/lib/cart-session';

export interface MyProductReview {
  rating: number;
  title?: string | null;
  body: string;
}

interface ReviewStats {
  rating: number;
  reviewCount: number;
}

interface ReviewState {
  reviews: Record<string, MyProductReview>;
  stats: Record<string, ReviewStats>;
  loaded: boolean;
  isLoading: boolean;
  fetchMyReviews: () => Promise<void>;
  setLocalReview: (productId: string, review: MyProductReview, reviewCountDelta?: number, nextAverage?: number) => void;
  submitReview: (
    productId: string,
    payload: {
      rating: number;
      title?: string;
      body: string;
      authorName?: string;
      authorEmail?: string;
    },
    currentCount?: number,
    currentRating?: number,
  ) => Promise<{ ok: boolean; error?: string; isEdit?: boolean }>;
}

const GUEST_REVIEWS_KEY = 'royal_guest_reviews_v1';
let inFlightReviewsPromise: Promise<void> | null = null;

function readGuestReviews(): Record<string, MyProductReview> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(GUEST_REVIEWS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeGuestReview(productId: string, review: MyProductReview) {
  if (typeof window === 'undefined') return;
  try {
    const existing = readGuestReviews();
    existing[productId] = review;
    localStorage.setItem(GUEST_REVIEWS_KEY, JSON.stringify(existing));
  } catch {
    // ignore storage quota errors
  }
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: {},
  stats: {},
  loaded: false,
  isLoading: false,

  fetchMyReviews: async () => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('royal_token')) {
      set({ reviews: readGuestReviews(), loaded: true, isLoading: false });
      return;
    }
    if (get().loaded) return;
    if (inFlightReviewsPromise) return inFlightReviewsPromise;

    set({ isLoading: true });
    inFlightReviewsPromise = (async () => {
      try {
        const res = await fetch('/api/v1/storefront-cms/my-reviews', {
          headers: getCartHeaders(true),
          credentials: 'include',
        });
        if (!res.ok) {
          set({ reviews: readGuestReviews(), loaded: true, isLoading: false });
          return;
        }
        const json = await res.json();
        const serverMap = json?.data?.reviews || json?.reviews || {};
        set({
          reviews: { ...readGuestReviews(), ...serverMap },
          loaded: true,
          isLoading: false,
        });
      } catch {
        set({ reviews: readGuestReviews(), loaded: true, isLoading: false });
      } finally {
        inFlightReviewsPromise = null;
      }
    })();

    return inFlightReviewsPromise;
  },

  setLocalReview: (productId, review, reviewCountDelta = 0, nextAverage) => {
    const prevStat = get().stats[productId];
    set((state) => ({
      reviews: { ...state.reviews, [productId]: review },
      stats: {
        ...state.stats,
        [productId]: {
          rating: nextAverage ?? review.rating,
          reviewCount: Math.max(0, (prevStat?.reviewCount ?? 0) + reviewCountDelta),
        },
      },
    }));
  },

  submitReview: async (productId, payload, currentCount = 0, currentRating = 5) => {
    try {
      const hadPrior = Boolean(get().reviews[productId]);
      const res = await fetch(`/api/v1/storefront-cms/reviews/${productId}`, {
        method: 'POST',
        headers: getCartHeaders(true),
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        return {
          ok: false,
          error: json?.message || "Impossible d'enregistrer votre avis.",
        };
      }
      const data = json?.data || json;
      const saved: MyProductReview = {
        rating: Number(data?.rating || payload.rating),
        title: data?.title || payload.title || null,
        body: data?.body || payload.body,
      };
      const isEdit = Boolean(data?.isEdit ?? hadPrior);
      const prevStat = get().stats[productId] || {
        rating: currentRating,
        reviewCount: currentCount,
      };
      const nextCount = isEdit ? Math.max(1, prevStat.reviewCount) : prevStat.reviewCount + 1;
      const nextAvg = isEdit
        ? saved.rating
        : Number(
            (((prevStat.rating * prevStat.reviewCount) + saved.rating) / Math.max(1, nextCount)).toFixed(1),
          );

      writeGuestReview(productId, saved);
      set((state) => ({
        reviews: { ...state.reviews, [productId]: saved },
        stats: {
          ...state.stats,
          [productId]: { rating: nextAvg, reviewCount: nextCount },
        },
      }));
      return { ok: true, isEdit };
    } catch {
      return { ok: false, error: 'Erreur réseau lors de la publication de l’avis.' };
    }
  },
}));
