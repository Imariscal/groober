'use client';

import { ReactNode } from 'react';
import { DynamicSidebar } from './DynamicSidebar';
import { DashboardHeader } from './DashboardHeader';

interface ProtectedLayoutProps {
  children: ReactNode;
  title?: string;
}

/**
 * Layout para páginas protegidas
 * Incluye sidebar dinámico + header
 */
export function ProtectedPageLayout({
  children,
  title,
}: ProtectedLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <DashboardHeader title={title} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <DynamicSidebar />

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
