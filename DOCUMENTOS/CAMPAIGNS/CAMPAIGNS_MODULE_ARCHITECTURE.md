# VibraLive Campaigns Module - Architecture & Design

**Version**: 1.0  
**Date**: March 9, 2026  
**Status**: Production Ready

---

## 📑 Overview

The Campaigns module enables veterinary clinics to send **WhatsApp and Email campaigns** to filtered audiences. This module is separate from event-driven transactional messaging and supports:

- ✅ WhatsApp campaigns
- ✅ Email campaigns  
- ✅ Audience filtering with JSON-based criteria
- ✅ Campaign scheduling
- ✅ Delivery metrics and tracking
- ✅ Template variable system reuse
- ✅ UTC timezone handling
- ✅ Multi-tenant isolation

---

## 🗂️ Database Tables

### 1. campaign_templates

Stores reusable campaign templates (separate from `message_templates`).

```sql
CREATE TABLE campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('WHATSAPP', 'EMAIL')),
  
  -- Email specifics
  subject VARCHAR(255),
  body TEXT NOT NULL,
  body_html TEXT,
  preview_text VARCHAR(255),
  
  -- WhatsApp specifics
  whatsapp_template_name VARCHAR(255),
  whatsapp_template_language VARCHAR(10),
  
  -- Variables in JSON format: {"variables": ["clientName", "petName", ...]}
  variables_json JSONB,
  
  is_active BOOLEAN DEFAULT true,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_campaign_templates_clinic_id ON campaign_templates(clinic_id);
CREATE INDEX IDX_campaign_templates_channel ON campaign_templates(channel);
CREATE INDEX IDX_campaign_templates_is_active ON campaign_templates(is_active);
```

### 2. campaigns

Stores individual campaign executions.

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('WHATSAPP', 'EMAIL')),
  campaign_template_id UUID NOT NULL REFERENCES campaign_templates(id),
  
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' 
    CHECK (status IN ('DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'PAUSED', 'CANCELLED')),
  
  -- Audience filters: {"species": ["DOG"], "sex": ["FEMALE"], ...}
  filters_json JSONB NOT NULL,
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- These are populated before execution
  estimated_recipients INTEGER DEFAULT 0,
  actual_recipients INTEGER DEFAULT 0,
  
  -- Delivery metrics
  successful_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  
  -- Audit
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  paused_by_user_id UUID,
  paused_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_campaigns_clinic_id ON campaigns(clinic_id);
CREATE INDEX IDX_campaigns_status ON campaigns(status);
CREATE INDEX IDX_campaigns_scheduled_at ON campaigns(scheduled_at);
CREATE INDEX IDX_campaigns_clinic_created_at ON campaigns(clinic_id, created_at);
```

### 3. campaign_recipients

Tracks individual message sends within a campaign.

```sql
CREATE TABLE campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('WHATSAPP', 'EMAIL')),
  
  -- Contact info captured at send time for audit trail
  recipient_name VARCHAR(255),
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' 
    CHECK (status IN ('PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'OPENED', 'FAILED', 'SKIPPED')),
  
  skip_reason VARCHAR(255),
  
  -- References to delivery trackers
  message_log_id UUID REFERENCES message_logs(id) ON DELETE SET NULL,
  provider_message_id VARCHAR(255),
  
  -- Delivery tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  
  error_code VARCHAR(100),
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IDX_campaign_recipients_clinic_id ON campaign_recipients(clinic_id);
CREATE INDEX IDX_campaign_recipients_status ON campaign_recipients(status);
CREATE INDEX IDX_campaign_recipients_campaign_status ON campaign_recipients(campaign_id, status);
CREATE INDEX IDX_campaign_recipients_email ON campaign_recipients(recipient_email);
CREATE INDEX IDX_campaign_recipients_phone ON campaign_recipients(recipient_phone);
```

### 4. email_outbox

Tracks outbound emails (similar to whatsapp_outbox structure).

```sql
CREATE TABLE email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  campaign_recipient_id UUID REFERENCES campaign_recipients(id) ON DELETE CASCADE,
  
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  body_html TEXT,
  
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED')),
  
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  
  provider_message_id VARCHAR(255),
  provider_response JSONB,
  
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  error_code VARCHAR(100),
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_email_outbox_clinic_status ON email_outbox(clinic_id, status);
CREATE INDEX IDX_email_outbox_email ON email_outbox(to_email);
CREATE INDEX IDX_email_outbox_campaign_recipient ON email_outbox(campaign_recipient_id);
CREATE INDEX IDX_email_outbox_created_at ON email_outbox(created_at);
```

---

## 📐 Variable System

Campaign templates support the same variables as `message_templates`:

### Client Variables
- `{{clientName}}` - Full client name
- `{{clientFirstName}}` - First name
- `{{clientPhone}}` - Phone number
- `{{clientEmail}}` - Email address

### Pet Variables
- `{{petName}}` - Pet name
- `{{petBreed}}` - Breed name
- `{{petAge}}` - Age
- `{{petSpecies}}` - Species (DOG, CAT, etc.)
- `{{petSize}}` - Size (SMALL, MEDIUM, LARGE)
- `{{petSterilized}}` - Sterilization status

### Service Variables
- `{{serviceName}}` - Service/package name
- `{{servicePrice}}` - Formatted price
- `{{stylistName}}` - Assigned stylist name

### Appointment Variables
- `{{appointmentDate}}` - Appointment date (formatted for clinic timezone)
- `{{appointmentTime}}` - Appointment time
- `{{appointmentStatus}}` - Status

### Clinic Variables
- `{{clinicName}}` - Clinic name
- `{{clinicPhone}}` - Clinic phone
- `{{clinicAddress}}` - Full address
- `{{clinicCity}}` - City
- `{{clinicCountry}}` - Country

### Links (for campaigns)
- `{{confirmationLink}}` - Appointment confirmation link
- `{{cancellationLink}}` - Appointment cancellation link
- `{{reviewLink}}` - Review request link
- `{{unsubscribeLink}}` - Campaign unsubscribe link

---

## 🎯 Filtering System

Campaigns use JSON-based filtering for audience segmentation.

### Filter Structure

```json
{
  "species": ["DOG", "CAT"],
  "breed": ["Labrador", "Golden Retriever"],
  "sex": ["FEMALE"],
  "size": ["SMALL", "MEDIUM"],
  "sterilized": true,
  "age_min": 1,
  "age_max": 10,
  "microchip": true,
  "pet_active": true,
  "pet_deceased": false,
  
  "client_has_whatsapp": true,
  "client_has_email": true,
  "client_active": true,
  "client_created_after": "2024-01-01",
  "client_last_visit_before": "2025-01-01",
  "client_last_visit_after": "2024-06-01",
  "client_min_pets": 1,
  "client_max_pets": 5,
  "client_has_pending_appointments": true
}
```

### Query Logic

Filters are combined with AND logic. Multiple values within same field use OR logic.

Example: species = ["DOG", "CAT"] means (species = "DOG" OR species = "CAT")

---

## 🔄 Campaign Execution Flow

### Phase 1: Creation & Validation
1. User creates campaign via frontend
2. Selects template, channel, filters
3. System validates template variables against filters
4. Campaign saved as DRAFT

### Phase 2: Audience Preview
1. Filter query executes against clients/pets tables
2. Returns estimated recipient count
3. User can adjust filters
4. Campaign status: DRAFT → SCHEDULED

### Phase 3: Recipients Generation
1. Trigger when campaign starts or scheduled time arrives
2. Detailed query generates `campaign_recipients` table rows
3. Each recipient includes: name, email/phone, pet info
4. Captured at generation time for audit trail

### Phase 4: Sending & Queuing
1. For each recipient:
   - Render variables using TemplateRendererService
   - Create `whatsapp_outbox` or `email_outbox` entry
   - Create `message_log` entry with campaign reference
   - Update `campaign_recipients` status

### Phase 5: Delivery & Metrics
1. Worker processes queued messages
2. Updates delivery status in `campaign_recipients`
3. Receives webhook callbacks (for WhatsApp)
4. Aggregates metrics in `campaigns` table

---

## 🏗️ Service Architecture

```
campaigns/
├── services/
│   ├── campaign.service.ts              (CRUD operations)
│   ├── campaign-template.service.ts     (Template management)
│   ├── campaign-filter.service.ts       (Audience calculation)
│   ├── campaign-execution.service.ts    (Execution orchestration)
│   └── template-renderer.service.ts     (Variable interpolation - SHARED)
├── repositories/
│   ├── campaign.repository.ts
│   ├── campaign-template.repository.ts
│   ├── campaign-recipient.repository.ts
│   └── email-outbox.repository.ts
├── controllers/
│   ├── campaign.controller.ts
│   └── campaign-template.controller.ts
├── dtos/
│   ├── create-campaign.dto.ts
│   ├── create-campaign-template.dto.ts
│   └── campaign-filter.dto.ts
└── campaigns.module.ts
```

---

## 🔒 Security Considerations

1. **Tenant Isolation**: All queries filtered by `clinic_id`
2. **User Authorization**: Create/edit campaigns require clinic admin role
3. **Contact Validation**: Only send to clients with opt-in
4. **Rate Limiting**: Maximum campaigns per clinic per day
5. **Audit Logging**: All campaign actions tracked in `audit_logs`
6. **PII Protection**: Contact info encrypted in transit
7. **Unsubscribe**: Links tracked to prevent spam

---

## 📊 Indexing Strategy

### Query Performance

**Top Queries**:
1. Get campaigns by clinic, with metrics aggregation
2. Get campaign recipients by status (for processing)
3. Find sent/failed recipients for reporting
4. Calculate audience size (preview before send)

**Indexes Created**:
```sql
-- Campaign queries
IDX_campaigns_clinic_id
IDX_campaigns_status
IDX_campaigns_cli

nic_created_at

-- Recipient queries
IDX_campaign_recipients_campaign_id
IDX_campaign_recipients_status  
IDX_campaign_recipients_campaign_status

-- Email outbox queries
IDX_email_outbox_clinic_status
IDX_email_outbox_campaign_recipient

-- Template queries
IDX_campaign_templates_clinic_id
```

---

## 🌍 UTC Handling

All timestamps stored in UTC with `TIMESTAMP WITH TIME ZONE`:

- Database: Always UTC
- API responses: ISO 8601 format (includes timezone)
- Frontend: Converts UTC → clinic local timezone for display
- Scheduling: User provides clinic-local time via frontend
- Worker/cron: Processes UTC timestamps directly

**Example**:
```
Database: 2026-03-09T14:30:00+00:00 (UTC)
Frontend: 2026-03-09T08:30:00-06:00 (Mexico City)
API: 2026-03-09T14:30:00Z
```

---

## 📈 Future Enhancements

1. **A/B Testing**: Multiple template variations per campaign
2. **Drip Campaigns**: Multi-message sequences over time
3. **Dynamic Recipients**: Real-time audience queries (vs. snapshot)
4. **Template Library**: Pre-made industry templates
5. **Advanced Analytics**: Click rates, conversion tracking
6. **Integrations**: Zapier, make.com webhooks
7. **Campaign Calendar**: Visual planning interface
8. **Compliance**: GDPR/LGPD consent tracking

---

## 📞 Implementation Checklist

- [ ] Create database migrations
- [ ] Create TypeORM entities
- [ ] Create repositories
- [ ] Implement CampaignService
- [ ] Implement CampaignTemplateService
- [ ] Implement CampaignFilterService
- [ ] Implement TemplateRendererService (shared)
- [ ] Implement CampaignExecutionService
- [ ] Create API controllers
- [ ] Create campaign list component
- [ ] Create campaign builder (multi-step)
- [ ] Create campaign template manager
- [ ] Create campaign detail component
- [ ] Add menu items to sidebar
- [ ] Test filtering logic
- [ ] Test variable rendering
- [ ] Test delivery integration (WhatsApp + Email)
- [ ] Performance testing (large campaigns)
- [ ] Security audit
- [ ] Documentation
