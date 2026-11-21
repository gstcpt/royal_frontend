export const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80';

export const DEFAULT_CATEGORY_IMAGES = [
  'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1594998893017-36147cbcae05?auto=format&fit=crop&w=800&q=80',
];

export function getSafeImageUrl(
  url?: string | null,
  fallback: string = DEFAULT_PRODUCT_IMAGE,
): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallback;
  }
  const trimmed = url.trim();
  // Local seeded asset placeholders (/images/categories/*, /images/products/*) do not exist in /public
  if (
    trimmed.startsWith('/images/categories/') ||
    trimmed.startsWith('/images/products/') ||
    trimmed.startsWith('/images/brands/')
  ) {
    return fallback;
  }
  return trimmed;
}

export function getCartSessionId(): string {
  if (typeof window === 'undefined') {
    return 'ssr_guest_session';
  }
  let sessionId = localStorage.getItem('royal_session_id');
  if (!sessionId) {
    sessionId = `flr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('royal_session_id', sessionId);
  }
  return sessionId;
}

export function getCartHeaders(includeJson = false): Record<string, string> {
  const headers: Record<string, string> = {
    'x-session-id': getCartSessionId(),
  };
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('royal_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}
