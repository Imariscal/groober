# (D) 🎯 Visual QA Checklist - AdminLTE Enterprise Panel

**Project**: VibraLive Dashboard Enterprise  
**Version**: 1.0  
**Platform**: Next.js 14 + React 18 + Tailwind 3 + TypeScript  

---

## Phase 1: Visual Consistency

### **Color & Contrast (WCAG AA)**

- [ ] **Primary Blue** - All primary actions use `bg-primary-500`
  - [ ] Buttons text on background has 4.5:1 contrast ratio
  - [ ] Hover state: `bg-primary-600` (darker)
  - [ ] Active state: `bg-primary-700` (darkest)
  - [ ] Test with: Accessibility Inspector (DevTools)

- [ ] **Semantic Colors**
  - [ ] Success (green): `bg-success-500`, white text, 4.5:1+
  - [ ] Warning (amber): `bg-warning-500`, dark text on light, 4.5:1+
  - [ ] Critical (red): `bg-critical-500`, white text, 4.5:1+
  - [ ] Info (sky): `bg-info-500`, white text, 4.5:1+
  - [ ] Neutral (slate): All slate levels accessible

- [ ] **Text on Colors**
  - [ ] White text on blue (primary-500) ✓
  - [ ] Dark text on slate-100 ✓
  - [ ] No light text on light backgrounds
  - [ ] No dark text on dark backgrounds

### **Typography Hierarchy**

- [ ] **Display XL** (32px) on page titles → proper h1 size
- [ ] **Display LG** (28px) on section titles → h2 equivalent
- [ ] **Title LG** (24px) on card titles → h3 equivalent
- [ ] **Body LG** (16px) on copy text → readable line-height
- [ ] **Body SM** (12px) on labels/captions → not too small
- [ ] **Font Weight** hierarchy clear:
  - [ ] Display titles: 700 (bold)
  - [ ] Body text: 400 (regular)
  - [ ] Labels: 500 (medium)

### **Spacing (4px Base Unit)**

- [ ] **Card Padding**
  - [ ] Comfortable: `p-6` (24px)
  - [ ] Compact: `p-4` (16px)
  - [ ] Visual balance inside cards

- [ ] **Table Row Padding**
  - [ ] Comfortable: `py-4` (16px vertical)
  - [ ] Compact: `py-2` (8px vertical)
  - [ ] Hit targets ≥ 44px (mobile)

- [ ] **Gap Between Elements**
  - [ ] Comfortable: `gap-4` (16px)
  - [ ] Compact: `gap-2` (8px)
  - [ ] Consistent throughout

- [ ] **Section Margins**
  - [ ] Top/bottom: `my-8` or `space-y-8` (32px)
  - [ ] Left/right: `mx-6` or `px-6` (24px desktop, 16px mobile)

### **Border Radius**

- [ ] **Buttons**: `rounded-lg` (8px)
- [ ] **Cards**: `rounded-lg` (8px)
- [ ] **Modal**: `rounded-lg` (8px)
- [ ] **Avatar**: `rounded-full` (50%)
- [ ] **Pills/Badges**: `rounded-full` (50%)
- [ ] **Tables**: No rounded corners (sharp corners acceptable)

### **Shadows (Elevation)**

- [ ] **Default Cards**: `shadow-sm` (1px 3px)
  - [ ] Not too prominent
  - [ ] Subtle depth

- [ ] **Floating Elements** (modals, dropdowns): `shadow-lg` (10px 15px)
  - [ ] Clear separation from background
  - [ ] Proper z-index layering

- [ ] **Hover State**: `shadow-md` (4px 6px)
  - [ ] Indicate interactivity
  - [ ] Smooth transition (200ms)

---

## Phase 2: Component Quality

### **PageHeader**

- [ ] **Breadcrumb Navigation**
  - [ ] Home icon on first item
  - [ ] Chevron separators between items
  - [ ] Links are clickable (underline or color change)
  - [ ] Current page in bold (not clickable)
  - [ ] Mobile: horizontal scroll if long
  - [ ] Keyboard: Tab navigates all breadcrumbs

- [ ] **Title Section**
  - [ ] `<h1>` semantic HTML
  - [ ] Subtitle below (smaller, gray text)
  - [ ] Responsive: title doesn't overflow
  - [ ] Mobile: no horizontal scroll

- [ ] **Action Group**
  - [ ] Primary CTA visible and prominent
  - [ ] Secondary actions not overwhelming
  - [ ] Mobile: stack vertically if needed
  - [ ] Desktop: horizontal alignment

- [ ] **Sticky Behavior**
  - [ ] Top padding preserved on scroll
  - [ ] Shadow appears when scrolled (not on top)
  - [ ] z-index correct (below topbar if applicable)
  - [ ] Doesn't hide content on mobile

### **Sidebar Navigation**

- [ ] **Section Headers**
  - [ ] Clear visual distinction
  - [ ] Icon + label (if provided)
  - [ ] Collapse/expand chevron animated (180° rotate)
  - [ ] Active section has background highlight
  - [ ] Click toggles expand/collapse smooth animation

- [ ] **Navigation Items**
  - [ ] Icon + label visible
  - [ ] Active state: pill-style background + left indicator
  - [ ] Hover: background color changes
  - [ ] Focus: ring-2 visible (primary-500)
  - [ ] Badge count rightmost, visible
  - [ ] Disabled items: opacity-50

- [ ] **Collapse Animation**
  - [ ] Smooth height transition (200ms)
  - [ ] Items fade in/out
  - [ ] No jumping or layout shift
  - [ ] Chevron rotates smoothly

- [ ] **Mobile Behavior**
  - [ ] Drawer slides from left (90vw or full)
  - [ ] Backdrop overlay darkens (semi-transparent)
  - [ ] Click backdrop closes drawer
  - [ ] Hamburger icon visible & correct z-index

- [ ] **Persistent State**
  - [ ] Expanded sections remembered on refresh
  - [ ] localStorage key visible in DevTools
  - [ ] Works across page navigation

### **Table Toolbar**

- [ ] **Search Input**
  - [ ] Icon on left (magnifying glass)
  - [ ] Placeholder text clear
  - [ ] Clear button (X) appears on focus
  - [ ] Focus ring visible (primary-500)
  - [ ] Enter key submits search

- [ ] **Filter Button**
  - [ ] Icon + label both visible on desktop
  - [ ] Label hidden on mobile (icon only)
  - [ ] Active state: background highlight
  - [ ] Opens filter panel on click

- [ ] **Column Toggle**
  - [ ] Icon + label visible
  - [ ] Dropdown or panel opens
  - [ ] Checkboxes for visibility
  - [ ] Changes apply immediately

- [ ] **Export Button**
  - [ ] Download icon clear
  - [ ] Disabled if no data
  - [ ] Tooltip on hover
  - [ ] Shows loading state during export

### **Table Rows & Actions**

- [ ] **Row Actions Menu**
  - [ ] Overflow menu icon (⋯) on right
  - [ ] Appears on row hover (desktop)
  - [ ] Always visible on mobile
  - [ ] Popover opens on click (right-aligned)
  - [ ] Actions: Edit, Delete, View, etc.

- [ ] **Bulk Selections**
  - [ ] Checkbox first column
  - [ ] Header checkbox selects all
  - [ ] Row checkboxes select individual
  - [ ] Bulk action bar appears when selected
  - [ ] Shows count: "3 selected"
  - [ ] Clear button removes selection

- [ ] **Bulk Action Bar**
  - [ ] Fixed at bottom (mobile) or inline (desktop)
  - [ ] Selected count visible
  - [ ] Action buttons: Edit, Delete, Export
  - [ ] Delete button shows danger color
  - [ ] Close (X) button available

- [ ] **Sticky Header**
  - [ ] Header stays visible on vertical scroll
  - [ ] Shadow appears under header
  - [ ] Columns align properly
  - [ ] Text not cut off

### **Density Toggle**

- [ ] **Comfortable Mode**
  - [ ] Table row height: 64px+ (py-4)
  - [ ] Card padding: 24px (p-6)
  - [ ] Font sizes: normal (base)
  - [ ] Easy to read, not cramped

- [ ] **Compact Mode**
  - [ ] Table row height: 32px+ (py-2)
  - [ ] Card padding: 16px (p-4)
  - [ ] Font sizes: slightly smaller (sm)
  - [ ] More data visible, still readable

- [ ] **Toggle Button**
  - [ ] Located in TopBar or Settings
  - [ ] Icon clear (two arrows or similar)
  - [ ] Tooltip on hover
  - [ ] Preference persisted (localStorage)
  - [ ] All pages respect setting

- [ ] **Responsive to Density**
  - [ ] Table rows update
  - [ ] Cards update
  - [ ] Buttons/inputs update
  - [ ] No layout breaks
  - [ ] Smooth transition

---

## Phase 3: Responsive Design

### **Mobile (< 640px)**

- [ ] **Sidebar**
  - [ ] Drawer accessible via hamburger menu
  - [ ] Full-screen width
  - [ ] Overlay backdrop
  - [ ] Swipe or tap to close

- [ ] **Table**
  - [ ] Convert to card layout (stack fields)
  - [ ] OR horizontal scroll with sticky first column
  - [ ] Row actions always visible
  - [ ] Touch targets: 44px+ (WCAG)

- [ ] **PageHeader**
  - [ ] Title text doesn't overflow
  - [ ] Actions stack vertically
  - [ ] Breadcrumb scrolls horizontally if needed
  - [ ] All interactive elements tap-friendly

- [ ] **Forms & Inputs**
  - [ ] Full width (100% - padding)
  - [ ] Min height: 44px (touch target)
  - [ ] Label above input
  - [ ] Error text visible

- [ ] **Modals**
  - [ ] Full width with margin
  - [ ] Bottom sheet style optional
  - [ ] Keyboard still works
  - [ ] Scrollable on small screens

### **Tablet (640px - 1024px)**

- [ ] **Sidebar**
  - [ ] Still drawer-based
  - [ ] OR sidebar visible + narrower
  - [ ] Consistent with mobile if drawer

- [ ] **Table**
  - [ ] Horizontal scroll OR card layout
  - [ ] Sticky first column if scrolling
  - [ ] Row actions visible

- [ ] **PageHeader**
  - [ ] Title and actions may be on same line
  - [ ] Breadcrumb horizontal
  - [ ] All elements fit without wrapping

- [ ] **Layout**
  - [ ] Max-width appropriate
  - [ ] Margins not too large

### **Desktop (> 1024px)**

- [ ] **Sidebar**
  - [ ] Fixed left, 240px width
  - [ ] Always visible
  - [ ] Scrollable if many items
  - [ ] Sections collapse/expand work

- [ ] **Table**
  - [ ] Full table view
  - [ ] All columns visible or horizontal scroll
  - [ ] No card layout
  - [ ] Row actions in overflow menu

- [ ] **PageHeader**
  - [ ] Horizontal layout: breadcrumb | title | actions
  - [ ] All on one line if space allows
  - [ ] Full width of container

- [ ] **Content Area**
  - [ ] Full width - sidebar width
  - [ ] Max-width optional for reading comfort

---

## Phase 4: Accessibility (WCAG 2.1 AA)

### **Keyboard Navigation**

- [ ] **Tab Order**
  - [ ] Logical flow left → right, top → bottom
  - [ ] Skip links (if applicable)
  - [ ] Sidebar focusable via keyboard
  - [ ] No keyboard trap

- [ ] **Focus States**
  - [ ] All interactive elements have visible focus ring
  - [ ] Focus ring: 2px, primary-500 color
  - [ ] Offset: 2px from element
  - [ ] Sufficient contrast (4.5:1)

- [ ] **Keyboard Shortcuts**
  - [ ] Enter activates buttons/links
  - [ ] Space toggles checkboxes
  - [ ] Escape closes modals/menus
  - [ ] Arrow keys navigate (sidebar, menus)

- [ ] **Form Navigation**
  - [ ] Tab moves to next field
  - [ ] Shift+Tab moves to previous
  - [ ] Submit on Enter
  - [ ] Required fields marked & announced

### **Screen Reader**

- [ ] **Semantic HTML**
  - [ ] `<button>` for buttons (not `<div onclick>`)
  - [ ] `<a>` for links
  - [ ] `<input>` with `<label for>`
  - [ ] `<h1>`, `<h2>`, `<h3>` in order

- [ ] **ARIA Labels**
  - [ ] Icon buttons have `aria-label`
  - [ ] Modals have `aria-label` or `aria-labelledby`
  - [ ] Menu buttons have `aria-expanded`
  - [ ] Images have `alt` text

- [ ] **Form Accessibility**
  - [ ] Labels properly associated
  - [ ] Error messages linked to input
  - [ ] Required asterisk announced
  - [ ] Validation messages clear

- [ ] **Live Regions**
  - [ ] Bulk selection count announced
  - [ ] Filter application announced
  - [ ] Notifications use role="alert"

### **Color & Contrast**

- [ ] **Text Contrast**
  - [ ] Body text: 4.5:1 minimum
  - [ ] Large text (18pt+): 3:1 minimum
  - [ ] Text on colored backgrounds: 4.5:1+
  - [ ] Borders/graphics: 3:1 if meaningful

- [ ] **No Color Alone**
  - [ ] Don't communicate info by color alone
  - [ ] Use icons + color
  - [ ] Use text + color
  - [ ] Use pattern + color

- [ ] **Focus Indicators**
  - [ ] Not reliant on color alone
  - [ ] Clear contrast from surrounding
  - [ ] Shape/style distinct

---

## Phase 5: Performance

### **Core Web Vitals**

- [ ] **Largest Contentful Paint (LCP)**
  - [ ] < 2.5s target
  - [ ] Images optimized
  - [ ] Fonts loaded efficiently
  - [ ] CSS critical path optimized

- [ ] **First Input Delay (FID)**
  - [ ] < 100ms target
  - [ ] No long JavaScript tasks
  - [ ] Event handlers efficient
  - [ ] Animations use transform/opacity

- [ ] **Cumulative Layout Shift (CLS)**
  - [ ] < 0.1 target
  - [ ] Sidebar collapse doesn't shift
  - [ ] Table toolbar doesn't push content
  - [ ] Images have aspect ratio set

### **Bundle Size**

- [ ] **Component Imports**
  - [ ] Only import used components
  - [ ] Dynamic imports for heavy features
  - [ ] Tree-shaking enabled

- [ ] **Tailwind CSS**
  - [ ] Purged (production): < 100KB gzipped
  - [ ] No unused styles

### **Animations**

- [ ] **GPU Acceleration**
  - [ ] Sidebar collapse uses `height` (bad) → fix with `scaleY` or `max-height`
  - [ ] Fade uses `opacity` ✓
  - [ ] Position uses `transform` ✓
  - [ ] No repaints on scroll

---

## Regression Testing Checklist

### **before & after Screenshots**

- [ ] **Desktop**
  - [ ] Dashboard page (full viewport)
  - [ ] PageHeader with breadcrumb
  - [ ] Table with toolbar
  - [ ] Sidebar expanded & collapsed
  - [ ] Row actions menu open

- [ ] **Mobile**
  - [ ] Dashboard (mobile viewport)
  - [ ] Sidebar drawer open/closed
  - [ ] Table in card layout
  - [ ] Touch targets adequate

- [ ] **Focus States**
  - [ ] All buttons focused
  - [ ] Form inputs focused
  - [ ] Links focused

- [ ] **Hover States** (desktop only)
  - [ ] Button hover
  - [ ] Link hover
  - [ ] Row hover

---

## Browser Compatibility

- [ ] Chrome/Edge (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Mobile Safari (iOS 14+)
- [ ] Chrome Mobile (Android 10+)

**Test**: Focus rings, animations, layout, forms, modals

---

## Sign-Off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Designer | _____ | _____ | Visual approved |
| QA | _____ | _____ | All checks passed |
| A11y Lead | _____ | _____ | WCAG AA compliance |
| Frontend Lead | _____ | _____ | Code quality |

---

**Status**: ☐ Ready for Staging | ☐ Ready for Production

