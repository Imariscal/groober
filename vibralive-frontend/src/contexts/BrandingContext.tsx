'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { PublicBranding } from '@/types';
import { clinicConfigurationsApi } from '@/api/clinic-configurations-api';
import { useAuth } from '@/hooks/useAuth';

interface BrandingContextType {
  branding: PublicBranding | null;
  isLoading: boolean;
  error: string | null;
  refreshBranding: () => void;
}

const defaultBranding: PublicBranding = {
  brandName: 'Groober',
  tagline: 'Motor de Retención Veterinario',
  primaryColor: '#0ea5e9',
  loginGradientFrom: '#2563eb',
  loginGradientTo: '#1d4ed8',
  loginTextColor: '#ffffff',
  fontFamily: 'Inter',
};

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  isLoading: false,
  error: null,
  refreshBranding: () => {},
});

export const useBranding = () => useContext(BrandingContext);

interface BrandingProviderProps {
  children: React.ReactNode;
  clinicSlugOrId?: string; // For public/login pages
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({ 
  children, 
  clinicSlugOrId 
}) => {
  const { user } = useAuth();
  const [branding, setBranding] = useState<PublicBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBranding = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let data: PublicBranding;

      if (clinicSlugOrId) {
        // Public branding for login page
        data = await clinicConfigurationsApi.getPublicBranding(clinicSlugOrId);
      } else if (user?.clinicId) {
        // Authenticated user - get their clinic's branding
        data = await clinicConfigurationsApi.getClinicBranding(user.clinicId);
      } else {
        // No clinic context - use defaults
        data = defaultBranding;
      }

      setBranding(data);
      applyBrandingToDOM(data);
    } catch (err: any) {
      console.error('Error loading branding:', err);
      setError(err.message || 'Error loading branding');
      setBranding(defaultBranding);
      applyBrandingToDOM(defaultBranding);
    } finally {
      setIsLoading(false);
    }
  }, [clinicSlugOrId, user?.clinicId]);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  const refreshBranding = useCallback(() => {
    loadBranding();
  }, [loadBranding]);

  return (
    <BrandingContext.Provider value={{ branding, isLoading, error, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

// Apply branding as CSS custom properties
function applyBrandingToDOM(branding: PublicBranding) {
  const root = document.documentElement;

  // Primary colors
  root.style.setProperty('--brand-primary', branding.primaryColor);
  root.style.setProperty('--brand-primary-50', adjustColor(branding.primaryColor, 0.95));
  root.style.setProperty('--brand-primary-100', adjustColor(branding.primaryColor, 0.9));
  root.style.setProperty('--brand-primary-200', adjustColor(branding.primaryColor, 0.75));
  root.style.setProperty('--brand-primary-300', adjustColor(branding.primaryColor, 0.6));
  root.style.setProperty('--brand-primary-400', adjustColor(branding.primaryColor, 0.4));
  root.style.setProperty('--brand-primary-500', branding.primaryColor);
  root.style.setProperty('--brand-primary-600', adjustColor(branding.primaryColor, -0.1));
  root.style.setProperty('--brand-primary-700', adjustColor(branding.primaryColor, -0.2));
  root.style.setProperty('--brand-primary-800', adjustColor(branding.primaryColor, -0.3));
  root.style.setProperty('--brand-primary-900', adjustColor(branding.primaryColor, -0.4));

  // Login gradient
  root.style.setProperty('--brand-login-from', branding.loginGradientFrom);
  root.style.setProperty('--brand-login-to', branding.loginGradientTo);
  root.style.setProperty('--brand-login-text', branding.loginTextColor);

  // Font family
  if (branding.fontFamily) {
    root.style.setProperty('--brand-font-family', branding.fontFamily);
  }

  // Update favicon if provided
  if (branding.faviconUrl) {
    updateFavicon(branding.faviconUrl);
  }

  // Update document title if brand name provided
  if (branding.brandName && typeof document !== 'undefined') {
    const currentTitle = document.title;
    if (currentTitle.includes('VibraLive') || currentTitle.includes('Groober')) {
      document.title = currentTitle.replace('VibraLive', branding.brandName).replace('Groober', branding.brandName);
    }
  }
}

// Adjust color brightness
function adjustColor(hex: string, factor: number): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  if (factor > 0) {
    // Lighten: mix with white
    r = Math.round(r + (255 - r) * factor);
    g = Math.round(g + (255 - g) * factor);
    b = Math.round(b + (255 - b) * factor);
  } else {
    // Darken: multiply
    r = Math.round(r * (1 + factor));
    g = Math.round(g * (1 + factor));
    b = Math.round(b * (1 + factor));
  }
  
  // Clamp values
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Update favicon
function updateFavicon(url: string) {
  if (typeof document === 'undefined') return;
  
  let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = url;
}

// Hook to get CSS variable styles for inline use
export function useBrandingStyles() {
  const { branding } = useBranding();
  
  return {
    primary: branding?.primaryColor || '#0ea5e9',
    loginGradient: `linear-gradient(to bottom, ${branding?.loginGradientFrom || '#2563eb'}, ${branding?.loginGradientTo || '#1d4ed8'})`,
    loginTextColor: branding?.loginTextColor || '#ffffff',
    fontFamily: branding?.fontFamily || 'Inter',
    brandName: branding?.brandName || 'Groober',
    tagline: branding?.tagline || 'Motor de Retención Veterinario',
    logoUrl: branding?.logoUrl,
    logoDarkUrl: branding?.logoDarkUrl,
    features: branding?.features,
  };
}
