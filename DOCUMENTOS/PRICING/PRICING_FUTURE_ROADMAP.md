# Pricing System - Future Phases Roadmap

> **Status:** Phase 1 (Core System) ✅ COMPLETE
> **Current Date:** March 1, 2026
> **Prepared for:** Future Implementation

---

## Phase 1: ✅ COMPLETE
- [x] Database migrations (appointment_items, price_list_history)
- [x] Entities (AppointmentItem, PriceListHistory, extended Appointment)
- [x] PricingService with core logic
- [x] Repositories and custom queries
- [x] PricingController REST endpoints
- [x] PricingModule registration
- [x] Frontend API wrapper (pricingApi)
- [x] Frontend components (PricingBreakdown, PriceValidationWidget)
- [x] TypeScript compilation passing
- [x] Migrations executed successfully

---

## Phase 2: Frontend Integration (HIGH PRIORITY)
**Effort:** 8 hours | **Complexity:** Medium | **Risk:** Low

### Task 2.1: Integrate PricingBreakdown in Appointment Form
- [ ] Find appointment creation form (likely in appointments module)
- [ ] Import PricingBreakdown component
- [ ] Add to form workflow
- [ ] Connect serviceIds and quantities state
- [ ] Disable submit button until pricing calculated
- [ ] Test with live API calls

**Files to modify:**
- `vibralive-frontend/src/components/AppointmentForm.tsx` or similar
- `vibralive-frontend/src/pages/appointments/create.tsx` or similar

**Acceptance Criteria:**
- Pricing breakdown appears after service selection
- Total amount updates in real-time
- Submit button disabled until pricing calculated
- Error handling for missing price list

### Task 2.2: Integrate PriceValidationWidget in Appointment Details
- [ ] Find appointment details view
- [ ] Import PriceValidationWidget
- [ ] Add validation button
- [ ] Handle changed services alert
- [ ] Show warning banner if prices changed
- [ ] Allow user action (update or confirm)

**Files to modify:**
- `vibralive-frontend/src/pages/appointments/[id].tsx` or similar
- `vibralive-frontend/src/components/AppointmentDetail.tsx` or similar

**Acceptance Criteria:**
- Validation button visible in appointment detail
- Works when prices haven't changed (success state)
- Works when prices have changed (warning state)
- User can see price differences clearly

### Task 2.3: Update Appointment Creation Flow
- [ ] Modify create appointment service to use pricingApi
- [ ] Store appointment pricing in state/store
- [ ] Update Zustand store to track pricing
- [ ] Add feedback when appointment created with prices
- [ ] Test full flow end-to-end

**Files to create/modify:**
- `vibralive-frontend/src/stores/appointment.store.ts` (update)
- `vibralive-frontend/src/services/appointment.service.ts` (update)

### Task 2.4: Add Pricing Display in Appointment List
- [ ] Show frozen price in appointment cards/list
- [ ] Display price lock timestamp
- [ ] Show service breakdown as tooltip
- [ ] Add visual indicator if prices have changed
- [ ] Mobile responsive layout

**Files to modify:**
- `vibralive-frontend/src/components/AppointmentCard.tsx` or similar
- `vibralive-frontend/src/components/AppointmentList.tsx` or similar

---

## Phase 3: Unit Tests for Backend (HIGH PRIORITY)
**Effort:** 12 hours | **Complexity:** Medium | **Risk:** Low

### Task 3.1: PricingService Tests
- [ ] Test resolvePriceListForAppointment()
  - [ ] When appointment has price_list_id
  - [ ] When client has price_list_id
  - [ ] When using clinic default
  - [ ] Error case: no price list configured
- [ ] Test calculateAppointmentPricing()
  - [ ] Single service, single quantity
  - [ ] Multiple services, various quantities
  - [ ] Missing service price
  - [ ] Inactive price list
- [ ] Test createAppointmentWithFrozenPrices()
  - [ ] Successfully creates appointment + items
  - [ ] Transactional rollback on error
  - [ ] Total amount calculated correctly
  - [ ] Price lock timestamp set
- [ ] Test validateAppointmentPricing()
  - [ ] No changes detected
  - [ ] Price increases detected
  - [ ] Price decreases detected
  - [ ] Appointment not found error

**File:** `vibralive-backend/src/modules/pricing/pricing.service.spec.ts`

### Task 3.2: Repository Tests
- [ ] AppointmentItemRepository
  - [ ] Create appointment item
  - [ ] Get appointment items
  - [ ] Calculate appointment total
  - [ ] Delete by appointment ID
- [ ] PriceListHistoryRepository
  - [ ] Record price change
  - [ ] Get service history
  - [ ] Get price list history
  - [ ] Get clinic history

**Files:**
- `vibralive-backend/src/modules/pricing/repositories/appointment-item.repository.spec.ts`
- `vibralive-backend/src/modules/pricing/repositories/price-list-history.repository.spec.ts`

### Task 3.3: Controller Tests
- [ ] POST /pricing/calculate
- [ ] POST /pricing/appointments/create-with-pricing
- [ ] GET /pricing/appointments/:id
- [ ] POST /pricing/appointments/:id/validate

**File:** `vibralive-backend/src/modules/pricing/pricing.controller.spec.ts`

---

## Phase 4: E2E Tests (MEDIUM PRIORITY)
**Effort:** 10 hours | **Complexity:** Medium | **Risk:** Low

### Task 4.1: E2E Test Suite Setup
- [ ] Configure Jest for E2E tests
- [ ] Setup test database with seed data
- [ ] Create test fixtures (clinics, clients, services, price lists)
- [ ] Configure TypeORM for test environment

**File:** `vibralive-backend/test/e2e/jest-e2e.json`

### Task 4.2: E2E Test Scenarios
- [ ] Create appointment without price list (should fail)
- [ ] Create appointment with clinic default price list
- [ ] Create appointment with client-specific price list
- [ ] Create appointment with override price list
- [ ] Verify atomicity (appointment + items together)
- [ ] Verify pricing calculation accuracy
- [ ] Verify price validation after creation
- [ ] Verify audit trail recording

**File:** `vibralive-backend/test/e2e/pricing.e2e-spec.ts`

---

## Phase 5: Reporting & Dashboard (MEDIUM PRIORITY)
**Effort:** 16 hours | **Complexity:** High | **Risk:** Medium

### Task 5.1: Price Change Analytics
- [ ] Endpoint: GET /pricing/analytics/price-changes
  - Filter by date range
  - Filter by price list
  - Filter by service
  - Calculate % change, variance
- [ ] Show price history for each service
- [ ] Identify trending price increases/decreases

**File:** `vibralive-backend/src/modules/pricing/pricing-analytics.service.ts`

### Task 5.2: Revenue Analytics
- [ ] Endpoint: GET /pricing/analytics/revenue
  - Revenue by price list
  - Revenue by service
  - Revenue by time period
  - Average appointment value
- [ ] Track frozen prices vs current prices
- [ ] Identify price discrepancies

### Task 5.3: Dashboard Components (Frontend)
- [ ] PriceHistoryChart - Timeline of price changes
- [ ] ServicePricingComparison - Compare prices across lists
- [ ] RevenueBreakdown - Revenue by service/list
- [ ] PriceAnomalies - Alert on unusual changes

**Directory:** `vibralive-frontend/src/components/pricing-dashboard/`

---

## Phase 6: Subscriptions & Discounts (LOW PRIORITY)
**Effort:** 20 hours | **Complexity:** High | **Risk:** Medium

### Task 6.1: Subscription Plan Integration
- [ ] Link AppointmentItem to SubscriptionPlan
- [ ] Calculate discount based on subscription tier
- [ ] Apply auto-discount when booking
- [ ] Verify subscription validity (active, not expired)

**Schema Changes:**
```sql
ALTER TABLE appointment_items ADD COLUMN subscription_plan_id UUID;
ALTER TABLE appointment_items ADD COLUMN discount_percentage NUMERIC(5,2);
ALTER TABLE appointment_items ADD COLUMN final_price NUMERIC(10,2);
```

### Task 6.2: Discount Engine
- [ ] Create DiscountService
  - Calculate applicable discounts
  - Apply subscription discounts
  - Apply promotional codes
  - Apply volume discounts
- [ ] Update PricingService to use DiscountService
- [ ] Record applied discounts in appointment_items

**File:** `vibralive-backend/src/modules/pricing/discount.service.ts`

### Task 6.3: Promotional Codes
- [ ] Create PromoCode entity
- [ ] Endpoint: POST /pricing/apply-promo-code
- [ ] Validate code active, not expired
- [ ] Calculate discount amount
- [ ] Prevent double application

**Files:**
- `vibralive-backend/src/database/entities/promo-code.entity.ts`
- `vibralive-backend/src/modules/pricing/promo-code.service.ts`

---

## Phase 7: POS & Payment Integration (LOW PRIORITY)
**Effort:** 24 hours | **Complexity:** Very High | **Risk:** High

### Task 7.1: POS Integration
- [ ] Create POSTransaction entity
- [ ] Link appointment_items to POS transactions
- [ ] Timeline: appointment → payment → reconciliation
- [ ] Commission calculations based on frozen prices

**Schema:**
```sql
CREATE TABLE pos_transactions (
  id UUID PRIMARY KEY,
  clinic_id UUID NOT NULL,
  appointment_id UUID,
  payment_method VARCHAR(50),
  amount_paid NUMERIC(12,2),
  change_amount NUMERIC(12,2),
  transaction_date TIMESTAMP,
  reconciled_at TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

CREATE TABLE appointment_item_payments (
  appointment_item_id UUID,
  pos_transaction_id UUID,
  amount_paid NUMERIC(12,2),
  FOREIGN KEY (appointment_item_id) REFERENCES appointment_items(id),
  FOREIGN KEY (pos_transaction_id) REFERENCES pos_transactions(id)
);
```

### Task 7.2: Payment Reconciliation
- [ ] Validate payment matches total_amount
- [ ] Handle partial payments
- [ ] Handle overpayments (change)
- [ ] Reconciliation report

### Task 7.3: Commission Calculations
- [ ] Groomer commission (% of service price)
- [ ] Clinic commission (% of appointment total)
- [ ] Special rates per subscription tier
- [ ] Automated payout calculations

---

## Phase 8: Accounting & Compliance (LOW PRIORITY)
**Effort:** 16 hours | **Complexity:** High | **Risk:** High

### Task 8.1: Accounting Entries
- [ ] Create GLEntry (General Ledger) entity
- [ ] Link appointments to chart of accounts
- [ ] Auto-create GL entries on appointment completion
- [ ] Revenue recognition rules (IFRS 15)

### Task 8.2: Audit Reports
- [ ] Audit trail completeness check
- [ ] Price change audit report
- [ ] Revenue reconciliation
- [ ] Tax compliance reports

### Task 8.3: Data Exports
- [ ] Export appointments with pricing
- [ ] Export price change history
- [ ] Export revenue reports
- [ ] Format: CSV, Excel, PDF

---

## Dependencies & Prerequisites

### Phase 2 Prerequisites
- ✅ Phase 1 complete
- ✅ Backend API running
- ✅ Appointment form exists

### Phase 3+ Prerequisites
- ✅ Phase 2 complete
- ✅ Jest testing framework installed
- ✅ Test database setup

---

## Risk Assessment

| Phase | Risk | Mitigation |
|-------|------|-----------|
| 2 | Component integration | Use feature flags, test in dev |
| 3 | Test coverage gaps | 80%+ coverage requirement |
| 4 | Data consistency | Use test transactions |
| 5 | Performance (large datasets) | Add indices, pagination |
| 6 | Business logic errors | Extensive QA, accountant review |
| 7 | Payment security | PCI compliance, avoid storing cards |
| 8 | Regulatory changes | Legal review before launch |

---

## Deployment Checklist Template

```markdown
### Pre-Launch Checklist

- [ ] All unit tests passing (>80% coverage)
- [ ] E2E tests passing
- [ ] Manual testing completed
- [ ] Performance baseline established
- [ ] Security review completed
- [ ] Database backup created
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] Documentation updated
- [ ] Team training completed
- [ ] Customer communication sent
- [ ] Go/No-Go decision made

### Post-Launch Monitoring

- [ ] Error rates monitored
- [ ] Performance metrics tracked
- [ ] User feedback collected
- [ ] Database transaction volume monitored
- [ ] Report any issues to team lead
```

---

## Estimated Total Timeline

| Phase | Hours | Timeline | Status |
|-------|-------|----------|--------|
| Phase 1 | 40 | Complete (Baseline) | ✅ Done |
| Phase 2 | 8 | 1 week | ⏳ Next |
| Phase 3 | 12 | 1.5 weeks | 📅 Scheduled |
| Phase 4 | 10 | 1.5 weeks | 📅 Scheduled |
| Phase 5 | 16 | 2 weeks | 📅 Future |
| Phase 6 | 20 | 3 weeks | 📅 Future |
| Phase 7 | 24 | 4 weeks | 📅 Future |
| Phase 8 | 16 | 2.5 weeks | 📅 Future |
| **TOTAL** | **146** | **~17 weeks** | |

---

## Notes for Future Developer

1. **Phase 2 is blocking** - Frontend won't work without this
2. **Phase 3 is critical** - Unit tests prevent regressions
3. **Phase 4 ensures reliability** - E2E tests catch integration bugs
4. **Phases 5-8 are scaling features** - Can be deferred if time is tight
5. **Keep multi-tenancy enforcement** throughout all new code
6. **Always use transactions** for pricing-related operations
7. **Audit trail is mandatory** - Log all price changes
8. **Test with real data** - Use production-like volumes

---

## File Structure Reference

```
vibralive-backend/
├── src/modules/pricing/
│   ├── pricing.service.ts (✅ Done)
│   ├── pricing.service.spec.ts (Phase 3)
│   ├── pricing.controller.ts (✅ Done)
│   ├── pricing.controller.spec.ts (Phase 3)
│   ├── repositories/
│   │   ├── appointment-item.repository.ts (✅ Done)
│   │   ├── appointment-item.repository.spec.ts (Phase 3)
│   │   ├── price-list-history.repository.ts (✅ Done)
│   │   └── price-list-history.repository.spec.ts (Phase 3)
│   ├── dtos/
│   │   └── pricing.dto.ts (✅ Done)
│   ├── discount.service.ts (Phase 6)
│   ├── promo-code.service.ts (Phase 6)
│   ├── pricing-analytics.service.ts (Phase 5)
│   ├── pos-transaction.service.ts (Phase 7)
│   └── accounting.service.ts (Phase 8)
├── test/e2e/
│   └── pricing.e2e-spec.ts (Phase 4)
└── src/database/migrations/
    ├── 1740700000000-CreateAppointmentItemsAndPricingAudit.ts (✅ Done)
    ├── 1740700000001-ExtendAppointmentsForPricing.ts (✅ Done)
    ├── 1740700000002-SubscriptionDiscounts.ts (Phase 6)
    ├── 1740700000003-PromoCode.ts (Phase 6)
    ├── 1740700000004-POSTransactions.ts (Phase 7)
    └── 1740700000005-GLEntries.ts (Phase 8)

vibralive-frontend/
├── src/api/
│   └── pricing-api.ts (✅ Done)
├── src/components/pricing/
│   ├── PricingBreakdown.tsx (✅ Done)
│   ├── PriceValidationWidget.tsx (✅ Done)
│   ├── PricingBreakdown.integration.tsx (Phase 2)
│   └── pricing-dashboard/ (Phase 5)
│       ├── PriceHistoryChart.tsx
│       ├── ServicePricingComparison.tsx
│       ├── RevenueBreakdown.tsx
│       └── PriceAnomalies.tsx
└── src/stores/
    └── appointment.store.ts (update in Phase 2)
```

---

**Last Updated:** March 1, 2026  
**Next Review:** After Phase 2 completion  
**Maintained By:** VibraLive Development Team
