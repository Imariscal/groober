# Evolved Client Profile - Rollout Strategy & Implementation Guide

## Executive Summary

This document describes the complete rollout strategy for the **Evolved Client Profile** system, which adds comprehensive client management capabilities including contact preferences, grooming service support, client segmentation via tags, and operational controls.

**Status**: Ready for Staged Rollout  
**Target Timeline**: Q1 2025  
**Release Version**: v2.1.0

---

## 1. Feature Overview

### Core Components Delivered

#### Backend (NestJS + TypeORM)
- ✅ Database migrations with client profile extensions (11 new columns)
- ✅ ClientTag entity for client segmentation
- ✅ Extended Client entity with preferences
- ✅ ClientTagsService for tag management (CRUD + search)
- ✅ REST endpoints for tags (`GET/POST/DELETE /clients/:id/tags`)
- ✅ Validation layer for business rules
- ✅ Multi-tenant isolation via clinic_id

#### Frontend (Next.js 14 + React + Zustand)
- ✅ Updated Client types with 11 new fields
- ✅ ClientTagsApi wrapper for HTTP calls
- ✅ useClientsStore (Zustand) with tag actions
- ✅ ClientDetailModal with tabbed interface
- ✅ ClientGeneralTab - Basic info, status
- ✅ ClientPreferencesTab - Contact preferences, tags, housing
- ✅ Frontend validators (Zod schemas)
- ✅ Feature flags system with environment control

### New Fields in Client Entity

```typescript
// Contact Information
whatsapp_number?: string;      // E.164 format
phone_secondary?: string;       // Secondary phone number
preferred_contact_method: 'WHATSAPP' | 'PHONE' | 'EMAIL' | 'SMS'; // Default: WHATSAPP

// Contact Time Windows
preferred_contact_time_start?: string; // HH:MM format
preferred_contact_time_end?: string;   // HH:MM format

// Housing & Access
housing_type: 'HOUSE' | 'APARTMENT' | 'COMMERCIAL' | 'OTHER';
access_notes?: string;                 // Door codes, intercom info, etc.
service_notes?: string;                // Special care instructions

// Operational Controls
do_not_contact: boolean;               // Flag for blocked clients
do_not_contact_reason?: string;        // Explanation for blocking
status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'BLACKLISTED'; // Lifecycle

// Tagging System
tags: string[];                        // Array of custom tags for segmentation
```

---

## 2. Rollout Phases

### Phase 1: Internal Testing (Week 1-2)
**Audience**: VibraLive Development Team + Alpha Customers  
**Duration**: 2 weeks  
**Scope**: Full feature testing in staging environment

**Milestones**:
- [ ] Database migration execution on test databases
- [ ] Backend API validation (all endpoints tested)
- [ ] Frontend component rendering verified
- [ ] Tag management workflow tested (create, edit, delete)
- [ ] Validation rules verified (time windows, phone formats)
- [ ] Multi-tenant isolation verified

**Enablement**:
```bash
# Enable all features for testing
NEXT_PUBLIC_ENABLE_CLIENT_PREFERENCES=true
NEXT_PUBLIC_ENABLE_CLIENT_TAGS=true
NEXT_PUBLIC_ENABLE_GROOMING_FEATURES=true
NEXT_PUBLIC_ENABLE_WHATSAPP_INTEGRATION=true
NEXT_PUBLIC_ROLLOUT_PHASE=alpha
```

### Phase 2: Beta Release (Week 3-6)
**Audience**: Early adopter customers (5-10 target clinics)  
**Duration**: 4 weeks  
**Scope**: Feature validation with real data in production

**Enablement**:
```bash
NEXT_PUBLIC_ENABLE_CLIENT_PREFERENCES=true
NEXT_PUBLIC_ENABLE_CLIENT_TAGS=true
NEXT_PUBLIC_ENABLE_GROOMING_FEATURES=true
NEXT_PUBLIC_ENABLE_WHATSAPP_INTEGRATION=false  # Gradual rollout
NEXT_PUBLIC_ROLLOUT_PHASE=beta
NEXT_PUBLIC_ROLLOUT_AUDIENCE=early_adopters
```

**Success Criteria**:
- Zero critical bugs reported
- User adoption rate > 60%
- Average time per client update < 3 minutes
- No data corruption incidents
- Feedback on UX improvements collected

### Phase 3: General Availability (Week 7+)
**Audience**: All VibraLive customers  
**Duration**: Ongoing  
**Scope**: Full production rollout with post-release support

**Enablement**:
```bash
NEXT_PUBLIC_ENABLE_CLIENT_PREFERENCES=true
NEXT_PUBLIC_ENABLE_CLIENT_TAGS=true
NEXT_PUBLIC_ENABLE_GROOMING_FEATURES=true
NEXT_PUBLIC_ENABLE_WHATSAPP_INTEGRATION=true
NEXT_PUBLIC_ROLLOUT_PHASE=ga
NEXT_PUBLIC_ROLLOUT_AUDIENCE=all
```

---

## 3. Database Migration Process

### Pre-Migration Checklist

```bash
# 1. Backup current database
pg_dump -U postgres vibralive_db > backup_$(date +%s).sql

# 2. Test migration on backup
createdb vibralive_db_test
psql vibralive_db_test < backup_$(date +%s).sql
npm run migrations:run:test

# 3. Verify data integrity
SELECT COUNT(*) FROM clients; -- Should match pre-migration
SELECT COUNT(*) FROM client_tags; -- Should be 0 (empty)
```

### Migration Execution

```bash
# Apply migration (backend automatically runs on startup if using TypeORM migrations)
npm run migrations:run

# OR manually via TypeORM CLI
npx typeorm migration:run -d src/database/typeormConfig.ts

# Verify migration success
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'clients' AND column_name LIKE '%whatsapp%';
```

### Rollback Plan (if needed)

```bash
# Revert migration
npx typeorm migration:revert -d src/database/typeormConfig.ts

# OR direct SQL
ALTER TABLE clients DROP COLUMN whatsapp_number, ...
DROP TABLE client_tags;
```

---

## 4. Deployment Checklist

### Backend Deployment

- [ ] All TypeScript files compile without errors
  ```bash
  npm run build
  ```

- [ ] Backend tests pass
  ```bash
  npm test -- clients.module.ts
  ```

- [ ] Seed script created (if needed for initial tags)
  ```bash
  npm run seed:client-tags
  ```

- [ ] GraphQL schema updated (if applicable)

- [ ] API documentation updated in Swagger/OpenAPI

- [ ] Environment variables documented in `.env.example`
  ```env
  # Add to .env.example
  DATABASE_MIGRATION_STRATEGY=step  # or batch
  ENABLE_CLIENT_TAGS=true
  ENABLE_CLIENT_PREFERENCES=true
  ```

### Frontend Deployment

- [ ] All TypeScript types compile
  ```bash
  npm run type-check
  ```

- [ ] No build warnings or errors
  ```bash
  npm run build
  ```

- [ ] Feature flags tested at each phase
  ```bash
  # Test flag detection
  import { logFeatureFlags } from '@/lib/features'
  logFeatureFlags(); // Verify console output
  ```

- [ ] Components render correctly
  ```bash
  npm run dev
  # Manual test: Open ClientDetailModal and verify tabs
  ```

- [ ] Environment variables configured
  ```env
  NEXT_PUBLIC_ENABLE_CLIENT_PREFERENCES=true
  NEXT_PUBLIC_ENABLE_CLIENT_TAGS=true
  NEXT_PUBLIC_ROLLOUT_PHASE=ga
  ```

---

## 5. Feature Flag Implementation

### How to Enable/Disable Features

All features are controlled via environment variables in `src/lib/features.ts`:

```typescript
export const featureFlags = {
  ENABLE_CLIENT_PREFERENCES: process.env.NEXT_PUBLIC_ENABLE_CLIENT_PREFERENCES === 'true',
  ENABLE_CLIENT_TAGS: process.env.NEXT_PUBLIC_ENABLE_CLIENT_TAGS === 'true',
  ENABLE_GROOMING_FEATURES: process.env.NEXT_PUBLIC_ENABLE_GROOMING_FEATURES === 'true',
  ENABLE_WHATSAPP_INTEGRATION: process.env.NEXT_PUBLIC_ENABLE_WHATSAPP_INTEGRATION === 'true',
};
```

### Using Feature Flags in Code

```typescript
import { isFeatureEnabled } from '@/lib/features';

export function MyComponent() {
  if (!isFeatureEnabled('ENABLE_CLIENT_PREFERENCES')) {
    return null; // Hide component if disabled
  }
  
  return <ClientPreferencesTab {...props} />;
}
```

### Debug Feature Flags

```typescript
import { logFeatureFlags } from '@/lib/features';

// In development mode, logs all feature flags to console
logFeatureFlags();
```

---

## 6. API Endpoint Reference

### New Endpoints Added

#### Get Client Tags
```
GET /api/clients/:clientId/tags
Response: string[] (array of tag strings)
```

#### Add Tag to Client
```
POST /api/clients/:clientId/tags
Body: { tag: string }
Response: { tag: string; createdAt: string }
```

#### Remove Tag from Client
```
DELETE /api/clients/:clientId/tags/:tag
Response: 204 No Content
```

### Modified Endpoints

#### Create Client (Updated)
```
POST /api/clients
Body: CreateClientPayload (includes new fields)
Response: ClientResponseDto (includes tags array)
```

#### Update Client (Updated)
```
PATCH /api/clients/:clientId
Body: Partial<CreateClientPayload>
Response: ClientResponseDto (includes tags array)
```

#### Get Client (Updated)
```
GET /api/clients/:clientId
Response: ClientResponseDto (includes tags array + all preferences)
```

#### List Clients (Updated)
```
GET /api/clients?page=1&limit=20
Response: { data: ClientResponseDto[]; total: number }
```

---

## 7. Known Limitations & Notes

### Phase 1-2: Intentional Limitations

✋ **WhatsApp Integration Deferred**
- Feature flag `ENABLE_WHATSAPP_INTEGRATION=false` by default
- Actual WhatsApp message sending deferred to Q2 2025
- UI prepared for future integration

✋ **Direct Grooming Feature Dependency**
- Client tags designed to support grooming segmentation
- Grooming service features themselves in separate epic
- Preferences support grooming workflows but don't require them

### Data Backward Compatibility

✅ **All new fields are optional (nullable)**
- Existing clients work without issues
- Migration adds defaults for system columns
- No existing data loss or modification

### Performance Considerations

✅ **Indexes Added**
- `client_tags` indexed on `clinic_id` and `client_id`
- Tag searches optimized with ILIKE queries
- No N+1 query problems (tags loaded in single query)

✅ **Query Optimization**
- Tags loaded only when needed (leftJoinAndSelect)
- Pagination preserved for large client lists
- Request/response payloads reasonable

---

## 8. Testing Strategy

### Backend Testing

```bash
# Unit tests for validators
npm test -- client.validator.ts

# Integration tests for endpoints
npm test -- clients.controller.ts

# Tag management tests
npm test -- client-tags.service.ts
```

### Frontend Testing

```bash
# Type checking
npm run type-check

# Component rendering
npm test -- ClientDetailModal.tsx
npm test -- ClientPreferencesTab.tsx

# Feature flag detection
npm test -- features.ts
```

### Manual Testing Workflow

1. **Create Client with Preferences**
   - Navigate to Clients page
   - Create new client with all optional fields filled
   - Verify data saves correctly

2. **Edit Client Preferences**
   - Open client detail modal
   - Switch to "Preferencias" tab
   - Modify contact time window
   - Verify validation (start < end)
   - Save and refresh to confirm persistence

3. **Tag Management**
   - In preferences tab, add tags (e.g., "VIP", "Masaje", "SPA")
   - Verify tags appear immediately
   - Remove tag and verify removal
   - Test tag autocomplete (if search endpoint added)

4. **Multi-Tenant Isolation**
   - Log in as clinic A
   - Add client with tags
   - Log in as clinic B
   - Verify clinic B cannot see clinic A's tags

5. **Validation Testing**
   - Try invalid phone format → Should show error
   - Try contact time end < start → Should show error
   - Try "do_not_contact" without reason → Should block save
   - Verify Spanish error messages display

---

## 9. Customer Communication Plan

### Email Template: Beta Release (Phase 2)

```
Subject: New Feature: Enhanced Client Management with Preferences & Tags

Hi [Clinic Name],

We're excited to announce the Evolved Client Profile system is now available in beta!

This powerful new feature lets you:
✅ Store contact preferences (WhatsApp, phone, email, SMS)
✅ Set preferred contact time windows (e.g., "9 AM - 5 PM only")
✅ Record housing & access information for grooming services
✅ Tag clients for segmentation & organization (VIP, Regular, etc.)
✅ Mark clients as "do not contact" with explanations
✅ Track client status (Active, Inactive, Archived, Blacklisted)

Getting Started:
1. Open any client profile
2. Click "Edit"
3. Switch to "Preferencias" tab to add preferences & tags
4. Click "Guardar" to save

Questions? Reply to this email or visit our documentation.

Best regards,
VibraLive Product Team
```

### In-App Tutorial

- Onboarding modal on first login (Phase 2)
- Video tutorial embedded in help section
- Contextual tooltips on new fields
- "Learn More" links to documentation

---

## 10. Success Metrics

### Technical Metrics

| Metric | Phase 1 | Phase 2 | Phase 3 |
|--------|---------|---------|---------|
| Migration Success Rate | 100% | 100% | 100% |
| API Uptime | > 99.5% | > 99.5% | > 99.9% |
| Error Rate (5xx) | < 0.5% | < 0.5% | < 0.1% |
| Query Performance (p95) | < 200ms | < 200ms | < 150ms |

### Business Metrics

| Metric | Target | Success Threshold |
|--------|--------|-------------------|
| Beta User Adoption | 80% of early adopters | > 60% |
| Feature Usage | Daily active tags | > 40% |
| Support Tickets | Per 1000 users | < 2 |
| Customer Satisfaction | CSAT score | > 4/5 |

---

## 11. Rollback Procedure

If critical issues occur:

### Phase 1-2 Rollback (Staging)
```bash
# 1. Stop backend
docker-compose down

# 2. Revert migration
npx typeorm migration:revert

# 3. Deploy previous version
git checkout v2.0.5
npm run build
docker-compose up
```

### Phase 3 Rollback (Production)
```bash
# Disable features first (safer)
NEXT_PUBLIC_ENABLE_CLIENT_PREFERENCES=false
NEXT_PUBLIC_ENABLE_CLIENT_TAGS=false

# Deploy old frontend
# (Clients still work, new fields ignored)

# Only if critical backend issues:
# Execute migration revert after backup
```

---

## 12. Post-Launch Support

### Monitoring

- Track API error logs for tag endpoints
- Monitor database query performance
- Set up alerts for migration-related issues
- Track feature flag adoption via telemetry

### Support Escalation

1. **Customer reports issue** → Support team reproduces
2. **Feature flag toggle** → Disable problematic feature
3. **Hotfix needed** → Create feature branch from previous stable tag
4. **Broader rollback** → Execute rollback procedure above

### Documentation Updates

- Update customer-facing docs after each phase
- Maintain API documentation in Swagger/OpenAPI
- Create FAQ based on support tickets
- Record tutorial videos for complex workflows

---

## 13. Contact & Escalation

- **Product Owner**: [Name] - [Email]
- **Tech Lead**: [Name] - [Email]
- **DevOps Lead**: [Name] - [Email]
- **Customer Success**: [Name] - [Email]

---

## Appendix A: Environment Variables Reference

```env
# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost/vibralive_db
DATABASE_MIGRATION_STRATEGY=step

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_ENABLE_CLIENT_PREFERENCES=true
NEXT_PUBLIC_ENABLE_CLIENT_TAGS=true
NEXT_PUBLIC_ENABLE_GROOMING_FEATURES=true
NEXT_PUBLIC_ENABLE_WHATSAPP_INTEGRATION=false
NEXT_PUBLIC_ROLLOUT_PHASE=beta
NEXT_PUBLIC_ROLLOUT_AUDIENCE=early_adopters
NEXT_PUBLIC_RELEASE_DATE=2025-01-15
```

---

## Appendix B: SQL Scripts for Verification

```sql
-- Check migration applied
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position LIMIT 20;

-- Check ClientTag table created
SELECT * FROM information_schema.tables 
WHERE table_name = 'client_tags';

-- Count tags by clinic
SELECT clinic_id, COUNT(*) as tag_count 
FROM client_tags 
GROUP BY clinic_id;

-- Find clients without preferences
SELECT COUNT(*) FROM clients 
WHERE whatsapp_number IS NULL 
  AND status IS NULL;
```

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Status**: Ready for Rollout
