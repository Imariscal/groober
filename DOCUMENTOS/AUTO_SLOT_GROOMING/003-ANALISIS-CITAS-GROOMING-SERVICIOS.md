# 📊 Análisis: Lógica de Citas Grooming con Servicios y Duraciones

**Fecha:** 12 Marzo 2026

---

## 🔄 Flujo Actual (Hipotético)

```
Usuario abre modal crear cita grooming
        ↓
1. Selecciona MASCOTA (ej: "Perro - Tamaño L")
        ↓
2. Selecciona SERVICIOS (ej: Baño, Corte, Uñas)
        ↓
3. Sistema CALCULA DURACIÓN (¿Cómo? ¿De dónde?)
        ↓
4. Usuario selecciona FECHA/HORA
        ↓
5. Usuario ve DURACIÓN (¿fija? ¿editable?)
        ↓
6. Usuario GUARDA cita
```

---

## ⚠️ Problemas Identificados

### **1. Falta Claridad en Cálculo de Duración**
- **Pregunta:** ¿De dónde saca la duración?
  - ¿Del `defaultDurationMinutes` del servicio?
  - ¿De los `serviceSizePrices.durationMinutes` (recién agregado)?
  - ¿Suma de todos los servicios?
- **Estado:** Ambiguo, probablemente usa valor genérico

### **2. Inconsistencia Servicios ↔ Duraciones**
**Escenario:**
```
Servicio "Baño": 
  - Duración general: 30 min
  - Duración L: 45 min (nuevo)

Usuario selecciona mascota L + Servicio Baño
  → ¿Usa 30 o 45 minutos?
```

**Actual:** Probablemente usa 30 (generic)  
**Debería:** Usar 45 (size-specific)

### **3. Duración Manual vs Automática**
- **Pregunta:** ¿Qué pasa si usuario cambia la duración manualmente?
  - ¿Se guarda la custom?
  - ¿Sobre-escribe la calculada?
  - ¿Hay validación mín/máx?

### **4. Cambios Dinámicos en Modal**
**Escenario:**
```
Usuario selecciona servicios → duración = 45 min
Usuario AGREGA otro servicio → ¿Se recalcula?
Usuario QUITA servicio → ¿Se recalcula?
Usuario CAMBIA mascota → ¿Se recalcula?
```

**Estado:** Probablemente NO recalcula

---

## ⏱️ Tiempos Estándar de Grooming por Industria

Basados en prácticas reales de peluquerías caninas profesionales:

### **Tabla de Duraciones por Servicio y Tamaño de Mascota**

| Servicio | XS | S | M | L | XL |
|----------|----|----|----|----|-----|
| **Uñas** | 5 min | 8 min | 10 min | 12 min | 15 min |
| **Baño** | 15 min | 20 min | 30 min | 40 min | 50 min |
| **Corte** | 30 min | 40 min | 50 min | 60 min | 90 min |
| **Baño Anti-garrapatas** | 20 min | 25 min | 35 min | 45 min | 60 min |
| **Secado** | 10 min | 15 min | 20 min | 30 min | 45 min |

### **Reglas de Combos (Tiempo Optimizado)**

- **Baño + Corte:** Reducción de 10 min (eficiencia de workflow)
- **Baño + Secado:** Secado incluido en tiempo de baño
- **Baño Anti-garrapatas:** Es un servicio completo (incluye baño + tratamiento especial)
- **Servicios adicionales:** Se suman al total (ej: Uñas + Antiparásitos se suman)

### **Ejemplos de Duraciones Realistas**

**Ejemplo 1: Perro Pequeño (S) - Combo Básico**
```
Servicios: Baño + Corte + Uñas
Cálculo: 20 + 40 + 8 = 68 min
Combo reduce 10 min → TOTAL: 58 min
```

**Ejemplo 2: Perro Grande (L) - Combo Completa**
```
Servicios: Baño + Corte + Uñas + Anti-garrapatas
Cálculo: 40 + 60 + 12 + 45 = 157 min ≈ 2.6 horas
Combo reduce 10 min → TOTAL: 147 min ≈ 2.45 horas
```

**Ejemplo 3: Gato Extra Small (XS) - Mantenimiento**
```
Servicios: Baño + Uñas
Cálculo: 15 + 5 = 20 min
TOTAL: 20 min
```

---

## 🎯 Propuesta de Mejora

### **OPCIÓN A: Automático con Override Manual (RECOMENDADO)**

```
┌─────────────────────────────────────────┐
│ Modal Crear Cita Grooming               │
├─────────────────────────────────────────┤
│                                         │
│  Mascota: [Perro Luna - Tamaño L] ✓     │
│                                         │
│  Servicios:                             │
│  ☑ Baño (duración L: 40 min)           │
│  ☑ Corte (duración L: 60 min)          │
│  ☑ Uñas (duración L: 12 min)           │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ 📊 Duración Calculada            │  │
│  │                                  │  │
│  │ Baño:        40 min              │  │
│  │ Corte:       60 min              │  │
│  │ Uñas:        12 min              │  │
│  │ ─────────────────────            │  │
│  │ Subtotal:   112 min              │  │
│  │ Combo (reduce) -10 min           │  │
│  │ TOTAL:      102 minutos (1.7h)  │  │
│  │                                  │  │
│  │ [i] Basado en tamaño L           │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Duración Final:                        │
│  [ 102 ] minutos          [✏️ Editar]  │
│                                         │
│  Nota: Puedes ajustar si es necesario  │
│                                         │
│  Fecha: [20/03/2026] Hora: [14:00]    │
│                                         │
│  [Cancelar]  [Crear Cita]              │
└─────────────────────────────────────────┘
```

**Lógica:**
1. ✅ Selecciona mascota → obtiene `pet.size`
2. ✅ Selecciona servicios → obtiene lista de servicios
3. ✅ **AUTO-CALCULA:**
   - Para cada servicio: busca `serviceSizePrices[pet.size].durationMinutes`
   - Fallback: usa `service.defaultDurationMinutes`
   - Suma todos: `totalDuration = sum(servicios)`
4. ✅ Muestra desglose visual
5. ✅ Usuario puede EDITAR manualmente (override)
6. ✅ Al guardar: usa duración final (calculada o editada)

---

### **OPCIÓN B: Dos Campos (Calculada + Manual)**

```
Duración Sugerida:  [100 min] (no editable, solo info)
Duración Final:     [100 min] (editable, valor a guardar)
```

**Ventaja:** Claro qué es calculado vs manual  
**Desventaja:** Más campos, menos limpio

---

### **OPCIÓN C: Toggle "Usar Duración Calculada"**

```
☑ Usar duración automática por servicios
  Duración calculada: 100 min

☐ Usar duración personalizada:
  Duración: [ 120 ] min
```

**Ventaja:** Explícito si es automático o manual  
**Desventaja:** Complicado para usuario promedio

---

## 💡 Implementación Recomendada (OPCIÓN A)

### **Paso 1: Estructura de Datos**

```typescript
interface GroomingAppointmentForm {
  petId: string;
  serviceIds: string[];  // [baño, corte, uñas]
  
  // Duraciones
  calculatedDuration: number;  // Calculado auto (con combos aplicados)
  finalDuration: number;       // Usuario puede editar
  durationEdited: boolean;     // Flag: ¿usuario modificó?
  
  // Para tracking
  serviceBreakdown: Record<string, number>;  // Desglose individual
  comboReduction: number;      // Minutos reducidos por combos
  
  scheduledAt: Date;
  durationMinutes: number;  // = finalDuration
}
```

### **Paso 2: Funciones de Cálculo**

```typescript
// Calcular duración basada en servicios + tamaño mascota
async function calculateDurationFromServices(
  petId: string,
  serviceIds: string[]
): Promise<{ 
  calculated: number; 
  breakdown: Record<string, number>;
  comboReduction: number;
}> {
  
  const pet = await getPet(petId);
  const petSize = pet.size || 'M'; // XS, S, M, L, XL (default M)
  
  let total = 0;
  const breakdown: Record<string, number> = {};
  
  for (const serviceId of serviceIds) {
    const service = await getService(serviceId);
    
    // 1. Buscar duración size-specific en serviceSizePrices
    let duration = await getServiceSizeDuration(
      serviceId, 
      petSize
    );
    
    // 2. Fallback a duración general si no existe size-specific
    if (!duration) {
      duration = service.defaultDurationMinutes || 30;
    }
    
    breakdown[service.name] = duration;
    total += duration;
  }
  
  // 3. Aplicar reducciones por combos
  let comboReduction = 0;
  const serviceNames = Object.keys(breakdown);
  
  // Regla: Si hay Baño + Corte juntos, reduce 10 min
  if (serviceNames.includes('Baño') && serviceNames.includes('Corte')) {
    comboReduction = 10;
  }
  
  const finalCalculated = total - comboReduction;
  
  return { 
    calculated: finalCalculated, 
    breakdown, 
    comboReduction 
  };
}
```

### **Paso 3: UI - Mostrar Desglose**

```typescript
// Cuando usuario selecciona servicios
const onServicesChange = async (serviceIds: string[]) => {
  const { calculated, breakdown } = await calculateDurationFromServices(
    petId, 
    serviceIds
  );
  
  setForm({
    ...form,
    serviceIds,
    calculatedDuration: calculated,
    finalDuration: calculated,  // Reset a lo calculado
    durationEdited: false,
  });
  
  // Mostrar breakdown en UI
  setDurationBreakdown(breakdown);
};
```

### **Paso 4: UI - Permitir Edit Manual**

```typescript
const onDurationChange = (newDuration: number) => {
  setForm({
    ...form,
    finalDuration: newDuration,
    durationEdited: newDuration !== calculatedDuration,
  });
};

// Validación
const isDurationValid = (duration: number) => {
  return duration >= 5 && duration <= 480;
};
```

### **Paso 5: Al Guardar Cita**

```typescript
// En appointments.service.ts
const appointmentData = {
  ...  
  durationMinutes: form.finalDuration,  // Usa finalDuration
  serviceIds: form.serviceIds,
  // 📌 Metadatos (opcional, para debugging):
  metadata: {
    durationCalculated: form.calculatedDuration,
    durationManual: form.finalDuration,
    wasEdited: form.durationEdited,
  }
};
```

---

## 📐 Flujo Completo Mejorado

```
┌─ Abrir modal crear cita
│
├─ Seleccionar MASCOTA (Luna, Tamaño L)
│  └─ Obtener pet.size = 'L'
│
├─ Seleccionar SERVICIOS (Baño, Corte, Uñas)
│  └─ Para cada servicio:
│     ├─ Buscar serviceSizePrices['L'].durationMinutes
│     ├─ Baño: 40 min
│     ├─ Corte: 60 min
│     └─ Uñas: 12 min
│  └─ Calcular: 40 + 60 + 12 = 112 min
│  └─ Aplicar reducción combo: 112 - 10 = 102 min
│  └─ Mostrar DESGLOSE VISUAL
│
├─ Usuario ve "Duración Calculada: 102 min"
│  └─ Opción A: hace clic en [✏️ Editar]
│  └─ Opción B: mantiene 102 min
│
├─ Seleccionar FECHA/HORA
│  └─ Sistema VALIDA que hay 100 min disponibles en slot
│
├─ Guardar cita
│  ├─ durationMinutes = 102 min (o valor editado)
│  └─ appointmentItems vinculados a servicios
│
└─ Cita creada ✅
   └─ En calendario ocupa 102 minutos (1h 42min)
```

---

## ✅ Validaciones Necesarias

```
1. Duración mínima: 5 minutos
2. Duración máxima: 480 minutos (8 horas)
3. Si mascota sin tamaño → usar tamaño default (M)
4. Si servicio sin duración → usar 30 min default
5. Si usuario edita duración:
   - Validar mín/máx
   - Advertencia si es muy diferente de calculada
6. Si no hay servicios seleccionados:
   - Duración default = 30 min
```

---

## 🎨 UI Visual Mejorada

### Elemento: "Duración Calculada"

```javascript
<div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
  <div className="flex items-center gap-2 mb-3">
    <Clock className="w-4 h-4 text-blue-600" />
    <h3 className="font-semibold text-gray-900">Duración Calculada</h3>
  </div>
  
  {/* Desglose */}
  <div className="space-y-1 text-sm mb-3">
    {breakdown.map(item => (
      <div className="flex justify-between" key={item.id}>
        <span className="text-gray-600">{item.name}</span>
        <span className="font-medium">{item.duration} min</span>
      </div>
    ))}
    <div className="border-t pt-2 font-bold flex justify-between">
      <span>TOTAL</span>
      <span className="text-blue-600">{total} min</span>
    </div>
  </div>
  
  <p className="text-xs text-gray-500">
    ℹ️ Estimado según servicios y tamaño {petSize}
  </p>
</div>

{/* Campo editable */}
<div className="mt-3">
  <label className="block text-sm font-medium mb-1">
    Duración Final (minutos)
  </label>
  <div className="flex gap-2">
    <input 
      type="number"
      value={finalDuration}
      onChange={handleDurationChange}
      min="5"
      max="480"
      step="5"
      className="flex-1 px-3 py-2 border rounded"
    />
    {durationEdited && (
      <button
        onClick={() => resetDuration()}
        className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
      >
        Resetear
      </button>
    )}
  </div>
</div>
```

---

## 🔍 Casos de Uso Mejorados

### **Caso 1: Usuario típico**
```
Selecciona: Perro L + [Baño, Corte, Uñas]
Sistema calcula: 40 + 60 + 12 = 112 min
Se aplica combo (reduce 10): 102 min final
Usuario: Presiona "Crear" sin cambiar
Resultado: ✅ Cita 102 min (1h 42min) guardada
```

### **Caso 2: Usuario quiere duración diferente**
```
Selecciona: Perro L + [Baño, Corte, Uñas]
Sistema calcula: 102 min
Usuario: Cambia a 120 min (agrega time buffer o extra)
Resultado: ✅ Cita 120 min (2h) guardada
```

### **Caso 3: Usuario cambia servicios**
```
Selecciona: Perro L + [Baño]
Sistema calcula: 40 min
Usuario: Agrega [Corte]
Sistema RECALCULA: 40 + 60 = 100 min, combo reduce -10 = 90 min
Usuario ve: "Duración actualizada: 90 min (1h 30min)"
Resultado: ✅ Refleja cambios dinámicos
```

### **Caso 4: Mascota sin tamaño definido**
```
Selecciona: Perro (?sin tamaño?) + [Baño]
Sistema: Toma tamaño default (M)
Busca duración M: 30 min
Usuario: Puede verificar y ajustar
Resultado: ⚠️ Aviso "Mascota sin tamaño, usando MEDIUM como default"
```

---

## 🚀 Plan de Implementación

### **Fase 1: Backend** (Ya parcialmente hecho)
- ✅ Service duración en `defaultDurationMinutes`
- ⏳ ServiceSizePrice con `durationMinutes`
- ⏳ API endpoint para calcular duración: `POST /appointments/calculate-duration`

### **Fase 2: Frontend**
- ⏳ Función `calculateDurationFromServices()`
- ⏳ UI: Mostrar desglose de duraciones
- ⏳ Input editable con validaciones
- ⏳ Recalcular dinámico al cambiar servicios

### **Fase 3: Validación**
- ⏳ En calendar: verificar slot tiene espacio para duración
- ⏳ Warning si user edita mucho diferente a calculada
- ⏳ Min/max validations

---

## ✨ Beneficios de esta Mejora

| Beneficio | Impacto |
|-----------|---------|
| **Duración correcta automática** | Menos errores, menos sobretiempos |
| **Transparencia visual** | Usuario ve por qué 100 min |
| **Flexibilidad manual** | Casos especiales permitidos |
| **Recálculo dinámico** | Cambios reflejados al instante |
| **Escalable** | Funciona con cualquier # de servicios |
| **UX mejorada** | Claro y predecible |

---

## 🎨 ANÁLISIS UX/UI - MEJORAS AL MODAL

### **Problemas Actuales (Basados en Screenshots)**

1. ❌ **Dropdown manual de duración (30 min, 45 min, 1 hora, etc.)**
   - Usuario debe seleccionar manualmente
   - No refleja servicios seleccionados
   - Genera inconsistencias

2. ❌ **Sin desglose de servicios**
   - Usuario no ve cuánto tiempo ocupa cada servicio
   - No hay transparencia

3. ❌ **Sin cálculo automático**
   - Si elige Baño (20 min) debería mostrar automáticamente 30 min
   - Si elige Baño + Corte no se recalcula

### **Solución UX/UI Propuesta**

```
┌──────────────────────────────────────────┐
│ Nueva Cita de Grooming                   │
├──────────────────────────────────────────┤
│                                          │
│ Servicios Seleccionados:                 │
│ ☑ Baño pequeño (20 min)                 │
│ ☑ Corte (40 min)                        │
│ ☑ Uñas (8 min)                          │
│                                          │
│ ┌──────────────────────────────────────┐│
│ │ 📊 DURACIÓN CALCULADA               ││
│ │                                      ││
│ │ Baño pequeño:      20 min            ││
│ │ Corte:             40 min            ││
│ │ Uñas:              8 min             ││
│ │ Subtotal:          68 min            ││
│ │ Combo (Baño+Corte) : -10 min        ││
│ │ ─────────────────────────────        ││
│ │ DURACIÓN REDONDEADA: 1 hora (60 min)││  ← AUTOMÁTICO
│ │                                      ││
│ │ [i] Se redondea a slot más cerca     ││
│ └──────────────────────────────────────┘│
│                                          │
│ Fecha: [03/12/2026] Hora: [13:30]       │
│                                          │
│ [Cancelar]  [Crear Cita]                │
└──────────────────────────────────────────┘
```

**Cambios UX/UI:**
- ✅ **OCULTAR** dropdown de duración manual
- ✅ **MOSTRAR** desglose de servicios con tiempos
- ✅ **MOSTRAR** duración redondeada automáticamente
- ✅ **EXPLICAR** "Se redondea a slot más cercano"
- ✅ **PERMITIR** override manual si es necesario (botón pequeño "Personalizar")

---

## 🏗️ ARQUITECTURA DE SOFTWARE - CÁLCULO AUTOMÁTICO

### **Algoritmo: Redondeamiento a Slots Estándar**

**Slots disponibles (en minutos):**
```
30, 45, 60, 75, 90, 105, 120, 135, 150, ...
(incrementos de 15 min después de 45)

Patrón: 
  [30, 45] → saltos de 15
  [60+]   → saltos de 15 (60, 75, 90, 105, 120...)
```

**Ejemplos de redondeamiento:**
```
20 min   → REDONDEA A 30 min   (más cercano)
45 min   → SE QUEDA EN 45 min  (es un slot)
55 min   → REDONDEA A 60 min   (1 hora)
68 min   → REDONDEA A 75 min   (1h 15min)
102 min  → REDONDEA A 105 min  (1h 45min)
110 min  → REDONDEA A 120 min  (2 horas)
150 min  → SE QUEDA EN 150 min (2h 30min)
```

### **Función de Redondeamiento**

```typescript
// Slots disponibles
const DURATION_SLOTS = [30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 240, 300, 360, 420, 480];

// Función que redondea a slot más cercano
function roundToNearestSlot(minutes: number): number {
  
  // Si es menos de 30, min es 30
  if (minutes < 30) return 30;
  
  // Si es más de 480 (8 horas), max es 480
  if (minutes > 480) return 480;
  
  // Buscar el slot más cercano
  let closestSlot = DURATION_SLOTS[0];
  let minDifference = Math.abs(minutes - closestSlot);
  
  for (const slot of DURATION_SLOTS) {
    const difference = Math.abs(minutes - slot);
    
    // Preferir redondear ARRIBA si la diferencia es igual
    if (difference < minDifference || 
        (difference === minDifference && slot > closestSlot)) {
      closestSlot = slot;
      minDifference = difference;
    }
  }
  
  return closestSlot;
}

// EJEMPLOS DE USO:
console.log(roundToNearestSlot(20));   // 30
console.log(roundToNearestSlot(45));   // 45
console.log(roundToNearestSlot(55));   // 60
console.log(roundToNearestSlot(68));   // 75
console.log(roundToNearestSlot(102));  // 105
console.log(roundToNearestSlot(110));  // 120
```

### **Flujo Completo de Cálculo**

```
1. Usuario selecciona SERVICIOS
        ↓
2. Sistema busca duración de cada servicio
   Baño pequeño → 20 min
   Corte       → 40 min
   Uñas        → 8 min
        ↓
3. Sistema SUMA duraciones: 20 + 40 + 8 = 68 min
        ↓
4. Sistema aplica COMBOS: 68 - 10 (Baño+Corte) = 58 min
        ↓
5. Sistema REDONDEA A SLOT: 
   58 min → slot más cercano → 60 min (1 hora) ✅
        ↓
6. Muestra en UI: "Duración: 1 hora (60 min)"
        ↓
7. Usuario puede [Personalizar] si lo necesita
  (pero por defecto se usa 60 min)
```

### **Función Completa de Cálculo**

```typescript
interface DurationCalculation {
  servicesTotal: number;      // Suma bruta de servicios
  comboReduction: number;     // Minutos reducidos por combos
  calculatedDuration: number; // Después de combos
  roundedDuration: number;    // Redondeado a slot
  breakdown: {
    serviceName: string;
    duration: number;
  }[];
}

async function calculateGroomingDuration(
  petId: string,
  serviceIds: string[]
): Promise<DurationCalculation> {
  
  // 1. Obtener mascota y servicios
  const pet = await getPet(petId);
  const petSize = pet.size || 'M';
  const services = await getServices(serviceIds);
  
  // 2. Calcular duración de cada servicio
  let servicesTotal = 0;
  const breakdown: any[] = [];
  
  for (const service of services) {
    // Buscar duración size-specific
    let duration = await getServiceDurationBySize(
      service.id, 
      petSize
    );
    
    // Fallback
    if (!duration) {
      duration = service.defaultDurationMinutes || 30;
    }
    
    breakdown.push({
      serviceName: service.name,
      duration: duration
    });
    
    servicesTotal += duration;
  }
  
  // 3. Aplicar reducciones por combos
  let comboReduction = 0;
  const serviceNames = breakdown.map(b => b.serviceName);
  
  // Regla: Baño + Corte juntos = -10 min
  if (serviceNames.includes('Baño') && serviceNames.includes('Corte')) {
    comboReduction = 10;
  }
  
  const calculatedDuration = servicesTotal - comboReduction;
  
  // 4. Redondear a slot
  const roundedDuration = roundToNearestSlot(calculatedDuration);
  
  // 5. Retornar resultado
  return {
    servicesTotal,
    comboReduction,
    calculatedDuration,
    roundedDuration,
    breakdown
  };
}
```

### **Ejemplo Real con la Función**

```typescript
// Datos de entrada:
const petId = "perro-1";
const serviceIds = ["bano-pequeno", "corte", "unas"];

// Ejecución:
const result = await calculateGroomingDuration(petId, serviceIds);

// Resultado:
{
  servicesTotal: 68,           // 20 + 40 + 8
  comboReduction: 10,          // Baño + Corte
  calculatedDuration: 58,      // 68 - 10
  roundedDuration: 60,         // Redondeo de 58 → 60 (1 hora)
  breakdown: [
    { serviceName: "Baño pequeño", duration: 20 },
    { serviceName: "Corte", duration: 40 },
    { serviceName: "Uñas", duration: 8 }
  ]
}

// En UI se muestra:
// Baño pequeño:   20 min
// Corte:          40 min
// Uñas:           8 min
// Subtotal:       68 min
// Combo:          -10 min
// ─────────────────────
// TOTAL:          60 min (1 HORA) ✅
```

---

## 📱 Componentes a Modificar

### **1. CreateGroomingAppointmentModal.tsx**

**Cambios:**
- ✅ Ocultar dropdown de duración manual
- ✅ Agregar componente "DurationCalculation" que muestre desglose
- ✅ Llamar a `calculateGroomingDuration()` cada vez que cambien servicios
- ✅ Mostrar duración redondeada automáticamente
- ✅ Botón "Personalizar" opcional para override

**Pseudocódigo:**
```typescript
function CreateGroomingAppointmentModal() {
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [durationInfo, setDurationInfo] = useState<DurationCalculation | null>(null);
  const [finalDuration, setFinalDuration] = useState(0);
  const [isPersonalized, setIsPersonalized] = useState(false);
  
  // Al cambiar servicios, recalcular duración
  useEffect(() => {
    if (selectedServiceIds.length > 0) {
      calculateGroomingDuration(petId, selectedServiceIds)
        .then(result => {
          setDurationInfo(result);
          setFinalDuration(result.roundedDuration);
          setIsPersonalized(false);
        });
    }
  }, [selectedServiceIds, petId]);
  
  return (
    <>
      {/* Servicios ... */}
      
      {/* MOSTRAR DESGLOSE */}
      {durationInfo && (
        <DurationBreakdownCard durationInfo={durationInfo} />
      )}
      
      {/* MOSTRAR DURACIÓN REDONDEADA */}
      <div className="bg-blue-50 p-4 rounded">
        <p className="font-semibold">Duración: {finalDuration} minutos</p>
        <p className="text-sm text-gray-600">
          {formatMinutesToHuman(finalDuration)}
        </p>
        {isPersonalized && (
          <button onClick={() => setIsPersonalized(false)}>
            Usar cálculo automático
          </button>
        )}
        {!isPersonalized && (
          <button onClick={() => setIsPersonalized(true)}>
            Personalizar
          </button>
        )}
      </div>
      
      {/* OPCIÓN PERSONALIZAR (hidden por defecto) */}
      {isPersonalized && (
        <input 
          type="number"
          value={finalDuration}
          onChange={(e) => setFinalDuration(Number(e.target.value))}
        />
      )}
    </>
  );
}
```

### **2. appointments.service.ts (Backend)**

**Cambios:**
- ✅ Agregar función `calculateDurationFromServices()`
- ✅ Agregar función `roundToNearestSlot()`
- ✅ En `create()`: usar duración redondeada automáticamente
- ✅ En `updateServices()`: recalcular automáticamente

---

## 🔄 Comparativa: ANTES vs DESPUÉS

### **ANTES (Actual)**
```
Usuario: Selecciona servicios
Sistema: ??? (no se sabe qué pasa)
Usuario: Ve dropdown con opciones (30, 45, 60, 1h, 1h30, 2h)
Usuario: Selecciona manualmente 1 hora
Resultado: Cita con 1 hora, SIN SABER por qué
Riesgo: Puede elegir mal (30 min cuando necesita 1h)
```

### **DESPUÉS (Propuesto)**
```
Usuario: Selecciona servicios (Baño 20, Corte 40, Uñas 8)
Sistema: Calcula automáticamente:
  20 + 40 + 8 = 68 min
  Combo Baño+Corte: -10 min
  = 58 min
  Redondea a: 60 min (1 HORA)
Usuario: Ve desglose claro:
  └─ Baño pequeño: 20 min
  └─ Corte: 40 min
  └─ Uñas: 8 min
  └─ TOTAL: 60 min (1 HORA)
Resultado: Cita con 1 hora, usuario ENTIENDE por qué
Seguridad: Duración siempre correcta, sin errores manuales
```

---

## ✅ Validaciones Necesarias

```
1. Validar rango: 30 ≤ duración ≤ 480 minutos
2. Si mascota sin tamaño → usar DEFAULT 'M'
3. Si servicio sin duración → usar DEFAULT 30 min
4. Si no hay servicios → duración DEFAULT 30 min
5. Si usuario personaliza → guardar flag "isPersonalized"
6. Al cambiar servicios → SIEMPRE recalcular automático
```

---

## 📝 Próximos Pasos

1. ✅ Confirmar estructura de datos y slots
2. ⏳ Implementar `calculateGroomingDuration()` + `roundToNearestSlot()`
3. ⏳ Actualizar CreateGroomingAppointmentModal.tsx
4. ⏳ Crear componente DurationBreakdownCard
5. ⏳ Testing con múltiples combinaciones
6. ⏳ Validación en calendar/scheduler

