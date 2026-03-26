# ⚡ QUICK REFERENCE - Timezone Issues Summary

## 🎯 Archivos Por Prioridad

### 🔴 CRÍTICA (Funcionalidad de citas afectada)

| # | Archivo | Líneas | Problema | Solución |
|----|---------|--------|----------|----------|
| 1 | `src/components/appointments/AssignStylistModal.tsx` | 157, 288, 292 | `new Date(appointment.scheduled_at)` sin timezone | Usar `utcToZonedTime(..., clinicTimezone)` |
| 2 | `src/components/appointments/CancelAppointmentModal.tsx` | 44-46 | `new Date()` sin timezone, validación 2h incorrecta | Importar `useClinicTimezone`, usar `utcToZonedTime` |
| 3 | `src/app/(protected)/clinic/grooming/page.tsx` | 52-54, 149, 185, 206, 210, 233, 237, 292-293, 298-300, 388, 395, 399, 408, 412, 529-530, 539-540, 606, 622-623, 648-649, 665-666 | Múltiples `new Date()` sin timezone | Revisar línea por línea cada creación de Date |

### 🟡 ALTA (Gestión de configuraciones)

| # | Archivo | Líneas | Problema | Solución |
|----|---------|--------|----------|----------|
| 4 | `src/components/configurations/StylistAvailabilityTab.tsx` | 796-797, 936 | `new Date().toLocaleDateString()` sin timezone | Reemplazar con `formatInClinicTz()` |
| 5 | `src/components/appointments/UnifiedGroomingModal.tsx` | Múltiples | Algunas fechas tienen timezone, otras no | Revisar consistencia |

### 🟠 MEDIA (Ordenamiento y listados)

| # | Archivo | Líneas | Problema | Solución |
|----|---------|--------|----------|----------|
| 6 | `src/app/(protected)/clinic/services/page.tsx` | 81, 83 | Ordenamiento sin timezone | Convertir ambas fechas a mismo timezone antes de comparar |
| 7 | `src/app/(protected)/clinic/packages/page.tsx` | 80, 82 | Ordenamiento sin timezone | Idem |
| 8 | `src/app/(protected)/clinic/pets/page.tsx` | 178-179, 183-184 | Ordenamiento sin timezone | Idem |
| 9 | `src/app/(protected)/clinic/price-lists/page.tsx` | 87, 89 | Ordenamiento sin timezone | Idem |
| 10 | `src/app/platform/clinics/page.tsx` | 103, 105 | Ordenamiento sin timezone | Idem |

### 🟡 MEDIA (Mostrar fechas)

| # | Archivo | Líneas | Problema | Solución |
|----|---------|--------|----------|----------|
| 11 | `src/components/pricing/PricingBreakdown.tsx` | 141 | `new Date(...).toLocaleString('es-CO')` | Usar `formatInClinicTz(new Date(...), 'U.K.', clinicTimezone)` |
| 12 | `src/components/platform/PetsTable.tsx` | 75-76 | Cálculo de edad con `new Date()` sin timezone | Puede que sea OK si es solo para edad, pero revisar |
| 13 | `src/components/pets/ClientPetBook.tsx` | 91 | `Date.now()` para generar ID | No es crítico, pero inconsistente |
| 14 | `src/components/dashboard/AdminDashboardExample.tsx` | 81, 90, 99, 107, 115 | Ejemplos de datos con `Date.now()` | Es solo un ejemplo, pero debería fijar |
| 15 | `src/components/configurations/EmailConfigTab.tsx` | 326 | `new Date(...).toLocaleString()` | Usar `formatInClinicTz()` |
| 16 | `src/components/AssignOwnerModal.tsx` | 222 | `new Date(...).toLocaleString('es-MX')` | Usar `formatInClinicTz()` |

### 🔴 CRÍTICA (Plataforma)

| # | Archivo | Líneas | Problema | Solución |
|----|---------|--------|----------|----------|
| 17 | `src/app/platform/users/page.tsx` | 251 | `new Date(...).toLocaleDateString('es-MX')` | Usar `formatInClinicTz()` |
| 18 | `src/app/platform/subscriptions/page.tsx` | 412 | `new Date(...).toLocaleDateString('es-MX')` | Usar `formatInClinicTz()` |
| 19 | `src/app/platform/reminders/page.tsx` | 115, 250 | Timestamps y fechas sin timezone | Importar hook y usar `utcToZonedTime` |
| 20 | `src/app/platform/dashboard/page.tsx` | 70 | `new Date().toISOString()` sin timezone | Considerar si es necesario timestamp UTC o clínica |
| 21 | `src/app/platform/audit/page.tsx` | 126, 134, 264 | Fechas de auditoría sin timezone | Usar `formatInClinicTz()` |

---

## 🔧 IMPORTS QUE FALTAN

### Requerido en TODOS los archivos problemáticos:
```tsx
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { utcToZonedTime, formatInTimeZone } from 'date-fns-tz';
import { format } from 'date-fns';
```

---

## 🧪 COMANDOS PARA BUSCAR

### Buscar TODAS las instancias de `new Date(` en componentes/app:
```bash
grep -r "new Date(" src/components src/app --include="*.tsx" --include="*.ts" | grep -v "lib/" | grep -v "api/" | grep -v "hooks/" | wc -l
```

### Buscar archivos SIN `useClinicTimezone`:
```bash
grep -L "useClinicTimezone" src/components/appointments/*.tsx src/components/configurations/*.tsx 2>/dev/null
```

### Buscar `Date.now()` en artifacts problemáticos:
```bash
grep -r "Date\.now()" src/components src/app --include="*.tsx" | grep -v "lib/" | grep -v "api/"
```

---

## 📋 PLAN DE ACCIÓN RECOMENDADO

### Fase 1: Máxima Prioridad (Hoy)
1. ✅ Auditar `grooming/page.tsx` línea por línea
2. ✅ Corregir `AssignStylistModal.tsx`
3. ✅ Corregir `CancelAppointmentModal.tsx`

### Fase 2: Alta Prioridad (Mañana)
4. ✅ Corregir `StylistAvailabilityTab.tsx`
5. ✅ Revisar `UnifiedGroomingModal.tsx` (si no está bien)

### Fase 3: Media Prioridad (Semana)
6. ✅ Arreglar todos los `sort()` que comparan fechas
7. ✅ Reemplazer `.toLocaleDateString()` con `formatInClinicTz()`

### Fase 4: Plataforma (Siguiente sprint)
8. ✅ Revisar y corregir `/app/platform/*`

---

## ✅ VALIDACIÓN POST-FIX

Para cada archivo corregido:

1. Importa `useClinicTimezone`
2. Verifica que `clinicTimezone` esté disponible
3. Reemplaza TODOS los `new Date(utcString)` con `utcToZonedTime(new Date(utcString), clinicTimezone)`
4. Reemplaza TODOS los `new Date()` que se muestren con `utcToZonedTime(new Date(), clinicTimezone)`
5. Para mostrar: usa `format()` o `formatInClinicTz()`
6. Para comparar: asegura que ambas fechas estén en el MISMO timezone
7. Testea en navegador con DevTools haciendo Override de timezone

---

## 🧬 GENERADOR DE FIXES (Por copiar/pegar)

### Para AssignStylistModal.tsx:
```tsx
// AGREGAR IMPORT:
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { utcToZonedTime } from 'date-fns-tz';

// EN COMPONENTE:
const { clinicTimezone } = useClinicTimezone();

// REEMPLAZAR LÍNEA 157:
// const appointmentDate = appointment?.scheduled_at ? new Date(appointment.scheduled_at) : null;
const appointmentDate = appointment?.scheduled_at ? utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone) : null;

// REEMPLAZAR LÍNEA 288:
// appointmentDate={appointment?.scheduled_at ? new Date(appointment.scheduled_at) : undefined}
appointmentDate={appointment?.scheduled_at ? utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone) : undefined}

// REEMPLAZAR LÍNEA 292:
// ? new Date(new Date(appointment.scheduled_at).getTime() + appointment.duration_minutes * 60000).toLocaleTimeString(...)
const appointmentStart = utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone);
const appointmentEnd = new Date(appointmentStart.getTime() + (appointment.duration_minutes || 60) * 60000);
// ? format(appointmentEnd, 'HH:mm', { timeZone: clinicTimezone })
```

### Para CancelAppointmentModal.tsx:
```tsx
// AGREGAR IMPORTS:
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { utcToZonedTime } from 'date-fns-tz';

// EN COMPONENTE:
const { clinicTimezone } = useClinicTimezone();

// REEMPLAZAR LÍNEAS 44-46:
const appointmentDate = utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone);
const now = utcToZonedTime(new Date(), clinicTimezone);
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
```

---

**Última actualización:** 5 de Marzo, 2026  
**Generado por:** Sistema de Auditoría Automática  
**Estado:** 🔴 REQUIERE CORRECCIÓN INMEDIATA
