# 🚀 Backend Testing Guide

## Quick Start - Test Backend in 5 Minutes

### 1. Start Backend Server
```bash
cd vibralive-backend
npm run dev
```
✅ Server runs on `http://localhost:3001` (or check console for port)

### 2. Install REST Client Extension (Optional)
- Install "REST Client" extension in VS Code
- Create file: `test.http`
- Use examples below to test

### 3. Run Database Migrations
```bash
npm run typeorm migration:run
```
✅ All tables and constraints updated

### 4. Test Each Endpoint

---

## REST API Testing (Copy-Paste Ready)

### Authentication Header
Every request needs clinic context. Add this header or use dummy values during testing:
```
Authorization: Bearer <YOUR_TOKEN>
X-Clinic-ID: 550e8400-e29b-41d4-a716-446655440001
```

---

## Test 1: Create Client with ALL Fields

**Request**:
```
POST http://localhost:3001/api/clients HTTP/1.1
Content-Type: application/json

{
  "name": "Full Test Client",
  "phone": "+34912345678",
  "email": "test@example.com",
  "address": "Calle Principal 123",
  "notes": "Test notes",
  "priceListId": null,
  "whatsappNumber": "+34666123456",
  "phoneSecondary": "+34912987654",
  "preferredContactMethod": "WHATSAPP",
  "preferredContactTimeStart": "09:00",
  "preferredContactTimeEnd": "18:00",
  "housingType": "APARTMENT",
  "accessNotes": "Acceso por portón rojo",
  "serviceNotes": "Perro necesita bozal",
  "doNotContact": false,
  "doNotContactReason": null,
  "status": "ACTIVE"
}
```

**Expected Response** (201 Created):
```json
{
  "id": "...",
  "name": "Full Test Client",
  "phone": "+34912345678",
  "email": "test@example.com",
  "address": "Calle Principal 123",
  "whatsappNumber": "+34666123456",
  "phoneSecondary": "+34912987654",
  "preferredContactMethod": "WHATSAPP",
  "preferredContactTimeStart": "09:00",
  "preferredContactTimeEnd": "18:00",
  "housingType": "APARTMENT",
  "accessNotes": "Acceso por portón rojo",
  "serviceNotes": "Perro necesita bozal",
  "doNotContact": false,
  "doNotContactReason": null,
  "status": "ACTIVE",
  "tags": [],
  "createdAt": "2026-03-01T...",
  "updatedAt": "2026-03-01T..."
}
```

**✅ Verify**:
- All 13 new fields present in response
- No undefined values (only null where applicable)
- Status code 201
- Client created in database

---

## Test 2: Validation - COMMERCIAL Housing Type Should Fail

**Request**:
```
POST http://localhost:3001/api/clients HTTP/1.1
Content-Type: application/json

{
  "name": "Bad Housing Type",
  "phone": "+34912345679",
  "housingType": "COMMERCIAL"
}
```

**Expected Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "El tipo de vivienda es inválido",
  "error": "Bad Request"
}
```

**✅ Verify**:
- COMMERCIAL is rejected
- Error message is clear
- Status code 400

---

## Test 3: Validation - do_not_contact Requires Reason

**Request**:
```
POST http://localhost:3001/api/clients HTTP/1.1
Content-Type: application/json

{
  "name": "Do Not Contact Test",
  "phone": "+34912345680",
  "doNotContact": true
}
```

**Expected Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "La razón de no contactar es obligatoria cuando el toggle está activo",
  "error": "Bad Request"
}
```

**✅ Verify**:
- doNotContact=true without reason is rejected
- Error message is clear
- Status code 400

---

## Test 4: Validation - Invalid Time Range

**Request**:
```
POST http://localhost:3001/api/clients HTTP/1.1
Content-Type: application/json

{
  "name": "Bad Time Range",
  "phone": "+34912345681",
  "preferredContactTimeStart": "18:00",
  "preferredContactTimeEnd": "09:00"
}
```

**Expected Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "La hora de inicio debe ser anterior a la hora de fin",
  "error": "Bad Request"
}
```

**✅ Verify**:
- Start time >= end time is rejected
- Error is clear
- Status code 400

---

## Test 5: Valid Housing Types (Only 3 Allowed)

**Test Each Valid Type**:

```
# Test 1: HOUSE
POST ... {
  "name": "Cliente Casa",
  "phone": "+34912345682",
  "housingType": "HOUSE"
}

# Test 2: APARTMENT
POST ... {
  "name": "Cliente Depto",
  "phone": "+34912345683",
  "housingType": "APARTMENT"
}

# Test 3: OTHER
POST ... {
  "name": "Cliente Otro",
  "phone": "+34912345684",
  "housingType": "OTHER"
}
```

**Expected Response**: 201 Created for each

**✅ Verify**:
- All 3 types accepted
- Values persisted correctly
- No reference to COMMERCIAL

---

## Test 6: Get Client (Verify All Fields Returned)

**Request**:
```
GET http://localhost:3001/api/clients/550e8400-e29b-41d4-a716-446655440000
```

**Expected Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "clinicId": "...",
  "name": "Full Test Client",
  "phone": "+34912345678",
  "email": "test@example.com",
  "address": "Calle Principal 123",
  "notes": "Test notes",
  "priceListId": null,
  "whatsappNumber": "+34666123456",
  "phoneSecondary": "+34912987654",
  "preferredContactMethod": "WHATSAPP",
  "preferredContactTimeStart": "09:00",
  "preferredContactTimeEnd": "18:00",
  "housingType": "APARTMENT",
  "accessNotes": "Acceso por portón rojo",
  "serviceNotes": "Perro necesita bozal",
  "doNotContact": false,
  "doNotContactReason": null,
  "status": "ACTIVE",
  "tags": [],
  "createdAt": "2026-03-01T...",
  "updatedAt": "2026-03-01T..."
}
```

**✅ Verify**:
- All 13 new fields present
- Values match what was created/updated
- No missing fields
- Status code 200

---

## Test 7: Update Client (Partial Payload)

**Request**:
```
PATCH http://localhost:3001/api/clients/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "whatsappNumber": "+34666999888",
  "preferredContactMethod": "PHONE",
  "doNotContact": true,
  "doNotContactReason": "Cliente bloqueado por comportamiento"
}
```

**Expected Response** (200 OK):
```json
{
  "id": "...",
  "whatsappNumber": "+34666999888",
  "preferredContactMethod": "PHONE",
  "doNotContact": true,
  "doNotContactReason": "Cliente bloqueado por comportamiento",
  "... other fields unchanged ..."
}
```

**✅ Verify**:
- Partial fields updated correctly
- Only provided fields changed
- Other fields remain unchanged
- Validation still works
- Status code 200

---

## Test 8: Update with Invalid Housing Type

**Request**:
```
PATCH http://localhost:3001/api/clients/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "housingType": "COMMERCIAL"
}
```

**Expected Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "El tipo de vivienda es inválido",
  "error": "Bad Request"
}
```

**✅ Verify**:
- Update validation works
- COMMERCIAL rejected in PATCH too
- Status code 400

---

## Test 9: Clear Fields (Set to Null)

**Request**:
```
PATCH http://localhost:3001/api/clients/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "whatsappNumber": null,
  "phoneSecondary": null,
  "accessNotes": null,
  "doNotContact": false,
  "doNotContactReason": null
}
```

**Expected Response** (200 OK):
- All specified fields set to null
- Client still valid
- Status code 200

**✅ Verify**:
- Can clear previously set fields
- Null values are accepted
- No validation errors for null values

---

## Test 10: List Clients with Pagination

**Request**:
```
GET http://localhost:3001/api/clients?page=1&limit=10
```

**Expected Response** (200 OK):
```json
{
  "data": [
    {
      "id": "...",
      "name": "...",
      "whatsappNumber": "...",
      "preferredContactMethod": "...",
      "... all fields ..."
    },
    ...
  ],
  "total": 42
}
```

**✅ Verify**:
- Each client includes all 13 new fields
- Pagination works
- No missing fields in list view
- Status code 200

---

## Database Verification

### Check Constraint Updated

```sql
-- Connect to database
psql -U postgres -d vibralive

-- Query the constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'chk_housing_type';

-- Expected output:
-- chk_housing_type | (housing_type IS NULL OR housing_type IN ('HOUSE', 'APARTMENT', 'OTHER'))
```

### Check Columns Exist

```sql
-- List all client columns
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;

-- Verify these exist:
-- whatsapp_number, phone_secondary, preferred_contact_method,
-- preferred_contact_time_start, preferred_contact_time_end,
-- housing_type, access_notes, service_notes,
-- do_not_contact, do_not_contact_reason, status
```

### Check Sample Data

```sql
-- Query a client with all fields
SELECT *
FROM clients
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Verify all 13 new fields have data or NULL
```

---

## Common Issues & Troubleshooting

### Issue: "housing_type" validation still accepts COMMERCIAL

**Cause**: Migration not applied or old validator running

**Solution**:
1. Stop backend server
2. Run migrations: `npm run typeorm migration:run`
3. Restart server: `npm run dev`
4. Clear backend cache if using (may vary by framework)

---

### Issue: do_not_contact_reason validation not working

**Cause**: Validator not being called or DTO not validated

**Solution**:
1. Check ClientValidator is injected in service
2. Verify validatePreferences() is called in createClient() and updateClient()
3. Check DTO validation pipes are enabled in NestJS

---

### Issue: Fields not persisting to database

**Cause**: TypeORM mapping or migration issue

**Solution**:
1. Verify entity has all @Column decorators
2. Check migration created all columns
3. Run migration with detailed logging
4. Verify database via SQL client

---

### Issue: Response missing new fields

**Cause**: mapToResponseDto not including them

**Solution**:
1. Check mapToResponseDto maps all fields
2. Verify ClientResponseDto has all fields
3. Test direct database query to confirm data exists
4. Add console.log in mapToResponseDto to debug

---

## Performance Testing

After validation tests pass:

```
# Create 100 clients with new fields
for i in {1..100}
do
  curl -X POST http://localhost:3001/api/clients \
    -H "Content-Type: application/json" \
    -d '{...payload...}'
done

# Time the list endpoint
time curl http://localhost:3001/api/clients?limit=100

# Verify response time < 500ms
```

---

## Integration Test Checklist

```
✅ Create Client
☐ All fields persisted
☐ housingType COMMERCIAL rejected
☐ do_not_contact_reason required when toggle ON
☐ Time range validated

✅ Read Client (GET)
☐ All 13 new fields present
☐ No undefined values
☐ Relationships loaded (tags, addresses)

✅ Update Client (PATCH)
☐ Partial update works
☐ Validation still applies
☐ Can set fields to null

✅ List Clients
☐ Each client has all fields
☐ Pagination works
☐ Performance acceptable

✅ Delete Client
☐ Client removed
☐ Cascading deletes work
☐ Tags/addresses cleaned up

✅ Validation
☐ COMMERCIAL rejected (CREATE)
☐ COMMERCIAL rejected (UPDATE)
☐ Time range validated
☐ do_not_contact_reason required
☐ All enum values validated

✅ Database
☐ Constraint updated
☐ Columns exist
☐ Data types correct
☐ Default values applied
```

---

## Next Steps

1. ✅ Run migrations
2. ✅ Test all endpoints (use examples above)
3. ✅ Verify validation works
4. ✅ Check database constraints
5. ✅ Test frontend↔backend integration
6. ✅ Deploy to staging
7. ✅ Run API tests against staging API
8. ✅ Deploy to production

---

## Resources

- **Backend Architecture**: [BACKEND_IMPLEMENTATION_COMPLETE.md](BACKEND_IMPLEMENTATION_COMPLETE.md)
- **Frontend Integration**: [FULL_STACK_INTEGRATION_COMPLETE.md](FULL_STACK_INTEGRATION_COMPLETE.md)
- **Frontend Testing**: [TESTING_GUIDE.md](TESTING_GUIDE.md)

---

## Questions?

If a test fails:

1. **Check the error message** - it should indicate the problem
2. **Verify migrations ran** - `npm run typeorm migration:run`
3. **Check database directly** - verify data and constraints exist
4. **Review the implementation** - check validators and DTOs
5. **Look at logs** - NestJS logs should show validation errors

**Status: READY FOR TESTING** ✅
