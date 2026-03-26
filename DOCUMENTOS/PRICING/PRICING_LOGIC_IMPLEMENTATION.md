# 💰 Lógica de Precios - Lista, Servicios y Paquetes

## 📋 Resumen de Requisitos

### 1. Estructura de Precios en Listas
```
PriceList
├── ServicePrice (Precio = valor asignado)
└── PackagePrice (Precio = suma de todos los servicios del paquete)
```

### 2. Actualización en Cascada

#### 2.1️⃣ Cuando se actualiza el precio de un SERVICIO:
- ✅ Actualizar el precio en la **DEFAULT price list**
- ✅ Actualizar automáticamente el precio de todos los **PAQUETES que contienen ese servicio** en TODAS las listas de precios
- ✅ El nuevo precio del paquete = suma de todos sus servicios * cantidad

#### 2.2️⃣ Cuando se AGREGA un servicio a un PAQUETE:
- ✅ Recalcular el precio total del paquete
- ✅ Actualizar en TODAS las listas de precios donde existe el paquete
- ✅ El nuevo precio = suma de todos los servicios (con sus cantidades)

#### 2.3️⃣ Cuando se ELIMINA un servicio de un PAQUETE:
- ✅ Recalcular el precio total del paquete
- ✅ Actualizar en TODAS las listas de precios donde existe el paquete

#### 2.4️⃣ Cuando se MODIFICA la cantidad de un servicio en un PAQUETE:
- ✅ Recalcular el precio total del paquete
- ✅ Actualizar en TODAS las listas de precios donde existe el paquete

---

## 🔧 Implementación

### Phase 1: Services (ALREADY DONE)
```typescript
// services.service.ts - updateService()
if (dto.price !== undefined) {
  // Update DEFAULT price list (already implemented ✓)
  // Find all packages containing this service
  // Recalculate their prices in all price lists
}
```

### Phase 2: Packages (TO IMPLEMENT)

#### 2.1 Add method: `calculatePackagePrice()`
```typescript
async calculatePackagePrice(
  clinicId: string,
  packageId: string
): Promise<number>
```
- Obtiene todos los items del paquete
- Para cada item, obtiene el precio del servicio en default price list
- Suma: (price * quantity) para cada item
- Retorna el total

#### 2.2 Add method: `updatePackagePricesInAllLists()`
```typescript
async updatePackagePricesInAllLists(
  clinicId: string,
  packageId: string,
  newPrice: number
): Promise<void>
```
- Encuentra todos los ServicePackagePrice para este paquete
- Actualiza el precio en TODAS las listas
- Registra en historial (si existe)

#### 2.3 Modify: `updatePackage()`
```typescript
async updatePackage(clinicId, packageId, dto) {
  // ... existing code ...
  
  // If items changed, recalculate price
  if (dto.items) {
    const newPrice = await this.calculatePackagePrice(clinicId, packageId);
    await this.updatePackagePricesInAllLists(clinicId, packageId, newPrice);
  }
}
```

---

## 📊 Ejemplos de Flujo

### Ejemplo 1: Actualizar precio de un servicio
```
Baño Gato: $50 → $60

1. serviceRepo.save(service, { price: 60 })
2. Actualizar DEFAULT price list: Baño Gato = $60 ✓
3. Encontrar paquetes que contienen "Baño Gato":
   - "Baño + Corte": Baño ($60) + Corte ($30) = $90 (antes era $80)
   - "Baño + Premium": Baño ($60) + Premium ($100) = $160 (antes era $150)
4. Actualizar en TODAS las listas de precios:
   - DEFAULT: "Baño + Corte" = $90, "Baño + Premium" = $160
   - VIP: "Baño + Corte" = $95 (VIP markup), "Baño + Premium" = $165
   - etc...
```

### Ejemplo 2: Agregar servicio a un paquete
```
"Baño + Corte" (items: [Baño x1, Corte x1])
→ Agregar "Vacunas" x2 al paquete

Nueva composición:
- Baño x1: $50
- Corte x1: $30
- Vacunas x2: $10 * 2 = $20
---
Total: $100 (antes era $80)

Actualizar en todas las listas donde existe "Baño + Corte":
- DEFAULT: $100
- VIP: $105
- etc...
```

### Ejemplo 3: Cambiar cantidad
```
"Baño + Corte" actualmente:
- Baño x1: $50
- Corte x1: $30
Total: $80

Usuario cambia a:
- Baño x2: $50 * 2 = $100
- Corte x1: $30
Total: $130 (nuevo)

Actualizar en todas las listas de precios
```

---

## 🛟 Decisiones de Diseño

### ¿Qué servicio de precios usar para calcular?
**Respuesta:** El de la **DEFAULT price list**
- Garantía: Siempre existe una default price list
- Es la "fuente de verdad" para servicios individuales
- Usado como fallback si cliente no tiene price list customizada

### ¿Calcular automáticamente o permitir precio manual?
**Respuesta:** **Automático con opción de override**
- El sistema calcula automáticamente
- El usuario PUEDE setear un precio manual si lo desea (discount/markup)
- Si no hay precio manual, usar el calculado

### ¿Cuándo ejecutar la actualización?
**Respuesta:** Transaccional
- Al actualizar el paquete (agregar/eliminar/modificar items)
- Al actualizar el precio de un servicio
- Debe ser atómico - si falla, revertir todo

---

## 📝 Pseudo-código de la Solución

```typescript
// === PACKAGES SERVICE ===

async calculatePackagePrice(clinicId, packageId): number {
  const pkg = await getPackage(clinicId, packageId);
  const defaultList = await getDefaultPriceList(clinicId);
  
  let totalPrice = 0;
  for (const item of pkg.items) {
    const servicePrice = await getPriceInList(
      clinicId,
      item.serviceId,
      defaultList.id
    );
    totalPrice += (servicePrice || 0) * item.quantity;
  }
  
  return totalPrice;
}

async updatePackagePricesInAllLists(
  clinicId,
  packageId,
  newPrice
): void {
  // Find all price entries for this package
  const packagePrices = await packagePriceRepo.find({
    where: { clinicId, packageId }
  });
  
  // Update all of them
  for (const price of packagePrices) {
    price.price = newPrice;
    await packagePriceRepo.save(price);
  }
}

async updatePackage(clinicId, packageId, dto): Promise {
  // ... validate and update basic fields ...
  
  // If items changed
  if (dto.items) {
    // Update items in database
    await deleteItems(packageId);
    await createItems(clinicId, packageId, dto.items);
    
    // Recalculate and propagate price
    const newPrice = await this.calculatePackagePrice(
      clinicId,
      packageId
    );
    
    await this.updatePackagePricesInAllLists(
      clinicId,
      packageId,
      newPrice
    );
  }
}

// === SERVICES SERVICE ===

async updateService(clinicId, serviceId, dto): Promise {
  const service = await updateServiceEntity();
  
  // If price changed
  if (dto.price !== undefined) {
    // Update DEFAULT list (already done ✓)
    
    // Find all packages containing this service
    const affectedPackages = await findPackagesWithService(
      clinicId,
      serviceId
    );
    
    // Recalculate price for each package
    for (const pkg of affectedPackages) {
      const newPrice = await packageService.calculatePackagePrice(
        clinicId,
        pkg.id
      );
      
      await packageService.updatePackagePricesInAllLists(
        clinicId,
        pkg.id,
        newPrice
      );
    }
  }
}
```

---

## ✅ Testing Checklist

- [ ] Crear servicio con precio → Aparece en DEFAULT list
- [ ] Actualizar precio de servicio → Se actualiza en DEFAULT list
- [ ] Actualizar precio de servicio → Se recalculan paquetes que lo contienen
- [ ] Agregar servicio a paquete → Se recalcula precio en todas las listas
- [ ] Eliminar servicio de paquete → Se recalcula precio en todas las listas
- [ ] Cambiar cantidad de servicio → Se recalcula precio del paquete
- [ ] Verificar que el total es: suma(precio_servicio * cantidad) para todos los items

---

## 🔍 Archivos a Modificar

1. **Backend:**
   - `src/modules/packages/packages.service.ts` - Agregar métodos de cálculo
   - `src/modules/services/services.service.ts` - Mejorar updateService()

2. **Frontend:**
   - `src/components/CreatePackageModal.tsx` - Mostrar precio calculado (opcional)
   - `src/pages/price-lists/[id].tsx` - Mostrar precios de paquetes

3. **Documentación:**
   - Este archivo como referencia

---

## 🚀 Próximos Pasos

1. Implementar métodos en PackagesService
2. Integrar actualización en cascada en ServicesService
3. Crear/actualizar endpoints API si es necesario
4. Testing exhaustivo
5. Considerar agregar auditoría de cambios de precio

