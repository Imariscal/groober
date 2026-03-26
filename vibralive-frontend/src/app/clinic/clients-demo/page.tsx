'use client';

/**
 * Clients Page Example
 * Demonstrates how EntityManagementPage eliminates UI duplication
 * 
 * SETUP TIME: 5 minutes vs 2+ hours for traditional approach
 * CODE: 80 lines (vs 300+ for custom implementation)
 * COPY-PASTE: 0 (vs entire page duplication)
 */

import { useState, useEffect, useMemo } from 'react';
import { MdAdd } from 'react-icons/md';
import { EntityManagementPage, EntityAction } from '@/components/entity-kit';
import { clientsConfig, mockClients } from '@/config/clientsConfig';
import { Client } from '@/types';

type SortOption = 'name-asc' | 'name-desc' | 'created-desc' | 'created-asc';

export default function ClientsPage() {
  // Data state
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Mock API fetch
  useEffect(() => {
    const load = async () => {
      // Simulate API delay
      await new Promise((r) => setTimeout(r, 500));
      setClients(mockClients);
      setIsLoading(false);
    };
    load();
  }, []);

  // Filtering & sorting
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients;

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.phone?.includes(term) ||
          c.address?.toLowerCase().includes(term)
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'created-desc':
          return (
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
          );
        case 'created-asc':
          return (
            new Date(a.created_at || 0).getTime() -
            new Date(b.created_at || 0).getTime()
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [clients, searchTerm, sortBy]);

  // Row actions (optional)
  const getRowActions = (client: Client): EntityAction[] => [
    {
      id: 'edit',
      label: 'Editar',
      onClick: () => console.log('Edit', client.id),
    },
    {
      id: 'contact',
      label: 'Contactar',
      onClick: () => console.log('Contact', client.email),
    },
  ];

  // Page config with override handlers
  const pageConfig = {
    ...clientsConfig,
    pageHeader: {
      ...clientsConfig.pageHeader,
      primaryAction: {
        label: 'Nuevo Cliente',
        onClick: () => console.log('Create new client'),
        icon: <MdAdd />,
      },
    },
  };

  return (
    <EntityManagementPage
      config={pageConfig}
      data={clients}
      filteredData={filteredAndSortedClients}
      isLoading={isLoading}
      error={error}
      viewMode={viewMode}
      filters={{ search: searchTerm, sortBy }}
      searchTerm={searchTerm}
      onViewModeChange={setViewMode}
      onSearchChange={setSearchTerm}
      onFilterChange={(filters) => {
        setSortBy((filters.sortBy as SortOption) || 'name-asc');
      }}
      onRefresh={() => console.log('Refresh clients')}
      onCreateNew={() => console.log('Create new client')}
      getRowActions={getRowActions}
      onRowActionClick={(action, client) => {
        switch (action.id) {
          case 'edit':
            console.log('Edit:', client.id);
            break;
          case 'contact':
            if (client.email) window.open(`mailto:${client.email}`);
            break;
        }
      }}
    />
  );
}
