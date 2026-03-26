# Service Price Debug Guide

## Problem Statement
Services created with a price are not persisting or loading the price after creation.

**Expected Flow:**
1. User creates service with name="Test Service" and price=150.00
2. Frontend sends: `POST /api/services` with `{ name, description, category, defaultDurationMinutes, price: 150 }`
3. Backend should:
   - Create Service record
   - Fetch/create DEFAULT PriceList
   - Create ServicePrice record linking service to DEFAULT list with price=150
4. When user edits service, price=150 should load in modal
5. On ServiceCard, price should display as $150.00

---

## Test Procedure (Manual Testing)

### STEP 1: Open Browser DevTools & Start Logging
1. Open your application in browser (http://localhost:3000)
2. Press **F12** to open Developer Tools
3. Click **Console** tab
4. Make sure to see ALL console output

### STEP 2: Create a NEW Service with Price
1. Navigate to **Clinic Services** page
2. Click **+ New Service** button
3. Fill in:
   - **Name:** `TEST_SERVICE_PRICE_DEBUG_001`
   - **Description:** `Testing price persistence`
   - **Category:** Medical
   - **Duration:** 30 minutes
   - **Price:** `150.00` ← ⭐ This is the critical field
4. Click **Create**

### STEP 3: Monitor Console Logs (Frontend)
After clicking Create, you should see in DevTools Console:

**Expected Frontend Logs:**
```
[ServicesApi] Created service successfully
[PriceListsApi] Updated prices: { "service-id-here": 150 }
toast: "Servicio creado"
```

**If you see this, Frontend is working ✅**

If you DON'T see price logs, it means:
- Price not being sent from modal
- Frontend not fetching prices after creation

### STEP 4: Check Backend Terminal Logs
While DevTools is open, look at the **backend terminal** where your NestJS server is running.

**Expected Backend Logs:**
```
[ServicesService] Creating service with: { 
  name: 'TEST_SERVICE_PRICE_DEBUG_001', 
  description: 'Testing price persistence',
  category: 'MEDICAL',
  defaultDurationMinutes: 30,
  price: 150
}
[ServicesService] Service created with ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
[ServicesService] Default price list: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
[ServicesService] Creating service price: { 
  serviceId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  priceListId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  price: 150
}
[ServicesService] Service price created: ServicePrice {
  id: '...',
  serviceId: '...',
  priceListId: '...',
  price: 150,
  currency: 'MXN',
  isAvailable: true,
  ...
}
```

**If you see this, Backend is working ✅**

If you DON'T see these logs:
- **Missing "Creating service with"** → Price field not being sent by frontend
- **Missing "Service price created"** → Database insertion is failing

### STEP 5: Verify Price in Database (Direct Query)

Open your database client (pgAdmin or similar) and run:

```sql
-- First, find your test service
SELECT id, name, description, category FROM services 
WHERE name = 'TEST_SERVICE_PRICE_DEBUG_001' 
LIMIT 1;

-- Then, get its ID from above (call it SERVICE_ID)
-- Now find the price
SELECT sp.id, sp.price, sp.currency, sp.isAvailable, pl.id as priceListId
FROM service_prices sp
JOIN price_lists pl ON sp.priceListId = pl.id
WHERE sp.serviceId = 'SERVICE_ID'
AND pl.isDefault = true;
```

**If query returns a row with price=150, the database insertion worked ✅**

**If query returns 0 rows, the database insert failed ✗**

### STEP 6: Test Edit Modal Loading

1. On services page, click **Edit** on the service you just created
2. Modal should open and show:
   - Name: `TEST_SERVICE_PRICE_DEBUG_001`
   - Price: `150.00` ← ⭐ Critical field

**Check Frontend Console for logs:**
```
Editing service: { id: '...', name: 'TEST_SERVICE_PRICE_DEBUG_001', ... }
Default price list: { id: '...', isDefault: true, ... }
Fetched service prices: [{ id: '...', price: 150, ... }]
Service price loaded: 150
Form data set with price: 150
```

**If you see these logs, loading is working ✅**

If price shows as 0 or blank:
- Check previous step (is price in database?)
- Check if getServicePrices query is correct

### STEP 7: Test Card Display

1. Close the modal (don't change anything, just close)
2. Look at the ServiceCard for your test service
3. There should be a **blue highlighted section** showing:
   ```
   Precio DEFAULT
   💲 150.00
   ```

**If visible, display logic works ✅**

**If not visible:**
- Check if price loaded in Step 6
- Check if servicePrices state is being set in component

---

## Diagnostic Decision Tree

```
┌─ Price visible on CARD?
│  ├─ YES → ✅ System working! Skip to "Verify Real Use Case"
│  └─ NO → Continue below
│
├─ Price visible in EDIT MODAL?
│  ├─ YES → Display logic broken
│  │   └─ Check ServiceCard rendering (typeof check failing?)
│  └─ NO → Continue below
│
├─ Price in DATABASE? 
│  ├─ YES → Frontend fetch broken
│  │   └─ getServicePrices() not fetching correctly
│  └─ NO → Continue below
│
└─ Backend logs show "Service price created"?
   ├─ YES → Database insertion failed silently
   │   └─ Check ServicePrice entity constraints
   └─ NO → Frontend not sending price
       └─ CreateServiceModal not including price in payload
```

---

## Common Issues & Solutions

### Issue 1: "Price shows as 0 in modal"
**Cause:** Frontend is fetching 0 from database (price never saved)
**Solution:** Check backend logs - did "Service price created" log appear?

### Issue 2: "Backend logs missing, can't see them"
**Solution:**
```bash
# Windows PowerShell - navigate to backend
cd vibralive-backend

# Run with output redirect
npm run start:dev | Tee-Object -FilePath backend-debug.log

# Now you have a log file to review later
```

### Issue 3: "Price is in database but not loading in modal"
**Cause:** getServicePrices API call failing
**Solution:** Check browser Network tab in DevTools:
1. Open DevTools → Network tab
2. Edit the service
3. Look for request to `/api/price-lists/[id]/service-prices`
4. Check Status (should be 200)
5. Check Response (should have price: 150)

### Issue 4: "Database query returns nothing"
**Cause:** ServicePrice not being created
**Solution:** 
- Check if service creation fails silently (no error toast, but service not created)
- Verify clinicId matches between service and ServicePrice
- Check if DEFAULT priceList exists

---

## Quick Test Script (Backend Logs Only)

If you want to see just the backend logs without testing UI:

```bash
# Terminal 1: Start backend with debug output
cd vibralive-backend
npm run start:dev 2>&1 | grep "\[ServicesService\]"
```

Then when you create a service, you'll see only the relevant logs.

---

## Next Steps After Testing

1. **If everything works:** Try creating multiple services with different prices
2. **If price doesn't load:** Share the logs from Step 3-5 with detailed output
3. **If database insertion fails:** We need to check ServicePrice constraints/migrations

---

## Log Collection Template

When reporting issues, provide:

```markdown
### Frontend Console (DevTools)
[Paste relevant logs here]

### Backend Terminal 
[Paste [ServicesService] logs here]

### Database Query Result
[Paste SQL query output here]

### Issue Description
[What exactly is broken]
```
