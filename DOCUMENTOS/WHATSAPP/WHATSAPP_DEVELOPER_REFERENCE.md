# WhatsApp Messaging - Developer Quick Reference

**Project**: VibraLive  
**Purpose**: Quick lookup for developers integrating the WhatsApp messaging infrastructure  
**Date**: March 9, 2026

---

## 🚀 Quick Start

### 1. Run Migrations
```bash
npm run typeorm migration:run
```

### 2. Import Module in App
```typescript
// app.module.ts
import { NotificationsModule } from '@/modules/notifications/notifications.module';

@Module({
  imports: [NotificationsModule]
})
export class AppModule {}
```

### 3. Use in Frontend
```typescript
import { useNotificationStore } from '@/store/notificationStore';

export function MyComponent() {
  const { fetchNotifications, notifications } = useNotificationStore();
  
  useEffect(() => {
    fetchNotifications({ page: 1, limit: 20 });
  }, []);
  
  return <div>{notifications.map(n => ...)}</div>;
}
```

---

## 📊 Database Tables & Fields

### whatsapp_conversations
```typescript
{
  id: string;                    // uuid
  clinic_id: string;             // uuid
  client_id: string;             // uuid
  phone_number: string;          // "+525512345678"
  status: string;                // "OPEN" | "CLOSED" | "HANDOFF" | "ARCHIVED"
  current_state?: string;        // "IDLE" | "AWAITING_CONFIRMATION" | ...
  current_intent?: string;       // "appointment_booking" | ...
  last_message_at?: Date;        // UTC
  last_inbound_at?: Date;        // UTC
  last_outbound_at?: Date;       // UTC
  assigned_user_id?: string;     // uuid
  opened_at?: Date;              // UTC
  closed_at?: Date;              // UTC
  metadata_json?: {              // Custom data
    appointment_id?: string;
    pet_id?: string;
    service_id?: string;
    reason_for_handoff?: string;
  };
  created_at: Date;              // UTC
  updated_at: Date;              // UTC
}
```

### conversation_messages
```typescript
{
  id: string;                     // uuid
  conversation_id: string;        // uuid (FK)
  clinic_id: string;              // uuid
  client_id: string;              // uuid
  direction: string;              // "inbound" | "outbound"
  provider_message_id?: string;   // WhatsApp wamid
  provider_parent_message_id?: string; // For threads
  message_type: string;           // "text" | "image" | "document" | "template" | ...
  template_name?: string;         // "appointment_reminder"
  payload_json?: {                // Full provider payload
    messaging_product: string;
    to: string;
    type: string;
    text?: { body: string };
    image?: { link: string };
    template?: { name: string; parameters: any };
  };
  normalized_text?: string;       // Plain text for search
  status: string;                 // "pending" | "sent" | "delivered" | "read" | "failed"
  sent_at?: Date;                 // UTC
  delivered_at?: Date;            // UTC
  read_at?: Date;                 // UTC
  failed_at?: Date;               // UTC
  error_code?: string;            // "131051"
  error_message?: string;         // "Invalid recipient number"
  created_at: Date;               // UTC
}
```

### whatsapp_templates
```typescript
{
  id: string;                     // uuid
  clinic_id: string;              // uuid
  name: string;                   // "appointment_reminder"
  category: string;               // "UTILITY" | "MARKETING" | "AUTHENTICATION"
  language_code: string;          // "es" | "en" | "pt"
  status: string;                 // "draft" | "submitted" | "approved" | "rejected" | "paused" | "disabled"
  header_type?: string;           // "IMAGE" | "VIDEO" | "DOCUMENT" | "TEXT"
  body_text: string;              // "Tu cita está {{date}} a las {{time}}"
  footer_text?: string;           // "VibraLive Clínica Veterinaria"
  buttons_json?: [                // Array of buttons
    {
      type: "URL" | "PHONE_NUMBER" | "QUICK_REPLY" | "COPY_CODE";
      text: string;
      url?: string;
      phone_number?: string;
    }
  ];
  variables_json?: [              // Variables in template
    {
      name: "date";
      type: "string";
      example: "15/03/2026";
    }
  ];
  provider_template_id?: string;   // Meta template ID
  rejected_reason?: string;       // Why Meta rejected it
  created_at: Date;               // UTC
  updated_at: Date;               // UTC
}
```

### whatsapp_webhook_events
```typescript
{
  id: string;                     // uuid
  clinic_id: string;              // uuid
  provider: string;               // "meta" | "twilio" | "dialog360" | ...
  event_type: string;             // "message" | "message_status" | "message_template_feedback" | "phone_number_quality"
  provider_event_id?: string;     // Webhook event ID
  payload_json: {                 // Complete webhook payload
    [key: string]: any;
  };
  received_at: Date;              // UTC (when webhook received)
  processed_at?: Date;            // UTC (when processed)
  processing_status: string;      // "pending" | "processing" | "processed" | "failed"
  retry_count: number;            // Number of retries
  error_message?: string;         // Error during processing
  created_at: Date;               // UTC
}
```

### whatsapp_conversation_transitions
```typescript
{
  id: string;                     // uuid
  conversation_id: string;        // uuid (FK)
  from_state?: string;            // Previous state
  to_state: string;               // New state
  trigger_type?: string;          // "user_message" | "bot_action" | "timeout" | "human_handoff"
  trigger_value?: string;         // What caused the transition
  metadata_json?: {               // Extra context
    [key: string]: any;
  };
  created_at: Date;               // UTC
}
```

---

## 🔗 API Endpoints

### Get Notifications List
```typescript
// Request
GET /notifications?page=1&limit=20&status=delivered&dateFrom=2026-03-08

// Response
{
  data: NotificationItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### Get Notification Detail
```typescript
// Request
GET /notifications/a1b2c3d4-e5f6-7890-abcd-ef1234567890

// Response
{
  id: string;
  conversationId?: string;
  clientId: string;
  clientName: string;
  phoneNumber: string;
  fullMessageBody: string;
  messageType: string;
  direction: "inbound" | "outbound";
  payloadJson?: Record<string, any>;
  whatsappMessageId?: string;
  retryCount: number;
  errorCode?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  createdAt: Date;
  relatedReminderId?: string;
}
```

### Get Queue
```typescript
// Request
GET /notifications/tabs/queue

// Response
{
  data: QueueItemDto[];
  total: number;
}

// QueueItemDto
{
  id: string;
  dateTime: Date;
  clientName: string;
  phoneNumber: string;
  messagePreview: string;
  status: string;
  retryCount: number;
  maxRetries: number;
  lastRetryAt?: Date;
  scheduledAt?: Date;
}
```

### Get Errors
```typescript
// Request
GET /notifications/tabs/errors

// Response
{
  data: ErrorItemDto[];
  total: number;
}

// ErrorItemDto
{
  id: string;
  dateTime: Date;
  clientName: string;
  phoneNumber: string;
  messagePreview: string;
  errorCode?: string;
  errorMessage?: string;
  status: string;
  retryCount: number;
}
```

---

## 📝 Common SQL Queries

### Get All Conversations for a Clinic
```sql
SELECT id, client_id, phone_number, status, current_state, last_message_at
FROM whatsapp_conversations
WHERE clinic_id = '12345678-1234-1234-1234-123456789abc'
ORDER BY last_message_at DESC;
```

### Get Messages in a Conversation
```sql
SELECT id, direction, message_type, status, normalized_text, created_at
FROM conversation_messages
WHERE conversation_id = 'conv-id-here'
ORDER BY created_at ASC;
```

### Get Failed Messages (Last 7 Days)
```sql
SELECT msg.id, msg.client_id, msg.phone_number, msg.error_code, 
       msg.error_message, msg.created_at
FROM conversation_messages msg
WHERE msg.clinic_id = 'clinic-id'
  AND msg.status = 'failed'
  AND msg.created_at >= NOW() - INTERVAL '7 days'
ORDER BY msg.created_at DESC;
```

### Get Pending Queue Items
```sql
SELECT id, client_id, phone_number, status, retry_count, last_retry_at, created_at
FROM whatsapp_outbox
WHERE clinic_id = 'clinic-id'
  AND status IN ('queued', 'retrying')
ORDER BY created_at ASC;
```

### Get Approved Templates for a Clinic
```sql
SELECT id, name, category, language_code, status, provider_template_id
FROM whatsapp_templates
WHERE clinic_id = 'clinic-id'
  AND status = 'approved'
ORDER BY name ASC;
```

### Get State Transitions for a Conversation
```sql
SELECT from_state, to_state, trigger_type, created_at
FROM whatsapp_conversation_transitions
WHERE conversation_id = 'conv-id-here'
ORDER BY created_at ASC;
```

### Get Webhook Events Pending Processing
```sql
SELECT id, event_type, provider_event_id, received_at, retry_count
FROM whatsapp_webhook_events
WHERE clinic_id = 'clinic-id'
  AND processing_status = 'pending'
  AND retry_count < 3
ORDER BY received_at ASC;
```

### Get Message Delivery Stats (Last 30 Days)
```sql
SELECT 
  status,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM conversation_messages
WHERE clinic_id = 'clinic-id'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY status
ORDER BY total DESC;
```

### Get Conversation Duration (Time from Open to Close)
```sql
SELECT 
  id,
  client_id,
  EXTRACT(EPOCH FROM (closed_at - opened_at))/3600 as hours_open,
  closed_at - opened_at as duration
FROM whatsapp_conversations
WHERE clinic_id = 'clinic-id'
  AND status = 'CLOSED'
  AND closed_at IS NOT NULL
ORDER BY closed_at DESC;
```

---

## 🛠️ Common Operations

### Create a Conversation
```typescript
const conversation = await conversationRepository.save({
  clinicId,
  clientId,
  phoneNumber: '+525512345678',
  status: 'OPEN',
  currentState: 'IDLE',
  openedAt: new Date(),
  metadataJson: {
    appointment_id: 'apt-123',
  },
});
```

### Add a Message to Conversation
```typescript
const message = await messageRepository.save({
  conversationId,
  clinicId,
  clientId,
  direction: 'outbound',
  messageType: 'text',
  normalizedText: 'Hello, world!',
  status: 'sent',
  sentAt: new Date(),
  createdAt: new Date(),
});
```

### Update Conversation State
```typescript
// Update conversation
await conversationRepository.update(
  { id: conversationId },
  {
    currentState: 'AWAITING_CONFIRMATION',
    currentIntent: 'appointment_booking',
    metadataJson: {
      ...metadata,
      selected_slot: '2026-03-15T14:00:00Z',
    },
  }
);

// Log transition
await transitionRepository.save({
  conversationId,
  fromState: 'IDLE',
  toState: 'AWAITING_CONFIRMATION',
  triggerType: 'user_message',
  triggerValue: 'User replied with appointment request',
  metadataJson: { action: 'bot_processed_input' },
});
```

### Mark Message as Delivered
```typescript
await messageRepository.update(
  { id: messageId },
  {
    status: 'delivered',
    deliveredAt: new Date(),
  }
);
```

### Mark Message as Failed
```typescript
await messageRepository.update(
  { id: messageId },
  {
    status: 'failed',
    failedAt: new Date(),
    errorCode: '131051',
    errorMessage: 'Invalid recipient number',
  }
);
```

### Store Webhook Event
```typescript
await webhookRepository.save({
  clinicId,
  provider: 'meta',
  eventType: 'message_status',
  providerEventId: webhook.entry[0].changes[0].value.statuses[0].id,
  payloadJson: webhook,
  receivedAt: new Date(),
  processingStatus: 'pending',
  retryCount: 0,
});
```

### Create Template
```typescript
await templateRepository.save({
  clinicId,
  name: 'appointment_reminder',
  category: 'UTILITY',
  languageCode: 'es',
  status: 'draft',
  bodyText: 'Tu cita está {{date}} a las {{time}}',
  footerText: 'VibraLive Clínica Veterinaria',
  variablesJson: [
    { name: 'date', type: 'string', example: '15/03/2026' },
    { name: 'time', type: 'string', example: '14:00' },
  ],
  buttonsJson: [
    {
      type: 'QUICK_REPLY',
      text: '✓ Confirmar',
    },
    {
      type: 'QUICK_REPLY',
      text: '✗ Cancelar',
    },
  ],
});
```

---

## ⏰ Timezone Handling

### Backend: Parse User Input (Local → UTC)
```typescript
// User provides date in clinic's local timezone
const userLocalDate = new Date('2026-03-15T14:00:00');
// Convert to UTC for storage
const utcDate = new Date(userLocalDate.toISOString());

// Store in database
await repository.save({
  createdAt: utcDate,
});
```

### Backend: Format for API Response (UTC)
```typescript
// Database query returns UTC timestamps
const messages = await repository.find();

// Send as ISO strings (already UTC)
return messages.map(m => ({
  ...m,
  createdAt: m.createdAt.toISOString(), // "2026-03-09T14:30:45Z"
}));
```

### Frontend: Convert UTC → Clinic Timezone
```typescript
import { formatInTimeZone } from 'date-fns-tz';

// Receive UTC from API
const notification = await api.get('/notifications/123');
const utcDate = new Date(notification.createdAt); // "2026-03-09T14:30:45Z"

// Convert to clinic timezone (e.g., Mexico City)
const clinicTimezone = 'America/Mexico_City';
const formatted = formatInTimeZone(
  utcDate,
  clinicTimezone,
  'dd/MM/yyyy HH:mm:ss'
); // "09/03/2026 08:30:45"

// Or for date picker
const zonedDate = toZonedTime(utcDate, clinicTimezone);
```

---

## 🧪 Testing Snippets

### Test Get Notifications
```typescript
// notifications.controller.spec.ts
it('should return notifications with filters', async () => {
  const result = await controller.getNotifications('clinic-id', {
    page: 1,
    limit: 20,
    dateFrom: new Date('2026-03-08'),
    status: 'delivered',
  });

  expect(result.data.length).toBeGreaterThan(0);
  expect(result.total).toBeGreaterThan(0);
  expect(result.page).toBe(1);
});
```

### Test Create Conversation
```typescript
it('should create a conversation', async () => {
  const conversation = await repository.save({
    clinicId: 'clinic-123',
    clientId: 'client-123',
    phoneNumber: '+525512345678',
    status: 'OPEN',
    currentState: 'IDLE',
  });

  expect(conversation.id).toBeDefined();
  expect(conversation.status).toBe('OPEN');
});
```

---

## 📦 File Reference

### Backend
- `/src/database/entities/whatsapp-conversation.entity.ts` - Conversation entity
- `/src/database/entities/conversation-message.entity.ts` - Message entity
- `/src/database/entities/whatsapp-template.entity.ts` - Template entity
- `/src/database/entities/whatsapp-webhook-event.entity.ts` - Webhook entity
- `/src/database/entities/whatsapp-conversation-transition.entity.ts` - Transition entity
- `/src/modules/notifications/notifications.controller.ts` - API endpoints
- `/src/modules/notifications/services/notification.service.ts` - Business logic
- `/src/modules/notifications/repositories/notification.repository.ts` - Data access

### Frontend
- `/src/store/notificationStore.ts` - Zustand state
- `/src/app/(protected)/clinic/communications/notifications/page.tsx` - Main page
- `/src/app/(protected)/clinic/communications/notifications/NotificationFiltersPanel.tsx` - Filters
- `/src/app/(protected)/clinic/communications/notifications/NotificationDetailDrawer.tsx` - Detail view
- `/src/app/(protected)/clinic/communications/notifications/NotificationQueue.tsx` - Queue tab
- `/src/app/(protected)/clinic/communications/notifications/NotificationErrors.tsx` - Errors tab

---

## 🚨 Important Notes

1. **Always use UTC** in database queries
2. **Always include `clinic_id`** in WHERE clauses
3. **Use `toZonedTime()` + `formatInTimeZone()`** for timezone display
4. **Never store local timestamps** in database
5. **Verify webhook signatures** before processing
6. **Index frequently-queried columns** (created_at, clinic_id, status)
7. **Archive old data** after 90+ days if needed

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Timezone off by hours | Ensure you're using `toZonedTime()` correctly, not manual offset |
| Missing notifications | Check `clinic_id` filter, verify `message_logs` has data |
| Slow grid queries | Add indexes on `(clinic_id, created_at DESC)` |
| Webhook not processing | Check `whatsapp_webhook_events` table for pending items |
| Template submission fails | Verify required fields (name, bodyText, category, status) |
| Conversations not showing | Check `clinic_id` matches authenticated clinic |

---

## 📚 Related Documentation

- [WHATSAPP_MESSAGING_INFRASTRUCTURE.md](./WHATSAPP_MESSAGING_INFRASTRUCTURE.md) - Full implementation guide
- [WHATSAPP_IMPLEMENTATION_SUMMARY.md](./WHATSAPP_IMPLEMENTATION_SUMMARY.md) - Installation summary
- TypeORM Entity files - Schema definitions
- Migration files - Database changes

---

## ✨ Last Updated

**Date**: March 9, 2026  
**Version**: 1.0  
**Status**: Production Ready

