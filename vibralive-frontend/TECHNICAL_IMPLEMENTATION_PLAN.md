# 🔧 Technical Implementation Roadmap

**Phase 1**: Foundation (Week 1)  
**Phase 2**: Advanced Features (Week 2-3)  
**Phase 3**: Polish & Testing (Week 4)

---

## (B) 📐 Technical Plan by File

### **PHASE 1: FOUNDATION (Weeks 1)**

#### **NEW Files to Create**

##### **1. PageHeader System** 
**Path**: `src/components/dashboard/page-header/`

```
page-header/
├── PageHeader.tsx          (main container, sticky)
├── PageTitle.tsx           (h1 + subtitle)
├── PageBreadcrumb.tsx      (navigation crumbs)
├── PageActions.tsx         (primary CTA group)
├── PageDateFilter.tsx      (optional: date range selector)
└── index.ts                (exports)
```

**Responsibilities**:
- `PageHeader`: Grid layout (breadcrumb | title | actions), sticky positioning, shadow on scroll
- `PageTitle`: Display + MD title, subtitle text
- `PageBreadcrumb`: Home > Module > Page, clickable links
- `PageActions`: Primary CTA button + secondary dropdown
- `PageDateFilter`: Optional date range + preset buttons (Last 7 days, Month, etc)

---

##### **2. Sidebar Enhancement**
**Path**: `src/components/dashboard/sidebar/` (refactor existing)

```
sidebar/
├── ModernSidebar.tsx       (container, USE EXISTING but enhance)
├── SidebarSection.tsx      (NEW: collapsible section)
├── SidebarGroup.tsx        (NEW: group header + items)
├── SidebarItem.tsx         (NEW: single navigation link)
├── sidebar-state.ts        (NEW: zustand store)
└── index.ts
```

**Responsibilities**:
- `SidebarSection`: Wrapper for related groups (Dashboard, Data, Admin), collapsible
- `SidebarGroup`: Title + list of items, transition animation
- `SidebarItem`: Link with active state (pill style), icon, badge count
- `sidebar-state.ts`: Store expanded sections state in localStorage

---

##### **3. Table Enhancements**
**Path**: `src/components/dashboard/table/`

```
table/
├── TableContainer.tsx      (NEW: sticky header wrapper)
├── TableToolbar.tsx        (NEW: search + filters + columns)
├── RowActionsMenu.tsx      (NEW: overflow menu)
├── BulkActionBar.tsx       (NEW: visible when rows selected)
├── TableCell.tsx           (enhancement: density support)
└── index.ts
```

**Responsibilities**:
- `TableContainer`: Flex container with sticky header
- `TableToolbar`: Search input + filter buttons + column visibility dropdown
- `RowActionsMenu`: Popover with Edit, Delete, View actions
- `BulkActionBar`: Fixed bottom bar showing "X rows selected" + bulk actions
- `TableCell`: Apply density padding/size

---

##### **4. Density System**
**Path**: `src/context/density-context.ts` + `src/hooks/use-density.ts`

```
system/
├── density-context.ts      (NEW: DensityProvider + context)
├── density-store.ts        (NEW: zustand store)
├── density-config.ts       (NEW: token mappings)
└── use-density.ts          (NEW: custom hook)
```

**Responsibilities**:
- `density-context.ts`: React Context Provider for density
- `density-store.ts`: Zustand store with localStorage persistence
- `density-config.ts`: Map density → spacing/size values
- `use-density.ts`: Hook to access density + toggleFunction

---

#### **MODIFIED Files (Phase 1)**

| File | Changes | Reason |
|------|---------|--------|
| `ModernDashboardLayout.tsx` | Add PageHeader slot | Expose title/breadcrumb/actions |
| `tailwind.config.js` | Already done ✓ | No changes needed |
| `src/app/(protected)/dashboard/page.tsx` | Integrate PageHeader | Show new structure |
| `ModernTopBar.tsx` | No changes | Keep as is |
| `src/components/Providers.tsx` | Add DensityProvider | Wrap app |

---

### **PHASE 2: ADVANCED FEATURES (Weeks 2-3)**

#### **NEW Files**

##### **5. Form Components Enhancement**
**Path**: `src/components/forms/`

```
forms/
├── FormField.tsx           (enhancement: density support)
├── Select.tsx              (NEW: custom select component)
├── DateRangePicker.tsx     (NEW: date range selector)
├── FilterPanel.tsx         (NEW: advanced filter UI)
└── index.ts
```

---

##### **6. Modal & Dialog System**
**Path**: `src/components/overlays/`

```
overlays/
├── Modal.tsx               (enhancement: WCAG compliant)
├── Dialog.tsx              (NEW: confirmation dialog)
├── Toast.tsx               (NEW: notifications)
└── index.ts
```

---

#### **MODIFIED Files (Phase 2)**

| File | Changes | Reason |
|------|---------|--------|
| `src/app/(protected)/dashboard/page.tsx` | Add table with toolbar | Full example |
| `src/app/(protected)/*/page.tsx` | Apply PageHeader | All pages |

---

### **PHASE 3: POLISH & QA (Week 4)**

#### **Tasks**

- [ ] Visual regression testing (all pages)
- [ ] Responsive testing (mobile/tablet/desktop)
- [ ] Accessibility audit (WCAG AA)
- [ ] Keyboard navigation testing
- [ ] Performance profiling
- [ ] Dark mode adjustment (if needed)

---

## File Dependencies Map

```
DensityProvider (Providers.tsx)
    ↓
use-density hook
    ↓
Components that need density:
  ├─ TableCell
  ├─ TableRow
  ├─ FormField
  ├─ Button
  └─ CardPadding

SidebarState (sidebar-state.ts)
    ↓
SidebarSection component
    ↓
ModernDashboard uses ModernSidebar

PageHeader
    ↓
ModernDashboardLayout exports prop
    ↓
All protected pages use it
```

---

## Implementation Order

### **Week 1**
1. Create `density-context.ts` + `density-store.ts` + Provider in `Providers.tsx`
2. Create `PageHeader.tsx` family (Title, Breadcrumb, Actions)
3. Enhance `ModernDashboardLayout.tsx` to accept pageHeader props
4. Create `SidebarSection.tsx` + `SidebarItem.tsx` + `sidebar-state.ts`
5. Refactor `ModernSidebar.tsx` to use new components
6. Update `src/app/(protected)/dashboard/page.tsx` example

### **Week 2-3**
7. Create `TableToolbar.tsx` + `RowActionsMenu.tsx`
8. Create `BulkActionBar.tsx`
9. Create `TableContainer.tsx` for sticky header
10. Enhance table example with full CRUD UI pattern
11. Create filter + search examples

### **Week 4**
12. QA + Testing
13. Accessibility audit
14. Performance optimization
15. Documentation

---

## Props & Configuration

### **PageHeader Props**
```typescript
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary';
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  }>;
  dateFilter?: {
    from: Date;
    to: Date;
    onChange: (from: Date, to: Date) => void;
  };
  sticky?: boolean;
}
```

### **Sidebar State**
```typescript
// sidebar-state.ts
interface SidebarState {
  expandedSections: Record<string, boolean>;
  toggleSection: (sectionId: string) => void;
  persistState: () => void;
}

// Usage:
const { expandedSections, toggleSection } = useSidebarState();
const isExpanded = expandedSections['dashboard'];
toggleSection('dashboard');
```

### **Density Store**
```typescript
interface DensityState {
  density: 'comfortable' | 'compact';
  toggleDensity: () => void;
  getDensityValue: (key: string) => string | number;
}

// Usage:
const { density, toggleDensity } = useDensity();
const padding = getDensityValue('padding.card'); // 'p-6' or 'p-4'
```

---

## Key Decisions

| Decision | Rationale | Alternative |
|----------|-----------|-------------|
| Zustand over Context | Performance, simpler API | Redux (overkill) |
| localStorage for state | Persistent, no backend call | Session only |
| Pill style sidebar active | Modern look, better UX | Left border (current) |
| Sticky header | Always accessible | Fixed height |
| Table toolbar component | Reusable across tables | Inline toolbar per table |
| Density in provider | Global affect, easy toggle | Per-component |

