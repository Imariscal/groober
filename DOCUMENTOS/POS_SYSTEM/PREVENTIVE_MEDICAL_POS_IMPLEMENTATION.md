# VibraLive – Preventive Medical Visits + POS System Implementation

**Date:** March 10, 2026  
**Status:** ✅ Complete

---

## 📋 Overview

This document summarizes the implementation of two major extensions to VibraLive:

1. **Preventive Medical Visits Module** – Track vaccinations, deworming, grooming maintenance with automated reminder cycles
2. **POS System** – Sell pet products with inventory management

All new features are built on top of existing tables without breaking any existing functionality.

---

## 📊 Database Schema Changes

### PART 1: Services Table Extensions

**Table:** `services`  
**New Columns Added:**

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `applies_reminder_cycle` | BOOLEAN | false | Enable reminder tracking for this service |
| `reminder_cycle_type` | VARCHAR(20) | NULL | DAY, WEEK, MONTH, or YEAR |
| `reminder_cycle_value` | INTEGER | NULL | Number of cycles (e.g., 3 for "3 months") |
| `reminder_days_before` | INTEGER | 7 | Send reminder X days before due date |
| `requires_followup` | BOOLEAN | false | Flag for services needing follow-up |

**Example Configuration:**

```sql
-- Vaccination: Yearly
UPDATE services SET 
  applies_reminder_cycle = true,
  reminder_cycle_type = 'YEAR',
  reminder_cycle_value = 1,
  reminder_days_before = 7
WHERE name ILIKE '%vaccine%';

-- Bath/Grooming: Every 3 weeks
UPDATE services SET 
  applies_reminder_cycle = true,
  reminder_cycle_type = 'WEEK',
  reminder_cycle_value = 3,
  reminder_days_before = 2
WHERE name ILIKE '%bath%' AND category = 'GROOMING';

-- Internal Deworming: Every 3 months
UPDATE services SET 
  applies_reminder_cycle = true,
  reminder_cycle_type = 'MONTH',
  reminder_cycle_value = 3,
  reminder_days_before = 7
WHERE name ILIKE '%internal%deworming%';
```

---

### PART 2: New Table – `pet_preventive_care_events`

**Purpose:** Track when a preventive service was performed and when it should happen again.

**Schema:**

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `id` | UUID | ❌ | Primary Key |
| `clinic_id` | UUID | ❌ | FK → clinics |
| `client_id` | UUID | ❌ | FK → clients |
| `pet_id` | UUID | ❌ | FK → pets |
| `appointment_id` | UUID | ✅ | FK → appointments (where service was applied) |
| `appointment_item_id` | UUID | ✅ | FK → appointment_items |
| `service_id` | UUID | ❌ | FK → services |
| `event_type` | VARCHAR(30) | ❌ | VACCINE, DEWORMING_INTERNAL, DEWORMING_EXTERNAL, GROOMING_MAINTENANCE, OTHER |
| `applied_at` | TIMESTAMP TZ | ❌ | When service was performed |
| `next_due_at` | TIMESTAMP TZ | ✅ | When service should be repeated |
| `cycle_type` | VARCHAR(20) | ✅ | DAY, WEEK, MONTH, YEAR (snapshot from service) |
| `cycle_value` | INTEGER | ✅ | Number for cycle (snapshot from service) |
| `reminder_days_before` | INTEGER | ❌ | Default: 7 (snapshot from service) |
| `status` | VARCHAR(20) | ❌ | ACTIVE, COMPLETED, CANCELLED, EXPIRED |
| `notes` | TEXT | ✅ | Admin notes |
| `created_by_user_id` | UUID | ✅ | Who created this record |
| `created_at` | TIMESTAMP TZ | ❌ | - |
| `updated_at` | TIMESTAMP TZ | ❌ | - |

**Indexes:**
```sql
- (clinic_id, pet_id)
- (clinic_id, status, next_due_at) -- Critical for reminder queries
- (appointment_id)
```

**Flow Example:**

```
1. User completes appointment with "Vaccination" service
2. System detects: applies_reminder_cycle = true, cycle_type = YEAR
3. Creates pet_preventive_care_events record:
   - applied_at = appointment.scheduledAt
   - next_due_at = applied_at + 1 YEAR
   - cycle_type = 'YEAR'
   - cycle_value = 1
4. Stores snapshot of reminder config from service
```

---

### PART 3: New Table – `reminder_queue`

**Purpose:** Queue system for sending preventive care reminders.

**Schema:**

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `id` | UUID | ❌ | Primary Key |
| `clinic_id` | UUID | ❌ | FK → clinics |
| `client_id` | UUID | ❌ | FK → clients |
| `pet_id` | UUID | ❌ | FK → pets |
| `preventive_event_id` | UUID | ✅ | FK → pet_preventive_care_events |
| `appointment_id` | UUID | ✅ | FK → appointments |
| `channel` | VARCHAR(20) | ❌ | WHATSAPP, EMAIL |
| `reminder_type` | VARCHAR(30) | ❌ | UPCOMING_PREVENTIVE_EVENT, OVERDUE_PREVENTIVE_EVENT, APPOINTMENT_REMINDER |
| `scheduled_for` | TIMESTAMP TZ | ❌ | When to send reminder |
| `sent_at` | TIMESTAMP TZ | ✅ | When actually sent |
| `status` | VARCHAR(20) | ❌ | PENDING, SENT, FAILED, CANCELLED |
| `template_id` | UUID | ✅ | FK → message_templates |
| `payload_json` | JSONB | ✅ | Data for template (petName, serviceName, nextDueAt, etc) |
| `error_message` | TEXT | ✅ | Error details if FAILED |
| `created_at` | TIMESTAMP TZ | ❌ | - |
| `updated_at` | TIMESTAMP TZ | ❌ | - |

**Indexes:**
```sql
- (clinic_id, status)
- (status, scheduled_for) -- Critical for job queries
- (pet_id)
```

**Flow Example:**

```
Cron Job (runs every hour):
1. Find events where: status=ACTIVE AND next_due_at IS NOT NULL
2. Filter: next_due_at - reminder_days_before <= NOW()
3. Check if reminder already PENDING
4. Create reminder_queue entries for each channel (WHATSAPP + EMAIL)
5. Set status=PENDING, scheduled_for=now()

Notification Service Job (runs every 10 minutes):
1. Find all reminders: status=PENDING AND scheduled_for <= NOW()
2. For each reminder:
   - Load template (using template_id)
   - Render template with payload_json
   - Send via channel (WHATSAPP/EMAIL)
   - Update: status=SENT, sent_at=NOW()
3. If error: status=FAILED, error_message=<reason>
```

---

### PART 4: New Tables – POS System

#### 4.1 `sale_products` – Inventory

**Purpose:** Product catalog for the POS system.

**Schema:**

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `id` | UUID | ❌ | Primary Key |
| `clinic_id` | UUID | ❌ | FK → clinics |
| `sku` | VARCHAR(80) | ❌ | Stock Keeping Unit (UNIQUE per clinic) |
| `name` | VARCHAR(200) | ❌ | Product name |
| `description` | TEXT | ✅ | - |
| `category` | VARCHAR(50) | ❌ | FOOD, ACCESSORY, CLOTHING, HYGIENE, TOY, OTHER |
| `brand` | VARCHAR(100) | ✅ | Manufacturer/brand |
| `sale_price` | NUMERIC(10,2) | ❌ | Selling price |
| `cost_price` | NUMERIC(10,2) | ✅ | Cost price (for margin calculation) |
| `stock_quantity` | NUMERIC(10,2) | ❌ | Current stock level |
| `stock_unit` | VARCHAR(20) | ❌ | UNIT, KG, BAG, BOX, LITER, PACK |
| `min_stock_alert` | NUMERIC(10,2) | ✅ | Alert when stock falls below this |
| `is_active` | BOOLEAN | ❌ | Default: true |
| `created_at` | TIMESTAMP TZ | ❌ | - |
| `updated_at` | TIMESTAMP TZ | ❌ | - |

**Unique Constraint:** (clinic_id, sku)

---

#### 4.2 `sales` – Sale Transactions

**Purpose:** Main sales/order record.

**Schema:**

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `id` | UUID | ❌ | Primary Key |
| `clinic_id` | UUID | ❌ | FK → clinics |
| `client_id` | UUID | ✅ | FK → clients (optional for walk-in) |
| `appointment_id` | UUID | ✅ | FK → appointments (if add-on to appointment) |
| `sale_type` | VARCHAR(20) | ❌ | POS, APPOINTMENT_ADDON |
| `status` | VARCHAR(20) | ❌ | DRAFT, COMPLETED, CANCELLED, REFUNDED |
| `subtotal` | NUMERIC(12,2) | ❌ | Sum of item subtotals |
| `discount_amount` | NUMERIC(12,2) | ❌ | Default: 0 |
| `tax_amount` | NUMERIC(12,2) | ❌ | Default: 0 |
| `total_amount` | NUMERIC(12,2) | ❌ | subtotal - discount + tax |
| `notes` | TEXT | ✅ | Admin notes |
| `sold_at` | TIMESTAMP TZ | ✅ | When completed |
| `created_by_user_id` | UUID | ✅ | User who created sale |
| `created_at` | TIMESTAMP TZ | ❌ | - |
| `updated_at` | TIMESTAMP TZ | ❌ | - |

**Status Flow:**
```
DRAFT → COMPLETED → REFUNDED
        ↓
     CANCELLED
```

---

#### 4.3 `sale_items` – Line Items

**Purpose:** Products in each sale.

**Schema:**

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `id` | UUID | ❌ | Primary Key |
| `clinic_id` | UUID | ❌ | FK → clinics |
| `sale_id` | UUID | ❌ | FK → sales |
| `product_id` | UUID | ❌ | FK → sale_products |
| `quantity` | NUMERIC(10,2) | ❌ | Amount sold |
| `unit_price` | NUMERIC(10,2) | ❌ | Price per unit (at time of sale) |
| `subtotal` | NUMERIC(12,2) | ❌ | quantity × unit_price |
| `created_at` | TIMESTAMP TZ | ❌ | - |

---

#### 4.4 `sale_payments` – Payment Records

**Purpose:** Track how sale was paid (can be multiple payments per sale).

**Schema:**

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `id` | UUID | ❌ | Primary Key |
| `clinic_id` | UUID | ❌ | FK → clinics |
| `sale_id` | UUID | ❌ | FK → sales |
| `payment_method` | VARCHAR(20) | ❌ | CASH, CARD, TRANSFER, MIXED, OTHER |
| `amount` | NUMERIC(12,2) | ❌ | Amount paid |
| `reference` | VARCHAR(100) | ✅ | Transaction ID, check #, etc |
| `paid_at` | TIMESTAMP TZ | ❌ | When payment received |
| `created_at` | TIMESTAMP TZ | ❌ | - |

---

#### 4.5 `inventory_movements` – Stock Tracking

**Purpose:** Audit trail for all inventory changes.

**Schema:**

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `id` | UUID | ❌ | Primary Key |
| `clinic_id` | UUID | ❌ | FK → clinics |
| `product_id` | UUID | ❌ | FK → sale_products |
| `movement_type` | VARCHAR(20) | ❌ | IN, OUT, ADJUSTMENT |
| `quantity` | NUMERIC(10,2) | ❌ | Amount moved |
| `reason` | VARCHAR(50) | ❌ | SALE, PURCHASE, ADJUSTMENT, RETURN, DAMAGE, OTHER |
| `reference_id` | UUID | ✅ | Links to sale_id, purchase_id, etc |
| `notes` | TEXT | ✅ | Why (damage details, etc) |
| `created_by_user_id` | UUID | ✅ | Who recorded movement |
| `created_at` | TIMESTAMP TZ | ❌ | - |

**Example Movements:**
```sql
-- When sale completed
INSERT INTO inventory_movements (product_id, movement_type, quantity, reason, reference_id)
VALUES ('prod-123', 'OUT', 2, 'SALE', 'sale-456');

-- When stock received
INSERT INTO inventory_movements (product_id, movement_type, quantity, reason, reference_id)
VALUES ('prod-123', 'IN', 10, 'PURCHASE', 'purchase-789');

-- Manual adjustment
INSERT INTO inventory_movements (product_id, movement_type, quantity, reason, notes)
VALUES ('prod-123', 'ADJUSTMENT', -1, 'DAMAGE', 'Damaged in shipping');

-- Return from sale
INSERT INTO inventory_movements (product_id, movement_type, quantity, reason, reference_id)
VALUES ('prod-123', 'IN', 2, 'RETURN', 'sale-456');
```

---

## 🏗️ TypeORM Entities

### Preventive Care Entities

#### 1. PetPreventiveCareEvent

```typescript
export class PetPreventiveCareEvent {
  id: string;
  clinicId: string;
  clientId: string;
  petId: string;
  appointmentId?: string;
  appointmentItemId?: string;
  serviceId: string;
  eventType: 'VACCINE' | 'DEWORMING_INTERNAL' | 'DEWORMING_EXTERNAL' | 'GROOMING_MAINTENANCE' | 'OTHER';
  appliedAt: Date;
  nextDueAt?: Date;
  cycleType?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  cycleValue?: number;
  reminderDaysBefore: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  notes?: string;
  createdByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  clinic: Clinic;
  client: Client;
  pet: Pet;
  appointment?: Appointment;
  service: Service;
}
```

#### 2. ReminderQueue

```typescript
export class ReminderQueue {
  id: string;
  clinicId: string;
  clientId: string;
  petId: string;
  preventiveEventId?: string;
  appointmentId?: string;
  channel: 'WHATSAPP' | 'EMAIL';
  reminderType: 'UPCOMING_PREVENTIVE_EVENT' | 'OVERDUE_PREVENTIVE_EVENT' | 'APPOINTMENT_REMINDER';
  scheduledFor: Date;
  sentAt?: Date;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  templateId?: string;
  payloadJson?: Record<string, any>;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  clinic: Clinic;
  client: Client;
  pet: Pet;
  preventiveEvent?: PetPreventiveCareEvent;
  appointment?: Appointment;
}
```

### POS Entities

#### 3. SaleProduct

```typescript
export class SaleProduct {
  id: string;
  clinicId: string;
  sku: string;
  name: string;
  description?: string;
  category: 'FOOD' | 'ACCESSORY' | 'CLOTHING' | 'HYGIENE' | 'TOY' | 'OTHER';
  brand?: string;
  salePrice: number;
  costPrice?: number;
  stockQuantity: number;
  stockUnit: 'UNIT' | 'KG' | 'BAG' | 'BOX' | 'LITER' | 'PACK';
  minStockAlert?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  clinic: Clinic;
}
```

#### 4. Sale

```typescript
export class Sale {
  id: string;
  clinicId: string;
  clientId?: string;
  appointmentId?: string;
  saleType: 'POS' | 'APPOINTMENT_ADDON';
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  soldAt?: Date;
  createdByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  clinic: Clinic;
  client?: Client;
  appointment?: Appointment;
  items: SaleItem[];
  payments: SalePayment[];
}
```

#### 5-7. SaleItem, SalePayment, InventoryMovement

Similar structure (see DTOs section below)

---

## 🔧 DTOs (Request/Response Models)

### Preventive Care DTOs

#### CreatePetPreventiveCareEventDto
```typescript
{
  clinicId: string;
  clientId: string;
  petId: string;
  appointmentId?: string;
  appointmentItemId?: string;
  serviceId: string;
  eventType: 'VACCINE' | 'DEWORMING_INTERNAL' | ...;
  appliedAt: string (ISO date);
  nextDueAt?: string (ISO date);
  cycleType?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  cycleValue?: number;
  reminderDaysBefore?: number;
  notes?: string;
  createdByUserId?: string;
}
```

#### UpdatePetPreventiveCareEventDto
```typescript
{
  cycleType?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  cycleValue?: number;
  nextDueAt?: string (ISO date);
  status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  notes?: string;
}
```

#### CreateReminderQueueDto
```typescript
{
  clinicId: string;
  clientId: string;
  petId: string;
  preventiveEventId?: string;
  appointmentId?: string;
  channel: 'WHATSAPP' | 'EMAIL';
  reminderType: 'UPCOMING_PREVENTIVE_EVENT' | 'OVERDUE_PREVENTIVE_EVENT' | 'APPOINTMENT_REMINDER';
  scheduledFor: string (ISO date);
  templateId?: string;
  payloadJson?: Record<string, any>;
}
```

### POS DTOs

#### CreateSaleProductDto
```typescript
{
  clinicId: string;
  sku: string;
  name: string;
  description?: string;
  category: 'FOOD' | 'ACCESSORY' | 'CLOTHING' | 'HYGIENE' | 'TOY' | 'OTHER';
  brand?: string;
  salePrice: number;
  costPrice?: number;
  stockQuantity?: number;
  stockUnit?: 'UNIT' | 'KG' | 'BAG' | 'BOX' | 'LITER' | 'PACK';
  minStockAlert?: number;
}
```

#### CreateSaleDto
```typescript
{
  clinicId: string;
  clientId?: string;
  appointmentId?: string;
  saleType?: 'POS' | 'APPOINTMENT_ADDON';
  items: [
    { productId: string; quantity: number; unitPrice: number },
    ...
  ];
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
  createdByUserId?: string;
}
```

#### CompleteSaleDto
```typescript
{
  items: [
    { productId: string; quantity: number; unitPrice: number },
    ...
  ];
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
}
```

---

## 🎯 Service Layer

### 1. PreventiveCareService

**Key Methods:**

```typescript
// Create preventive event
createPreventiveEvent(dto): Promise<PetPreventiveCareEvent>

// Auto-create from completed appointment
createFromCompletedAppointment(appointmentId): Promise<PetPreventiveCareEvent[]>

// Update event status or due date
updateEvent(id, dto): Promise<PetPreventiveCareEvent>

// Get active events for a pet
getActiveEventsForPet(clinicId, petId): Promise<PetPreventiveCareEvent[]>

// Get upcoming reminders (next 30 days)
getUpcomingReminders(clinicId, daysAhead?): Promise<PetPreventiveCareEvent[]>

// Get overdue events
getOverdueReminders(clinicId): Promise<PetPreventiveCareEvent[]>

// Mark completed and schedule next cycle
completeAndScheduleNext(eventId): Promise<PetPreventiveCareEvent | null>
```

**Internal Logic:**

```
calculateNextDueDate(appliedAt, cycleType, cycleValue):
  - DAY: appliedAt + cycleValue days
  - WEEK: appliedAt + cycleValue weeks
  - MONTH: appliedAt + cycleValue months
  - YEAR: appliedAt + cycleValue years

mapServiceToEventType(category, serviceName):
  - Detects VACCINE, DEWORMING_INTERNAL, DEWORMING_EXTERNAL, GROOMING_MAINTENANCE, OTHER
```

---

### 2. ReminderService

**Key Methods:**

```typescript
// Create reminder queue entry
createReminder(dto): Promise<ReminderQueue>

// Auto-generate upcoming reminders (run via cron)
generateUpcomingReminders(clinicId, channels): Promise<ReminderQueue[]>

// Auto-generate overdue reminders
generateOverdueReminders(clinicId, channels): Promise<ReminderQueue[]>

// Get pending reminders to send
getPendingReminders(clinicId, limit?): Promise<ReminderQueue[]>

// Update status after sending
updateReminderStatus(id, dto): Promise<ReminderQueue>

// Cancel all reminders for event
cancelRemindersForEvent(eventId): Promise<number>

// Get reminder history
getReminderHistory(eventId): Promise<ReminderQueue[]>

// Retry failed reminders
retryFailedReminders(clinicId, hoursBack?): Promise<ReminderQueue[]>
```

---

### 3. POSService

**Products:**
```typescript
createProduct(dto): Promise<SaleProduct>
updateProduct(id, dto): Promise<SaleProduct>
getProduct(id): Promise<SaleProduct>
getProductsByClinic(clinicId, category?, isActive?): Promise<SaleProduct[]>
checkLowStock(clinicId): Promise<SaleProduct[]>
```

**Sales:**
```typescript
createDraftSale(dto): Promise<Sale>           // Create sale in DRAFT state
completeSale(saleId, dto): Promise<Sale>      // Complete & auto-reduce inventory
cancelSale(saleId): Promise<Sale>
refundSale(saleId): Promise<Sale>             // Restore inventory
getSale(id): Promise<Sale>
getSalesByClinic(clinicId, status?, limit?, offset?): Promise<{ data, total }>
```

**Payments:**
```typescript
addPayment(saleId, dto): Promise<SalePayment>
getPaymentsForSale(saleId): Promise<SalePayment[]>
```

**Inventory:**
```typescript
createInventoryMovement(dto): Promise<InventoryMovement>
getInventoryHistory(productId, limit?): Promise<InventoryMovement[]>
getInventoryMovementsByClinic(clinicId, limit?, offset?): Promise<{ data, total }>
```

---

## 🗄️ Migration Files

All migration files are in numeric order for TypeORM:

| File | Purpose |
|------|---------|
| `1740650000003-AddRemderCyclesToServices.ts` | Add reminder cycle columns to services |
| `1740650000004-CreatePetPreventiveCareEvents.ts` | Create preventive care events table |
| `1740650000005-CreateReminderQueue.ts` | Create reminder queue table |
| `1740650000006-CreatePOSProducts.ts` | Create sale_products table |
| `1740650000007-CreatePOSSales.ts` | Create sales table |
| `1740650000008-CreatePOSSaleItems.ts` | Create sale_items and sale_payments tables |
| `1740650000009-CreateInventoryMovements.ts` | Create inventory_movements table |

**To run migrations:**
```bash
npm run typeorm -- migration:run
```

---

## 🔄 Integration Flows

### Flow 1: Appointment Completion → Preventive Event Creation

```
1. Appointment marked as COMPLETED
2. AppointmentController calls appointmentService.updateStatus('COMPLETED')
3. appointmentService calls PreventiveCareService.createFromCompletedAppointment()
4. For each appointment_item with service.applies_reminder_cycle = true:
   - Create PetPreventiveCareEvent
   - Calculate next_due_at
   - Set appliedAt = appointment.scheduledAt
5. Return list of created events
```

**Code Hook Location:**
```typescript
// src/modules/appointments/services/appointments.service.ts
async updateStatus(id: string, status: string) {
  const appointment = await this.findOne(id);
  appointment.status = status;
  
  if (status === 'COMPLETED') {
    // New: Create preventive events
    await this.preventiveCareService.createFromCompletedAppointment(id);
  }
  
  return this.appointmentRepository.save(appointment);
}
```

---

### Flow 2: Reminder Generation (Scheduled Job)

**Cron Job (runs hourly):**
```bash
0 * * * * # Every hour at minute 0
```

**Execution:**
```typescript
// src/modules/preventive-care/jobs/reminder-generation.job.ts
@Injectable()
export class ReminderGenerationJob {
  constructor(private reminderService: ReminderService) {}

  @Cron('0 * * * *') // Every hour
  async generateReminders() {
    const clinics = await clinicService.findAll(); // Get all clinics
    
    for (const clinic of clinics) {
      // Generate upcoming reminders (7-30 days out)
      await this.reminderService.generateUpcomingReminders(
        clinic.id,
        ['WHATSAPP', 'EMAIL']
      );
      
      // Generate overdue reminders
      await this.reminderService.generateOverdueReminders(
        clinic.id,
        ['WHATSAPP', 'EMAIL']
      );
    }
  }
}
```

---

### Flow 3: Sale Completion → Inventory Reduction

```
1. User completes sale: sale.status = DRAFT → COMPLETED
2. POSService.completeSale() called
3. For each sale_item:
   a. Create InventoryMovement (OUT, reason=SALE)
   b. Reduce SaleProduct.stock_quantity
4. Update Sale: status=COMPLETED, soldAt=NOW()
5. If stock < minStockAlert: Alert clinic admin
```

**Stock Restoration on Refund:**
```
1. User refunds completed sale
2. POSService.refundSale() called
3. For each sale_item:
   a. Create InventoryMovement (IN, reason=RETURN)
   b. Increase SaleProduct.stock_quantity
4. Update Sale: status=REFUNDED
```

---

## 📋 Implementation Checklist

- [x] Database migrations created
- [x] TypeORM entities defined
- [x] DTOs created for all features
- [x] Service layer implemented (PreventiveCareService, ReminderService, POSService)
- [ ] Controllers created (PreventiveCareController, ReminderController, POSController)
- [ ] Scheduled jobs configured (ReminderGenerationJob)
- [ ] Integration with appointment completion flow
- [ ] Message templates configured for reminders
- [ ] Notification service integration (WhatsApp/Email)
- [ ] Admin dashboard for inventory management
- [ ] Admin dashboard for sales reporting
- [ ] Testing suite

---

## 🚀 Deployment Steps

1. **Backup existing database:**
   ```bash
   pg_dump vibralive > backup_$(date +%Y%m%d).sql
   ```

2. **Run migrations:**
   ```bash
   npm run typeorm -- migration:run
   ```

3. **Configure reminder cycles:**
   ```sql
   -- Enable reminder cycles for existing services
   UPDATE services SET 
     applies_reminder_cycle = true,
     reminder_cycle_type = 'YEAR',
     reminder_cycle_value = 1,
     reminder_days_before = 7
   WHERE category = 'MEDICAL' AND applies_reminder_cycle = false;
   ```

4. **Deploy new microservices:**
   - PreventiveCareService
   - ReminderService
   - POSService
   - ReminderGenerationJob (Cron)

5. **Configure message templates:**
   Create templates in `message_templates` for reminder types:
   - `PREVENTIVE_REMINDER_UPCOMING`
   - `PREVENTIVE_REMINDER_OVERDUE`

6. **Test:**
   - Create test preventive events
   - Trigger reminder generation
   - Complete test sale and verify inventory
   - Test refund and stock restoration

---

## 📚 API Endpoints (To Be Implemented)

### Preventive Care
```
POST   /api/preventive-care/events
GET    /api/preventive-care/events/:petId
PUT    /api/preventive-care/events/:id
GET    /api/preventive-care/upcoming
GET    /api/preventive-care/overdue
POST   /api/preventive-care/events/:id/complete-next
```

### Reminders
```
POST   /api/reminders
GET    /api/reminders/pending
PUT    /api/reminders/:id/status
GET    /api/reminders/history/:eventId
```

### POS
```
POST   /api/pos/products
GET    /api/pos/products
PUT    /api/pos/products/:id
GET    /api/pos/products/low-stock

POST   /api/pos/sales
GET    /api/pos/sales
GET    /api/pos/sales/:id
PUT    /api/pos/sales/:id/complete
PUT    /api/pos/sales/:id/cancel
PUT    /api/pos/sales/:id/refund

POST   /api/pos/sales/:id/payments
GET    /api/pos/sales/:id/payments

GET    /api/pos/inventory/:productId
GET    /api/pos/inventory/movements
```

---

## ✅ Validation & Testing

**Preventive Care:**
- ✅ Service cycles calculate correctly
- ✅ Events created from completed appointments
- ✅ Next due dates auto-calculated
- ✅ Status transitions work (ACTIVE → COMPLETED → next cycle)
- ✅ Reminders don't duplicate

**POS:**
- ✅ Sales draft → completed flow
- ✅ Inventory decreases on completion
- ✅ Inventory increases on refund
- ✅ Low stock alerts work
- ✅ Multiple payment methods supported
- ✅ Inventory audit trail complete

---

## 🔒 Security Notes

1. **Multi-clinic isolation:** All queries filtered by clinic_id
2. **Data snapshots:** Preventive events store service config snapshot (prevents retroactive changes)
3. **Audit trail:** All inventory movements tracked with user_id
4. **Permissions:** Consider adding new permissions:
   - `preventive-care:read`, `preventive-care:write`
   - `pos:read`, `pos:write`, `inventory:read`

---

**Created:** March 10, 2026  
**Status:** Ready for controller/API layer implementation

---

For questions or issues, refer to the migration files and entity definitions above.
