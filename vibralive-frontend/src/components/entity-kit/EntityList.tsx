'use client';

import React from 'react';
import { MdError } from 'react-icons/md';
import { EntityCard } from './EntityCard';
import { EntityTable } from './EntityTable';
import { EntityCardModel, ColumnDef, EntityAction } from './types';

export interface EntityListProps<T extends { id: string }> {
  data: T[];
  viewMode: 'cards' | 'table';
  cardAdapter: (item: T) => EntityCardModel;
  tableColumns: ColumnDef<T>[];
  isLoading?: boolean;
  error?: string | null;
  emptyState?: {
    icon?: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
  };
  rowActions?: (row: T) => EntityAction[];
  onRowActionClick?: (action: EntityAction, row: T) => void;
  onCardActionClick?: (action: EntityAction, row: T) => void;
  // Custom rendering - if provided, these override the default rendering
  renderCard?: (item: T, actions: EntityAction[]) => React.ReactNode;
  cardComponent?: React.ComponentType<any>;
  tableComponent?: React.ComponentType<any>;
}

/**
 * EntityList
 * Smart list component that switches between card and table views
 * Handles loading, error, and empty states
 */
export function EntityList<T extends { id: string }>({
  data,
  viewMode,
  cardAdapter,
  tableColumns,
  isLoading = false,
  error,
  emptyState,
  rowActions,
  onRowActionClick,
  onCardActionClick,
  renderCard,
  cardComponent: CardComponent,
  tableComponent: TableComponent,
}: EntityListProps<T>) {
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <MdError className="w-16 h-16 text-red-400" />
          <div className="text-center">
            <p className="text-gray-900 font-semibold">Error al cargar datos</p>
            <p className="text-gray-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    const defaultEmptyState = {
      title: 'Sin registros',
      description: 'No hay datos para mostrar en este momento',
      icon: undefined as any,
      action: undefined,
    };
    const state = emptyState || defaultEmptyState;
    const Icon = state.icon;

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {Icon && <Icon className="w-16 h-16 text-gray-300" />}
          <div>
            <p className="text-gray-900 font-semibold">{state.title}</p>
            <p className="text-gray-600 text-sm mt-1">{state.description}</p>
          </div>
          {state.action && (
            <button
              onClick={state.action.onClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium mt-4"
            >
              {state.action.label}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Card view
  if (viewMode === 'cards') {
    // Use custom renderCard function if provided (for entity-specific rendering)
    if (renderCard) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.map((item) => {
            const actions: EntityAction[] = rowActions ? rowActions(item) : [];
            return (
              <div key={item.id} onClick={() => {
                // Allow action handling if needed
              }}>
                {renderCard(item, actions)}
              </div>
            );
          })}
        </div>
      );
    }

    // Use custom card component if provided (for backward compatibility with existing card views)
    if (CardComponent) {
      return (
        <CardComponent
          data={data}
          onEdit={onCardActionClick ? (item: T) => onCardActionClick?.({ id: 'edit', label: 'Editar', onClick: () => {} }, item) : undefined}
          onSuspend={onCardActionClick ? (item: T) => onCardActionClick?.({ id: 'suspend', label: 'Suspender', onClick: () => {} }, item) : undefined}
          onAssignOwner={onCardActionClick ? (item: T) => onCardActionClick?.({ id: 'assign-owner', label: 'Asignar Dueño', onClick: () => {} }, item) : undefined}
          onRefresh={undefined}
        />
      );
    }

    // Default generic card rendering
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.map((item) => {
          const model = cardAdapter(item);
          const actions: EntityAction[] = rowActions
            ? rowActions(item)
            : (model.actions as unknown as EntityAction[]);

          return (
            <EntityCard
              key={item.id}
              model={model}
              actions={actions}
              onActionClick={(action) => onCardActionClick?.(action, item)}
            />
          );
        })}
      </div>
    );
  }

  // Table view
  // Use custom table component if provided
  if (TableComponent) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <TableComponent
          data={data}
          onEdit={onRowActionClick ? (item: T) => onRowActionClick?.({ id: 'edit', label: 'Editar', onClick: () => {} }, item) : undefined}
          onDeactivate={onRowActionClick ? (item: T) => onRowActionClick?.({ id: 'deactivate', label: 'Desactivar', onClick: () => {} }, item) : undefined}
          onDelete={onRowActionClick ? (item: T) => onRowActionClick?.({ id: 'delete', label: 'Eliminar', onClick: () => {} }, item) : undefined}
          onSuspend={onRowActionClick ? (item: T) => onRowActionClick?.({ id: 'suspend', label: 'Suspender', onClick: () => {} }, item) : undefined}
          onAssignOwner={onRowActionClick ? (item: T) => onRowActionClick?.({ id: 'assign-owner', label: 'Asignar Dueño', onClick: () => {} }, item) : undefined}
          onRefresh={undefined}
        />
      </div>
    );
  }

  // Default generic table rendering
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <EntityTable
        data={data}
        columns={tableColumns}
        rowActions={rowActions}
        onRowActionClick={onRowActionClick}
      />
    </div>
  );
}
