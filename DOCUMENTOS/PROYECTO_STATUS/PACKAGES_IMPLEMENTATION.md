# Implementación de Paquetes en Citas de Grooming

## Resumen de Cambios

Se ha implementado la funcionalidad para seleccionar paquetes de servicios además de servicios individuales en el modal de creación de citas de grooming.

## Componentes Modificados

### 1. **ServicePicker.tsx** - Renovado con soporte para paquetes

#### Cambios Principales:
- **Interfaz actualizada**: Agregado parámetro `packages?: ServicePackage[]`
- **Tabs de navegación**: Permitir cambiar entre "Servicios Individuales" y "Paquetes"
- **Lógica inteligente de paquetes**: Al seleccionar un paquete, automáticamente expande todos sus servicios incluidos

#### Características:
```tsx
// Props
{
  services: Service[];          // Servicios disponibles
  packages?: ServicePackage[];  // Paquetes disponibles (opcional)
  selectedServices: { [key: string]: number };
  onServiceAdd: (serviceId: string) => void;
  onServiceRemove: (serviceId: string) => void;
  onQuantityChange: (serviceId: string, quantity: number) => void;
  disabled?: boolean;
}
```

#### Comportamiento:
1. **Cuando NO hay paquetes**: Muestra solo la pestaña de "Servicios Individuales"
2. **Cuando HAY paquetes**: Muestra ambas pestañas con opción de cambiar entre ellas
3. **Al seleccionar un paquete**: 
   - Extrae todos los servicios del paquete (via `pkg.items`)
   - Agrega cada servicio a la tabla de servicios seleccionados
   - Respeta las cantidades definidas en el paquete (`item.quantity`)
   - Cierra automáticamente el dropdown

#### Interfaz Visual:
```
┌─────────────────────────────────────────────┐
│ Servicios Individuales | 🛒 Paquetes        │  ← Tabs
├─────────────────────────────────────────────┤
│ [Buscar servicio...]                        │  ← Input búsqueda
├─────────────────────────────────────────────┤
│ ✓ 3 servicios seleccionados                 │  ← Resumen
├─────────────────────────────────────────────┤
│ • Baño                     [−] 1 [+] [Quitar]│
│ • Corte                    [−] 2 [+] [Quitar]│
│ • Uñas                     [−] 1 [+] [Quitar]│
└─────────────────────────────────────────────┘
```

### 2. **GroomingAppointmentModal.tsx** - Integración de paquetes

#### Cambios Principales:
- **Import PackagesApi**: `import { packagesApi } from '@/api/packages-api'`
- **Estado de paquetes**: `const [packages, setPackages] = useState<ServicePackage[]>([])`
- **Carga paralela**: Servicios y paquetes se cargan simultáneamente con `Promise.all()`

#### Flujo de Carga:
```typescript
useEffect(() => {
  if (!isOpen) return;
  
  const loadData = async () => {
    const [servicesRes, packagesRes] = await Promise.all([
      servicesApi.getServices(),       // APIs paralelas
      packagesApi.getPackages(),
    ]);
    setServices(servicesRes || []);
    setPackages(packagesRes || []);
  };
  
  loadData();
}, [isOpen]);
```

#### Parámetros del ServicePicker:
```tsx
<ServicePicker
  services={services}
  packages={packages}  // ← Nuevo parámetro
  selectedServices={selectedServices}
  onServiceAdd={handleServiceAdd}
  onServiceRemove={handleServiceRemove}
  onQuantityChange={handleServiceQuantityChange}
  disabled={isLoading}
/>
```

## Estructura de Datos

### ServicePackage
```typescript
export interface ServicePackage {
  id: string;
  clinicId: string;
  name: string;          // Ej: "Paquete Completo"
  description?: string;  // Ej: "Baño + Corte + Uñas"
  isActive: boolean;
  items: PackageItem[];  // ← Array de servicios en el paquete
  totalPrice?: number;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PackageItem {
  serviceId: string;
  serviceName?: string;
  quantity: number;      // Ej: 1, 2, 3 unidades del servicio
  price?: number;
  currency?: string;
  service?: Service;     // Detalles completos del servicio
}
```

## Flujo de Uso

### Scenario 1: Seleccionar Servicios Individuales
```
1. Usuario abre modal de cita
2. Hace clic en tab "Servicios Individuales"
3. Busca "Baño"
4. Selecciona "Baño"
5. Baño aparece en tabla con cantidad 1
6. Puede aumentar cantidad con [+] o [-]
```

### Scenario 2: Seleccionar Paquete
```
1. Usuario abre modal de cita
2. Hace clic en tab "Paquetes"
3. Busca paquete, ej: "Paquete Completo"
4. Selecciona paquete
5. Sistema automáticamente agrega:
   - Baño (cantidad: 1)
   - Corte (cantidad: 1)
   - Uñas (cantidad: 1)
6. Todos aparecen en tabla de servicios seleccionados
7. Usuario puede modificar cantidades individuales
```

### Scenario 3: Mezclar Paquetes y Servicios
```
1. Usuario selecciona paquete "Completo"
   → Se agregan: Baño, Corte, Uñas
2. Usuario luego selecciona servicio "Colorante"
   → Se agrega: Colorante (cantidad: 1)
3. Tabla final:
   - Baño (1)
   - Corte (1)
   - Uñas (1)
   - Colorante (1)
```

## APIs Utilizadas

### GET /api/service-packages
```typescript
const packages = await packagesApi.getPackages();
// Retorna: ServicePackage[]
```

### GET /api/service-packages/:id
```typescript
const pkg = await packagesApi.getPackage(packageId);
// Retorna: ServicePackage | null
```

## Validaciones

El sistema automáticamente:
- ✅ Evita duplicados: Si un servicio está en un paquete y ya fue agregado, no lo agrega de nuevo
- ✅ Respeta cantidades: Si un paquete especifica 2 unidades de un servicio, aplica esa cantidad
- ✅ Permite modificación: El usuario puede cambiar cantidades incluso de servicios que vinieron de paquetes
- ✅ Permite remover: El usuario puede remover servicios de paquetes individualmente

## Próximas Mejoras (Futuro)

1. **Descuentos por paquete**: Mostrar precio total vs precio individual
2. **Validación de servicios disponibles**: Desactivar paquetes si alguno de sus servicios no está disponible
3. **Paquetes precargados**: Opción para crear citas rápidas con paquete predeterminado
4. **Historial de paquetes**: Mostrar paquetes más usados/favoritos
5. **Combos inteligentes**: Sugerir paquetes basados en mascotas anteriores

## Testing

Para verificar la funcionalidad:

1. **Con servicios individuales**:
   - Abre el modal de grooming
   - Selecciona varios servicios
   - Verifica que aparecen en la tabla

2. **Con paquetes**:
   - Abre el modal de grooming
   - Cambia a tab "Paquetes"
   - Selecciona un paquete
   - Verifica que todos sus servicios aparecen en la tabla

3. **Combinado**:
   - Selecciona un paquete
   - Luego selecciona servicios individuales
   - Verifica que ambos conviven en la tabla

4. **Modificaciones**:
   - Aumenta/disminuye cantidades
   - Remueve servicios
   - Verifica que funcionan correctamente

## Notas de Implementación

- Los servicios de paquetes se expanden en el componente ServicePicker
- No se crean "citas de paquete" separadas, solo se expanden los servicios
- El backend recibe un array de servicios individuales con cantidades
- La UI muestra de forma clara qué servicios fueron agregados desde paquetes
