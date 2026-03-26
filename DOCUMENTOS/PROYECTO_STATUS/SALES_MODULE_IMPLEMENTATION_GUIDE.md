# 🛍️ Módulo de Ventas (Sales) - Guía de Implementación

## 📋 Estado Actual

**Fecha:** 10 de Marzo de 2026  
**Versión:** 1.0 - Master-Detail Funcional  
**Estado:** ✅ EN PRODUCCIÓN

---

## 🎯 Flujo Implementado: Master-Detail

### Arquitectura

```
┌─────────────────────────────────────────┐
│  SalesPage (page.tsx)                  │
│  - useSalesQuery() [TanStack Query]   │
│  - Estado global de ventas             │
│  - Filtros y búsqueda                 │
└──────────────┬──────────────────────────┘
               │
               ├─────────────────────────────────┐
               │                                 │
    ┌──────────▼──────────┐        ┌───────────▼────────────┐
    │ CreateSaleModal     │        │ EditSaleModal          │
    │ - Master Form       │        │ (TODO)                 │
    │ - Detail Table     │        │                        │
    │ - useCreateSale   │        └────────────────────────┘
    │   Mutation()       │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────────────────────────────┐
    │ API Backend (/api/pos/sales)               │
    │ - createSale()                             │
    │ - getSales()                               │
    │ - completeSale()                           │
    │ - cancelSale()                             │
    │ - refundSale()                             │
    └────────────────────────────────────────────┘
```

---

## 📦 Componentes Actualizados

### 1. **CreateSaleModal.tsx** ✅ COMPLETAMENTE REFACTORIZADO

**Cambios Principales:**
- ✅ Modal master-detail con dos secciones claras
- ✅ Cargar productos disponibles desde API
- ✅ Agregar múltiples ítems con formulario dinámico
- ✅ Tabla de productos agregados con edición y eliminación
- ✅ Cálculo automático de subtotal, descuentos, impuestos y total
- ✅ Integración con `useCreateSaleMutation()`
- ✅ Validación de datos antes de enviar

**Estructura:**

```tsx
<CreateSaleModal>
  ├─ Master Section (Información General)
  │  ├─ Tipo de Venta
  │  ├─ Cliente (Opcional)
  │  └─ Notas
  │
  ├─ Detail Add Form
  │  ├─ Selector Producto
  │  ├─ Cantidad
  │  ├─ Precio Unitario
  │  └─ Botón Agregar
  │
  ├─ Detail Table (Items)
  │  ├─ Producto
  │  ├─ Cantidad
  │  ├─ Precio Unit.
  │  ├─ Subtotal
  │  └─ Acciones (Eliminar)
  │
  └─ Summary (Totales)
     ├─ Subtotal
     ├─ Descuento (Editable)
     ├─ Impuesto (Editable)
     └─ TOTAL A PAGAR
```

**Ficheros Afectados:**
- `src/components/CreateSaleModal.tsx` - ✅ REFACTORIZADO

---

### 2. **SalesPage (page.tsx)** ✅ ACTUALIZADO

**Cambios Principales:**
- ✅ Reemplazar state local con `useSalesQuery()` de TanStack Query
- ✅ Mantener filtros y búsqueda localmente
- ✅ Callback `onSuccess` para refrescar datos automáticamente
- ✅ Estados de carga y error mejor manejados
- ✅ Transform API response a formato UI

**Transformación de Datos:**

```typescript
// API Response
SaleResponseDto {
  id: string;
  clinicId: string;
  status: 'DRAFT' | 'COMPLETED';
  totalAmount: number;
  items: SaleItemLineDto[];
  createdAt: Date;
  ...
}

// UI Format
Sale {
  id: string;
  date: string;          // From createdAt
  items: number;         // From items.length
  total: number;         // From totalAmount
  status: 'DRAFT' | 'COMPLETED';
  customerName: string;
  paymentMethod: string;
}
```

**Ficheros Afectados:**
- `src/app/(protected)/clinic/sales/page.tsx` - ✅ ACTUALIZADO

---

## 🔌 Endpoints y APIs

### Backend Endpoints

| Método | Endpoint | Permiso | Descripción |
|--------|----------|---------|-------------|
| POST | `/api/pos/sales` | `pos:sales:create` | Crear venta (DRAFT) |
| GET | `/api/pos/sales` | `pos:sales:read` | Listar ventas |
| GET | `/api/pos/sales/:id` | `pos:sales:read` | Obtener venta |
| PUT | `/api/pos/sales/:id` | `pos:sales:update` | Actualizar venta |
| PATCH | `/api/pos/sales/:id/complete` | `pos:sales:complete` | Completar venta |
| PATCH | `/api/pos/sales/:id/cancel` | `pos:sales:cancel` | Cancelar venta |
| PATCH | `/api/pos/sales/:id/refund` | `pos:sales:refund` | Reembolsar venta |
| POST | `/api/pos/sales/:id/payments` | `pos:payments:create` | Agregar pago |

### Frontend API Clients

**Archivo:** `src/lib/pos-api.ts`

```typescript
// VENTAS
createSale(dto: CreateSaleDto)              // ✅
getSales(filters?: Record<string, any>)     // ✅
getSaleById(saleId: string)                 // ✅
updateSale(saleId: string, dto)            // ✅
completeSale(saleId: string)                // ✅
cancelSale(saleId: string)                  // ✅
refundSale(saleId: string, reason?, amount?)  // ✅
addPayment(saleId: string, dto)            // ✅
```

### Custom Hooks (TanStack Query)

**Archivo:** `src/hooks/usePosMutations.ts`

```typescript
// Query Hooks
useSalesQuery(filters?: Record<string, any>)      // ✅
useSaleQuery(saleId: string)                      // ✅
useProductsQuery()                                 // ✅

// Mutation Hooks
useCreateSaleMutation()                           // ✅ USADO
useUpdateSaleMutation(saleId: string)             // TODO
useCompleteSaleMutation(saleId: string)           // TODO
useCancelSaleMutation(saleId: string)             // TODO
useRefundSaleMutation(saleId: string)             // TODO
```

---

## 📝 DTOs y Tipos

### CreateSaleDto (INPUT)

```typescript
{
  clinicId: string;           // Requerido
  clientId?: string;          // Opcional
  appointmentId?: string;     // Opcional
  saleType?: 'POS' | 'APPOINTMENT_ADDON';
  items: [{                   // Requerido: Al menos 1
    productId: string;        // UUID del producto
    quantity: number;         // > 0
    unitPrice: number;        // > 0
  }];
  discountAmount?: number;    // >= 0
  taxAmount?: number;         // >= 0
  notes?: string;             // Texto libre
  createdByUserId?: string;   // Opcional
}
```

### SaleResponseDto (OUTPUT)

```typescript
{
  id: string;                 // UUID generado
  clinicId: string;
  clientId?: string;
  appointmentId?: string;
  saleType: string;
  status: 'DRAFT' | 'COMPLETED';
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;        // = subtotal - discount + tax
  notes?: string;
  soldAt?: Date;              // Solo si COMPLETED
  createdAt: Date;
  updatedAt: Date;
}
```

---

## ✅ Flujo de Uso Paso a Paso

### Crear una Venta (Master-Detail)

**1. Usuario Abre Modal**
```tsx
<button onClick={() => setIsCreateModalOpen(true)}>
  Nueva Venta
</button>
```

**2. Modal Carga Productos**
```typescript
const { data: products } = useProductsQuery();
// Llama a: GET /api/pos/products
```

**3. Usuario Completa Master**
- Selecciona tipo de venta (POS / APPOINTMENT_ADDON)
- Opcionalmente selecciona cliente
- Agrega notas

**4. Usuario Agrega Details (Ítems)**
```typescript
// Para cada item:
newItem = {
  productId: "uuid-123",
  quantity: 2,
  unitPrice: 25.00
}
// Click "Agregar" → Valida → Agrega a tabla
```

**5. Usuario Edita Totales**
- Puede aplicar descuentos
- Puede agregar impuestos
- Ve total actualizado automáticamente

**6. Usuario Confirma Venta**
```typescript
await createSaleMutation.mutateAsync({
  clinicId: "clinic-uuid",
  saleType: "POS",
  clientId: undefined,
  items: [
    { productId: "...", quantity: 2, unitPrice: 25 }
  ],
  discountAmount: 5,
  taxAmount: 0,
  notes: "Venta de demostración"
});
// POST /api/pos/sales
// Response: SaleResponseDto { id, status: "DRAFT", ... }
```

**7. Modal Cierra y Página Refresca**
```typescript
onSuccess?.();  // Callback
refetch();      // Recarga useSalesQuery()
toast.success('Venta creada exitosamente');
```

---

## 🚀 Funcionalidades Completadas

| Funcionalidad | Estado | Notas |
|---------------|--------|-------|
| Crear venta (modal master-detail) | ✅ | Completamente funcional |
| Agregar múltiples productos | ✅ | Con validación |
| Cargar productos de inventario | ✅ | Desde API |
| Calcular totales automáticamente | ✅ | Subtotal, descuento, impuesto |
| Listar ventas | ✅ | Con TanStack Query |
| Filtrar por estado | ✅ | DRAFT / COMPLETED |
| Buscar por nombre/ID | ✅ | Local filtering |
| Ver estadísticas | ✅ | Total, completadas, borradores |
| Refrescar datos | ✅ | Manual + automático al crear |

---

## 🔧 Funcionalidades TODO

| Funcionalidad | Descripción | Prioridad |
|---------------|-------------|-----------|
| Editar venta | Modal EditSaleModal | Alta |
| Completar venta | PATCH /sales/:id/complete | Alta |
| Cancelar venta | PATCH /sales/:id/cancel | Media |
| Reembolsar venta | PATCH /sales/:id/refund | Media |
| Registrar pago | POST /sales/:id/payments | Media |
| Reportes de ventas | GET /sales-report | Baja |
| Vista detalle de venta | Página /sales/:id | Media |
| Exportar a PDF | Print/Download | Baja |

---

## 🧪 Pruebas Manual

### Test 1: Crear Venta Simple
1. Abrir página `/clinic/sales`
2. Click "Nueva Venta"
3. Seleccionar producto del dropdown
4. Ingresar cantidad (ej: 2)
5. Verificar que unitPrice se llena automáticamente
6. Click "Agregar"
7. Verificar que producto aparece en tabla
8. Click "Crear Venta"
9. Verificar que modal cierra y venta aparece en lista

### Test 2: Creación con Múltiples Productos
1. Agregar 3 productos diferentes
2. Variar cantidades y precios
3. Verificar que subtotal se suma correctamente
4. Agregar descuento de 10
5. Agregar impuesto de 5
6. Verificar cálculo: (subtotal - descuento + impuesto)
7. Crear venta

### Test 3: Validaciones
1. Intentar crear sin productos → Error
2. Intentar agregar producto con cantidad 0 → Error
3. Intentar agregar producto con precio 0 → Error
4. Seleccionar producto y deseleccionar → Validar

---

## 📚 Archivos y Líneas Clave

### CreateSaleModal.tsx
- **Master Section:** Líneas 130-170 (Seleccionar tipo, cliente, notas)
- **Detail Form:** Líneas 175-210 (Agregar productos)
- **Detail Table:** Líneas 215-250 (Mostrar items)
- **Summary:** Líneas 255-290 (Totales)
- **Submit Handler:** Línea 110-128 (createSaleMutation)

### SalesPage
- **Query Hook:** Línea 43 (useSalesQuery)
- **Transform Data:** Líneas 48-65 (API to UI)
- **Refetch Handler:** Línea 72 (handleCreateSaleSuccess)
- **Stats Calculation:** Líneas 113-119

---

## 🔐 Permisos Requeridos

```typescript
'pos:sales:create'   // Crear ventas
'pos:sales:read'     // Ver ventas
'pos:sales:update'   // Editar ventas
'pos:products:read'  // Ver productos (para dropdown)
```

---

## 📊 Estructura DTO por Cambios

### Antes (Mock Data)
```typescript
interface Sale {
  id: string;
  date: string;
  items: number;
  total: number;
  status: 'DRAFT' | 'COMPLETED';
  customerName?: string;
  paymentMethod?: string;
}
```

### Después (API Real)
```typescript
// Usa SaleResponseDto del backend
// Se transforma a Sale UI en useMemo
const sales = salesData.data?.map(sale => ({
  ...transform
}))
```

---

## 🎨 UI/UX Improvements Realizados

✅ Modal expandido a `max-w-4xl` (era `max-w-2xl`)  
✅ Encabezado con gradiente primario mejorado  
✅ Sección master y detail claramente separadas  
✅ Tabla de items con acciones inline  
✅ Resumen de totales con destaque visual  
✅ Loading state mejorado  
✅ Mensajes de error/éxito claros  
✅ Responsive: mobile, tablet, desktop  

---

## 🐛 Debugging Tips

### Si el modal no carga productos:
```typescript
// Verificar que useProductsQuery() retorna datos
const { data: products, isPending, error } = useProductsQuery();
console.log('Products:', products, 'Error:', error);
```

### Si la venta no se crea:
```typescript
// Verificar que createSaleMutation ejecuta sin error
createSaleMutation.mutateAsync(dto)
  .then(res => console.log('Created:', res))
  .catch(err => console.error('Error:', err));
```

### Si la página no refresca:
```typescript
// Verificar que refetch() se ejecuta
const { refetch } = useSalesQuery();
await refetch();
```

---

**Versión:** 1.0  
**Última Actualización:** 10 Mar 2026  
**Autor:** GitHub Copilot  
**Estado:** ✅ Completado y Funcional
