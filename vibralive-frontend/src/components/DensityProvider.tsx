'use client';

import React from 'react';
import { useDensityStore } from '@/hooks/useDensity';

/**
 * DensityProvider - Wrapper component for density state management
 * Although Zustand doesn't require a Context provider, this component
 * ensures the density store is initialized and available throughout the app.
 */
export function DensityProvider({ children }: { children: React.ReactNode }) {
  // Initialize store on mount
  const density = useDensityStore((state) => state.density);

  return (
    <div data-density={density}>
      {children}
    </div>
  );
}
