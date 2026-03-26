# 📊 Esquemas de Base de Datos - Módulo POS

## 🗂️ Diagrama General

```
┌─────────────────────────────────────────────────────────┐
│                    MÓDULO POS                           │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                         SALES (Ventas)                               │
├──────────────────────────────────────────────────────────────────────┤
│ id (UUID)                                                            │
│ clinic_id (FK → clinics)                                           │
│ client_id (FK → clients, nullable)                                 │
│ appointment_id (FK → appointments, nullable)                       │
│ sale_type (ENUM: POS, APPOINTMENT_ADDON)                          │
│ status (ENUM: DRAFT, COMPLETED, CANCELLED, REFUNDED)              │
│ subtotal (NUMERIC)                                                 │
│ discount_amount (NUMERIC)                                          │
│ tax_amount (NUMERIC)                                               │
│ total_amount (NUMERIC)                                             │
│ notes (TEXT, nullable)                                             │
│ sold_at (TIMESTAMP, nullable)                                      │
│ created_by_user_id (UUID, nullable)                                │
│ created_at, updated_at                                             │
├──────────────────────────────────────────────────────────────────────┤
│ Relationships:                                                       │
│  → 1:N con SALE_ITEMS                                              │
│  → 1:N con SALE_PAYMENTS                                           │
│  → 1:N con INVENTORY_MOVEMENTS (sale_id = referenceId)             │
└──────────────────────────────────────────────────────────────────────┘
                                 │
                   ┌─────────────┴─────────────┐
                   │                           │
         ┌─────────▼─────────┐      ┌─────────▼─────────┐
         │  SALE_ITEMS       │      │ SALE_PAYMENTS     │
         └───────────────────┘      └───────────────────┘
                   │                           │
                   │                           │
         ┌─────────▼──────────────────────────┘
         │
    ┌────▼──────────────────────┐
    │  SALE_PRODUCTS (Catálogo) │
    └───────────────────────────┘
         │
         └──────────┬──────────────┐
                    │              │
        ┌───────────▼───────┐    ┌──▼──────────────────────┐
        │ INVENTORY_         │    │ INVENTORY_MOVEMENTS      │
        │ RESERVATIONS       │    │ (new - to be created)    │
        │ (new - to be       │    └──────────────────────────┘
        │  created)          │
        └────────────────────┘
```

---

## 📋 Esquemas Detallados

### 1️⃣ sale_products (Catálogo de Productos)

```typescript
@Entity('sale_products')
@Index(['clinicId', 'sku'], { unique: true })
@Index(['clinicId', 'isActive'])
```

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|------------|
| **id** | UUID | PK | Identificador único del producto |
| **clinic_id** | UUID | FK(clinics) | Clínica propietaria del producto |
| **sku** | VARCHAR(80) | UNIQUE per clinic | Código de producto |
| **name** | VARCHAR(200) | NOT NULL | Nombre del producto |
| **description** | TEXT | NULL | Descripción detallada |
| **category** | VARCHAR(50) | ENUM | Categoría: FOOD, ACCESSORY, CLOTHING, HYGIENE, TOY, OTHER |
| **brand** | VARCHAR(100) | NULL | Marca del producto |
| **sale_price** | NUMERIC(10,2) | NOT NULL | Precio de venta |
| **cost_price** | NUMERIC(10,2) | NULL | Costo (para margen) |
| **stock_quantity** | NUMERIC(10,2) | DEFAULT=0 | Cantidad en stock (⚠️ CRÍTICO para validación) |
| **stock_unit** | VARCHAR(20) | DEFAULT=UNIT | Unidad: UNIT, KG, BAG, BOX, LITER, PACK |
| **min_stock_alert** | NUMERIC(10,2) | NULL | Cantidad mínima para alerta |
| **is_active** | BOOLEAN | DEFAULT=true | Si el producto está habilitado |
| **created_at** | TIMESTAMP | AUTO | Fecha de creación |
| **updated_at** | TIMESTAMP | AUTO | Fecha de última actualización |

**📌 PROBLEMA IDENTIFICADO:**
- No hay mecanismo de RESERVA cuando se crea una venta
- Stock se valida solo en `completeSale()`, no en `createSale()`
- Permite crear múltiples ventas DRAFT que superan el stock

---

### 2️⃣ sales (Ventas Maestro)

```typescript
@Entity('sales')
@Index(['clinicId', 'status'])
@Index(['clientId'])
@Index(['appointmentId'])
```

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|------------|
| **id** | UUID | PK | Identificador único de la venta |
| **clinic_id** | UUID | FK(clinics) | Clínica a la que pertenece |
| **client_id** | UUID | FK(clients), NULL | Cliente (opcional) |
| **appointment_id** | UUID | FK(appointments), NULL | Cita asociada (si es add-on) |
| **sale_type** | VARCHAR(20) | ENUM, DEFAULT=POS | Tipo: POS o APPOINTMENT_ADDON |
| **status** | VARCHAR(20) | ENUM, DEFAULT=DRAFT | DRAFT, COMPLETED, CANCELLED, REFUNDED |
| **subtotal** | NUMERIC(12,2) | DEFAULT=0 | Suma de items sin descuento/impuesto |
| **discount_amount** | NUMERIC(12,2) | DEFAULT=0 | Descuento aplicado |
| **tax_amount** | NUMERIC(12,2) | DEFAULT=0 | Impuesto aplicado |
| **total_amount** | NUMERIC(12,2) | DEFAULT=0 | Total final (subtotal - desc + tax) |
| **notes** | TEXT | NULL | Notas adicionales |
| **sold_at** | TIMESTAMP | NULL | Fecha cuando se completó |
| **created_by_user_id** | UUID | NULL | Usuario que creó la venta |
| **created_at** | TIMESTAMP | AUTO | Fecha de creación |
| **updated_at** | TIMESTAMP | AUTO | Fecha de última actualización |

**📌 FLUJO ACTUAL:**
```
Crear SALE → status = DRAFT (sin validación de stock)
Editar SALE → cambia items (sin validación de stock)
Completar SALE → valida stock POR PRIMERA VEZ (pero ya es tarde)
```

---

### 3️⃣ sale_items (Líneas de Venta)

```typescript
@Entity('sale_items')
@Index(['saleId'])
@Index(['productId'])
```

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|------------|
| **id** | UUID | PK | Identificador único del item |
| **clinic_id** | UUID | FK(clinics) | Clínica |
| **sale_id** | UUID | FK(sales) CASCADE | Venta a la que pertenece |
| **product_id** | UUID | FK(sale_products) | Producto vendido |
| **quantity** | NUMERIC(10,2) | NOT NULL | Cantidad vendida (⚠️ NO VALIDADA) |
| **unit_price** | NUMERIC(10,2) | NOT NULL | Precio unitario |
| **subtotal** | NUMERIC(12,2) | NOT NULL | quantity × unit_price |
| **created_at** | TIMESTAMP | AUTO | Fecha de creación |

**📌 RELACIÓN CRÍTICA:**
- Cuando se elimina/modifica un item en EDIT SALE, no se actualiza el inventario
- Cuando se agrega un item, no se valida si hay stock disponible (considerando otras ventas DRAFT)

---

### 4️⃣ sale_payments (Pagos)

```typescript
@Entity('sale_payments')
@Index(['saleId'])
```

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|------------|
| **id** | UUID | PK | Identificador único del pago |
| **clinic_id** | UUID | FK(clinics) | Clínica |
| **sale_id** | UUID | FK(sales) CASCADE | Venta asociada |
| **payment_method** | VARCHAR(20) | ENUM | CASH, CARD, TRANSFER, MIXED, OTHER |
| **amount** | NUMERIC(12,2) | NOT NULL | Monto pagado |
| **reference** | VARCHAR(100) | NULL | Referencia (ej: número de transacción) |
| **paid_at** | TIMESTAMP | NOT NULL | Fecha del pago |
| **created_at** | TIMESTAMP | AUTO | Fecha de registro |

---

### 5️⃣ inventory_movements (Historial de Movimientos)

```typescript
@Entity('inventory_movements')
@Index(['productId'])
@Index(['clinicId', 'createdAt'])
```

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|------------|
| **id** | UUID | PK | Identificador único |
| **clinic_id** | UUID | FK(clinics) | Clínica |
| **product_id** | UUID | FK(sale_products) | Producto afectado |
| **movement_type** | VARCHAR(20) | ENUM | IN (entrada), OUT (salida), ADJUSTMENT |
| **quantity** | NUMERIC(10,2) | NOT NULL | Cantidad movida |
| **reason** | VARCHAR(50) | ENUM | SALE, PURCHASE, ADJUSTMENT, RETURN, DAMAGE, OTHER |
| **reference_id** | UUID | NULL | Referencia (ej: sale_id si reason=SALE) |
| **notes** | TEXT | NULL | Notas adicionales |
| **created_by_user_id** | UUID | NULL | Usuario que registró |
| **created_at** | TIMESTAMP | AUTO | Fecha del movimiento |

**📌 PROBLEMA:**
- Se genera movimiento OUT solo cuando se COMPLETA la venta
- Si se EDITA y se quita un item, el movimiento anterior NO se revierte
- No hay mecanismo de RESERVA, solo movimientos finales

---

## 6️⃣ inventory_reservations (NUEVA - Propuesta Opción 1)

```sql
CREATE TABLE inventory_reservations (
  id UUID PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES sale_products(id),
  reserved_quantity NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  released_at TIMESTAMP NULL,
  UNIQUE(sale_id, product_id),
  INDEX idx_product_id (product_id),
  INDEX idx_sale_id (sale_id),
  INDEX idx_released_at (released_at)
);
```

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|------------|
| **id** | UUID | PK | Identificador único |
| **sale_id** | UUID | FK(sales) CASCADE | Venta que reserva el stock |
| **product_id** | UUID | FK(sale_products) | Producto reservado |
| **reserved_quantity** | NUMERIC(10,2) | NOT NULL | Cantidad reservada |
| **created_at** | TIMESTAMP | AUTO | Cuándo se reservó |
| **released_at** | TIMESTAMP | NULL | Cuándo se ejecutó (en COMPLETE SALE) |

**PROPÓSITO:**
- Marca stock como "comprometido" cuando se crea la venta
- Bloquea que otros usuarios usen ese stock
- Se libera cuando se COMPLETA la venta

---

## 📈 Vista: available_stock (Propuesta)

```sql
CREATE MATERIALIZED VIEW available_stock AS
SELECT 
  p.id,
  p.stock_quantity - COALESCE(SUM(r.reserved_quantity), 0) as available_stock
FROM sale_products p
LEFT JOIN inventory_reservations r 
  ON p.id = r.product_id 
  AND r.released_at IS NULL
WHERE p.is_active = true
GROUP BY p.id;

-- Índice para queries rápidas
CREATE INDEX idx_available_stock_id ON available_stock(id);
```

**CUÁNDO USAR:**
```
- Frontend: Mostrar stock disponible en dropdown de productos
- Backend: Validar en CREATE/UPDATE si hay stock suficiente
- Dropdowns: SELECT * FROM available_stock WHERE id = ?
```

---

## 🔴 Problemas Actuales (Mapeo a Tablas)

| Problema | Tabla Afectada | Raíz | Solución |
|----------|---|-------|---------|
| ❌ Overbooking (crear 3×12 con stock 20) | `sales` + `sale_items` | SIN validación en CREATE | Agregar validación + RESERVA en CREATE |
| ❌ Editar venta sin validar stock | `sale_items` | SIN validación en UPDATE | Re-validar al editar |
| ❌ Eliminar item no devuelve stock | `sale_items` + `inventory_movements` | Solo movimiento en COMPLETE | Crear movimiento provisional en UPDATE |
| ❌ Transacciones inconsistentes | `sales` + `inventory_movements` | SIN transacciones atómicas | Usar transactions en completeSale() |

---

## ✅ Solución Propuesta: Tablas Nueva + Validaciones

### Cambios Necesarios

1. **Nueva Tabla**: `inventory_reservations`
   - Almacena reservas de stock
   - Se crea en CREATE SALE
   - Se libera/ejecuta en COMPLETE SALE

2. **Nueva Vista**: `available_stock`
   - Calcula stock disponible (total - reservadas)
   - Se usa para validación y UI

3. **Lógica en Backend**:
   ```
   CREATE SALE:
     ✓ Validar: ¿hay available_stock?
     ✓ Si NO → Error
     ✓ Si SÍ → crear sale + crear reservación
   
   UPDATE SALE:
     ✓ Calcular cambios en items
     ✓ Re-validar stock
     ✓ Actualizar reservación
   
   COMPLETE SALE:
     ✓ Convertir reservación en movimiento OUT
     ✓ Actualizar sale_products.stock_quantity
     ✓ Marcar reservación como released
   ```

---

## 🚀 Implementación (Pasos)

### Fase 1: BD (1 hora)
- [ ] Crear tabla `inventory_reservations`
- [ ] Crear vista `available_stock`
- [ ] Agregar índices

### Fase 2: Backend (2-3 horas)
- [ ] Agregar métodos en POSService:
  - `createReservation()`
  - `updateReservation()`
  - `releaseReservation()`
  - `getAvailableStock()`
- [ ] Modificar `createSale()` para validar + reservar
- [ ] Modificar `updateSale()` para re-validar
- [ ] Modificar `completeSale()` para ejecutar reservación

### Fase 3: Frontend (1-2 horas)
- [ ] Obtener `available_stock` en dropdown
- [ ] Mostrar advertencia si stock = 0
- [ ] Validar cantidad en tiempo real

### Fase 4: Testing (2 horas)
- [ ] Test: Crear 3 ventas de 12 con stock 20 → debe fallar en 2da
- [ ] Test: Editar venta y cambiar cantidad → debe re-validar
- [ ] Test: Complete sale → debe decrementar stock

---

## 📞 Requerimientos para el Arquitecto

**Preguntas:**
1. ¿Usar inventory_reservations o approach diferente?
2. ¿Cálculos en BD (vista) o en aplicación?
3. ¿Validar stock en CADA item o permitir overbooking parcial?
4. ¿Tiempo máximo de reservación (ej: si no se completa en 1 hora, liberar)?

**Próximos Pasos:**
- [ ] Review de este documento
- [ ] Aprobación de la arquitectura
- [ ] Asignación de tareas
- [ ] Inicio de implementación
