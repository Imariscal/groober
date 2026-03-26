# 📐 DIAGRAMA VISUAL: Auto-Búsqueda de Próximo Slot

## Arquitectura Visual Completa

```
┌─────────────────────────────────────────────────────────────────┐
│                     GROOMING PAGE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────┐       │
│  │   Botón Nueva    │              │   Calendario     │       │
│  │      Cita        │              │   (Mes/Sem/Día) │       │
│  └────────┬─────────┘              └────────┬─────────┘       │
│           │                                 │                  │
│   onClick │                        onClick  │                  │
│           ▼                                 ▼                  │
│  ┌──────────────────┐          ┌──────────────────────┐       │
│  │ setModalSource   │          │ setModalSourceType   │       │
│  │   Type('new-   │          │   ('calendar')      │       │
│  │   button')       │          │                      │       │
│  └────────┬─────────┘          └──────────┬───────────┘       │
│           │                               │                   │
│           │  setModalOpen(true)           │                   │
│           │ setSelectedSlot(today)        │                   │
│           └───────────────┬───────────────┘                   │
│                           │                                   │
│                    ┌──────▼──────┐                             │
│                    │ Modal Opens  │                             │
│                    └──────┬───────┘                             │
│                           │                                   │
│                   [Props Passed Down]                         │
│                           │                                   │
└───────────────────────────┼───────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────────────┐
        │   UNIFIED GROOMING MODAL COMPONENT      │
        ├──────────────────────────────────────────┤
        │                                          │
        │  Props Recibidos:                        │
        │  ├─ isOpen: true ✓                      │
        │  ├─ sourceType: 'new-button'|'calendar' │
        │  ├─ config: ClinicConfiguration         │
        │  ├─ appointments: Appointment[]         │
        │  └─ ... (otros)                         │
        │                                          │
        │  States:                                 │
        │  ├─ date: string                        │
        │  ├─ time: string                        │
        │  ├─ isAutoInitializing: boolean         │
        │  └─ ... (otros)                         │
        │                                          │
        └──────┬───────────────────────┬──────────┘
               │                       │
               │ if sourceType ===     │ if sourceType ===
               │ 'new-button'          │ 'calendar'
               │                       │
        ┌──────▼──────────┐     ┌─────▼──────────┐
        │  useEffect      │     │  useEffect     │
        │  Trigger        │     │  SKIP          │
        │  (Auto-Fill)    │     │  (Use calendar │
        │                 │     │   date/time)   │
        └──────┬──────────┘     └────────────────┘
               │
               │ Ejecutar:
               │ const slot = await findNextAvailableSlot()
               │
        ┌──────▼──────────────────────────────┐
        │  FUNCIÓN: findNextAvailableSlot()   │
        ├──────────────────────────────────────┤
        │                                      │
        │  Loop: for dayOffset = 0 to 29      │
        │  ├─ searchDate = minDate + offset   │
        │  ├─ dateStr = YYYY-MM-DD            │
        │  │                                  │
        │  ├─ businessHours =                 │
        │  │  getBusinessHoursForDate(...)    │
        │  │  → {start, end}[]                │
        │  │                                  │
        │  ├─ ✓ Clínica abierta?              │
        │  │  (businessHours.length > 0)      │
        │  │   NO → continue (siguiente día)  │
        │  │   SÍ → continuar                 │
        │  │                                  │
        │  ├─ occupiedTimes = Set()           │
        │  │  Cargar: appointments del día    │
        │  │  Marcar: bloques ocupados        │
        │  │                                  │
        │  └─ Loop: for i = 0 to 95           │
        │     (Cada 15 minutos)               │
        │     ├─ timeStr = HH:MM              │
        │     │                               │
        │     ├─ ✓ Dentro horario negocio?    │
        │     │  (startMin ≤ timeMin < endMin)│
        │     │   NO → continue               │
        │     │   SÍ → continuar              │
        │     │                               │
        │     ├─ ✓ No es pasado?              │
        │     │  (si es hoy)                  │
        │     │   SÍ en pasado → continue     │
        │     │   NO → continuar              │
        │     │                               │
        │     ├─ ✓ No ocupado?                │
        │     │  (!occupied.has(timeStr))     │
        │     │   SÍ ocupado → continue       │
        │     │   NO → ¡ENCONTRADO!           │
        │     │                               │
        │     └─ RETORNAR {date, time}  ← 🎯│
        │                                    │
        │  Si llega al final:                │
        │  RETORNAR null                     │
        │                                    │
        └──────┬───────────────────────────┤
               │                           │
        ┌──────▼──────────┐     ┌─────────▼──────────┐
        │  Slot          │     │  No Slot           │
        │  Encontrado    │     │  Encontrado        │
        │ {date, time}   │     │  null              │
        └──────┬─────────┘     └─────────┬──────────┘
               │                         │
        ┌──────▼──────────────┐  ┌──────▼────────────────┐
        │  setDate(date)      │  │  toast.error(        │
        │  setTime(time)      │  │  'No hay horarios'   │
        │  setIsAutoInitial   │  │  )                   │
        │  izing(true)        │  │                      │
        │  toast.success(     │  │  Modal sigue abierto │
        │  'Próximo...')      │  │  Usuario completa    │
        │                     │  │  manualmente         │
        └──────┬──────────────┘  └──────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │   MODAL LISTO PARA USO      │
        ├──────────────────────────────┤
        │                              │
        │  Campos Auto-Llenados:       │
        │  📅 Fecha: 2026-03-10       │
        │  🕐 Hora: 09:00             │
        │                              │
        │  Usuario Completa:           │
        │  👤 Cliente:                 │
        │  🐾 Mascotas: [ ] [ ]       │
        │  ✨ Servicios: [+] [+]      │
        │                              │
        │  [Cancelar] [Guardar Cita]  │
        │                              │
        └─────────────────────────────┘
```

---

## Comparativa: Dos Rutas de Apertura

```
═══════════════════════════════════════════════════════════════════════════

                            RUTA 1: BOTÓN "NUEVA CITA"

═══════════════════════════════════════════════════════════════════════════

    Usuario                    grooming/page.tsx            Modal
       │                              │                      │
       │  Click "Nueva Cita"          │                      │
       ├─────────────────────────────►│                      │
       │                              │ setModalSourceType   │
       │                              │ ('new-button')       │
       │                              │ setModalOpen(true)   │
       │                              │                      │
       │                              │  Modal Open          │
       │                              ├─────────────────────►│
       │                              │                      │ Props:
       │                              │                      │ sourceType=
       │                              │                      │ 'new-button'
       │                              │                      │
       │                              │                      │ useEffect:
       │                              │                      │ if (sourceType
       │                              │                      │  === 'new-btn')
       │                              │                      │   findSlot()
       │                              │                      │
       │                              │  Buscando...        │
       │                              │◄─────────────────────┤
       │                              │                      │
       │  ✅ Próximo horario:         │                      │
       │  2026-03-10 09:00            │◄─────────────────────┤
       │◄─────────────────────────────┤  Slots encontrado!
       │                              │  setDate() setTime()
       │                              │  toast.success()
       │                              │

═══════════════════════════════════════════════════════════════════════════

                          RUTA 2: CLICK EN CALENDARIO

═══════════════════════════════════════════════════════════════════════════

    Usuario                    grooming/page.tsx            Modal
       │                              │                      │
       │  Click en fecha 15:00        │                      │
       ├─────────────────────────────►│                      │
       │                              │ setModalSourceType   │
       │                              │ ('calendar')         │
       │                              │ setSelectedSlot()    │
       │                              │ setModalOpen(true)   │
       │                              │                      │
       │                              │  Modal Open          │
       │                              ├─────────────────────►│
       │                              │                      │ Props:
       │                              │                      │ sourceType=
       │                              │                      │ 'calendar'
       │                              │                      │
       │                              │                      │ useEffect:
       │                              │                      │ if (sourceType
       │                              │                      │  !== 'new-btn')
       │                              │                      │   SKIP
       │                              │                      │
       │  Modal Abierto con:          │                      │
       │  📅 2026-03-10               │◄─────────────────────┤
       │  ⏰ 15:00                    │  Sin búsqueda
       │◄─────────────────────────────┤  USA valor clicado
       │  (del click, no buscado)     │

═══════════════════════════════════════════════════════════════════════════
```

---

## Flujo de Estados (State Machine)

```
                              ┌────────────────┐
                              │   INICIAL      │
                              │ modalSourceType│
                              │ = 'calendar'   │
                              │ modalOpen=false│
                              └────────┬───────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
                    │ Usuario hace                │ Usuario hace
                    │ Click "Nueva Cita"        │ Click Calendario
                    │                                    │
          ┌─────────▼────────────┐       ┌──────────────▼──────────┐
          │   sourceType =       │       │  sourceType =           │
          │   'new-button'       │       │  'calendar'             │
          │   modalOpen = true   │       │  modalOpen = true       │
          │   selectedSlot = now │       │  selectedSlot = clicked │
          └─────────┬────────────┘       └───────────┬─────────────┘
                    │                               │
                    │useEffect triggers             │useEffect SKIP
                    │                               │
          ┌─────────▼────────────┐                 │
          │  findNextAvailable   │                 │
          │  Slot()              │                 │
          └─────────┬────────────┘                 │
                    │                               │
        ┌───────────┬───────────┐                  │
        │           │           │                  │
        │ Slot      │ No Slot   │                  │
        │ Encontr.  │ (null)    │                  │
        │           │           │                  │
   ┌────▼──┐  ┌─────▼──┐  ┌────▼──────┐         │
   │ setDate│  │ toast  │  │ Modal     │         │
   │ setTime│  │ error  │  │ abierto   │         │
   │ success│  └────────┘  │ sin llenar│         │
   │ toast  │             └───────────┘         │
   └────┬───┘                  │                 │
        │                      │        ┌────────▼──────┐
        │                      │        │ Usuario llena │
        │   ┌──────────────────┘        │ manualmente   │
        │   │                          └────────┬───────┘
        │   │                                  │
        │   │   ┌──────────────────────────────┘
        │   │   │
        │   ▼   ▼
        │ ┌──────────────────────┐
        │ │  Modal Listo         │
        │ │  Usuario completa:   │
        │ │  ├─ Cliente          │
        │ │  ├─ Mascotas         │
        │ │  └─ Servicios        │
        │ │  Presiona "Guardar"  │
        │ └──────┬───────────────┘
        │        │
        │   ┌────▼──────────────┐
        │   │  API Call         │
        │   │  Guardar Cita     │
        │   └────┬──────────────┘
        │        │
        │   ┌────▼──────────────┐
        │   │  Success          │
        │   │ toast.success()   │
        │   └────┬──────────────┘
        │        │
        └────┬───┘ o si error:
             │     └─ toast.error()
             │
        ┌────▼────────────────────┐
        │ handleModalClose()       │
        │ ├─ setModalOpen(false)   │
        │ ├─ setSelectedSlot(null) │
        │ └─ sourceType='calendar' │ (RESET)
        │                          │
        └────┬─────────────────────┘
             │
        ┌────▼──────────────────┐
        │  LISTO PARA SIGUIENTE  │
        │  OPERACIÓN             │
        └───────────────────────┘
```

---

## Validaciones en findNextAvailableSlot()

```
Para cada día (0 a 29 días from now):
│
├─ 👁️  ¿Clínica abierta?
│  │   const bh = getBusinessHoursForDate()
│  │   if (!bh || bh.length === 0) ❌ SKIP
│  │   else ✅ continuar
│  │
│  └──► Para cada tiempo de 15-min (0 a 95):
│       │
│       ├─ 👁️  ¿Dentro horario negocio?
│       │  │   const [startMin, endMin] = parse(bh.start, bh.end)
│       │  │   if (timeMin < startMin || timeMin >= endMin) ❌ SKIP
│       │  │   else ✅ continuar
│       │  │
│       │  ├─ 👁️  ¿No es pasado (si hoy)?
│       │  │  │   if (dateStr === minDate) {
│       │  │  │     const now = utcToZonedTime(new Date(), tz)
│       │  │  │     if (testDateTime <= now) ❌ SKIP
│       │  │  │   } else ✅ continuar
│       │  │  │
│       │  │  └─ 👁️  ¿No está ocupado?
│       │  │     │   if (occupied.has(timeStr)) ❌ SKIP
│       │  │     │   else ✅ ¡ENCONTRADO!
│       │  │     │
│       │  │     └─ ✅ RETORNAR {date, time}
│       │  │
│       │  └─ else continue loop
│       │
│       └─ loop siguiente intervalo
│
└─ loop siguiente día

Si completa todos loops:
└─ RETORNAR null (no encontrado)
```

---

## Timeline Típica de Ejecución

```
t = 0ms   │ Usuario presiona "Nueva Cita"
          │
t = 5ms   │ setModalSourceType('new-button')
          │ setModalOpen(true)
          │
t = 10ms  │ Modal se monta
          │ useEffect se registra
          │
t = 15ms  │ useEffect se dispara (dependencies: isOpen, sourceType)
          │
t = 20ms  │ findNextAvailableSlot() comienza búsqueda
          │ │
          │ ├─ Loop día 0: itera 96 intervalos      ~5ms
          │ ├─ getBusinessHoursForDate               ~1ms
          │ ├─ Validaciones (dentro rango, pasado)  ~2ms
          │ ├─ occupied.has() checks                 ~1ms
          │
t = 50ms  │ Slot encontrado el día 0, intervalo 3 (09:00)
          │
t = 55ms  │ RETORNA {date: "2026-03-10", time: "09:00"}
          │
t = 60ms  │ setDate("2026-03-10")
          │ setTime("09:00")
          │ setIsAutoInitializing(true)
          │
t = 65ms  │ toast.success("Próximo horario: 2026-03-10 09:00")
          │
t = 70ms  │ Re-render Modal
          │ Campos visibles con valores
          │
t = 100ms │ Usuario ve modal completamente llenado
          │
```

**Total latency: ~100ms** ✅ Invisible al usuario

---

## Casos Especiales

### Caso 1: Hoy a las 17:30 (Tarde)
```
Entrada: sourceType='new-button', minDate='2026-03-10'
Búsqueda:
  Día 0 (2026-03-10):
    17:30 > 17:00 (fin horario) ❌
    17:45 > 17:00 ❌
    ...
    (Resto de día ocupado)
  
  Día 1 (2026-03-11):  
    09:00 ✅ ¡ENCONTRADO!
    
Resultado: {date: "2026-03-11", time: "09:00"}
```

### Caso 2: Clínica Cerrada Domingo
```
Entrada: sourceType='new-button', minDate='2026-03-08' (domingo)
Búsqueda:
  Día 0 (2026-03-08 - domingo):
    getBusinessHoursForDate() → [] ❌
  
  Día 1 (2026-03-09 - lunes):
    getBusinessHoursForDate() → [{start: '09:00', end: '18:00'}] ✅
    09:00 ✅ ¡ENCONTRADO!
    
Resultado: {date: "2026-03-09", time: "09:00"}
```

### Caso 3: Todo Ocupado en 30 Días
```
Entrada: sourceType='new-button', pero todas las citas llenas
Búsqueda:
  Día 0: todas ocupadas
  Día 1: todas ocupadas
  ...
  Día 29: todas ocupadas
  Fin del loop
  
Resultado: null
Toast: "No hay horarios disponibles en los próximos 30 días"
```

---

## Diagrama de Dependencies

```
grooming/page.tsx
  └── modalSourceType (state)
      │
      └── setModalSourceType
          ├── Botón "Nueva Cita" → 'new-button'
          ├── Click Calendario   → 'calendar'
          └── Close Modal        → 'calendar' (reset)
              │
              └── UnifiedGroomingModal
                  │
                  ├── Prop: sourceType
                  │   │
                  │   └── useEffect
                  │       │
                  │       ├── Dependencies:
                  │       │   ├─ isOpen
                  │       │   ├─ sourceType
                  │       │   ├─ config
                  │       │   ├─ appointments
                  │       │   ├─ clinicTimezone
                  │       │   └─ findNextAvailableSlot
                  │       │
                  │       └── Condition:
                  │           if (!isOpen || sourceType !== 'new-button')
                  │               return (SKIP)
                  │           else
                  │               → findNextAvailableSlot()
                  │
                  └── Internal Functions:
                      │
                      └── findNextAvailableSlot()
                          │
                          ├── Dependencies (useCallback):
                          │   ├─ minDate
                          │   ├─ config
                          │   ├─ clinicTimezone
                          │   └─ appointments
                          │
                          ├── Usa:
                          │   ├─ getBusinessHoursForDate()
                          │   ├─ getClinicDateKey()
                          │   ├─ utcToZonedTime()
                          │   └─ addMinutes()
                          │
                          └── Retorna:
                              {date, time} | null
```

---

## Casos de Testing

```
TEST 1: Nueva Cita
├─ Presiona botón
├─ Modal abre
├─ Verifica auto-fill ✓
└─ sourceType === 'new-button' ✓

TEST 2: Calendario
├─ Click en hora específica
├─ Modal abre
├─ Verifica USA esa hora ✓
└─ sourceType === 'calendar' ✓

TEST 3: Sin slots
├─ Crea muchas citas
├─ Presiona Nueva Cita
├─ Verifica error toast ✓
└─ Modal no auto-llena ✓

TEST 4: Timezone
├─ Cambia timezone clínica
├—Presiona Nueva Cita
├─ Verifica respeta horario ✓
└─ Verifica no en pasado ✓
```

