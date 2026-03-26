# 🎯 POS UI - Reglas de Visibilidad por Estado

## 📌 REGLA FUNDAMENTAL

```
NO MOSTRAR botones de acción en vista de tabla/detalle
cuando la venta está COMPLETED, CANCELLED o REFUNDED

SOLO mostrar:
- DRAFT: [Editar] [Cancelar] [Completar Venta]
- COMPLETED: [Reembolsar]
- FINAL: Mensaje informativo sin botones
```

---

## 📊 Tabla de Visibilidad

### VISTA DE TABLA/LISTA

| Botón | DRAFT | COMPLETED | CANCELLED | REFUNDED |
|-------|:-----:|:---------:|:---------:|:--------:|
| Editar | ✅ | ❌ | ❌ | ❌ |
| Cancelar | ✅ | ❌ | ❌ | ❌ |
| Completar | ✅ | ❌ | ❌ | ❌ |
| Reembolsar | ❌ | ✅ | ❌ | ❌ |
| Convertir a Borrador | ❌ | ❌ | ❌ | ❌ |
| Eliminar | ❌ | ❌ | ❌ | ❌ |

---

### VISTA DE DETALLES

| Elemento | DRAFT | COMPLETED | CANCELLED | REFUNDED |
|----------|:-----:|:---------:|:---------:|:--------:|
| Botones [Editar][Cancelar][Completar] | ✅ | ❌ | ❌ | ❌ |
| Botón [Reembolsar] | ❌ | ✅ | ❌ | ❌ |
| Mensaje "Venta finalizada" | ❌ | ❌ | ✅ | ✅ |

---

## 🚫 BOTONES QUE NUNCA DEBEN APARECER

```
❌ "Convertir a Borrador"
  - No existe esta funcionalidad en el sistema
  - Las ventas no pueden volver a DRAFT una vez COMPLETED

❌ "Eliminar" / "Eliminar Venta"
  - No debemos permitir eliminar ventas
  - Las ventas se archivan, se refundan, pero no se eliminan
  - La auditoría requiere que todas las ventas existan en el histórico

❌ "Editar" en COMPLETED
  - Protegido por Golden Rule
  - Backend rechaza con HTTP 400
  - Frontend no debe ni mostrar el botón

❌ "Cancelar" en COMPLETED
  - Protegido por Golden Rule
  - Backend rechaza con HTTP 400
  - Frontend no debe ni mostrar el botón
```

---

## 📱 Implementación en Componentes

### ✅ SalesList.tsx (Nueva)

```typescript
// Mostrar acciones según status
if (sale.status === 'DRAFT') {
  return (
    <div className="flex gap-2">
      <button>✏️ Editar</button>
      <button>❌ Cancelar</button>
    </div>
  );
}

if (sale.status === 'COMPLETED') {
  return <button>💰 Reembolsar</button>;
}

// CANCELLED/REFUNDED
return <span className="text-gray-500">Venta finalizada</span>;
```

### ✅ SaleActions.tsx (Actualizado)

```typescript
// SOLO MOSTRAR botones si condición se cumple
{isDraft && (
  <div className="flex gap-2">
    <button>✏️ Editar</button>
    <button>❌ Cancelar</button>
    <button>✅ Completar Venta</button>
  </div>
)}

{isCompleted && (
  <button>💰 Reembolsar</button>
)}

{isFinal && (
  <div>Venta finalizada, no se puede modificar</div>
)}
```

### ✅ SaleDetails.tsx (Ya está bien)

- Integra SaleActions
- Integra SaleStatusBadge
- Muestra advertencia si no es DRAFT
- No intenta mostrar botones editables

---

## ⚠️ CAMBIOS EN UI EXISTENTE

Si tu interfaz actual muestra:

```
VE    Venta Anónima                ✅ Completada
      [Editar] [Convertir a Borrador] [Eliminar]
      2026-03-11
```

**DEBE CAMBIAR A:**

```
VE    Venta Anónima                ✅ Completada
      [💰 Reembolsar]
      2026-03-11
```

---

## 🔍 Lugares donde Revisar/Actualizar

1. **Lista de ventas (tabla/card):**
   - Usar componente `SalesList.tsx`
   - Renderiza condicionalmente botones

2. **Vista de detalle:**
   - Usar componente `SaleDetails.tsx`
   - Integra `SaleActions.tsx`

3. **Menú de opciones (dropdown):**
   - ❌ Eliminar opciones: "Editar", "Convertir a Borrador", "Eliminar"
   - ✅ Solo mostrar según status

4. **Modal de edición:**
   - ✅ Rechaza si status !== DRAFT (ya implementado)
   - Frontend: Modal no abre
   - Backend: Rechaza con HTTP 400

---

## 💡 Lógica a Aplicar

```typescript
// Función helper para determinar botones
function getActionButtons(sale: Sale) {
  switch (sale.status) {
    case 'DRAFT':
      return ['Editar', 'Cancelar', 'Completar Venta'];
    case 'COMPLETED':
      return ['Reembolsar'];
    case 'CANCELLED':
    case 'REFUNDED':
      return []; // Sin botones
    default:
      return [];
  }
}

// Usar en render
{getActionButtons(sale).map(button => (
  <button key={button}>{button}</button>
))}
```

---

## ✅ Checklist de Implementación

```
[ ] Lista de ventas:
    [ ] DRAFT: muestra [Editar] [Cancelar]
    [ ] COMPLETED: muestra [Reembolsar]
    [ ] FINAL: sin botones, solo mensaje

[ ] Vista de detalle:
    [ ] DRAFT: muestra [Editar] [Cancelar] [Completar]
    [ ] COMPLETED: muestra [Reembolsar]
    [ ] FINAL: sin botones, solo mensaje

[ ] Menú de opciones:
    [ ] Eliminar "Convertir a Borrador"
    [ ] Eliminar "Eliminar/Borrar"
    [ ] Mostrar condicionalmente según status

[ ] Modal de edición:
    [ ] Rechaza si status !== DRAFT
    [ ] Muestra error amigable

[ ] Testing:
    [ ] Intentar editar COMPLETED → falla
    [ ] Intentar cancelar COMPLETED → falla
    [ ] Ver detalle COMPLETED → solo [Reembolsar]
```

---

## 🎨 Estados Visuales

### DRAFT (Editable)
```
┌─────────────────────────────┐
│ Venta #VE-001      📝 DRAFT │
├─────────────────────────────┤
│ [✏️ Editar] [❌ Cancelar]    │
│ [✅ Completar Venta]         │
└─────────────────────────────┘
```

### COMPLETED (Solo refund)
```
┌─────────────────────────────┐
│ Venta #VE-001   ✅ COMPLETA │
├─────────────────────────────┤
│ [💰 Reembolsar]             │
└─────────────────────────────┘
```

### CANCELLED/REFUNDED (Finalizado)
```
┌─────────────────────────────┐
│ Venta #VE-001  ⛔ CANCELADA │
├─────────────────────────────┤
│ Venta finalizada,           │
│ no se puede modificar        │
└─────────────────────────────┘
```

---

## 🔐 Protecciones

### Frontend
- ✅ No mostrar botones si status !== requerido
- ✅ Deshabilitar botones durante procesamiento
- ✅ Confirmar antes de operaciones críticas

### Backend
- ✅ HTTP 400 si intenta editar COMPLETED
- ✅ HTTP 400 si intenta cancelar COMPLETED
- ✅ Logging de intentos sospechosos
- ✅ Validación clinic ownership

---

## 📞 Preguntas Frecuentes

**P: ¿Puedo mostrar botón "Editar" deshabilitado?**
R: No, no mostrar el botón. Los usuarios no deben ver que existe una funcionalidad que no pueden usar.

**P: ¿Debo permitir "Convertir a Borrador"?**
R: No, esa funcionalidad no existe. Las ventas COMPLETED son inmutables.

**P: ¿Qué pasa si alguien intenta editar via CURL?**
R: Backend rechaza con HTTP 400 + mensaje clara. El UI no es la única defensa.

**P: ¿Debo mostrar historial de cambios?**
R: Sí, pero en vista separada. Ver cambios pero no permitir revertir.

---

**Versión:** 1.0  
**Fecha:** Marzo 11, 2026  
**Estado:** ✅ IMPLEMENTADO EN COMPONENTES

