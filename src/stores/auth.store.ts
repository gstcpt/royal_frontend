import { create } from 'zustand';
import { fetchApi } from '../lib/api';
import { SystemRole } from '@royal/shared-types';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatar?: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  roles: string[];
  permissions: string[];
  warehouseId?: string | null;
  posId?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  setAuth: (user: AuthUser, accessToken: string) => void;
  clearAuth: () => void;
  fetchMe: () => Promise<AuthUser | null>;
  login: (credentials: { email: string; password: string }) => Promise<AuthUser>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;

  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  setAuth: (user, accessToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('royal_token', accessToken);
    }
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
    });
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('royal_token');
    }
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
    });
  },

  fetchMe: async () => {
    if (typeof window !== 'undefined' && !localStorage.getItem('royal_token')) {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
      return null;
    }
    set({ isLoading: true });
    try {
      const user = await fetchApi<AuthUser>('/auth/me');
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });
      return user;
    } catch {
      get().clearAuth();
      return null;
    }
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response = await fetchApi<{
        accessToken: string;
        refreshToken: string;
        user: AuthUser;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      get().setAuth(response.user, response.accessToken);
      return response.user;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const response = await fetchApi<{
        accessToken: string;
        refreshToken: string;
        user: AuthUser;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      get().setAuth(response.user, response.accessToken);
      return response.user;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      get().clearAuth();
    }
  },

  hasRole: (role: string) => {
    const { user } = get();
    if (!user || !user.roles) return false;
    if (user.roles.includes(SystemRole.ROOT)) return true;
    return user.roles.includes(role);
  },

  hasAnyRole: (roles: string[]) => {
    const { user } = get();
    if (!user || !user.roles) return false;
    if (user.roles.includes(SystemRole.ROOT)) return true;
    return roles.some((r) => user.roles.includes(r));
  },

  hasPermission: (permission: string) => {
    const { user } = get();
    if (!user) return false;
    if (user.roles && user.roles.includes(SystemRole.ROOT)) return true;
    return (user.permissions || []).includes(permission);
  },

  hasAllPermissions: (permissions: string[]) => {
    const { user } = get();
    if (!user) return false;
    if (user.roles && user.roles.includes(SystemRole.ROOT)) return true;
    const userPerms = user.permissions || [];
    return permissions.every((p) => userPerms.includes(p));
  },
}));
