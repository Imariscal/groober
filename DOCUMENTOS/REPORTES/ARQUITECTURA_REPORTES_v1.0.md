# 🏗️ Arquitectura de Software - Sistema de Reportes VibraLive

**Documento:** ARQUITECTURA_REPORTES_v1.0  
**Versión:** 1.0  
**Estado:** IMPLEMENTADO  
**Fecha:** Marzo 8, 2026

---

## 📋 Tabla de Contenidos

1. [Vista General](#vista-general)
2. [Arquitectura por Capas](#arquitectura-por-capas)
3. [Módulo Backend - Reports](#módulo-backend---reports)
4. [Cliente Frontend](#cliente-frontend)
5. [Flujo de Datos](#flujo-de-datos)
6. [Endpoints API](#endpoints-api)
7. [Componentes React](#componentes-react)

---

## 👀 Vista General

La arquitectura está diseñada siguiendo el patrón **MVC + Services** en el backend y **React Hooks + API Client** en el frontend.

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js 14)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Components (Pages, Layouts)                        │  │
│  │  - /clinic/reports/page.tsx (Overview)                   │  │
│  │  - /clinic/reports/revenue/page.tsx                      │  │
│  │  - /clinic/reports/appointments/page.tsx                 │  │
│  │  - etc...                                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↑                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Custom Hooks (useReports.ts)                            │  │
│  │  - useRevenueReport()                                    │  │
│  │  - useAppointmentsReport()                               │  │
│  │  - useClientsReport()                                    │  │
│  │  - etc...                                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↑                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Client (reports-api.ts)                            │  │
│  │  - reportsApi.getRevenueReport()                         │  │
│  │  - reportsApi.getAppointmentsReport()                    │  │
│  │  - etc...                                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↑  HTTP GET                         │
├─────────────────────────────────────────────────────────────────┤
│                  HTTP/REST API Gateway                           │
├─────────────────────────────────────────────────────────────────┤
│                    BACKEND (NestJS)                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ReportsController                                       │  │
│  │  - GET /reports/revenue                                 │  │
│  │  - GET /reports/appointments                            │  │
│  │  - GET /reports/clients                                 │  │
│  │  - GET /reports/services                                │  │
│  │  - GET /reports/performance                             │  │
│  │  - GET /reports/geography                               │  │
│  │  - GET /reports/overview                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↑                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ReportsService (Coordinador Principal)                  │  │
│  │  - getRevenueReport()                                    │  │
│  │  - getAppointmentsReport()                               │  │
│  │  - getClientsReport()                                    │  │
│  │  - etc...                                                │  │
│  │  - getNormalizeDateRange()                              │  │
│  │  - formatCurrency()                                      │  │
│  │  - calculatePercentageChange()                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↑                                    │
│  ┌────────────┬─────────────┬────────────┬──────────────────┐   │
│  │            │             │            │                  │   │
│  ↓            ↓             ↓            ↓                  ↓   │
│  ┌──────┐  ┌──────────┐  ┌─────────┐  ┌──────────────┐  ┌──┐  │
│  │Revenue│ │Appointments│ │Clients  │  │Services     │  │...│  │
│  │Service│ │Service   │  │Service  │  │Service      │  │   │  │
│  └──────┘  └──────────┘  └─────────┘  └──────────────┘  └──┘  │
│     ↕          ↕             ↕            ↕                ↕    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  TypeORM Repositories (Database Layer)                  │  │
│  │  - AppointmentRepository                                │  │
│  │  - ClientRepository                                     │  │
│  │  - ServiceRepository                                    │  │
│  │  - ServicePriceRepository                               │  │
│  │  - UserRepository                                       │  │
│  │  - etc...                                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↑                                    │
└──────────────────────────────────────────────────────────────────┘
                              ↕    SQL
                        ┌─────────────┐
                        │ PostgreSQL  │
                        │ Database    │
                        └─────────────┘
```

---

## 🏛️ Arquitectura por Capas

### Capa 1: Presentation (Frontend - Next.js)

**Archivos:**
```
vibralive-frontend/
├── src/
│   ├── app/(protected)/
│   │   └── clinic/reports/
│   │       ├── page.tsx                 # Landing page
│   │       ├── revenue/page.tsx
│   │       ├── appointments/page.tsx
│   │       ├── clients/page.tsx
│   │       ├── services/page.tsx
│   │       ├── performance/page.tsx
│   │       └── heatmap/page.tsx
│   │
│   ├── hooks/
│   │   └── useReports.ts               # Custom hooks para reportes
│   │
│   ├── lib/
│   │   └── reports-api.ts              # API client
│   │
│   └── types/
│       └── reports.ts                   # TypeScript types
```

**Responsabilidades:**
- Renderizar componentes React
- Llamar a hooks personalizados para obtener datos
- Mostrar datos en tablas y gráficos (Recharts)
- Manejo de errores y estados de carga

### Capa 2: API Client (Frontend)

**Archivo:** `vibralive-frontend/src/lib/reports-api.ts`

**Responsabilidades:**
- Construir URLs de solicitudes
- Pasar parámetros de query (period, startDate, endDate)
- Convertir respuestas HTTP a tipos TypeScript
- Manejo de errores HTTP

**Ejemplo:**
```typescript
async getRevenueReport(params?: ReportParams): Promise<RevenueReportResponse> {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.append('period', params.period);
  const response = await api.get(`/reports/revenue?${queryParams.toString()}`);
  return response.data;
}
```

### Capa 3: Custom Hooks (Frontend)

**Archivo:** `vibralive-frontend/src/hooks/useReports.ts`

**Responsabilidades:**
- Encapsular lógica de obtención de datos
- Manejar estados de carga, error y éxito
- Re-obtener datos cuando cambian los parámetros
- Proveer interfaz simple a componentes

**Ejemplo:**
```typescript
export function useRevenueReport(options?: UseReportOptions) {
  const [data, setData] = useState<RevenueReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data when options change
  }, [options?.period]);

  return { data, loading, error };
}
```

### Capa 4: Controller (Backend)

**Archivo:** `vibralive-backend/src/modules/reports/controllers/reports.controller.ts`

**Responsabilidades:**
- Recibir solicitudes HTTP
- Extraer `clinic_id` del usuario autenticado
- Validar parámetros de entrada
- Delegar al servicio
- Retornar respuesta JSON

**Endpoints:**
```
GET /reports/revenue       - Reporte de ingresos
GET /reports/appointments  - Reporte de citas
GET /reports/clients       - Análisis de clientes
GET /reports/services      - Análisis de servicios
GET /reports/performance   - Performance de estilistas
GET /reports/geography     - Geografía/heatmap
GET /reports/overview      - Resumen consolidado
```

### Capa 5: Service Layer (Backend)

**Archivos:**
```
vibralive-backend/src/modules/reports/services/
├── reports.service.ts              # Coordinador principal
├── revenue-report.service.ts        # Lógica de ingresos
├── appointments-report.service.ts   # Lógica de citas
├── clients-report.service.ts        # Lógica de clientes
├── services-report.service.ts       # Lógica de servicios
├── performance-report.service.ts    # Lógica de performance
├── geography-report.service.ts      # Lógica de geografía
└── overview-report.service.ts       # Lógica de overview
```

**Responsabilidades:**
- Orquestar consultas a la base de datos
- Transformar datos raw en DTOs
- Aplicar lógica de negocio (cálculos, agregaciones)
- Caché de resultados (futuro)

**Ejemplo (RevenueReportService):**
```typescript
async generate(params: ReportQueryParams): Promise<RevenueReportResponse> {
  const { startDate, endDate } = this.reportsService.getNormalizeDateRange(period);
  
  const [totalRevenue, avgPrice, dailyRevenue, serviceRevenue] = await Promise.all([
    this.getTotalRevenueInPeriod(clinicId, startDate, endDate),
    this.getAveragePricePerAppointment(clinicId, startDate, endDate),
    this.getDailyRevenueData(clinicId, startDate, endDate),
    this.getServiceRevenueBreakdown(clinicId, startDate, endDate),
  ]);

  return {
    kpis: { ... },
    charts: { ... },
    metadata: { ... }
  };
}
```

### Capa 6: Data Access Layer (Backend)

**Responsabilidades:**
- TypeORM repositories para cada entidad
- Construcción y ejecución de queries SQL
- Transformación de resultados

**Ejemplo Query:**
```typescript
private async getTotalRevenueInPeriod(clinicId: string, startDate: Date, endDate: Date) {
  const result = await this.appointmentRepository
    .createQueryBuilder('appointment')
    .select('SUM(CAST(servicePrice.price AS FLOAT))', 'totalRevenue')
    .leftJoin('appointment.appointmentServices', 'appointmentService')
    .leftJoin(ServicePrice, 'servicePrice', ...)
    .where('appointment.clinic_id = :clinicId', { clinicId })
    .andWhere('appointment.status IN (:...statuses)', { statuses: ['CONFIRMED', 'COMPLETED'] })
    .andWhere('appointment.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
    .getRawOne();

  return parseFloat(result?.totalRevenue) || 0;
}
```

### Capa 7: Database (PostgreSQL)

**Tablas utilizadas:**
- `appointments` - Citas registradas
- `clients` - Clientes/dueños
- `pets` - Mascotas
- `services` - Servicios disponibles
- `service_prices` - Precios de servicios
- `users` - Estilistas/veterinarios
- `price_lists` - Listas de precios
- `clinics` - Clínicas (tenant)

---

## 🔧 Módulo Backend - Reports

### Estructura de Archivos

```
vibralive-backend/src/modules/reports/
├── controllers/
│   └── reports.controller.ts
├── services/
│   ├── reports.service.ts                    # Coordinador
│   ├── revenue-report.service.ts
│   ├── appointments-report.service.ts
│   ├── clients-report.service.ts
│   ├── services-report.service.ts
│   ├── performance-report.service.ts
│   ├── geography-report.service.ts
│   └── overview-report.service.ts
├── dto/
│   └── reports.dto.ts                        # Data Transfer Objects
└── reports.module.ts                         # Módulo principal
```

### Integración en app.module.ts

```typescript
import { ReportsModule } from '@/modules/reports/reports.module';

@Module({
  imports: [
    // ... otros módulos ...
    ReportsModule,  // ← Agregado
  ],
})
export class AppModule {}
```

### DTOs (Data Transfer Objects)

**Archivo:** `vibralive-backend/src/modules/reports/dto/reports.dto.ts`

Contiene interfaces TypeScript para:
- Request parameters
- Response structures
- KPI cards
- Chart data
- Meta information

Ejemplo:
```typescript
interface RevenueReportResponse {
  kpis: {
    totalRevenue: RevenueKPICard;
    avgPerAppointment: RevenueKPICard;
    dailyAverage: RevenueKPICard;
    ticketPerClient: RevenueKPICard;
  };
  charts: {
    cumulativeRevenue: RevenueChartData[];
    byService: ServiceRevenue[];
  };
  metadata: { ... };
}
```

---

## 🎨 Cliente Frontend

### API Client (reports-api.ts)

Expone métodos simples para consumir cada endpoint:

```typescript
export const reportsApi = {
  async getRevenueReport(params?: ReportParams): Promise<RevenueReportResponse>,
  async getAppointmentsReport(params?: ReportParams): Promise<AppointmentsReportResponse>,
  async getClientsReport(params?: ReportParams): Promise<ClientsReportResponse>,
  // ... etc
}
```

### Custom Hooks (useReports.ts)

Wraps API client en hooks React reutilizables:

```typescript
export function useRevenueReport(options?: UseReportOptions) {
  return { data, loading, error };
}

export function useAppointmentsReport(options?: UseReportOptions) {
  return { data, loading, error };
}
// ... etc
```

### Uso en Componentes

```typescript
'use client';

import { useRevenueReport } from '@/hooks/useReports';

export default function RevenueReportPage() {
  const { data, loading, error } = useRevenueReport({ period: 'month' });

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <KPICard {...data.kpis.totalRevenue} />
      <LineChart data={data.charts.cumulativeRevenue} />
      <PieChart data={data.charts.byService} />
    </div>
  );
}
```

---

## 📊 Flujo de Datos

### 1. Usuario Navega a Reporte

```
Usuario hace click en /clinic/reports/revenue
       ↓
Next.js carga RevenueReportPage component
```

### 2. Componente Obtiene Datos

```
RevenueReportPage
       ↓
const { data, loading } = useRevenueReport({ period: 'month' })
       ↓
Hook dispara useEffect
       ↓
Hook llama a reportsApi.getRevenueReport()
```

### 3. API Client Construye Request

```
reportsApi.getRevenueReport()
       ↓
Construye URL: /api/reports/revenue?period=month
       ↓
Hace GET request con axios
       ↓
Retorna datos como RevenueReportResponse
```

### 4. Backend Recibe Request

```
GET /api/reports/revenue?period=month
       ↓
ReportsController.getRevenueReport()
       ↓
Extrae clinic_id del JWT
       ↓
Crea ReportQueryParams { clinicId, period }
       ↓
Llama reportsService.getRevenueReport(params)
```

### 5. Service Genera Reporte

```
ReportsService.getRevenueReport()
       ↓
Delega a RevenueReportService.generate()
       ↓
Calcula date range (month_start → today)
       ↓
Ejecuta 5 queries en paralelo:
  - getTotalRevenueInPeriod()
  - getAveragePricePerAppointment()
  - getDailyRevenueData()
  - getServiceRevenueBreakdown()
  - getPreviousRevenue() [para trending]
       ↓
Transforma datos a RevenueReportResponse
       ↓
Retorna JSON
```

### 6. Backend Envía Respuesta

```
Controller retorna RevenueReportResponse
       ↓
NestJS serializa a JSON
       ↓
HTTP 200 con body = JSON report data
```

### 7. Frontend Consume Respuesta

```
API Client retorna datos tipados
       ↓
Hook actualiza estado
       ↓
Componente re-renderiza con nuevos datos
       ↓
Recharts renderiza gráficos
       ↓
Usuario ve reporte actualizado
```

---

## 🔌 Endpoints API

### Base URL
```
POST /api/auth/login
GET  /api/reports/{reportType}

Request Headers:
Authorization: Bearer <JWT_TOKEN>
```

### 1. Revenue Report
```
GET /api/reports/revenue?period=month&startDate=2026-03-01&endDate=2026-03-31

Response:
{
  "kpis": {
    "totalRevenue": {
      "label": "Ingresos Totales",
      "value": "$45,600 MXN",
      "change": "↑ 12%",
      "period": "Mes actual"
    },
    ...
  },
  "charts": {
    "cumulativeRevenue": [
      { "date": "2026-03-01", "revenue": 1200 },
      ...
    ],
    "byService": [
      { "name": "Grooming", "revenue": 25000, "percentage": 54.8, ... },
      ...
    ]
  },
  "metadata": { "period": "month", "currency": "MXN", "lastUpdated": "2026-03-08T..." }
}
```

### 2. Appointments Report
```
GET /api/reports/appointments?period=week

Response:
{
  "kpis": {
    "confirmedThisWeek": { "value": "12 citas", ... },
    "confirmationRate": { "value": "85%", ... },
    ...
  },
  "charts": {
    "byDay": [
      { "date": "2026-03-08", "dayName": "dom", "scheduled": 2, "confirmed": 2, "cancelled": 0 },
      ...
    ],
    "byStylist": [
      { "name": "María García", "appointmentCount": 8, ... },
      ...
    ]
  },
  "appointments": [
    { "time": "10:00", "clientName": "Juan Pérez", "petName": "Firulais", ... },
    ...
  ]
}
```

### Query Parameters Soportados

```
period:    'today' | 'week' | 'month' | 'year' | 'custom'
startDate: ISO date string (ej: 2026-03-01)
endDate:   ISO date string (ej: 2026-03-31)
```

---

## ⚛️ Componentes React

### Estructura de Componentes Report

Cada página de reporte sigue este patrón:

```typescript
'use client';

import { useRevenueReport } from '@/hooks/useReports';
import { KPICard } from '@/components/common/KPICard';
import { LineChart } from 'recharts';

export default function RevenueReportPage() {
  const { data, loading, error } = useRevenueReport({ period: 'month' });

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <ReportsLayout title="Ingresos" subtitle="...">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard {...data.kpis.totalRevenue} />
        <KPICard {...data.kpis.avgPerAppointment} />
        <KPICard {...data.kpis.dailyAverage} />
        <KPICard {...data.kpis.ticketPerClient} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <LineChart data={data.charts.cumulativeRevenue} />
        <PieChart data={data.charts.byService} />
      </div>

      {/* Table */}
      <ServiceRevenueTable data={data.charts.byService} />
    </ReportsLayout>
  );
}
```

---

## 🔐 Seguridad

### Autenticación
- JWT token requerido en header `Authorization`
- Extraído del middleware de NestJS

### Autorización
- `clinic_id` extraído del JWT
- Se filtra automáticamente por clínica
- No puede ver datos de otras clínicas

### Validación
- Query parameters validados en Controller
- Dates formateadas y normalizadas
- Limites de date range (máximo 1 año)

---

## ⚡ Performance

### Optimizaciones Implementadas

1. **Queries Paralelas**
   ```typescript
   const [data1, data2, data3] = await Promise.all([
     query1(),
     query2(),
     query3()
   ]);
   ```

2. **Select Específico**
   - No traer todas las columnas
   - Solo campos necesarios

3. **Índices en BD**
   - clinic_id (filtro principal)
   - created_at (rango temporal)
   - status (filtros comunes)

4. **Caching (Futuro)**
   - Redis cache para reportes frecuentes
   - Invalidación automática

5. **Paginación (Futuro)**
   - Tablas grandes con lazy loading
   - Servidor-side rendering de datos

---

## 📈 Roadmap de Mejoras

### Fase 1 ✅ COMPLETADA
- [x] Arquitectura base
- [x] 7 reportes principales
- [x] Endpoints API
- [x] Frontend hooks
- [x] Componentes React

### Fase 2 🚧 PLANIFICADA
- [ ] Backend real data integration (completar queries)
- [ ] Caché con Redis
- [ ] Exportar a PDF/Excel
- [ ] Filtros avanzados
- [ ] Alertas automáticas

### Fase 3 📋 FUTURO
- [ ] Forecasting/Predictive analytics
- [ ] Comparativas vs competencia
- [ ] Machine learning para anomalías
- [ ] Mobile app reports
- [ ] Custom report builder

---

## 📞 Checklist Implementación

### Backend ✅
- [x] Módulo Reports creado
- [x] Controllers implementados (7 endpoints)
- [x] Services base implementados
- [x] DTOs definidos
- [x] Integrado a app.module.ts
- [ ] Queries SQL finalizadas (in progress)

### Frontend ✅
- [x] Types definidos
- [x] API client creado
- [x] Custom hooks creados
- [x] Rutas configuradas
- [x] Componentes renderizados
- [ ] Datos reales integrados (próximo)

### Testing
- [ ] Unit tests para services
- [ ] Integration tests para endpoints
- [ ] E2E tests para flujos

---

## 🎯 Próximos Pasos Inmediatos

1. **Completar Queries en Backend**
   - Finalizar ServicesReportService queries
   - Finalizar PerformanceReportService queries
   - Finalizar GeographyReportService queries

2. **Conectar Frontend a Backend Real**
   - Actualizar componentes para usar datos reales
   - Remover mock data
   - Agregar error handling

3. **Testing**
   - Probar cada endpoint
   - Validar datos con BD real

4. **Optimización**
   - Profiler de queries
   - Índices en BD si es necesario
   - Cache strategy

---

Este documento será la guía de referencia para mantener y extender el sistema de reportes.
