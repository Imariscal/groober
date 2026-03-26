# 📊 ANÁLISIS DE FILTROS POR REPORTE - VIBRALIVE

## 🎯 ANÁLISIS DE NECESIDADES

### Por Métrica de Filtrado

#### 1. **Status Filter** (Filtro de Estado de Cita)
| Reporte | Necesario | Razón |
|---------|-----------|--------|
| **Appointments** | ✅ **SÍ** | Muestra citas en diferentes estados (SCHEDULED, CONFIRMED, CANCELLED, IN_PROGRESS, COMPLETED) |
| **Clients** | ✅ **SÍ** | Analiza clientes que han tenido citas en ciertos estados |
| **Services** | ✅ **SÍ** | Mide servicios usados en citas de ciertos estados |
| **Performance** | ✅ **SÍ** | Calcula performance de estilistas solo en citas de ciertos estados |
| **Revenue** | ❌ **NO** | Ya hardcoded: SOLO CONFIRMED + COMPLETED (ver `getTotalRevenueInPeriod()`) |
| **Overview/Dashboard** | ❌ **NO** | Es un resumen agregado con ingresos ya filtrados |
| **Geography** | ✅ **SÍ** | Mapa de demanda - varía por estado de cita |

#### 2. **Location Type Filter** (Clínica vs Domicilio)
| Reporte | Necesario | Razón |
|---------|-----------|--------|
| **Appointments** | ✅ **SÍ** | Filtra por tipo de ubicación |
| **Clients** | ✅ **SÍ** | Clientes pueden tener citas en clínica o domicilio |
| **Services** | ✅ **SÍ** | Servicios se realizan en diferentes ubicaciones |
| **Performance** | ✅ **SÍ** | Performance puede variar por tipo de ubicación |
| **Revenue** | ✅ **SÍ** | Precios/ingresos pueden diferir por ubicación |
| **Overview/Dashboard** | ✅ **SÍ** | Es un resumen que debe considerear ubicación |
| **Geography** | ✅ **SÍ** | Base fundamental del reporte geográfico |

---

## 🔨 CAMBIOS REALIZADOS

### Frontend - COMPLETADO ✅

#### 1. Revenue Report
- ❌ Removido: `StatusFilter`
- ✅ Mantenido: `LocationTypeFilter`
- ✅ Removido: import de `StatusFilter` y `AppointmentStatus`
- ✅ Removido: estado `selectedStatuses`
- ✅ Actualizado: hook call sin `statuses`

#### 2. LocationTypeFilter Component
- ✅ Verificado: No tiene loading innecesario
- ✅ Layout: Botones simples y claros

---

## 📋 CAMBIOS PENDIENTES

### Backend - Revenue Report

El controller ya pasa `statuses` pero **Revenue NO lo usa** (hardcoded a CONFIRMED+COMPLETED).

**Opciones:**
1. **Opción A (Recomendada)**: Revenue ignora parámetro `statuses` (como está ahora)
2. **Opción B**: Remover `statuses` del query del endpoint /reports/revenue
3. **Opción C**: Permitir pero avisar que siempre filtra por CONFIRMED+COMPLETED

**Decisión**: Opción A - dejar como está (simpler, revenue siempre es de citas completadas)

---

## 🔄 RESUMEN DE ESTADO POR REPORTE

### Frontend Filters
- ✅ Appointments: Period + Location + Status
- ✅ Clients: Period + Location + Status
- ✅ Services: Period + Location + Status
- ✅ Performance: Period + Location + Status
- ✅ Revenue: Period + Location (sin Status)
- ✅ Overview/Dashboard: Existe pero sin filtros de usuario
- ⏳ Geography: Pendiente implementación completa

### Backend Query Params
- ✅ Appointments: locationType, statuses
- ✅ Clients: locationType, statuses
- ✅ Services: locationType, statuses
- ✅ Performance: locationType, statuses
- ✅ Revenue: locationType, statuses (ignorado internamente)
- ✅ Overview: locationType, statuses (parcial)
- ⏳ Geography: locationType, statuses

### Backend Filtering Implementation
- ✅ Appointments Service: COMPLETO (filtra por location + status)
- ⏳ Revenue Service: PARCIAL (solo location, status ignorado)
- ⏳ Clients Service: PENDIENTE
- ⏳ Services Service: PENDIENTE
- ⏳ Performance Service: PENDIENTE
- ⏳ Geography Service: PENDIENTE
- ⏳ Overview Service: PENDIENTE

---

## 🚀 PRÓXIMAS PRIORIDADES

1. **Alta**: Completar implementación de filtros en Clients, Services, Performance
2. **Media**: Actualizar Geography y Overview services
3. **Baja**: Documentación y cleanup

---

## 📝 NOTAS TÉCNICAS

### Revenue Report - Por qué no filtra por Status

En `revenue-report.service.ts`:
```typescript
// Así lo hace - SIEMPRE filtra por CONFIRMED + COMPLETED
private async getTotalRevenueInPeriod(clinicId: string, startDate: Date, endDate: Date): Promise<number> {
  const result = await this.appointmentRepository
    .createQueryBuilder('appointment')
    .select('COALESCE(SUM(appointment.totalAmount), 0)', 'totalRevenue')
    .where('appointment.clinicId = :clinicId', { clinicId })
    .andWhere('appointment.status IN (:...statuses)', { statuses: ['CONFIRMED', 'COMPLETED'] })
    .andWhere('appointment.scheduledAt BETWEEN :startDate AND :endDate', { startDate, endDate })
    .getRawOne();
}
```

Esto es por diseño: Los ingresos SOLO cuentan de citas que se completaron o confirmaron (pagadas). Las citas canceladas o sin confirmar no generan ingresos.

### Location Type en Revenue

Location TYPE SÍ afecta revenue porque:
- Servicios en clínica tienen precio X
- Servicios a domicilio pueden tener precio Y (con cargo adicional)
- El análisis de ingresos por ubicación es valioso para la clínica
