'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FiChevronRight, FiHome } from 'react-icons/fi';
import Link from 'next/link';

interface Breadcrumb {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
  };
  secondaryActions?: Array<{
    label: string;
    onClick?: () => void;
    icon?: React.ReactNode;
    href?: string;
  }>;
  sticky?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  primaryAction,
  secondaryActions = [],
  sticky = true,
  className = '',
}: PageHeaderProps) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    if (!sticky) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sticky]);

  const stickyClasses = sticky
    ? 'sticky top-0 z-30 border-b backdrop-blur supports-[backdrop-filter]:bg-slate-50/75'
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        ${stickyClasses}
        transition-shadow duration-200
        ${scrolled && sticky ? 'shadow-sm border-slate-200' : 'border-slate-100'}
        bg-white
        ${className}
      `}
    >
      <div className="px-6 lg:px-8 py-3">
        {/* Breadcrumb */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 last:pb-0">
            <Link href="/" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors flex-shrink-0">
              <FiHome className="w-3.5 h-3.5" />
              <span>Inicio</span>
            </Link>

            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <FiChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-xs text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-xs text-slate-700 font-medium whitespace-nowrap">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title & Actions Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Title & Subtitle */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>
            )}
          </div>

          {/* Primary & Secondary Actions */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center flex-shrink-0">
            {/* Secondary Actions */}
            {secondaryActions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className={`
                  flex items-center justify-center gap-1.5 px-3 py-1.5
                  rounded-md text-xs font-medium transition-colors
                  text-slate-600 hover:bg-slate-100 active:bg-slate-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {action.icon}
                {action.label}
              </button>
            ))}

            {/* Primary Action */}
            {primaryAction && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={primaryAction.onClick}
                className={`
                  flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-md
                  font-medium text-xs transition-all focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
                  ${
                    primaryAction.variant === 'danger'
                      ? 'bg-critical-500 hover:bg-critical-600 active:bg-critical-700 text-white focus-visible:ring-critical-500'
                      : primaryAction.variant === 'secondary'
                        ? 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-900 focus-visible:ring-primary-500'
                        : 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white focus-visible:ring-primary-500'
                  }
                `}
              >
                {primaryAction.icon}
                {primaryAction.label}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Preset breadcrumbs factory
 * @example
 * <PageHeader
 *   title="Clients"
 *   breadcrumbs={makeBreadcrumbs('Clients', [{ label: 'Data Management' }])}
 * />
 */
export function makeBreadcrumbs(
  currentPage: string,
  additional: Breadcrumb[] = []
): Breadcrumb[] {
  return [
    { label: 'Dashboard', href: '/dashboard' },
    ...additional,
    { label: currentPage },
  ];
}
