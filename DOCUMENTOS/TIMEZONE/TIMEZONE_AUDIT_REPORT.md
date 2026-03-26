# 🔴 TIMEZONE AUDIT REPORT - Frontend Date Handling

**Fecha:** 5 de Marzo, 2026  
**Objetivo:** Identificar TODOS los archivos que manejan fechas sin considerar el timezone de la clínica

---

## 📊 RESUMEN EJECUTIVO

Se encontraron **19 archivos problemáticos** que manejan fechas (`Date.now()`, `new Date()`, `scheduled_at`, `appointments`) **SIN importar** `useClinicTimezone` o **SIN convertir a la zona horaria de la clínica**.

| Categoría | Cantidad | Severidad |
|-----------|----------|-----------|
| `/components/appointments` | 2 | 🔴 CRÍTICA |
| `/components/platform & misc` | 4 | 🟡 MEDIA |
| `/components/configurations` | 2 | 🟡 MEDIA |
| `/app/(protected)/clinic/*` | 6 | 🟡 MEDIA |
| `/app/platform/*` | 5 | 🔴 CRÍTICA |

---

## 🔴 CRÍTICA - `/components/appointments` (Funcionalidad de citas)

### 1. [AssignStylistModal.tsx](vibralive-frontend/src/components/appointments/AssignStylistModal.tsx)
**Sin `useClinicTimezone` ✗**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 157 | `new Date(appointment.scheduled_at)` | Convierte UTC a local sin timezone de clínica |
| 288 | `new Date(appointment.scheduled_at)` | Nuevamente sin conversión timezone |
| 292 | `new Date(new Date(appointment.scheduled_at).getTime() + appointment.duration_minutes * 60000)` | Cálculo de hora final sin timezone |

**Impacto:** Las horas mostradas al asignar estilista pueden ser incorrectas si el navegador está en diferente timezone que la clínica.

**Solución necesaria:**
```tsx
// Actual (INCORRECTO):
const appointmentDate = appointment?.scheduled_at ? new Date(appointment.scheduled_at) : null;

// Debería ser (CORRECTO):
const { clinicTimezone } = useClinicTimezone();
const appointmentDate = appointment?.scheduled_at 
  ? utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone) 
  : null;
```

---

### 2. [CancelAppointmentModal.tsx](vibralive-frontend/src/components/appointments/CancelAppointmentModal.tsx)
**Sin `useClinicTimezone` ✗**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 44 | `const appointmentDate = new Date(appointment.scheduled_at)` | Conversión UTC sin timezone |
| 45 | `const now = new Date()` | Hora actual del navegador (puede diferir de clínica) |
| 46 | `const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)` | Cálculo basado en hora local |

**Impacto:** Validación de cancelación usa timezone incorrecto. Una cita que se puede cancelar en timezone clínica podría no poder cancelarse desde otro timezone.

**Solución necesaria:**
```tsx
// Actual (INCORRECTO):
const appointmentDate = new Date(appointment.scheduled_at);
const now = new Date();
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

// Debería ser (CORRECTO):
const { clinicTimezone } = useClinicTimezone();
const appointmentDate = utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone);
const now = utcToZonedTime(new Date(), clinicTimezone);
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
```

---

## 🔴 CRÍTICA - `/app/(protected)/clinic/grooming/page.tsx`

**SIN `useClinicTimezone` ✗ (aunque parece que se importa pero se usa inconsistentemente)**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 52-54 | `useState<Date>(new Date())` | Inicializar estado con hora local sin timezone |
| 149 | `currentDay = new Date(rangeStart)` | Crear Date desde rango sin consideración de timezone |
| 185, 206, 210, 233, 237 | `new Date(currentDay)` | Múltiples creaciones de Date sin timezone |
| 292-293 | `new Date(apt.scheduled_at).getTime() + (apt.duration_minutes \|\| 30) * 60000` | Cálculo de hora final UTC |
| 298-300 | `new Date(apt.scheduled_at)` y `new Date(startUtc.getTime() + ...)` | Conversión UTC sin timezone |
| 388 | `dayDate = new Date(info.date)` | Date desde evento del calendario |
| 395, 399 | `new Date()` | Hora actual del navegador |
| 408, 412 | `new Date(apt.scheduled_at)` | Conversión UTC sin timezone |
| 529-530 | `new Date(info.startStr)` y `new Date(info.endStr)` | Fechas desde evento del calendario |
| 539-540 | `new Date(event.start)` y `new Date(event.end)` | Más fechas sin timezone |
| 606 | `new Date(info.dateStr)` | Date desde click del calendario |
| 622-623 | `new Date(conflictingApt!.scheduled_at)` y cálculo de fin | Conversión UTC sin timezone |
| 648-649 | `new Date(info.startStr)` y cálculo de duración | Nuevas creaciones de Date |
| 665-666 | `new Date(conflictingApt!.scheduled_at)` y cálculo | Más conversiones UTC |

**Impacto:** SEVERO - La página entera de citas de grooming usa fechas incorrectas para:
- Mostrar horarios en el calendario
- Validar conflictos de citas
- Calcular duraciones
- Determinar si una cita está en el pasado

---

## 🟡 MEDIA - `/components` (Otros componentes)

### 3. [PricingBreakdown.tsx](vibralive-frontend/src/components/pricing/PricingBreakdown.tsx)
**Sin `useClinicTimezone` ✗**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 141 | `{new Date(pricing.priceLockAt).toLocaleString('es-CO')}` | Muestra fecha con timezone local, no de clínica |

**Impacto:** En la desglose de precios, la fecha de bloqueo se muestra en timezone del navegador.

---

### 4. [PetsTable.tsx](vibralive-frontend/src/components/platform/PetsTable.tsx)
**Sin `useClinicTimezone` ✗**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 75-76 | `const birthDate = new Date(dateOfBirth); const today = new Date();` | Cálculo de edad sin timezone |

**Impacto:** Si la mascota nace exactamente a las 23:59 UTC, el cálculo de edad podría ser incorrecto si se debe usar el timezone de la clínica.

---

### 5. [ClientPetBook.tsx](vibralive-frontend/src/components/pets/ClientPetBook.tsx)
**Sin `useClinicTimezone` ✗**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 91 | `const generateDraftId = () => \`draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}\`` | Usa timestamp UTC sin considerar zona horaria |

**Impacto:** Los IDs de draft se generan con timestamp UTC, no es crítico pero es inconsistente.

---

### 6. [AdminDashboardExample.tsx](vibralive-frontend/src/components/dashboard/AdminDashboardExample.tsx)
**Sin `useClinicTimezone` ✗**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 81, 90, 99, 107, 115 | `new Date(Date.now() - X * time)`, múltiples instancias | Timestamps relativos al navigator, no a clínica |

**Impacto:** El dashboard de ejemplo muestra eventos con timestamps incorrectos.

---

### 7. [StylistAvailabilityTab.tsx](vibralive-frontend/src/components/configurations/StylistAvailabilityTab.tsx)
**Sin `useClinicTimezone` ✗**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 796-797 | `{new Date(period.start_date).toLocaleDateString('es-MX')} − {new Date(period.end_date).toLocaleDateString('es-MX')}` | Fechas sin timezone de clínica |
| 936 | `{new Date(capacity.date).toLocaleDateString('es-MX')}` | Otra fecha sin timezone |

**Impacto:** Las fechas de disponibilidad del estilista se muestran en timezone local.

---

### 8. [EmailConfigTab.tsx](vibralive-frontend/src/components/configurations/EmailConfigTab.tsx)
**Sin `useClinicTimezone` ✗**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 326 | `Última verificación: {new Date(config.lastVerifiedAt).toLocaleString()}` | Timestamp sin timezone de clínica |

**Impacto:** La verificación de email muestra hora local del navegador.

---

### 9. [AssignOwnerModal.tsx](vibralive-frontend/src/components/AssignOwnerModal.tsx)
**Sin `useClinicTimezone` ✗**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 222 | `new Date(ownerData.invitation_expires_at).toLocaleString('es-MX')` | Expiración de invitación sin timezone |

**Impacto:** La fecha de expiración del token se muestra en timezone incorrecto.

---

## 🟡 MEDIA - `/app/(protected)/clinic/*` (Páginas de administración)

### 10. [services/page.tsx](vibralive-frontend/src/app/(protected)/clinic/services/page.tsx)
**Sin `useClinicTimezone` ✗**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 81, 83 | `new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()` | Ordenamiento por fecha sin timezone |

**Impacto:** Servicios se ordenan por fecha UTC, inconsistente con vista de clínica.

---

### 11. [packages/page.tsx](vibralive-frontend/src/app/(protected)/clinic/packages/page.tsx)
**Sin `useClinicTimezone` ✗**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 80, 82 | `new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()` | Ordenamiento por fecha sin timezone |

**Impacto:** Paquetes se ordenan incorrectamente.

---

### 12. [pets/page.tsx](vibralive-frontend/src/app/(protected)/clinic/pets/page.tsx)
**Sin `useClinicTimezone` ✗**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 178-179, 183-184 | `new Date(b.created_at \|\| 0).getTime() - new Date(a.created_at \|\| 0).getTime()` | Ordenamiento de mascotas por fecha |

**Impacto:** Mascotas no se ordenan correctamente por fecha de creación.

---

### 13. [price-lists/page.tsx](vibralive-frontend/src/app/(protected)/clinic/price-lists/page.tsx)
**Sin `useClinicTimezone` ✗**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 87, 89 | `new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()` | Ordenamiento de listas de precios |

**Impacto:** Las listas de precios no se ordenan correctamente.

---

### 14. [price-lists/[id]/page.tsx](vibralive-frontend/src/app/(protected)/clinic/price-lists/%5Bid%5D/page.tsx)
**Sí tiene timezone ✓ (pero parcialmente)**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 339 | `formatInClinicTz(new Date(sp.updatedAt), 'dd MMM yyyy', clinicTimezone)` | ✓ CORRECTO - Usa formatInClinicTz |
| 424 | `formatInClinicTz(new Date(record.changed_at), 'dd MMM yyyy HH:mm', clinicTimezone)` | ✓ CORRECTO - Usa formatInClinicTz |

**Estado:** BIEN - Este archivo maneja timezone correctamente.

---

## 🔴 CRÍTICA - `/app/platform/*` (Gestión de plataforma)

### 15. [users/page.tsx](vibralive-frontend/src/app/platform/users/page.tsx)
**Sin `useClinicTimezone` ✗**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 251 | `{new Date(user.created_at).toLocaleDateString('es-MX')}` | Fecha creación usuario sin timezone |

**Impacto:** Las fechas de creación de usuarios en plataforma se muestran en timezone local.

---

### 16. [subscriptions/page.tsx](vibralive-frontend/src/app/platform/subscriptions/page.tsx)
**Sin `useClinicTimezone` ✗**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 412 | `{new Date(plan.createdAt).toLocaleDateString('es-MX')}` | Fecha creación plan sin timezone |

**Impacto:** Las fechas de planes de suscripción son incorrectas.

---

### 17. [reminders/page.tsx](vibralive-frontend/src/app/platform/reminders/page.tsx)
**Sin `useClinicTimezone` ✗**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 115 | `{ ...r, status: 'sent', sentAt: new Date().toISOString() }` | Timestamp de envío sin timezone |
| 250 | `{new Date(reminder.dueDate).toLocaleDateString('es-MX')}` | Fecha vencimiento sin timezone |

**Impacto:** Las fechas de recordatorios y sus vencimientos son incorrectas.

---

### 18. [dashboard/page.tsx](vibralive-frontend/src/app/platform/dashboard/page.tsx)
**Sin `useClinicTimezone` ✗**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 70 | `timestamp: new Date().toISOString()` | Timestamp actual sin considerar timezone |

**Impacto:** El dashboard del admin usa timestamp incorrecto.

---

### 19. [clinics/page.tsx](vibralive-frontend/src/app/platform/clinics/page.tsx)
**Sin `useClinicTimezone` ✗**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 103, 105 | `new Date(b.createdAt \|\| 0).getTime() - new Date(a.createdAt \|\| 0).getTime()` | Ordenamiento de clínicas |

**Impacto:** Las clínicas no se ordenan correctamente por fecha.

---

### 20. [audit/page.tsx](vibralive-frontend/src/app/platform/audit/page.tsx)
**Sin `useClinicTimezone` ✗**

| Línea | Problema | Descripción |
|-------|----------|-------------|
| 126 | `new Date(log.createdAt).toLocaleString('es-MX')` | Fecha de auditoría sin timezone |
| 134 | `\`auditoría-${new Date().toISOString().split('T')[0]}.csv\`` | Nombre de archivo con fecha UTC |
| 264 | `{new Date(log.createdAt).toLocaleString('es-MX')}` | Otra fecha sin timezone |

**Impacto:** Los logs de auditoría muestran timestamps incorrectos.

---

## 📋 ARCHIVOS CON TIMEZONE CORRECTO (Referencia positiva)

### ✓ CreateAppointmentModal.tsx
```tsx
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
// Está importado correctamente
```

### ✓ RescheduleAppointmentModal.tsx
```tsx
const { clinicTimezone } = useClinicTimezone();
const currentScheduled = utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone);
// Manejo correcto con timezone
```

### ✓ ViewAppointmentDetailsModal.tsx
```tsx
const scheduledAt = utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone);
// Conversión correcta
```

### ✓ UnifiedGroomingModal.tsx
```tsx
const { clinicTimezone } = useClinicTimezone();
// Uso correcto de timezone en múltiples lugares
```

---

## 🔧 ESTRATEGIA DE CORRECCIÓN

### Paso 1: Componentes de Citas (CRÍTICOS)
1. [AssignStylistModal.tsx](#2-assignstylistmodaltsx)
2. [CancelAppointmentModal.tsx](#2-cancelappointmentmodaltsx)
3. [grooming/page.tsx](#-crítica---appprotectedclinicgroomingpagetsx)

### Paso 2: Configuraciones de Estilistas
3. [StylistAvailabilityTab.tsx](#7-stylistavailabilitytabtsx)

### Paso 3: Administrativo Clínica
4. [services/page.tsx](#10-servicespagetsx)
5. [packages/page.tsx](#11-packagespagetsx)
6. [pets/page.tsx](#12-petspagetsx)
7. [price-lists/page.tsx](#13-price-listspagetsx)

### Paso 4: Plataforma
5. [users/page.tsx](#15-userspagetsx)
6. [subscriptions/page.tsx](#16-subscriptionspagetsx)
7. [reminders/page.tsx](#17-reminderspagetsx)
8. [dashboard/page.tsx](#18-dashboardpagetsx)
9. [clinics/page.tsx](#19-clinicspagetsx)
10. [audit/page.tsx](#20-auditpagetsx)

### Paso 5: Otros Componentes
6. [PricingBreakdown.tsx](#3-pricingbreakdowntsx)
7. [PetsTable.tsx](#4-petstabletsx)
8. [ClientPetBook.tsx](#5-clientpetbooktsx)
9. [AdminDashboardExample.tsx](#6-admindashboardexampletsx)
10. [AssignOwnerModal.tsx](#9-assignownertodaltsx)

---

## 💡 PATRONES DE FIX COMUNES

### Patrón 1: Conversión de UTC a Timezone de Clínica
```tsx
// ❌ INCORRECTO
const date = new Date(utcString);
console.log(date.toLocaleString());

// ✅ CORRECTO
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { utcToZonedTime } from 'date-fns-tz';

const { clinicTimezone } = useClinicTimezone();
const date = utcToZonedTime(new Date(utcString), clinicTimezone);
console.log(format(date, 'yyyy-MM-dd HH:mm:ss'));
```

### Patrón 2: Hora Actual en Timezone de Clínica
```tsx
// ❌ INCORRECTO
const now = new Date();

// ✅ CORRECTO
const now = utcToZonedTime(new Date(), clinicTimezone);
```

### Patrón 3: Ordenamiento por Fecha
```tsx
// ❌ INCORRECTO
items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

// ✅ CORRECTO (ambos se convierten al mismo timezone)
items.sort((a, b) => {
  const dateA = utcToZonedTime(new Date(a.createdAt), clinicTimezone);
  const dateB = utcToZonedTime(new Date(b.createdAt), clinicTimezone);
  return dateB.getTime() - dateA.getTime();
});
```

---

## 📊 ESTADÍSTICAS

- **Total de archivos problemáticos:** 20
- **Líneas de código a revisar:** ~150+
- **Tiempo estimado de corrección:** 2-3 horas
- **Prioridad:** 🔴 CRÍTICA (afecta funcionalidad principal)

---

## ✅ CHECKLIST DE VALIDACIÓN

- [ ] Importar `useClinicTimezone` en todos los componentes
- [ ] Reemplazar `new Date(string)` con `utcToZonedTime(new Date(string), clinicTimezone)`
- [ ] Reemplazar `new Date()` con `utcToZonedTime(new Date(), clinicTimezone)` cuando se necesite timezone
- [ ] Verificar que los formatos de fecha usen `format()` de date-fns
- [ ] Testear con clínicas en diferentes timezones
- [ ] Verificar que el OrderBy de listas respete timezone
- [ ] Revisar validaciones de fechas (future, past, etc.)

---

**Preparado por:** Auditoría Automática de Timezone  
**Estado:** 🔴 REQUIERE ACCIÓN INMEDIATA  
**Contacto:** Sistema de Garantía de Calidad
