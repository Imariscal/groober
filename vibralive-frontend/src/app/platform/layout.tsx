'use client';

import React, { useState } from 'react';
import { ModernTopBar } from '@/components/dashboard/ModernTopBar';
import { ModernSidebar, MobileSidebarToggle } from '@/components/dashboard/ModernSidebar';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Redirect if not superadmin (only if authenticated)
  React.useEffect(() => {
    if (isAuthenticated && user && user.role !== 'superadmin') {
      router.push('/unauthorized');
    }
  }, [isAuthenticated, user, router]);

  // Detect mobile on mount
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      {!isMobile && <ModernSidebar />}
      {isMobile && (
        <ModernSidebar isMobile isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-60">
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
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
