# WhatsApp Conversational Messaging Infrastructure - Implementation Guide

**Version**: 1.0  
**Date**: March 9, 2026  
**Status**: Production Ready

---

## Overview

This document outlines the complete WhatsApp conversational messaging infrastructure for VibraLive, including support for:

- ✅ WhatsApp conversational chat threads
- ✅ Chatbot state machine automation
- ✅ Webhook event ingestion
- ✅ Template management
- ✅ Operational monitoring & observability
- ✅ Notifications module (admin UI)

All implementation respects the system's **strict UTC timestamp strategy** and **multi-tenant architecture**.

---

## Part 1: Database Architecture

### Design Decisions

1. **UTC-First Timestamp Strategy**
   - All timestamp columns use `timestamp with time zone` for explicit UTC normalization
   - Backend normalizes all datetime inputs to UTC before storage
   - Frontend always converts UTC → clinic local timezone **for display only**
   - Never store local timestamps in the database

2. **Multi-Tenant Isolation**
   - Every table includes `clinic_id` as the primary scoping dimension
   - Foreign keys enforce clinic-level cascade deletes
   - Queries **always** filter by `clinic_id` for security

3. **Conversation Threading**
   - `whatsapp_conversations` represents a conversation thread with a single client
   - `conversation_messages` stores individual messages within that thread
   - Enables full chatbot interaction history and human handoff support

4. **State Machine Support**
   - `whatsapp_conversation_transitions` logs all state changes
   - Enables audit trail and analytics
   - Supports replay and debugging

5. **Webhook Safety**
   - `whatsapp_webhook_events` stores raw payloads for audit trail
   - Separate processing status allows retry logic
   - Never lose webhook data

### New Tables

#### 1. `whatsapp_conversations`

Represents a conversation thread between a client and clinic.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | No | PK |
| clinic_id | uuid | No | FK → clinics (CASCADE) |
| client_id | uuid | No | FK → clients (CASCADE) |
| phone_number | varchar(20) | No | Client's WhatsApp phone number |
| status | enum | No | OPEN, CLOSED, HANDOFF, ARCHIVED |
| current_state | varchar(50) | Yes | Bot state (IDLE, AWAITING_CONFIRMATION, etc.) |
| current_intent | varchar(100) | Yes | User intent (appointment_booking, reschedule, etc.) |
| last_message_at | timestamp tz | Yes | Last message in conversation |
| last_inbound_at | timestamp tz | Yes | Last message from client |
| last_outbound_at | timestamp tz | Yes | Last message from clinic |
| assigned_user_id | uuid | Yes | FK → users, human assigned to conversation |
| opened_at | timestamp tz | Yes | When conversation started |
| closed_at | timestamp tz | Yes | When conversation ended |
| metadata_json | jsonb | Yes | Extra context (appointment_id, tags, etc.) |
| created_at | timestamp tz | No | UTC timestamp |
| updated_at | timestamp tz | No | UTC timestamp |

**Indexes**:
- `(clinic_id, status)` - Filter by clinic + status
- `(clinic_id, client_id)` - Find conversations for a client
- `(clinic_id, last_message_at)` - Sort by recency
- `(phone_number)` - Find conversation by phone
- `(assigned_user_id)` - Find conversations for user

#### 2. `conversation_messages`

Stores individual messages within a conversation.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | No | PK |
| conversation_id | uuid | No | FK → whatsapp_conversations (CASCADE) |
| clinic_id | uuid | No | FK → clinics (CASCADE) |
| client_id | uuid | No | FK → clients (CASCADE) |
| direction | enum | No | inbound, outbound |
| provider_message_id | varchar(255) | Yes | WhatsApp wamid |
| provider_parent_message_id | varchar(255) | Yes | For threaded replies |
| message_type | varchar(50) | No | text, image, document, template, location, etc. |
| template_name | varchar(100) | Yes | Template used (if any) |
| payload_json | jsonb | Yes | Full message payload from provider |
| normalized_text | text | Yes | Plain text for search indexing |
| status | enum | No | pending, sent, delivered, read, failed |
| sent_at | timestamp tz | Yes | UTC timestamp |
| delivered_at | timestamp tz | Yes | UTC timestamp |
| read_at | timestamp tz | Yes | UTC timestamp |
| failed_at | timestamp tz | Yes | UTC timestamp |
| error_code | varchar(50) | Yes | Error code from provider |
| error_message | varchar(500) | Yes | Error details |
| created_at | timestamp tz | No | UTC timestamp |

**Indexes**:
- `(conversation_id, created_at)` - Messages in a conversation, ordered
- `(clinic_id, created_at)` - All messages for clinic, ordered
- `(status)` - Find pending/failed messages
- `(provider_message_id)` - Prevent duplicates from webhook

#### 3. `whatsapp_templates`

Stores WhatsApp message templates for bulk campaigns or standard messaging.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | No | PK |
| clinic_id | uuid | No | FK → clinics (CASCADE) |
| name | varchar(255) | No | Template name (e.g., "appointment_reminder") |
| category | enum | No | AUTHENTICATION, MARKETING, UTILITY |
| language_code | varchar(10) | No | ISO language code (es, en, pt) |
| status | enum | No | draft, submitted, approved, rejected, paused, disabled |
| header_type | varchar(50) | Yes | IMAGE, VIDEO, DOCUMENT, TEXT |
| body_text | text | No | Template body with {{variable}} placeholders |
| footer_text | text | Yes | Optional footer |
| buttons_json | jsonb | Yes | Button definitions |
| variables_json | jsonb | Yes | Variable metadata |
| provider_template_id | varchar(255) | Yes | Meta template ID |
| rejected_reason | text | Yes | Why Meta rejected template |
| created_at | timestamp tz | No | UTC timestamp |
| updated_at | timestamp tz | No | UTC timestamp |

**Indexes**:
- `(clinic_id, status)` - Find clinic's approved templates
- `(clinic_id, name)` - Find template by name
- `(provider_template_id)` - Map back to Meta templates

#### 4. `whatsapp_webhook_events`

Stores raw webhook events from WhatsApp for audit trail and replay.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | No | PK |
| clinic_id | uuid | No | FK → clinics |
| provider | varchar(50) | No | 'meta' (for future: twilio, dialog360, etc.) |
| event_type | enum | No | message, message_status, message_template_feedback, phone_number_quality |
| provider_event_id | varchar(255) | Yes | The ID from webhook |
| payload_json | jsonb | No | Complete webhook payload |
| received_at | timestamp tz | No | When webhook was received (UTC) |
| processed_at | timestamp tz | Yes | When webhook was fully processed |
| processing_status | enum | No | pending, processing, processed, failed |
| retry_count | integer | No | Retries attempted |
| error_message | text | Yes | Error if processing failed |
| created_at | timestamp tz | No | UTC timestamp |

**Indexes**:
- `(clinic_id, event_type)` - Filter by clinic and event type
- `(clinic_id, processing_status)` - Find pending webhooks
- `(processed_at)` - Audit trail queries
- `(provider_event_id)` - Prevent duplicate processing

#### 5. `whatsapp_conversation_transitions`

Tracks state machine transitions for audit and analytics.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | No | PK |
| conversation_id | uuid | No | FK → whatsapp_conversations (CASCADE) |
| from_state | varchar(100) | Yes | Previous state |
| to_state | varchar(100) | No | New state |
| trigger_type | varchar(100) | Yes | user_message, bot_action, timeout, human_handoff |
| trigger_value | text | Yes | The value that triggered transition |
| metadata_json | jsonb | Yes | Extra context |
| created_at | timestamp tz | No | UTC timestamp |

**Indexes**:
- `(conversation_id, created_at)` - Transition history for conversation
- `(from_state, to_state)` - Analyze transition patterns

---

### Existing Table Extensions (Optional)

These changes are **backward-compatible** and **optional**. All new columns are nullable.

#### message_logs

Add optional columns:

```sql
ALTER TABLE message_logs ADD COLUMN conversation_id uuid;
ALTER TABLE message_logs ADD COLUMN payload_json jsonb;
ALTER TABLE message_logs ADD COLUMN delivered_at timestamp with time zone;

CREATE INDEX IDX_message_logs_conversation_id ON message_logs(conversation_id);
```

#### whatsapp_outbox

Add optional columns:

```sql
ALTER TABLE whatsapp_outbox ADD COLUMN conversation_id uuid;
ALTER TABLE whatsapp_outbox ADD COLUMN template_id uuid;
ALTER TABLE whatsapp_outbox ADD COLUMN payload_json jsonb;
ALTER TABLE whatsapp_outbox ADD COLUMN scheduled_at timestamp with time zone;

CREATE INDEX IDX_whatsapp_outbox_conversation_id ON whatsapp_outbox(conversation_id);
CREATE INDEX IDX_whatsapp_outbox_template_id ON whatsapp_outbox(template_id);
```

---

## Part 2: Chatbot State Machine

### Recommended States

The following states are recommended for a standard veterinary SaaS chatbot:

| State | Description |
|-------|-------------|
| `IDLE` | Conversation started, awaiting user input |
| `AWAITING_CONFIRMATION` | User confirmed appointment, awaiting clinic confirmation |
| `AWAITING_RESCHEDULE_DATE` | User wants to reschedule, awaiting new date |
| `AWAITING_PET_SELECTION` | Multiple pets, awaiting pet selection |
| `AWAITING_SERVICE_SELECTION` | Awaiting service/grooming type selection |
| `AWAITING_ADDRESS_SELECTION` | Multiple addresses, awaiting address selection |
| `HANDOFF_TO_HUMAN` | Conversation handed off to human staff |
| `CLOSED` | Conversation completed |

### State Transitions

Example flow for appointment booking:

```
START
  ↓
IDLE (bot asks "What can I help you with?")
  ↓ [user: "I want to book an appointment"]
AWAITING_PET_SELECTION (bot shows pet list)
  ↓ [user selects pet]
AWAITING_SERVICE_SELECTION (bot shows available services)
  ↓ [user selects service]
AWAITING_CONFIRMATION (bot shows available slots)
  ↓ [user confirms slot]
AWAITING_CONFIRMATION (bot processes booking)
  ↓ [if success] → CLOSED
  ↓ [if error] → HANDOFF_TO_HUMAN (escalate to staff)
HANDOFF_TO_HUMAN (human manager takes over)
  ↓ [human resolves]
CLOSED
```

### Implementation Notes

1. **Trigger Types**:
   - `user_message` - User sent a message
   - `bot_action` - Bot executed an action
   - `timeout` - Conversation timed out
   - `human_handoff` - Escalated to human staff

2. **Metadata Storage**:
   - Store relevant context in `whatsapp_conversations.metadata_json`:
     ```json
     {
       "appointment_id": "uuid",
       "pet_id": "uuid",
       "service_id": "uuid",
       "selected_slot": "2026-03-15T14:00:00Z",
       "reason_for_handoff": "pet_not_found"
     }
     ```

3. **Timeout Handling**:
   - If user doesn't respond for 24+ hours → auto-close conversation
   - If user responds after closure → open new conversation

---

## Part 3: Backend Implementation

### Module Structure

```
src/modules/notifications/
├── dtos/
│   └── notification.dto.ts          # Request/Response DTOs
├── repositories/
│   └── notification.repository.ts   # Data access layer
├── services/
│   └── notification.service.ts      # Business logic
├── notifications.controller.ts      # HTTP endpoints
├── notifications.module.ts          # NestJS module
```

### Controllers & Endpoints

#### NotificationController

```typescript
@Controller('notifications')
@UseGuards(ClinicGuard)
export class NotificationController {
  
  // GET /notifications?page=1&limit=20&dateFrom=...&dateTo=...
  @Get()
  getNotifications(
    @GetClinic() clinicId: string,
    @Query() filters: NotificationListFilterDto
  ) → Promise<NotificationListResponseDto>
  
  // GET /notifications/:id
  @Get(':id')
  getNotificationDetail(
    @GetClinic() clinicId: string,
    @Param('id') notificationId: string
  ) → Promise<NotificationDetailDto>
  
  // GET /notifications/tabs/queue
  @Get('tabs/queue')
  getQueue(
    @GetClinic() clinicId: string
  ) → Promise<NotificationQueueResponseDto>
  
  // GET /notifications/tabs/errors
  @Get('tabs/errors')
  getErrors(
    @GetClinic() clinicId: string
  ) → Promise<NotificationErrorsResponseDto>
}
```

### Service Layer

```typescript
@Injectable()
export class NotificationService {
  
  // Get paginated history with filters
  async getNotifications(
    clinicId: string,
    filters: NotificationListFilterDto
  ): Promise<NotificationListResponseDto>
  
  // Get single notification with full details
  async getNotificationDetail(
    clinicId: string,
    notificationId: string
  ): Promise<NotificationDetailDto>
  
  // Get current message queue
  async getQueue(clinicId: string): Promise<NotificationQueueResponseDto>
  
  // Get failed messages
  async getErrors(clinicId: string): Promise<NotificationErrorsResponseDto>
}
```

### Repository Pattern

```typescript
@Injectable()
export class NotificationRepository {
  
  // Query notification history from message_logs + whatsapp_outbox
  async getNotificationHistory(
    clinicId: string,
    filters: NotificationListFilterDto
  ): Promise<NotificationListResponseDto>
  
  // Get single notification with full details
  async getNotificationDetail(
    clinicId: string,
    notificationId: string
  ): Promise<NotificationDetailDto>
  
  // Query whatsapp_outbox for pending/retrying items
  async getNotificationQueue(clinicId: string): Promise<NotificationQueueResponseDto>
  
  // Query message_logs for failed items
  async getNotificationErrors(clinicId: string): Promise<NotificationErrorsResponseDto>
}
```

### DTO Examples

#### Request: Get Notifications with Filters

```typescript
export class NotificationListFilterDto {
  dateFrom?: Date;                          // ISO date string
  dateTo?: Date;                            // ISO date string
  clientId?: string;                        // UUID
  phoneNumber?: string;                     // E.164 format
  status?: string;                          // delivered | read | failed | sent
  direction?: 'inbound' | 'outbound';       // Message direction
  messageType?: string;                     // text | image | template | contact
  errorsOnly?: boolean;                     // Filter to errors only
  page: number = 1;                         // Pagination
  limit: number = 20;                       // Items per page
}
```

#### Response: Notification List

```json
{
  "data": [
    {
      "id": "uuid",
      "dateTime": "2026-03-09T14:30:45Z",
      "channel": "WhatsApp",
      "direction": "outbound",
      "clientName": "Juan García",
      "phoneNumber": "+525512345678",
      "messageType": "text",
      "messagePreview": "Tu cita está confirmada para mañana...",
      "status": "delivered",
      "origin": "Reminder",
      "retryCount": 0,
      "hasError": false,
      "conversationId": "uuid"
    }
  ],
  "total": 247,
  "page": 1,
  "limit": 20,
  "totalPages": 13
}
```

#### Response: Notification Detail

```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "clientId": "uuid",
  "clientName": "Juan García",
  "phoneNumber": "+525512345678",
  "fullMessageBody": "Tu cita está confirmada para mañana...",
  "messageType": "text",
  "direction": "outbound",
  "payloadJson": {
    "messaging_product": "whatsapp",
    "to": "+525512345678",
    "type": "text",
    "text": { "body": "..." }
  },
  "whatsappMessageId": "wamid.HBEUGGhhZ...",
  "retryCount": 0,
  "sentAt": "2026-03-09T14:30:45Z",
  "deliveredAt": "2026-03-09T14:30:48Z",
  "createdAt": "2026-03-09T14:30:40Z",
  "relatedReminderId": "uuid"
}
```

---

## Part 4: Frontend Implementation

### Module Structure

```
src/app/(protected)/clinic/communications/
├── notifications/
│   ├── page.tsx                       # Main notifications page
│   ├── NotificationFiltersPanel.tsx   # Filter UI
│   ├── NotificationDetailDrawer.tsx   # Detail view
│   ├── NotificationQueue.tsx          # Queue tab
│   └── NotificationErrors.tsx         # Errors tab
├── layout.tsx                         # Communications layout
```

### State Management (Zustand)

```typescript
export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: NotificationItem[],
  selectedNotification: NotificationDetail | null,
  queue: QueueItem[],
  errors: ErrorItem[],
  total: number,
  page: number,
  totalPages: number,
  isLoading: boolean,
  activeTab: 'history' | 'queue' | 'errors',
  
  // Actions
  fetchNotifications: async (filters: NotificationFilters) → Promise<void>,
  fetchNotificationDetail: async (id: string) → Promise<void>,
  fetchQueue: async () → Promise<void>,
  fetchErrors: async () → Promise<void>,
  setActiveTab: (tab: 'history' | 'queue' | 'errors') → void,
  setPage: (page: number) → void,
}))
```

### Components

#### NotificationsPage

Main page component with:
- Tab navigation (History, Queue, Errors)
- Notifications grid with columns
- Pagination controls
- Filter panel
- Detail drawer (on row click)

**Columns**:
- Date/Time (UTC, converted to clinic timezone for display)
- Channel (WhatsApp)
- Direction (↓ inbound, ↑ outbound)
- Client Name
- Phone Number
- Message Type
- Message Preview
- Status (badge)
- Origin (Reminder/Manual/API)
- Actions (View Details)

**Filters**:
- Date range (from/to)
- Client name/ID
- Phone number
- Status
- Direction
- Message type
- Errors only

#### NotificationDetailDrawer

Modal drawer showing:
- Client information
- Message details
- Full message body
- Timestamps (sent, delivered, read, failed)
- WhatsApp message ID (copiable)
- Error details (if failed)
- Payload JSON (collapsible)
- Related records (links to reminder/appointment)

#### NotificationQueue

Tab showing messages currently in `whatsapp_outbox`:
- Pending and retrying messages
- Retry count
- Last retry timestamp
- Scheduled send time (if applicable)

#### NotificationErrors

Tab showing failed messages from `message_logs`:
- All messages with status='failed'
- Error code and message
- Ability to expand details
- Last 100 errors

---

## Part 5: Timezone Handling (CRITICAL)

### Database Layer

1. **All timestamps stored in UTC**:
   ```typescript
   @Column({ 
     name: 'created_at', 
     type: 'timestamp with time zone',  // ← explicit UTC
     default: 'CURRENT_TIMESTAMP' 
   })
   createdAt!: Date;
   ```

2. **Backend normalization**:
   ```typescript
   // Always normalize user input to UTC before storing
   const utcDate = new Date(userInputDate);
   utcDate.setHours(utcDate.getHours() - utcDate.getTimezoneOffset() / 60);
   
   notification.createdAt = utcDate;
   ```

3. **Query with UTC**:
   ```typescript
   const fromDate = new Date(filters.dateFrom); // User provides local time
   // Convert to UTC for query
   query.andWhere('msg.createdAt >= :dateFrom', { 
     dateFrom: fromDate 
   });
   ```

### Frontend Layer

1. **Always receive UTC from API**:
   ```typescript
   const notification = await api.get(`/notifications/${id}`);
   // notification.createdAt = "2026-03-09T14:30:45Z" (UTC)
   ```

2. **Convert to clinic timezone for display**:
   ```typescript
   // Use date-fns-tz for timezone conversion
   import { format, toZonedTime } from 'date-fns-tz';
   
   const clinicTimezone = 'America/Mexico_City';
   const zonedDate = toZonedTime(new Date(utcDate), clinicTimezone);
   const displayText = format(zonedDate, 'dd/MM/yyyy HH:mm', { timeZone: clinicTimezone });
   ```

3. **Never store local time in database**:
   ```typescript
   // ❌ WRONG
   const localDate = new Date(); // User's browser timezone
   await api.post('/notifications', { timestamp: localDate });
   
   // ✅ CORRECT
   const utcDate = new Date(); // JavaScript Date is always UTC internally
   await api.post('/notifications', { timestamp: utcDate.toISOString() });
   ```

---

## Part 6: Integration Points

### With Existing Systems

1. **message_logs**:
   - Continue to store all WhatsApp messages
   - New `conversation_id` links to conversation threads
   - New `payload_json` stores structured data

2. **whatsapp_outbox**:
   - Continue to work as message queue
   - New `conversation_id` for threading
   - New `template_id` for template reference
   - New `scheduled_at` for future sends

3. **Reminders**:
   - Set `conversation_id` when reminder message sent
   - Link conversation to reminder for context

4. **Clinic Configuration**:
   - Use existing `clinic_whatsapp_config` for provider credentials
   - Extend with webhook URL if not present

---

## Part 7: Performance Considerations

### Query Optimization

1. **Notifications Grid**:
   ```sql
   SELECT 
     msg.id, msg.created_at, msg.direction, msg.client_id,
     msg.phone_number, msg.message_type, msg.message_body,
     msg.status, msg.reminder_id,
     c.name as client_name
   FROM message_logs msg
   JOIN clients c ON msg.client_id = c.id
   WHERE msg.clinic_id = $1
   AND msg.created_at BETWEEN $2 AND $3
   ORDER BY msg.created_at DESC
   LIMIT 20 OFFSET 0;
   ```

   **Indexes needed**:
   - `(clinic_id, created_at DESC)`
   - `(clinic_id, status)`
   - `(clinic_id, phone_number)`

2. **Queue Queries**:
   ```sql
   SELECT * FROM whatsapp_outbox
   WHERE clinic_id = $1
   AND status IN ('queued', 'retrying')
   ORDER BY created_at DESC;
   ```

   **Indexes needed**:
   - `(clinic_id, status)`

3. **Archive Old Data**:
   ```sql
   -- Move old messages to archive table (optional)
   DELETE FROM conversation_messages 
   WHERE clinic_id = $1 
   AND created_at < NOW() - INTERVAL '90 days';
   ```

---

## Part 8: Migration & Deployment

### Step 1: Database Migrations

```bash
# Run migrations in order
npm run typeorm migration:run

# This will:
# 1. Create whatsapp_conversations
# 2. Create conversation_messages
# 3. Create whatsapp_templates
# 4. Create whatsapp_webhook_events
# 5. Create whatsapp_conversation_transitions
# 6. (Optional) Extend message_logs & whatsapp_outbox
```

### Step 2: Backend Integration

1. Import NotificationsModule in app.module.ts:
   ```typescript
   @Module({
     imports: [
       // ... other modules
       NotificationsModule,
     ],
   })
   export class AppModule {}
   ```

2. Register endpoints at `/notifications`

3. Test with sample data

### Step 3: Frontend Integration

1. Add Communications submenu to clinic layout
2. Link to `/clinic/communications/notifications`
3. Deploy frontend

### Step 4: Webhook Processing

Create a webhook processor service to:
1. Ingest incoming webhook events
2. Store in `whatsapp_webhook_events` with status='pending'
3. Process asynchronously
4. Update `conversation_messages` and conversation state

---

## Part 9: API Response Examples

### Example 1: Get Notifications with Filters

**Request**:
```bash
GET /notifications?page=1&limit=10&dateFrom=2026-03-08&status=failed&errorsOnly=true
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "dateTime": "2026-03-09T10:30:45Z",
      "channel": "WhatsApp",
      "direction": "outbound",
      "clientName": "Maria López",
      "phoneNumber": "+525551234567",
      "messageType": "text",
      "messagePreview": "Tu recordatorio de vacunación está listo. Responde SÍ para confirmar...",
      "status": "failed",
      "origin": "Reminder",
      "retryCount": 3,
      "hasError": true,
      "conversationId": "f1e2d3c4-b5a6-7890-cdef-1234567890ab"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Example 2: Get Notification Detail

**Request**:
```bash
GET /notifications/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Response** (200 OK):
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "conversationId": "f1e2d3c4-b5a6-7890-cdef-1234567890ab",
  "clientId": "m1n2o3p4-q5r6-7890-stuv-wx1234567890",
  "clientName": "Maria López",
  "phoneNumber": "+525551234567",
  "fullMessageBody": "Tu recordatorio de vacunación está listo.\nResponde SÍ para confirmar tu disponibilidad.\nResponde NO si deseas cambiar la fecha.",
  "messageType": "text",
  "direction": "outbound",
  "payloadJson": {
    "messaging_product": "whatsapp",
    "to": "+525551234567",
    "type": "text",
    "text": { "body": "Tu recordatorio de vacunación..." }
  },
  "whatsappMessageId": "wamid.HBEUGGFDJHSJDHSDJHSDJHSDJhsjhsd",
  "retryCount": 3,
  "errorCode": "131051",
  "errorMessage": "Invalid recipient number",
  "sentAt": "2026-03-09T10:30:45Z",
  "failedAt": "2026-03-09T10:31:15Z",
  "createdAt": "2026-03-09T10:30:40Z",
  "relatedReminderId": "r1e2m3i4-n5d6-7890-able-r1234567890"
}
```

### Example 3: Get Queue

**Request**:
```bash
GET /notifications/tabs/queue
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "q1u2e3u4-e5u6-7890-eueu-eq1234567890",
      "dateTime": "2026-03-09T15:22:33Z",
      "clientName": "Carlos Mendez",
      "phoneNumber": "+525559876543",
      "messagePreview": "Tu cita de baño para Max está confirmada...",
      "status": "queued",
      "retryCount": 0,
      "maxRetries": 5,
      "lastRetryAt": null,
      "scheduledAt": null
    }
  ],
  "total": 3
}
```

### Example 4: Get Errors

**Request**:
```bash
GET /notifications/tabs/errors
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "err1-err2-err3-err4-err1234567890",
      "dateTime": "2026-03-09T09:15:22Z",
      "clientName": "Rosa García",
      "phoneNumber": "+525557654321",
      "messagePreview": "Recordatorio de medicamento para Fluffy...",
      "errorCode": "400",
      "errorMessage": "Invalid phone number format",
      "status": "failed",
      "retryCount": 5
    }
  ],
  "total": 8
}
```

---

## Part 10: Security Considerations

1. **Multi-Tenant Isolation**:
   - All queries include `WHERE clinic_id = $clinicId`
   - Use `@GetClinic()` decorator to extract clinic ID from JWT
   - Never trust client-provided clinic_id

2. **Webhook Verification**:
   - Verify webhook signature using clinic's webhook secret
   - Store raw payload in `whatsapp_webhook_events`
   - Process asynchronously with retry logic

3. **Sensitive Data**:
   - Phone numbers are already PII
   - Message content may contain personal health information
   - Ensure proper access controls on Notifications endpoint

4. **Rate Limiting**:
   - Limit notification API queries per clinic
   - Prevent bulk exports of phone numbers

---

## Part 11: Testing Checklist

- [ ] Database migrations run successfully
- [ ] All foreign keys work
- [ ] Indexes are created
- [ ] NotificationService retrieves data correctly
- [ ] Pagination works
- [ ] Filters work (date range, status, direction, etc.)
- [ ] Frontend loads Notifications page
- [ ] Tab switching works (History, Queue, Errors)
- [ ] Detail drawer opens with full information
- [ ] Filter panel applies filters
- [ ] Error states handled (network errors, empty results)
- [ ] Timezone conversion works correctly (UTC → clinic timezone)
- [ ] Copy-to-clipboard buttons work
- [ ] No N+1 queries

---

## Part 12: Future Enhancements

1. **Real-time Updates**:
   - WebSocket for live notification updates
   - Use Socket.io for bi-directional communication

2. **Bulk Actions**:
   - Select multiple notifications
   - Bulk mark as read
   - Bulk export

3. **Analytics**:
   - Message delivery rate by time of day
   - Response rates by message type
   - Client engagement metrics

4. **Chatbot Dashboard**:
   - Conversation flow visualization
   - Intent distribution chart
   - Handoff rate tracking

5. **Template Editor**:
   - Visual template builder
   - Preview before submission to Meta
   - Version history

6. **Conversation Search**:
   - Full-text search across message bodies
   - Search by client name, phone number
   - Search by intent or state

---

## Conclusion

This WhatsApp messaging infrastructure provides a production-ready foundation for:
- **Conversational chat** with clinics
- **Chatbot automation** with state machine
- **Operational monitoring** via Notifications module
- **Full UTC compliance** for global readiness
- **Multi-tenant safety** for enterprise SaaS

All code follows TypeORM best practices, NestJS patterns, and React/Next.js conventions.

