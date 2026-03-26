# 🏗️ ARQUITECTURA IMPLEMENTADA: Auto-Búsqueda de Próximo Slot

## 📌 Misión

**Cuando el usuario presiona el botón "Nueva Cita", antes de abrir el modal de grooming, el sistema busca automáticamente el próximo horario y hora hábil disponible para registrar una cita, y los auto-llena en el formulario.**

---

## 🎯 Solución Implementada

### Arquitectura General

```
┌─────────────────────────────────────────────────────┐
│           Usuario en Página de Grooming             │
└────────────────┬──────────────────────────────────┬─┘
                 │                                  │
         ┌───────▼────────┐              ┌─────────▼───────┐
         │  Botón         │              │  Click          │
         │ "Nueva Cita"   │              │ Calendario      │
         └────────┬───────┘              └────────┬────────┘
                  │                               │
         ┌────────▼───────────┐        ┌─────────▼────────┐
         │ sourceType =       │        │ sourceType =     │
         │ 'new-button'       │        │ 'calendar'       │
         └────────┬───────────┘        └────────┬─────────┘
                  │                             │
         ┌────────▼────────────────┐           │
         │ BUSCAR PRÓXIMO SLOT    │           │
         │ findNextAvailableSlot()│           │
         │ ├─ Hoy hasta +30 días  │           │
         │ ├─ Validar hábil       │           │
         │ ├─ Validar no ocupado  │           │
         │ └─ Retorna{date,time}  │           │
         └────────┬────────────────┘           │
                  │                             │
         ┌────────▼──────────────────┐        │
         │ Auto-llenar Modal:        │        │
         │ ├─ date = slot.date      │        │
         │ ├─ time = slot.time      │        │
         │ └─ Toast success         │        │
         └─────────────────┬────────┘        │
                           │                  │
         ┌─────────────────▼──────────────────▼──┐
         │    Modal abierto y listo            │
         │  Usuario selecciona:                │
         │  ├─ Cliente                         │
         │  ├─ Mascotas                        │
         │  └─ Servicios                       │
         └─────────────────┬────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ Guardar Cita│
                    └─────────────┘
```

---

## 📂 Cambios por Archivo

### A. **UnifiedGroomingModal.tsx**

#### Nuevo Prop Interface
```typescript
interface UnifiedGroomingModalProps {
  // ... props existentes
  sourceType?: 'calendar' | 'new-button'
}
```

#### Nueva Función Async
```typescript
const findNextAvailableSlot = useCallback(
  async (): Promise<{date: string; time: string} | null> => {
    // Busca desde minDate hasta +30 días
    // Valida: clínica abierta, horario hábil, no ocupado, no pasado
    // Retorna: {date: 'YYYY-MM-DD', time: 'HH:mm'} o null
  },
  [minDate, config, clinicTimezone, appointments]
)
```

#### Nuevo useEffect
```typescript
useEffect(() => {
  if (!isOpen || sourceType !== 'new-button') return
  
  const autoFill = async () => {
    const nextSlot = await findNextAvailableSlot()
    if (nextSlot) {
      setDate(nextSlot.date)
      setTime(nextSlot.time)
      toast.success(`Próximo horario: ${nextSlot.date} ${nextSlot.time}`)
    }
  }
  
  autoFill()
}, [isOpen, sourceType, config, appointments, clinicTimezone])
```

---

### B. **grooming/page.tsx**

#### 1. Estado Nuevo
```typescript
const [modalSourceType, setModalSourceType] = useState<
  'calendar' | 'new-button'
>('calendar')
```

#### 2. Actualizar Botón "Nueva Cita"
```typescript
{/* ANTES */}
setModalOpen(true)

{/* DESPUÉS */}
setModalSourceType('new-button')
setModalOpen(true)
```

#### 3. Actualizar Click Calendario (2 handlers)
```typescript
// handleDateClick
setModalSourceType('calendar')
setModalOpen(true)

// handleSelectSlot  
setModalSourceType('calendar')
setModalOpen(true)
```

#### 4. Cerrar Modal
```typescript
{/* ANTES */}
const handleModalClose = () => {
  setModalOpen(false)
  setSelectedSlot(null)
}

{/* DESPUÉS */}
const handleModalClose = () => {
  setModalOpen(false)
  setSelectedSlot(null)
  setModalSourceType('calendar') // Reset
}
```

#### 5. Pasar Prop al Modal
```typescript
<UnifiedGroomingModal
  isOpen={modalOpen}
  scheduledAt={selectedSlot}
  sourceType={modalSourceType}  // ← NUEVO
  // ... otros props
/>
```

---

## ⚙️ Cómo Funciona

### Fase 1: Usuario Presiona "Nueva Cita"
```
1. onClick → handleClick()
2. ✓ Valida que hoy sea hábil
3. setModalSourceType('new-button')
4. setModalOpen(true)
5. Modal abre
```

### Fase 2: useEffect Auto-Fill Se Dispara
```
1. isOpen cambió a true
2. sourceType es 'new-button'
3. Condición cumplida → ejecutar efecto
4. Llamar findNextAvailableSlot()
```

### Fase 3: Buscar Próximo Slot
```
1. Loop desde minDate
2. Para cada día (hasta 30 días):
   a. ¿Clínica abierta?
      NO → siguiente día
      SÍ → continuar
   
   b. Para cada intervalo de 15 min:
      - ¿Dentro de horario negocio?
      - ¿No es pasado (si hoy)?
      - ¿No ocupado?
      ✓ TODO OK → RETORNAR {date, time}
      ✗ Alguno falla → siguiente intervalo

3. Si llega al final → RETORNAR null
```

### Fase 4: Auto-Llenar Modal
```
1. Si findNextAvailableSlot() retorna {date, time}:
   ├─ setDate(date)
   ├─ setTime(time)
   ├─ setIsAutoInitializing(true)
   └─ toast.success("Próximo horario: ...")

2. Si retorna null:
   └─ toast.error("No hay horarios disponibles")
```

### Fase 5: Usuario Interactúa
```
1. Sistema está en modo "auto-initializing"
2. Usuario selecciona:
   - Cliente
   - Mascotas
   - Servicios
3. Presiona "Guardar"
4. Se crea cita con fecha/hora auto-llenada
```

---

## 🔄 Flujo Completo de Estados

```
┌─────────────────────────────────────┐
│ INICIO                              │
│ ├─ modalSourceType = 'calendar'    │
│ └─ modalOpen = false               │
└────────────────┬────────────────────┘
                 │
        ╔════════▼════════╗
        ║ USUARIO SIGUE:  ║
        ╚════╤═════════╤══╝
             │         │
    ┌────────▼┐      ┌─▼────────┐
    │ Botón   │      │ Calendar │
    │ Nueva   │      │ Click    │
    │ Cita    │      │          │
    └────┬────┘      └─┬────────┘
         │             │
    ┌────▼──────────┐  │
    │ sourceType =  │  │
    │'new-button'   │  │
    │ modalOpen=T   │  │
    │               │  │
    │ useEffect:    │  │
    │ buscar slot   │  │
    │ └─ Encontrado │  │
    │    setDate(d) │  │
    │    setTime(t) │  │
    │    toast(ok)  │  │
    └────┬──────────┘  │
         │             │
         │        ┌────▼─────────┐
         │        │ sourceType =  │
         │        │ 'calendar'    │
         │        │ modalOpen=T   │
         │        │               │
         │        │ NO auto-fill  │
         │        │ (usa calendar)│
         │        └────┬──────────┘
         │             │
         └──────┬──────┘
                │
         ┌──────▼───────────────┐
         │ Modal Abierto        │
         │ Usuario llena:       │
         │ ├─ Cliente           │
         │ ├─ Mascotas          │
         │ ├─ Servicios         │
         │ └─ Presiona Guardar  │
         └──────┬───────────────┘
                │
         ┌──────▼───────────────┐
         │ Cita Creada          │
         │ Modal Cierra         │
         │ sourceType='calendar'│ (reset)
         └──────┬───────────────┘
                │
         ┌──────▼───────────────┐
         │ LISTO PARA SIGUIENTE │
         │ OPERACIÓN            │
         └──────────────────────┘
```

---

## ✅ Validaciones en `findNextAvailableSlot()`

```typescript
┌─ Para cada día:
│  ├─ ¿Clínica abierta?
│  │  └─ getBusinessHoursForDate() retorna array no vacío
│  │
│  └─ Para cada intervalo de 15 min en el día:
│     ├─ ¿Dentro de startTime - endTime?
│     │  └─ businessHours.start ≤ timeStr < businessHours.end
│     │
│     ├─ ¿No es pasado (si es hoy)?
│     │  └─ testDateTime > clinicNow
│     │
│     └─ ¿No ocupado?
│        └─ !occupied.has(timeStr)
│
└─ ✓ TODOS OK → RETORNAR {date, time}
```

---

## 📊 Comparativa: Comportamientos

| Evento | sourceType | Auto-Busca | Resultado |
|--------|-----------|-----------|-----------|
| Botón "Nueva Cita" | `'new-button'` | ✅ SÍ | Próximo slot auto-llenado |
| Click en Calendario | `'calendar'` | ❌ NO | Usa fecha/hora clicada |
| Presiona ESC | N/A | N/A | sourceType → 'calendar' |
| Cierra Modal | N/A | N/A | sourceType → 'calendar' |

---

## 🧠 Conceptos Clave

### 1. **Prop Flag Pattern**
El `sourceType` es un "flag" que indica de dónde viene la apertura del modal.

### 2. **Async Computation in useEffect**
La función `findNextAvailableSlot()` es async pero se llama desde un useEffect síncrono usando IIFE.

### 3. **Auto-Initialization**
Se usa `isAutoInitializing` para evitar validaciones durante la búsqueda.

### 4. **Timezone-Aware**
Todas las validaciones respetan `clinicTimezone` (no usa hora del navegador).

### 5. **Dependency Management**
`findNextAvailableSlot()` es memoized con useCallback para evitar loops infinitos.

---

## 📈 Rendimiento

| Operación | Tiempo Típico | Notas |
|-----------|--------------|-------|
| findNextAvailableSlot() | < 100ms | Busca 30 días × 96 intervalos |
| useEffect trigger | < 50ms | Solo si sourceType='new-button' |
| Toast notification | Inmediato | Feedback al usuario |
| Modal render | < 200ms | Con datos auto-llenados |

**Total esperado:** < 500ms desde click a modal visible

---

## 🛡️ Manejo de Errores

```typescript
// Si config es null
→ findNextAvailableSlot() retorna null

// Si appointments está vacío
→ Busca sin conflictos (slots más disponibles)

// Si clinicTimezone no disponible
→ Retorna null (fallback a formato manual)

// Si no hay slots en 30 días
→ toast.error("No hay horarios disponibles")
```

---

## 🚀 Próximas Mejoras (Futuro)

1. **Aumentar rango de búsqueda** (actualmente 30 días)
2. **Mostrar opciones múltiples** (próximos 3 slots disponibles)
3. **Preferencias de horario** (mañana, tarde, noche)
4. **Filtrar por staff** (estilista específico)
5. **Guardar preferencias** (usuario siempre prefiere mañana)

---

## 📞 Soporte

Si hay dudas sobre la arquitectura:
1. Revisar logs en consola (🔍, ✅, ⚠️)
2. Comprobar `sourceType` en React DevTools
3. Verificar que `findNextAvailableSlot()` retorna algo

