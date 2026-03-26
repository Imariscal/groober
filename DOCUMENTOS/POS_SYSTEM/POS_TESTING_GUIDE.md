# ✅ POS TESTING GUIDE - VERIFICACIÓN COMPLETA DEL SISTEMA

## 📌 Objetivo

Validar que la **REGLA DE ORO** está correctamente implementada en Backend:
- ✅ DRAFT sales CAN be edited/cancelled
- ✅ COMPLETED sales CANNOT be edited/cancelled
- ✅ COMPLETED sales CAN be refunded
- ✅ Errors return HTTP 400 with clear messages

---

## 🔧 Requisitos

### Backend
```bash
# 1. Backend compilado
cd vibralive-backend
npm run build

# 2. Base de datos actualizada
npm run typeorm migration:run

# 3. Backend en ejecución
npm run start:dev
# Disponible en: http://localhost:3000
```

### Herramientas
- **Postman** o **Insomnia** para HTTP requests
- **curl** como alternativa en terminal
- **VS Code REST Client** (extensión opcional)

### Data Setup
```sql
-- Ejecutar en PostgreSQL antes de testear
INSERT INTO clinics (id, name) VALUES 
  ('clinic-001', 'Clinic Test');

INSERT INTO users (id, email, clinicId) VALUES 
  ('user-001', 'test@clinic.com', 'clinic-001');

INSERT INTO products (id, name, price, clinicId, isActive, stockQuantity) VALUES
  ('prod-001', 'Shampoo', 50.00, 'clinic-001', true, 100),
  ('prod-002', 'Conditioner', 45.00, 'clinic-001', true, 50);
```

---

## 🧪 Test Suite

### TEST 1️⃣: Crear Venta DRAFT

**Objetivo:** Verificar que se puede crear una venta en estado DRAFT

**Request:**
```bash
POST /pos/sales
Content-Type: application/json
Authorization: Bearer <token>

{
  "clinicId": "clinic-001",
  "items": [
    {
      "productId": "prod-001",
      "quantity": 5,
      "unitPrice": 50.00
    }
  ],
  "discountAmount": 0
}
```

**Respuesta esperada:**
```json
HTTP 201 Created
{
  "id": "sale-001",
  "status": "DRAFT",
  "items": [...],
  "subtotal": 250.00,
  "total": 250.00,
  "createdAt": "2026-03-11T10:00:00Z"
}
```

**Validación:**
- ✅ Status = "DRAFT"
- ✅ HTTP 201 (Created)
- ✅ Items correctamente guardados
- ✅ NO se validó inventario (confirmado: stock sigue siendo 100)

**curl:**
```bash
curl -X POST http://localhost:3000/pos/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token123" \
  -d '{
    "clinicId":"clinic-001",
    "items":[{"productId":"prod-001","quantity":5,"unitPrice":50}],
    "discountAmount":0
  }'
```

---

### TEST 2️⃣: Editar Venta DRAFT

**Objetivo:** Verificar que se PUEDE editar una venta DRAFT

**Requisito:** Usar sale-001 del Test 1

**Request:**
```bash
PUT /pos/sales/sale-001
Content-Type: application/json
Authorization: Bearer <token>

{
  "items": [
    {
      "productId": "prod-001",
      "quantity": 2,
      "unitPrice": 50.00
    },
    {
      "productId": "prod-002",
      "quantity": 3,
      "unitPrice": 45.00
    }
  ],
  "discountAmount": 10.00
}
```

**Respuesta esperada:**
```json
HTTP 200 OK
{
  "id": "sale-001",
  "status": "DRAFT",
  "items": [
    {"productId":"prod-001","quantity":2},
    {"productId":"prod-002","quantity":3}
  ],
  "discountAmount": 10.00,
  "subtotal": 235.00,
  "total": 225.00
}
```

**Validación:**
- ✅ HTTP 200 (OK)
- ✅ Items actualizados
- ✅ Descuento aplicado
- ✅ Total recalculado
- ✅ Status sigue siendo DRAFT

---

### TEST 3️⃣: Completar Venta DRAFT

**Objetivo:** Pasar venta de DRAFT a COMPLETED

**Requisito:** Usar sale-001 editada (Test 2)

**Request:**
```bash
PATCH /pos/sales/sale-001/complete
Content-Type: application/json
Authorization: Bearer <token>

{
  "paymentMethod": "CASH",
  "paidAmount": 225.00
}
```

**Respuesta esperada:**
```json
HTTP 200 OK
{
  "id": "sale-001",
  "status": "COMPLETED",
  "items": [...],
  "total": 225.00,
  "paymentMethod": "CASH",
  "completedAt": "2026-03-11T10:05:00Z"
}
```

**Validación:**
- ✅ HTTP 200
- ✅ Status = "COMPLETED"
- ✅ Se actualizó completedAt
- ✅ Inventario se restó (verificar BD: prod-001 stock ahora = 98, prod-002 = 47)

**SQL para verificar:**
```sql
SELECT id, name, stockQuantity FROM products 
WHERE id IN ('prod-001', 'prod-002');
-- Expected: prod-001 = 98, prod-002 = 47
```

---

### TEST 4️⃣: ❌ Intentar Editar Venta COMPLETED

**Objetivo:** Verificar que NO se puede editar venta COMPLETED

**Requisito:** Usar sale-001 completada (Test 3)

**Request:**
```bash
PUT /pos/sales/sale-001
Content-Type: application/json
Authorization: Bearer <token>

{
  "items": [{...}],
  "discountAmount": 20.00
}
```

**Respuesta ESPERADA (debe fallar):**
```json
HTTP 400 Bad Request
{
  "message": "Cannot edit sale with status \"COMPLETED\". 
             Only DRAFT sales can be edited. 
             COMPLETED, REFUNDED, and CANCELLED sales cannot be modified.",
  "error": "Bad Request",
  "statusCode": 400
}
```

**Validación:**
- ✅ HTTP 400 (NOT 200)
- ✅ Mensaje contiene "Cannot edit"
- ✅ Mensaje contiene "COMPLETED"
- ✅ NO se modificó la venta (verificar BD)
- ✅ Stock NO cambió (sigue siendo 98 y 47)

**curl:**
```bash
curl -X PUT http://localhost:3000/pos/sales/sale-001 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token123" \
  -d '{"items":[],"discountAmount":20}' \
  -w "\nHTTP Status: %{http_code}\n"
# Debe mostrar: HTTP Status: 400
```

---

### TEST 5️⃣: ❌ Intentar Cancelar Venta COMPLETED

**Objetivo:** Verificar que NO se puede cancelar venta COMPLETED

**Requisito:** Usar sale-001 completada

**Request:**
```bash
PATCH /pos/sales/sale-001/cancel
Authorization: Bearer <token>
```

**Respuesta ESPERADA (debe fallar):**
```json
HTTP 400 Bad Request
{
  "message": "Cannot cancel sale with status \"COMPLETED\". 
             Only DRAFT sales can be cancelled. 
             For COMPLETED sales, use the /refund endpoint instead.",
  "error": "Bad Request",
  "statusCode": 400
}
```

**Validación:**
- ✅ HTTP 400
- ✅ Mensaje contiene "Cannot cancel"
- ✅ Mensaje sugiere usar "refund"
- ✅ Status sigue siendo COMPLETED
- ✅ Stock no fue restaurado

**curl:**
```bash
curl -X PATCH http://localhost:3000/pos/sales/sale-001/cancel \
  -H "Authorization: Bearer token123" \
  -w "\nHTTP Status: %{http_code}\n"
# Debe mostrar: HTTP Status: 400
```

---

### TEST 6️⃣: ✅ Reembolsar Venta COMPLETED

**Objetivo:** Verificar que se PUEDE reembolsar venta COMPLETED

**Requisito:** Usar sale-001 completada

**Request:**
```bash
PATCH /pos/sales/sale-001/refund
Content-Type: application/json
Authorization: Bearer <token>

{
  "reason": "Customer requested refund"
}
```

**Respuesta esperada:**
```json
HTTP 200 OK
{
  "id": "sale-001",
  "status": "REFUNDED",
  "refundedAt": "2026-03-11T10:10:00Z",
  "refundReason": "Customer requested refund"
}
```

**Validación:**
- ✅ HTTP 200
- ✅ Status = "REFUNDED"
- ✅ Se populó refundedAt
- ✅ Stock fue restaurado (verificar BD: prod-001 stock = 100, prod-002 = 50)

**SQL para verificar:**
```sql
SELECT id, name, stockQuantity FROM products 
WHERE id IN ('prod-001', 'prod-002');
-- Expected: prod-001 = 100, prod-002 = 50 (restaurado)
```

---

### TEST 7️⃣: Crear DRAFT y Cancelar

**Objetivo:** Crear nueva venta y cancelarla directamente (sin completar)

**Paso 1: Crear**
```bash
POST /pos/sales
{
  "clinicId": "clinic-001",
  "items": [{"productId":"prod-001","quantity":10,"unitPrice":50}],
  "discountAmount": 0
}
# Response: sale-002, status=DRAFT
```

**Paso 2: Cancelar**
```bash
PATCH /pos/sales/sale-002/cancel
# Response: HTTP 200, status=CANCELLED
```

**Validación:**
- ✅ HTTP 200
- ✅ Status = "CANCELLED"
- ✅ Stock NO fue afectado (sigue siendo 100)

---

### TEST 8️⃣: ❌ Intentar Refundar DRAFT

**Objetivo:** Verificar que NO se puede refundar venta DRAFT

**Request:**
```bash
PATCH /pos/sales/sale-002/refund
Authorization: Bearer <token>
```

**Respuesta ESPERADA (debe fallar):**
```json
HTTP 400 Bad Request
{
  "message": "Only completed sales can be refunded",
  "statusCode": 400
}
```

**Validación:**
- ✅ HTTP 400
- ✅ Mensajeclaro

---

### TEST 9️⃣: Intentar completar venta sin stock

**Objetivo:** Crear venta DRAFT, reducir stock a 0, intentar completar (debe fallar)

**Paso 1: Crear venta DRAFT**
```bash
POST /pos/sales
{
  "clinicId": "clinic-001",
  "items": [{"productId":"prod-001","quantity":100,"unitPrice":50}],
  "discountAmount": 0
}
# Response: sale-003, status=DRAFT
# ✅ Se permite crear aunque qty=100 y stock actual probablemente sea < 100
```

**Paso 2: Editar venta DRAFT para pedir más de lo disponible**
```bash
PUT /pos/sales/sale-003
{
  "items": [{"productId":"prod-001","quantity":200,"unitPrice":50}],
  "discountAmount": 0
}
# Response: HTTP 200 OK
# ✅ Se permite editar DRAFT sin validar stock
```

**Paso 3: Intentar completar**
```bash
PATCH /pos/sales/sale-003/complete
{
  "paymentMethod": "CASH",
  "paidAmount": 10000
}
```

**Respuesta esperada (debe fallar):**
```json
HTTP 400 Bad Request
{
  "message": "Insufficient stock for product: prod-001",
  "statusCode": 400
}
```

**Validación:**
- ✅ HTTP 400
- ✅ Error contiene "Insufficient stock"
- ✅ Status sigue siendo DRAFT
- ✅ Stock no fue modificado
- ✅ Se puede intentar editar de nuevo y corregir cantidades

---

### TEST 🔟: Estado Final - Venta REFUNDED

**Objetivo:** Verificar que venta REFUNDED es inmutable

**Requisito:** Usar sale-001 reembolsada (Test 6)

**Intento: Editar**
```bash
PUT /pos/sales/sale-001
{ "items": [...] }
# Response: HTTP 400 "Cannot edit sale with status REFUNDED"
```

**Intento: Cancelar**
```bash
PATCH /pos/sales/sale-001/cancel
# Response: HTTP 400 "Cannot cancel sale with status REFUNDED"
```

**Intento: Refundar de nuevo**
```bash
PATCH /pos/sales/sale-001/refund
# Response: HTTP 400 "Only completed sales can be refunded"
```

**Validación:**
- ✅ Todos HTTP 400
- ✅ Venta no puede ser modificada de ninguna forma

---

## 📊 Matriz de Validación Rápida

| Test | Acción | Status Original | Esperado | HTTP | Error? |
|------|--------|-----------------|----------|------|--------|
| 1 | CREATE | N/A | DRAFT | 201 | ❌ |
| 2 | EDIT | DRAFT | DRAFT | 200 | ❌ |
| 3 | COMPLETE | DRAFT | COMPLETED | 200 | ❌ |
| 4 | EDIT | COMPLETED | ❌ | 400 | ✅ |
| 5 | CANCEL | COMPLETED | ❌ | 400 | ✅ |
| 6 | REFUND | COMPLETED | REFUNDED | 200 | ❌ |
| 7 | CANCEL | DRAFT | CANCELLED | 200 | ❌ |
| 8 | REFUND | DRAFT | ❌ | 400 | ✅ |
| 9 | COMPLETE | DRAFT (qty > stock) | ❌ | 400 | ✅ |
| 10 | Any | REFUNDED | ❌ | 400 | ✅ |

---

## 🐛 Debugging

Si algo falla:

### Verificar logs del backend
```bash
# Terminal donde corre Backend
npm run start:dev
# Buscar: ERROR, Cannot edit, Cannot cancel, etc.
```

### Verificar BD
```sql
-- Estado actual de ventas
SELECT id, status, subtotal, total FROM sales ORDER BY createdAt DESC;

-- Stock después de cada operación
SELECT id, name, stockQuantity FROM products;

-- Movimientos de inventario
SELECT id, productId, quantity, type, saleId FROM inventory_movements;
```

### Validar payload
```bash
# Asegúrese que el JSON es válido
echo '{"key":"value"}' | jq . 
# Debe mostrar formateado, no error
```

### Validar token
```bash
# Si obtiene 401 Unauthorized
# 1. Generar nuevo token
# 2. Incluir en header: Authorization: Bearer <token>
# 3. El token debe ser para clinicId: clinic-001
```

---

## 📋 Checklist Final

Antes de considerar COMPLETADO:

```
[ ] Test 1: Crear DRAFT - HTTP 201, status=DRAFT
[ ] Test 2: Editar DRAFT - HTTP 200, items actualizados
[ ] Test 3: Completar DRAFT - HTTP 200, status=COMPLETED, stock restado
[ ] Test 4: EDIT COMPLETED - HTTP 400, mensaje claro
[ ] Test 5: CANCEL COMPLETED - HTTP 400, mensaje claro
[ ] Test 6: REFUND COMPLETED - HTTP 200, status=REFUNDED, stock restaurado
[ ] Test 7: CANCEL DRAFT - HTTP 200, status=CANCELLED, stock intacto
[ ] Test 8: REFUND DRAFT - HTTP 400
[ ] Test 9: COMPLETE sin stock - HTTP 400, mensaje específico
[ ] Test 10: REFUNDED inmutable - HTTP 400 en cualquier intento
[ ] Validar mensajes de error son claros y útiles
[ ] Validar stock se actualiza correctamente en BD
[ ] RE COMPLETADO: Regla de Oro implementada correctamente ✅
```

---

## 🚀 Próximos Pasos

Una vez que TODOS los tests pasen:

1. **Frontend Testing** - Probar UI con estados
2. **Multi-terminal Testing** - Simular 2+ terminales concurrentes
3. **Load Testing** - 100+ ventas simultáneas
4. **Integration Testing** - Reportes se actualizan correctamente
5. **Production Deployment** - Deploy a staging

---

**Versión:** 1.0  
**Actualizado:** Marzo 11, 2026  
**Estado:** LISTO PARA TESTING

