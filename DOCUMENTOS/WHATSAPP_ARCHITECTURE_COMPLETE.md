# 📱 WhatsApp Multitenant Architecture - Análisis Completo

**Última actualización**: 26/03/2026  
**Version**: 1.0  
**Status**: Ready for Implementation

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Problema: Single Line Multitenant](#problema-single-line-multitenant)
3. [Solución Arquitectónica](#solución-arquitectónica)
4. [Estructura de Tablas](#estructura-de-tablas)
5. [Flujos de Negocio](#flujos-de-negocio)
6. [Edge Cases & Solutions](#edge-cases--solutions)
7. [Timezone Handling Pattern](#-timezone-handling-pattern-referencia-rápida)
8. [Sistema de Límites y Billing](#sistema-de-límites-y-billing)
9. [Plan de Implementación](#plan-de-implementación)

---

## Resumen Ejecutivo

### Objetivo
Implementar sistema de **WhatsApp chatbot para confirmación de citas** con:
- ✅ 1 número de Twilio compartido (costos bajos)
- ✅ N clínicas identificadas sin ambigüedad
- ✅ Límites mensuales customizables por clínica
- ✅ Sistema de recargas y billing

### Desafío Principal
**Multitenant + Single Twilio Line:**
- 1000 clínicas → 1 número Twilio (+1 415 523 8886)
- ¿Cómo sabe el webhook qué clínica es cuando llega mensaje?
- Teléfono del cliente (+56912345678) es la única forma de identificar

### Solución Propuesta
```
Tabla whatsapp_config (GLOBAL)
↓
Account SID + Auth Token (compartido todas clínicas)
↓ (FK)
Tabla clinic_whatsapp_config (POR CLÍNICA)
↓
Número distinto + Límites + Configuración custom
↓ (FK)
whatsapp_appointment_tracking (RELACIÓN cita↔mensaje)
↓
Identifica clínica por (phone + appointment_id)
```

---

## Problema: Single Line Multitenant

### Escenario Actual

```
Cliente A llama desde +56912345678 → Clínica X, Y o Z?
Cliente B llama desde +56912345679 → Clínica A, B o C?

Ambigüedad = Sistema roto ❌
```

### Por qué NO funciona la idea inicial

```javascript
// ❌ INCORRECTO: Compartir MISMO número
Clínica A → +1 415 523 8886
Clínica B → +1 415 523 8886  ← PROBLEMA!
Clínica C → +1 415 523 8886

Webhook recibe:
{
  From: "+56912345678",
  To: "+1 415 523 8886"
}
↓
¿De cuál clínica es la cita? 🤔 No sé!
```

---

## Solución Arquitectónica

### Concepto Core: 1 Número Twilio + Display Phone por Clínica

```
┌──────────────────────────────────────────────────┐
│  whatsapp_config (GLOBAL)                        │
│  Física: +1 415 523 8886 (1 número = $5-10/mes) │
│  - provider: twilio                              │
│  - account_sid: AC40e066d6faa...                 │
│  - auth_token: d44002a1d66...                    │
└──────────────────────────────────────────────────┘
                    ↑ FK (TODAS apuntan aquí)
        1 número compartido por N clínicas
                    ↓
┌──────────────────────────────────────────────────┐
│  clinic_whatsapp_config (POR CLÍNICA)            │
│  Clínica A: display_phone "+56 2 1234 5678"    │ ← Display local
│  Clínica B: display_phone "+56 2 2222 2222"    │ ← Display local
│  Clínica C: display_phone "+56 2 3333 3333"    │ ← Display local
│  + Límites mensuales customizables               │
│  + Feature flags por clínica                     │
└──────────────────────────────────────────────────┘
                    ↑ FK
  Webhook RECIBE: To = "+1 415 523 8886" (físico)
  Pero BUSCA: phone + appointment_id → clinic_id
                    ↓
┌──────────────────────────────────────────────────┐
│  whatsapp_appointment_tracking                   │
│  - clinic_id ← IDENTIFICADA! (por phone+appt)   │
│  - appointment_id ← IDENTIFICADA!                │
│  - client_phone: "+56912345678"                 │
└──────────────────────────────────────────────────┘
```

---

## Estructura de Tablas

### 1. `whatsapp_config` (NUEVA TABLE - GLOBAL)

**Propósito**: Credenciales compartidas de Twilio/Meta  
**Cardinality**: O(1) - Generalmente 1 fila (o pocas si múltiples accounts)

```sql
CREATE TABLE public.whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  name VARCHAR(100) NOT NULL UNIQUE,  -- "VibraLive Twilio Account"
  provider VARCHAR(50) NOT NULL DEFAULT 'twilio',  -- twilio, meta, wati
  
  -- Credenciales
  account_sid VARCHAR(255) NOT NULL,
  auth_token TEXT NOT NULL,
  
  -- Limits globales (override)
  global_daily_limit INTEGER DEFAULT 50000,
  
  -- Webhook
  webhook_url VARCHAR(255),
  webhook_secret TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Auditoría
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Datos ejemplo:
INSERT INTO whatsapp_config 
(name, provider, account_sid, auth_token)
VALUES 
('VibraLive Twilio Main', 'twilio', 'AC40e066d6faa9f9bd6dd4687cec5a9ee8', 'd44002a1d669f59c2f6992bfaedbec92');
```

---

### 2. `clinic_whatsapp_config` (ACTUALIZADA - POR CLÍNICA)

**Propósito**: Configuración + Límites customizables por clínica  
**Cardinality**: 1:1 con clinics  
**NOTA**: Todas las clínicas usan la MISMA whatsapp_config (1 número Twilio), pero pueden customizar el display

```sql
CREATE TABLE public.clinic_whatsapp_config (
  clinic_id UUID PRIMARY KEY REFERENCES public.clinics(id) ON DELETE CASCADE,
  
  -- FK a configuración global (TODAS usan la MISMA)
  whatsapp_config_id UUID NOT NULL REFERENCES public.whatsapp_config(id) ON DELETE RESTRICT,
  
  -- DISPLAY: Número que el usuario VE (no es físico de Twilio)
  display_phone VARCHAR(20),                     -- "+56 2 1234 5678" (Clínica A) - DISPLAY ONLY
  sender_name VARCHAR(100),                      -- "Groober Clínica A"
  
  -- LÍMITES MENSUALES (Core business logic)
  monthly_message_limit INTEGER NOT NULL DEFAULT 200,
  monthly_messages_used INTEGER DEFAULT 0,
  monthly_reset_date DATE,                       -- Fecha de reset (1ro del mes)
  last_message_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Alertas
  alert_threshold_percentage INTEGER DEFAULT 80, -- Alertar al 80% usado
  is_alert_sent BOOLEAN DEFAULT FALSE,           -- Flag: ¿Se envió alerta?
  
  -- Recargas
  allows_overage BOOLEAN DEFAULT FALSE,          -- ¿Permite comprar más?
  overage_cost_per_message DECIMAL(10, 2) DEFAULT 0.05,
  total_overage_messages INTEGER DEFAULT 0,      -- Recargados este mes
  
  -- Planes
  subscription_tier VARCHAR(50) DEFAULT 'basic',  -- free, basic, pro, enterprise
  
  -- Feature flags
  send_appointment_confirmation BOOLEAN DEFAULT TRUE,
  send_appointment_reminder BOOLEAN DEFAULT TRUE,
  reminder_hours_before INTEGER DEFAULT 4,
  send_stylist_on_way BOOLEAN DEFAULT FALSE,
  send_service_completed BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_clinic_whatsapp_config_id ON clinic_whatsapp_config(whatsapp_config_id);
CREATE INDEX idx_clinic_whatsapp_monthly ON clinic_whatsapp_config(monthly_reset_date);

-- Datos ejemplo:
-- ⚠️ IMPORTANTE: Todas usan whatsapp_config_id = 1 (mismo Twilio: +1 415 523 8886)
INSERT INTO clinic_whatsapp_config 
(clinic_id, whatsapp_config_id, display_phone, sender_name, monthly_message_limit, subscription_tier)
VALUES 
('uuid-clinic-a', 1, '+56 2 1234 5678', 'Groober Clínica A', 200, 'basic'),
('uuid-clinic-b', 1, '+56 2 2222 2222', 'Groober Clínica B', 500, 'pro'),
('uuid-clinic-c', 1, '+56 2 3333 3333', 'Groober Clínica C', 1000, 'enterprise');
```

---

### 3. `whatsapp_appointment_tracking` (NUEVA TABLE - CRÍTICA)

**Propósito**: RelacionaR appointments→whatsapp_messages + Identificar clínica por phone  
**Cardinality**: 1:1 con appointments

```sql
CREATE TABLE public.whatsapp_appointment_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multitenant
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  
  -- Cliente
  phone_number VARCHAR(20) NOT NULL,
  
  -- Timing de cita
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Status de confirmación (Core business logic)
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- Estados: pending, confirmed, cancelled, rescheduled_pending, 
  --          rescheduled_confirmed, no_show, no_response, expired
  
  -- Webhook tracking
  last_message_id VARCHAR(255),      -- wamid de Twilio
  last_response_body TEXT,           -- "Confirmar", "Cancelar", etc
  last_response_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata_json JSONB DEFAULT '{}',
  notes TEXT,
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices críticos (busquedas por webhook)
CREATE INDEX idx_whatsapp_track_clinic_phone 
  ON public.whatsapp_appointment_tracking(clinic_id, phone_number, status);

CREATE INDEX idx_whatsapp_track_status 
  ON public.whatsapp_appointment_tracking(status, appointment_date)
  WHERE status IN ('pending', 'rescheduled_pending');

CREATE INDEX idx_whatsapp_track_phone 
  ON public.whatsapp_appointment_tracking(phone_number);
```

---

### 4. `whatsapp_message_usage` (NUEVA TABLE - BILLING)

**Propósito**: Tracking de cada mensaje para facturación + Reply-to tracking para identificación  
**Cardinality**: N:1 con clinics

```sql
CREATE TABLE public.whatsapp_message_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  -- Mensaje
  provider_message_id VARCHAR(255) UNIQUE,      -- wamid Twilio
  parent_message_id VARCHAR(255),               -- FK a provider_message_id (para reply-to tracking)
  direction VARCHAR(20) NOT NULL,               -- outbound, inbound
  message_type VARCHAR(50),                     -- text, template, image
  
  -- Billing
  is_billable BOOLEAN DEFAULT TRUE,             -- template/webhook NO se cuenta
  message_cost DECIMAL(10, 2) DEFAULT 0.01,
  was_overage BOOLEAN DEFAULT FALSE,            -- Si usó recarga
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- FK para self-referential
  CONSTRAINT fk_parent_message_id 
    FOREIGN KEY (parent_message_id) REFERENCES whatsapp_message_usage(provider_message_id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_message_usage_clinic_month 
  ON public.whatsapp_message_usage(clinic_id, DATE_TRUNC('month', sent_at));

CREATE INDEX idx_message_usage_billable 
  ON public.whatsapp_message_usage(clinic_id, is_billable);

CREATE INDEX idx_message_usage_parent 
  ON public.whatsapp_message_usage(parent_message_id);

CREATE UNIQUE INDEX idx_provider_message_dedup 
  ON public.whatsapp_message_usage(provider_message_id) WHERE provider_message_id IS NOT NULL;
```

---

### 5. `whatsapp_monthly_billing` (NUEVA TABLE - FACTURACIÓN)

**Propósito**: Facturación mensual por clínica  
**Cardinality**: N:1 con clinics (12 registros/año/clínica)

```sql
CREATE TABLE public.whatsapp_monthly_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  billing_year SMALLINT NOT NULL,
  billing_month SMALLINT NOT NULL CHECK (billing_month >= 1 AND billing_month <= 12),
  
  -- Consumo
  message_limit INTEGER NOT NULL,
  messages_sent INTEGER DEFAULT 0,
  messages_overage INTEGER DEFAULT 0,
  
  -- Costos
  base_price DECIMAL(10, 2),              -- Precio del plan
  overage_cost DECIMAL(10, 2) DEFAULT 0,  -- (messages_overage * unit_price)
  total_cost DECIMAL(10, 2),              -- base_price + overage_cost
  
  -- Invoice
  status VARCHAR(50) DEFAULT 'pending',   -- pending, invoiced, paid, failed
  invoice_id VARCHAR(255),
  invoice_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  paid_date TIMESTAMP WITH TIME ZONE,
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraint
  UNIQUE(clinic_id, billing_year, billing_month)
);

-- Índices
CREATE INDEX idx_billing_clinic_month 
  ON public.whatsapp_monthly_billing(clinic_id, billing_year, billing_month);

CREATE INDEX idx_billing_pending 
  ON public.whatsapp_monthly_billing(status) WHERE status = 'pending';
```

---

### 6. `whatsapp_message_recharges` (NUEVA TABLE - RECARGAS)

**Propósito**: Historial de recargas de mensajes  
**Cardinality**: N:1 con clinics

```sql
CREATE TABLE public.whatsapp_message_recharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  
  quantity INTEGER NOT NULL CHECK (quantity > 0),  -- 100, 500, 1000
  unit_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  status VARCHAR(50) DEFAULT 'pending',   -- pending, completed, failed
  payment_method VARCHAR(50),             -- stripe, transfer, invoice
  transaction_id VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE    -- Si no se usa en X días
);

-- Índices
CREATE INDEX idx_recharge_clinic_status 
  ON public.whatsapp_message_recharges(clinic_id, status);
```

---

## Flujos de Negocio

### Flujo 1: Envío de Recordatorio (4 horas antes)

```
T-4h: CRON job se ejecuta
  ↓
SELECT appointments
  WHERE appointment_time = NOW() + 4h
  AND status = 'pending'
  ↓
FOR EACH appointment:
  1. Buscar clinic_id, client_phone del appointment
  
  2. ✅ Verificar límite mensual:
     canSendMessage(clinic_id)?
     IF NO → Log + skip + notify admin
  
  3. Enviar por Twilio:
     from: whatsapp_config.sender_phone (+1 415 523 8886) ← Físico Twilio
     to: client_phone (+56912345678)
     body: template variables
     # El cliente VE que viene de clinic_whatsapp_config.display_phone (+56 2 1234 5678)
  
  4. Registrar en BD:
     INSERT INTO whatsapp_appointment_tracking:
       - clinic_id, appointment_id, phone_number, status='pending'
     
     INSERT INTO whatsapp_message_usage:
       - clinic_id, provider_message_id, is_billable=true
     
     UPDATE clinic_whatsapp_config:
       - monthly_messages_used += 1
  
  5. Verificar alerta:
     IF monthly_messages_used >= (limit * 80%):
       - notify cli clinic
       - set is_alert_sent = true
```

### Flujo 2: Webhook - Usuario responde botón (CON EDGE CASE HANDLING)

```
POST /webhooks/twilio/messages
{
  From: "+56912345678",
  To: "+1 415 523 8886",
  Body: "Confirmar|Cancelar|Reagendar",
  MessageSid: "SMxxx...",
  ParentMessageSid: "SMyyy..."  ← ⭐ KEY para identificación multi-clínica!
}
  ↓
1. ✅ Webhook recibe siempre el MISMO número:
   To: "+1 415 523 8886" (1 número físico para TODAS)
   → Todos los mensajes llegan aquí, no distinción por número ✅
  
2. ✅⭐ IDENTIFICAR CLINIC + APPOINTMENT (Dual-path):
   
   PATH A (PRIMARY): Usar ParentMessageSid si existe
     IF ParentMessageSid != null:
       SELECT appointment_id, clinic_id FROM whatsapp_message_usage um
       JOIN whatsapp_appointment_tracking wat ON um.appointment_id = wat.id
       WHERE um.provider_message_id = ParentMessageSid
       LIMIT 1
       → ✅ Identificación exacta sin ambigüedad!
   
   PATH B (FALLBACK): Si no hay ParentMessageSid (primer mensaje sin reply-to)
     SELECT appointment_id, clinic_id FROM whatsapp_appointment_tracking
     WHERE phone_number = "+56912345678"
     AND status IN ('pending', 'rescheduled_pending')
     AND appointment_date > NOW() - 5 hours
     AND appointment_date < NOW() + 24 hours
     ORDER BY appointment_date DESC LIMIT 1
       → ✅ Query por proximidad temporal (5h ventana)
   
   EDGE CASE (2+ citas pendientes en 24h):
     COUNT resultados > 1?
       → Enviar menú interactivo:
          "Tienes múltiples citas hoy. Elige:\n
          1️⃣ Veterinario Dr. García - 10:30  
          2️⃣ Veterinario Dr. López - 14:00
          3️⃣ Veterinario Dr. Chen - 09:00 (mañana)
          
          Responde 1, 2 o 3"
       → Esperar respuesta numérica y procesar esa cita específica
  
3. ✅ Procesar respuesta:
   IF Body = "Confirmar" (o "1", "2", "3" si fue menú):
     → UPDATE appointments SET status = 'confirmed'
     → UPDATE whatsapp_appointment_tracking SET status = 'confirmed'
     → Enviar: "✅ Cita confirmada!"
   
   ELSE IF Body = "Cancelar":
     → UPDATE appointments SET status = 'cancelled'
     → UPDATE whatsapp_appointment_tracking SET status = 'cancelled'
     → Notify clinic
   
   ELSE IF Body = "Reagendar":
     → UPDATE whatsapp_appointment_tracking SET status = 'rescheduled_pending'
     → Generate JWT token con clinic_id + appointment_id
     → Enviar URL: "https://vibralive.com/reschedule?token=xyz"
  
4. ✅ Registrar en BD:
   INSERT INTO whatsapp_message_usage:
     - clinic_id, appointment_id, direction='inbound', is_billable=false
     - parent_message_id = ParentMessageSid (⭐ CRITICAL para tracking)
   
   UPDATE whatsapp_appointment_tracking:
     - last_response_at, last_response_body, status
```

### Flujo 3: No Respuesta (2 horas antes de cita)

```
CRON: Cada 30 minutos

SELECT appointments
  WHERE appointment_time <= NOW() + 2h
  AND whatsapp_status IN ('pending', 'rescheduled_pending')
  ↓
IF NO respuesta en 4+ horas:
  → UPDATE whatsapp_appointment_tracking SET status = 'no_response'
  → UPDATE appointments SET status = 'no_show_not_confirmed'
  → Notify clinic staff de no-show
```

### Flujo 4: Reset Mensual (1ro de mes)

```
CRON: Monthly job - 1ro 00:00 UTC

1. Generar facturación del mes anterior:
   FOR EACH clinic:
     messages_sent = SELECT COUNT(*) FROM whatsapp_message_usage
                     WHERE clinic_id = X
                     AND DATE_TRUNC('month', sent_at) = last_month
     
     INSERT INTO whatsapp_monthly_billing:
       - clinic_id, year, month, message_limit, messages_sent, total_cost
     
     IF messages_sent > message_limit AND allows_overage = TRUE:
       overage_messages = messages_sent - message_limit
       overage_cost = overage_messages * overage_cost_per_message
       total_cost = base_price + overage_cost
     
     GENERATE invoice (si es needed)

2. Reset contadores:
   UPDATE clinic_whatsapp_config
   SET 
     monthly_messages_used = 0,
     total_overage_messages = 0,
     is_alert_sent = false,
     monthly_reset_date = CURRENT_DATE
```

---

## Edge Cases & Solutions

### Case 1: Multiple Appointments for Same Client (Most Critical)

**Problema:**
```
Cliente: +56912345678

Escenario de Hoy:
├─ Clínica A: Cita 10:30 (Dr. García)
├─ Clínica B: Cita 14:00 (Dr. López)
└─ Clínica C: Cita 09:00 mañana (Dr. Chen)

Twilio envía 3 recordatorios a las 04:30 hoy.

Cliente responde a 14:00: "Confirmar"

❌ ¿De cuál cita es? ¿Clínica A, B o C?
```

**Solución Arquitectónica:**

**Nivel 1: ParentMessageSid (PRIMARY)**
- Twilio incluye `ParentMessageSid` en cada respuesta
- Permite trackear exactamente a qué mensaje se está respondiendo
- Lookup en whatsapp_message_usage:
  ```sql
  SELECT appointment_id, clinic_id 
  FROM whatsapp_message_usage
  WHERE provider_message_id = req.ParentMessageSid
  ```
- **Precisión**: 100% exacta ✅

**Nivel 2: Temporal Fallback (SECONDARY)**
- Si ParentMessageSid no disponible (raro)
- Query por phone + appointment_date proximity (5h window)
  ```sql
  SELECT appointment_id, clinic_id
  FROM whatsapp_appointment_tracking
  WHERE phone_number = req.From
  AND appointment_date BETWEEN NOW()-5 HOURS AND NOW()+24 HOURS
  ORDER BY appointment_date DESC
  LIMIT 1
  ```
- **Precisión**: ~90% (temporal proximity)

**Nivel 3: User Choice (TERTIARY)**
- Si COUNT > 1 en fallback
- Enviar menú interactivo:
  ```
  Tienes múltiples citas hoy:
  
  1️⃣ Dr. García - Clínica A (10:30)
  2️⃣ Dr. López - Clínica B (14:00)
  3️⃣ Dr. Chen - Clínica C (09:00 mañana)
  
  Responde 1, 2 o 3
  ```
- **Precisión**: 100% exacta (user explicit)

**Implementación en Backend:**
```typescript
// Pseudocode
async processWebhookResponse(payload) {
  // Step 1: Try ParentMessageSid
  if (payload.ParentMessageSid) {
    const originalMsg = await db.whatsapp_message_usage.findOne({
      provider_message_id: payload.ParentMessageSid
    });
    if (originalMsg) {
      clinicId = originalMsg.clinic_id;
      appointmentId = originalMsg.appointment_id;
      return processResponse(clinicId, appointmentId);
    }
  }
  
  // Step 2: Temporal fallback
  const pending = await db.whatsapp_appointment_tracking.find({
    phone_number: payload.From,
    status: ['pending', 'rescheduled_pending'],
    appointment_date: { 
      $gt: NOW - 5h, 
      $lt: NOW + 24h 
    }
  }).sort({ appointment_date: -1 });
  
  if (pending.length === 1) {
    // Unambiguous ✅
    return processResponse(pending[0].clinic_id, pending[0].appointment_id);
  } else if (pending.length > 1) {
    // Ambiguous → send menu
    return sendInteractiveMenu(payload.From, pending);
  } else {
    // No appointment found
    return sendError(payload.From, "No tienes citas pendientes");
  }
}
```

**Schema Support:**
- `whatsapp_message_usage.parent_message_id` → FK para trackear replies
- `whatsapp_message_usage.provider_message_id` → UNIQUE para deduplication
- `whatsapp_appointment_tracking.status` → Excludes expired/confirmed/cancelled

---

### Case 2: Timezone Handling Across Clinics (CRÍTICO)

**Problema:**
Clínicas en diferentes zonas horarias (±4-6h en Latinoamérica). ¿Cuándo enviar recordatorio de 4 horas si cada clínica está en hora distinta?

**⚠️ Errores Comunes a Evitar:**
```typescript
// ❌ ERROR 1: Doble conversión (causa offset incorrecto)
const utcDate = appointment.scheduledAt; // Ya es UTC
const converted = utcToZonedTime(utcDate, clinicTz); // ← No hagas esto!
// Resultado: recordatorio se envía en hora INCORRECTA (offset duplicado)

// ❌ ERROR 2: Guardar hora local en BD
await db.save({ reminderTime: "14:30" }); // ← INCORRECTO (no es UTC)
// Resultado: No se puede comparar, cálculos incorrectos

// ❌ ERROR 3: Hardcodear timezones
if (clinicId === 'uuid-clinic-1') timezone = 'America/Santiago'; // ← Brittle!
// Resultado: Si cambian la clínica de zona, se quiebra
```

**✅ La Solución Correcta (Arquitectura Implementada):**

**Patrón Global en VibraLive:**
```
┌─────────────────────────────────────────────────────────────┐
│  UTC ↔ CLINIC TIMEZONE CONVERSION PATTERN                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  BD (SIEMPRE UTC):                                          │
│  ├─ appointment_date = "2026-03-09T15:00:00Z"              │
│  └─ reminder_sent_at = "2026-03-09T11:00:00Z"              │
│                         (4h antes en hora clínica)          │
│                                                               │
│  Backend: TimezoneService (shared/timezone/)               │
│  ├─ getClinicTimezone(clinicId) → "America/Santiago"      │
│  └─ parseInClinicTzToUtc(tz, "14:30") → UTC Date          │
│                                                               │
│  Frontend: useClinicTimezone() hook                         │
│  ├─ Lee de localStorage/config                             │
│  └─ formatInClinicTz(utcDate, tz) → "09/03 08:30"         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Backend Implementation:**
```typescript
@Injectable()
export class WhatsAppReminderService {
  constructor(
    private timezoneService: TimezoneService,
    private appointmentRepo: AppointmentRepository,
    private reminderRepo: WhatsAppReminderRepository
  ) {}

  // ✅ CORRECTO: Enviar recordatorio respetando zona de clínica
  async scheduleReminder(appointmentId: string, clinicId: string) {
    const appointment = await this.appointmentRepo.findOne(appointmentId);
    // appointment.scheduledAt = "2026-03-09T15:00:00Z" (UTC en BD)
    
    // Paso 1: Obtener zona horaria de clínica
    const clinicTz = await this.timezoneService.getClinicTimezone(clinicId);
    // clinicTz = "America/Santiago"
    
    // Paso 2: Calcular CUÁNDO enviar recordatorio (4 horas ANTES en zona local)
    // NO hagas conversiones manuales, usa el servicio
    const reminderUtc = new Date(
      appointment.scheduledAt.getTime() - (4 * 60 * 60 * 1000)
    );
    // reminderUtc = "2026-03-09T11:00:00Z" (UTC)
    // En Santiago esto es: 09/03 08:00 AM ✅
    
    // Paso 3: Guardar en BD (siempre UTC)
    await this.reminderRepo.save({
      appointment_id: appointmentId,
      clinic_id: clinicId,
      send_at_utc: reminderUtc, // ← SIEMPRE UTC
      status: 'pending'
    });
  }

  // ✅ CORRECTO: Enviar cuando el CRON detecta que es la hora
  async sendPendingReminders() {
    const now = new Date(); // UTC
    
    const pending = await this.reminderRepo.find({
      status: 'pending',
      send_at_utc: { $lte: now } // ← Comparar en UTC es eficiente
    });
    
    for (const reminder of pending) {
      await this.twilio.sendWhatsApp({
        to: reminder.client_phone,
        body: `Tu cita es a las ${this.getDisplayTime(reminder)}` 
        // getDisplayTime convierte UTC → zona local para mostrar
      });
    }
  }

  // Helper: Convertir UTC → display string en zona local
  private getDisplayTime(reminder: WhatsAppReminder): string {
    const clinicTz = await this.timezoneService.getClinicTimezone(reminder.clinic_id);
    // Usar la librería date-fns-tz que ya existe en proyecto
    const zonedDate = toZonedTime(reminder.send_at_utc, clinicTz);
    return format(zonedDate, 'dd/MM HH:mm'); // "09/03 08:00"
  }
}
```

**Frontend Display:**
```typescript
// Frontend - Hook para obtener timezone (ya existe)
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { formatInClinicTz } from '@/lib/datetime-tz';

export function WhatsAppRemindersTable() {
  const clinicTz = useClinicTimezone(); // "America/Santiago" from localStorage
  
  const reminders = await api.get('/whatsapp/reminders');
  
  return (
    <table>
      <tr>
        <td>
          {/* reminder.send_at_utc = "2026-03-09T11:00:00Z" (UTC del API) */}
          Enviado: {formatInClinicTz(reminder.send_at_utc, clinicTz, 'dd/MM HH:mm')}
          {/* Output: "09/03 08:00" (en hora Santiago) ✅ */}
        </td>
      </tr>
    </table>
  );
}
```

**Database Schema:**
```sql
-- ✅ CORRECTO: TODO en UTC
CREATE TABLE whatsapp_reminders (
  id UUID PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  client_phone VARCHAR(20) NOT NULL,
  
  -- Timezone se obtiene de clinic_whatsapp_config, NO se duplica
  send_at_utc TIMESTAMP WITH TIME ZONE NOT NULL,  -- ← Siempre UTC
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending'
);

-- Índice para CRON: buscar recordatorios pendientes por vencer
CREATE INDEX idx_reminders_pending 
  ON whatsapp_reminders(status, send_at_utc) 
  WHERE status = 'pending';
```

**Queries SQL: Buscar recordatorios de hoy (en zona local clínica):**
```sql
-- ✅ CORRECTO: Buscar reminders del "hoy" en cada zona de clínica
SELECT r.* FROM whatsapp_reminders r
JOIN clinic_whatsapp_config c ON r.clinic_id = c.clinic_id
WHERE DATE(r.send_at_utc AT TIME ZONE 'America/Santiago') = '2026-03-09'
  -- Esto busca: ¿Qué recordatorios caen en el 09/03 en Santiago?
  -- Convertir UTC → zona → extraer fecha → comparar con '2026-03-09'

-- Alternative si necesitas en múltiples zonas
-- Para cada clínica, calcular el rango de UTC correspondiente al día local
DECLARE @dateLocal DATE = '2026-03-09';
DECLARE @clinicTz VARCHAR(100) = 'America/Santiago'; -- De clinic_whatsapp_config

-- Rango: inicio del día local en UTC, fin del día local en UTC
DECLARE @startUtc TIMESTAMP = 
  (@dateLocal + TIME '00:00') AT TIME ZONE @clinicTz AT TIME ZONE 'UTC';
DECLARE @endUtc TIMESTAMP = 
  (@dateLocal + TIME '23:59:59') AT TIME ZONE @clinicTz AT TIME ZONE 'UTC';

SELECT r.* FROM whatsapp_reminders r
WHERE r.send_at_utc BETWEEN @startUtc AND @endUtc;
```

**Checklist para Implementar:**
- [ ] ✅ BD: Campo `send_at_utc TIMESTAMP WITH TIME ZONE`
- [ ] ✅ Backend: Usar `TimezoneService.getClinicTimezone(clinicId)`
- [ ] ✅ Backend: Guardar siempre en UTC (no convertir antes de guardar)
- [ ] ✅ Frontend: Usar `useClinicTimezone()` para obtener zona
- [ ] ✅ Frontend: Usar `formatInClinicTz()` para mostrar (NO UTC directo)
- [ ] ✅ CRON: Comparar `send_at_utc` directamente (ambos en UTC)
- [ ] ✅ Tests: Verificar con múltiples timezones (UTC-6, UTC-8, etc.)

---

### Case 3: Duplicate Message Handling

**Problema:**
¿Qué si el webhook se ejecuta 2x (Twilio retry)?

**Solución:**
```sql
-- UNIQUE constraint previene duplicados
CREATE UNIQUE INDEX idx_provider_message_dedup 
  ON whatsapp_message_usage(provider_message_id) 
  WHERE provider_message_id IS NOT NULL;

-- DB INSERT fallaría si ya existe
-- Backend logic:
IF UniqueConstraintError {
  UPDATE whatsapp_appointment_tracking SET last_response_at = NOW()
  // Don't process twice
}
```

---

### Case 4: Rate Limiting

**Problema:**
¿Qué si un cliente spammea botones?

**Solución:**
```
Rate limit: 1 response per appointment per minute

Logic:
- Guardar last_response_at en whatsapp_appointment_tracking
- Si diff(NOW() - last_response_at) < 60 seconds
  → Ignore + send "Por favor espera 30 segundos"
```

---

## 📚 Timezone Handling Pattern (Referencia Rápida)

### Servicios Disponibles (YA IMPLEMENTADOS EN VIBRALIVE)

#### Frontend
- **Hook:** `useClinicTimezone()` → Lee timezone de localStorage/config
- **Librería:** `datetime-tz.ts` con funciones:
  - `formatInClinicTz(utcDate, clinicTz, format)` → Display
  - `clinicLocalToUtc(dateStr, timeStr, clinicTz)` → Parse user input
  - `toZonedTime(utcDate, clinicTz)` → Convertir para cálculos

#### Backend
- **Servicio:** `TimezoneService` en `shared/timezone/`
  - `getClinicTimezone(clinicId)` → con cache en-memoria
  - `toClinicDateKey(clinicTz, utcDate)` → "YYYY-MM-DD" en zona local
  - `getClinicDayRangeUtc(clinicTz, dateKey)` → Rango UTC para queries

### Patrón: NO HACER (Antipatrones)

| ❌ Antipatrón | ✅ Correcto | Problema |
|---|---|---|
| Guardar `"14:30"` en BD | Guardar `"2026-03-09T11:30:00Z"` | Hora local no es UTC |
| `new Date(localInput)` | `clinicLocalToUtc(...)` | JS Date asume local como UTC |
| Doble conversión | Una conversión en borde | Offset duplicado (±12h error) |
| Hardcodear `'America/Monterrey'` | Usar `useClinicTimezone()` | No escala si cambia clínica |
| Mostrar `appointment.scheduledAt` directo | `formatInClinicTz(...)` | Usuario ve UTC en lugar de hora local |
| Query: `WHERE date = '2026-03-09'` | Query: `WHERE utc BETWEEN @start AND @end` | Falla en límites de día |

### Flujo Estándar: Crear + Mostrar Recordatorio

```
1. USER INPUT (Local)
   └─ "14:30" en Santiago (UTC-3)

2. FRONTEND: Convertir a UTC
   └─ clinicLocalToUtc("2026-03-09", "14:30", "America/Santiago")
      → "2026-03-09T17:30:00Z"

3. SEND TO API (UTC ISO string)
   └─ POST /reminders { sendAt: "2026-03-09T17:30:00Z" }

4. BACKEND: GUARDAR (UTC directamente)
   └─ INSERT whatsapp_reminders(send_at_utc) VALUES('2026-03-09T17:30:00Z')

5. CRON: BUSCAR (UTC)
   └─ SELECT * WHERE send_at_utc <= NOW()

6. TWILIO: ENVIAR (No requiere tz, Twilio es agnostic)
   └─ sendWhatsApp({ body, timestamp: '2026-03-09T17:30:00Z' })

7. FRONTEND: DISPLAY (Convertir a zona local)
   └─ const display = formatInClinicTz(
        "2026-03-09T17:30:00Z",  ← UTC del API
        "America/Santiago",      ← zona clínica
        "dd/MM HH:mm"           ← formato
      )
      → "09/03 14:30" ✅
```

### Debugging: Si los tiempos salen incorrectos

**Síntoma:** Recordatorio se envía a hora incorrecta (±4-12 horas off)

**Solución Step-by-Step:**

1. **Verificar BD:** 
   ```sql
   SELECT send_at_utc, extract(timezone_hour from send_at_utc) as tz_offset
   FROM whatsapp_reminders LIMIT 5;
   -- Debe mostrar offset 0 (UTC) siempre
   ```

2. **Verificar Backend:**
   ```typescript
   const tz = await timezoneService.getClinicTimezone(clinicId);
   console.log('[Timezone Debug]', { clinicId, tz });
   // Debe imprimir: "America/Santiago" (no "UTC")
   ```

3. **Verificar Frontend:**
   ```typescript
   const clinicTz = useClinicTimezone();
   console.log('[ClinicTz]', clinicTz);
   // Debe ser clinic timezone, NO "UTC"
   ```

4. **Test: Crear recordatorio manualmente**
   ```typescript
   // Test: Zona Santiago = UTC-3
   const testDate = "2026-03-09T17:30:00Z"; // UTC
   const tz = "America/Santiago";
   const display = formatInClinicTz(testDate, tz, 'dd/MM HH:mm');
   // Esperas: "09/03 14:30" (17:30 - 3h = 14:30)
   ```

---

## Sistema de Límites y Billing

### Planes Disponibles

```javascript
const WHATSAPP_PLANS = {
  free: {
    tier_name: "Free",
    messages_per_month: 50,
    monthly_cost: 0,
    overage_allowed: false,
    overage_price_per_message: null,
    features: ['reminders_only'],
    description: "Plan de prueba"
  },
  
  basic: {
    tier_name: "Basic",
    messages_per_month: 200,
    monthly_cost: 9.99,
    overage_allowed: true,
    overage_price_per_message: 0.05,
    features: ['reminders', 'confirmations', 'cancellations'],
    description: "Para clínicas pequeñas"
  },
  
  pro: {
    tier_name: "Pro",
    messages_per_month: 1000,
    monthly_cost: 29.99,
    overage_allowed: true,
    overage_price_per_message: 0.03,
    features: ['all_features', 'customer_support'],
    description: "Para clínicas medianas"
  },
  
  enterprise: {
    tier_name: "Enterprise",
    messages_per_month: 10000,
    monthly_cost: 99.99,
    overage_allowed: true,
    overage_price_per_message: 0.01,
    features: ['unlimited_overages', 'priority_support', 'dedicated_account'],
    description: "Para clínicas grandes"
  }
};
```

### Rangos de Límites

```
Mínimo: 50 mensajes/mes (plan free)
Máximo: 10,000 mensajes/mes (plan enterprise)
├─ Free: 50
├─ Basic: 200 (4x free)
├─ Pro: 1,000 (5x basic)
└─ Enterprise: 10,000 (10x pro)

Recargas:
├─ 100 mensajes adicionales: $2.50
├─ 500 mensajes adicionales: $10.00
└─ 1,000 mensajes adicionales: $15.00

Alerta de límite: 80% de uso → Notificar clinic
```

### Ejemplo de Cálculo Mensual

```
SCENARIO: Clínica B (Plan Pro)
├─ Límite: 1,000 mensajes/mes
├─ Costo base: $29.99
├─ Precio overage: $0.03/mensaje
├─ Permite overage: TRUE

CONSUMO REAL (Mes 3 de 2026):
├─ Recordatorios enviados: 850
├─ Respuestas (inbound, no se cuentan): 430
├─ Recargas compradas: 200 mensajes → $6.00
├─ Total billable: 850 recordatorios + 200 recarga = 1,050
├─ Overage: 1,050 - 1,000 = 50 mensajes
├─ Overage cost: 50 × $0.03 = $1.50

FACTURACIÓN:
├─ Base price: $29.99
├─ Overage: $1.50
├─ Total: $31.49 ✅

SIGUIENTE MES:
├─ Contador reset: 1,050 → 0 ✅
├─ Alerta reset: is_alert_sent = false ✅
```

---

## Plan de Implementación

### Fase 1: Database Changes (Immediatamente)

```sql
-- 1. Crear tabla global
CREATE TABLE public.whatsapp_config (...)

-- 2. Modificar clinic_whatsapp_config (agregar FK + columnas)
ALTER TABLE public.clinic_whatsapp_config 
  ADD whatsapp_config_id UUID,
  ADD CONSTRAINT fk_clinic_whatsapp_config_id 
    FOREIGN KEY (whatsapp_config_id) REFERENCES whatsapp_config(id),
  ADD monthly_message_limit INTEGER DEFAULT 200,
  ADD monthly_messages_used INTEGER DEFAULT 0,
  ADD ... (otras 15+ columnas);

-- 3. Crear nuevas tablas
CREATE TABLE public.whatsapp_appointment_tracking (...)
CREATE TABLE public.whatsapp_message_usage (...)
CREATE TABLE public.whatsapp_monthly_billing (...)
CREATE TABLE public.whatsapp_message_recharges (...)

-- 4. Corregir whatsapp_webhook_events
ALTER TABLE public.whatsapp_webhook_events 
  ADD CONSTRAINT fk_webhook_events_clinic 
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;

-- 5. Insertar datos iniciales
INSERT INTO whatsapp_config (...)
UPDATE clinic_whatsapp_config SET whatsapp_config_id = 1 WHERE clinic_id = ...
```

### Fase 2: Backend Services (NestJS)

```
1. WhatsAppConfigService
   - getClinicConfig(clinicId)
   - validateMessageLimit(clinicId)
   - incrementUsage(clinicId)
   - resetMonthly() [CRON]

2. WhatsAppMessageService
   - sendReminder(appointmentId)
   - sendTemplate(clinicId, template, variables)
   - trackMessage(clinicId, providerId)

3. WhatsAppWebhookService
   - processIncomingMessage(payload)
   - updateAppointmentStatus(appointmentId, status)
   - generateRescheduleLink(appointmentId)

4. BillingService
   - calculateMonthlyUsage(clinicId, month)
   - generateInvoice(clinicId, month)
   - processRecharge(clinicId, quantity)

5. CRON Jobs
   - sendRemindersCron() [Every 1 hour]
   - checkNoResponseCron() [Every 30 min]
   - resetMonthlyCron() [1st of month]
   - generateBillingCron() [1st of month]
```

### Fase 3: Integration & Testing

```
1. Connect Twilio account
   - Account SID: AC40e066d6faa...
   - Auth Token: d44002a1d66...
   - Phone: +1 415 523 8886

2. Configure webhook in Twilio
   - POST https://vibralive.com/api/webhooks/twilio/messages

3. Create initial templates in Twilio
   - Name: recordatorio_cita_4h
   - Language: Spanish (MEX)
   - Status: Pending approval

4. Load test data
   - 50 test appointments
   - 5 test clinics

5. Run end-to-end test
   - Send reminder → Check DB → Verify message count
```

---

## Preguntas Respondidas

### Q: ¿Por qué 1 número de Twilio en lugar de N números?

**A:** Costos vs Escalabilidad:
- 1 número = $5-10/mes (compartido 1000 clínicas) ✅
- N números = $20/mes × 1000 = $20,000/mes ❌
- Identificación: clinic_id determinado por `phone_number + appointment_id` (en whatsapp_appointment_tracking)
- display_phone es SOLO para que usuario vea número "local" (no es real)

### Q: ¿Cómo sabe el webhook qué clínica es si todos llegan al mismo número?

**A:** Búsqueda por appointment + phone:
1. `From: client_phone` (+56912345678) + `appointment_date` pendiente
2. Query en whatsapp_appointment_tracking:
   ```sql
   SELECT clinic_id, appointment_id
   FROM whatsapp_appointment_tracking
   WHERE phone_number = "+56912345678"
   AND status IN ('pending', 'rescheduled_pending')
   AND appointment_date > NOW() - 5 hours
   ORDER BY appointment_date DESC LIMIT 1
   ```
3. Resultado: clinic_id identificada ✅

### Q: ¿Puede una clínica usar su propio Twilio si quiere?

**A:** SÍ, es optional:
- Modelo por defecto: todas comparten 1 número ($5-10/mes)
- Modelo customizado: clínica grande quiere privacidad/control
- Solución: crear nueva fila en `whatsapp_config` (ej: whatsapp_config id=2)
- Actualizar la clínica: `clinic_whatsapp_config.whatsapp_config_id = 2`
- Esa clínica ahora usa sus propias credenciales Twilio
- Costo: +$20/mes para esa clínica solamente

### Q: ¿Límites mensuales se resetean?

**A:** SÍ! CRON job el 1ro de cada mes:
- `monthly_messages_used = 0`
- `is_alert_sent = false`
- Genera factura del mes anterior
- Registra overage si aplica

### Q: ¿Usuarios pueden recargar?

**A:** SÍ!
- Si `allows_overage = TRUE`: Pueden comprar extra
- Precio configurable por plan
- Registra en `whatsapp_message_recharges` y `whatsapp_monthly_billing`

### Q: ¿Cómo identificar de qué clínica es una respuesta si el cliente tiene citas en múltiples clínicas?

**A:** Dual-path identification con fallback:

**SCENARIO:** Cliente +56912345678 tiene citas en 3 clínicas:
- Clínica A: 10:30 hoy
- Clínica B: 14:00 hoy  
- Clínica C: 09:00 mañana

Cliente responde: "Confirmar"

**SOLUCIÓN:**

1. **PRIMARY PATH** (ParentMessageSid):
   ```sql
   -- Twilio envía ParentMessageSid = SMyyy... (el wamid del recordatorio original)
   SELECT appointment_id, clinic_id 
   FROM whatsapp_message_usage
   WHERE provider_message_id = 'SMyyy...'
   ```
   → ✅ Identifica EXACTAMENTE qué mensaje fue respondido (sin ambigüedad)

2. **FALLBACK PATH** (Si no hay ParentMessageSid):
   ```sql
   -- Query por phone + appointment_date (ventana 5 horas)
   SELECT appointment_id, clinic_id
   FROM whatsapp_appointment_tracking
   WHERE phone_number = '+56912345678'
   AND appointment_date BETWEEN NOW() - 5 HOURS AND NOW() + 24 HOURS
   ORDER BY appointment_date DESC
   LIMIT 1
   ```
   → Gets most proximate appointment

3. **UX ENHANCEMENT** (Si hay ambigüedad):
   - Si COUNT > 1: Enviar menú interactivo
   - Usuario elige qué cita: "1️⃣ Dr. García 10:30"
   - Backend procesa respuesta numérica específicamente

**Por qué funciona:**
- ParentMessageSid es UNIQUE per message (Twilio guarantee)
- Fallback es temporal (citas con +/- 5h de ahora)
- UX enhances clarity si hay múltiples pending
- Schema soporta self-referential FK (`parent_message_id`)

---

## Migraciones SQL Requeridas

**Archivo**: `/migrations/whatsapp-multitenant-complete.sql`

```sql
-- 1. Crear whatsapp_config (GLOBAL)
CREATE TABLE public.whatsapp_config (...)

-- 2. Modificar clinic_whatsapp_config
ALTER TABLE public.clinic_whatsapp_config 
  ADD whatsapp_config_id UUID REFERENCES whatsapp_config(id),
  ADD monthly_message_limit INTEGER DEFAULT 200,
  ...

-- 3. Crear whatsapp_appointment_tracking
CREATE TABLE public.whatsapp_appointment_tracking (...)

-- 4. Crear whatsapp_message_usage
CREATE TABLE public.whatsapp_message_usage (...)

-- 5. Crear whatsapp_monthly_billing
CREATE TABLE public.whatsapp_monthly_billing (...)

-- 6. Crear whatsapp_message_recharges
CREATE TABLE public.whatsapp_message_recharges (...)

-- 7. Corregir whatsapp_webhook_events
ALTER TABLE public.whatsapp_webhook_events 
  ADD CONSTRAINT fk_webhook_events_clinic 
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;

-- 8. Datos iniciales
INSERT INTO whatsapp_config (...) VALUES (...);
```

---

## Checklist Final

### Antes de implementar:

- [ ] BD: Tablas creadas
- [ ] BD: FK constraints activos
- [ ] BD: Índices creados
- [ ] Twilio: Account verificado
- [ ] Twilio: Template creado y pending
- [ ] Twilio: Webhook configurado
- [ ] Backend: Services creados
- [ ] Backend: CRON jobs registrados
- [ ] Test: E2E manual ejecutado
- [ ] Docs: Actualizar runbook

---

## Referencias

- **Twilio Docs**: https://www.twilio.com/docs/whatsapp/quickstart
- **Architecture**: Hybrid global+clinic config
- **Multitenant**: clinic_id en todas las tablas
- **Billing**: Monthly reset + Overage tracking

---

**Status**: ✅ READY FOR CODING - Timezone Analysis Complete

### Cambios en esta versión (26/03/2026 - Timezone Update):
1. **Case 2 Ampliado**: Timezone handling con ejemplos concretos de backend/frontend
2. **Antipatrones**: Listado de errores comunes (doble conversión, hora local en BD, etc.)
3. **Servicios Existentes**: Documentados TimezoneService y useClinicTimezone hook
4. **Debugging Guide**: Cómo diagnosticar problemas de timezone
5. **Nueva Sección**: "Timezone Handling Pattern" como referencia rápida
6. **Patrones Completos**: Backend + Frontend + BD + Queries

Basado en análisis de `/shared/timezone/` y `/hooks/useClinicTimezone.ts`

Siguiente paso: Crear migraciones SQL y servicios NestJS.
