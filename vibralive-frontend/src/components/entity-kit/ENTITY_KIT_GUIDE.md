# Entity Management Kit (EMK) - Complete Guide

## Overview

The Entity Management Kit is a reusable system for building entity management pages with:
- ✅ Common layout (headers, breadcrumbs, titles)
- ✅ KPI cards (any entity type)
- ✅ Search toolbar with filters
- ✅ Dual view modes (cards & table)
- ✅ Smart empty/loading/error states
- ✅ Type-safe generic components
- ✅ Zero copy-paste across entities

## Architecture

```
EntityManagementPage<T>
├── EntityPageLayout (header + breadcrumbs)
├── KpiCards (metric display)
├── EntityToolbar (search + filters + view toggle)
└── EntityList (card/table switcher)
    ├── EntityCard[] (generic card component)
    └── EntityTable (generic table component)
```

## Quick Start: 5-Step Setup for New Entity

### Step 1: Create Entity Config
```typescript
// src/config/yourEntityConfig.ts
import { EntityConfig } from '@/components/entity-kit';
import { YourEntity } from '@/types';

export const yourEntityConfig: EntityConfig<YourEntity> = {
  entityNameSingular: 'Your Entity',
  entityNamePlural: 'Your Entities',

  pageHeader: {
    title: 'Manage Entities',
    subtitle: 'Central management panel',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Entities' },
    ],
    primaryAction: {
      label: 'Create New',
      onClick: () => {}, // Override in page
    },
  },

  // Calculate KPIs from data
  kpis: (data) => [
    {
      label: 'Total',
      value: data.length,
      icon: MdListAlt,
      color: 'primary',
    },
  ],

  // Adapt entity to card model
  cardAdapter: (entity) => ({
    id: entity.id,
    title: entity.name,
    subtitle: `ID: ${entity.id.slice(0, 8)}...`,
    fields: [
      {
        icon: MdPhone,
        label: 'Phone',
        value: entity.phone || '-',
      },
    ],
    actions: [], // Provided by page
  }),

  // Define table columns
  tableColumns: [
    {
      key: 'name',
      label: 'Name',
      accessor: (entity) => entity.name,
    },
    {
      key: 'phone',
      label: 'Phone',
      accessor: (entity) => entity.phone || '-',
    },
  ],

  // Toolbar config
  toolbar: {
    searchPlaceholder: 'Search entities...',
    enableFilters: true,
    enableViewToggle: true,
  },

  // Optional filters
  filters: {
    statusOptions: [
      { label: 'All', value: 'all' },
      { label: 'Active', value: 'ACTIVE' },
    ],
  },
};
```

### Step 2: Create the Page (Minimal Version)
```typescript
// src/app/platform/your-entities/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { YourEntity } from '@/types';
import { EntityManagementPage, EntityAction } from '@/components/entity-kit';
import { yourEntityConfig } from '@/config/yourEntityConfig';
import { fetchYourEntities } from '@/lib/api';

export default function YourEntitiesPage() {
  const [entities, setEntities] = useState<YourEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchYourEntities();
        setEntities(data);
      } catch (err) {
        setError('Failed to load');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Filter
  const filtered = useMemo(() => {
    if (!searchTerm) return entities;
    return entities.filter((e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [entities, searchTerm]);

  return (
    <EntityManagementPage
      config={yourEntityConfig}
      data={entities}
      filteredData={filtered}
      isLoading={isLoading}
      error={error}
      viewMode={viewMode}
      filters={{ search: searchTerm }}
      searchTerm={searchTerm}
      onViewModeChange={setViewMode}
      onSearchChange={setSearchTerm}
      onFilterChange={() => {}}
      onRefresh={() => {}}
      onCreateNew={() => alert('Implement create')}
    />
  );
}
```

### Step 3: Add Row Actions (Optional)
```typescript
const getRowActions = (entity: YourEntity): EntityAction[] => [
  {
    id: 'edit',
    label: 'Edit',
    onClick: () => handleEdit(entity),
  },
  {
    id: 'delete',
    label: 'Delete',
    variant: 'danger',
    onClick: () => handleDelete(entity),
  },
];

// In EntityManagementPage props:
<EntityManagementPage
  ...
  getRowActions={getRowActions}
  onRowActionClick={(action, entity) => {
    switch (action.id) {
      case 'edit': handleEdit(entity); break;
      case 'delete': handleDelete(entity); break;
    }
  }}
/>
```

### Step 4: Add Modals (Optional)
```typescript
// Wrap your existing modals
return (
  <>
    <EntityManagementPage {...props} />
    <CreateEntityModal isOpen={isCreateOpen} ... />
    {selectedEntity && <EditEntityModal ... />}
  </>
);
```

### Step 5: Style & Deploy
- Inherits styles from Clinics (same design system)
- No additional CSS needed
- Supports light/dark modes (via existing theme)

## Component API Reference

### EntityManagementPage<T>

Main orchestrator component.

**Props:**
- `config: EntityConfig<T>` - Entity configuration
- `data: T[]` - Raw data
- `filteredData: T[]` - Filtered/sorted data
- `isLoading?: boolean` - Loading state
- `error?: string | null` - Error message
- `viewMode: 'cards' | 'table'` - Current view
- `filters: EntityListFilters` - Filter state
- `searchTerm: string` - Search query
- `onViewModeChange: (mode) => void` - View mode callback
- `onSearchChange: (term) => void` - Search callback
- `onRefresh: () => void` - Refresh callback
- `onCreateNew: () => void` - Create action callback
- `getRowActions?: (item) => EntityAction[]` - Row actions generator
- `onRowActionClick?: (action, item) => void` - Action handler

### EntityConfig<T>

Configuration contract for an entity type.

**Required Fields:**
- `entityNameSingular: string` - e.g., "Clinic"
- `entityNamePlural: string` - e.g., "Clinics"
- `pageHeader: PageHeaderConfig` - Layout config
- `kpis: (data: T[]) => KpiItem[]` - KPI generator
- `cardAdapter: (item: T) => EntityCardModel` - Card mapper
- `tableColumns: ColumnDef<T>[]` - Table columns

**Optional Fields:**
- `toolbar: EntityToolbarConfig` - Search/filter config
- `filters?: { statusOptions, sortOptions }` - Filter schemas
- `defaultViewMode?: 'cards' | 'table'` - Default view
- `supportedViewModes?: ('cards' | 'table')[]` - Allowed views

### EntityCardModel

Data model for a card item.

```typescript
{
  id: string;
  title: string;
  subtitle?: string;
  status?: { label: string; color: 'success' | 'danger' | ... };
  avatar?: { text?: string; icon?: IconType };
  fields: EntityField[]; // rows with icon + label + value
  actions: { icon, label, onClick, variant }[];
}
```

### ColumnDef<T>

Table column definition.

```typescript
{
  key: string;
  label: string;
  accessor: (item: T) => ReactNode; // Render function
  width?: string;
  sortable?: boolean;
}
```

## Real Example: Clinics

See [ClinicsPage](../../app/platform/clinics/page.tsx) for complete production implementation.

**Key files:**
- Config: [clinicsConfig.ts](../config/clinicsConfig.ts)
- Page: [clinics/page.tsx](../../app/platform/clinics/page.tsx)
- Components: [platform/ClinicsCardView.tsx](../platform/ClinicsCardView.tsx)

## FAQ

**Q: How do I keep existing card/table components?**
A: Pass them as `cardComponent` and `tableComponent` props to EntityManagementPage > EntityList.

**Q: Can I customize loading/empty states?**
A: Yes, use `customEmptyState` prop on EntityManagementPage.

**Q: Does it support pagination?**
A: Add to config.toolbar.customActions + handle in your page.

**Q: TypeScript generics too complex?**
A: Start with the 5-step setup above, it handles all types automatically.

## Migration Path

1. **Phase 1:** Clinics uses EMK (✅ Done)
2. **Phase 2:** Existing entities (Clients, Pets, etc.) adopt EMK
3. **Phase 3:** New entities automatically use EMK pattern
4. **Result:** 0 code duplication, 100% reusability
