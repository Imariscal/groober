'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { DensityProvider } from './DensityProvider';
import { GoogleMapsProvider } from './maps/GoogleMapsProvider';

// Create a client for the whole app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DensityProvider>
        <GoogleMapsProvider>
          {children}
        </GoogleMapsProvider>
        <Toaster position="bottom-right" />
      </DensityProvider>
    </QueryClientProvider>
  );
}
