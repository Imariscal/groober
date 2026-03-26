# Service with Price - Complete Data Flow

## CREATE New Service with Price=150.00

### User Action
```
[Browser] User fills CreateServiceModal form:
├─ name: "Corte Canino"
├─ description: "Corte completo con baño"
├─ category: "GROOMING"
├─ defaultDurationMinutes: 45
└─ price: 150.00 ← KEY FIELD
     │
     └─> Clicks [CREATE] button
```

---

## Step 1: Frontend Sends to Backend
```
[Browser Console Visible]
POST /api/services
Body: {
  "name": "Corte Canino",
  "description": "Corte completo con baño",
  "category": "GROOMING",
  "defaultDurationMinutes": 45,
  "price": 150.00  ← PRICE IS SENT
}

Headers: Authorization + clinicId (from auth context)
```

---

## Step 2: Backend Receives & Validates
```
[Backend Terminal Visible]

[ServicesController] POST /api/services received
  ├─ TenantGuard validates clinicId
  └─ CreateServiceDto validates payload:
      ├─ name: ✓ IsString
      ├─ description: ✓ IsOptional + IsString
      ├─ category: ✓ IsEnum
      ├─ defaultDurationMinutes: ✓ IsInt
      └─ price: ✓ IsOptional + IsNumber

[ServicesService] Creating service with: {
  name: "Corte Canino",
  description: "Corte completo con baño",
  category: "GROOMING",
  defaultDurationMinutes: 45,
  price: 150
}
```

---

## Step 3: Backend Creates Service Record
```
[ServicesService] Step 1 - Create Service row
  
service = Service {
  id: "srv_xyz123",
  clinicId: "clinic_001",
  name: "Corte Canino",
  description: "Corte completo con baño",
  category: "GROOMING",
  defaultDurationMinutes: 45,
  createdAt: 2024-01-15T10:30:00Z,
  updatedAt: 2024-01-15T10:30:00Z
}

INSERT INTO services (
  id, clinic_id, name, description, category, 
  defaultDurationMinutes, createdAt, updatedAt
) VALUES (...)

[Backend Terminal]
[ServicesService] Service created with ID: srv_xyz123
```

---

## Step 4: Backend Finds/Creates DEFAULT PriceList
```
[ServicesService] Step 2 - Find DEFAULT price list

Query: SELECT * FROM price_lists 
       WHERE clinic_id = 'clinic_001' 
       AND isDefault = true

Result:
  priceList = PriceList {
    id: "plist_default_001",
    clinicId: "clinic_001",
    isDefault: true,
    isActive: true,
    createdAt: 2024-01-15T10:00:00Z,
    updatedAt: 2024-01-15T10:00:00Z
  }

[Backend Terminal]
[ServicesService] Default price list: plist_default_001
```

---

## Step 5: Backend Creates ServicePrice Record
```
[ServicesService] Step 3 - Create ServicePrice row

servicePrice = ServicePrice {
  id: "sprice_abc789",
  clinicId: "clinic_001",
  priceListId: "plist_default_001",
  serviceId: "srv_xyz123",
  price: 150.00,  ← THIS IS THE PRICE FROM REQUEST
  currency: "MXN",
  isAvailable: true,
  createdAt: 2024-01-15T10:30:05Z,
  updatedAt: 2024-01-15T10:30:05Z
}

INSERT INTO service_prices (
  id, clinic_id, price_list_id, service_id, 
  price, currency, isAvailable, createdAt, updatedAt
) VALUES (...)

[Backend Terminal]
[ServicesService] Creating service price: {
  serviceId: srv_xyz123,
  priceListId: plist_default_001,
  price: 150
}
[ServicesService] Service price created: {
  id: sprice_abc789,
  serviceId: srv_xyz123,
  priceListId: plist_default_001,
  price: 150,
  currency: MXN,
  isAvailable: true,
  ...
}
```

---

## Step 6: Backend Returns Success
```
[ServicesService] Return response

Response to Frontend:
{
  "data": {
    "id": "srv_xyz123",
    "clinicId": "clinic_001",
    "name": "Corte Canino",
    "description": "Corte completo con baño",
    "category": "GROOMING",
    "defaultDurationMinutes": 45,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}

NOTE: Response does NOT include price field (it's in ServicePrice, not Service)
```

---

## Step 7: Frontend Receives & Re-fetches
```
[Browser Console]
POST /api/services → 201 Created

onSuccess callback triggered:
  └─ Call fetchServices()
      ├─ GET /api/services
      │   Response: [
      │     Service { id: srv_xyz123, name: "Corte Canino", ... },
      │     ... other services ...
      │   ]
      │
      └─ Call loadServicePrices([...services])
          ├─ GET /api/price-lists/default
          │   Response: { data: PriceList { id: plist_default_001 } }
          │
          └─ For each service:
              └─ GET /api/price-lists/plist_default_001/service-prices?serviceId=srv_xyz123
                  Response: [
                    {
                      id: sprice_abc789,
                      serviceId: srv_xyz123,
                      priceListId: plist_default_001,
                      price: 150,  ← ⭐ PRICE LOADED
                      currency: MXN,
                      isAvailable: true
                    }
                  ]
                  
              setServicePrices({
                "srv_xyz123": 150  ← STORE IN STATE
              })
```

---

## Step 8: Frontend Renders Service Card
```
[Browser]
<ServiceCard
  service={Service { id: srv_xyz123, name: "Corte Canino", ... }}
  servicePrice={150}  ← PRICE PASSED AS PROP
  onEdit={handleEditService}
  onDelete={handleDeleteService}
/>

Component Render Logic:
  if (typeof servicePrice === 'number' && servicePrice > 0) {
    Display: ┌─────────────────────────────┐
             │  Precio DEFAULT             │
             │  💲 150.00                  │
             └─────────────────────────────┘
  }

Final Output to User:
  [ServiceCard]
  ├─ Top Bar: Purple gradient (GROOMING category)
  ├─ Title: Corte Canino
  ├─ Duration: 45 mins
  ├─ 💲 150.00          ← PRICE DISPLAYS HERE
  └─ [Edit] [Delete]
```

---

## Step 9: User Edits Service (Price=200.00)
```
[Browser] User clicks [Edit] button
  └─ Modal opens with onSuccess effect:
      ├─ Editing service: { id: srv_xyz123, ... }
      ├─ Fetch DEFAULT price list: { id: plist_default_001 }
      ├─ Fetch service price: GET /api/price-lists/plist_default_001/service-prices?serviceId=srv_xyz123
      │   Response: [{ price: 150 }]
      ├─ Load form with:
      │   └─ price: 150
      │
      └─ User changes price 150 → 200
          └─ Clicks [Update]
              ├─ PATCH /api/services/srv_xyz123
              │   Body: { name, description, category, defaultDurationMinutes }
              │   (does NOT include price)
              │
              └─ PATCH /api/price-lists/plist_default_001/services/srv_xyz123/price
                  Body: { price: 200 }
                  
                  Backend updates:
                  UPDATE service_prices 
                  SET price = 200 
                  WHERE service_id = srv_xyz123
                  AND price_list_id = plist_default_001
                  
                  onSuccess:
                  └─ Re-fetch prices
                      └─ Card now shows 💲 200.00
```

---

## Complete Data Model Visual

```
┌─────────────────────────────────────────────────────────────┐
│                        CLINIC                               │
│ (clinic_id: clinic_001)                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │   SERVICES       │      │  PRICE_LISTS     │            │
│  ├──────────────────┤      ├──────────────────┤            │
│  │ id: srv_xyz123   │      │ id: plist_def_001│            │
│  │ name: Corte...   │      │ isDefault: true  │            │
│  │ category: GROOM  │      │ isActive: true   │            │
│  │ duration: 45     │      └──────────────────┘            │
│  └──────────────────┘              ▲                        │
│           │                        │                        │
│           │                        │                        │
│           └────────────┬───────────┘                        │
│                        │                                    │
│           ┌────────────▼─────────────┐                     │
│           │  SERVICE_PRICES          │                     │
│           ├──────────────────────────┤                     │
│           │ id: sprice_abc789        │                     │
│           │ service_id: srv_xyz123   │                     │
│           │ price_list_id: plist_..  │                     │
│           │ price: 150.00            │  ← KEY LINK        │
│           │ currency: MXN            │                     │
│           │ isAvailable: true        │                     │
│           └──────────────────────────┘                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Insight:** Service and its price are SEPARATE records, linked through ServicePrice table with the price_list_id. This allows:
- Same service different prices in different price lists
- Price history tracking
- Easy price updates without modifying core service record

---

## Database Query to Verify Everything Worked

```sql
-- Are your services there?
SELECT id, name, category FROM services 
WHERE clinic_id = 'clinic_001' 
AND name = 'Corte Canino';

-- Are the prices there?
SELECT 
  sp.id, 
  sp.service_id, 
  sp.price_list_id,
  sp.price,
  pl.isDefault,
  s.name
FROM service_prices sp
JOIN price_lists pl ON sp.price_list_id = pl.id
JOIN services s ON sp.service_id = s.id
WHERE sp.service_id = 'srv_xyz123'
AND sp.clinic_id = 'clinic_001';

-- Expected output:
-- | id           | service_id | price_list_id  | price | isDefault | name       |
-- |--------------|-----------|----------------|-------|-----------|-----------|
-- | sprice_abc789| srv_xyz123| plist_default_01| 150.00|    true   | Corte Canino|
```

---

## Console Log Checklist

✅ = Success, data flowing correctly
❌ = Problem, data not flowing

| Component | Log to Expect | Status |
|-----------|---------------|--------|
| Frontend Modal | `"Editing service: { ... }"` | ✅✅ |
| Backend Service | `"[ServicesService] Creating service with: { price: 150 }"` | ✅ Need to see |
| Backend Service | `"[ServicesService] Service price created: { price: 150 }"` | ✅ Need to see |
| Frontend Fetch | `"Updated prices: { 'srv_xyz123': 150 }"` | ✅ Need to see |
| Frontend Card | Price displayed as `💲 150.00` | ✅ Need to verify |

---

## What to Check If Price Doesn't Show

1. **Check Backend Logs:**
   - Do you see `[ServicesService]` logs?
   - Does log show `price: 150` in request?
   - Does log show ServicePrice created successfully?

2. **Check Frontend Console:**
   - Do you see `"Updated prices"`?
   - Does it show `"service_id": 150`?

3. **Check Database Directly:**
   - Run SQL query above
   - Is there a ServicePrice row with price=150?

4. **Check API Network Tab:**
   - Is GET `/api/price-lists/.../service-prices` returning 200 status?
   - Does response include `price: 150`?

The answer to one of these will pinpoint the exact problem.
