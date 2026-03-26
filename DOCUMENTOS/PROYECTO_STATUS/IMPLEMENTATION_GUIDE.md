# 🛠️ IMPLEMENTATION GUIDE - Paso a Paso

## 📋 TABLA DE CONTENIDOS

1. [Antes de empezar](#antes-de-empezar)
2. [Archivos en orden de corrección](#orden-recomendado)
3. [Guía detallada por archivo](#guías-por-archivo)
4. [Testing checklist](#testing-checklist)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 ANTES DE EMPEZAR

### Requisitos previos:
- ✅ Archivo `GROOMING_PAGE_CRITICAL_ANALYSIS.md` revisado
- ✅ Archivo `TIMEZONE_QUICK_FIX.md` a mano
- ✅ Terminal abierta en raíz del proyecto
- ✅ VS Code con la carpeta abierta

### Herramientas necesarias:
```bash
# Instalar si falta:
npm install date-fns date-fns-tz

# Verificar que están en package.json:
grep '"date-fns' package.json
```

### Crear rama para cambios:
```bash
git checkout -b fix/timezone-issues
```

---

## 📊 ORDEN RECOMENDADO

### Fase 1: CRÍTICA (Hoy - 2 horas)
1. ⏱️ `CancelAppointmentModal.tsx` (30 min - simple)
2. ⏱️ `AssignStylistModal.tsx` (30 min - simple)
3. ⏱️ Verificar imports en `CreateAppointmentModal.tsx` (15 min)

### Fase 2: CRÍTICA COMPLEJA (Mañana - 2 horas)
4. ⏱️ `grooming/page.tsx` (90 min - complejo, requiere testing)

### Fase 3: MEDIA (Semana 1 - 1.5 horas)
5. ⏱️ Todos los `*.tsx` con filtros/ordenamiento por fecha (45 min)
6. ⏱️ Componentes con `.toLocaleString()` (30 min)

### Fase 4: PLATAFORMA (Semana 2)
7. ⏱️ Todos los recursos `/app/platform/*`

---

## 🎯 GUÍAS POR ARCHIVO

### 🔴 CRÍTICA #1: CancelAppointmentModal.tsx

**Tiempo:** ~30 minutos  
**Complejidad:** 🟢 Baja

#### Paso 1: Agregar imports (Línea 1-10)
```tsx
'use client';

import { useState } from 'react';
import { MdClose, MdWarning } from 'react-icons/md';
import { Appointment } from '@/types';
import { appointmentsApi } from '@/lib/appointments-api';
import { AppointmentInfoSection } from './AppointmentInfoSection';
// 👇 AGREGAR ESTOS IMPORTS:
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { utcToZonedTime } from 'date-fns-tz';
import { startOfToday, isBefore } from 'date-fns';
import toast from 'react-hot-toast';
```

#### Paso 2: Obtener timezone (Dentro del componente)
Buscar donde está la función `CancelAppointmentModal` y agregar:
```tsx
export function CancelAppointmentModal({
  isOpen,
  appointment,
  onClose,
  onSuccess,
}: CancelAppointmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // 👇 AGREGAR ESTA LÍNEA:
  const { clinicTimezone } = useClinicTimezone();
  
  // ... resto del código
```

#### Paso 3: Reemplazar la lógica de validación
Buscar líneas 44-46:
```tsx
// ❌ ANTES:
const appointmentDate = new Date(appointment.scheduled_at);
const now = new Date();
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

// ✅ DESPUÉS:
const appointmentDate = utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone);
const now = utcToZonedTime(new Date(), clinicTimezone);
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
```

#### Paso 4: Validar (Buscar cerca de línea 60+)
Reemplazar validación:
```tsx
// ❌ ANTES:
if (appointmentDate.getTime() < now.getTime()) {
  setError('No se puede cancelar una cita pasada');
  return;
}

// ✅ DESPUÉS:
if (isBefore(appointmentDate, now)) {
  setError('No se puede cancelar una cita pasada');
  return;
}
```

#### Verificación Post-Cambio:
```bash
# Buscar que no queden new Date() sueltos
grep -n "new Date()" src/components/appointments/CancelAppointmentModal.tsx

# Debería devolver 0 resultados
```

---

### 🔴 CRÍTICA #2: AssignStylistModal.tsx

**Tiempo:** ~30 minutos  
**Complejidad:** 🟢 Baja

#### Paso 1: Agregar imports
```tsx
'use client';

import { useState, useEffect } from 'react';
import { MdClose, MdPerson } from 'react-icons/md';
import { Appointment } from '@/types';
import { appointmentsApi } from '@/lib/appointments-api';
import { stylistsApi } from '@/api/stylists-api';
import { useAuth } from '@/hooks/useAuth';
// 👇 AGREGAR:
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { utcToZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import { StylistDetailCard } from './StylistDetailCard';
import toast from 'react-hot-toast';
```

#### Paso 2: Obtener timezone
```tsx
export function AssignStylistModal({
  isOpen,
  appointment,
  onClose,
  onSuccess,
}: AssignStylistModalProps) {
  const { user } = useAuth();
  const clinicId = user?.clinic_id || '';
  // 👇 AGREGAR:
  const { clinicTimezone } = useClinicTimezone();
  
  // ... resto
```

#### Paso 3: Corregir línea 157
```tsx
// ❌ ANTES:
const appointmentDate = appointment?.scheduled_at ? new Date(appointment.scheduled_at) : null;

// ✅ DESPUÉS:
const appointmentDate = appointment?.scheduled_at ? utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone) : null;
```

#### Paso 4: Corregir línea 288
Buscar en JSX:
```tsx
// ❌ ANTES:
appointmentDate={appointment?.scheduled_at ? new Date(appointment.scheduled_at) : undefined}

// ✅ DESPUÉS:
appointmentDate={appointment?.scheduled_at ? utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone) : undefined}
```

#### Paso 5: Corregir línea 292 (la más compleja)
Buscar el bloque que muestra hora de fin:
```tsx
// ❌ ANTES:
? new Date(new Date(appointment.scheduled_at).getTime() + appointment.duration_minutes * 60000)
  .toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

// ✅ DESPUÉS:
? (() => {
    const appointmentStart = utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone);
    const appointmentEnd = new Date(appointmentStart.getTime() + (appointment.duration_minutes || 60) * 60000);
    return format(appointmentEnd, 'HH:mm');
  })()
```

---

### 🔴 CRÍTICA #3: grooming/page.tsx

**Tiempo:** ~90 minutos  
**Complejidad:** 🔴 ALTA  
**Documentación:** Ver [GROOMING_PAGE_CRITICAL_ANALYSIS.md](GROOMING_PAGE_CRITICAL_ANALYSIS.md)

#### Paso 1: Agregar imports (Línea ~30)
El archivo ya tiene algunos imports date-fns. Verificar que tenga:
```tsx
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { 
  utcToZonedTime, 
  zonedTimeToUtc 
} from 'date-fns-tz';
import { 
  format,
  startOfDay,
  endOfDay,
  addDays,
  isSameDay,
  areIntervalsOverlapping,
  startOfMinute,
  isWithinInterval,
  isAfter,
  isBefore,
  differenceInMinutes
} from 'date-fns';
```

#### Paso 2: Usar timezone en código
```tsx
export default function GroomingPage() {
  const { clinicTimezone } = useClinicTimezone();  // 👈 AGREGAR
  // ... resto
```

#### Paso 3: FIX del setState (Línea 52-54)
```tsx
// ❌ ANTES:
const [currentDateAll, setCurrentDateAll] = useState<Date>(new Date());
const [currentDateClinic, setCurrentDateClinic] = useState<Date>(new Date());
const [currentDateHome, setCurrentDateHome] = useState<Date>(new Date());

// ✅ DESPUÉS:
const [currentDateAll, setCurrentDateAll] = useState<Date | null>(null);
const [currentDateClinic, setCurrentDateClinic] = useState<Date | null>(null);
const [currentDateHome, setCurrentDateHome] = useState<Date | null>(null);

// AGREGAR useEffect después del useState:
useEffect(() => {
  const clinicNow = utcToZonedTime(new Date(), clinicTimezone);
  setCurrentDateAll(clinicNow);
  setCurrentDateClinic(clinicNow);
  setCurrentDateHome(clinicNow);
}, [clinicTimezone]);
```

#### Paso 4: FIX del loop de bloques (Línea ~140-250)

Este es el cambio más grande. Buscar:
```tsx
const [unavailableSlotEvents, setUnavailableSlotEvents] = useState<any[]>([]);

useEffect(() => {
  // ... código existente ...
  let currentDay = new Date(rangeStart);
```

Reemplazar por:
```tsx
useEffect(() => {
  if (!config || !exceptions) return;

  const startInClinic = utcToZonedTime(new Date(rangeStart), clinicTimezone);
  const endInClinic = utcToZonedTime(new Date(rangeEnd), clinicTimezone);
  
  let currentDay = startOfDay(startInClinic);
  const unavailableEvents = [];

  while (isBefore(currentDay, endInClinic) || isSameDay(currentDay, endInClinic)) {
    // Convertir a date key (YYYY-MM-DD formato clínica)
    const dateStr = format(currentDay, 'yyyy-MM-dd');
    
    // Buscar excepciones de configuración
    const dayConfig = config?.exceptions?.find((exc) => exc.date === dateStr);
    
    if (dayConfig?.is_unavailable) {
      // Marcar todo el día como no disponible
      const dayStart = startOfDay(currentDay);
      const dayEnd = endOfDay(currentDay);
      
      unavailableEvents.push({
        id: `unavailable_${dateStr}`,
        title: 'No Disponible',
        start: dayStart.toISOString(),
        end: dayEnd.toISOString(),
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
      });
    } else if (dayConfig?.blocks?.length > 0) {
      // Bloques horarios específicos
      dayConfig.blocks.forEach((block) => {
        const blockStart = new Date(currentDay);
        const [startHour, startMin] = block.start_time.split(':').map(Number);
        blockStart.setHours(startHour, startMin, 0, 0);
        
        const blockEnd = new Date(blockStart);
        const [endHour, endMin] = block.end_time.split(':').map(Number);
        blockEnd.setHours(endHour, endMin, 0, 0);
        
        unavailableEvents.push({
          id: `block_${dateStr}_${block.start_time}`,
          title: 'Bloque No Disponible',
          start: blockStart.toISOString(),
          end: blockEnd.toISOString(),
          backgroundColor: '#fbbf24',
          borderColor: '#f59e0b',
        });
      });
    }
    
    currentDay = addDays(currentDay, 1);
  }

  setUnavailableSlotEvents(unavailableEvents);
}, [config, exceptions, rangeStart, rangeEnd, clinicTimezone]);
```

#### Paso 5: FIX de transformación a FullCalendar (Línea ~261-325)

Este cambio es importante para mostrar horas correctas:
```tsx
// Usar useMemo para transformar citas:
const allEvents = useMemo(() => {
  if (!filteredAppointments) return [];
  
  return filteredAppointments.map((apt) => {
    // Convertir scheduled_at UTC a clinic timezone
    const startInClinic = utcToZonedTime(new Date(apt.scheduled_at), clinicTimezone);
    const endInClinic = new Date(startInClinic.getTime() + (apt.duration_minutes || 30) * 60000);
    
    return {
      id: apt.id,
      title: apt.pet_name,
      start: startInClinic.toISOString(),
      end: endInClinic.toISOString(),
      backgroundColor: getEventColor(apt),
      borderColor: getEventBorderColor(apt),
      extendedProps: {
        appointmentId: apt.id,
        status: apt.status,
        locationType: apt.location_type || 'CLINIC',
      },
    };
  });
}, [filteredAppointments, clinicTimezone]);

const events = [...allEvents, ...unavailableSlotEvents];
```

#### Paso 6: FIX de handlers (Línea ~605-620)

```tsx
const handleDateClick = useCallback((info: DateSelectArg) => {
  // Convertir correctamente la fecha seleccionada
  const selectedDate = utcToZonedTime(new Date(info.startStr), clinicTimezone);
  
  // Resto del código que implementa la lógica...
  const now = utcToZonedTime(new Date(), clinicTimezone);
  
  if (isBefore(selectedDate, startOfDay(now))) {
    showInvalidDateModal('No se pueden crear citas en el pasado');
    return;
  }
  
  // ... resto del handler
}, [clinicTimezone, /* ... other deps */]);
```

---

### 🟡 MEDIA: Archivos con filtros/sort

**Tiempo:** ~15 minutos cada uno

**Arquivos afectados:**
- `src/app/(protected)/clinic/services/page.tsx` (Línea 81, 83)
- `src/app/(protected)/clinic/packages/page.tsx` (Línea 80, 82)
- `src/app/(protected)/clinic/pets/page.tsx` (Línea 178-184)
- `src/app/(protected)/clinic/price-lists/page.tsx` (Línea 87, 89)
- `src/app/platform/clinics/page.tsx` (Línea 103, 105)

**Patrón de corrección (igual para todos):**

```tsx
// ❌ ANTES:
const sorted = items.sort((a, b) => {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
});

// ✅ DESPUÉS:
// Opción 1: Si NO necesita exactitud de timezone (createdAt es solo metadata):
const sorted = items.sort((a, b) => {
  // La diferencia es cero si ambas se convierten al mismo timezone
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
});

// Opción 2: Si necesita exactitud (recomendado):
import { compareAsc, compareDesc } from 'date-fns';
const sorted = items.sort((a, b) => {
  return compareDesc(new Date(a.createdAt), new Date(b.createdAt));
});
```

---

### 🟡 MEDIA: Componentes con .toLocaleString()

**Tiempo:** ~10 minutos cada uno

**Archivos afectados:**
- `src/components/pricing/PricingBreakdown.tsx` (Línea 141)
- `src/app/platform/users/page.tsx` (Línea 251)
- `src/app/platform/subscriptions/page.tsx` (Línea 412) 
- `src/app/platform/audit/page.tsx` (Línea 126, 264)
- `src/components/configurations/EmailConfigTab.tsx` (Línea 326)

**Patrón de corrección:**

```tsx
// Primero: Importar (en la parte superior del archivo)
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { formatInClinicTz } from '@/lib/datetime-tz';

// En el componente:
const { clinicTimezone } = useClinicTimezone();

// ❌ ANTES:
{new Date(createdAt).toLocaleString('es-MX')}

// ✅ DESPUÉS:
{formatInClinicTz(new Date(createdAt), 'dd MMM yyyy, HH:mm', clinicTimezone)}
```

---

## ✅ TESTING CHECKLIST

### Test Local
- [ ] Cambiar timezone del navegador DevTools
- [ ] Crear una cita a las 09:00 AM clínica
- [ ] Verificar que aparezca a las 09:00 AM en el calendario
- [ ] Cambiar timezone del navegador a UTC
- [ ] Verify cita sigue mostrando 09:00 AM clínica (NO hora UTC)
- [ ] Cambiar a Asia/Tokyo
- [ ] Verify nuevamente

### Test de Conflictos
- [ ] Crear cita 09:00-10:00 clínica
- [ ] Intentar crear cita 09:30-10:30 en mismo lugar
- [ ] Verify que detecte conflicto correctamente
- [ ] Cambiar timezone navegador
- [ ] Repeat - debería seguir detectando conflicto

### Test de Filtros
- [ ] Crear 3 citas en diferentes días
- [ ] Ver lista ordenada por fecha
- [ ] Verify orden es correcto
- [ ] Cambiar timezone navegador
- [ ] Verify orden sigue siendo correcto

---

## 🐛 TROUBLESHOOTING

### Error: "useClinicTimezone is not a hook"
```
Solución: Verificar que importe correctamente:
✓ import { useClinicTimezone } from '@/hooks/useClinicTimezone';
✗ import useClinicTimezone from '@/hooks/useClinicTimezone';
```

### Error: "clinicTimezone is undefined"
```
Solución: El hook debe estar adentro de un componente React:
✓ export function MyComponent() {
    const { clinicTimezone } = useClinicTimezone();  // OK
  }
  
✗ const { clinicTimezone } = useClinicTimezone();  // ERROR - fuera de componente
  export function MyComponent() { ... }
```

### Las fechas siguen mostrando mal
```
Verificar:
1. ✓ useClinicTimezone está importado
2. ✓ clinicTimezone está obtenido en el componente 
3. ✓ Se usa utcToZonedTime() para TODAS las fechas de appointmente
4. ✓ NO hay new Date(utcString) sin convertir
5. ✓ Se usa format() para mostrar, no toLocaleString()
```

### FullCalendar muestra horarios incorrectos
```
Verificar:
1. ✓ Las fechas están siendo convertidas a clinic timezone
2. ✓ FullCalendar está configurado con timezone correcto:
   <FullCalendar
     timeZone={clinicTimezone}  // 👈 Importante
     events={events}
     ...
   />
3. ✓ Los events.start/end son ISO strings en clinic timezone
```

---

## 📊 CÓDIGO DE PROGRESO

Después de completar cada archivo, hacer:

```bash
# 1. Verificar que compila:
npm run build --filter=vibralive-frontend

# 2. Verificar sintaxis:
npx eslint src/path/to/file.tsx --fix

# 3. Ejecutar script verificador:
node verify-timezone-fixes.js

# 4. Commit:
git add src/path/to/file.tsx
git commit -m "fix(timezone): [archivo] - Corrección de manejo de timezones"
```

---

## 🎯 ESTIMACIÓN FINAL

| Tarea | Tiempo | Status |
|-------|--------|--------|
| CancelAppointmentModal.tsx | 30 min | ⬜ |
| AssignStylistModal.tsx | 30 min | ⬜ |
| grooming/page.tsx | 90 min | ⬜ |
| Media (5 archivos sort) | 75 min | ⬜ |
| Media (5 archivos format) | 50 min | ⬜ |
| Testing completo | 60 min | ⬜ |
| **TOTAL** | **335 min** | **≈ 5.5 horas** |

---

**Preparado por:** Auditoría de Timezone  
**Última actualización:** 5 de Marzo, 2026  
**Estado:** ⏰ Listo para implementación
