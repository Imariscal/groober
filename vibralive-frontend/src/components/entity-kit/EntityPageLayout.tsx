'use client';

import React from 'react';
import { PageHeader } from '@/components/dashboard/page-header/PageHeader';
import { PageHeaderConfig } from './types';

export interface EntityPageLayoutProps {
  header: PageHeaderConfig;
  children: React.ReactNode;
}

/**
 * EntityPageLayout
 * Generic page layout wrapper that renders:
 * - Page header (with breadcrumbs, title, primary action)
 * - Main content area
 */
export function EntityPageLayout({ header, children }: EntityPageLayoutProps) {
  return (
    <>
      <PageHeader {...header} />
      <div className="space-y-4">
        {children}
      </div>
    </>
  );
}
