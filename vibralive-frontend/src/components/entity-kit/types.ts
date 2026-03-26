/**
 * Entity Management Kit - Type Definitions
 * Base types for building reusable entity management pages
 */

import { ReactNode } from 'react';
import { IconType } from 'react-icons';

// ============================================================================
// KPI Types
// ============================================================================

export interface KpiItem {
  label: string;
  value: string | number;
  icon: IconType;
  color?: 'primary' | 'success' | 'warning' | 'critical' | 'info';
  tooltip?: string;
}

// ============================================================================
// Toolbar & Filters Types
// ============================================================================

export interface EntityToolbarConfig {
  searchPlaceholder: string;
  enableFilters?: boolean;
  enableSort?: boolean;
  enableViewToggle?: boolean;
  customActions?: EntityAction[];
}

export interface EntityAction {
  id: string;
  label: string;
  icon?: IconType;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export interface FilterOption {
  label: string;
  value: string;
}

// ============================================================================
// Card & Table Column Types
// ============================================================================

export interface EntityField {
  icon?: IconType;
  label?: string;
  value: ReactNode;
}

export interface EntityCardModel {
  id: string;
  title: string;
  subtitle?: string;
  status?: {
    label: string;
    color: 'success' | 'warning' | 'danger' | 'neutral';
  };
  avatar?: {
    text?: string;
    icon?: IconType;
    imageUrl?: string;
  };
  fields: EntityField[];
  actions: {
    icon: IconType;
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }[];
}

export interface ColumnDef<T> {
  key: string;
  label: string;
  accessor: (item: T) => ReactNode;
  width?: string;
  sortable?: boolean;
}

// ============================================================================
// Page Header Types
// ============================================================================

export interface PageHeaderConfig {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  rightActions?: EntityAction[];
}

// ============================================================================
// Main Entity Config Type
// ============================================================================

export interface EntityConfig<T> {
  // Metadata
  entityNameSingular: string;
  entityNamePlural: string;

  // Page header
  pageHeader: PageHeaderConfig;

  // KPIs
  kpis: (data: T[]) => KpiItem[];

  // Card view
  cardAdapter: (item: T) => EntityCardModel;
  renderCard?: (item: T, actions: EntityAction[]) => ReactNode;
  cardComponent?: React.ComponentType<{ data: T; actions: any[] }>;

  // Table view
  tableColumns: ColumnDef<T>[];
  tableComponent?: React.ComponentType<any>;

  // Toolbar
  toolbar: EntityToolbarConfig;

  // Filters (optional)
  filters?: {
    statusOptions?: FilterOption[];
    sortOptions?: Array<{ label: string; value: string }>;
  };

  // Actions
  rowActions?: (item: T, handlers: any) => EntityAction[];
  primaryAction?: EntityAction;

  // View configuration
  defaultViewMode?: 'cards' | 'table';
  supportedViewModes?: ('cards' | 'table')[];
}

// ============================================================================
// Filter & Sort State Types
// ============================================================================

export interface EntityListFilters {
  search: string;
  status?: string;
  [key: string]: any;
}

export interface EntityListState<T> {
  data: T[];
  filteredData: T[];
  isLoading: boolean;
  error: string | null;
  viewMode: 'cards' | 'table';
  filters: EntityListFilters;
  sortBy?: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface EntityPageLayoutProps {
  header: PageHeaderConfig;
  children: ReactNode;
}

export interface KpiCardsProps {
  items: KpiItem[];
  isLoading?: boolean;
}

export interface EntityListProps<T> {
  data: T[];
  viewMode: 'cards' | 'table';
  cardAdapter: (item: T) => EntityCardModel;
  tableColumns: ColumnDef<T>[];
  isLoading?: boolean;
  error?: string | null;
  emptyState?: {
    icon?: IconType;
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
  };
  cardComponent?: React.ComponentType<{ data: T; model: EntityCardModel }>;
  tableComponent?: React.ComponentType<any>;
}

export interface EntityCardProps {
  model: EntityCardModel;
  onClick?: () => void;
}

export interface EntityToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
  onRefresh: () => void;
  config: EntityToolbarConfig;
  customFilters?: ReactNode;
  stats?: {
    total: number;
    filtered: number;
  };
}

// Export a generic type helper for entity pages
export type EntityPageProps<T> = {
  config: EntityConfig<T>;
  data: T[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSearch: (term: string) => void;
  onViewModeChange: (mode: 'cards' | 'table') => void;
  onFilterChange: (filters: EntityListFilters) => void;
  viewMode: 'cards' | 'table';
  filters: EntityListFilters;
  filteredData: T[];
  handlers: {
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    onCreate?: () => void;
    [key: string]: any;
  };
};
