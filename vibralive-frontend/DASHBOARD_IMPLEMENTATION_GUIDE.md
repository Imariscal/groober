# VibraLive Modern Dashboard - Guía de Implementación

## 📋 Descripción General

Este es un **sistema completo de componentes para dashboard SaaS moderno**, inspirado en Stripe, Linear y Vercel. Incluye:

- **Componentes reutilizables** premium-quality
- **Layout responsivo** (desktop + mobile)
- **Sistema de diseño coherente** (colores, espaciados, tipografía)
- **Microinteracciones** suaves con Framer Motion
- **Accesibilidad** WCAG 2.1 AA
- **Dark mode ready** (configurado en Tailwind)

---

## 📦 Estructura de Componentes

```
src/components/dashboard/
├── index.ts                    # Exports centralizados
├── ModernTopBar.tsx            # Barra superior (64px)
├── ModernSidebar.tsx           # Sidebar (240px) + mobile drawer
├── ModernDashboardLayout.tsx   # Layout principal (todo junto)
├── KPICard.tsx                 # Tarjetas de métricas
├── StateBadge.tsx              # Badges de estado
├── ActivityPanel.tsx           # Panel de actividad reciente
└── AdminDashboardExample.tsx   # Ejemplo completo funcional
```

---

## 🚀 Uso Rápido

### 1. Import en tu página
```tsx
import { ModernDashboardLayout, KPICard, StateBadge } from '@/components/dashboard';

export function MyPage() {
  return (
    <ModernDashboardLayout
      title="Mi Dashboard"
      breadcrumbs={[{ label: 'Inicio' }, { label: 'Dashboard' }]}
    >
      {/* Tu contenido aquí */}
    </ModernDashboardLayout>
  );
}
```

### 2. KPI Card
```tsx
<KPICard
  icon={FiUsers}
  metric="1,234"
  label="Clientes Activos"
  trend={{
    value: 12,
    direction: 'up',
    period: 'vs mes anterior'
  }}
  color="primary"
/>
```

### 3. State Badge
```tsx
<StateBadge 
  status="active" 
  label="Activo"
  size="md"
/>
```

### 4. Activity Panel
```tsx
<ActivityPanel
  title="Actividad Reciente"
  items={activityItems}
  maxItems={5}
  onViewAll={() => console.log('Ver todas')}
/>
```

---

## 🎨 Sistema de Colores

### Uso en Tailwind
```tsx
// Primary (Brand VibraLive)
className="text-primary-500"
className="bg-primary-100"
className="border-primary-200"

// Semantic
className="text-success-500"    // Verde
className="text-warning-500"    // Ámbar
className="text-critical-500"   // Rojo

// Neutrals
className="text-slate-900"      // Texto principal
className="text-slate-500"      // Texto secundario
className="bg-slate-50"         // Fondo claro
```

### Paleta Extendida
Ver `tailwind.config.js` para todas las tonalidades (50-900).

---

## 📐 Sistema de Espaciados

Basado en múltiplos de 4px para conseguir alineación perfecta:

```tsx
className="p-4"          // 16px (lg)
className="gap-2"        // 8px (sm)
className="mb-8"         // 32px (2xl)
className="px-6 py-4"    // Padding horizontal 24px, vertical 16px
```

---

## 🎭 Componentes Detallados

### ModernTopBar
**Props:**
- `onSearch?: (query: string) => void` - Callback búsqueda
- `onNotificationClick?: () => void` - Click en campana
- `ctaLabel?: string` - Texto del botón principal
- `ctaHref?: string` - Link del botón
- `onCtaClick?: () => void` - Callback del botón
- `notificationCount?: number` - Badge de notificaciones

**Características:**
- Search input elegante con focus animation
- Notificaciones con dot indicator animado
- Avatar con dropdown menu (Profile, Settings, Logout)
- CTA button destacado con hover state
- Sticky al top (z-index: 40)

---

### ModernSidebar
**Props:**
- `isMobile?: boolean` - Modo drawer (mobile)
- `isOpen?: boolean` - Estado del drawer
- `onClose?: () => void` - Cierre del drawer

**Características:**
- Logo + branding section
- Navegación con active indicator animado
- Soporte para badges en items
- User info + logout button
- Responde a window resize
- Drawer overlay en mobile

**Estructura nav:**
```tsx
// Edita en el componente:
const mainNavigation = [
  {
    title: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: FiHome },
      // ...
    ]
  },
  // ...
]
```

---

### KPICard
**Props:**
```tsx
interface KPICardProps {
  icon: IconType                    // Ícono react-icons
  metric: string | number           // "1,234" o 1234
  label: string                     // "Clientes Activos"
  trend?: {
    value: number                   // 12
    direction: 'up' | 'down'
    period: string                  // "vs mes anterior"
  }
  color?: 'primary' | 'success' | 'warning' | 'critical' | 'info'
  isLoading?: boolean               // Skeleton animation
  onClick?: () => void              // Click handler
}
```

**Características:**
- Icon circle con color de fondo
- Métrica grande y prominente
- Trend indicator con dirección
- Loading skeleton animado
- Hover animation (translateY -2px)
- Responsive grid (1-4 por fila)

---

### StateBadge
**Props:**
```tsx
interface StateBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'archived' | 'success' | 'warning' | 'critical'
  label?: string                    // Usa default si no se especifica
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'        // 12px | 14px | 16px
}
```

**Estilos por status:**
```
active   → Verde (#10B981)
inactive → Gris (#64748B)
pending  → Ámbar (#F59E0B)
archived → Gris (#64748B)
success  → Verde (#10B981)
warning  → Ámbar (#F59E0B)
critical → Rojo (#EF4444)
```

---

### ActivityPanel
**Props:**
```tsx
interface ActivityPanelProps {
  title?: string
  items: ActivityItem[]             // Array de eventos
  isLoading?: boolean               // Skeleton animation
  onViewAll?: () => void            // Click "Ver todo"
  maxItems?: number                 // Default: 5
}

interface ActivityItem {
  id: string
  icon: IconType
  title: string
  description: string
  timestamp: Date                   // Se formatea automático
  type: 'success' | 'warning' | 'info' | 'critical'
  actionUrl?: string
}
```

**Características:**
- Animación de entrada staggered
- Timestamp relativo (ej: "hace 2 minutos")
- Icon colored circles
- Hover state dengan action arrow
- Skeleton loader
- Empty state

---

### ModernDashboardLayout
**Props:**
```tsx
interface ModernDashboardLayoutProps {
  children: ReactNode
  title?: string                    // "Dashboard Admin"
  breadcrumbs?: Array<{             // Breadcrumb navigation
    label: string
    href?: string
  }>
  onSearch?: (query: string) => void
  onNotificationClick?: () => void
  ctaLabel?: string
  ctaHref?: string
  onCtaClick?: () => void
  notificationCount?: number
}
```

**Features:**
- Flex layout: Sidebar + Content
- Responsive (sidebar se convierte a drawer en mobile)
- Sticky top bar
- Page header con breadcrumbs
- Metro space y padding optimizado
- Fade-in animation en contenido

---

## 🎬 Microinteracciones

### Hover Effects
```tsx
// KPI Cards
class="hover:shadow-md transition-all duration-200"

// Buttons
class="hover:bg-primary-600 active:scale-95"

// Nav items
class="hover:bg-gray-800 transition-colors"
```

### Framer Motion
```tsx
// Staggered children
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: index * 0.1 }}

// Dropdown
initial={{ opacity: 0, y: -8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.15 }}

// Sidebar drawer
initial={{ x: -300 }}
animate={{ x: 0 }}
transition={{ type: 'spring', damping: 20 }}
```

---

## 📱 Responsive Design

### Breakpoints
```
Mobile:   < 640px   (Sidebar como drawer)
Tablet:   640-1024px (Optimizado)
Desktop:  > 1024px   (Full layout)
```

### Grid Responsive
```tsx
// KPI Cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// Main content
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Chart: 70% en desktop */}
  <div className="lg:col-span-2">
  
  {/* Activity: 30% en desktop */}
  <div>
```

---

## 🎯 Mejores Prácticas

### 1. Colores Semánticos
```tsx
// ✅ Bien
<StateBadge status="active" />      // Verde
<StateBadge status="critical" />    // Rojo

// ❌ Mal
<span className="text-green-600">Activo</span>  // Sin semántica
```

### 2. Iconos
```tsx
// ✅ Usar react-icons
import { FiUsers, FiCalendar } from 'react-icons/fi';

// ✅ Tamaños consistentes
icon={FiUsers}

// ❌ No hardcodear emojis
className="text-2xl">📭</span>  // O al menos ser consistente
```

### 3. Loading States
```tsx
// ✅ Usar skeleton components
<KPICard isLoading={true} />
<ActivityPanel isLoading={true} />

// ❌ No mostrar "Loading..."
<div>Loading...</div>
```

### 4. Validación & Error Handling
```tsx
// En ActivityPanel
{items.length === 0 ? (
  <ActivityPanelEmpty onViewAll={...} />
) : (
  // Mostrar items
)}
```

---

## 🌙 Dark Mode (Futuro)

Sistema preparado para dark mode. Agregar en Tailwind:
```js
darkMode: 'class'
```

Luego usar:
```tsx
className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
```

---

## 📊 Ejemplo Completo

Ver `AdminDashboardExample.tsx` para un dashboard funcional con:
- 4 KPI Cards
- Chart placeholder con animación
- Activity Panel
- Tabla de clientes con pagination
- Badge examples

### Usar ejemplo:
```tsx
import AdminDashboardExample from '@/components/dashboard/AdminDashboardExample';

export default function Page() {
  return <AdminDashboardExample />;
}
```

---

## 🔧 Configuración Tailwind

El archivo `tailwind.config.js` ya está configurado con:
- ✅ Colores premium
- ✅ Espaciados base 4px
- ✅ Tipografía escalada
- ✅ Sombras suaves
- ✅ Border radius modernos
- ✅ Animaciones custom

---

## 📐 Tipografía

```tsx
// H1
<h1 className="text-4xl font-bold text-slate-900">
  Título Principal
</h1>

// H2
<h2 className="text-2xl font-semibold text-slate-900">
  Subtítulo
</h2>

// Body
<p className="text-base text-slate-600">
  Contenido normal
</p>

// Label
<label className="text-xs font-semibold uppercase tracking-wider">
  ETIQUETA
</label>
```

---

## 🚀 Performance Optimization

- ✅ Code splitting (Lazy components)
- ✅ Tailwind CSS purged (solo lo usado)
- ✅ Optimizadas animaciones (GPU)
- ✅ Memoización de props
- ✅ Event delegation

---

## ♿ Accesibilidad

- ✅ Semantic HTML
- ✅ ARIA labels en botones
- ✅ Keyboard navigation
- ✅ Focus indicators visible
- ✅ Contrast ratios WCAG AA
- ✅ Alt text en iconos

---

## 🔗 Integración Backend

### Ejemplo con datos dinámicos:
```tsx
export function Dashboard() {
  const [kpis, setKpis] = useState<KPIData[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Fetch desde API
    fetchKPIs().then(setKpis);
    fetchActivities().then(setActivities);
  }, []);

  return (
    <ModernDashboardLayout>
      <div className="grid grid-cols-4 gap-6">
        {kpis.map(kpi => (
          <KPICard key={kpi.id} {...kpi} />
        ))}
      </div>
      <ActivityPanel items={activities} />
    </ModernDashboardLayout>
  );
}
```

---

## 🐛 Troubleshooting

### Sidebar desalineado
```tsx
// Asegurar que el main tiene margin-left
<main className="ml-0 lg:ml-60">
```

### Animaciones lentas
```tsx
// Reducir duración en devices lentos
transition={{ duration: 0.15 }}  // vs 0.3
```

### Colores no se ven
```tsx
// Asegurar que el contenido en tailwind.config.js incluya tus archivos
content: ['./src/**/*.{ts,tsx}']
```

---

## 📚 Referencias

- **Tailwind CSS**: https://tailwindcss.com
- **Framer Motion**: https://framer.com/motion
- **React Icons**: https://react-icons.github.io/react-icons
- **Date-fns**: https://date-fns.org
- **Design Inspiration**: Stripe, Linear, Vercel

---

## 📝 Próximos Pasos

1. **Dark Mode Toggle** - Agregar en avatar dropdown
2. **Notifications Dropdown** - Integrar con API de notificaciones
3. **Mobile Navigation** - Mejorar drawer en mobile
4. **Analytics** - Integrar gráficas reales (Recharts, Victory)
5. **Table Sorteable** - Agregar orden en tablas
6. **Advanced Filters** - Sistema de filtrado interactivo
7. **Export Data** - CSV/PDF desde tablas
8. **WebSocket** - Live updates en actividad

---

**Creado por**: VibraLive Design System  
**Última actualización**: Febrero 2025  
**Versión**: 1.0.0  
**Status**: Production Ready ✅

