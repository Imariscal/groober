# ✓ POS GOLDEN RULE - REGLA DE ORO DEL SISTEMA

## 📌 La Regla Fundamental del POS

```
┌─────────────────────────────────────────────────────────────┐
│ SOLO VENTAS EN ESTADO DRAFT PUEDEN SER EDITADAS O CANCELADAS │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Estados de Venta y Sus Límites

### DRAFT (Borrador)
```
┌─────────────────┐
│    DRAFT        │
├─────────────────┤
│ ✅ Crear        │
│ ✅ Editar items │
│ ✅ Editar precios│
│ ✅ Cambiar qty  │
│ ✅ Cancelar     │
│ ✅ Completar    │
│ ❌ Refundar     │
└─────────────────┘
```

**Descripción:** Carrito editable, sin impacto en inventario

**Operaciones permitidas:**
- `POST /sales` - Crear venta DRAFT
- `PUT /sales/:id` - Editar venta DRAFT
- `PATCH /sales/:id/cancel` - Cancelar venta DRAFT
- `PATCH /sales/:id/complete` - Completar venta DRAFT

---

### COMPLETED (Completada/Pagada)
```
┌──────────────────┐
│   COMPLETED      │
├──────────────────┤
│ ❌ Crear         │
│ ❌ Editar items  │
│ ❌ Editar precios│
│ ❌ Cambiar qty   │
│ ❌ Cancelar      │
│ ❌ Completar     │
│ ✅ Refundar      │
└──────────────────┘
```

**Descripción:** Venta finalizada, inventario comprometido

**Error si intenta modificar:**
```
HTTP 400 Bad Request
{
  "message": "Cannot edit sale with status COMPLETED. 
            Only DRAFT sales can be edited. 
            COMPLETED, REFUNDED, and CANCELLED sales cannot be modified."
}
```

**Única operación permitida:**
- `PATCH /sales/:id/refund` - Reembolsar venta COMPLETED

---

### CANCELLED (Cancelada)
```
┌──────────────────┐
│   CANCELLED      │
├──────────────────┤
│ ❌ Crear         │
│ ❌ Editar items  │
│ ❌ Cambiar qty   │
│ ❌ Cancelar (ya) │
│ ❌ Editar        │
│ ❌ Refundar      │
└──────────────────┘
```

**Descripción:** Venta cancelada, no afectó inventario

---

### REFUNDED (Reembolsada)
```
┌──────────────────┐
│   REFUNDED       │
├──────────────────┤
│ ❌ Cualquier op. │
└──────────────────┘
```

**Descripción:** Venta revertida, stock restaurado

---

## 🎯 Flujos Válidos

### Flujo A: Venta exitosa
```
DRAFT (crear)
    ↓ [editar items]
DRAFT (actualizar)
    ↓ [pagar/completar]
COMPLETED ✓
    ↓ [cliente quiere devolver]
REFUNDED ✓
```

### Flujo B: Cancelación directa
```
DRAFT (crear)
    ↓ [cambiar opinión]
CANCELLED ✓
```

### Flujo C: Intento inválido (BLOQUEADO)
```
DRAFT (crear)
    ↓ [pagar/completar]
COMPLETED
    ↓ [intenta editar] ← ❌ ERROR: "Cannot edit sale with status COMPLETED"
    
COMPLETED
    ↓ [intenta cancelar] ← ❌ ERROR: "Cannot cancel sale with status COMPLETED. Use refund instead."
```

---

## 🔴 Errores Esperados

### Error 1: Intentar editar venta COMPLETED
```
Request:
PUT /pos/sales/sale-123
{
  "items": [...],
  "discountAmount": 50
}

Response:
HTTP 400 Bad Request
{
  "message": "Cannot edit sale with status \"COMPLETED\". 
            Only DRAFT sales can be edited. 
            COMPLETED, REFUNDED, and CANCELLED sales cannot be modified.",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Error 2: Intentar cancelar venta COMPLETED
```
Request:
PATCH /pos/sales/sale-123/cancel

Response:
HTTP 400 Bad Request
{
  "message": "Cannot cancel sale with status \"COMPLETED\". 
            Only DRAFT sales can be cancelled. 
            For COMPLETED sales, use the /refund endpoint instead.",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Error 3: Intentar completar venta COMPLETED
```
Request:
PATCH /pos/sales/sale-123/complete
{
  "items": [...]
}

Response:
HTTP 400 Bad Request
{
  "message": "Only draft sales can be completed",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## 📱 Implicaciones para Frontend

### ¿Cuándo deshabilitar botones en UI?

**Para venta en DRAFT:** Todos los botones habilitados
```typescript
<button onClick={editSale} disabled={sale.status !== 'DRAFT'}>Editar</button>
<button onClick={cancelSale} disabled={sale.status !== 'DRAFT'}>Cancelar</button>
<button onClick={completeSale} disabled={sale.status !== 'DRAFT'}>Completar</button>
```

**Para venta no-DRAFT:** Solo botón REFUND (si COMPLETED)
```typescript
{sale.status === 'DRAFT' && (
  <>
    <button onClick={editSale}>Editar</button>
    <button onClick={cancelSale}>Cancelar</button>
    <button onClick={completeSale}>Completar Venta</button>
  </>
)}

{sale.status === 'COMPLETED' && (
  <button onClick={refundSale}>Reembolsar</button>
)}

{['CANCELLED', 'REFUNDED'].includes(sale.status) && (
  <p>Esta venta no puede ser modificada.</p>
)}
```

### ¿Qué mostrar visualmente?

**Badge de estado:**
```typescript
const statusColors = {
  'DRAFT': 'bg-yellow-100 text-yellow-800', // Editable
  'COMPLETED': 'bg-green-100 text-green-800', // Finalizado
  'CANCELLED': 'bg-gray-100 text-gray-800', // Anulado
  'REFUNDED': 'bg-blue-100 text-blue-800', // Reembolsado
};

<span className={statusColors[sale.status]}>
  {sale.status}
</span>
```

**Tooltips informativos:**
```typescript
{sale.status !== 'DRAFT' && (
  <p className="text-sm text-gray-500">
    ℹ️ Solo se pueden editar o cancelar ventas en estado DRAFT.
    Para esta venta: use refund si puede ser reembolsada.
  </p>
)}
```

---

## 🛡️ Protecciones Backend

### Nivel 1: Validación en Controlador
```typescript
// En pos.controller.ts - updateSale()
if (sale.status !== 'DRAFT') {
  throw new BadRequestException(
    `Cannot edit sale with status "${sale.status}". 
     Only DRAFT sales can be edited...`
  );
}
```

### Nivel 2: Validación en Servicio
```typescript
// En pos.service.ts - updateDraftSale()
if (sale.status !== 'DRAFT') {
  throw new BadRequestException('Only draft sales can be updated');
}
```

### Nivel 3: BD Constraints (futuro)
```sql
-- Podría añadir trigger en BD para máxima protección
CREATE TRIGGER check_sale_status_before_update
BEFORE UPDATE ON sales
FOR EACH ROW
BEGIN
  IF OLD.status != 'DRAFT' THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Cannot modify non-draft sales';
  END IF;
END;
```

---

## ✅ Checklist de Cumplimiento

**En Backend:**
- [x] Validación en controlador para UPDATE
- [x] Validación en controlador para CANCEL
- [x] Validación en servicio para UPDATE
- [x] Validación en servicio para CANCEL
- [x] Mensajes de error claros y específicos
- [x] HTTP status code correcto (400 Bad Request)

**En Frontend:**
- [ ] Deshabilitar botones Edit/Cancel/Complete si status != DRAFT
- [ ] Mostrar badge de estado claramente
- [ ] Mostrar mensaje informativo cuando venta no es DRAFT
- [ ] Manejar errores 400 específicamente
- [ ] Mostrar tooltip con explicación

**En Base de Datos:**
- [ ] (Opcional) Agregar triggers para máxima protección

---

## 🎯 Testing Checklist

```
Test 1: Crear venta DRAFT
  ✓ POST /sales → HTTP 201 → status = DRAFT

Test 2: Editar venta DRAFT
  ✓ PUT /sales/:id → HTTP 200 → actualiza

Test 3: Intentar editar venta COMPLETED
  ✗ PUT /sales/:id → HTTP 400 → "Cannot edit..."

Test 4: Cancelar venta DRAFT
  ✓ PATCH /sales/:id/cancel → HTTP 200 → status = CANCELLED

Test 5: Intentar cancelar venta COMPLETED
  ✗ PATCH /sales/:id/cancel → HTTP 400 → "Cannot cancel..."

Test 6: Completar venta DRAFT
  ✓ PATCH /sales/:id/complete → HTTP 200 → status = COMPLETED

Test 7: Intentar completar venta COMPLETED
  ✗ PATCH /sales/:id/complete → HTTP 400 → "Only draft..."

Test 8: Refundar venta COMPLETED
  ✓ PATCH /sales/:id/refund → HTTP 200 → status = REFUNDED

Test 9: Intentar refundar venta DRAFT
  ✗ PATCH /sales/:id/refund → HTTP 400 → "Only completed..."

Test 10: Acciones en venta CANCELLED/REFUNDED
  ✗ Cualquier edición → HTTP 400 → "Cannot modify..."
```

---

## 📖 Referencia Rápida

```
Venta DRAFT   → ✅ Editar, ✅ Cancelar, ✅ Completar
Venta COMPLETED → ❌ Editar, ❌ Cancelar, ✅ Refundar
Venta CANCELLED  → ❌ Cualquier acción
Venta REFUNDED   → ❌ Cualquier acción
```

**Ejemplo CLI para testear:**
```bash
# Crear venta DRAFT
curl -X POST http://localhost:3000/pos/sales \
  -H "Content-Type: application/json" \
  -d '{"clinicId":"...","items":[...]}'

# Intentar editar venta COMPLETED
curl -X PUT http://localhost:3000/pos/sales/sale-123 \
  -H "Content-Type: application/json" \
  -d '{"items":[...]}'
# → HTTP 400: "Cannot edit sale with status COMPLETED"

# Refundar venta COMPLETED
curl -X PATCH http://localhost:3000/pos/sales/sale-123/refund
# → HTTP 200: status = REFUNDED
```

---

**Versión:** 1.0  
**Actualizado:** Marzo 11, 2026  
**Estado:** IMPLEMENTADO Y VIGENTE ✓

