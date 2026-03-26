# 📊 Especificación de Reportes - Business Analyst
**VibraLive - Sistema de Gestión Veterinaria**

**Documento:** BA_ESPECIFICACION_REPORTES_v1.0  
**Fecha:** Marzo 8, 2026  
**Versión:** 1.0  
**Estado:** ACTIVO - Listo para implementación  
**Scope:** Reportes para Dueños de Clínica (Clinic Owner)

---

## 📋 Resumen Ejecutivo

Este documento detalla los **7 Reportes Principales** que debe mostrar el sistema VibraLive a los dueños de clínicas. Cada reporte está basado en entidades reales de la base de datos y proporciona KPIs accionables para la toma de decisiones.

### Objetivo Estratégico
Empoderar a los dueños de clínicas con **visibilidad en tiempo real** sobre:
- **Salud Financiera** → Ingresos, presupuestos
- **Operativo** → Citas, eficiencia de estilistas
- **Clientes** → Retención, crecimiento, segmentación
- **Servicios** → Demanda, popularidad, rentabilidad
- **Geográfico** → Cobertura, zonas calientes

---

## 🎯 Reporte 1: INGRESOS (Revenue)

**Objetivo:** Visibilidad financiera clara del negocio  
**Usuarios:** Owner, Gerente administrativo  
**Frecuencia Ideal:** Diaria / Semanal / Mensual

### 1.1 Fuentes de Datos

| Entidad | Campo | Descripción |
|---------|-------|-------------|
| `appointments` | `id`, `created_at`, `status` | Citas realizadas (filtrar por CONFIRMED/COMPLETED) |
| `service_prices` | `service_id`, `price`, `is_available` | Precios de servicios ejecutados |
| `services` | `name`, `type` | Nombre y tipo de servicio (SERVICE\|PRODUCT) |
| `price_lists` | `name`, `is_default` | Lista de precios aplicada |
| `clients` | `name`, `price_list_id` | Cliente que pagó |

### 1.2 Métricas Principales

#### KPI Card 1: Ingresos Totales (MTD)
```
FÓRMULA:
SUM(service_prices.price) 
WHERE appointments.status = 'CONFIRMED' 
AND appointments.created_at >= month_start()
AND appointments.created_at <= TODAY

METADATOS:
- Valor: $XX,XXX MXN
- Trending: % cambio vs mes anterior
- Period: "Mes actual" / "Últimos 30 días"
```

#### KPI Card 2: Ingresos Promedio por Cita
```
FÓRMULA:
AVG(service_prices.price) 
WHERE status = 'CONFIRMED' AND created_at >= month_start()

METADATOS:
- Valor: $XXX MXN
- Trending: "↑ XX% vs mes anterior"
```

#### KPI Card 3: Promedio Diario (ARPU)
```
FÓRMULA:
SUM(service_prices.price) / COUNT(DISTINCT DATE(appointments.scheduled_at))
WHERE status = 'CONFIRMED' AND created_at >= month_start()

METADATOS:
- Valor: $XXX MXN/día
- Trending: "Ritmo sostenido"
```

#### KPI Card 4: Ticket Promedio por Cliente
```
FÓRMULA:
SUM(service_prices.price) / COUNT(DISTINCT appointments.client_id)

METADATOS:
- Valor: $XXX MXN
- Info: "Clientes que pagaron"
```

### 1.3 Visualizaciones

#### Gráfico 1: Línea de Ingresos Acumulados (MTD)
```
Eje X: Días del mes (1-31)
Eje Y: $ Ingresos acumulados
Tipo: LineChart (Recharts)
Datos: 
  - Diarios acumulados desde inicio de mes
  - Línea de meta/proyección (opcional)

QUERY BASE:
SELECT 
  DATE(appointments.created_at) as date,
  SUM(service_prices.price) as daily_revenue
FROM appointments
JOIN service_prices ON service_prices.id = ... (a través de appointment_services)
WHERE clinic_id = $clinicId
AND status = 'CONFIRMED'
AND DATE(created_at) >= DATE_TRUNC('month', NOW())
GROUP BY DATE(appointments.created_at)
ORDER BY date ASC
```

#### Gráfico 2: Distribución de Ingresos por Servicio (Pie)
```
Eje: Categorías (nombres de servicios)
Tamaño: % del ingreso total
Tipo: PieChart (Recharts)
Colores: 6-8 colores diferentes

QUERY:
SELECT 
  services.name,
  SUM(service_prices.price) as revenue,
  ROUND(SUM(service_prices.price) * 100.0 / SUM(SUM(service_prices.price)) OVER (), 2) as percentage
FROM appointments
JOIN appointment_services ON appointment_services.appointment_id = appointments.id
JOIN services ON services.id = appointment_services.service_id
JOIN service_prices ON ...
WHERE appointments.clinic_id = $clinicId
AND appointments.status = 'CONFIRMED'
AND DATE(appointments.created_at) >= DATE_TRUNC('month', NOW())
GROUP BY services.id, services.name
ORDER BY revenue DESC
LIMIT 8
```

#### Tabla: Top 5 Servicios por Ingresos
```
Columnas:
| Servicio | Ingresos | % del Total | Citas | Precio Promedio |

QUERY:
SELECT 
  services.name,
  SUM(service_prices.price) as total_revenue,
  ROUND(SUM(service_prices.price) * 100.0 / SUM(SUM(service_prices.price)) OVER (), 2) as percentage,
  COUNT(appointments.id) as appointment_count,
  AVG(service_prices.price) as avg_price
FROM appointments
JOIN appointment_services ON ...
JOIN services ON ...
JOIN service_prices ON ...
WHERE clinic_id = $clinicId AND status = 'CONFIRMED'
GROUP BY services.id, services.name
ORDER BY total_revenue DESC
LIMIT 5
```

---

## 🎯 Reporte 2: CITAS (Appointments)

**Objetivo:** Capacidad operativa y eficiencia de citas  
**Usuarios:** Owner, Gerente operativo, Estilistas  
**Frecuencia:** Diaria / Semanal

### 2.1 Fuentes de Datos

| Entidad | Campo | Descripción |
|---------|-------|-------------|
| `appointments` | `id`, `status`, `scheduled_at`, `created_at`, `duration_minutes`, `veterinarian_id` | Citas registradas |
| `clients` | `name`, `phone` | Cliente de la cita |
| `pets` | `name`, `animal_type_id` | Mascota de la cita |
| `users` | `name`, `role` | Estilista/veterinario asignado |

### 2.2 Métricas Principales

#### KPI Card 1: Citas Confirmadas (Semana)
```
FÓRMULA:
COUNT(appointments.id)
WHERE status IN ('SCHEDULED', 'CONFIRMED')
AND DATE(scheduled_at) >= DATE_TRUNC('week', NOW())
AND DATE(scheduled_at) < DATE_TRUNC('week', NOW()) + INTERVAL '7 days'

METADATOS:
- Valor: XX citas
- Trending: "↑ XX citas vs semana anterior"
```

#### KPI Card 2: Tasa de Confirmación
```
FÓRMULA:
COUNT(CASE WHEN status = 'CONFIRMED') / COUNT(*) * 100

METADATOS:
- Valor: XX%
- Trending: "Objetivo: 85%"
```

#### KPI Card 3: Citas Canceladas
```
FÓRMULA:
COUNT(appointments.id)
WHERE status = 'CANCELLED'
AND DATE(cancelled_at) >= DATE_TRUNC('month', NOW())

METADATOS:
- Valor: XX citas
- Trending: "XX% de cancellation rate"
```

#### KPI Card 4: Cliente Más Activo
```
FÓRMULA:
SELECT clients.name, COUNT(appointments.id) as citas

METADATOS:
- Valor: "Juan García - 12 citas"
- Trending: "Cliente VIP"
```

### 2.3 Visualizaciones

#### Gráfico 1: Citas por Día (BarChart - Semanal)
```
Eje X: Días de la semana (Lun-Dom)
Eje Y: Cantidad de citas
Tipo: BarChart (Recharts)
Datos: 
  - SCHEDULED (azul)
  - CONFIRMED (verde)
  - CANCELLED (rojo)

QUERY:
SELECT 
  TO_CHAR(DATE(scheduled_at), 'dy') as day_name,
  DATE(scheduled_at) as date,
  status,
  COUNT(*) as count
FROM appointments
WHERE clinic_id = $clinicId
AND DATE(scheduled_at) >= DATE_TRUNC('week', NOW())
GROUP BY DATE(scheduled_at), TO_CHAR(DATE(scheduled_at), 'dy'), status
ORDER BY date ASC
```

#### Gráfico 2: Citas por Estilista (BarChart Horizontal)
```
Eje Y: Nombres de estilistas
Eje X: Cantidad de citas
Tipo: BarChart horizontal
Límite: Top 8 estilistas

QUERY:
SELECT 
  users.name,
  COUNT(appointments.id) as appointment_count,
  COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) as confirmed_count,
  COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_count
FROM appointments
JOIN users ON users.id = appointments.veterinarian_id
WHERE appointments.clinic_id = $clinicId
AND DATE(appointments.scheduled_at) >= DATE_TRUNC('month', NOW())
GROUP BY users.id, users.name
ORDER BY appointment_count DESC
LIMIT 8
```

#### Tabla: Citas de Hoy y Mañana
```
Columnas:
| Hora | Cliente | Mascota | Servicio | Estilista | Status |

QUERY:
SELECT 
  appointments.scheduled_at,
  clients.name as client_name,
  pets.name as pet_name,
  services.name,
  users.name as stylist_name,
  appointments.status
FROM appointments
JOIN clients ON clients.id = appointments.client_id
JOIN pets ON pets.id = appointments.pet_id
JOIN appointment_services ON appointment_services.appointment_id = appointments.id
JOIN services ON services.id = appointment_services.service_id
JOIN users ON users.id = appointments.veterinarian_id
WHERE appointments.clinic_id = $clinicId
AND DATE(appointments.scheduled_at) IN (DATE(CURRENT_DATE), DATE(CURRENT_DATE + 1))
ORDER BY appointments.scheduled_at ASC
```

---

## 🎯 Reporte 3: CLIENTES (Clients)

**Objetivo:** Crecimiento, retención y segmentación de clientes  
**Usuarios:** Owner, Gerente comercial  
**Frecuencia:** Semanal / Mensual

### 3.1 Fuentes de Datos

| Entidad | Campo | Descripción |
|---------|-------|-------------|
| `clients` | `id`, `name`, `email`, `phone`, `price_list_id`, `created_at` | Registro de clientes |
| `appointments` | `client_id`, `created_at`, `status` | Historial de compras |
| `pets` | `client_id`, `id` | Mascotas por cliente |
| `price_lists` | `name`, `is_default` | Segmentación por lista de precios |

### 3.2 Métricas Principales

#### KPI Card 1: Total de Clientes Activos
```
FÓRMULA:
COUNT(DISTINCT clients.id)
WHERE clients.clinic_id = $clinicId
AND EXISTS(SELECT 1 FROM appointments WHERE client_id = clients.id AND DATE(created_at) >= 90 days ago)

METADATOS:
- Valor: XXX clientes
- Trending: "↑ XX clientes vs mes anterior"
```

#### KPI Card 2: Clientes Nuevos (Mensual)
```
FÓRMULA:
COUNT(clients.id)
WHERE DATE_TRUNC('month', clients.created_at) = DATE_TRUNC('month', NOW())

METADATOS:
- Valor: XX clientes
- Trending: "Meta: XX clientes/mes"
```

#### KPI Card 3: Clientes por Tipo de Plan
```
FÓRMULA:
COUNT(DISTINCT clients.id) 
GROUP BY price_lists.name

METADATOS:
[
  { plan: "Plan Básico", count: XX, color: "blue" },
  { plan: "Plan Premium", count: XX, color: "purple" },
  { plan: "Plan VIP", count: XX, color: "gold" }
]
```

#### KPI Card 4: Retención (Repeat Rate)
```
FÓRMULA:
COUNT(DISTINCT CASE 
  WHEN (SELECT COUNT(*) FROM appointments a WHERE a.client_id = clients.id) > 1 
  THEN clients.id
) / COUNT(DISTINCT clients.id) * 100

METADATOS:
- Valor: XX%
- Trending: "Objective: 65%"
```

### 3.3 Visualizaciones

#### Gráfico 1: Crecimiento de Clientes (LineChart)
```
Eje X: Meses (últimos 12)
Eje Y: Clientes acumulados
Tipo: AreaChart (Recharts)
Datos:
  - Línea azul: Total acumulado
  - Línea punteada: Tendencia

QUERY:
SELECT 
  DATE_TRUNC('month', clients.created_at)::DATE as month,
  COUNT(DISTINCT clients.id) as new_clients,
  SUM(COUNT(DISTINCT clients.id)) OVER (ORDER BY DATE_TRUNC('month', clients.created_at)) as cumulative_clients
FROM clients
WHERE clients.clinic_id = $clinicId
AND DATE_TRUNC('year', clients.created_at) = DATE_TRUNC('year', NOW())
GROUP BY DATE_TRUNC('month', clients.created_at)
ORDER BY month ASC
```

#### Gráfico 2: Top 10 Clientes por Ingresos
```
Eje X: Clientes (nombres)
Eje Y: $ Ingresos generados
Tipo: BarChart (Recharts)

QUERY:
SELECT 
  clients.name,
  COUNT(DISTINCT appointments.id) as total_appointments,
  SUM(service_prices.price) as total_spent
FROM clients
JOIN appointments ON appointments.client_id = clients.id
JOIN appointment_services ON appointment_services.appointment_id = appointments.id
JOIN service_prices ON ...
WHERE clients.clinic_id = $clinicId
AND appointments.status IN ('CONFIRMED', 'COMPLETED')
GROUP BY clients.id, clients.name
ORDER BY total_spent DESC
LIMIT 10
```

#### Tabla: Análisis de Clientes
```
Columnas:
| Nombre | Email | Teléfono | Citas | Última Cita | Plan | Estado |

QUERY:
SELECT 
  clients.name,
  clients.email,
  clients.phone,
  COUNT(DISTINCT appointments.id) as total_appointments,
  MAX(appointments.scheduled_at) as last_appointment,
  price_lists.name as plan_name,
  CASE 
    WHEN MAX(appointments.scheduled_at) >= NOW() - INTERVAL '30 days' THEN 'Activo'
    ELSE 'Inactivo'
  END as status
FROM clients
LEFT JOIN appointments ON appointments.client_id = clients.id
LEFT JOIN price_lists ON price_lists.id = clients.price_list_id
WHERE clients.clinic_id = $clinicId
GROUP BY clients.id, clients.name, clients.email, clients.phone, clients.price_list_id, price_lists.name
ORDER BY total_appointments DESC
LIMIT 50
```

---

## 🎯 Reporte 4: SERVICIOS (Services)

**Objetivo:** Identificar servicios populares y rentables  
**Usuarios:** Owner, Gerente de servicios  
**Frecuencia:** Semanal / Mensual

### 4.1 Fuentes de Datos

| Entidad | Campo | Descripción |
|---------|-------|-------------|
| `services` | `id`, `name`, `type`, `is_active` | Catálogo de servicios |
| `service_prices` | `service_id`, `price` | Precios por lista |
| `appointments` | `id`, `created_at` | Citas realizadas |
| `appointment_services` | `appointment_id`, `service_id` | Relación cita-servicio |

### 4.2 Métricas Principales

#### KPI Card 1: Servicios Activos
```
FÓRMULA:
COUNT(services.id) WHERE is_active = true

METADATOS:
- Valor: XX servicios
- Info: "Con demanda registrada"
```

#### KPI Card 2: Servicio Más Demandado
```
FÓRMULA:
SELECT services.name, COUNT(appointment_services.id) as demand
ORDER BY demand DESC LIMIT 1

METADATOS:
- Valor: "Grooming estándar - 67 citas"
- Trending: "↑ 12% vs mes anterior"
```

#### KPI Card 3: Servicio Más Rentable
```
FÓRMULA:
SELECT services.name, SUM(service_prices.price) as revenue

METADATOS:
- Valor: "Baño + corte - $2,450 MXN"
- Trending: "↑ 8% ingresos"
```

#### KPI Card 4: Tasa de Disponibilidad
```
FÓRMULA:
COUNT(DISTINCT CASE WHEN is_available = true) / COUNT(DISTINCT services.id) * 100

METADATOS:
- Valor: 95%
- Info: "Servicios disponibles en plan default"
```

### 4.3 Visualizaciones

#### Tabla: Matriz de Servicios (Principal)
```
Columnas:
| Servicio | Tipo | Demanda | Ingresos | Precio Prom. | Margen | Estado |

QUERY:
SELECT 
  services.name,
  services.type,
  COUNT(DISTINCT appointment_services.id) as demand_count,
  SUM(service_prices.price) as total_revenue,
  AVG(service_prices.price) as avg_price,
  ROUND(AVG(service_prices.price) * 0.40)::TEXT || ' MXN' as estimated_margin,
  CASE WHEN services.is_active = true THEN '✓ Activo' ELSE '✗ Inactivo' END as status
FROM services
LEFT JOIN appointment_services ON appointment_services.service_id = services.id
LEFT JOIN service_prices ON service_prices.service_id = services.id
WHERE services.clinic_id = $clinicId
AND DATE(services.created_at) >= DATE_TRUNC('month', NOW())
GROUP BY services.id, services.name, services.type, services.is_active
ORDER BY demand_count DESC
LIMIT 20
```

#### Gráfico 1: Demanda vs Rentabilidad (ScatterChart)
```
Eje X: Demanda (cantidad de citas)
Eje Y: Ingresos ($)
Tamaño burbujas: Frecuencia
Colores: Por tipo (SERVICE=azul, PRODUCT=naranja)

QUERY: (ver tabla arriba)
```

#### Gráfico 2: Top 8 Servicios por Demanda
```
Tipo: BarChart horizontal
Colores: Degradado azul-morado

QUERY:
SELECT 
  services.name,
  COUNT(appointment_services.id) as demand_count
FROM services
LEFT JOIN appointment_services ON appointment_services.service_id = services.id
WHERE services.clinic_id = $clinicId
AND services.is_active = true
GROUP BY services.id, services.name
ORDER BY demand_count DESC
LIMIT 8
```

---

## 🎯 Reporte 5: PERFORMANCE (Estilistas)

**Objetivo:** Evaluar productividad y eficiencia del equipo  
**Usuarios:** Owner, Supervisor, Estilistas (solo datos propios)  
**Frecuencia:** Semanal / Diaria

### 5.1 Fuentes de Datos

| Entidad | Campo | Descripción |
|---------|-------|-------------|
| `users` | `id`, `name`, `role`, `status` | Estilistas/personal |
| `appointments` | `veterinarian_id`, `status`, `scheduled_at`, `duration_minutes` | Citas por estilista |
| `service_prices` | `price` | Ingresos generados |

### 5.2 Métricas Principales

#### KPI Card 1: Total de Estilistas Activos
```
FÓRMULA:
COUNT(users.id) WHERE role = 'staff' AND status = 'ACTIVE'

METADATOS:
- Valor: XX estilistas
- Info: "Disponibles esta semana"
```

#### KPI Card 2: Citas Promedio por Estilista
```
FÓRMULA:
COUNT(DISTINCT appointments.id) / COUNT(DISTINCT users.id)
WHERE DATE(scheduled_at) >= DATE_TRUNC('week', NOW())

METADATOS:
- Valor: XX citas/semana
- Trending: "↑ XX% eficiencia"
```

#### KPI Card 3: Tasa de Ocupación
```
FÓRMULA:
SUM(appointments.duration_minutes) / (COUNT(DISTINCT users.id) * 40 * 60) * 100
WHERE DATE(scheduled_at) = CURRENT_DATE

METADATOS:
- Valor: 78%
- Trending: "Capacidad: 85%"
```

#### KPI Card 4: Ingresos Generados por Staff
```
FÓRMULA:
SUM(service_prices.price) / COUNT(DISTINCT users.id)

METADATOS:
- Valor: $5,600 MXN/estilista/semana
- Trending: "↑ 15% vs semana anterior"
```

### 5.3 Visualizaciones

#### Tabla: Scorecard de Estilistas
```
Columnas:
| Estilista | Citas (Sem) | Confirmadas | Cancelled | Rating | Ingresos Sem |

QUERY:
SELECT 
  users.name,
  COUNT(DISTINCT appointments.id) as total_appointments,
  COUNT(DISTINCT CASE WHEN appointments.status = 'CONFIRMED' THEN appointments.id END) as confirmed_count,
  COUNT(DISTINCT CASE WHEN appointments.status = 'CANCELLED' THEN appointments.id END) as cancelled_count,
  ROUND(AVG(CAST(appointments.rating AS NUMERIC)), 1)::TEXT || '★' as rating,
  SUM(service_prices.price)::TEXT || ' MXN' as weekly_revenue
FROM users
LEFT JOIN appointments ON appointments.veterinarian_id = users.id
LEFT JOIN appointment_services ON appointment_services.appointment_id = appointments.id
LEFT JOIN service_prices ON ...
WHERE users.clinic_id = $clinicId
AND users.role = 'staff'
AND users.status = 'ACTIVE'
AND DATE(appointments.scheduled_at) >= DATE_TRUNC('week', NOW())
GROUP BY users.id, users.name
ORDER BY total_appointments DESC
LIMIT 15
```

#### Gráfico 1: Utilización por Estilista (BarChart)
```
Eje X: Estilistas
Eje Y: % de utilización
Tipo: BarChart con línea de meta (85%)
Colores: Verde (>85%), Naranja (65-85%), Rojo (<65%)

CÁLCULO:
(SUM(duration_minutes) / (horas trabajadas * 60)) * 100
```

#### Gráfico 2: Comparativa de Ingresos
```
Tipo: BarChart agrupado
Grupos:
  - Ingresos actuales (verde)
  - Meta semanal (gris)
  
Eje X: Top 8 estilistas
Eje Y: $ MXN
```

---

## 🎯 Reporte 6: GEOGRAFÍA (Heatmap)

**Objetivo:** Identificar zonas de mayor demanda y cobertura  
**Usuarios:** Owner, Gerente de expansión  
**Frecuencia:** Mensual / Trimestral

### 6.1 Fuentes de Datos

| Entidad | Campo | Descripción |
|---------|-------|-------------|
| `clients` | `address`, `id` | Dirección del cliente |
| `appointments` | `client_id`, `created_at` | Citas por zona |
| `pets` | `name`, `animal_type_id` | Animales por zona |

**Nota:** Requiere geocoding o zona pre-definida en campo `address`

### 6.2 Métricas Principales

#### KPI Card 1: Zonas Cubiertas
```
FÓRMULA:
COUNT(DISTINCT SUBSTRING(clients.address, 1, 15)) -- Primeras palabras (zona aprox)

METADATOS:
- Valor: 12 zonas
- Trending: "↑ 2 zonas nuevas"
```

#### KPI Card 2: Zona de Mayor Demanda
```
FÓRMULA:
MAX por zona de COUNT(appointments.id)

METADATOS:
- Valor: "Centro histórico - 156 citas"
- % del total: "32% de demanda"
```

#### KPI Card 3: Clientes por Zona
```
FÓRMULA:
COUNT(DISTINCT clients.id) GROUP BY zona

METADATOS:
- Valor: 8 clientes/zona promedio
- Info: "Máx: 24 clientes"
```

#### KPI Card 4: Densidad de Citas
```
FÓRMULA:
COUNT(appointments.id) / COUNT(DISTINCT clients.id) BY zona

METADATOS:
- Valor: 2.1 citas/cliente promedio
- Trending: "Lealtad alta"
```

### 6.3 Visualizaciones

#### Mapa Interactivo de Zonas Calientes (Grid)
```
Layout: Grid de 6x6 zonas (configurable por ciudad)
Colores:
  - Rojo intenso: >50 citas (zona muy caliente)
  - Naranja: 20-50 citas (zonas activas)
  - Amarillo: 5-20 citas (zonas emergentes)
  - Gris: 0 citas (cobertura potencial)

DATOS:
[
  { zone: {row: 0, col: 2}, name: "Centro", appointments: 156, clients: 24, color: "red" },
  { zone: {row: 1, col: 3}, name: "Sur", appointments: 98, clients: 18, color: "orange" },
  ...
]
```

#### Tabla: Análisis por Zona
```
Columnas:
| Zona | Clientes | Citas | Ingresos | Citas/Cliente | Distancia Prom |

QUERY APROX:
SELECT 
  SUBSTRING(clients.address, 1, 20) as zone,
  COUNT(DISTINCT clients.id) as client_count,
  COUNT(DISTINCT appointments.id) as appointment_count,
  SUM(service_prices.price) as total_revenue,
  ROUND(COUNT(DISTINCT appointments.id)::NUMERIC / COUNT(DISTINCT clients.id), 2) as appointments_per_client
FROM clients
LEFT JOIN appointments ON appointments.client_id = clients.id
LEFT JOIN appointment_services ON ...
LEFT JOIN service_prices ON ...
WHERE clients.clinic_id = $clinicId
GROUP BY SUBSTRING(clients.address, 1, 20)
ORDER BY appointment_count DESC
LIMIT 20
```

---

## 📊 Reporte 7: RESUMEN EJECUTIVO (Overview)

**Objetivo:** Dashboard consolidado de todos los KPIs principales  
**Usuarios:** Owner, Gerente general  
**Frecuencia:** Diaria

### 7.1 Composición

#### Sección 1: Health Metrics (4 KPI Cards)
```
┌─────────────────────────────────────────┐
│ Ingresos MTD | Citas Confirmadas | Clientes Activos | Ocupación |
│  $XX,XXX     | XX citas         | XXX              | 78%       |
└─────────────────────────────────────────┘
```

**Cards:**
- **Ingresos MTD:** SUM(service_prices.price) del mes
- **Citas Confirmadas:** COUNT(appointments WHERE status='CONFIRMED' THIS WEEK)
- **Clientes Activos:** COUNT(DISTINCT clients WHERE last_appointment >= 90 days)
- **Ocupación de Estilistas:** % de tiempo utilizado

#### Sección 2: Widgets de Tendencias (3 Charts)
```
1. Línea de Ingresos (Últimos 7 días)
2. Distribución de Citas por Estilista (Top 5)
3. Crecimiento de Clientes (Últimos 6 meses)
```

#### Sección 3: Alertas y Acciones
```
⚠️  Tasa de cancelación: 12% (↑ 3% vs mes anterior)
✓  Cliente VIP: Juan García - 12 citas este mes
→  Servicio emergente: "Baño de espuma" - 8 citas nuevas
```

#### Sección 4: Quick Actions
```
[ + Nueva Cita ] [ Agregar Servicio ] [ Ver Reportes Detallados ]
```

---

## 🔧 Especificaciones Técnicas

### Parámetros Configurables por Reporte

| Reporte | Período | Filtros | Exportar |
|---------|---------|---------|----------|
| Ingresos | Hoy / Semana / Mes / Año | Por servicio, estilista, cliente | PDF, Excel |
| Citas | Hoy / Próximos 7 días / Mes | Por estilista, estado, cliente | PDF, iCal |
| Clientes | Activos / Nuevos / Todos | Por plan, inactividad, zona | CSV, Excel |
| Servicios | Activos / Todos | Por tipo, disponibilidad | CSV |
| Performance | Semana / Mes / Año | Por estilista | PDF |
| Geografía | Hoy / Mes / Año | Por zona | PNG (mapa) |
| Resumen | Hoy / Semana / Mes | Todas las opciones | PDF |

### Frecuencia de Actualización
- **KPI Cards:** Cada 30 minutos
- **Gráficos:** Cada 1 hora (cache)
- **Tablas:** En tiempo real (on-demand)
- **Datos históricos:** Actualización nocturna (02:00 AM)

### Permisos de Acceso
```
OWNER → Todos los reportes, todos los datos
STAFF → Solo reportes de Citas y Performance (datos propios)
PLATFORM_ADMIN → Acceso a todos los clientes (datos de todas las clínicas)
```

---

## 📈 Roadmap Futuro (Fase 2)

**No incluido en v1.0 pero planificado:**

1. **Pronósticos (Forecasting)**
   - Predicción de ingresos próximo mes basado en tendencias
   - Estimación de demanda por servicio

2. **Análisis Predictivo**
   - Identificación de clientes en riesgo de churn
   - Segmentación automática de clientes (RFM analysis)

3. **Comparativas vs Competencia**
   - Benchmarks vs promedio del sector
   - Análisis SWOT interactivo

4. **Integraciones Externas**
   - Export automático a Google Analytics
   - Sincronización con herramientas de contabilidad

5. **Reportes Customizables**
   - Drag-and-drop builder de reportes
   - Alertas automáticas por email

6. **Mobile Reports**
   - Versión responsive para móviles
   - Notificaciones push de eventos importantes

---

## ✅ Checklist de Implementación

**Backend (API endpoints necesarios):**
- [ ] GET `/api/reports/revenue` - Métricas y datos de ingresos
- [ ] GET `/api/reports/appointments` - Datos de citas
- [ ] GET `/api/reports/clients` - Datos de clientes
- [ ] GET `/api/reports/services` - Datos de servicios
- [ ] GET `/api/reports/performance` - Datos de estilistas
- [ ] GET `/api/reports/geography` - Datos geográficos
- [ ] GET `/api/reports/overview` - Resumen consolidado
- [ ] POST `/api/reports/export` - Exportar a PDF/Excel

**Frontend (Componentes a actualizar):**
- [ ] RevenueDashboard → Usar datos reales de BD
- [ ] AppointmentsDashboard → Integrar queries reales
- [ ] ClientsDashboard → Datos de clientes activos
- [ ] ServicesDashboard → Matriz de servicios
- [ ] PerformanceDashboard → Scorecard de estilistas
- [ ] GeographyDashboard → Heatmap con datos reales
- [ ] OverviewDashboard → Consolidar todos los KPIs

**Testing:**
- [ ] Validar queries con datos de 1,000+ citas
- [ ] Verificar performance de reportes grandes (timeout <3s)
- [ ] Pruebas de permisos (OWNER vs STAFF)

---

## 📞 Contacto & Feedback

**Documento preparado por:** Business Analyst  
**Fecha:** Marzo 8, 2026  
**Versión:** 1.0  
**Estado:** Listo para arquitecto de software

**Cambios solicitados o feedback:** 
📧 Enviar a arquitecto-software@vibralive.mx
