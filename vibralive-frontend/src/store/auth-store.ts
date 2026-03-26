import { create } from 'zustand';
import { User } from '@/types';

interface AuthStore {
  // State
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  loadFromStorage: () => void;

  // Permission checking
  hasPermission: (permission: string) => boolean;
  hasPermissions: (permissions: string[]) => boolean; // ANY of permissions
  hasAllPermissions: (permissions: string[]) => boolean; // ALL of permissions
  hasFeature: (feature: string) => boolean;
  hasRole: (role: string) => boolean;
  canAccess: (requiredPermissions?: string[], requiredRole?: string) => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  token: null,
  isLoading: false,
  error: null,

  // Basic actions
  setUser: (user) =>
    set({
      user,
      isAuthenticated: user !== null,
    }),

  setToken: (token) => {
    set({ token });
    if (typeof window !== 'undefined') {
      // El token se guarda en login(), aquí solo sincronizamos
      localStorage.setItem('access_token', token);
    }
  },

  setLoading: (loading) =>
    set({ isLoading: loading }),

  setError: (error) =>
    set({ error }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('rememberMe');
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;

    // Intenta localStorage primero (si marcó "Recuérdame")
    let user = localStorage.getItem('user');
    let token = localStorage.getItem('access_token');

    // Si no está en localStorage, intenta sessionStorage
    if (!token) {
      user = sessionStorage.getItem('user');
      token = sessionStorage.getItem('access_token');
    }

    set({
      user: user ? JSON.parse(user) : null,
      token: token || null,
      isAuthenticated: !!token,
    });
  },

  // Permission checking methods
  hasPermission: (permission: string) => {
    const state = get();
    return state.user?.permissions?.includes(permission) ?? false;
  },

  hasPermissions: (permissions: string[]) => {
    const state = get();
    return permissions.some((perm) =>
      state.user?.permissions?.includes(perm)
    );
  },

  hasAllPermissions: (permissions: string[]) => {
    const state = get();
    return permissions.every((perm) =>
      state.user?.permissions?.includes(perm)
    );
  },

  hasFeature: (feature: string) => {
    const state = get();
    return state.user?.available_features?.includes(feature) ?? false;
  },

  hasRole: (role: string) => {
    const state = get();
    return state.user?.role === role;
  },

  canAccess: (requiredPermissions?: string[], requiredRole?: string) => {
    const state = get();
    const { hasPermissions, hasRole } = get();

    if (!state.isAuthenticated) return false;

    if (requiredRole && !hasRole(requiredRole)) return false;
    if (requiredPermissions && !hasPermissions(requiredPermissions))
      return false;

    return true;
  },
}));
