# 🎨 POS FRONTEND - IMPLEMENTACIÓN DE LA REGLA DE ORO

## 📌 Resumen Ejecutivo

El frontend debe:
1. **Mostrar estado** de la venta claramente
2. **Deshabilitar botones** según el estado (DRAFT vs no-DRAFT)
3. **Capturar errores 400** y mostrar mensajes amigables
4. **NO validar inventario** en el cliente (eso está en backend)

---

## 🎯 Implementación Paso a Paso

### Paso 1: Estado Global / Store

Si usas Zustand, Redux, o Context:

```typescript
// store/saleStore.ts
interface Sale {
  id: string;
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  createdAt: Date;
}

interface SaleState {
  sale: Sale | null;
  isLoading: boolean;
  error: string | null;
  setSale: (sale: Sale) => void;
  updateSale: (updates: Partial<Sale>) => void;
  clearError: () => void;
}

export const useSaleStore = create<SaleState>((set) => ({
  sale: null,
  isLoading: false,
  error: null,
  setSale: (sale) => set({ sale }),
  updateSale: (updates) => 
    set((state) => ({
      sale: state.sale ? { ...state.sale, ...updates } : null
    })),
  clearError: () => set({ error: null }),
}));
```

### Paso 2: Componente de Botones - Vista Contextual

```typescript
// components/SaleActions.tsx
import { BadRequestException } from '@nestjs/common';
import { useSaleStore } from '@/store/saleStore';

interface SaleActionsProps {
  saleId: string;
  onEditComplete?: () => void;
  onCancelComplete?: () => void;
  onCompleteComplete?: () => void;
  onRefundComplete?: () => void;
}

export function SaleActions({
  saleId,
  onEditComplete,
  onCancelComplete,
  onCompleteComplete,
  onRefundComplete,
}: SaleActionsProps) {
  const { sale, error, clearError } = useSaleStore();
  
  if (!sale) {
    return <div className="text-gray-500">Cargando venta...</div>;
  }

  const isDraft = sale.status === 'DRAFT';
  const isCompleted = sale.status === 'COMPLETED';
  const isFinal = ['CANCELLED', 'REFUNDED'].includes(sale.status);

  const handleError = (err: any) => {
    if (err.response?.status === 400) {
      // Backend rechazó la operación
      const message = err.response.data.message;
      console.error('Operación no permitida:', message);
      // Mostrar toast o modal con el mensaje
      showErrorToast(message);
    } else {
      showErrorToast('Error inesperado');
    }
    clearError();
  };

  return (
    <div className="flex gap-2">
      {/* Botones solo para DRAFT */}
      {isDraft && (
        <>
          <button
            onClick={() => openEditModal(saleId)}
            className="btn btn-primary"
            title="Editar items, cantidades y precios"
          >
            ✏️ Editar
          </button>
          
          <button
            onClick={async () => {
              try {
                await api.patch(`/pos/sales/${saleId}/cancel`);
                onCancelComplete?.();
              } catch (err) {
                handleError(err);
              }
            }}
            className="btn btn-warning"
            title="Cancelar esta venta"
          >
            ❌ Cancelar
          </button>

          <button
            onClick={async () => {
              try {
                await api.patch(`/pos/sales/${saleId}/complete`);
                onCompleteComplete?.();
              } catch (err) {
                handleError(err);
              }
            }}
            className="btn btn-success"
            title="Procesar pago"
          >
            ✅ Completar Venta
          </button>
        </>
      )}

      {/* Botón SOLO para COMPLETED */}
      {isCompleted && (
        <button
          onClick={async () => {
            const confirmed = await confirmDialog(
              '¿Desea reembolsar esta venta?',
              'Se restaurará el inventario'
            );
            if (confirmed) {
              try {
                await api.patch(`/pos/sales/${saleId}/refund`);
                onRefundComplete?.();
              } catch (err) {
                handleError(err);
              }
            }
          }}
          className="btn btn-info"
          title="Devolver los items y restaurar inventario"
        >
            💰 Reembolsar
          </button>
      )}

      {/* Mensajes para estados finales */}
      {isFinal && (
        <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded">
          <span className="text-xl">
            {sale.status === 'CANCELLED' ? '⛔' : '♻️'}
          </span>
          <span>
            Esta venta no puede ser modificada
            ({sale.status})
          </span>
        </div>
      )}
    </div>
  );
}
```

### Paso 3: Badge de Estado

```typescript
// components/SaleStatusBadge.tsx
interface SaleStatusBadgeProps {
  status: Sale['status'];
  size?: 'sm' | 'md' | 'lg';
}

export function SaleStatusBadge({ 
  status, 
  size = 'md' 
}: SaleStatusBadgeProps) {
  const config = {
    DRAFT: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      label: 'Borrador',
      icon: '📝',
      tip: 'Venta en edición - no afecta inventario'
    },
    COMPLETED: {
      color: 'bg-green-100 text-green-800 border-green-300',
      label: 'Completada',
      icon: '✅',
      tip: 'Venta finalizada - inventario comprometido'
    },
    CANCELLED: {
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      label: 'Cancelada',
      icon: '⛔',
      tip: 'Venta anulada - sin impacto en inventario'
    },
    REFUNDED: {
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      label: 'Reembolsada',
      icon: '♻️',
      tip: 'Venta revertida - inventario restaurado'
    },
  };

  const cfg = config[status];
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  return (
    <div
      className={`
        inline-flex items-center gap-1 rounded-full border 
        font-semibold ${cfg.color} ${sizeClasses[size]}
        cursor-help
      `}
      title={cfg.tip}
    >
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </div>
  );
}
```

### Paso 4: Carrito/Detalles - Mostrar Estado

```typescript
// components/SaleDetails.tsx
export function SaleDetails({ saleId }: { saleId: string }) {
  const { sale, isLoading } = useSaleStore();

  if (isLoading) return <div>Cargando...</div>;
  if (!sale) return <div>Venta no encontrada</div>;

  const showEditWarning = sale.status !== 'DRAFT';

  return (
    <div className="space-y-4">
      {/* Header con estado */}
      <div className="flex justify-between items-center p-4 bg-white rounded shadow">
        <div>
          <h2 className="text-xl font-bold"># {sale.id}</h2>
          <p className="text-sm text-gray-500">
            Creada: {new Date(sale.createdAt).toLocaleString()}
          </p>
        </div>
        <SaleStatusBadge status={sale.status} size="lg" />
      </div>

      {/* Advertencia si no es DRAFT */}
      {showEditWarning && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded text-blue-900 text-sm">
          <p className="font-semibold">ℹ️ Venta Finalizada</p>
          <p>
            No se pueden realizar cambios. 
            {sale.status === 'COMPLETED' && ' Use "Reembolsar" si necesita revertir esta venta.'}
          </p>
        </div>
      )}

      {/* Items */}
      <div className="space-y-2">
        <h3 className="font-bold">Items ({sale.items.length})</h3>
        {sale.items.map((item) => (
          <div key={item.id} className="flex justify-between p-2 bg-gray-50 rounded">
            <div>
              <p className="font-semibold">{item.productName}</p>
              <p className="text-sm text-gray-600">
                {item.quantity} × ${item.unitPrice.toFixed(2)}
              </p>
            </div>
            <p className="font-bold">${item.subtotal.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div className="p-4 bg-gray-50 rounded space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${sale.subtotal.toFixed(2)}</span>
        </div>
        {sale.discountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Descuento:</span>
            <span>-${sale.discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Total:</span>
          <span>${sale.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Botones de acción */}
      <SaleActions saleId={sale.id} />
    </div>
  );
}
```

### Paso 5: Manejo de Errores HTTP 400

```typescript
// utils/apiClient.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 400) {
      // Error de validación del backend
      const message = error.response.data.message;
      
      // Detectar por qué fue rechazada
      if (message.includes('Cannot edit sale')) {
        console.error(
          '❌ No se puede editar esta venta. Solo borradores son editables.'
        );
      } else if (message.includes('Cannot cancel sale')) {
        console.error(
          '❌ No se puede cancelar. Use Reembolsar para ventas completadas.'
        );
      } else if (message.includes('Only draft sales')) {
        console.error('❌ Solo se pueden modificar borradores.');
      }
      
      // Las operaciones en pos.controller ya han sido validadas
      // Mostrar el mensaje del backend directamente
      showUserMessage({
        type: 'error',
        title: 'Operación no permitida',
        message: message,
        duration: 5000,
      });
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Paso 6: Validación en Formulario de Edición

```typescript
// components/EditSaleModal.tsx
export function EditSaleModal({
  saleId,
  onClose,
}: {
  saleId: string;
  onClose: () => void;
}) {
  const { sale, updateSale } = useSaleStore();

  // ⚠️ NO hacer validación de inventario aquí
  // El backend lo maneja y solo permite completar si hay stock
  
  const handleSave = async (formData: any) => {
    try {
      const response = await api.put(`/pos/sales/${saleId}`, {
        items: formData.items,
        discountAmount: formData.discountAmount,
      });

      updateSale({
        items: response.data.items,
        discountAmount: response.data.discountAmount,
        total: response.data.total,
      });

      onClose();
      showSuccessToast('Venta actualizada');
    } catch (error) {
      // El interceptor manejaerrorResponse
      if (error.response?.status === 400) {
        // Ya fue mostrado por el interceptor
        return;
      }
      showErrorToast('Error al actualizar');
    }
  };

  return (
    <Modal isOpen onClose={onClose}>
      <div className="space-y-4 p-4">
        <h2 className="text-xl font-bold">Editar Venta</h2>
        <SaleEditForm
          initialData={sale}
          onSubmit={handleSave}
          isLoading={false}
        />
      </div>
    </Modal>
  );
}
```

---

## 🎨 Estilos CSS (Tailwind)

```css
/* Colores por estado */
.badge-draft {
  @apply bg-yellow-100 text-yellow-800 border border-yellow-300;
}

.badge-completed {
  @apply bg-green-100 text-green-800 border border-green-300;
}

.badge-cancelled {
  @apply bg-gray-100 text-gray-800 border border-gray-300;
}

.badge-refunded {
  @apply bg-blue-100 text-blue-800 border border-blue-300;
}

/* Botones deshabilitados */
button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Alertas de estado */
.alert-info {
  @apply bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded;
}

.alert-warning {
  @apply bg-yellow-50 border border-yellow-200 text-yellow-900 p-3 rounded;
}
```

---

## 📋 Checklist de Implementación

```
[ ] Crear store/saleStore.ts con estado global
[ ] Implementar SaleActions.tsx con botones contextuales
[ ] Implementar SaleStatusBadge.tsx
[ ] Implementar SaleDetails.tsx
[ ] Actualizar API interceptor para manejar errores 400
[ ] Agregar validación en EditSaleModal
[ ] Crear componentes de notificación (toast/modal)
[ ] Probar flujo DRAFT → COMPLETED
[ ] Probar flujo DRAFT → CANCELLED
[ ] Probar error al intentar editar COMPLETED
[ ] Probar error al intentar cancelar COMPLETED
[ ] Probar refund en COMPLETED
```

---

## 🧪 Tests E2E Recomendados

```typescript
// tests/pos.e2e.spec.ts
describe('POS Sales Flow', () => {
  
  test('Can edit DRAFT sale', async () => {
    const sale = await createDraftSale();
    // Botones de editar deben estar enabled
    expect(screen.getByText('Editar')).not.toBeDisabled();
    
    await userEvent.click(screen.getByText('Editar'));
    // Modal abre sin problemas
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('Cannot edit COMPLETED sale', async () => {
    const sale = await createAndCompleteSale();
    // Botones de editar deben estar disabled
    expect(screen.getByText('Editar')).toBeDisabled();
    
    // Si intenta de todas formas en HTTP
    const response = await api.put(`/pos/sales/${sale.id}`, {...});
    expect(response.status).toBe(400);
    expect(response.data.message).toContain('Cannot edit sale');
  });

  test('Cannot cancel COMPLETED sale', async () => {
    const sale = await createAndCompleteSale();
    expect(screen.getByText('Cancelar')).toBeDisabled();
    
    const response = await api.patch(`/pos/sales/${sale.id}/cancel`);
    expect(response.status).toBe(400);
    expect(response.data.message).toContain('Cannot cancel sale');
  });

  test('Can refund COMPLETED sale', async () => {
    const sale = await createAndCompleteSale();
    expect(screen.getByText('Reembolsar')).not.toBeDisabled();
    
    await userEvent.click(screen.getByText('Reembolsar'));
    await userEvent.click(screen.getByText('Aceptar'));
    
    // Status debe cambiar a REFUNDED
    expect(screen.getByText(/Reembolsada/)).toBeInTheDocument();
  });

});
```

---

## 🚀 Deployment

**Antes de hacer deploy:**
1. ✅ Backend compilado sin errores
2. ✅ Backend tests pasando
3. ✅ Frontend tests pasando
4. ✅ E2E tests en staging pasando
5. ✅ Validar regla de oro en interfaz

**Comando para verificar:**
```bash
# Clonar fronted repo
cd vibralive-frontend

# Instalar
npm install

# Compilar
npm run build

# Tests
npm run test

# E2E
npm run test:e2e
```

---

**Versión:** 1.0  
**Actualizado:** Marzo 11, 2026  
**Dirigido a:** Frontend Team
