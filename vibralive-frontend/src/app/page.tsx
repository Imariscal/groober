'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

/**
 * Redirigir según el rol del usuario
 */
function getRedirectByRole(role?: string): string {
  switch (role) {
    case 'superadmin':
      return '/platform/dashboard';
    case 'owner':
      return '/clinic/dashboard';
    case 'staff':
      return '/staff/dashboard';
    default:
      return '/landing';
  }
}

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Load auth state from storage
    const store = useAuthStore.getState();
    store.loadFromStorage();

    // Redirect based on auth state and role
    setTimeout(() => {
      if (store.isAuthenticated) {
        const redirectUrl = getRedirectByRole(store.user?.role);
        router.push(redirectUrl);
      } else {
        router.push('/landing');
      }
    }, 100);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Groober</h1>
        <p className="text-gray-600">Cargando...</p>
      </div>
    </div>
  );
}
