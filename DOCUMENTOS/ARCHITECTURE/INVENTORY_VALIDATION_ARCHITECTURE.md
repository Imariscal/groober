# 🚨 ANÁLISIS CRÍTICO: Validación de Inventario en Módulo de Ventas

## Problema Identificado

**Caso Real**: 
- Stock disponible: **20 piezas**
- Se crearon: **3 ventas × 12 piezas = 36 piezas necesarias**
- Resultado: ✅ **Todas se completaron exitosamente** (¡INCORRECTO!)

---

## 🔴 Raíz del Problema: Arquitectura Deficiente

### Flujo Actual (INCORRECTO)

```
CREATE SALE (DRAFT)         ← ❌ SIN VALIDACIÓN DE STOCK
    ↓
    Guardas en BD
    ↓
EDIT SALE (cambias cantidades) ← ❌ SIN VALIDACIÓN DE STOCK
    ↓
    Guardas en BD
    ↓
COMPLETE SALE               ← ✅ SÍ VALIDA STOCK
    ↓
    PERO YA MUY TARDE - se pueden completar múltiples ventas sin validar el total
```

**Por qué falla:**
1. ✗ Cada COMPLETE valida **su propia venta** en aislamiento
2. ✗ No considera el **total de stock comprometido** en otras ventas DRAFT
3. ✗ Permite crear ventas con cantidades **imposibles**

### Ejemplo del Bug:
```
Stock: 20 piezas

Venta 1 (DRAFT): 12 piezas
Venta 2 (DRAFT): 12 piezas  
Venta 3 (DRAFT): 12 piezas
TODO: 36 piezas (supera stock en 16)

Completar Venta 1: ✅ Valida 12 ≤ 20 = OK (stock baja a 8)
Completar Venta 2: ✅ Valida 12 ≤ 8 = DEBERÍA FALLAR pero no lo hace
Completar Venta 3: ✅ Debería fallar, pero pasan todas
```

---

## 💡 Solución Arquitectónica Propuesta

### Opción 1: "RESERVE ON CREATE" (Recomendada) ⭐

**Concepto**: Reservar stock cuando se **CREA** la venta, no cuando se **COMPLETA**

```
CREATE SALE
    ↓
    Validar: ¿Hay stock disponible para esta cantidad?
    ↓
    SI NO → Error: "Stock insuficiente"
    SI SÍ → RESERVAR stock (crear inventory_reservation)
    ↓
    Estado: DRAFT (pero con stock RESERVADO)
    ↓
EDIT SALE
    ↓
    Cambias cantidad: 12 → 8
    ↓
    Recalcular reserva: libera 4, reasigna
    ↓
    Validar: ¿sigue siendo válido?
    SI NO → Error, restaura cantidad anterior
    ↓
COMPLETE SALE
    ↓
    Stock ya está reservado
    ↓
    Convertir reserva en movimiento REAL (OUT)
    ↓
    Estado: COMPLETED
```

**Ventajas:**
- ✅ Validación temprana (en CREATE)
- ✅ Stock nunca se queda inconsistente
- ✅ Otras ventas DRAFT ven el stock **real disponible**
- ✅ Flexible para cambios antes de completar

---

### Opción 2: "VALIDATE ON CREATE + SNAPSHOT" 

**Concepto**: Validar en CREATE pero no reservar; Tomar snapshot para auditoría

```
CREATE SALE
    ↓
    Validar: ¿Hay stock?
    SI NO → ERROR
    SI SÍ → Continuar
    ↓
    Guardar snapshot: {stock_cuando_se_creo: 20}
    ↓
    DRAFT (sin reserva)
    ↓
COMPLETE SALE
    ↓
    Validar OTRA VEZ con stock ACTUAL
    ↓
    Si cambió → mostrar advertencia
    SI OK → COMPLETAR
```

**Ventajas:**
- ✅ Más simple que Opción 1
- ✗ Menos protección (allow overbooking si no hay sincronización)

---

### Opción 3: "LOCK ON EDIT + VALIDATION CASCADE"

**Concepto**: Una venta puede estar en estado "LOCKED" que bloquea cambios

```
CREATE SALE (DRAFT - editable)
    ↓
LOCK SALE (preparación para completar)
    ↓
    Sistema valida:
    - ¿Stock disponible? (considerando todas las ventas DRAFT)
    - ¿Todos los campos completos?
    SI OK → Estado: "READY_TO_COMPLETE"
    SI NO → Error
    ↓
COMPLETE SALE (solo si está READY_TO_COMPLETE)
```

---

## 📋 Cambios Requeridos (Opción 1 Recomendada)

### Base de Datos

```sql
-- Nueva tabla para reservas
CREATE TABLE inventory_reservations (
  id UUID PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES sale_products(id),
  reserved_quantity INT NOT NULL,
  created_at TIMESTAMP,
  released_at TIMESTAMP NULL,
  UNIQUE(sale_id, product_id)
);

-- Tabla de stock disponible (vista materializada)
CREATE MATERIALIZED VIEW available_stock AS
SELECT 
  p.id,
  p.stock_quantity - COALESCE(SUM(r.reserved_quantity), 0) as available
FROM sale_products p
LEFT JOIN inventory_reservations r ON p.id = r.product_id AND r.released_at IS NULL
GROUP BY p.id;
```

### Backend - POS Service

```typescript
// Crear venta CON validación y reserva
async createSale(dto: CreateSaleDto, clinicId: string): Promise<Sale> {
  // Validar ANTES de crear
  for (const item of dto.items) {
    const product = await this.getProduct(item.productId);
    const available = await this.getAvailableStock(product.id);
    
    if (item.quantity > available) {
      throw new BadRequestException(
        `Stock insuficiente para ${product.name}. Disponible: ${available}`
      );
    }
  }
  
  // Crear sale
  const sale = new Sale();
  sale.items = dto.items;
  sale.status = 'DRAFT';
  sale.clinicId = clinicId;
  
  // Reservar stock
  for (const item of dto.items) {
    const reservation = new InventoryReservation();
    reservation.saleId = sale.id;
    reservation.productId = item.productId;
    reservation.reservedQuantity = item.quantity;
    await this.reservationRepository.save(reservation);
  }
  
  return await this.saleRepository.save(sale);
}

// Editar venta CON re-validación
async updateSale(id: string, dto: CreateSaleDto): Promise<Sale> {
  const sale = await this.getSale(id);
  
  if (sale.status !== 'DRAFT') {
    throw new ForbiddenException('Solo se pueden editar ventas en DRAFT');
  }
  
  // Validar nuevos items
  for (const item of dto.items) {
    const product = await this.getProduct(item.productId);
    const currentReservation = await this.getReservation(sale.id, item.productId);
    const available = await this.getAvailableStock(product.id);
    
    // Liberar reserva anterior
    if (currentReservation) {
      available += currentReservation.quantity;
    }
    
    if (item.quantity > available) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${available}`
      );
    }
  }
  
  // Actualizar reservas
  await this.updateReservations(sale.id, dto.items);
  
  // Guardar cambios
  sale.items = dto.items;
  return await this.saleRepository.save(sale);
}

// Completar venta (stock YA está reservado)
async completeSale(id: string): Promise<Sale> {
  const sale = await this.getSale(id, { relations: ['items'] });
  
  if (sale.status !== 'DRAFT') {
    throw new BadRequestException('Solo se pueden completar ventas en DRAFT');
  }
  
  // Stock YA está validado y reservado
  // Solo convertir reservas en movimientos reales
  
  const reservations = await this.getReservations(id);
  for (const reservation of reservations) {
    // Crear movimiento de inventario (OUT)
    const movement = new InventoryMovement();
    movement.productId = reservation.productId;
    movement.quantity = -reservation.reservedQuantity;
    movement.type = 'OUT';
    movement.saleId = sale.id;
    await this.movementRepository.save(movement);
    
    // Actualizar stock real
    await this.updateProductStock(reservation.productId, -reservation.reservedQuantity);
    
    // Marcar reserva como ejecutada
    reservation.releasedAt = new Date();
    await this.reservationRepository.save(reservation);
  }
  
  sale.status = 'COMPLETED';
  return await this.saleRepository.save(sale);
}
```

### Frontend - Validación en Tiempo Real

```typescript
// CreateSaleModal.tsx
const handleAddItem = async (productId: string, quantity: number) => {
  try {
    // Validar ANTES de agregar a la tabla
    const response = await fetch(`/api/pos/products/${productId}/available-stock`);
    const { available } = await response.json();
    
    if (quantity > available) {
      toast.error(`Stock insuficiente. Disponible: ${available}`);
      return;
    }
    
    // Agregar a la tabla
    const newItem = { productId, quantity, unitPrice };
    setItems([...items, newItem]);
  } catch (error) {
    toast.error('Error al validar stock');
  }
};

// Cuando el usuario cambia la cantidad
const handleQuantityChange = (index: number, newQuantity: number) => {
  const product = products.find(p => p.id === items[index].productId);
  const available = product?.availableStock || 0;
  
  if (newQuantity > available) {
    toast.error(`Stock insuficiente. Disponible: ${available}`);
    return; // No permite guardar
  }
  
  // Actualizar
  const newItems = [...items];
  newItems[index].quantity = newQuantity;
  setItems(newItems);
};
```

---

## 🎯 Propuesta Final

### Fase 1: Implementar Reservas (URGENTE)
- [ ] Crear tabla `inventory_reservations`
- [ ] Validar en CREATE (rechazar si stock insuficiente)
- [ ] Validar en UPDATE (re-calcular reservas)
- [ ] COMPLETE solo convierte reservas a movimientos
- **Tiempo: 2-3 horas**

### Fase 2: Mejorar UX
- [ ] Mostrar "Stock Disponible" vs "Total" en dropdown
- [ ] Mostrar advertencias si stock baja durante edición
- [ ] Bloquear edición si venta ya está "LOCKED"
- **Tiempo: 1-2 horas**

### Fase 3: Auditoría
- [ ] Crear reporte de reservas vs completadas
- [ ] Detectar inconsistencias
- [ ] Logs de cambios
- **Tiempo: 1 hora**

---

## 📊 Comparativa de Opciones

| Aspecto | Opción 1 (Reserve) | Opción 2 (Snapshot) | Opción 3 (Lock) |
|--------|-------------------|------------------|-----------------|
| Seguridad | ⭐⭐⭐ Muy Alta | ⭐⭐ Media | ⭐⭐⭐ Alta |
| Complejidad | Media | Baja | Media-Alta |
| Flexibilidad | ⭐⭐⭐ Alta | ⭐⭐ Media | ⭐ Baja |
| Velocidad Impl. | 3h | 1h | 2h |
| Uso Real | Tiendas Online | Pequeños POS | Tiendas Grandes |

---

## ✅ Recomendación

**Implementar Opción 1: RESERVE ON CREATE**

**Por qué:**
- ✅ Previene overbooking
- ✅ Stock siempre consistente
- ✅ Sigue el patrón de "transaction holds" de sistemas reales
- ✅ Fácil de auditar

---

## 🚀 Próximos Pasos

1. ✋ **PAUSAR** cambios en el módulo de ventas
2. 📋 **ARQUITECTO**: Revisar esta propuesta
3. 🔧 **IMPLEMENTAR**: Fase 1 (Reservas)
4. ✅ **TESTING**: Casos edge (overbooking, ediciones concurrentes)

**¿Procedo con la implementación de Opción 1?**

