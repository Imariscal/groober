'use client';

import React, { useMemo } from 'react';
import { EntityPageLayout } from './EntityPageLayout';
import { KpiCards } from './KpiCards';
import { EntityToolbar } from './EntityToolbar';
import { EntityList } from './EntityList';
import {
  EntityConfig,
  EntityListFilters,
  EntityCardModel,
  EntityAction,
} from './types';

export interface EntityManagementPageProps<T extends { id: string }> {
  // Configuration
  config: EntityConfig<T>;

  // Data
  data: T[];
  filteredData: T[];
  isLoading?: boolean;
  error?: string | null;

  // State
  viewMode: 'cards' | 'table';
  filters: EntityListFilters;
  searchTerm: string;

  // Handlers
  onViewModeChange: (mode: 'cards' | 'table') => void;
  onSearchChange: (term: string) => void;
  onFilterChange: (filters: EntityListFilters) => void;
  onRefresh: () => void;
  onCreateNew: () => void;

  // Actions
  getRowActions?: (item: T) => EntityAction[];
  onRowActionClick?: (action: EntityAction, item: T) => void;
  onCardActionClick?: (action: EntityAction, item: T) => void;

  // Custom components (for backward compatibility)
  cardComponent?: React.ComponentType<any>;
  tableComponent?: React.ComponentType<any>;

  // Custom empty state
  customEmptyState?: {
    title: string;
    description: string;
    actionLabel?: string;
  };
}

/**
 * EntityManagementPage<T>
 * Generic management page that orchestrates:
 * - Page layout (header with breadcrumbs and title)
 * - KPI cards
 * - Toolbar (search, filters, view toggle)
 * - List (cards or table view with smart state handling)
 *
 * This is the main composition component that ties together all entity-kit pieces
 */
export function EntityManagementPage<T extends { id: string }>({
  config,
  data,
  filteredData,
  isLoading = false,
  error = null,
  viewMode,
  filters,
  searchTerm,
  onViewModeChange,
  onSearchChange,
  onFilterChange,
  onRefresh,
  onCreateNew,
  getRowActions,
  onRowActionClick,
  onCardActionClick,
  cardComponent,
  tableComponent,
  customEmptyState,
}: EntityManagementPageProps<T>) {
  // Calculate KPIs from data
  const kpis = useMemo(() => {
    return config.kpis(data);
  }, [data, config]);

  // Build custom page header with actual click handlers
  const pageHeader = useMemo(() => {
    return {
      ...config.pageHeader,
      primaryAction: config.pageHeader.primaryAction
        ? {
            ...config.pageHeader.primaryAction,
            onClick: onCreateNew,
          }
        : undefined,
    };
  }, [config.pageHeader, onCreateNew]);

  // Prepare empty state
  const emptyState = {
    title: customEmptyState?.title || `Sin ${config.entityNamePlural.toLowerCase()}`,
    description:
      customEmptyState?.description ||
      `No hay ${config.entityNamePlural.toLowerCase()} registradas en este momento.`,
    action: {
      label: customEmptyState?.actionLabel || `Crear ${config.entityNameSingular}`,
      onClick: onCreateNew,
    },
  };

  // Statistics for toolbar
  const stats = {
    total: data.length,
    filtered: filteredData.length,
  };

  return (
    <EntityPageLayout header={pageHeader}>
      {/* KPI Cards */}
      <KpiCards items={kpis} isLoading={isLoading} />

      {/* Toolbar */}
      {!isLoading && !error && (
        <EntityToolbar
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          onRefresh={onRefresh}
          config={config.toolbar}
          stats={stats}
          isLoading={isLoading}
          sortOptions={config.filters?.sortOptions}
          sortValue={filters.sortBy}
          onSortChange={(value) => onFilterChange({ ...filters, sortBy: value })}
        />
      )}

      {/* Content List */}
      <EntityList
        data={filteredData}
        viewMode={viewMode}
        cardAdapter={config.cardAdapter}
        renderCard={config.renderCard}
        tableColumns={config.tableColumns}
        isLoading={isLoading}
        error={error}
        emptyState={emptyState}
        rowActions={getRowActions}
        onRowActionClick={onRowActionClick}
        onCardActionClick={onCardActionClick}
        cardComponent={cardComponent}
        tableComponent={tableComponent}
      />
    </EntityPageLayout>
  );
}
