'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItemProps {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  onClick?: () => void;
}

export function SidebarItem({
  label,
  href,
  icon,
  badge,
  onClick,
}: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        relative px-4 py-2.5 mx-2 rounded-lg flex items-center gap-3
        text-sm font-medium transition-all duration-200
        group
        ${
          isActive
            ? 'bg-primary-100 text-primary-700'
            : 'text-slate-700 hover:bg-slate-100'
        }
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50
      `}
    >
      {/* Animated left indicator (pill style) */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-full"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}

      {/* Icon */}
      {icon && <span className="w-5 h-5 flex-shrink-0">{icon}</span>}

      {/* Label */}
      <span className="flex-1 truncate">{label}</span>

      {/* Badge */}
      {badge && (
        <span className="flex-shrink-0 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-500 text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

interface SidebarGroupProps {
  title?: string;
  items: SidebarItemProps[];
  collapsible?: false;
  isExpanded?: boolean;
}

interface CollapsibleSidebarGroupProps {
  title: string;
  items: SidebarItemProps[];
  collapsible: true;
  isExpanded: boolean;
  onToggle: () => void;
}

type SidebarGroupPropType = SidebarGroupProps | CollapsibleSidebarGroupProps;

export function SidebarGroup(props: SidebarGroupPropType) {
  const { title, items, collapsible = false } = props;

  if (collapsible && 'onToggle' in props) {
    const { isExpanded, onToggle } = props;

    return (
      <div className="py-2">
        {/* Collapsible Header */}
        <button
          onClick={onToggle}
          className={`
            w-full px-4 py-2 flex items-center justify-between
            text-xs font-semibold text-slate-600 uppercase tracking-wide
            hover:text-slate-900 transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
          `}
        >
          <span>{title}</span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FiChevronDown className="w-4 h-4" />
          </motion.div>
        </button>

        {/* Animated Items List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-1 py-2">
                {items.map((item) => (
                  <SidebarItem key={item.href} {...item} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Non-collapsible group
  return (
    <div className="py-2">
      {title && (
        <p className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {title}
        </p>
      )}
      <div className="space-y-1">
        {items.map((item) => (
          <SidebarItem key={item.href} {...item} />
        ))}
      </div>
    </div>
  );
}

interface SidebarSectionProps {
  id: string;
  title: string;
  groups: Array<{
    title?: string;
    items: SidebarItemProps[];
  }>;
  icon?: React.ReactNode;
  collapsible?: boolean;
}

export function SidebarSection({
  id,
  title,
  groups,
  icon,
  collapsible = true,
}: SidebarSectionProps) {
  const { expandedSections, toggleSection } = useSidebarState();
  const isExpanded = expandedSections[id] !== false;

  if (!collapsible) {
    return (
      <div className="border-b border-slate-200">
        {/* Section Header (non-collapsible) */}
        <div className="px-4 py-3 flex items-center gap-3">
          {icon && <span className="w-5 h-5 text-slate-600">{icon}</span>}
          <h3 className="font-semibold text-sm text-slate-900">{title}</h3>
        </div>

        {/* Groups */}
        <div className="space-y-0">
          {groups.map((group, idx) => (
            <SidebarGroup
              key={idx}
              title={group.title}
              items={group.items}
              collapsible={false}
            />
          ))}
        </div>
      </div>
    );
  }

  // Collapsible section
  return (
    <div className="border-b border-slate-200">
      {/* Section Header (collapsible) */}
      <button
        onClick={() => toggleSection(id)}
        className={`
          w-full px-4 py-3 flex items-center justify-between
          text-sm font-semibold transition-colors
          hover:bg-slate-100 group
          ${isExpanded ? 'text-slate-900' : 'text-slate-700'}
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
        `}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="w-5 h-5 text-slate-600 group-hover:text-slate-900">{icon}</span>}
          <span>{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FiChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Animated Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-0 bg-slate-50">
              {groups.map((group, idx) => (
                <SidebarGroup
                  key={idx}
                  title={group.title}
                  items={group.items}
                  collapsible={false}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Import the hook
import { useSidebarState } from '@/hooks/useSidebarState';
