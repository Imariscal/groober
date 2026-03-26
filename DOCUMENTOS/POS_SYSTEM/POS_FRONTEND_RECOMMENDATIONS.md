# POS Frontend - Recomendaciones de Implementación

## 🎯 Objetivo

Proporcionar una **experiencia de usuario clara y segura** en el POS, asegurando que el sistema backend (ya corregido) sea complementado por validaciones soft en frontend que mejoren el UX sin comprometer la seguridad.

---

## 📌 Regla Fundamental

> **La protección real está en el backend.** El frontend solo debe proporcionar retroalimentación al usuario. Ninguna validación en UI puede reemplazar las validaciones transaccionales en backend.

---

## 🎨 Cambios en UI por Flujo

### 1. CREATE SALE (DRAFT) - Pantalla de Carrito

#### Comportamiento Actual Incorrecto:
```
Usuario intenta agregar 25 unidades de "Dog Food" (stock visible = 20)
→ Error bloqueador: "Insufficient stock"
→ No puede crear el carrito
```

#### Comportamiento Corregido:
```
Usuario intenta agregar 25 unidades de "Dog Food" (stock visible = 20)
→ Permite agregarlo al carrito
→ Muestra advertencia visual: ⚠️ "Stock visible: 20, Solicitado: 25"
→ Carrito se crea normalmente (DRAFT)
→ Validación fuerte ocurre al completar
```

#### Cambios de Implementación

**Componente: ProductSelector / CartItems**

```typescript
// ANTES - Bloqueador
if (quantity > product.stockQuantity) {
  throw new Error('Insufficient stock');
}

// DESPUÉS - Advertencia soft
const stockWarning = quantity > product.stockQuantity 
  ? `⚠️ Stock visible: ${product.stockQuantity}. Solicitado: ${quantity}`
  : null;

// Renderizar advertencia pero permitir agregar
return (
  <div>
    <input 
      type="number" 
      onChange={(e) => handleQuantityChange(e.target.value)}
      disabled={false} {/* ← Siempre habilitado */}
    />
    {stockWarning && (
      <div className="warning">
        {stockWarning}
      </div>
    )}
    <button onClick={addToCart}>Agregar al carrito</button>
  </div>
);
```

**Estilo CSS:**
```css
.warning {
  background-color: #FFF3CD;
  border: 1px solid #FFE69C;
  color: #856404;
  padding: 8px 12px;
  border-radius: 4px;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.warning::before {
  content: "⚠️";
  font-size: 16px;
}
```

---

### 2. UPDATE SALE (DRAFT) - Editar Carrito

#### Comportamiento Actual Incorrecto:
```
Usuario tiene carrito con 5x "Cat Food" (stock = 10)
Intenta cambiar a 15x "Cat Food"
→ Error: "Insufficient stock"
→ No puede editar el carrito
```

#### Comportamiento Corregido:
```
Usuario tiene carrito con 5x "Cat Food" (stock = 10)
Intenta cambiar a 15x "Cat Food"
→ Permite el cambio
→ Muestra advertencia: ⚠️ "Stock visible: 10, Solicitado: 15"
→ Carrito actualizado (DRAFT)
→ Validación fuerte en completar
```

#### Implementación

**Componente: CartEditor**

```typescript
const handleQuantityUpdate = async (itemId: string, newQuantity: number) => {
  // 1. Validación soft (frontend)
  const product = products.find(p => p.id === item.productId);
  if (newQuantity > product.stockQuantity) {
    // Mostrar warning pero permitir
    setItemWarning(itemId, {
      message: `⚠️ Stock visible: ${product.stockQuantity}, Solicitado: ${newQuantity}`,
      type: 'warning'
    });
  } else {
    clearItemWarning(itemId);
  }

  // 2. Actualizar localmente
  updateCartItem(itemId, newQuantity);

  // 3. Actualizar en backend
  try {
    const response = await api.put(`/pos/sales/${saleId}`, {
      items: cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })),
      discountAmount: discount,
      taxAmount: tax,
    });

    if (response.status === 200) {
      // Éxito
      setSale(response.data);
    }
  } catch (error) {
    // No debería haber error de stock en UPDATE DRAFT
    handleError(error);
  }
};

return (
  <div className="cart-editor">
    {cartItems.map(item => (
      <div key={item.id} className="cart-item">
        <input 
          type="number"
          value={item.quantity}
          onChange={(e) => handleQuantityUpdate(item.id, parseInt(e.target.value))}
        />
        {itemWarnings[item.id] && (
          <div className="warning">{itemWarnings[item.id].message}</div>
        )}
        <button onClick={() => removeItem(item.id)}>Remover</button>
      </div>
    ))}
  </div>
);
```

---

### 3. COMPLETE SALE - Procesar Pago

#### Comportamiento Esperado

```
Usuario hace clic en "Procesar Pago / Completar Venta"
  ↓
[Validación en backend - TRANSACCIONAL]
  ↓
CASO A: Stock suficiente
  → Venta COMPLETADA
  → Muestra: "✓ Venta procesada exitosamente"
  → Refresca stock en UI
  → Inicia nueva venta
  ↓
CASO B: Stock insuficiente
  → Venta RECHAZADA
  → Muestra error detallado:
    "Stock insuficiente para Dog Food.
     Disponible: 5. Solicitado: 12"
  → Venta sigue en DRAFT
  → Usuario puede editar o cancelar
```

#### Implementación

**Componente: SaleCheckout / PaymentModal**

```typescript
const handleCompleteSale = async () => {
  // Deshabilitar botón
  setIsProcessing(true);
  setError(null);
  setSuccess(false);

  try {
    // Enviar a backend (que hará validación fuerte + transacción)
    const response = await api.patch(`/pos/sales/${saleId}/complete`, {
      items: cartItems,
      discountAmount: discount,
      taxAmount: tax,
      notes: saleNotes,
    });

    if (response.status === 200) {
      // ✓ Éxito - Venta COMPLETADA
      setSuccess(true);
      setSuccessMessage(`✓ Venta procesada exitosamente`);
      
      // Recargar stock en UI
      await refreshProducts();
      
      // Limpiar carrito y preparar nueva venta
      setTimeout(() => {
        resetCart();
        navigation.navigate('NewSale');
      }, 2000);
    }
  } catch (error: ApiError) {
    // ✗ Error del backend
    setIsProcessing(false);
    
    if (error.response?.status === 400) {
      // Validación fallida (stock insuficiente, producto inactivo, etc)
      const message = error.response.data?.message || 'Error al procesar venta';
      
      setError({
        type: 'validation',
        message: message,
        details: error.response.data?.details // Si hay detalles
      });
      
      // Mostrar modal con error
      showErrorModal({
        title: 'No se pudo completar la venta',
        message: message,
        details: `Los cambios en stock pueden haber ocurrido desde otra terminal.
                  Revisa la venta y intenta nuevamente.`,
        actions: [
          { label: 'Editar venta', onPress: closeModal },
          { label: 'Cancelar y nueva venta', onPress: () => resetCart() }
        ]
      });
    } else {
      // Error de conexión o servidor
      setError({
        type: 'network',
        message: 'Error de conexión. Intenta nuevamente.'
      });
    }
  }
};

return (
  <div className="checkout">
    {error && (
      <div className={`alert alert-${error.type}`}>
        <h3>⚠️ {error.type === 'validation' ? 'Validación' : 'Error'}</h3>
        <p>{error.message}</p>
        {error.details && <p className="details">{error.details}</p>}
      </div>
    )}

    {success && (
      <div className="alert alert-success">
        <h3>✓ {successMessage}</h3>
      </div>
    )}

    <button
      onClick={handleCompleteSale}
      disabled={isProcessing || cartItems.length === 0}
      className="btn-primary"
    >
      {isProcessing ? 'Procesando...' : 'Completar Venta'}
    </button>
  </div>
);
```

**Estilos:**

```css
.alert {
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 16px;
  border-left: 4px solid;
}

.alert-validation {
  background-color: #F8D7DA;
  border-left-color: #F5C6CB;
  color: #721C24;
}

.alert-success {
  background-color: #D4EDDA;
  border-left-color: #C3E6CB;
  color: #155724;
}

.alert-success h3::before {
  content: "✓ ";
  font-weight: bold;
}

.alert h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.alert p {
  margin: 4px 0;
  font-size: 14px;
}

.alert .details {
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.9;
  font-style: italic;
}
```

---

## 📊 Estados e Indicadores Visuales

### Indicador de Stock en Producto

```typescript
// ProductCard Component

interface StockIndicator {
  status: 'ok' | 'low' | 'critical' | 'out';
  label: string;
  color: string;
  icon: string;
}

const getStockStatus = (stock: number, minAlert: number): StockIndicator => {
  if (stock <= 0) {
    return { status: 'out', label: 'Sin stock', color: '#DC3545', icon: '✕' };
  }
  if (stock <= minAlert) {
    return { status: 'critical', label: 'Crítico', color: '#FFC107', icon: '!' };
  }
  if (stock <= minAlert * 1.5) {
    return { status: 'low', label: 'Bajo', color: '#FFC107', icon: '⚡' };
  }
  return { status: 'ok', label: 'En stock', color: '#28A745', icon: '✓' };
};

return (
  <div className="product-card">
    <div className="product-header">
      <h3>{product.name}</h3>
      <div className={`stock-badge status-${status.status}`}>
        <span>{status.icon}</span>
        <span>{status.label} ({product.stockQuantity})</span>
      </div>
    </div>
    
    {/* Indicador visual */}
    <div className="stock-bar">
      <div 
        className="stock-fill" 
        style={{
          width: `${Math.min(100, (product.stockQuantity / (product.minAlert * 2)) * 100)}%`,
          backgroundColor: status.color
        }}
      ></div>
    </div>
    
    {/* Información */}
    <p className="price">${product.salePrice}</p>
  </div>
);
```

**CSS:**

```css
.stock-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.stock-badge.status-ok {
  background-color: #D4EDDA;
  color: #155724;
}

.stock-badge.status-low {
  background-color: #FFF3CD;
  color: #856404;
}

.stock-badge.status-critical {
  background-color: #F8D7DA;
  color: #721C24;
}

.stock-badge.status-out {
  background-color: #E2E3E5;
  color: #383D41;
}

.stock-bar {
  height: 6px;
  background-color: #E9ECEF;
  border-radius: 3px;
  overflow: hidden;
  margin: 8px 0;
}

.stock-fill {
  height: 100%;
  transition: width 0.3s ease;
}
```

---

## 🔄 Flujo de Refrescamiento de Stock

Después de completar una venta, el stock puede haber cambiado (especialmente en multi-terminal):

```typescript
// Hook para refrescar stock periódicamente
const useStockRefresh = (productIds: string[]) => {
  const [products, setProducts] = useState<SaleProduct[]>([]);

  useEffect(() => {
    // Refrescar inmediatamente al abrir
    refreshProducts();

    // Refrescar cada 5 segundos si hay venta activa
    const interval = setInterval(refreshProducts, 5000);

    return () => clearInterval(interval);
  }, [productIds]);

  const refreshProducts = async () => {
    try {
      const response = await api.get('/pos/products', {
        params: { isActive: true }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error refreshing stock:', error);
    }
  };

  return { products, refreshProducts };
};

// Usar en SalesScreen
const { products, refreshProducts } = useStockRefresh(selectedProductIds);

// Refrescar después de completar venta
const handleCompleteSaleSuccess = async () => {
  await refreshProducts();
  // ... rest of logic
};
```

---

## ⚡ Manejo de Errores Backend

### Mensajes Esperados del Backend

```typescript
// Cuando stock es insuficiente en COMPLETE
{
  status: 400,
  data: {
    message: "Insufficient stock for product Dog Food. Available: 5. Requested: 12",
    code: "INSUFFICIENT_STOCK",
    product: {
      id: "prod-123",
      name: "Dog Food",
      currentStock: 5,
      requested: 12
    }
  }
}

// Cuando producto es inactivo
{
  status: 400,
  data: {
    message: "Product Dog Food is inactive and cannot be sold",
    code: "PRODUCT_INACTIVE",
    product: { id: "prod-123", name: "Dog Food" }
  }
}

// Cuando no se encuentra producto
{
  status: 404,
  data: {
    message: "Product not found",
    code: "PRODUCT_NOT_FOUND"
  }
}
```

### Mapeo de Errores a Mensajes de Usuario

```typescript
const getErrorMessage = (error: ApiError): string => {
  const code = error.response?.data?.code;
  
  switch (code) {
    case 'INSUFFICIENT_STOCK':
      const p = error.response?.data?.product;
      return `No hay suficiente stock de "${p.name}". ` +
             `Disponible: ${p.currentStock}, Solicitado: ${p.requested}.`;
    
    case 'PRODUCT_INACTIVE':
      return `El producto "${error.response?.data?.product?.name}" ` +
             `no está disponible para venta.`;
    
    case 'PRODUCT_NOT_FOUND':
      return `Un producto en la venta no fue encontrado. ` +
             `Verifica que los productos existan.`;
    
    case 'ONLY_DRAFT_SALES_CAN_BE_COMPLETED':
      return `Solo se pueden completar ventas sin procesar.`;
    
    case 'SALE_HAS_NO_ITEMS':
      return `La venta debe tener al menos un producto.`;
    
    case 'SALE_NOT_FOUND':
      return `La venta no fue encontrada. `;
    
    default:
      return `Error al procesar la venta. Intenta nuevamente.`;
  }
};
```

---

## 🎯 Flujo Visual - Diagrama UX

```
┌─────────────────────────────────────────────────────────┐
│ 1. SELECCIONAR PRODUCTOS                                │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Product: Dog Food                 [Stock Indicator]    │
│  Price: $15.99      ✓ En stock (25)                     │
│  Quantity: [3]                                           │
│  ⚠️ Stock visible: 25, Solicitado: 3 (soft warning)    │
│                                                           │
│                              [Agregar al carrito] ✓     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 2. EDITAR CARRITO (DRAFT)                              │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Carrito (DRAFT - Editable)                             │
│  • Dog Food x 3  @ $15.99 = $47.97                      │
│    [Qty] [Remove]                                        │
│    ⚠️ Stock visible: 25, Solicitado: 3                  │
│                                                           │
│ Subtotal:        $47.97                                 │
│ Descuento: -$4.80                                       │
│ Impuesto:  +$3.45                                       │
│ ────────────────────                                     │
│ Total:           $46.62                                 │
│                                                           │
│              [Completar Venta] →                        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 3. PROCESAR PAGO (Backend hace validación fuerte)      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ [Procesando pago...]                                    │
│                                                           │
│ Backend:                                                 │
│  • Inicia transacción                                   │
│  • Valida stock actual (puede haber cambiado)           │
│    - Dog Food: 25 >= 3 ✓                                │
│  • Decrementa stock (atómico)                           │
│    - Dog Food: 25 → 22                                  │
│  • Crea InventoryMovement (OUT, SALE)                   │
│  • Marca venta como COMPLETED                           │
│  • COMMIT ✓                                              │
│                                                           │
└─────────────────────────────────────────────────────────┘
                   ↓
        ┌──────────────────────┬──────────────────────┐
        │ ✓ ÉXITO              │ ✗ FALLO (Stock)      │
        ├──────────────────────┼──────────────────────┤
│        │ • Venta COMPLETADA   │ • Muestra error:    │
│        │ • Stock actualizado   │   "Stock insuf."    │
│        │ • Nueva venta        │ • Venta en DRAFT    │
│        │ • Stock refrescado   │ • Permite editar    │
│        └──────────────────────┴──────────────────────┘
```

---

## ✅ Resumen de Cambios Frontend

| Aspecto | ANTES | DESPUÉS |
|---------|-------|---------|
| **CREATE DRAFT** | Bloquea si qty > stock | Permite, muestra warning |
| **UPDATE DRAFT** | Bloquea si qty > stock | Permite, muestra warning |
| **Stock validator** | En frontend | En backend (transaccional) |
| **COMPLETE** | Puede tener race conditions | Transaccional, seguro |
| **Error handling** | Genérico | Específico con detalles |
| **Stock display** | Estático | Refresca periódicamente |
| **User feedback** | Mínimo | Claro y útil |

---

## 🚀 Checklist de Implementación Frontend

- [ ] Remover validación bloqueadora de stock en `createDraft`
- [ ] Remover validación bloqueadora de stock en `updateDraft`
- [ ] Agregar indicador visual soft de "Warning: stock visible vs solicitado"
- [ ] Actualizar handleCompleteSale para mostrar errores específicos
- [ ] Implementar refrescamiento de stock post-venta
- [ ] Crear componentes de error con detalles útiles
- [ ] Mapear códigos de error a mensajes legibles
- [ ] Probar flujo completo de multi-terminal (simulación)
- [ ] Validar que advertencias no bloqueen UX
- [ ] Documentar en guía de usuario

---

## 📱 Responsive & Accesibilidad

Asegurar que:
- ⚠️ Indicadores de warning sean visibles en móvil
- 🎯 Botones sean accesibles (alto contraste, tamaño)
- ♿ Usar atributos `aria-*` para screen readers
- 📝 Mensajes de error sean legibles y claros

