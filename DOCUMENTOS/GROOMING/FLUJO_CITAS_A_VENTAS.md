# 🛒 Flujo: Citas a Ventas (Grooming)

## ✅ Implementación Completada

El sistema ahora permite convertir **citas completadas de grooming** en **ventas draft** para agregar artículos retail y procesar pagos.

---

## 📋 Flujo de Uso

### Paso 1: Completar una Cita de Grooming
- Accede a **Grooming → Citas**
- Completa la cita con servicios (baño, corte, etc.)
- Marca como **COMPLETED**

### Paso 2: Ir a "Por Cobrar"
- Sidebar: **Grooming → Por Cobrar** (nuevo item)
- Se muestran todas las citas completadas listas para facturar
- Muestra automáticamente:
  - Fecha y hora de la cita
  - Nombre de la mascota y cliente
  - Cantidad de servicios
  - **Total de servicios** (precalculado)

### Paso 3: Generar Venta
- Click botón **"Generar Venta"** en la cita
- Sistema automáticamente:
  - ✅ Crea una venta **DRAFT**
  - ✅ Convierte servicios de la cita → Items de la venta
  - ✅ Precarga precios congelados (`priceAtBooking`)
  - ✅ Se vincula con la cita (`appointmentId`)
  - ✅ Abre modal de edición de venta

### Paso 4: Agregar Artículos Retail (Opcional)
En el modal de venta, puedes:
- ✅ Agregar **productos retail** (champú, juguetes, etc.)
- ✅ El inventario se valida automáticamente
- ✅ Se rechaza si no hay stock
- ✅ Calcula total final

### Paso 5: Completar Pago
- Click **"Completar Venta"**
- Sistema:
  1. Valida inventario de **TODOS los items** (servicios + retail)
  2. Decrementa stock atómicamente por cada producto
  3. Crea registro de movimiento de inventario
  4. Marca venta como **COMPLETED**
  5. Guarda en BD para reportes

### Paso 6: Reportes
- Dashboard → Reportes → **Grooming/Ventas**
- Verás:
  - Ingresos por servicios
  - Ingresos por retail
  - Desglose de artículos vendidos
  - Inventario disponible

---

## 🔐 Permisos Requeridos

Para acceder a "Por Cobrar", el usuario necesita el permiso:
```
pos:sales:create
```

Asigna esto en **Sistema → Seguridad → Roles y Permisos**

---

## 🗄️ Datos en Base de Datos

### Nuevas Columnas en `sale_items`
```
service_id              UUID, nullable    → Referencia a Services
appointment_item_id     UUID, nullable    → Rastraea origen de la venta
product_id              UUID, nullable    → Ahora nullable (era obligatorio)
```

### Relaciones Establecidas
```
Sale → Appointment (1:1 via appointmentId)
Sale.items → AppointmentItem (rastreable via appointmentItemId)
SaleItem → Service (nueva relación para servicios)
```

### Tipos de Venta
```
saleType = 'APPOINTMENT_ADDON'  → Ventas desde citas


saleType = 'POS'                → Ventas manuales (punto de venta)
```

---

## 🔄 Flujo Técnico Backend

### Endpoint Nuevo
```
POST /pos/sales/from-appointment/:appointmentId
```

**Request Parameters:**
- `appointmentId` (path param, UUID)

**Response:**
```json
{
  "id": "uuid",
  "appointmentId": "uuid",
  "clientId": "uuid",
  "saleType": "APPOINTMENT_ADDON",
  "status": "DRAFT",
  "subtotal": 450.00,
  "totalAmount": 450.00,
  "items": [
    {
      "id": "uuid",
      "serviceId": "uuid",
      "appointmentItemId": "uuid",
      "quantity": 1,
      "unitPrice": 150.00,
      "subtotal": 150.00
    }
  ]
}
```

###Validaciones en Backend
```typescript
✓ Appointment existe en la clínica
✓ Appointment.status === 'COMPLETED'
✓ Appointment.serviceType === 'GROOMING'
✓ No existe sale previa para este appointment
✓ AppointmentItems se convierten correctamente
✓ Servicios existen y tienen precioscongelados
```

---

## 🎨 UI/UX Changes

### Nuevo Item en Menú
```
Grooming/
  ├─ Citas
  ├─ Por Cobrar         ← NUEVO
  ├─ Ruteo
  └─ Servicios
```

### Página: `/clinic/grooming/pending-sales`
- ✅ Listado de citas COMPLETED sin venta
- ✅ Muestra total de servicios
- ✅ Botón "Generar Venta" por cita
- ✅ Estado vacío cuando todas están procesadas

### Modal de Venta (Reutilizado)
- ✅ Modo "Editar Venta" cuando se carga sale existente
- ✅ Soporta agregar más productos retail
- ✅ Valida inventario antes de completar

---

## 📊 Auditoría & Reportes

### Tracking Completo
```
Cita (appointment)
  → id: uuid
  → serviceType: 'GROOMING'
  → status: 'COMPLETED'
  
Venta (sale)
  → appointmentId: uuid (referencia)
  → saleType: 'APPOINTMENT_ADDON'
  → status: 'DRAFT' → 'COMPLETED'
  → createdAt, soldAt, cancelledAt
  
Items de Venta (sale_items)
  → appointmentItemId: uuid (rastreo origen)
  → serviceId: uuid (qué servicio se vendió)
  → priceAtBooking: decimal (precio congelado)
  → inventory_movements (registro de stock)
```

### Reportes Disponibles
```
Por Appointment:
  → ¿Cuál es el ingreso de cada cita?
  → ¿Qué servicios se vendieron?
  → ¿Qué artículos adicionales se agregaron?

Por Cliente:
  → Historial completo de citas + ventas
  → Ingresos acumulados

Por Período:
  → Ingresos por servicios
  → Ingresos por retail
  → Comparativa citas vs ingresos
```

---

## ⚠️ Consideraciones Importantes

### 1. Citas sin Servicios
Si una cita NO tiene `AppointmentItems`, la venta se crea DRAFT pero VACÍA.
El usuarios debe agregar Al menos un producto antes de completar.

### 2. Precios Congelados
Los precios de servicios se toman de `priceAtBooking` (congelados al momento de la cita).
Son **inmutables** incluso si los precios maestros cambian después.

### 3. Inventario & Servicios
- **Servicios**: No afectan inventario (son servicios, no productos físicos)
- **Retail**: SI afecta inventario cuando se completa la venta
- La validación sucede en `completeSale()` (no al crear draft)

### 4. Cancelación & Devolución
Una venta completada puede:
- ✅ Cancelarse (reversa stock, status = CANCELLED)
- ✅ Devolverse (reembolso, status = REFUNDED)
Pero **requiere permiso especial**: `pos:sales:cancel` / `pos:sales:refund`

---

## 🚀 Próximas Mejoras (Futuro)

1. **Auto-generación**: Completar cita → Venta automática
2. **Plantillas de Retail**: "Después de baño: ofrecer..." 
3. **Recordatorios**: "¿Cliente compró algo?" popup
4. **Recomendaciones IA**: Sugerir artículos basado en historial
5. **Integración Pagos**: Stripe/PayPal directamente en modal
6. **Recibos**: Imprimir o enviar por WhatsApp

---

## 📱 Restricción Importante

El sistema actualmente **solo soporta citas GROOMING**.
¿Citas MEDICAL? Se descarta automáticamente con validación clara.

Se puede extender facilmente en el futuro si se necesita.

---

## ✨ Resumen

| Antes | Después |✨
|-------|---------|
| Cita → fin | Cita → Venta Draft → Agregar retail → Pagar |
| Sin tracking | appointment_id rastreable en venta |
| Manual POS | Semiautomático desde grooming |
| Precios dinámicos | Precios congelados de la cita |
| Sin inventario (servicios) | Validación de stock en retail |

**Impacto**: Flujo end-to-end para monetizar citas de grooming con flexibility de agregar venta retail. ✅
