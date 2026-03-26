# 📊 ARQUITECTURA VISUAL - SISTEMA DE REPORTES

## 🏗️ ESTRUCTURA DE CARPETAS

```
vibralive-frontend/
├── src/
│   ├── app/(protected)/
│   │   └── reports/                          ← Nueva sección de reportes
│   │       ├── page.tsx                      ← Landing / Resumen
│   │       │
│   │       ├── revenue/
│   │       │   └── page.tsx                  ← 💰 Reporte Ingresos
│   │       │
│   │       ├── appointments/
│   │       │   └── page.tsx                  ← 📅 Reporte Citas
│   │       │
│   │       ├── clients/
│   │       │   └── page.tsx                  ← 👥 Reporte Clientes
│   │       │
│   │       ├── services/
│   │       │   └── page.tsx                  ← 🏆 Reporte Servicios
│   │       │
│   │       ├── performance/
│   │       │   └── page.tsx                  ← 🚀 Reporte Performance
│   │       │
│   │       └── heatmap/
│   │           └── page.tsx                  ← 🌡️ Reporte Geografía
│   │
│   └── components/
│       └── reports/
│           └── ReportsLayout.tsx             ← 📐 Componente Layout
```

---

## 🎯 NAVEGACIÓN DE REPORTES

```
┌─────────────────────────────────────────────────────────────┐
│                    📊 SISTEMA DE REPORTES                   │
└─────────────────────────────────────────────────────────────┘

                    Menu Principal
                    /reports
                        ↓
    ┌───────────────────┴───────────────────┐
    │                                       │
    ▼                                       ▼
  DASHBOARD                          MENÚ LATERAL
  (6 KPIs principales)               (7 opciones)
  
    • $45,230 Ingresos               ├── 📊 Resumen
    • 287 Citas Completadas          ├── 💰 Ingresos
    • 523 Clientes Activos           ├── 📅 Citas
    • 4.6⭐ Rating Promedio           ├── 👥 Clientes
                                      ├── 🏆 Servicios
    ┌──────────────────────────┐      ├── 🚀 Performance
    │  6 TARJETAS DE REPORTES  │      └── 🌡️ Geografía
    └──────────────────────────┘


        Cada tarjeta navega a:
        /reports/[reportId]
```

---

## 📑 VISTA DE UN REPORTE (Ejemplo: Revenue)

```
┌──────────────────────────────────────────────────────────────┐
│                  💻 LAYOUT REPORTE                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  SIDEBAR                        MAIN CONTENT                │
│  ──────────────────             ────────────────           │
│  📊 Resumen                      Reporte de Ingresos       │
│  💰 Ingresos    ◄──────          Análisis detallado...    │
│  📅 Citas       (Active)          ─────────────────        │
│  👥 Clientes                      4 KPI CARDS              │
│  🏆 Servicios                     • Ingresos Mes           │
│  🚀 Performance                   • YTD                    │
│  🌡️ Geografía                     • Promedio Diario        │
│                                   • Clientes Activos       │
│                                   ────────────────────     │
│                                                            │
│                                   2 GRÁFICOS               │
│                                   • LineChart (Tendencia)  │
│                                   • PieChart (Distribución)│
│                                                            │
│                                   1 TABLA DETALLADA        │
│                                   • Datos por servicio     │
│                                                            │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎨 PALETA DE COLORES POR REPORTE

```
Reporte          Color Primario    Icono         KPI Color
────────────────────────────────────────────────────────
💰 Ingresos      🟢 Emerald       FiDollarSign  success
📅 Citas         🔵 Blue          FiCalendar    primary
👥 Clientes      🟣 Purple        FiUsers       info
🏆 Servicios     🟠 Orange        FiAward       warning
🚀 Performance   🔷 Indigo        FiTrendingUp  primary
🌡️ Geografía     🔴 Red           FiMap         warning
```

---

## 📊 EJEMPLOS DE GRÁFICOS IMPLEMENTADOS

### 1. LineChart (Ingresos, Clientes)
```
Ingresos ($)
    │     ╱╲    ╱╲
    │   ╱  ╲  ╱  ╲
    │ ╱    ╲╱    ╲─
    └─────────────────── Meses
    Ene Feb Mar Abr May Jun
```

### 2. BarChart (Citas, Servicios)
```
Citas por Semana
    │  ██
    │  ██  ██
    │  ██  ██  ██
    └─────────────
    Lun Mar Mié Jue Vie
```

### 3. PieChart (Distribución Servicios)
```
    ╱────────╲
   ╱  Groom  ╲
  │  35%      │
  │           │
  │ Grooming  │
  │ Premium   │
  ╲           ╱
   ╲─────────╱
   
  [Otros servicios en colores adicionales]
```

### 4. RadarChart (Performance Equipo)
```
         Citas
         /\
    Rating  Performance
     /        \
    ————────────  Ingresos
   Utilización
```

### 5. ScatterChart (Demanda vs Ingresos)
```
Ingresos ($)
    │      ●  (Alto Demanda, Alto Ingreso)
    │     ● ●  = "Vacas" (Productos Estrella)
    │      ●
    │     ●     ●  (Bajo Demanda, Alto Ingreso)
    │          ●  = "Interrogantes"
    └────────────────────── Demanda (Citas)
```

---

## 🔄 FLUJO DE DATOS (Actual - Mock Data)

```
┌─────────────────┐
│   Mock Data     │  ← Datos simulados en cada página
│  (JSON embebido)│     para demostración
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  React State    │  ← useMemo para gráficos
│  setSelectedZona│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Recharts API   │  ← Renderiza gráficos
│  LineChart etc  │
└────────┬────────┘
         │
         ▼
    ┌─────────┐
    │ USUARIO │  ← Ve reportes en navegador
    └─────────┘
```

---

## 🔄 FLUJO DE DATOS (Futuro - Con APIs)

```
┌──────────────────┐
│   PostgreSQL BD  │  ← Datos reales
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│  NestJS Backend      │  ← APIs de reportes
│  GET /api/reports/*  │     (una vez implementado)
└────────┬─────────────┘
         │
         ▼
┌──────────────────┐
│  React Query     │  ← fetching + caching
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  React State     │  ← useMemo memoization
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Recharts        │  ← Renderitza
└────────┬─────────┘
         │
         ▼
    ┌─────────┐
    │ USUARIO │  ← Ve datos actualizados
    └─────────┘
```

---

## 📱 RESPONSIVIDAD

### Desktop (1920x1080)
```
┌─────────────────────────────────────────┐
│ SIDEBAR    │  MAIN CONTENT               │
│  (240px)   │  (Sidebar visible siempre)  │
│            │  (Grid 4 columnas)          │
└─────────────────────────────────────────┘
```

### Tablet (768px-1024px)
```
┌──────────────────────────┐
│ SIDEBAR   │  MAIN        │
│ (192px)   │  (Grid 2 col)│
└──────────────────────────┘
```

### Mobile (≤768px)
```
┌──────────────┐
│ SIDEBAR      │  (Colapsable)
│ (Drawer/Menu)│
├──────────────┤
│ MAIN CONTENT │  (Stack 1 col)
└──────────────┘
```

---

## 🔑 CARACTERÍSTICAS TÉCNICAS

### Componentes Utilizados
- ✅ **ReportsLayout:** Wrapper común con sidebar
- ✅ **KPICard:** Cards de métricas principales
- ✅ **Recharts:** LineChart, BarChart, PieChart, ScatterChart, RadarChart

### Librerías
- ✅ **framer-motion:** Animaciones entrada (opacity + y offset)
- ✅ **react-icons:** Iconografía FiX
- ✅ **tailwindcss:** Estilos y responsive
- ✅ **recharts:** Gráficos de datos

### Patrones
- ✅ **usemo:** Memoización de gráficos
- ✅ **motion.div:** Componentes animados
- ✅ **motion.button:** Botones interactivos
- ✅ **Grid responsive:** grid-cols-1 sm:grid-cols-2 lg:grid-cols-3

---

## 📈 PÁGINAS CREADAS

| URL | Archivo | KPIs | Gráficos | Tabla |
|-----|---------|------|----------|-------|
| `/reports` | `page.tsx` | 4 | 0 | 0 |
| `/reports/revenue` | `revenue/page.tsx` | 4 | 2 (Line, Pie) | 1 |
| `/reports/appointments` | `appointments/page.tsx` | 4 | 2 (Bar, Bars) | 1 |
| `/reports/clients` | `clients/page.tsx` | 4 | 2 (Line, Bars) | 1 |
| `/reports/services` | `services/page.tsx` | 4 | 2 (Scatter, Bar) | 1 |
| `/reports/performance` | `performance/page.tsx` | 4 | 2 (Bar, Radar) | 1 |
| `/reports/heatmap` | `heatmap/page.tsx` | 4 | 1 (Grid) | 1 |

**Total:** 7 páginas, 28 KPIs, 11 gráficos, 6 tablas

---

## 🚀 ESTADO ACTUAL

✅ Frontend UI **100% Complete**
- [x] Todas las páginas creadas
- [x] Menú sidebar implementado
- [x] Gráficos Recharts integrados
- [x] Animaciones Framer Motion
- [x] Responsive design
- [x] Mock data implementado

⏳ Backend **Pendiente**
- [ ] APIs de reportes en NestJS
- [ ] Queries a PostgreSQL
- [ ] Filtros de fecha
- [ ] Caché/Optimización

---

## 💡 CASOS DE USO POR REPORTE

| Reporte | Usuario | Frecuencia | Acción |
|---------|---------|-----------|--------|
| Ingresos | Gerente/Dueño | Diaria | Monitoring, forecasting |
| Citas | Jefe Operaciones | Diaria | Ajuste capacidad |
| Clientes | Marketing/Ventas | Semanal | Campañas, retención |
| Servicios | Product Manager | Mensual | Pricing, inversión |
| Performance | HR/Gerente | Mensual | Bonificaciones, coaching |
| Geografía | Expansión | Trimestral | Nuevas sucursales |

---

## 🎓 PRÓXIMOS PASOS

1. **Conectar APIs reales** (NestJS backend)
2. **Implementar filtros de fecha** (Date range pickers)
3. **Agregar exportación** (PDF, Excel, CSV)
4. **Crear alertas** (Triggers cuando métricas caen)
5. **Dashboard personalizado** (Cada usuario ve lo que necesita)
6. **Deep dives** (Click en gráfico → detalle)

---

**Status:** ✅ IMPLEMENTACIÓN COMPLETE
**Última actualización:** Marzo 2026
**Próxima versión:** Integración APIs + Exportación

