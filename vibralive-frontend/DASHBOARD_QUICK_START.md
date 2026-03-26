# 🚀 VibraLive Dashboard - Quick Start Guide

## ⚡ 5 Minutos de Setup

### 1. Install Dependencies (Ya está hecho)
```bash
npm install
# Ya tienes: react, tailwind, framer-motion, react-icons, date-fns
```

### 2. Tailwind Config (Ya actualizado)
El archivo `tailwind.config.js` ya está configurado con:
- ✅ Colores premium
- ✅ Espaciados base 4px
- ✅ Tipografía escalada
- ✅ Sombras suaves
- ✅ Animaciones custom

---

## 📝 Ejemplo 1: Dashboard Básico

```tsx
'use client';

import { ModernDashboardLayout, KPICard } from '@/components/dashboard';
import { FiUsers, FiCalendar } from 'react-icons/fi';

export function BasicDashboard() {
  return (
    <ModernDashboardLayout
      title="Dashboard"
      breadcrumbs={[
        { label: 'Inicio', href: '/dashboard' },
        { label: 'Overview' }
      ]}
      ctaLabel="Nuevo"
      ctaHref="/dashboard/new"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={FiUsers}
          metric="1,234"
          label="Clientes Activos"
          color="primary"
        />
        <KPICard
          icon={FiCalendar}
          metric="542"
          label="Citas Programadas"
          color="success"
        />
      </div>
    </ModernDashboardLayout>
  );
}
```

---

## 📝 Ejemplo 2: Con Activity Panel

```tsx
'use client';

import { ModernDashboardLayout, ActivityPanel } from '@/components/dashboard';
import { FiCheckCircle, FiUsers } from 'react-icons/fi';

export function DashboardWithActivity() {
  const activities = [
    {
      id: '1',
      icon: FiCheckCircle,
      title: 'Cita completada',
      description: 'Juan Rodriguez recibió tratamiento',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      type: 'success' as const,
    },
    {
      id: '2',
      icon: FiUsers,
      title: 'Nuevo cliente',
      description: 'María López registrada',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      type: 'info' as const,
    },
  ];

  return (
    <ModernDashboardLayout title="Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Chart aquí */}
        </div>
        <ActivityPanel items={activities} maxItems={5} />
      </div>
    </ModernDashboardLayout>
  );
}
```

---

## 📝 Ejemplo 3: Table Completa con Badges

```tsx
'use client';

import { ModernDashboardLayout, StateBadge } from '@/components/dashboard';
import { TableWrapper } from '@/components/dashboard/UIHelpers';

export function ClientsPage() {
  const columns = [
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Estado' },
  ];

  const data = [
    {
      id: '1',
      name: 'Juan Rodriguez',
      email: 'juan@example.com',
      status: 'active',
    },
    {
      id: '2',
      name: 'María López',
      email: 'maria@example.com',
      status: 'inactive',
    },
  ];

  return (
    <ModernDashboardLayout
      title="Clientes"
      breadcrumbs={[
        { label: 'Inicio' },
        { label: 'Clientes' }
      ]}
      ctaLabel="Nuevo Cliente"
      ctaHref="/clients/new"
    >
      <TableWrapper
        title="Listado de Clientes"
        columns={columns}
        data={data}
        renderCell={(value, column) => {
          if (column === 'status') {
            return <StateBadge status={value} />;
          }
          return value;
        }}
        rightActions={
          <div className="flex gap-2">
            <button className="p-2 hover:bg-slate-100 rounded-lg">
              🔍 Filtrar
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg">
              ⬇️ Descargar
            </button>
          </div>
        }
      />
    </ModernDashboardLayout>
  );
}
```

---

## 📝 Ejemplo 4: Estadísticas con Tendencias

```tsx
'use client';

import { KPICard } from '@/components/dashboard';
import { FiTrendingUp, FiDollarSign } from 'react-icons/fi';

export function StatsSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPICard
        icon={FiDollarSign}
        metric="$24,500"
        label="Ingresos Mensuales"
        trend={{
          value: 25,
          direction: 'up',
          period: 'vs mes anterior'
        }}
        color="success"
      />
      
      <KPICard
        icon={FiTrendingUp}
        metric="3,452"
        label="Nuevos Registros"
        trend={{
          value: 12,
          direction: 'up',
          period: 'este mes'
        }}
        color="primary"
      />
    </div>
  );
}
```

---

## 📝 Ejemplo 5: Con Chart Wrapper

```tsx
'use client';

import { ChartWrapper } from '@/components/dashboard/UIHelpers';

export function AnalyticsChart() {
  return (
    <ChartWrapper
      title="Ingresos por Mes"
      subtitle="Últimos 12 meses"
      rightActions={
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs border rounded hover:bg-slate-50">
            Mes
          </button>
          <button className="px-3 py-1.5 text-xs bg-primary-500 text-white rounded">
            Año
          </button>
        </div>
      }
      footer="Datos actualizado hace 2 minutos"
      isLoading={false}
    >
      {/* Tu gráfica aquí - Recharts, Chart.js, etc */}
      <div className="h-64 flex items-center justify-center">
        <p className="text-slate-500">Gráfica placeholder</p>
      </div>
    </ChartWrapper>
  );
}
```

---

## 📝 Ejemplo 6: Alerts y Estados

```tsx
'use client';

import { Alert, EmptyState } from '@/components/dashboard/UIHelpers';
import { useState } from 'react';

export function AlertExamples() {
  const [showAlert, setShowAlert] = useState(true);

  return (
    <div className="space-y-4">
      {/* Success Alert */}
      {showAlert && (
        <Alert
          type="success"
          title="¡Éxito!"
          message="Cliente creado correctamente"
          action={{
            label: 'Ver cliente',
            onClick: () => console.log('View client')
          }}
          onClose={() => setShowAlert(false)}
        />
      )}

      {/* Empty State */}
      <EmptyState
        icon="📭"
        title="Sin clientes"
        description="Comienza creando tu primer cliente"
        action={{
          label: 'Crear cliente',
          onClick: () => console.log('New client')
        }}
      />
    </div>
  );
}
```

---

## 🎨 Colores en la Práctica

```tsx
// Botones
<button className="bg-primary-500 hover:bg-primary-600">Primario</button>
<button className="bg-success-500 hover:bg-success-600">Éxito</button>
<button className="bg-warning-500 hover:bg-warning-600">Advertencia</button>
<button className="bg-critical-500 hover:bg-critical-600">Crítico</button>

// Textos
<p className="text-slate-900">Negrita negra (principal)</p>
<p className="text-slate-600">Gris medio (secundario)</p>
<p className="text-slate-500">Gris claro (terciario)</p>

// Fondos
<div className="bg-slate-50">Fondo claro</div>
<div className="bg-white">Blanco puro</div>
<div className="bg-slate-900">Oscuro sidebar</div>

// Borders
<div className="border border-slate-200">Línea sutil</div>
<div className="border border-primary-500">Línea primaria</div>
```

---

## 🎬 Animaciones Comunes

```tsx
import { motion } from 'framer-motion';

// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Contenido
</motion.div>

// Slide up
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  Contenido
</motion.div>

// Stagger children
<motion.div>
  {items.map((item, idx) => (
    <motion.div
      key={idx}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
    >
      {item}
    </motion.div>
  ))}
</motion.div>

// Hover effects
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click me
</motion.button>
```

---

## 📱 Responsive Patterns

```tsx
// Grid responsive automático
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* 1 col mobile, 2 tablet, 4 desktop */}
</div>

// Ocultar en mobile
<div className="hidden lg:block">
  Solo visible en desktop
</div>

// Layout condicional
{isMobile ? (
  <MobileLayout />
) : (
  <DesktopLayout />
)}

// Padding responsive
<div className="px-4 md:px-6 lg:px-8">
  Espaciado adaptativo
</div>
```

---

## 🔧 Integración con API Backend

```tsx
'use client';

import { useEffect, useState } from 'react';
import { ModernDashboardLayout, KPICard, KPICardSkeleton } from '@/components/dashboard';

export function DashboardWithData() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/dashboard/kpis');
        const data = await response.json();
        setKpis(data);
      } catch (err) {
        setError('Failed to load KPIs');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ModernDashboardLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          // Skeletons mientras carga
          <>
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
          </>
        ) : error ? (
          <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : (
          kpis.map((kpi) => (
            <KPICard key={kpi.id} {...kpi} />
          ))
        )}
      </div>
    </ModernDashboardLayout>
  );
}
```

---

## 🧪 Testear el Dashboard

### 1. Página Demo
```tsx
// src/app/dashboard-demo.tsx
import AdminDashboardExample from '@/components/dashboard/AdminDashboardExample';

export default function DashboardDemoPage() {
  return <AdminDashboardExample />;
}
```

Vai a: `http://localhost:3000/dashboard-demo`

### 2. Storybook (Opcional)
```bash
npx sb init
```

```tsx
// src/components/dashboard/KPICard.stories.ts
import type { Meta, StoryObj } from '@storybook/react';
import { KPICard } from './KPICard';
import { FiUsers } from 'react-icons/fi';

const meta: Meta<typeof KPICard> = {
  component: KPICard,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: FiUsers,
    metric: '1,234',
    label: 'Clientes Activos',
    color: 'primary',
  },
};
```

---

## 📚 Cheat Sheet

| Componente | Ubicación | Props |
|-----------|-----------|-------|
| `ModernDashboardLayout` | dashboard/ModernDashboardLayout | title, breadcrumbs, children |
| `KPICard` | dashboard/KPICard | icon, metric, label, trend, color |
| `StateBadge` | dashboard/StateBadge | status, label, size |
| `ActivityPanel` | dashboard/ActivityPanel | items, title, maxItems |
| `ModernTopBar` | dashboard/ModernTopBar | onSearch, ctaLabel, notificationCount |
| `ModernSidebar` | dashboard/ModernSidebar | isMobile, isOpen, onClose |
| `TableWrapper` | dashboard/UIHelpers | title, columns, data |
| `ChartWrapper` | dashboard/UIHelpers | title, children |
| `Alert` | dashboard/UIHelpers | type, title, message |
| `EmptyState` | dashboard/UIHelpers | title, icon, action |

---

## 🐛 Troubleshooting

### Dashboard no se ve
```tsx
// Asegúrate de que ModernDashboardLayout está en el layout raíz
// src/app/(protected)/layout.tsx

export default function ProtectedLayout({ children }) {
  return (
    <ModernDashboardLayout>
      {children}
    </ModernDashboardLayout>
  );
}
```

### Colores no funcionan
```bash
# Rebuild Tailwind
npm run build

# O en desarrollo
npm run dev  # Debería watchear cambios automáticamente
```

### Iconos no aparecen
```tsx
// Import correcto de react-icons
import { FiHome, FiUsers } from 'react-icons/fi';
// No hacer:
// import Icon from 'react-icons/fi'
```

### Animaciones muy lentas/rápidas
```tsx
// Ajusta duración en framer-motion
<motion.div
  transition={{ duration: 0.15 }}  // Rápido
  // vs
  transition={{ duration: 0.6 }}   // Lento
>
```

---

## 🚀 Próximos Pasos Recomendados

1. **Integra con tu API**: Fetch datos reales
2. **Personaliza colores**: Si quieres brand colors diferentes
3. **Agregar Dark Mode**: Toggle en avatar dropdown
4. **Gráficas reales**: Recharts o Chart.js
5. **Notificaciones**: WebSocket + toast
6. **Análytics**: Trackea eventos de usuario

---

## 📞 Soporte Rápido

**¿Cómo agregar un nuevo KPI?**
```tsx
<KPICard icon={FiIcon} metric="X" label="Etiqueta" color="primary" />
```

**¿Cómo agregar una nueva página?**
```tsx
// src/app/(protected)/my-page.tsx
import { ModernDashboardLayout } from '@/components/dashboard';

export default function MyPage() {
  return (
    <ModernDashboardLayout title="Mi Página">
      {/* Tu contenido */}
    </ModernDashboardLayout>
  );
}
```

**¿Cómo cambiar colores globales?**
Edita `tailwind.config.js` y rebuild.

---

**¡Estás listo para crear un dashboard premium! 🎉**

