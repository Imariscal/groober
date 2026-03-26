# VibraLive Backend - Servicios y APIs

**Última actualización:** Febrero 25, 2026

---

## 📋 Tabla de Contenidos

1. [Autenticación](#autenticación)
2. [Citas Veterinarias](#citas-veterinarias)
3. [WhatsApp - Mensajería](#whatsapp---mensajería)
4. [Plataforma - Admin](#plataforma---admin)
5. [Headers y Autenticación](#headers-y-autenticación)
6. [Códigos de Error](#códigos-de-error)
7. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 🔐 Autenticación

### Módulo: `auth`

**Ubicación:** `/src/modules/auth/`

**Descripción:** Gestiona login, registro de nuevas clínicas y autenticación JWT.

---

### Endpoints

#### 1. **GET /api/auth/test**

Test endpoint para verificar que el backend responde.

**Método:** GET  
**Autenticación:** ❌ No requerida  
**Content-Type:** application/json

**Respuesta (200 OK):**
```json
{
  "message": "Backend está respondiendo correctamente",
  "timestamp": "2026-02-25T10:30:00.000Z",
  "path": "/api/auth/login expect POST con { email, password }"
}
```

---

#### 2. **POST /api/auth/login**

Login de usuario (staff o owner de clínica).

**Método:** POST  
**Autenticación:** ❌ No requerida  
**Content-Type:** application/json  
**Respuesta:** HTTP 200

**Request Body:**
```typescript
{
  email: string;           // Email del usuario (formato válido)
  password: string;        // Contraseña (mínimo 6 caracteres)
}
```

**Body Ejemplo:**
```json
{
  "email": "owner@vibralive.test",
  "password": "Admin@123456"
}
```

**Respuesta (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "clinic_id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "owner@vibralive.test",
    "name": "Dr. Owner",
    "role": "owner",
    "status": "ACTIVE",
    "phone": "+525551234567"
  }
}
```

**Errores:**
- `401 Unauthorized` - Credenciales inválidas
- `400 Bad Request` - Validación de DTO fallida

---

#### 3. **POST /api/auth/register**

Registro de nueva clínica con propietario.

**Método:** POST  
**Autenticación:** ❌ No requerida  
**Content-Type:** application/json  
**Respuesta:** HTTP 201

**Request Body:**
```typescript
{
  clinic_name: string;      // Nombre de la clínica (3-100 caracteres)
  clinic_phone: string;     // Teléfono (formato E.164, ej: +525512345678)
  owner_name: string;       // Nombre del propietario (3-100 caracteres)
  owner_email: string;      // Email del propietario
  password: string;         // Contraseña (8+ chars, mayús, minús, número, especial)
  city?: string;            // Ciudad (opcional, 3-100 caracteres)
}
```

**Body Ejemplo:**
```json
{
  "clinic_name": "Veterinaria Central",
  "clinic_phone": "+525551234567",
  "owner_name": "Dr. Carlos López",
  "owner_email": "carlos@veterinaria.com",
  "password": "SecurePass@123",
  "city": "Mexico City"
}
```

**Respuesta (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "clinic_id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "carlos@veterinaria.com",
    "name": "Dr. Carlos López",
    "role": "owner",
    "status": "ACTIVE",
    "phone": "+525551234567"
  }
}
```

**Validaciones:**
- Email debe ser válido (formato RFC 5322)
- Teléfono en formato E.164 (ej: +525512345678)
- Contraseña mínimo 8 caracteres con mayúsculas, minúsculas, números y caracteres especiales
- Nombre de clínica 3-100 caracteres

---

#### 4. **GET /api/auth/me**

Obtener perfil del usuario actual con permisos.

**Método:** GET  
**Autenticación:** ✅ Requerida (JWT)  
**Content-Type:** application/json  
**Respuesta:** HTTP 200

**Headers Requeridos:**
```
Authorization: Bearer <access_token>
```

**Respuesta (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "clinic_id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "owner@vibralive.test",
    "name": "Dr. Owner",
    "role": "owner",
    "status": "ACTIVE",
    "phone": "+525551234567",
    "permissions": [
      "clinics:read",
      "clients:create",
      "clients:read",
      "clients:update",
      "clients:delete",
      "pets:create",
      "pets:read",
      "pets:update",
      "pets:delete",
      "appointments:create",
      "appointments:read",
      "appointments:update",
      "appointments:delete",
      "reminders:read",
      "whatsapp:send",
      "whatsapp:read"
    ],
    "available_features": [
      "appointments",
      "whatsapp",
      "reminders",
      "analytics"
    ],
    "available_menu": {
      "main": ["dashboard", "appointments", "clients", "pets"],
      "settings": ["clinic", "users", "billing"]
    }
  },
  "timestamp": "2026-02-25T10:30:00.000Z"
}
```

**Errores:**
- `401 Unauthorized` - Token inválido o expirado
- `403 Forbidden` - Usuario sin permisos

---

## 📅 Citas Veterinarias

### Módulo: `appointments`

**Ubicación:** `/src/modules/appointments/`

**Descripción:** CRUD completo de citas veterinarias con estados y validaciones multi-tenant.

**Guardia:** `AuthGuard('jwt')` + `TenantGuard`

---

### Endpoints

#### 1. **POST /api/appointments**

Crear nueva cita veterinaria.

**Método:** POST  
**Autenticación:** ✅ Requerida  
**Content-Type:** application/json  
**Respuesta:** HTTP 201

**Request Body:**
```typescript
{
  pet_id: string;              // UUID de la mascota
  client_id: string;           // UUID del cliente
  scheduled_at: string;        // ISO 8601 timestamp de la cita
  reason?: string;             // Motivo de la cita (opcional)
  duration_minutes?: number;   // Duración estimada en minutos (opcional)
  veterinarian_id?: string;    // UUID del veterinario (opcional)
  notes?: string;              // Notas adicionales (opcional)
}
```

**Body Ejemplo:**
```json
{
  "pet_id": "550e8400-e29b-41d4-a716-446655440010",
  "client_id": "550e8400-e29b-41d4-a716-446655440020",
  "scheduled_at": "2026-03-01T14:30:00Z",
  "reason": "Revisión de rutina",
  "duration_minutes": 30,
  "notes": "El paciente es reactivo, tomar precauciones"
}
```

**Respuesta (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440030",
  "clinicId": "550e8400-e29b-41d4-a716-446655440001",
  "petId": "550e8400-e29b-41d4-a716-446655440010",
  "clientId": "550e8400-e29b-41d4-a716-446655440020",
  "scheduledAt": "2026-03-01T14:30:00Z",
  "status": "SCHEDULED",
  "reason": "Revisión de rutina",
  "durationMinutes": 30,
  "veterinarianId": null,
  "notes": "El paciente es reactivo, tomar precauciones",
  "cancelledAt": null,
  "cancelledBy": null,
  "createdAt": "2026-02-25T10:30:00Z",
  "updatedAt": "2026-02-25T10:30:00Z"
}
```

---

#### 2. **GET /api/appointments**

Obtener todas las citas de la clínica.

**Método:** GET  
**Autenticación:** ✅ Requerida  
**Respuesta:** HTTP 200

**Query Parameters:**
```
status?: string              // Filter: SCHEDULED|CONFIRMED|COMPLETED|CANCELLED
scheduled_at_from?: string   // Filter: ISO 8601 date
scheduled_at_to?: string     // Filter: ISO 8601 date
pet_id?: string              // Filter: por mascota
client_id?: string           // Filter: por cliente
page?: number                // Paginación (default: 1)
limit?: number               // Registros por página (default: 20)
```

**Ejemplo:**
```
GET /api/appointments?status=SCHEDULED&page=1&limit=20
```

**Respuesta (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440030",
      "clinicId": "550e8400-e29b-41d4-a716-446655440001",
      "petId": "550e8400-e29b-41d4-a716-446655440010",
      "clientId": "550e8400-e29b-41d4-a716-446655440020",
      "scheduledAt": "2026-03-01T14:30:00Z",
      "status": "SCHEDULED",
      "reason": "Revisión de rutina",
      "durationMinutes": 30,
      "pet": {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "name": "Max",
        "breed": "Golden Retriever"
      },
      "client": {
        "id": "550e8400-e29b-41d4-a716-446655440020",
        "name": "Juan García",
        "phone": "+525551111111"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

#### 3. **GET /api/appointments/:id**

Obtener detalles de una cita específica.

**Método:** GET  
**Autenticación:** ✅ Requerida  
**Respuesta:** HTTP 200

**URL Parameters:**
- `:id` - UUID de la cita

**Respuesta (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440030",
  "clinicId": "550e8400-e29b-41d4-a716-446655440001",
  "petId": "550e8400-e29b-41d4-a716-446655440010",
  "clientId": "550e8400-e29b-41d4-a716-446655440020",
  "scheduledAt": "2026-03-01T14:30:00Z",
  "status": "SCHEDULED",
  "reason": "Revisión de rutina",
  "durationMinutes": 30,
  "veterinarianId": null,
  "notes": "El paciente es reactivo",
  "cancelledAt": null,
  "cancelledBy": null,
  "cancellationReason": null,
  "createdAt": "2026-02-25T10:30:00Z",
  "updatedAt": "2026-02-25T10:30:00Z",
  "pet": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "name": "Max",
    "breed": "Golden Retriever",
    "birthDate": "2020-05-15"
  },
  "client": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "name": "Juan García",
    "phone": "+525551111111",
    "email": "juan@example.com"
  }
}
```

---

#### 4. **PUT /api/appointments/:id**

Actualizar detalles de una cita.

**Método:** PUT  
**Autenticación:** ✅ Requerida  
**Content-Type:** application/json  
**Respuesta:** HTTP 200

**Request Body:**
```typescript
{
  reason?: string;             // Motivo
  duration_minutes?: number;   // Duración en minutos
  veterinarian_id?: string;    // Veterinario asignado
  notes?: string;              // Notas
  scheduled_at?: string;       // Nueva fecha (ISO 8601)
}
```

**Body Ejemplo:**
```json
{
  "reason": "Revisión de rutina + vacunación",
  "duration_minutes": 45,
  "veterinarian_id": "550e8400-e29b-41d4-a716-446655440100"
}
```

**Respuesta (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440030",
  "clinicId": "550e8400-e29b-41d4-a716-446655440001",
  "reason": "Revisión de rutina + vacunación",
  "durationMinutes": 45,
  "veterinarianId": "550e8400-e29b-41d4-a716-446655440100",
  "status": "SCHEDULED",
  "updatedAt": "2026-02-25T11:00:00Z"
}
```

---

#### 5. **PATCH /api/appointments/:id/status**

Cambiar estado de una cita (workflow).

**Método:** PATCH  
**Autenticación:** ✅ Requerida  
**Content-Type:** application/json  
**Respuesta:** HTTP 200

**Estados válidos:**
- `SCHEDULED` → `CONFIRMED` - El cliente confirmó
- `SCHEDULED/CONFIRMED` → `COMPLETED` - Cita realizada
- `SCHEDULED/CONFIRMED` → `CANCELLED` - Cita cancelada

**Request Body:**
```typescript
{
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  cancellation_reason?: string;  // Requerido si status es CANCELLED
}
```

**Body Ejemplo (Confirmación):**
```json
{
  "status": "CONFIRMED"
}
```

**Body Ejemplo (Cancelación):**
```json
{
  "status": "CANCELLED",
  "cancellation_reason": "Cliente canceló por motivos personales"
}
```

**Respuesta (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440030",
  "status": "CONFIRMED",
  "cancelledAt": null,
  "cancelledBy": null,
  "cancellationReason": null,
  "updatedAt": "2026-02-25T11:15:00Z"
}
```

---

## 💬 WhatsApp - Mensajería

### Módulo: `whatsapp`

**Ubicación:** `/src/modules/whatsapp/`

**Descripción:** Envío, queueing y retry automático de mensajes WhatsApp. Soporta idempotencia para evitar duplicados.

**Guardia:** `AuthGuard('jwt')` + `TenantGuard`

---

### Endpoints

#### 1. **POST /api/whatsapp/send**

Encolar mensaje para envío asincrónico.

**Método:** POST  
**Autenticación:** ✅ Requerida  
**Content-Type:** application/json  
**Respuesta:** HTTP 202 (Accepted - Procesamiento Asincrónico)

**Request Body:**
```typescript
{
  phone_number: string;           // Número destino (formato E.164)
  message_body: string;           // Contenido del mensaje (max 4096 chars)
  message_type?: string;          // Tipo: appointment_reminder|confirmation|custom
  idempotency_key?: string;       // Clave para idempotencia (genera UUID si no provee)
  client_id?: string;             // UUID del cliente (opcional)
}
```

**Body Ejemplo:**
```json
{
  "phone_number": "+525551234567",
  "message_body": "Recordatorio: Tu cita es mañana a las 14:30 con Dr. López",
  "message_type": "appointment_reminder",
  "idempotency_key": "appt-550e8400-20260225-reminder",
  "client_id": "550e8400-e29b-41d4-a716-446655440020"
}
```

**Respuesta (202 Accepted):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440040",
  "status": "queued",
  "phoneNumber": "+525551234567",
  "messageType": "appointment_reminder",
  "idempotencyKey": "appt-550e8400-20260225-reminder",
  "createdAt": "2026-02-25T10:30:00Z"
}
```

**Nota:** El mensaje es encolado para procesamiento asincrónico. El worker de WhatsApp lo enviará en background.

---

#### 2. **GET /api/whatsapp/outbox**

Obtener mensajes de la cola de salida (filtered).

**Método:** GET  
**Autenticación:** ✅ Requerida  
**Respuesta:** HTTP 200

**Query Parameters:**
```
status?: string              // Filter: queued|sent|failed|delivered
message_type?: string        // Filter: por tipo de mensaje
page?: number                // Paginación (default: 1)
limit?: number               // Registros por página (default: 20)
```

**Ejemplo:**
```
GET /api/whatsapp/outbox?status=queued&page=1&limit=10
```

**Respuesta (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440040",
      "phoneNumber": "+525551234567",
      "messageBody": "Recordatorio: Tu cita es mañana a las 14:30",
      "status": "queued",
      "messageType": "appointment_reminder",
      "retryCount": 0,
      "maxRetries": 5,
      "providerMessageId": null,
      "sentAt": null,
      "createdAt": "2026-02-25T10:30:00Z",
      "clientId": "550e8400-e29b-41d4-a716-446655440020"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5
  }
}
```

---

#### 3. **GET /api/whatsapp/outbox/:id**

Obtener detalles de un mensaje específico.

**Método:** GET  
**Autenticación:** ✅ Requerida  
**Respuesta:** HTTP 200

**URL Parameters:**
- `:id` - UUID del mensaje

**Respuesta (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440040",
  "phoneNumber": "+525551234567",
  "messageBody": "Recordatorio: Tu cita es mañana a las 14:30",
  "clientId": "550e8400-e29b-41d4-a716-446655440020",
  "status": "sent",
  "messageType": "appointment_reminder",
  "idempotencyKey": "appt-550e8400-20260225-reminder",
  "retryCount": 0,
  "maxRetries": 5,
  "providerMessageId": "wamid.HBEUGVhYmZkZTI0YT",
  "providerError": null,
  "lastRetryAt": null,
  "sentAt": "2026-02-25T10:35:00Z",
  "createdAt": "2026-02-25T10:30:00Z",
  "updatedAt": "2026-02-25T10:35:00Z"
}
```

---

#### 4. **PATCH /api/whatsapp/outbox/:id/retry**

Reintentar envío de un mensaje fallido.

**Método:** PATCH  
**Autenticación:** ✅ Requerida  
**Content-Type:** application/json  
**Respuesta:** HTTP 202 (Accepted)

**URL Parameters:**
- `:id` - UUID del mensaje

**Request Body:**
```json
{}  // Body vacío o ambos parámetros opcionales
```

**Respuesta (202 Accepted):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440040",
  "status": "queued",
  "retryCount": 1,
  "maxRetries": 5,
  "lastRetryAt": "2026-02-25T11:10:00Z"
}
```

---

### Estrategia de Reintentos

El módulo WhatsApp implementa **reintentos automáticos** para mensajes fallidos:

```
Intento 1: Inmediato al encolar
Intento 2: +1 minuto
Intento 3: +5 minutos
Intento 4: +15 minutos
Intento 5: +1 hora
```

Si todos los reintentos fallan, el estado cambia a `failed` y requiere intervención manual.

---

### Idempotencia

Cada mensaje debe tener un `idempotency_key` único. Si se envía el mismo mensaje dos veces:

```javascript
POST /api/whatsapp/send
{
  "idempotency_key": "appt-123-reminder",
  "phone_number": "+525551234567",
  ...
}

// Segunda llamada con el mismo idempotency_key
POST /api/whatsapp/send
{
  "idempotency_key": "appt-123-reminder",  // ← Mismo key
  "phone_number": "+525551234567",
  ...
}

// Resultado: Retorna el MISMO mensaje ID (evita duplicados)
```

---

## 🏢 Plataforma - Admin

### Módulo: `platform`

**Ubicación:** `/src/modules/platform/`

**Descripción:** Endpoints administrativos para gestionar clínicas, suspensiones, y auditoría a nivel de plataforma.

---

### Endpoints

#### 1. **Suspender Clínica**

Suspender una clínica (desactiva acceso de usuarios, API locked).

**Endpoint:** `PATCH /api/platform/clinics/:clinicId/suspend`

**Método:** PATCH  
**Autenticación:** ✅ Requerida (solo PLATFORM_SUPERADMIN)  
**Content-Type:** application/json  
**Respuesta:** HTTP 200

**Request Body:**
```typescript
{
  reason: string;  // Motivo de suspensión
}
```

**Body Ejemplo:**
```json
{
  "reason": "Incumplimiento de términos de servicio"
}
```

**Respuesta (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Veterinaria Central",
  "status": "SUSPENDED",
  "suspendedAt": "2026-02-25T11:30:00Z",
  "suspendedBy": "550e8400-e29b-41d4-a716-446655440000",
  "suspensionReason": "Incumplimiento de términos de servicio"
}
```

---

#### 2. **Reactivar Clínica**

Reactivar una clínica suspendida.

**Endpoint:** `PATCH /api/platform/clinics/:clinicId/activate`

**Método:** PATCH  
**Autenticación:** ✅ Requerida (solo PLATFORM_SUPERADMIN)  
**Respuesta:** HTTP 200

**Request Body:**
```json
{}  // Body vacío
```

**Respuesta (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Veterinaria Central",
  "status": "ACTIVE",
  "suspendedAt": null,
  "suspendedBy": null,
  "suspensionReason": null
}
```

---

## 🔑 Headers y Autenticación

### Headers Requeridos

**Para endpoints protegidos:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Token JWT

**Estructura del JWT decodificado:**
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "owner@vibralive.test",
  "clinic_id": "550e8400-e29b-41d4-a716-446655440001",
  "role": "owner",
  "status": "ACTIVE",
  "iat": 1708856400,
  "exp": 1708942800
}
```

### Refresh Token

El `refresh_token` permite obtener un nuevo `access_token` cuando expire (expiración típica: 7 días).

---

## ❌ Códigos de Error

### HTTP Status Codes

| Código | Significado | Caso de Uso |
|--------|-------------|------------|
| `200` | OK | Operación exitosa (GET, PUT, PATCH sin cambios) |
| `201` | Created | Recurso creado exitosamente (POST) |
| `202` | Accepted | Solicitud encolada para procesamiento asyncrónico (WhatsApp, etc) |
| `204` | No Content | Operación exitosa sin contenido de respuesta |
| `400` | Bad Request | Validación DTO fallida o parámetros inválidos |
| `401` | Unauthorized | Token ausente, inválido o expirado |
| `403` | Forbidden | Usuario sin permisos para acceder |
| `404` | Not Found | Recurso no encontrado |
| `409` | Conflict | Recurso duplicado (único constraint violado) |
| `422` | Unprocessable Entity | Validación fallida con detalles |
| `429` | Too Many Requests | Rate limiting (si implementado) |
| `500` | Internal Server Error | Error no manejado en servidor |
| `503` | Service Unavailable | Base de datos o servicio externo no disponible |

---

### Respuesta de Error Estándar

```json
{
  "error": {
    "statusCode": 400,
    "message": "Validation failed",
    "errors": [
      {
        "field": "email",
        "message": "Email must be valid",
        "constraint": "isEmail"
      }
    ]
  }
}
```

---

### Errores Comunes

#### 401 - Token Expirado
```json
{
  "error": {
    "statusCode": 401,
    "message": "Unauthorized",
    "error": "jwt expired"
  }
}
```

**Solución:** Usar `refresh_token` para obtener nuevo `access_token`.

---

#### 403 - Acceso Denegado (Tenant Violation)
```json
{
  "error": {
    "statusCode": 403,
    "message": "Access denied",
    "error": "User does not have access to this clinic"
  }
}
```

**Solución:** Verificar que el usuario tiene permisos para acceder a la clínica.

---

#### 404 - Recurso No Encontrado
```json
{
  "error": {
    "statusCode": 404,
    "message": "Not Found",
    "error": "Appointment not found"
  }
}
```

---

#### 409 - Duplicado (Email)
```json
{
  "error": {
    "statusCode": 409,
    "message": "Conflict",
    "error": "Email already exists in the system"
  }
}
```

---

## 📚 Ejemplos de Uso

### cURL - Ejemplos

#### 1. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@vibralive.test",
    "password": "Admin@123456"
  }'
```

---

#### 2. Crear Cita
```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "pet_id": "550e8400-e29b-41d4-a716-446655440010",
    "client_id": "550e8400-e29b-41d4-a716-446655440020",
    "scheduled_at": "2026-03-01T14:30:00Z",
    "reason": "Revisión de rutina",
    "duration_minutes": 30
  }'
```

---

#### 3. Enviar Mensaje WhatsApp
```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+525551234567",
    "message_body": "Recordatorio: Tu cita es mañana a las 14:30",
    "message_type": "appointment_reminder",
    "idempotency_key": "appt-123-reminder"
  }'
```

---

#### 4. Obtener Citas de Mañana
```bash
curl -X GET "http://localhost:3000/api/appointments?status=SCHEDULED" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

### JavaScript/TypeScript - Ejemplos

#### Login y Obter Token
```typescript
async function login() {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'owner@vibralive.test',
      password: 'Admin@123456'
    })
  });

  const data = await response.json();
  return data.access_token;
}
```

---

#### Crear Cita
```typescript
async function createAppointment(token: string) {
  const response = await fetch('http://localhost:3000/api/appointments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pet_id: '550e8400-e29b-41d4-a716-446655440010',
      client_id: '550e8400-e29b-41d4-a716-446655440020',
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      reason: 'Revisión de rutina'
    })
  });

  return await response.json();
}
```

---

#### Enviar Mensaje WhatsApp
```typescript
async function sendReminder(token: string, phone: string, appointmentId: string) {
  const response = await fetch('http://localhost:3000/api/whatsapp/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone_number: phone,
      message_body: `Recordatorio: Tu cita es mañana a las 14:30`,
      message_type: 'appointment_reminder',
      idempotency_key: `appt-${appointmentId}-reminder-${Date.now()}`
    })
  });

  const data = await response.json();
  console.log('Mensaje encolado:', data.id);
  return data;
}
```

---

## 🔄 Flujos de Negocio

### Flujo: Crear Cita + Enviar Recordatorio

```
┌─────────────────────────────────────────────────────────────┐
│  1. Staff crea cita                                         │
│     POST /api/appointments                                  │
│     Response: appointmentId, status="SCHEDULED"             │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  2. Sistema encoloca recordatorios automáticos              │
│     Worker ejecuta cada día a las 8 AM                      │
│     Busca citas para los próximos 7 días                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  3. Envía recordatorio                                      │
│     POST /api/whatsapp/send (automático)                    │
│     message_type = "appointment_reminder"                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  4. Mensaje encolado en whatsapp_outbox                     │
│     status = "queued"                                       │
│     Cron job cada 5 min: procesa con Meta API               │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌────────▼──────────┐
│ ✅ Enviado     │          │ ❌ Falló          │
│ status="sent"  │          │ status="failed"   │
│ wamid captured │          │ retryCount++      │
└────────────────┘          └────────┬──────────┘
                                     │
                        ┌────────────▼──────────────┐
                        │ Reintentos automáticos    │
                        │ (max: 5 intentos)         │
                        └──────────────────────────┘
```

---

### Flujo: Cambio de Estado de Cita

```
SCHEDULED → CONFIRMED → COMPLETED
              ↓
           CANCELLED
```

**Estados y Transiciones:**

1. **SCHEDULED** (Inicial)
   - Cita programada
   - Cliente aún no confirma

2. **CONFIRMED** 
   - Cliente confirmó (via WhatsApp, llamada, etc)
   - Staff actualiza estado: `PATCH /api/appointments/:id/status`

3. **COMPLETED**
   - Cita realizada
   - Staff cambia estado post-consulta

4. **CANCELLED**
   - Cita cancelada (cliente o clínica)
   - Requerida: `cancellation_reason`

---

## 📊 Rate Limiting (Futuro)

Recomendación para production:
- **Auth endpoints:** 10 req/min por IP
- **API endpoints:** 1000 req/hora por usuario
- **WhatsApp:** 100 mensajes/min por clínica

---

## 🔐 Seguridad

### Principios

1. ✅ **HTTPS obligatorio** en production
2. ✅ **JWT con expiración** (access: 1 hora, refresh: 7 días)
3. ✅ **TenantGuard** valida que usuario accede su clínica
4. ✅ **Role-Based Access Control** (owner vs staff)
5. ✅ **Password hashing** con bcrypt
6. ✅ **Auditoría de cambios** en audit_logs
7. ✅ **Idempotencia** en operaciones críticas

---

**Documento actualizado:** Febrero 25, 2026  
**Versión:** 1.0  
**Estado:** Documentación Completa ✅
