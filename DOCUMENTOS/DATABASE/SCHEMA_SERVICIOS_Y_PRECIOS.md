# 💰 Schema de Servicios y Precios - VibraLive

**Última actualización:** Marzo 2, 2026  
**Estado:** Producción ✅

---

## 📋 Tabla de Contenidos

1. [Tablas Principales](#tablas-principales)
2. [Relaciones](#relaciones)
3. [DTOs (Data Transfer Objects)](#dtos)
4. [APIs REST](#apis-rest)
5. [Ejemplos de Datos](#ejemplos-de-datos)
6. [Garantías del Sistema](#garantías-del-sistema)

---

## 📊 Tablas Principales

### 1️⃣ SERVICES - Servicios / Productos

Servicios y productos ofrecidos por la clínica (vacunas, consultas, radiografías, etc).

#### Estructura de la Tabla

```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- SERVICE | PRODUCT
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  UNIQUE(clinic_id, name),
  CHECK (type IN ('SERVICE', 'PRODUCT'))
);

-- Índices para performance
CREATE INDEX idx_services_clinic_id ON services(clinic_id);
CREATE UNIQUE INDEX idx_services_clinic_name ON services(clinic_id, name);
CREATE INDEX idx_services_clinic_is_active ON services(clinic_id, is_active);
```

#### Campos Detallados

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | Identificador único |
| `clinic_id` | UUID | ❌ | ID de la clínica propietaria |
| `name` | VARCHAR(255) | ❌ | Nombre del servicio (ej: "Vacuna Antirrábica") |
| `description` | TEXT | ✅ | Descripción larga del servicio |
| `type` | VARCHAR(50) | ❌ | `SERVICE` o `PRODUCT` |
| `is_active` | BOOLEAN | ❌ | Si está activo en la clínica |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación |
| `updated_at` | TIMESTAMP | ❌ | Fecha de última actualización |

#### Validaciones

```typescript
// Validaciones en la aplicación
- name: Required, min 3 chars, max 255
- type: Enum: SERVICE | PRODUCT
- clinic_id: Must belong to current clinic (multi-tenancy)
- Unicidad: (clinic_id, name) - No puede haber dos servicios con el mismo nombre en la misma clínica
```

---

### 2️⃣ PRICE_LISTS - Listas de Precios

Listas de precios que puede tener una clínica (ej: "Precios VIP", "Precios Estándar", etc).

#### Estructura de la Tabla

```sql
CREATE TABLE price_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  UNIQUE(clinic_id, is_default, is_active) 
    WHERE is_default=true AND is_active=true, -- Solo UNA default activa por clínica
  CHECK (is_default IN (true, false)),
  CHECK (is_active IN (true, false))
);

-- Índices para performance
CREATE INDEX idx_price_lists_clinic_id ON price_lists(clinic_id);
CREATE UNIQUE INDEX idx_price_lists_clinic_default_active 
  ON price_lists(clinic_id, is_default, is_active) 
  WHERE is_default=true AND is_active=true;
CREATE INDEX idx_price_lists_is_active ON price_lists(is_active);
```

#### Campos Detallados

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | Identificador único |
| `clinic_id` | UUID | ❌ | ID de la clínica propietaria |
| `name` | VARCHAR(255) | ❌ | Nombre de la lista (ej: "Precios Estándar 2026") |
| `description` | TEXT | ✅ | Descripción/propósito de la lista |
| `is_default` | BOOLEAN | ❌ | Si es la lista por defecto de la clínica |
| `is_active` | BOOLEAN | ❌ | Si está activa (inactivas se preservan para auditoría) |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación |
| `updated_at` | TIMESTAMP | ❌ | Fecha de última actualización |

#### Validaciones

```typescript
// Validaciones en la aplicación
- name: Required, min 3 chars, max 255
- clinic_id: Must belong to current clinic (multi-tenancy)
- is_default: Si es true, no puede haber otra activa con is_default=true
- is_active: Puede ser false (para mantener histórico)

// Garantía del Sistema
- SIEMPRE existe una lista con is_default=true e is_active=true
- Se crea automáticamente en PriceListsService.ensureDefaultPriceListExists()
```

---

### 3️⃣ SERVICE_PRICES - Precios de Servicios

Tabla de cruce: cada servicio puede tener precios diferentes en cada lista de precios.

#### Estructura de la Tabla

```sql
CREATE TABLE service_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL,
  price_list_id UUID NOT NULL,
  service_id UUID NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'MXN',
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (price_list_id) REFERENCES price_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  UNIQUE(price_list_id, service_id),
  CHECK (price >= 0),
  CHECK (currency IN ('MXN', 'USD', 'EUR'))
);

-- Índices para performance
CREATE UNIQUE INDEX idx_service_prices_price_list_service 
  ON service_prices(price_list_id, service_id);
CREATE INDEX idx_service_prices_price_list_id 
  ON service_prices(price_list_id);
CREATE INDEX idx_service_prices_service_id 
  ON service_prices(service_id);
CREATE INDEX idx_service_prices_clinic_id 
  ON service_prices(clinic_id);
```

#### Campos Detallados

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | Identificador único |
| `clinic_id` | UUID | ❌ | ID de la clínica (denormalizado para validación) |
| `price_list_id` | UUID | ❌ | ID de la lista de precios |
| `service_id` | UUID | ❌ | ID del servicio |
| `price` | DECIMAL(12,2) | ❌ | Precio del servicio en esta lista |
| `currency` | VARCHAR(3) | ❌ | Moneda (MXN, USD, EUR) |
| `is_available` | BOOLEAN | ❌ | Si este servicio está disponible en esta lista |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación |
| `updated_at` | TIMESTAMP | ❌ | Fecha de última actualización |

#### Validaciones

```typescript
// Validaciones en la aplicación
- price: Required, >= 0, decimal con 2 decimales
- currency: Enum: MXN | USD | EUR
- cli nic_id: Debe coincidir con clinic_id de price_list y service (multi-tenancy)
- Unicidad: (price_list_id, service_id) - No puede haber dos precios del mismo servicio en la misma lista

// Garantía del Sistema
- Cuando se crea un nuevo servicio, se añade automáticamente a todas las listas activas
- Cuando se crea una nueva lista, incluye precios para todos los servicios activos
```

---

## 🔗 Relaciones

### Diagrama de Relaciones

```
┌──────────────┐
│   CLINICS    │
└──────────────┘
      │
      ├─────────────────────┬──────────────────┐
      │                     │                  │
      ↓                     ↓                  ↓
  ┌────────────┐  ┌─────────────────┐  ┌──────────────┐
  │  SERVICES  │  │  PRICE_LISTS    │  │    CLIENTS   │
  └────────────┘  └─────────────────┘  └──────────────┘
      │           │
      │           │ (1:M)
      │           ↓
      └──→ ┌──────────────────┐
           │  SERVICE_PRICES  │
           └──────────────────┘
```

### Relaciones Detalladas

#### CLINIC → SERVICES (1:M)
```typescript
// Eine Clinic hat viele Services
Clinic.services: Service[]
Service.clinic: Clinic
```

#### CLINIC → PRICE_LISTS (1:M)
```typescript
// Eine Clinic hat viele Price Lists
Clinic.priceLists: PriceList[]
PriceList.clinic: Clinic
```

#### PRICE_LIST ← SERVICE_PRICES (1:M)
```typescript
// Eine Price List hat viele Service Prices
PriceList.servicePrices: ServicePrice[]
ServicePrice.priceList: PriceList
```

#### SERVICE ← SERVICE_PRICES (1:M)
```typescript
// Ein Service kann viele Service Prices haben (uno en cada lista)
Service.servicePrices: ServicePrice[]
ServicePrice.service: Service
```

#### CLIENT → PRICE_LIST (M:1)
```typescript
// Un Cliente es asignado a UNA Price List (o NULL para usar default)
Client.priceList: PriceList
PriceList.clients: Client[]
```

---

## 🔄 DTOs (Data Transfer Objects)

### CreateServiceDTO

```typescript
interface CreateServiceDTO {
  name: string;              // Required, min 3, max 255
  description?: string;      // Optional
  type: 'SERVICE' | 'PRODUCT'; // Required
  price?: number;            // Precio inicial (se agregará a lista default)
}
```

### UpdateServiceDTO

```typescript
interface UpdateServiceDTO {
  name?: string;
  description?: string;
  type?: 'SERVICE' | 'PRODUCT';
  is_active?: boolean;
  price?: number;            // Actualiza precio en lista default
}
```

### CreatePriceListDTO

```typescript
interface CreatePriceListDTO {
  name: string;              // Required, min 3, max 255
  description?: string;      // Optional
  is_default?: boolean;      // Default: false
  copyFromPriceListId?: string; // Optional: copia precios de otra lista
}
```

### UpdatePriceListDTO

```typescript
interface UpdatePriceListDTO {
  name?: string;
  description?: string;
  is_default?: boolean;
  is_active?: boolean;
}
```

### UpdateServicePriceDTO

```typescript
interface UpdateServicePriceDTO {
  price: number;             // Required, >= 0
  currency?: string;         // Default: MXN
  is_available?: boolean;    // Default: true
}
```

### ServiceResponseDTO

```typescript
interface ServiceResponseDTO {
  id: string;
  clinicId: string;
  name: string;
  description: string | null;
  type: 'SERVICE' | 'PRODUCT';
  is_active: boolean;
  prices?: {
    [priceListId: string]: ServicePriceResponseDTO
  };
  created_at: Date;
  updated_at: Date;
}
```

### PriceListResponseDTO

```typescript
interface PriceListResponseDTO {
  id: string;
  clinicId: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  serviceCount: number;
  servicePrices: ServicePriceResponseDTO[];
  created_at: Date;
  updated_at: Date;
}
```

### ServicePriceResponseDTO

```typescript
interface ServicePriceResponseDTO {
  id: string;
  priceListId: string;
  serviceId: string;
  serviceName: string;
  price: number;
  currency: string;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}
```

---

## 📡 APIs REST

### Services API

#### GET /api/services
```
GET /api/services?clinicId=xxx&isActive=true

Response:
[
  {
    "id": "uuid",
    "name": "Vacuna Antirrábica",
    "type": "SERVICE",
    "is_active": true,
    "description": "...",
    "created_at": "2026-03-02T...",
    "updated_at": "2026-03-02T..."
  }
]
```

#### POST /api/services
```
POST /api/services
Content-Type: application/json

{
  "name": "Radiografía Digital",
  "type": "SERVICE",
  "description": "Radiografía digital de tórax y abdomen",
  "price": 850.00  // Precio inicial para lista default
}

Response: 201 Created
{
  "id": "uuid",
  "name": "Radiografía Digital",
  "type": "SERVICE",
  ...
}
```

#### GET /api/services/:id
```
GET /api/services/uuid

Response:
{
  "id": "uuid",
  "name": "Radiografía Digital",
  "type": "SERVICE",
  "prices": {
    "default-list-id": {
      "price": 850.00,
      "currency": "MXN",
      "is_available": true
    },
    "vip-list-id": {
      "price": 750.00,
      "currency": "MXN",
      "is_available": true
    }
  }
}
```

#### PATCH /api/services/:id
```
PATCH /api/services/uuid
Content-Type: application/json

{
  "name": "Radiografía Digital v2",
  "is_active": true,
  "price": 900.00  // Actualiza precio en lista default
}

Response: 200 OK
```

#### DELETE /api/services/:id
```
DELETE /api/services/uuid

Response: 204 No Content

NOTA: Soft delete recomendado (marcar is_active=false)
      para preservar histórico de precios
```

---

### Price Lists API

#### GET /api/price-lists
```
GET /api/price-lists?clinicId=xxx&isActive=true

Response:
[
  {
    "id": "uuid",
    "name": "Precios Estándar 2026",
    "is_default": true,
    "is_active": true,
    "serviceCount": 45,
    "description": "Lista de precios default de la clínica",
    "created_at": "2026-03-02T...",
    "updated_at": "2026-03-02T..."
  }
]
```

#### GET /api/price-lists/:id
```
GET /api/price-lists/uuid

Response:
{
  "id": "uuid",
  "name": "Precios Estándar 2026",
  "is_default": true,
  "is_active": true,
  "serviceCount": 45,
  "servicePrices": [
    {
      "id": "uuid",
      "serviceId": "uuid",
      "serviceName": "Consulta General",
      "price": 250.00,
      "currency": "MXN",
      "is_available": true
    },
    ...
  ]
}
```

#### POST /api/price-lists
```
POST /api/price-lists
Content-Type: application/json

{
  "name": "Precios VIP",
  "description": "Precios especiales para clientes premium",
  "is_default": false,
  "copyFromPriceListId": "default-list-id"  // Opcional
}

Response: 201 Created
{
  "id": "uuid",
  "name": "Precios VIP",
  "serviceCount": 45,
  ...
}
```

#### PATCH /api/price-lists/:id
```
PATCH /api/price-lists/uuid
Content-Type: application/json

{
  "name": "Precios VIP 2026",
  "is_active": true
}

Response: 200 OK
```

---

### Service Prices API

#### GET /api/price-lists/:priceListId/service-prices
```
GET /api/price-lists/uuid/service-prices?serviceId=xxx

Response:
[
  {
    "id": "uuid",
    "priceListId": "uuid",
    "serviceId": "uuid",
    "serviceName": "Consulta General",
    "price": 250.00,
    "currency": "MXN",
    "is_available": true
  }
]
```

#### PATCH /api/price-lists/:priceListId/services/:serviceId/price
```
PATCH /api/price-lists/uuid/services/uuid/price
Content-Type: application/json

{
  "price": 300.00,
  "currency": "MXN",
  "is_available": true
}

Response: 200 OK
{
  "id": "uuid",
  "price": 300.00,
  ...
}

NOTA: Esta operación REGISTRA AUDITORÍA:
- Quién cambió
- Valor anterior
- Valor nuevo
- Timestamp del cambio
```

#### GET /api/price-lists/:priceListId/services/:serviceId/history
```
GET /api/price-lists/uuid/services/uuid/history?limit=20

Response:
[
  {
    "id": "uuid",
    "priceListId": "uuid",
    "serviceId": "uuid",
    "oldPrice": 250.00,
    "newPrice": 300.00,
    "changedByUserId": "uuid",
    "changedByUserName": "Admin User",
    "reason": "Aumento anual 2026",
    "changed_at": "2026-03-02T..."
  }
]
```

---

## 📊 Ejemplos de Datos

### Ejemplo 1: Servicio Simple

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "clinic_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Consulta General",
  "description": "Consulta veterinaria estándar",
  "type": "SERVICE",
  "is_active": true,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-15T10:30:00Z"
}
```

### Ejemplo 2: Servicio con Múltiples Precios

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "clinic_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Consulta General",
  "type": "SERVICE",
  "is_active": true,
  "prices": {
    "550e8400-e29b-41d4-a716-446655440100": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "priceListId": "550e8400-e29b-41d4-a716-446655440100",
      "listName": "Precios Estándar",
      "price": 250.00,
      "currency": "MXN",
      "is_available": true
    },
    "550e8400-e29b-41d4-a716-446655440101": {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "priceListId": "550e8400-e29b-41d4-a716-446655440101",
      "listName": "Precios VIP",
      "price": 200.00,
      "currency": "MXN",
      "is_available": true
    }
  }
}
```

### Ejemplo 3: Lista de Precios Completa

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440100",
  "clinic_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Precios Estándar Marzo 2026",
  "description": "Lista de precios default de la clínica",
  "is_default": true,
  "is_active": true,
  "serviceCount": 3,
  "servicePrices": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "priceListId": "550e8400-e29b-41d4-a716-446655440100",
      "serviceId": "550e8400-e29b-41d4-a716-446655440001",
      "serviceName": "Consulta General",
      "price": 250.00,
      "currency": "MXN",
      "is_available": true,
      "created_at": "2026-01-15T10:30:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "priceListId": "550e8400-e29b-41d4-a716-446655440100",
      "serviceId": "550e8400-e29b-41d4-a716-446655440002",
      "serviceName": "Vacuna Antirrábica",
      "price": 150.00,
      "currency": "MXN",
      "is_available": true,
      "created_at": "2026-01-15T10:30:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440003",
      "priceListId": "550e8400-e29b-41d4-a716-446655440100",
      "serviceId": "550e8400-e29b-41d4-a716-446655440003",
      "serviceName": "Radiografía Digital",
      "price": 850.00,
      "currency": "MXN",
      "is_available": false,
      "created_at": "2026-01-15T10:30:00Z"
    }
  ],
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-02-01T14:20:00Z"
}
```

---

## 🔒 Garantías del Sistema

### 1️⃣ Garantía: Existe Lista Default Activa

**Invariante:**
```
SIEMPRE EXISTS (SELECT 1 FROM price_lists 
  WHERE clinic_id = X AND is_default = true AND is_active = true)
```

**Implementación:**
```typescript
// PriceListsService.ensureDefaultPriceListExists()
async ensureDefaultPriceListExists(clinicId: string): Promise<PriceList> {
  // 1. Buscar lista default activa
  let priceList = await this.priceListRepo.findOne({
    where: { 
      clinicId, 
      isDefault: true, 
      isActive: true 
    }
  });
  
  // 2. Si no existe, crear automáticamente
  if (!priceList) {
    priceList = this.priceListRepo.create({
      clinicId,
      name: 'Default Price List',
      isDefault: true,
      isActive: true,
    });
    priceList = await this.priceListRepo.save(priceList);
  }
  
  // 3. NUNCA retorna null
  return priceList;
}
```

**Lugares donde se garantiza:**
1. ✅ Al crear una clínica (`ClinicsService`)
2. ✅ Al crear un cliente (`ClientsService.createClient()`)
3. ✅ Al crear un servicio (`ServicesService.createService()`)
4. ✅ Seed de inicialización (`ensure-default-price-lists.seed.ts`)

---

### 2️⃣ Garantía: Todos los Servicios en Lista Default

**Invariante:**
```
PARA CADA service EN services:
  EXISTS (SELECT 1 FROM service_prices 
    WHERE service_id = service.id 
    AND price_list_id = clinic.default_price_list_id)
```

**Implementación:**
```typescript
// ServicesService.createService()
async createService(clinicId: string, dto: CreateServiceDTO) {
  // 1. Crear el servicio
  const service = await this.serviceRepo.save({...});
  
  // 2. Asegurar que existe lista default
  const defaultPriceList = await this.priceListsService
    .ensureDefaultPriceListExists(clinicId);
  
  // 3. Agregar el servicio a la lista default
  await this.servicePriceRepo.save({
    clinicId,
    priceListId: defaultPriceList.id,
    serviceId: service.id,
    price: dto.price ?? 0,
    currency: 'MXN',
    is_available: true
  });
  
  return service;
}
```

---

### 3️⃣ Garantía: Cliente Asignado a Lista (o Default)

**Invariante:**
```
PARA CADA client:
  client.price_list_id = client.price_list_id OR default_price_list_id
```

**Implementación:**
```typescript
// PricingService.resolvePriceListForAppointment()
async resolvePriceListForAppointment(
  clinicId: string,
  clientId: string,
  appointmentPriceListId?: string
): Promise<PriceList> {
  // 1. Si se especifica prix list en la cita, usarla
  if (appointmentPriceListId) {
    const customList = await this.priceListRepo.findOne({
      where: { id: appointmentPriceListId, clinicId }
    });
    if (customList) return customList;
  }
  
  // 2. Si cliente tiene asignada, usarla
  const client = await this.clientRepo.findOne({ where: { id: clientId } });
  if (client?.price_list_id) {
    const clientList = await this.priceListRepo.findOne({
      where: { id: client.price_list_id, clinicId }
    });
    if (clientList) return clientList;
  }
  
  // 3. Si no, usar default (garantizada a existir)
  const defaultList = await this.priceListsService
    .ensureDefaultPriceListExists(clinicId);
  return defaultList;
}
```

---

### 4️⃣ Garantía: Multi-Tenancy en Service Prices

**Validación:**
```sql
-- No debe haber discrepancias de clinic_id
SELECT COUNT(*) as inconsistencies_found
FROM service_prices sp
WHERE sp.clinic_id != (
  SELECT clinic_id FROM price_lists WHERE id = sp.price_list_id
);

-- Constraint para futuro
ALTER TABLE service_prices
ADD CONSTRAINT service_prices_clinic_price_list_match
CHECK (clinic_id IN (
  SELECT clinic_id FROM price_lists WHERE id = price_list_id
));
```

---

## 🎯 Casos de Uso

### Use Case 1: Crear un Nuevo Servicio

```typescript
// Input
const createServiceDto = {
  name: "Dentista Profesional",
  type: "SERVICE",
  description: "Limpieza y tratamiento dental profesional",
  price: 1500.00
};

// Proceso
1. Servicio es creado en DB
2. Se obtiene/crea lista default
3. Se añade precio en lista default (1500 MXN)
4. Se retorna el servicio creado

// Output
{
  "id": "new-uuid",
  "name": "Dentista Profesional",
  "price": 1500.00,
  ...
}
```

### Use Case 2: Crear una Lista de Precios VIP (Copia)

```typescript
// Input
const createPriceListDto = {
  name: "Precios VIP 2026",
  description: "Para clientes especiales con descuento",
  copyFromPriceListId: "default-list-id" // Copiar precios
};

// Proceso
1. Nueva lista de precios es creada
2. Se copian TODOS los service_prices de lista default
3. Precios copiados pueden ser modificados después
4. Se retorna la nueva lista con precios

// Output
{
  "id": "new-list-uuid",
  "name": "Precios VIP 2026",
  "serviceCount": 45,
  "servicePrices": [
    { "serviceName": "Consulta", "price": 250.00 },
    { "serviceName": "Vacuna", "price": 150.00 },
    ...
  ]
}
```

### Use Case 3: Asignar Cliente a Lista VIP

```typescript
// Input
const updateClientDto = {
  price_list_id: "vip-list-id"
};

// Proceso
1. Cliente es actualizado con nueva lista
2. Próximas citas usarán precios de lista VIP
3. Citas ya creadas conservan sus precios históricos (congelados)

// Output
{
  "id": "client-uuid",
  "name": "Juan Pérez",
  "price_list_id": "vip-list-id",
  ...
}
```

---

## 📚 Referencias

- [PRICING_IMPLEMENTATION_COMPLETE.md](./PRICING_IMPLEMENTATION_COMPLETE.md)
- [DEFAULT_PRICE_LIST_IMPLEMENTATION.md](./DEFAULT_PRICE_LIST_IMPLEMENTATION.md)
- [PRICING_ARCHITECTURE_STRATEGY.md](./PRICING_ARCHITECTURE_STRATEGY.md)
- [DATABASE_SCHEMA_CURRENT.md](./DATABASE_SCHEMA_CURRENT.md)

