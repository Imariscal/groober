'use client';

import React, { useState, Suspense } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ModernTopBar } from '@/components/dashboard/ModernTopBar';
import { ModernSidebar, MobileSidebarToggle } from '@/components/dashboard/ModernSidebar';
import { NavigationProgress } from '@/components/ui/NavigationProgress';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { SidebarProvider, useSidebarCollapsed } from '@/contexts/SidebarContext';

function ProtectedLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isCollapsed } = useSidebarCollapsed();

  // Detect mobile on mount
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calcular margen dinámico
  const mainMargin = isMobile ? 'ml-0' : isCollapsed ? 'ml-20' : 'ml-60';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      {!isMobile && <ModernSidebar />}
      {isMobile && (
        <ModernSidebar isMobile isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${mainMargin}`}>
        {/* Top Bar */}
        <ModernTopBar />

        {/* Mobile Menu Toggle */}
        {isMobile && (
          <div className="h-12 border-b border-slate-200 bg-white px-4 flex items-center gap-2">
            <MobileSidebarToggle
              isOpen={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            />
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <BrandingProvider>
        <SidebarProvider>
          {/* Navigation Progress Indicator */}
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>

          <ProtectedLayoutInner>{children}</ProtectedLayoutInner>
        </SidebarProvider>
      </BrandingProvider>
    </ProtectedRoute>
  );
}
