# 🏗️ Arquitectura: Auto-Llenado de Próximo Slot Disponible

## 📋 Descripción General

Se ha implementado una funcionalidad que permite al modal de grooming **auto-buscar y llenar automáticamente el próximo horario disponible** cuando se abre desde el botón "Nueva Cita", en lugar de usar la fecha/hora del calendario.

---

## 🎯 Flujo de Funcionamiento

### 1️⃣ **Trigger: Botón "Nueva Cita"**
```
Usuario hace click en botón "Nueva Cita"
    ↓
Se establece: modalSourceType = 'new-button'
Se abre el modal: setModalOpen(true)
    ↓
UnifiedGroomingModal recibe sourceType='new-button'
```

### 2️⃣ **Búsqueda Automática de Slot**

El modal ejecuta un `useEffect` que:

```typescript
if (isOpen && sourceType === 'new-button') {
  const nextSlot = await findNextAvailableSlot()
  if (nextSlot) {
    setDate(nextSlot.date)      // Auto-llena fecha
    setTime(nextSlot.time)      // Auto-llena hora
  }
}
```

**La función `findNextAvailableSlot()` valida:**
- ✅ Que la clínica esté abierta ese día
- ✅ Que el horario esté dentro del horario de negocio
- ✅ Que el horario no esté ocupado por otra cita
- ✅ Que no esté en el pasado (si es hoy)
- ✅ Búsqueda hasta 30 días adelante

### 3️⃣ **vs Click en Calendario**
```
Usuario hace click en una fecha del calendario
    ↓
Se establece: modalSourceType = 'calendar'
Se abre el modal con esa fecha pre-llenada
    ↓
NO se ejecuta la búsqueda automática
Se usa la fecha clicked del calendario
```

---

## 📐 Cambios Implementados

### A. **UnifiedGroomingModal.tsx**

#### 1. Nuevo Prop en Interface
```typescript
interface UnifiedGroomingModalProps {
  // ... props existentes ...
  sourceType?: 'calendar' | 'new-button'; // ← NUEVO
}
```

#### 2. Nueva Función: `findNextAvailableSlot()`
```typescript
const findNextAvailableSlot = useCallback(async (): Promise<{
  date: string;
  time: string;
} | null> => {
  // Lógica para encontrar el próximo slot disponible
  // - Itera desde hoy hasta 30 días adelante
  // - Para cada día, itera en intervalos de 15 minutos
  // - Valida horario hábil, no ocupado, no en el pasado
  // - Retorna el primer slot disponible
}, [minDate, config, exceptions, appointments, clinicTimezone]);
```

#### 3. Nuevo useEffect: Auto-Llenar Slot
```typescript
useEffect(() => {
  if (!isOpen || sourceType !== 'new-button') return;
  if (!config || !appointments || !clinicTimezone) return;

  const autoFillNextSlot = async () => {
    const nextSlot = await findNextAvailableSlot();
    if (nextSlot) {
      setDate(nextSlot.date);
      setTime(nextSlot.time);
      setIsAutoInitializing(true);
      toast.success(`📅 Próximo horario: ${nextSlot.date} a las ${nextSlot.time}`);
    }
  };

  autoFillNextSlot();
}, [isOpen, sourceType, config, appointments, clinicTimezone,
    findNextAvailableSlot]);
```

---

### B. **grooming/page.tsx**

#### 1. Nuevo State: Rastrear Fuente del Modal
```typescript
const [modalSourceType, setModalSourceType] = useState<'calendar' | 'new-button'>('calendar');
```

#### 2. Botón "Nueva Cita"
```typescript
<button onClick={() => {
  // ... validación ...
  setSelectedSlot(today);
  setModalSourceType('new-button'); // ← NUEVO
  setModalOpen(true);
}}>
  Nueva Cita
</button>
```

#### 3. Clicks en Calendario
```typescript
// En handleDateClick
setSelectedSlot(clickedDate);
setModalSourceType('calendar'); // ← NUEVO
setModalOpen(true);

// En handleSelectSlot
setSelectedSlot(slotDate);
setModalSourceType('calendar'); // ← NUEVO
setModalOpen(true);
```

#### 4. Cerrar Modal
```typescript
const handleModalClose = () => {
  setModalOpen(false);
  setSelectedSlot(null);
  setModalSourceType('calendar'); // ← Reset a default
};
```

#### 5. Pasar Prop al Modal
```typescript
<UnifiedGroomingModal
  isOpen={modalOpen}
  scheduledAt={selectedSlot}
  onClose={handleModalClose}
  onSuccess={handleModalSuccess}
  config={config}
  exceptions={exceptions}
  appointments={appointments}
  sourceType={modalSourceType} // ← NUEVO
/>
```

---

## 🔍 Casos de Uso

### Caso 1: Usuario presiona "Nueva Cita" (Lunes 14:00)
```
Usuario: Presiona botón "Nueva Cita"
    ↓
Sistema: Busca próximo slot disponible
    ↓
Resultado posible:
- Hoy (Lunes) 14:15 ✅ Disponible → Auto-llenar
- O Mañana (Martes) 09:00 ✅ Disponible → Auto-llenar
- O Próxima semana 09:00 ✅ Disponible → Auto-llenar
    ↓
Modal se abre con fecha/hora pre-llenada
Usuario solo necesita seleccionar mascotas y servicios
```

### Caso 2: Usuario hace click en fecha específica
```
Usuario: Click en Martes 15:00 en el calendario
    ↓
Sistema: Abre modal con esa fecha/hora específica
NO se ejecuta búsqueda automática
    ↓
Modal abre con Martes 15:00 pre-llenado
```

---

## 💡 Validaciones Incluidas

La función `findNextAvailableSlot()` valida:

| Validación | Descripción |
|-----------|-------------|
| **Clínica abierta** | Usa `getBusinessHoursForDate()` |
| **Horario hábil** | Dentro de startTime - endTime |
| **No ocupado** | Verifica citas existentes en CLINIC |
| **No en pasado** | Para hoy, solo veces futuras |
| **Intervalo 15 min** | Solo en marcas de 15 minutos |
| **Máx 30 días** | No busca más allá de 30 días |

---

## 📊 Logs de Debugging

El código incluye logs para debugging:

```typescript
console.log('🔍 Buscando próximo slot disponible...');
console.log('✅ Slot disponible encontrado: 2026-03-10 09:00');
console.log('⚠️ No se encontró slot disponible en los próximos 30 días');
```

---

## 🚨 Consideraciones Importantes

### 1. **sourceType se reseta al cerrar**
Cuando el usuario cierra el modal, `modalSourceType` se resetea a `'calendar'` para la próxima apertura.

### 2. **Auto-init flag**
Se establece `isAutoInitializing = true` durante la búsqueda para evitar validaciones prematuras.

### 3. **Toast notifications**
El usuario recibe notificaciones:
- ✅ Cuando se encuentra un slot
- ⚠️ Cuando no se encuentra

### 4. **Dependencies correctas**
El useEffect de auto-fill depende de:
- `isOpen`, `sourceType`, `config`, `appointments`, `clinicTimezone`
- Y de la función `findNextAvailableSlot` (que tiene sus propias dependencias)

---

## 🔗 Flujo Completo de Estados

```
INICIO
  ├─ modalSourceType = 'calendar' (default)
  └─ modalOpen = false

USUARIO PRESIONA "Nueva Cita"
  ├─ modalSourceType = 'new-button'
  ├─ modalOpen = true
  └─ findNextAvailableSlot() se ejecuta

RESULTADO:
  ├─ Slot encontrado → date/time auto-llenos
  │  └─ toast.success()
  └─ No hay slots → error toast

USUARIO CIERRA MODAL:
  ├─ modalSourceType = 'calendar' (reset)
  ├─ modalOpen = false
  └─ selectedSlot = null

USUARIO HACE CLICK EN CALENDARIO:
  ├─ modalSourceType = 'calendar'
  ├─ modalOpen = true
  ├─ selectedSlot = fecha clicked
  └─ NO se ejecuta findNextAvailableSlot()
```

---

## 🎨 UX Flow

```
┌─────────────────────────────────────┐
│  Página de Grooming                 │
├─────────────────────────────────────┤
│                                     │
│  [Nueva Cita] ← Click aquí          │
│                                     │
│  Calendario (mes/semana/día)        │
│  ├─ Click en fecha → Modal abre     │
│                                     │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│  Modal de Grooming                  │
├─────────────────────────────────────┤
│                                     │
│  📅 Fecha: 2026-03-10 ← Auto-lleno  │
│  🕐 Hora: 09:00 ← Auto-lleno        │
│                                     │
│  👤 Selecciona Cliente:  [...]      │
│  🐾 Selecciona Mascotas: [ ] [ ]    │
│  ✨ Servicios: [+] [+]              │
│                                     │
│  [Cancelar] [Crear Cita]            │
│                                     │
└─────────────────────────────────────┘
```

---

## ✅ Testing Manual

1. **Test: Botón Nueva Cita**
   - Presiona botón "Nueva Cita"
   - Verifica que se auto-llene con próximo slot
   - Verifica que haya toast de confirmación

2. **Test: Click en Calendario**
   - Cambia a vista "Semana" o "Día"
   - Hace click en una hora específica
   - Verifica que se llene CON esa hora (no busca)

3. **Test: Sin slots disponibles**
   - Si no hay slots en 30 días
   - Debe mostrar error toast

4. **Test: Diferentes horarios**
   - Presiona "Nueva Cita" a diferentes horas
   - Verifica que respete horario de negocio
   - Verifica que no elija horas ocupadas

---

## 📚 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `UnifiedGroomingModal.tsx` | +1 prop, +1 función, +1 useEffect |
| `grooming/page.tsx` | +1 state, 3 handlers actualizados, 1 prop nuevo |

**Líneas de código añadidas:** ~150 líneas
**Complejidad:** Media (lógica de búsqueda similar a la existente)

