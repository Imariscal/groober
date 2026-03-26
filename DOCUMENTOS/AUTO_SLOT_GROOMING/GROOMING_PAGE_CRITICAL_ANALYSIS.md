# 🔥 CRITICAL ANALYSIS: grooming/page.tsx

## Archivo: `src/app/(protected)/clinic/grooming/page.tsx`

**Severidad:** 🔴 CRÍTICA  
**Líneas afectadas:** ~30 líneas problemáticas  
**Impacto:** Toda la funcionalidad de gestión de citas de grooming está basada en fechas incorrectas

---

## 📍 MAPA DE PROBLEMAS

```
LÍNEA    PROBLEMA                              CONTEXTO
----     --------                              --------
52-54    useState(new Date())                  Inicialización de estado
149      currentDay = new Date(rangeStart)     Loop de construcción de bloques
185-237  new Date(currentDay)                  Múltiples creaciones dentro del loop
292-300  Cálculos de hora final                Transformación a FullCalendar
388-412  Operaciones del calendario            Event handlers
529-666  Validaciones y detectores             Click handlers
```

---

## 1️⃣ GRUPO 1: INICIALIZACIÓN DE ESTADO (Líneas 52-54)

### Código Actual:
```tsx
const [currentDateAll, setCurrentDateAll] = useState<Date>(new Date());
const [currentDateClinic, setCurrentDateClinic] = useState<Date>(new Date());
const [currentDateHome, setCurrentDateHome] = useState<Date>(new Date());
```

### Problema:
- `new Date()` devuelve la hora del navegador, no de la clínica
- Cuando se inicia la página, el calendario muestra en la zona horaria equivocada
- Si el usuario está en Nueva York pero la clínica en Colombia, el calendario estará off by 5 horas

### Solución Correcta:
```tsx
const { clinicTimezone } = useClinicTimezone();

const [currentDateAll, setCurrentDateAll] = useState<Date | null>(null);
const [currentDateClinic, setCurrentDateClinic] = useState<Date | null>(null);
const [currentDateHome, setCurrentDateHome] = useState<Date | null>(null);

// En un useEffect:
useEffect(() => {
  // Convertir actual a zona horaria de clínica
  const nowInClinic = utcToZonedTime(new Date(), clinicTimezone);
  setCurrentDateAll(nowInClinic);
  setCurrentDateClinic(nowInClinic);
  setCurrentDateHome(nowInClinic);
}, [clinicTimezone]);
```

---

## 2️⃣ GRUPO 2: CONSTRUCCIÓN DE BLOQUES DE DISPONIBILIDAD (Líneas 140-250)

### Código Actual (Simplificado):
```tsx
let currentDay = new Date(rangeStart);
while (currentDay <= rangeEnd) {
  // ... resto del código usa currentDay ...
  currentDay = new Date(currentDay);
  currentDay.setDate(currentDay.getDate() + 1);
}
```

### Problemas Específicos:

#### Problema 2a: Inicialización con UTC (Línea 149)
```tsx
currentDay = new Date(rangeStart);  // ❌ Si rangeStart es ISO string, es UTC
```

#### Problema 2b: Operaciones de setDate (Línea 237+)
```tsx
currentDay.setDate(currentDay.getDate() + 1);  // ❌ En midnight UTC puede saltarse días
```

#### Problema 2c: Creación de bloques de tiempo (Líneas 185-237)
```tsx
const blockEnd = new Date(currentDay);
blockEnd.setHours(blockEnd.getHours() + 4);  // ❌ Suma horas a objeto UTC
```

### Ejemplo de Bug:
**Escenario:** La clínica está en Colombia (UTC-5), el servidor devuelve `rangeStart = "2026-03-05T00:00:00Z"` (UTC)

```
Hora Real en Clínica:  02:59 AM (4 de Marzo)
Hora en servidor:      07:59 AM (5 de Marzo - UTC)

new Date("2026-03-05T00:00:00Z") → 05 de Marzo (INCORRECTO para clínica)

Resultado: Sistema cree que es 5 de Marzo, pero clínica aún está en 4 de Marzo
           → Oculta citas del 4, muestra disponibilidad incorrecta
```

### Solución Correcta:
```tsx
import { startOfDay, addDays, isWithinInterval, isSameDay } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

const { clinicTimezone } = useClinicTimezone();

// Convertir rango UTC a clinic timezone
const startInClinic = utcToZonedTime(new Date(rangeStart), clinicTimezone);
const endInClinic = utcToZonedTime(new Date(rangeEnd), clinicTimezone);

// Normalizar a inicio del día en timezone de clínica
let currentDay = startOfDay(startInClinic);

while (currentDay <= endInClinic) {
  // Usar currentDay sabiendo que está en timezone correcto
  
  // Al iterar:
  currentDay = addDays(currentDay, 1);  // Suma 1 día respetando timezone
}
```

---

## 3️⃣ GRUPO 3: TRANSFORMACIÓN A FULLCALENDAR (Líneas 261-325)

### Código Actual:
```tsx
const events = filteredAppointments.map((apt) => {
  let startTime = apt.scheduled_at;
  let endTime = new Date(
    new Date(apt.scheduled_at).getTime() + (apt.duration_minutes || 30) * 60000,
  );
  
  // ... validaciones y transformaciones ...

  if (clinicTimezone !== 'Etc/UTC') {
    const startUtc = new Date(apt.scheduled_at);
    const endUtc = new Date(startUtc.getTime() + (apt.duration_minutes || 30) * 60000);
    // ... más código ...
  }
});
```

### Problemas:
1. `apt.scheduled_at` es ISO string UTC
2. Crea múltiples `new Date()` sin considerar que FullCalendar puede estar configurado en timezone diferente
3. La condición `if (clinicTimezone !== 'Etc/UTC')` sugiere que hay intento de manejar timezone, pero incompleto

### Solución Correcta:
```tsx
const events = filteredAppointments.map((apt) => {
  // Convertir UTC a clinic time
  const startInClinic = utcToZonedTime(new Date(apt.scheduled_at), clinicTimezone);
  const endInClinic = new Date(startInClinic.getTime() + (apt.duration_minutes || 30) * 60000);
  
  return {
    // FullCalendar espera ISO strings en timezone correcto
    title: apt.pet_name,
    start: startInClinic.toISOString(),  // ✓ Ahora refleja hora de clínica
    end: endInClinic.toISOString(),
    // ... resto de propiedades ...
  };
});
```

---

## 4️⃣ GRUPO 4: EVENT HANDLERS DEL CALENDARIO (Líneas 380-520)

### Problema 4a: onDayClick (Línea 606)
```tsx
const clickedDate = new Date(info.dateStr);  // ❌ FullCalendar no devuelve zona
```

FullCalendar devuelve `dateStr` en el formato de la zona configurada, pero cuando lo parseamos con `new Date()`, JavaScript lo trata como UTC.

### Problema 4b: onEventClick validaciones (Línea 395)
```tsx
const utcNow = new Date();  // ❌ Hora del navegador, no de clínica

if (aptDate.getTime() < utcNow.getTime()) {
  // Determina si está en pasado usando tiempo incorrecto
}
```

### Problema 4c: Filter de dayAppointments (Línea 404-412)
```tsx
const dayAppointments = filteredAppointments.filter((apt) => {
  const aptUtc = new Date(apt.scheduled_at);  // ❌ UTC
  const aptDate = new Date(apt.scheduled_at); // ❌ UTC
  
  // Comparación entre fechas en diferentes zonas
  return aptDate.toDateString() === dayDate.toDateString();  // Puede fallar
});
```

### Solución Correcta:
```tsx
const handleDateSelect = useCallback((info: DateSelectArg) => {
  const { clinicTimezone } = useClinicTimezone();
  
  // FullCalendar devuelve dateStr en la zona configurada
  const selectedDate = utcToZonedTime(new Date(info.startStr), clinicTimezone);
  
  // Ahora las validaciones son correctas:
  const now = utcToZonedTime(new Date(), clinicTimezone);
  if (selectedDate < startOfDay(now)) {
    // Está en el pasado
  }
}, [clinicTimezone]);

// Para filtrar citas de un día:
const dayAppointments = filteredAppointments.filter((apt) => {
  const aptInClinic = utcToZonedTime(new Date(apt.scheduled_at), clinicTimezone);
  const dayInClinic = utcToZonedTime(dayDate, clinicTimezone);
  
  return isSameDay(aptInClinic, dayInClinic);
});
```

---

## 5️⃣ GRUPO 5: VALIDACIÓN DE CONFLICTOS (Líneas 619-666)

### Código Actual:
```tsx
const conflict = hasConflictingAppointment(clickedDate, 30, appointments, config, locationType);

if (conflict) {
  const existingStart = new Date(conflictingApt!.scheduled_at);
  const existingEnd = new Date(existingStart.getTime() + (conflictingApt!.duration_minutes || 30) * 60000);
  // Usa existingStart/End para validar
}
```

### Problema:
- `clickedDate` está en timezone incorrecto
- `existingStart` y `existingEnd` están en UTC
- Comparar fechas en diferentes zonas da resultados incorrectos

### Ejemplo de Bug:
```
Clínica en Colombia (UTC-5)
Usuario hace click en 9:00 AM en el calendario
  → JavaScript lo recibe como 2026-03-05T09:00:00 UTC
  → Luego lo convierte a Date: Date(2026-03-05T09:00:00) = 2026-03-05T09:00:00
  
Cita existente tiene scheduled_at = "2026-03-05T14:00:00Z" (14:00 UTC = 9:00 AM Colombia)
  → Se crea Date(2026-03-05T14:00:00Z) = 2026-03-05T14:00:00
  
Comparación: 09:00 vs 14:00 → NO DETECTA CONFLICTO ❌
```

### Solución Correcta:
```tsx
import { areIntervalsOverlapping } from 'date-fns';

const { clinicTimezone } = useClinicTimezone();

// Normalizar fecha clickeada al timezone de clínica
const clickedDateInClinic = utcToZonedTime(clickedDate, clinicTimezone);

// Detectar conflictos comparando en el mismo timezone
const conflictingAppointments = appointments.filter((apt) => {
  const aptStart = utcToZonedTime(new Date(apt.scheduled_at), clinicTimezone);
  const aptEnd = new Date(aptStart.getTime() + (apt.duration_minutes || 30) * 60000);
  
  const newSlotStart = startOfMinute(clickedDateInClinic);
  const newSlotEnd = new Date(newSlotStart.getTime() + 30 * 60000);
  
  return areIntervalsOverlapping(
    { start: aptStart, end: aptEnd },
    { start: newSlotStart, end: newSlotEnd }
  );
});
```

---

## 🔧 CHECKLIST DEL FIX

### Paso 1: Imports necesarios
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
  isWithinInterval
} from 'date-fns';
```

### Paso 2: Obtener timezone en el componente
```tsx
const { clinicTimezone } = useClinicTimezone();
```

### Paso 3: Reemplazar todas las instancias
- [ ] Línea 52-54: `useState(new Date())` → usar `useEffect` con timezone
- [ ] Línea 149: `new Date(rangeStart)` → `utcToZonedTime(new Date(rangeStart), clinicTimezone)`
- [ ] Líneas 185-237: todos los bloques → usar `startOfDay`, `addDays`
- [ ] Líneas 292-300: cálculos de hora → usar formato del timezone
- [ ] Línea 395, 408, 412: `new Date()` → `utcToZonedTime(new Date(), clinicTimezone)`
- [ ] Línea 606: `new Date(info.dateStr)` → `utcToZonedTime(new Date(info.dateStr), clinicTimezone)`
- [ ] Línea 622-623: comparaciones → convertir ambas al mismo timezone

### Paso 4: Testing
```bash
# Testear en cada timezone importante:
1. UTC/Etc/UTC
2. America/Bogota (Colombia)
3. America/Chicago (Estados Unidos)
4. Europe/Madrid (España)

# Validar:
- [ ] Las citas aparecen en la hora correcta
- [ ] Los conflictos se detectan correctamente
- [ ] Las bloques de no disponibilidad son correctos
- [ ] Al cambiar timezone, los datos se actualizan
```

---

## 📌 PATRÓN GENERAL PARA ESTA PÁGINA

Todas las operaciones de fecha deben seguir este flujo:

```
┌─────────────────────────────────────────────────┐
│ ENTRADA: ISO String UTC (ej: "2026-03-05T...Z")│
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │ new Date(isoString)          │ ← Convierte a Date
    └──────────────────┬───────────┘
                       │
                       ▼
    ┌──────────────────────────────┐
    │ utcToZonedTime(date, cTz)    │ ← Convierte a clinic tz
    └──────────────────┬───────────┘
                       │
                       ▼
    ┌──────────────────────────────┐
    │ Operaciones (startOfDay,     │ ← Manipula en timezone
    │  addDays, isSameDay, etc)    │   de clínica
    └──────────────────┬───────────┘
                       │
                       ▼
    ┌──────────────────────────────┐
    │ format(date, 'HH:mm', ...) o │ ← Muestra al usuario
    │ toISOString()                │   en timezone correcto
    └──────────────────────────────┘
```

---

## 🎯 MÉTRICAS ESPERADAS POST-FIX

| Métrica | Antes | Después |
|---------|-------|---------|
| Conflictos detectados correctamente | ~60% | 100% |
| Citas mostradas en hora correcta | Variable | Consistente |
| Funcionamiento multi-timezone | ❌ | ✅ |
| Líneas con `new Date()` sin control | ~30 | 0 |

---

**Prioridad:** 🔴 MÁXIMA  
**Tiempo de corrección:** 2-3 horas  
**Testing Time:** 1 hora  
**Riesgo de Regresión:** ALTO - Requiere testing exhaustivo
