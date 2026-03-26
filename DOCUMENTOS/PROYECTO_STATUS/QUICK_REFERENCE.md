# 🎯 MVP QUICK REFERENCE - Endpoints & cURL Examples

---

## 📋 APPOINTMENTS ENDPOINTS

### POST /appointments (Create)
```bash
curl -X POST http://localhost:3000/appointments \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "pet_id": "uuid-here",
    "client_id": "uuid-here",
    "scheduled_at": "2026-02-26T14:30:00Z",
    "reason": "Vacunación",
    "duration_minutes": 45
  }'
```
**Response:**
```json
{
  "id": "uuid",
  "pet_id": "uuid",
  "client_id": "uuid",
  "status": "SCHEDULED",
  "scheduled_at": "2026-02-26T14:30:00Z",
  "created_at": "2026-02-25T10:00:00Z"
}
```

### GET /appointments (List)
```bash
curl http://localhost:3000/appointments \
  -H "Authorization: Bearer <JWT>" \
  -G \
  --data-urlencode "status=SCHEDULED" \
  --data-urlencode "client_id=uuid" \
  --data-urlencode "page=1" \
  --data-urlencode "limit=20"
```

### GET /appointments/:id (Get one)
```bash
curl http://localhost:3000/appointments/uuid \
  -H "Authorization: Bearer <JWT>"
```

### PUT /appointments/:id (Update)
```bash
curl -X PUT http://localhost:3000/appointments/uuid \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Revised reason",
    "scheduled_at": "2026-02-27T14:30:00Z"
  }'
```

### PATCH /appointments/:id/status (Change Status)
```bash
curl -X PATCH http://localhost:3000/appointments/uuid/status \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CONFIRMED"
  }'
```

**Statuses:** `SCHEDULED` | `CONFIRMED` | `CANCELLED` | `COMPLETED`

Para **CANCEL** con razón:
```bash
curl -X PATCH http://localhost:3000/appointments/uuid/status \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CANCELLED",
    "cancellation_reason": "Cliente canceló por emergencia"
  }'
```

---

## 💬 WHATSAPP ENDPOINTS

### POST /whatsapp/send (Enqueue Message)
```bash
curl -X POST http://localhost:3000/whatsapp/send \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+5215512345678",
    "message_body": "Hola, tu cita es mañana a las 10am",
    "client_id": "uuid",
    "idempotency_key": "unique-key-123",
    "message_type": "reminder"
  }'
```
**Response (202 Accepted):**
```json
{
  "id": "uuid",
  "status": "queued",
  "idempotency_key": "unique-key-123",
  "created_at": "2026-02-25T10:00:00Z"
}
```

**⚠️ ERROR (409 Conflict) si already enqueued:**
```json
{
  "statusCode": 409,
  "message": "Message already queued with this idempotency key"
}
```

### GET /whatsapp/outbox (List Messages)
```bash
curl http://localhost:3000/whatsapp/outbox \
  -H "Authorization: Bearer <JWT>" \
  -G \
  --data-urlencode "status=queued" \
  --data-urlencode "page=1" \
  --data-urlencode "limit=20"
```

**Status filters:** `queued` | `sent` | `failed` | `delivered`

### GET /whatsapp/outbox/:id (Get Message)
```bash
curl http://localhost:3000/whatsapp/outbox/uuid \
  -H "Authorization: Bearer <JWT>"
```

**Response:**
```json
{
  "id": "uuid",
  "phone_number": "+5215512345678",
  "message_body": "...",
  "status": "sent",
  "retry_count": 0,
  "provider_message_id": "MOCK_123456789",
  "provider_error": null,
  "sent_at": "2026-02-25T10:00:30Z",
  "created_at": "2026-02-25T10:00:00Z"
}
```

### PATCH /whatsapp/outbox/:id/retry (Retry Failed)
```bash
curl -X PATCH http://localhost:3000/whatsapp/outbox/uuid/retry \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Response:**
```json
{
  "id": "uuid",
  "status": "queued",
  "retry_count": 0
}
```

---

## 👥 CLIENTS ENDPOINTS

### POST /clients (Create)
```bash
curl -X POST http://localhost:3000/clients \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "phone": "+5215512345678",
    "email": "juan@example.com",
    "address": "Calle 1, CDMX"
  }'
```

### GET /clients (List)
```bash
curl http://localhost:3000/clients \
  -H "Authorization: Bearer <JWT>" \
  -G --data-urlencode "page=1" --data-urlencode "limit=20"
```

### GET /clients/:id (Get)
```bash
curl http://localhost:3000/clients/uuid \
  -H "Authorization: Bearer <JWT>"
```

Returns: `{ id, name, phone, email, address, pets: [...], created_at }`

### PUT /clients/:id (Update)
```bash
curl -X PUT http://localhost:3000/clients/uuid \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Carlos Pérez",
    "address": "Calle 2, CDMX"
  }'
```

### DELETE /clients/:id (Soft Delete)
```bash
curl -X DELETE http://localhost:3000/clients/uuid \
  -H "Authorization: Bearer <JWT>"
```

---

## 🐾 PETS ENDPOINTS

### POST /pets (Create)
```bash
curl -X POST http://localhost:3000/pets \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "uuid",
    "name": "Fluffy",
    "animal_type_id": 1,
    "breed": "Persa",
    "birth_date": "2020-01-15",
    "gender": "FEMALE",
    "weight_kg": 4.5
  }'
```

### GET /pets (List)
```bash
curl http://localhost:3000/pets \
  -H "Authorization: Bearer <JWT>" \
  -G --data-urlencode "client_id=uuid"
```

### GET /pets/:id (Get)
```bash
curl http://localhost:3000/pets/uuid \
  -H "Authorization: Bearer <JWT>"
```

### PUT /pets/:id (Update)
```bash
curl -X PUT http://localhost:3000/pets/uuid \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "weight_kg": 5.2,
    "breed": "Persa Mix"
  }'
```

---

## 👤 USERS ENDPOINTS

### POST /users (Create User in Clinic)
```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. García",
    "email": "garcia@clinic.com",
    "phone": "+525551234567",
    "role": "STAFF",
    "password": "SecurePass123!"
  }'
```

**Roles:** `CLINIC_ADMIN` | `STAFF`

### GET /users (List)
```bash
curl http://localhost:3000/users \
  -H "Authorization: Bearer <JWT>"
```

### GET /users/:id (Get)
```bash
curl http://localhost:3000/users/uuid \
  -H "Authorization: Bearer <JWT>"
```

### PATCH /users/:id (Update)
```bash
curl -X PATCH http://localhost:3000/users/uuid \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. García Actualizado",
    "phone": "+5255512345678"
  }'
```

### PATCH /users/:id/deactivate (Deactivate)
```bash
curl -X PATCH http://localhost:3000/users/uuid/deactivate \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 🏥 CLINICS ENDPOINTS

### POST /clinics (Create Clinic - Public)
```bash
curl -X POST http://localhost:3000/clinics \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Clínica Nueva",
    "phone": "+5215567890123",
    "city": "México DF",
    "country": "MX"
  }'
```

### GET /clinics/:id (Get Clinic Details)
```bash
curl http://localhost:3000/clinics/uuid \
  -H "Authorization: Bearer <JWT>"
```

### PATCH /clinics/:id/status (Update Status - SuperAdmin Only)
```bash
curl -X PATCH http://localhost:3000/clinics/uuid/status \
  -H "Authorization: Bearer <SUPERADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SUSPENDED",
    "reason": "Non-payment"
  }'
```

**Statuses:** `ACTIVE` | `SUSPENDED` | `DELETED`

### GET /clinics (List Clinics - SuperAdmin Only)
```bash
curl http://localhost:3000/clinics \
  -H "Authorization: Bearer <SUPERADMIN_JWT>" \
  -G --data-urlencode "page=1" --data-urlencode "limit=50"
```

---

## 🔐 AUTH ENDPOINTS

### POST /auth/login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@clinic.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "name": "Dr. García",
    "role": "CLINIC_ADMIN",
    "clinic_id": "uuid"
  },
  "clinic": {
    "id": "uuid",
    "name": "Mi Clínica",
    "status": "ACTIVE"
  }
}
```

### POST /auth/register (Create Clinic + Owner)
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "clinic_name": "Clínica Nueva",
    "clinic_phone": "+5215567890123",
    "owner_name": "María González",
    "owner_email": "maria@clinic.com",
    "password": "SecurePass123!",
    "city": "México DF"
  }'
```

**Password requirements:**
- Min 8 caracteres
- 1 mayúscula
- 1 número
- 1 carácter especial

### POST /auth/logout
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <JWT>"
```

---

## 🧪 TESTING FLOWS

### Flujo Completo: Create Appointment + Send WhatsApp Reminder

```bash
#!/bin/bash

# 1. Login (obtienes JWT)
JWT=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinic.com",
    "password": "password123"
  }' | jq -r '.access_token')

echo "JWT: $JWT"

# 2. List pets to get a pet_id
PET=$(curl -s http://localhost:3000/pets \
  -H "Authorization: Bearer $JWT" | jq -r '.data[0]')

PET_ID=$(echo $PET | jq -r '.id')
CLIENT_ID=$(echo $PET | jq -r '.client_id')

echo "Pet ID: $PET_ID"

# 3. Create appointment
APPT=$(curl -s -X POST http://localhost:3000/appointments \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{
    \"pet_id\": \"$PET_ID\",
    \"client_id\": \"$CLIENT_ID\",
    \"scheduled_at\": \"$(date -d '+1 day' -Iseconds)\",
    \"reason\": \"Vacunación\"
  }")

APPT_ID=$(echo $APPT | jq -r '.id')
echo "Appointment created: $APPT_ID"

# 4. Enqueue WhatsApp message
MSG=$(curl -s -X POST http://localhost:3000/whatsapp/send \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone_number\": \"+5215512345678\",
    \"message_body\": \"Recordatorio: Tu cita de $PET_ID es mañana\",
    \"client_id\": \"$CLIENT_ID\",
    \"idempotency_key\": \"reminder-$(date +%s)\",
    \"message_type\": \"reminder\"
  }")

MSG_ID=$(echo $MSG | jq -r '.id')
echo "Message queued: $MSG_ID"

# 5. Confirm appointment
curl -s -X PATCH http://localhost:3000/appointments/$APPT_ID/status \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}'

echo "Appointment confirmed"

# 6. Check message status (después de 30s, cuando worker procese)
sleep 35
curl -s http://localhost:3000/whatsapp/outbox/$MSG_ID \
  -H "Authorization: Bearer $JWT" | jq '.status'
```

---

## ❌ ERROR CODES & RESPONSES

| Code | Scenario | Response |
|------|----------|----------|
| 400 | Invalid DTO (validation failed) | `{ "statusCode": 400, "message": "...", "errors": [...] }` |
| 401 | No JWT token | `{ "statusCode": 401, "message": "Unauthorized" }` |
| 403 | Clinic suspended OR cross-tenant access | `{ "statusCode": 403, "message": "Clinic is suspended" }` |
| 404 | Resource not found in clinic | `{ "statusCode": 404, "message": "Not found" }` |
| 409 | Duplicate idempotency key | `{ "statusCode": 409, "message": "Message already queued..." }` |
| 500 | Server error | `{ "statusCode": 500, "message": "Internal server error" }` |

---

## 🔐 JWT TOKEN STRUCTURE

**JWT Payload (decoded):**
```json
{
  "id": "user-uuid",
  "email": "user@clinic.com",
  "clinic_id": "clinic-uuid",
  "role": "CLINIC_ADMIN",
  "iat": 1708873200,
  "exp": 1708876800
}
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📝 VALIDATION RULES (DTO Level)

### Phone Numbers
- **Format:** E.164 (país + número)
- **Examples:** `+5215512345678`, `+525555555555`
- **Validation:** `@IsPhoneNumber('MX')` o similar

### Emails
- **Format:** RFC 5322
- **Examples:** `user@clinic.com`, `staff+test@example.com`
- **Validation:** `@IsEmail()`

### Dates
- **Format:** ISO 8601
- **Examples:** `2026-02-26T14:30:00Z`
- **Validation:** `@IsISO8601()`

### UUIDs
- **Format:** RFC 4122
- **Examples:** `550e8400-e29b-41d4-a716-446655440000`
- **Validation:** `@IsUUID()`

### Passwords (MVP)
- Min 6 caracteres
- (Post-MVP: 8+ con mayúscula, número, especial)

---

## 🎯 QUICK TESTING CHECKLIST

- [ ] Create appointment → 201
- [ ] Get appointment → 200
- [ ] Update appointment → 200
- [ ] Change status SCHEDULED→CONFIRMED → 200 + AuditLog
- [ ] Enqueue WhatsApp → 202 (Accepted)
- [ ] Retry enqueue same key → 409 Conflict
- [ ] Get outbox list → 200
- [ ] Clinic SUSPENDED → GET appointment → 403
- [ ] Create User in SUSPENDED clinic → 403
- [ ] Cross-clinic access → 403

---

## 📞 USEFUL TOOLS

```bash
# Generate JWT locally (para testing manual):
# Usa https://jwt.io (online) o jwt-cli (CLI)

# Pretty-print JSON:
curl ... | jq '.'

# Extract token:
TOKEN=$(curl -s ... | jq -r '.access_token')

# Pretty curl en archivo:
curl ... --write-out '\n' > response.json

# Test idempotency:
IDEMPOTENT_KEY="key-$(date +%s)"
# Enviar 2x con mismo key → segunda vez 409
```

---

**Document version:** 1.0  
**Last updated:** February 2026  
**Ready:** ✅ Copy-paste ready for quick testing
