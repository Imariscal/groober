# 🔧 Implementación - Mejoras en Servicios (UI)

**Fecha:** 12 Marzo 2026  
**Archivo actualizado:** `src/components/CreateServiceModal.tsx`

---

## 📋 Cambios Realizados

### 1. **Nuevo Estado: `sizeDurations`**
```typescript
const [sizeDurations, setSizeDurations] = useState<Record<PetSize, number>>({
  'XS': 30,
  'S': 30,
  'M': 30,
  'L': 30,
  'XL': 30,
});
```
- Almacena duración independiente para cada tamaño de mascota
- Default: 30 minutos (igual al defaultDurationMinutes)
- Se sincroniza al cargar/editar servicios

---

### 2. **Cargar Duraciones al Editar Servicio**
**Donde:** Función `loadFormData()` en `useEffect`

Ahora carga:
- ✅ Precios por tamaño (ya existía)
- ✅ Duraciones por tamaño (NUEVO)

```typescript
if (p.duration_minutes) {
  durationMap[p.pet_size as PetSize] = p.duration_minutes;
}
```

**Fallback:** Si API no retorna duraciones, usa `defaultDurationMinutes`

---

### 3. **Nueva Sección UI: "Duraciones por Tamaño de Mascota"**

**Ubicación:** En sección "Precios", después de "Precios por Tamaño"  
**Visible:** Solo para servicios GROOMING

**Características:**
- Grid 2x3 con campos para XS, S, M, L, XL
- Inputs numéricos: min=5, max=480, step=5 minutos
- Botón "Copiar del general" para aplicar mismo valor a todos
- Help text explicativo

```
Extra Pequeño (XS)  |  30 min
Pequeño (S)         |  30 min
Mediano (M)         |  30 min
Grande (L)          |  30 min
Extra Grande (XL)   |  30 min

⚠️ "La duración varía según el tamaño de la mascota..."
```

---

### 4. **Guardar Duraciones por Tamaño**

**Donde:** Función `handleSubmit()` 

```typescript
const pricesToCreate = PET_SIZES
  .filter(size => sizePrices[size] > 0)
  .map(size => ({
    petSize: size,
    price: sizePrices[size],
    currency: 'MXN',
    durationMinutes: sizeDurations[size],  // 🆕 NUEVO
  }));
```

**Validaciones:**
- ✅ Try/catch para manejar si API no soporta aún `durationMinutes`
- ✅ Fallback: envía sin duraciones si falla
- ✅ Toast informativo si hay error

---

### 5. **Reset del formulario (Create mode)**
```typescript
setSizeDurations({
  'XS': 30,
  'S': 30,
  'M': 30,
  'L': 30,
  'XL': 30,
});
```
- Cuando creas un nuevo servicio, todos los tamaños inician en 30 min

---

## ⚙️ Validaciones Implementadas

```
✅ Duración mínima: 5 minutos
✅ Duración máxima: 480 minutos (8 horas)
✅ Step: 5 minutos (para evitar valores raros)
✅ Solo visible para categoría GROOMING
```

---

## 🔄 Flujo de Datos

### Crear Servicio
```
Usuario ingresa duración general (30 min)
              ↓
Hace clic en "Nuevo Servicio"
              ↓
Modal abre con duraciones = [30, 30, 30, 30, 30]
              ↓
Usuario modifica duraciones por tamaño (ej: XS=20, L=45)
              ↓
Presiona "Crear"
              ↓
Se envía a API con durationMinutes por cada tamaño
              ↓
Se guardan en ServiceSizePrice (cuando API lo soporta)
```

### Editar Servicio
```
Usuario clic en "Editar"
              ↓
Modal carga duraciones desde API
              ↓
Muestra duraciones actuales
              ↓
Usuario modifica valores
              ↓
Presiona "Actualizar"
              ↓
Se envían cambios
```

---

## 📦 Dependencias

```typescript
import { FiCopy } from 'react-icons/fi';  // Ya existía
```

**Si falta:** `npm install react-icons`

---

## 🚨 Notas Importantes

### ⚠️ API Enhancement Necesario
El campo `durationMinutes` en `ServiceSizePrice` aún **NO EXISTE** en la BD.

**Necesario:**
1. Extender entidad `ServiceSizePrice` con columna `duration_minutes`
2. Actualizar API `serviceSizePriceApi.ts` para aceptar `durationMinutes`
3. Migración de BD para agregar columna

**Temporal:** Por ahora, si API falla, se guarda solo el precio (sin error del usuario)

---

## ✨ Beneficios

| Mejora | Beneficio |
|--------|-----------|
| **Duraciones por tamaño** | Las citas grooming tendrán duración CORRECTA según mascota |
| **UI intuitiva** | Grid similar a precios, fácil de usar |
| **Fallback automático** | Sigue funcionando si DB no soporta aún |
| **Validaciones** | Min 5 min, Max 8 horas |
| **Copy button** | Rápido aplicar a todos |

---

## 🔍 Testing Sugerido

1. **Crear servicio grooming** con duraciones: XS=20, M=30, L=45
2. **Verificar** que se guardan en DB (cuando API esté lista)
3. **Editar servicio** y confirmar que carga duraciones guardadas
4. **En citas:** Crear cita con perro L → debería usar 45 minutos
5. **En citas:** Crear cita con perro XS → debería usar 20 minutos

---

## 📝 Código Modificado

- Lines 47-49: Nuevo estado `sizeDurations`
- Lines 77-97: Cargar duraciones al editar
- Lines 110-130: Reset duraciones en create mode
- Lines 397-441: Nueva sección UI "Duraciones por Tamaño"
- Lines 447-467: Guardar duraciones en handleSubmit

---

**Status:** ✅ **FRONTEND COMPLETADO**  
**Siguiente:** Extender API y BD para soportar `durationMinutes`
