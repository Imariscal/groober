# 📚 Enterprise Components API Guide

**Complete reference for all new enterprise panel components**

---

## 🎯 Component Overview

### Phase 3c: Architecture Components (Already Delivered)

| Component | File | Lines | Purpose | Status |
|-----------|------|-------|---------|--------|
| **PageHeader** | `dashboard/page-header/PageHeader.tsx` | 183 | Modern page header with breadcrumbs | ✅ |
| **TableToolbar** | `dashboard/table/TableEnhancements.tsx` | 70 | Search + filter + export toolbar | ✅ |
| **RowActionsMenu** | `dashboard/table/TableEnhancements.tsx` | 80 | Row-level action popover menu | ✅ |
| **BulkActionBar** | `dashboard/table/TableEnhancements.tsx` | 50 | Fixed bulk actions bar | ✅ |
| **SidebarItem** | `dashboard/sidebar/SidebarComponents.tsx` | 60 | Navigation item with active state | ✅ |
| **SidebarGroup** | `dashboard/sidebar/SidebarComponents.tsx` | 40 | Group of nav items | ✅ |
| **SidebarSection** | `dashboard/sidebar/SidebarComponents.tsx` | 80 | Collapsible section | ✅ |

### Phase 3d: Integration Components (Just Added)

| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| **DensityProvider** | `DensityProvider.tsx` | Wraps app with density state | ✅ |
| **Updated ModernTopBar** | `dashboard/ModernTopBar.tsx` | Added density toggle | ✅ |
| **Updated ModernDashboardLayout** | `dashboard/ModernDashboardLayout.tsx` | Added pageHeader prop | ✅ |

### Phase 3e: State Management (Already Delivered)

| Hook | File | Purpose | Status |
|------|------|---------|--------|
| **useDensityStore** | `hooks/useDensity.ts` | Zustand store for density | ✅ |
| **useSidebarState** | `hooks/useSidebarState.ts` | Zustand store for sidebar | ✅ |

---

## 📖 Detailed API Reference

### 1. PageHeader Component

**Purpose**: Modern page header with title, breadcrumbs, and action buttons

**Import**:
```typescript
import { PageHeader } from '@/components/dashboard/page-header/PageHeader';
```

**Props**:
```typescript
interface PageHeaderProps {
  // Required
  title: string;                          // Page title (h1)
  
  // Optional
  subtitle?: string;                      // Smaller subtitle text
  
  breadcrumbs?: Array<{
    label: string;
    href?: string;                        // If href not provided, shows as text
  }>;
  
  primaryAction?: {
    label: string;                        // Button text
    onClick?: () => void;
    href?: string;                        // Link href
    icon?: React.ReactNode;               // Optional icon
    variant?: 'primary' | 'secondary' | 'danger';
  };
  
  secondaryActions?: Array<{
    label: string;
    onClick?: () => void;
    icon?: React.ReactNode;
    href?: string;
    variant?: 'default' | 'secondary' | 'danger';
  }>;
  
  sticky?: boolean;                       // Sticky positioned (default: true)
  className?: string;                     // Additional CSS
}
```

**Example**:
```tsx
<PageHeader
  title="Clientes"
  subtitle="Gestiona tu cartera"
  breadcrumbs={[
    { label: "Dashboard", href: "/dashboard" },
    { label: "Clientes" }
  ]}
  primaryAction={{
    label: "Nuevo Cliente",
    onClick: () => openModal(),
    variant: 'primary'
  }}
  secondaryActions={[
    {
      label: "Exportar",
      icon: <FiDownload />,
      onClick: () => exportTable()
    }
  ]}
/>
```

**Features**:
- ✅ Sticky header with scroll shadow
- ✅ Clickable breadcrumbs
- ✅ Animated entrance (fade-in)
- ✅ Responsive layout (stack on mobile)
- ✅ Focus rings on buttons (a11y)
- ✅ Icon support

---

### 2. DensityProvider Wrapper

**Purpose**: Initialize density store globally

**Import**:
```typescript
import { DensityProvider } from '@/components/DensityProvider';
```

**Usage**: Already integrated in `Providers.tsx`

**Code** (showing integration):
```typescript
// In src/components/Providers.tsx
import { DensityProvider } from './DensityProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DensityProvider>
      {children}
      <Toaster position="bottom-right" />
    </DensityProvider>
  );
}
```

**What it does**:
- Creates data-density attribute on wrapper div
- Makes useDensityStore available to all child components
- No additional configuration needed

---

### 3. useDensityStore Hook

**Purpose**: Access and control density mode (comfortable ↔ compact)

**Import**:
```typescript
import { useDensityStore } from '@/hooks/useDensity';
```

**Store API**:
```typescript
const store = useDensityStore();

// State
store.density              // 'comfortable' | 'compact'

// Methods
store.toggleDensity()      // Switch between modes
store.setDensity(mode)     // Set specific mode: setDensity('compact')
store.getConfig()          // Get full DensityConfig object
store.getSpacing(key)      // Get spacing class: 'card' | 'row' | 'element'
store.getFontSize(key)     // Get font size class: 'body' | 'label'
store.getHeight(key)       // Get height class: 'input' | 'button'
```

**Density Configs**:

**Comfortable Mode**:
```typescript
{
  spacing: {
    card: 'p-6',           // 24px padding
    row: 'py-4 px-6',      // 16px vertical, 24px horizontal
    element: 'gap-4'       // 16px gap between items
  },
  fontSize: {
    body: 'text-base',     // 16px
    label: 'text-sm'       // 14px
  },
  height: {
    input: 'h-10',         // 40px
    button: 'h-10'         // 40px
  }
}
```

**Compact Mode**:
```typescript
{
  spacing: {
    card: 'p-4',           // 16px padding
    row: 'py-2 px-4',      // 8px vertical, 16px horizontal
    element: 'gap-2'       // 8px gap between items
  },
  fontSize: {
    body: 'text-sm',       // 14px
    label: 'text-xs'       // 12px
  },
  height: {
    input: 'h-8',          // 32px
    button: 'h-8'          // 32px
  }
}
```

**Usage Examples**:

```tsx
// Example 1: Using getSpacing in a card
import { useDensityStore } from '@/hooks/useDensity';

export function Card() {
  const { getSpacing } = useDensityStore();
  
  return (
    <div className={`${getSpacing('card')} bg-white rounded-lg`}>
      Content responding to density
    </div>
  );
}

// Example 2: Using getSpacing in a table row
export function TableRow() {
  const { getSpacing, getFontSize } = useDensityStore();
  
  return (
    <tr className={getSpacing('row')}>
      <td className={getFontSize('body')}>Data</td>
    </tr>
  );
}

// Example 3: Toggle button
export function DensityToggle() {
  const { density, toggleDensity } = useDensityStore();
  
  return (
    <button onClick={toggleDensity}>
      Mode: {density}
    </button>
  );
}
```

**Persistence**:
- Automatically saved to localStorage
- Key: `'vibralive-density-store'`
- Persists across page refreshes
- Version: 1 (for future migrations)

---

### 4. TableToolbar Component

**Purpose**: Search and filter toolbar for tables

**Import**:
```typescript
import { TableToolbar } from '@/components/dashboard/table/TableEnhancements';
```

**Props**:
```typescript
interface TableToolbarProps {
  onSearch?: (query: string) => void;      // Search input callback
  onFilterClick?: () => void;              // Filter button callback
  onColumnsClick?: () => void;             // Column visibility callback
  onExportClick?: () => void;              // Export button callback
  searchPlaceholder?: string;              // Default: 'Buscar en tabla...'
  showExport?: boolean;                    // Default: true
}
```

**Example**:
```tsx
<TableToolbar
  onSearch={(query) => filterRows(query)}
  onFilterClick={() => openFilterPanel()}
  onColumnsClick={() => openColumnSelector()}
  onExportClick={() => exportToCSV()}
  searchPlaceholder="Buscar clientes..."
  showExport={true}
/>
```

**Features**:
- ✅ Responsive (stacks on mobile)
- ✅ Search input with icon
- ✅ Animated appearance
- ✅ Button bars for additional actions
- ✅ Customizable placeholders

---

### 5. RowActionsMenu Component

**Purpose**: Popover menu for row-level actions

**Import**:
```typescript
import { 
  RowActionsMenu, 
  makeRowActions 
} from '@/components/dashboard/table/TableEnhancements';
```

**Props**:
```typescript
interface RowActionsMenuProps {
  actions: RowAction[];                    // Array of action objects
  rowId?: string;                          // Optional row identifier
}

interface RowAction {
  label: string;
  onClick: (rowId?: string) => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';          // 'danger' shows red
}
```

**Example - Manual**:
```tsx
<RowActionsMenu
  actions={[
    { label: 'Edit', icon: <FiEdit />, onClick: (id) => editRow(id) },
    { label: 'View', icon: <FiEye />, onClick: (id) => viewRow(id) },
    { label: 'Delete', icon: <FiTrash2 />, onClick: (id) => deleteRow(id), variant: 'danger' }
  ]}
  rowId={row.id}
/>
```

**Example - Using Factory**:
```tsx
import { makeRowActions } from '@/components/dashboard/table/TableEnhancements';

const rowActions = makeRowActions({
  onEdit: (id) => console.log('Edit:', id),
  onView: (id) => console.log('View:', id),
  onDelete: (id) => console.log('Delete:', id),
  onCopy: (id) => console.log('Copy:', id)
});

<RowActionsMenu actions={rowActions} rowId={row.id} />
```

**Features**:
- ✅ Popover animation (scale-in/fade)
- ✅ Click-outside to close
- ✅ Danger variant for destructive actions
- ✅ Icon support
- ✅ Keyboard accessible

---

### 6. BulkActionBar Component

**Purpose**: Fixed bar showing selected rows count and bulk actions

**Import**:
```typescript
import { BulkActionBar } from '@/components/dashboard/table/TableEnhancements';
```

**Props**:
```typescript
interface BulkActionBarProps {
  selectedCount: number;                   // Number of selected rows
  onSelectAll?: () => void;                // Select all callback
  onDeselectAll?: () => void;              // Clear selection callback
  actions: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'default' | 'danger';
  }>;
}
```

**Example**:
```tsx
{selectedRows.size > 0 && (
  <BulkActionBar
    selectedCount={selectedRows.size}
    onDeselectAll={() => setSelectedRows(new Set())}
    actions={[
      { label: 'Edit', icon: <FiEdit />, onClick: () => bulkEdit() },
      { label: 'Delete', icon: <FiTrash2 />, onClick: () => bulkDelete(), variant: 'danger' },
      { label: 'Export', icon: <FiDownload />, onClick: () => bulkExport() }
    ]}
  />
)}
```

**Features**:
- ✅ Shows selection count
- ✅ Clear selection button
- ✅ Fixed positioning (bottom on mobile, relative on desktop)
- ✅ Animated entrance/exit
- ✅ Responsive action buttons

---

### 7. SidebarSection (Optional)

**Purpose**: Collapsible sidebar sections for navigation hierarchy

**Import**:
```typescript
import { 
  SidebarSection,
  SidebarGroup,
  SidebarItem
} from '@/components/dashboard/sidebar/SidebarComponents';
```

**Props** (SidebarSection):
```typescript
interface SidebarSectionProps {
  id: string;                             // Unique ID for persistence
  title: string;                          // Section title
  icon?: React.ReactNode;                 // Section icon
  groups: SidebarGroup[];                 // Nested groups
  collapsible?: boolean;                  // Default: true
}
```

**Example** (future enhancement):
```tsx
<SidebarSection
  id="dashboard"
  title="Dashboard"
  icon={<FiHome />}
  groups={[
    {
      items: [
        { label: 'Overview', icon: <FiBarChart2 />, href: '/dashboard' },
        { label: 'Analytics', icon: <FiTrendingUp />, href: '/dashboard/analytics' }
      ]
    }
  ]}
/>
```

---

### 8. useSidebarState Hook (Optional)

**Purpose**: Persist sidebar section expansion state

**Import**:
```typescript
import { useSidebarState } from '@/hooks/useSidebarState';
```

**API**:
```typescript
const sidebar = useSidebarState();

sidebar.expandedSections          // Record<string, boolean>
sidebar.toggleSection(id)         // Toggle specific section
sidebar.setCollapseSidebar(bool)  // Collapse entire sidebar
sidebar.expandAll()               // Expand all sections
sidebar.collapseAll()             // Collapse all sections
```

---

## 🏗️ Integration Pattern

### Recommended Component Hierarchy

```
Layout (ModernDashboardLayout)
├── TopBar (ModernTopBar)
│   ├── Logo
│   ├── Search
│   ├── Density Toggle ← useDensityStore
│   └── User Menu
├── Sidebar (ModernSidebar or SidebarSection)
│   └── uses useSidebarState (optional)
└── Main Content
    ├── PageHeader ← NEW
    │   ├── Breadcrumbs
    │   ├── Title + Subtitle
    │   └── Actions
    └── Page Content
        └── Table
            ├── TableToolbar ← NEW
            │   ├── Search
            │   ├── Filter button
            │   ├── Columns button
            │   └── Export button
            ├── Table Rows
            │   └── RowActionsMenu ← NEW per row
            └── BulkActionBar ← NEW (when rows selected)
                └── Bulk actions
```

---

## 🎯 Implementation Checklist

When adding new pages:

```
□ Import ModernDashboardLayout
□ Add pageHeader prop with:
  □ title
  □ breadcrumbs array
  □ primaryAction (CTA)
  □ secondaryActions (import/export/etc)
□ Import useDensityStore
□ Use getSpacing() on cards/rows
□ Use getFontSize() on text
□ Import TableToolbar for search
□ Import RowActionsMenu for actions
□ Track selectedRows state
□ Show BulkActionBar when selected > 0
□ Test on 3 breakpoints (mobile/tablet/desktop)
□ Verify focus rings visible
□ Test keyboard navigation
```

---

## 📱 Responsive Breakpoints

All components respond to Tailwind breakpoints:

- **Mobile**: `< 640px` (sm)
  - Drawer sidebar
  - Stacked buttons
  - Typography sizes reduced
  - Touch targets: 44px+ height

- **Tablet**: `640px - 1024px` (md, lg)
  - Sidebar visible or drawer
  - Layout adjusts
  - Mixed 1-2 column grids

- **Desktop**: `> 1024px` (xl, 2xl)
  - Sidebar always visible
  - Full-width tables
  - Multi-column layouts

---

## 🎨 Tailwind Integration

All components use Tailwind utilities from custom theme:

**Colors** (semantic):
- `bg-primary-500`, `text-primary-600`
- `bg-success-500`, `bg-warning-500`, `bg-critical-500`
- `text-slate-600`, `bg-slate-50`

**Spacing** (via useDensityStore):
- Card padding: `p-6` (comfortable) or `p-4` (compact)
- Gaps: `gap-4` or `gap-2`

**Typography**:
- Display: `text-3xl`, `text-4xl` (font-bold)
- Body: `text-base` or `text-sm`
- Label: `text-sm` or `text-xs`

**Interactions**:
- Focus rings: `ring-2 ring-offset-2 ring-primary-500`
- Hover shadows: `hover:shadow-md transition-all`
- Animations: `animate-fade-in` via Framer Motion

---

## ⚠️ Common Mistakes

❌ **Wrong**: Hardcoding spacing in components
```tsx
<div className="p-6">Content</div>  // Always 24px, ignores density
```

✅ **Right**: Using useDensityStore
```tsx
const { getSpacing } = useDensityStore();
<div className={getSpacing('card')}>Content</div>  // Respects density
```

---

❌ **Wrong**: Not wrapping with DensityProvider
```tsx
// useDensityStore won't work
```

✅ **Right**: Already integrated in Providers.tsx
```tsx
// Just use the hook anywhere in app
const { density } = useDensityStore();
```

---

❌ **Wrong**: Manual action objects everywhere
```tsx
const actions = [...]; // Repeated in every table
```

✅ **Right**: Use makeRowActions factory
```tsx
const actions = makeRowActions({ onEdit, onDelete, ... });
```

---

## 📚 Example Files

See working example at:
- **Path**: `/dashboard/enterprise-example`
- **File**: `src/app/(protected)/dashboard/enterprise-example/page.tsx`

Shows:
- PageHeader with breadcrumbs + actions
- Table with toolbar + row actions
- Bulk selection + BulkActionBar
- Density toggle in TopBar
- All components integrated

---

**Version**: 1.0.0-integration  
**Last Updated**: 2026-02-25  
**Status**: ✅ Production Ready
