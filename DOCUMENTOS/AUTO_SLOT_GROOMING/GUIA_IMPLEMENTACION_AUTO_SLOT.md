# 📖 Guía de Implementación: Auto-Slot para "Nueva Cita"

## ✅ Resumen de Cambios

Se han realizado cambios en **2 archivos** para implementar la funcionalidad de auto-búsqueda del próximo slot disponible cuando se presiona el botón "Nueva Cita":

| Archivo | Cambios |
|---------|---------|
| `UnifiedGroomingModal.tsx` | +1 prop, +1 función async, +1 useEffect |
| `grooming/page.tsx` | +1 state, 3 handlers actualizados |

---

## 🔧 Detalles Técnicos

### 1. **New Prop** en `UnifiedGroomingModalProps`

```typescript
sourceType?: 'calendar' | 'new-button'
```

**Valores:**
- `'calendar'` (default): El modal se abre desde un click en el calendario
- `'new-button'`: El modal se abre desde el botón "Nueva Cita"

### 2. **Nueva Función** `findNextAvailableSlot()`

**Ubicación:** `UnifiedGroomingModal.tsx` (línea ~130)

**Comportamiento:**
```
Entrada: void
Salida: { date: string; time: string } | null

Lógica:
1. Itera desde hoy hasta 30 días adelante
2. Para cada día:
   a. Verifica que clínica esté abierta
   b. Para cada intervalo de 15 minutos:
      - Verifica dentro de horario hábil
      - Si es hoy: verifica no esté en el pasado
      - Verifica no esté ocupado
      - Si cumple → RETORNA este slot
3. Si no encuentra en 30 días → RETORNA null
```

**Validaciones:**
✅ Clínica abierta (via `getBusinessHoursForDate()`)  
✅ Dentro de horario de negocio (start time - end time)  
✅ No ocupado por otra cita CLINIC  
✅ No en el pasado (si es hoy)  
✅ Intervalo de 15 minutos  

### 3. **Nuevo useEffect** para Auto-Llenado

**Ubicación:** `UnifiedGroomingModal.tsx` (línea ~290)

**Se dispara cuando:**
- `isOpen === true` ✅ Modal está abierto
- `sourceType === 'new-button'` ✅ Viene del botón

**Qué hace:**
```typescript
if (isOpen && sourceType === 'new-button') {
  const nextSlot = await findNextAvailableSlot()
  if (nextSlot) {
    setDate(nextSlot.date)
    setTime(nextSlot.time)
    toast.success(`📅 Próximo horario: ${nextSlot.date}...`)
  }
}
```

---

## 🎯 Cambios en `grooming/page.tsx`

### Estado Nuevo
```typescript
const [modalSourceType, setModalSourceType] = useState<'calendar' | 'new-button'>('calendar');
```

### Botón "Nueva Cita" (línea ~376)
```typescript
<button onClick={() => {
  // ... validación ...
  setSelectedSlot(today);
  setModalSourceType('new-button');  // ← NUEVO
  setModalOpen(true);
}}>
  Nueva Cita
</button>
```

### Clicks en Calendario (línea ~244, ~266)
```typescript
// handleDateClick
setModalSourceType('calendar');  // ← NUEVO

// handleSelectSlot  
setModalSourceType('calendar');  // ← NUEVO
```

### Cerrar Modal (línea ~273)
```typescript
const handleModalClose = () => {
  setModalOpen(false);
  setSelectedSlot(null);
  setModalSourceType('calendar');  // ← Reset
};
```

### Pasar Prop al Modal (línea ~461)
```typescript
<UnifiedGroomingModal
  // ... otras props ...
  sourceType={modalSourceType}  // ← NUEVO
/>
```

---

## 🧪 Testing Manual

### Test 1: Auto-Llenado desde "Nueva Cita"
```
1. Abre página /clinic/grooming
2. Presiona botón "Nueva Cita"
3. Espera que modal abra
4. Verifica que:
   ✓ Fecha se llena automáticamente
   ✓ Hora se llena automáticamente
   ✓ Toast muestra "Próximo horario: YYYY-MM-DD HH:MM"
5. Verifica que sea un slot hábil:
   - Dentro de horario de negocio
   - No en el pasado (si es hoy)
   - No ocupado por otra cita
```

### Test 2: Click en Calendario
```
1. Cambia vista a "Semana" o "Día"
2. Click en una hora específica (ej: 14:30)
3. Modal abre
4. Verifica que:
   ✓ Fecha = día clicado
   ✓ Hora = hora clicada (NO se auto-busca)
   ✓ NO hay toast de "Próximo horario"
```

### Test 3: Sin slots disponibles
```
1. Crear muchas citas para día de hoy
2. Presionar "Nueva Cita" después de las 17:00
3. Verifica que:
   ✓ Si no hay slot en 30 días → Toast error
   ✓ Modal no auto-llena fecha/hora
```

### Test 4: Diferentes días hábiles
```
1. Verificar clínica cerrada un día (ej: domingo)
2. Presionar "Nueva Cita" el sábado tarde
3. Verifica que:
   ✓ Salta clínica cerrada
   ✓ Auto-llena con primer h á bil (lunes)
```

---

## 📊 Flujo de Estados

```
USUARIO ABRE PÁGINA
  └─ modalSourceType = 'calendar'

USUARIO PRESIONA "Nueva Cita"
  ├─ modalSourceType = 'new-button'
  ├─ modalOpen = true
  └─ useEffect se dispara:
     ├─ Llama findNextAvailableSlot()
     ├─ Busca desde hoy hasta 30 días
     └─ Si encuentra:
        ├─ setDate(slot.date)
        ├─ setTime(slot.time)  
        └─ toast.success()

USUARIO HACE CLICK EN CALENDARIO
  ├─ modalSourceType = 'calendar'
  ├─ modalOpen = true
  └─ useEffect NO se dispara
     (porque sourceType !== 'new-button')

USUARIO CIERRA MODAL
  ├─ modalSourceType = 'calendar' (reset)
  ├─ modalOpen = false
  └─ Ready para siguiente uso
```

---

## 🐛 Debugging

### Logs que verás en consola:

```javascript
// Cuando se abre desde "Nueva Cita"
🚀 Inicializando búsqueda de próximo slot (sourceType=new-button)...

// Cuando busca slots
🔍 Buscando próximo slot disponible...

// Cuando encuentra
✅ Slot disponible encontrado: 2026-03-10 09:00

// Cuando no encuentra
⚠️ No se encontró slot disponible en los próximos 30 días

// Por cada día que evalúa
⏱️ 2026-03-10: Clínica cerrada
```

### Verificar en DevTools:

```javascript
// En consola, cuando abre modal:
// Busca logs que comiencen con 🔍, ✅, ⚠️

// Puedes monitores state:
// React DevTools → Profiler → busca setDate, setTime
```

---

## ⚠️ Puntos Importantes

### 1. **sourceType es Optional**
```typescript
sourceType = 'calendar'  // Default si no se proporciona
```

### 2. **Auto-init Flag**
```typescript
// Durante la búsqueda, se establece:
setIsAutoInitializing(true)

// Esto previene validaciones prematuras mientras se busca
```

### 3. **Dependencies del useEffect**
```typescript
[isOpen, sourceType, config, appointments, 
 clinicTimezone, findNextAvailableSlot]
```

Cualquier cambio en estos triggera una re-búsqueda.

### 4. **Toast Notifications**
- ✅ Éxito: "Próximo horario disponible: ..."
- ❌ Error: "No hay horarios disponibles ..."

---

## 🔍 Diferencias: "Nueva Cita" vs Click Calendario

| Aspecto | Nueva Cita | Click Calendario |
|---------|-----------|------------------|
| **sourceType** | 'new-button' | 'calendar' |
| **Busca slot** | SÍ 🔍 | NO |
| **Auto-llena fecha** | SÍ (encontrado) | NO (usa click) |
| **Auto-llena hora** | SÍ (encontrado) | NO (usa click) |
| **Validación** | Al buscar | No aplica |
| **Toast** | SÍ | NO |

---

## 🚀 Próximos Pasos (Cuando esté ready)

1. ✅ Implementar código (HECHO)
2. ⏳ Testing manual
3. ⏳ Ajustes basados en feedback
4. ⏳ Deploy a producción

---

## 📋 Checklist de Verificación

- [ ] `sourceType` prop agregado correctamente
- [ ] `findNextAvailableSlot()` busca días correclamente
- [ ] useEffect auto-fill se dispara correctamente
- [ ] Estado `modalSourceType` se actualiza
- [ ] Botón "Nueva Cita" establece 'new-button'
- [ ] Click calendario establece 'calendar'
- [ ] Modal cierra y reseta estado
- [ ] Toast notifications funcionan
- [ ] Logs en consola correctos
- [ ] TypeScript sin errores
- [ ] Build compila sin errores
- [ ] Testing manual pasa

---

## 📞 Si hay Problemas

### Problema: Modal abre pero NO auto-llena
**Verificar:**
- ¿Es `sourceType='new-button'`? (Revisar en React DevTools)
- ¿Hay logs de "Buscando próximo slot"?
- ¿Retorna null `findNextAvailableSlot()`?

### Problema: Auto-llena incluso desde calendario
**Verificar:**
- ¿Click calendario está estableciendo `sourceType='calendar'`?
- ¿useEffect tiene condición `sourceType !== 'new-button'`?

### Problema: TypeScript errors
**Solución:**
```bash
cd vibralive-frontend
npm run build
```

Si persisten:
- Limpiar node_modules y reinstalar
- Verificar tipos en `grooming-validation.ts`

