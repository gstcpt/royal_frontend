const _resolveApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      return `${window.location.origin}/api/v1`;
    }
    return envUrl;
  }
  const internalUrl = process.env.INTERNAL_API_URL;
  if (internalUrl) {
    return `${internalUrl.replace(/\/+$/, '')}/api/v1`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
};

export const API_BASE_URL = _resolveApiBaseUrl();

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Attach token from localStorage if available in browser
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('royal_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
  });

  // Handle 401 Unauthorized with token refresh (avoid infinite loops on auth endpoints)
  if (
    response.status === 401 &&
    !isRetry &&
    !endpoint.includes('/auth/login') &&
    !endpoint.includes('/auth/refresh') &&
    !endpoint.includes('/auth/register') &&
    !endpoint.includes('/auth/me') &&
    typeof window !== 'undefined'
  ) {
    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        failedQueue.push({
          resolve: () => resolve(fetchApi<T>(endpoint, options, true)),
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!refreshRes.ok) {
        throw new Error('Refresh failed');
      }

      const refreshData = await refreshRes.json();
      const newToken = refreshData.data?.accessToken || refreshData.accessToken;

      if (newToken) {
        localStorage.setItem('royal_token', newToken);
        processQueue(null, newToken);
        isRefreshing = false;
        return fetchApi<T>(endpoint, options, true);
      } else {
        throw new Error('No token returned');
      }
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      isRefreshing = false;
      localStorage.removeItem('royal_token');
      // Redirect to login only for operational dashboard routes, never for public or auth endpoints
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register') &&
        window.location.pathname.startsWith('/dashboard')
      ) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
      throw new Error('Session expirée, veuillez vous reconnecter');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        `Erreur API: ${response.status} ${response.statusText}`,
    );
  }

  const json = await response.json();
  return json.data !== undefined ? json.data : json;
}

/**
 * Fetches all pages sequentially/in-parallel from any paginated NestJS list endpoint
 * (`{ data, meta: { totalPages, total } }` or `{ items, total }`) so UI tables, exports,
 * and KPI totals never silently truncate at 50/100/200 rows.
 */
export async function fetchAllPaginated<T = any>(
  endpoint: string,
  pageSize = 200,
): Promise<{ items: T[]; total: number }> {
  const sep = endpoint.includes('?') ? '&' : '?';
  const firstRes = await fetchApi<any>(`${endpoint}${sep}page=1&limit=${pageSize}`);
  if (Array.isArray(firstRes)) {
    return { items: firstRes, total: firstRes.length };
  }
  const firstItems: T[] = Array.isArray(firstRes?.data)
    ? firstRes.data
    : Array.isArray(firstRes?.items)
    ? firstRes.items
    : [];
  const meta = firstRes?.meta;
  const totalPages = Number(meta?.totalPages || 1);
  const total = Number(meta?.total ?? firstItems.length);
  if (totalPages <= 1) {
    return { items: firstItems, total };
  }
  const restPromises: Array<Promise<any>> = [];
  for (let p = 2; p <= totalPages; p++) {
    restPromises.push(
      fetchApi<any>(`${endpoint}${sep}page=${p}&limit=${pageSize}`).catch(() => null),
    );
  }
  const restPages = await Promise.all(restPromises);
  const combined = [...firstItems];
  for (const res of restPages) {
    const chunk: T[] = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.items)
      ? res.items
      : [];
    combined.push(...chunk);
  }
  return { items: combined, total: Math.max(total, combined.length) };
}
