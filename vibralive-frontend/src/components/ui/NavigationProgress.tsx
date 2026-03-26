'use client';

import React, { useEffect, useState, useTransition, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * NavigationProgress - Muestra una barra de progreso durante la navegación
 * Se activa automáticamente cuando cambia la ruta o hay peticiones HTTP
 */
export const NavigationProgress: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityCountRef = useRef(0);

  // Limpiar recursos
  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  // Completar la barra de progreso
  const completeProgress = useCallback(() => {
    cleanup();
    setIsNavigating(false);
    setProgress(100);
    
    // Fade out después de completar
    const timeout = setTimeout(() => {
      setProgress(0);
      setIsNavigating(false);
    }, 300);
    
    timeoutRef.current = timeout;
  }, [cleanup]);

  // Iniciar progreso
  const startProgress = useCallback(() => {
    activityCountRef.current++;
    setIsNavigating(true);
    setProgress(0);
    cleanup();

    let currentProgress = 0;
    intervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress > 90) {
        currentProgress = 90;
      }
      setProgress(currentProgress);
    }, 100);

    // Timeout de seguridad: cierra la barra después de 15 segundos
    timeoutRef.current = setTimeout(() => {
      completeProgress();
    }, 15000);
  }, [cleanup, completeProgress]);

  // Track navigation changes
  useEffect(() => {
    completeProgress();
  }, [pathname, searchParams, completeProgress]);

  // Monitorear peticiones fetch
  useEffect(() => {
    const originalFetch = window.fetch;
    let activeFetchCount = 0;

    (window as any).fetch = function(
      input: RequestInfo | URL,
      init?: RequestInit
    ) {
      activeFetchCount++;
      
      if (activeFetchCount === 1) {
        startProgress();
      }

      return originalFetch(input, init)
        .then(response => {
          activeFetchCount--;
          if (activeFetchCount === 0) {
            completeProgress();
          }
          return response;
        })
        .catch(error => {
          activeFetchCount--;
          if (activeFetchCount === 0) {
            completeProgress();
          }
          throw error;
        });
    };

    // Restaurar fetch original en cleanup
    return () => {
      (window as any).fetch = originalFetch;
      cleanup();
    };
  }, [startProgress, completeProgress, cleanup]);

  // Listen for click events on links to start progress (fallback)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link) {
        const href = link.getAttribute('href');
        // Only trigger for internal navigation links
        if (href && href.startsWith('/') && !href.startsWith('//')) {
          const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
          
          // Don't show progress if navigating to same page
          if (href !== currentPath && href !== pathname) {
            startProgress();
          }
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname, searchParams, startProgress]);

  if (!isNavigating && progress === 0) {
    return null;
  }

  return (
    <>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-sky-500 via-cyan-400 to-teal-400 transition-all duration-300 ease-out shadow-lg shadow-sky-500/50"
          style={{
            width: `${progress}%`,
            opacity: progress === 100 ? 0 : 1,
            transition: progress === 100 
              ? 'width 200ms ease-out, opacity 300ms ease-out 100ms' 
              : 'width 200ms ease-out',
          }}
        />
      </div>

      {/* Optional: Page Overlay with subtle loading indicator */}
      {isNavigating && progress < 100 && (
        <div className="fixed inset-0 z-[9998] pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] transition-opacity duration-200" />
        </div>
      )}
    </>
  );
};

/**
 * NavigationSpinner - Un spinner alternativo más visible 
 * Usar si prefieres un spinner central en lugar de barra de progreso
 */
export const NavigationSpinner: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/') && !href.startsWith('//') && href !== pathname) {
          setIsNavigating(true);
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  if (!isNavigating) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          {/* Outer ring */}
          <div className="w-12 h-12 rounded-full border-4 border-slate-200" />
          {/* Spinning part */}
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-sky-500 animate-spin" />
        </div>
        <span className="text-sm text-slate-500 font-medium">Cargando...</span>
      </div>
    </div>
  );
};

export default NavigationProgress;
