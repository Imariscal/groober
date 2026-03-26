'use client';

import React, { useState, ReactNode } from 'react';
import { ModernTopBar } from './ModernTopBar';
import { ModernSidebar, MobileSidebarToggle } from './ModernSidebar';
import { PageHeader, type PageHeaderProps } from './page-header/PageHeader';

interface ModernDashboardLayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  notificationCount?: number;
  pageHeader?: PageHeaderProps;
}

export function ModernDashboardLayout({
  children,
  title,
  breadcrumbs,
  onSearch,
  onNotificationClick,
  ctaLabel,
  ctaHref,
  onCtaClick,
  notificationCount = 0,
  pageHeader,
}: ModernDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
      {!isMobile && (
        <ModernSidebar />
      )}
      
      {isMobile && (
        <ModernSidebar isMobile isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-60">
        {/* Top Bar */}
        <ModernTopBar
          onSearch={onSearch}
          onNotificationClick={onNotificationClick}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
          onCtaClick={onCtaClick}
          notificationCount={notificationCount}
        />

        {/* Mobile Menu Toggle */}
        {isMobile && (
          <div className="h-12 border-b border-slate-200 bg-white px-4 flex items-center gap-2">
            <MobileSidebarToggle
              isOpen={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            />
            {title && <span className="text-sm font-semibold text-slate-900">Groober</span>}
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          {/* Page Header - Using new enterprise component */}
          {pageHeader && (
            <PageHeader {...pageHeader} />
          )}

          <div className={pageHeader ? 'p-6 lg:p-8' : 'p-6 lg:p-8'}>
            {/* Legacy Page Header - Keep for backward compatibility */}
            {!pageHeader && (title || breadcrumbs) && (
              <div className="mb-8">
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    {breadcrumbs.map((crumb, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {index > 0 && <span className="text-slate-400">/</span>}
                        {crumb.href ? (
                          <a
                            href={crumb.href}
                            className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
                          >
                            {crumb.label}
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-slate-600">
                            {crumb.label}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {title && (
                  <h1 className="text-4xl font-bold text-slate-900 leading-tight">
                    {title}
                  </h1>
                )}
              </div>
            )}

            {/* Page Content */}
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
