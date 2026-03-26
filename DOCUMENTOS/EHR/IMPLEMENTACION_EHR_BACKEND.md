# Implementación Backend - Sistema EHR (Electronic Health Record)

## 1. Análisis de Permisos Requeridos

### Permisos Existentes (Del Sistema)
El sistema ya tiene permisos para "visitas clínicas":
- `visits:create` - Crear visitas clínicas
- `visits:read` - Ver visitas clínicas
- `visits:update` - Editar visitas clínicas
- `visits:update_status` - Cambiar estado de visita
- `visits:complete` - Completar visita
- `visits:cancel` - Cancelar visita

### Nuevos Permisos Requeridos para EHR

#### 1. Permisos por Módulo

**MEDICAL VISITS (visitas médicas detalladas)**
```
visits:create_medical_visit     - Crear visita médica completa (EHR)
visits:view_medical_history     - Ver historial médico del paciente
visits:add_diagnosis            - Agregar diagnóstico
visits:manage_prescriptions     - Gestionar recetas
visits:manage_exams             - Gestionar exámenes/estudios
visits:manage_treatments        - Gestionar planes de tratamiento
visits:sign_medical_record      - Firmar registro médico (vet)
visits:reschedule_followup      - Reprogramar cita de seguimiento
```

**VACCINATIONS (vacunaciones)**
```
vaccinations:create             - Crear registro de vacunación
vaccinations:read               - Ver vacunas
vaccinations:update             - Editar vacunas
vaccinations:delete             - Eliminar vacunas
```

**MEDICATIONS (medicamentos)**
```
medications:create              - Crear información de medicamentos
medications:read                - Ver medicamentos
medications:manage_allergies    - Gestionar alergias a medicamentos
```

**MEDICAL ATTACHMENTS (documentos médicos) - v2**
```
attachments:upload              - Cargar documentos médicos
attachments:view                - Ver documentos
attachments:delete              - Eliminar documentos
```

**DIAGNOSTIC ORDERS (órdenes de diagnóstico)**
```
diagnostic_orders:create        - Crear orden de diagnóstico
diagnostic_orders:read          - Ver órdenes
diagnostic_orders:update_status - Actualizar estado de orden
diagnostic_orders:view_results  - Ver resultados
```

### Matríz de Permisos por Rol

#### SuperAdmin
- Todos los permisos de EHR (acceso a todas las clínicas)

#### Owner (Propietario de Clínica)
- `visits:create_medical_visit`
- `visits:view_medical_history`
- `visits:add_diagnosis`
- `visits:manage_prescriptions`
- `visits:manage_exams`
- `visits:manage_treatments`
- `visits:sign_medical_record` (si es veterinario)
- `visits:reschedule_followup`
- `vaccinations:*`
- `medications:*`
- `diagnostic_orders:*`
- `attachments:*`

#### Staff (Rol General)
- `visits:read` (ver visitas asignadas)
- `vaccinations:read`
- `medications:read`
- `diagnostic_orders:read`
- `attachments:view`

#### Veterinarian (Rol Nuevo o Especialidad)
- `visits:create_medical_visit`
- `visits:view_medical_history`
- `visits:add_diagnosis`
- `visits:manage_prescriptions`
- `visits:manage_treatments`
- `visits:sign_medical_record` ✅ EXCLUSIVO
- `vaccinations:*`
- `medications:manage_allergies`
- `diagnostic_orders:*`

---

## 2. Estructura de Módulos a Crear

```
src/modules/
├── medical-visits/                    # Nuevo módulo principal
│   ├── medical-visits.module.ts
│   ├── medical-visits.controller.ts
│   ├── medical-visits.service.ts
│   ├── repositories/
│   │   ├── medical-visits.repository.ts
│   │   ├── vaccinations.repository.ts
│   │   ├── medications.repository.ts
│   │   ├── diagnostic-orders.repository.ts
│   │   └── medical-attachments.repository.ts
│   ├── services/
│   │   ├── medical-visit-details.service.ts
│   │   ├── prescription.service.ts
│   │   ├── vaccination.service.ts
│   │   ├── medication-allergy.service.ts
│   │   ├── diagnostic-order.service.ts
│   │   └── medical-signature.service.ts
│   └── dtos/
│       ├── create-medical-visit.dto.ts
│       ├── create-exam.dto.ts
│       ├── create-diagnosis.dto.ts
│       ├── create-prescription.dto.ts
│       ├── create-vaccination.dto.ts
│       ├── create-medication-allergy.dto.ts
│       ├── create-diagnostic-order.dto.ts
│       ├── sign-medical-record.dto.ts
│       └── index.ts
```

---

## 3. Entidades de Base de Datos

### 3.1 medical_visits (Visita Médica Principal)
```typescript
- id: UUID (PK)
- clinic_id: UUID (FK) - Multi-tenancy
- appointment_id: UUID (FK) - Link a appointment
- pet_id: UUID (FK)
- veterinarian_id: UUID (FK)
- visit_date: TIMESTAMP WITH TIME ZONE - UTC
- visit_type: ENUM ('CHECKUP', 'VACCINATION', 'SURGERY', 'CONSULTATION', 'FOLLOWUP', 'EMERGENCY')
- reason_for_visit: TEXT
- chief_complaint: TEXT

// Exam Fields
- weight: DECIMAL
- temperature: DECIMAL
- heart_rate: INTEGER
- respiratory_rate: INTEGER
- blood_pressure: VARCHAR (systolic/diastolic)
- body_condition_score: INTEGER (1-9)
- coat_condition: TEXT
- general_notes: TEXT

// Diagnosis & Treatment
- preliminary_diagnosis: TEXT
- final_diagnosis: TEXT
- treatment_plan: TEXT
- prognosis: TEXT

// Workflow
- status: ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'SIGNED')
- signed_at: TIMESTAMP WITH TIME ZONE (nullable)
- signed_by_veterinarian_id: UUID (FK, nullable)
- follow_up_required: BOOLEAN
- follow_up_date: TIMESTAMP WITH TIME ZONE (nullable)
- follow_up_appointment_id: UUID (FK, nullable)
- visit_notes: TEXT

// Audit
- created_by: UUID (FK)
- modified_by: UUID (FK)
- created_at: TIMESTAMP WITH TIME ZONE
- updated_at: TIMESTAMP WITH TIME ZONE

Indexes:
- (clinic_id, pet_id, visit_date)
- (clinic_id, appointment_id)
- (clinic_id, status)
- (clinic_id, veterinarian_id)
```

### 3.2 medical_visit_exams (Exámenes dentro de visita)
```typescript
- id: UUID (PK)
- medical_visit_id: UUID (FK)
- exam_type: VARCHAR ('PHYSICAL', 'BLOOD_WORK', 'URINALYSIS', 'XRAY', 'ULTRASOUND', 'ECG', 'ENDOSCOPY')
- exam_name: VARCHAR
- findings: TEXT
- is_normal: BOOLEAN
- performed_date: TIMESTAMP WITH TIME ZONE
- performed_by: UUID (FK, User)
- notes: TEXT
- attachments_count: INTEGER (referencia a medical_attachments)
- created_at, updated_at

Indexes:
- (medical_visit_id, exam_type)
```

### 3.3 medical_visit_diagnoses (Diagnósticos)
```typescript
- id: UUID (PK)
- medical_visit_id: UUID (FK)
- diagnosis_code: VARCHAR (ej: ICD-10 code)
- diagnosis_name: VARCHAR
- severity: ENUM ('MILD', 'MODERATE', 'SEVERE')
- status: ENUM ('PRELIMINARY', 'CONFIRMED', 'RULED_OUT')
- notes: TEXT
- created_at, updated_at
```

### 3.4 prescriptions (Recetas)
```typescript
- id: UUID (PK)
- clinic_id: UUID (FK)
- medical_visit_id: UUID (FK)
- pet_id: UUID (FK)
- prescribed_by_veterinarian_id: UUID (FK)
- medication_id: VARCHAR (drug identifier)
- medication_name: VARCHAR
- dosage: VARCHAR (ej: "500mg")
- dosage_unit: VARCHAR ('mg', 'ml', 'units')
- frequency: VARCHAR (ej: "2x daily", "Every 8 hours")
- duration_days: INTEGER
- quantity: INTEGER
- route: ENUM ('ORAL', 'INJECTION', 'TOPICAL', 'INHALED')
- instructions: TEXT
- refills_allowed: INTEGER
- prescribed_date: TIMESTAMP WITH TIME ZONE
- start_date: DATE (must be today or future)
- end_date: DATE
- status: ENUM ('ACTIVE', 'COMPLETED', 'DISCONTINUED', 'EXPIRED')
- created_at, updated_at

Indexes:
- (clinic_id, pet_id, status)
- (clinic_id, medical_visit_id)
```

### 3.5 vaccinations (Vacunaciones)
```typescript
- id: UUID (PK)
- clinic_id: UUID (FK)
- pet_id: UUID (FK)
- vaccine_type: VARCHAR (ej: 'RABIES', 'DHPP', 'FELINE_DISTEMPER')
- vaccine_name: VARCHAR
- vaccine_batch: VARCHAR
- administered_date: TIMESTAMP WITH TIME ZONE
- veterinarian_id: UUID (FK)
- next_due_date: DATE
- notes: TEXT
- created_at, updated_at

Indexes:
- (clinic_id, pet_id, administered_date)
- (clinic_id, pet_id, next_due_date)
```

### 3.6 medication_allergies (Alergias a Medicamentos)
```typescript
- id: UUID (PK)
- clinic_id: UUID (FK)
- pet_id: UUID (FK)
- medication_id: VARCHAR
- medication_name: VARCHAR
- severity: ENUM ('MILD', 'MODERATE', 'SEVERE')
- reaction: TEXT (ej: 'Rash, vomiting')
- documented_date: TIMESTAMP WITH TIME ZONE
- documented_by: UUID (FK)
- notes: TEXT
- created_at, updated_at

Indexes:
- (clinic_id, pet_id)
```

### 3.7 diagnostic_orders (Órdenes de Diagnóstico)
```typescript
- id: UUID (PK)
- clinic_id: UUID (FK)
- medical_visit_id: UUID (FK)
- pet_id: UUID (FK)
- ordered_by_veterinarian_id: UUID (FK)
- test_type: ENUM ('BLOOD_TEST', 'URINE_TEST', 'FECAL_TEST', 'XRAY', 'ULTRASOUND', 'ECG', 'ENDOSCOPY')
- test_name: VARCHAR
- reason: TEXT
- order_date: TIMESTAMP WITH TIME ZONE
- due_date: DATE
- specimen_collected_date: TIMESTAMP WITH TIME ZONE (nullable)
- status: ENUM ('ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
- lab_name: VARCHAR (nullable)
- lab_reference_id: VARCHAR (nullable)
- created_at, updated_at

Indexes:
- (clinic_id, pet_id, status)
- (clinic_id, medical_visit_id)
```

### 3.8 diagnostic_test_results (Resultados de Pruebas)
```typescript
- id: UUID (PK)
- diagnostic_order_id: UUID (FK)
- test_result_name: VARCHAR
- result_value: VARCHAR
- result_unit: VARCHAR
- reference_range_min: VARCHAR (nullable)
- reference_range_max: VARCHAR (nullable)
- is_normal: BOOLEAN
- notes: TEXT
- completed_date: TIMESTAMP WITH TIME ZONE
- created_at, updated_at
```

### 3.9 medical_procedures (Procedimientos Médicos)
```typescript
- id: UUID (PK)
- clinic_id: UUID (FK)
- medical_visit_id: UUID (FK)
- pet_id: UUID (FK)
- performed_by_veterinarian_id: UUID (FK)
- procedure_type: VARCHAR (ej: 'SURGERY', 'DENTAL_CLEANING', 'BIOPSY')
- procedure_name: VARCHAR
- procedure_date: TIMESTAMP WITH TIME ZONE
- duration_minutes: INTEGER
- anesthesia_type: VARCHAR (nullable)
- complications: TEXT (nullable)
- notes: TEXT
- created_at, updated_at
```

### 3.10 follow_up_notes (Notas de Seguimiento)
```typescript
- id: UUID (PK)
- clinic_id: UUID (FK)
- medical_visit_id: UUID (FK)
- pet_id: UUID (FK)
- note_date: TIMESTAMP WITH TIME ZONE
- written_by: UUID (FK)
- note_content: TEXT
- status_update: TEXT (ej: 'Improving', 'No Change', 'Worsening')
- created_at, updated_at

Indexes:
- (clinic_id, pet_id, note_date)
```

### 3.11 medical_attachments (Documentos Médicos) - v2
```typescript
- id: UUID (PK)
- clinic_id: UUID (FK)
- medical_visit_id: UUID (FK)
- pet_id: UUID (FK)
- document_type: ENUM ('XRAY', 'ULTRASOUND', 'LAB_REPORT', 'PATHOLOGY', 'CONSENT_FORM', 'OTHER')
- file_name: VARCHAR
- file_size: INTEGER
- file_type: VARCHAR (ej: 'image/png', 'application/pdf')
- storage_path: VARCHAR (S3, similar)
- uploaded_by: UUID (FK)
- upload_date: TIMESTAMP WITH TIME ZONE
- is_confidential: BOOLEAN
- created_at, updated_at

Indexes:
- (clinic_id, medical_visit_id)
- (clinic_id, pet_id)
```

---

## 4. DTOs (Data Transfer Objects)

### 4.1 CreateMedicalVisitDto
- appointmentId: string (FK a appointment)
- petId: string
- veterinarianId: string (optional para MEDICAL sin vet)
- visitType: 'CHECKUP' | 'VACCINATION' | ... (desde appointment)
- chiefComplaint: string
- weight: decimal
- temperature: decimal
- heartRate: integer
- respiratoryRate: integer
- bloodPressure: string
- bodyConditionScore: integer
- coatCondition: string
- generalNotes: string
- preliminaryDiagnosis: string
- treatmentPlan: string

### 4.2 AddDiagnosisDto
- medicalVisitId: string
- diagnosisCode: string (ICD-10)
- diagnosisName: string
- severity: 'MILD' | 'MODERATE' | 'SEVERE'
- notes: string

### 4.3 CreatePrescriptionDto
- medicalVisitId: string
- medicationName: string
- dosage: string
- dosageUnit: string
- frequency: string
- durationDays: integer
- quantity: integer
- route: 'ORAL' | 'INJECTION' | 'TOPICAL' | 'INHALED'
- instructions: string
- refillsAllowed: integer

### 4.4 CreateVaccinationDto
- petId: string
- vaccineName: string
- vaccineBatch: string
- administerDate: string (ISO 8601)
- nextDueDate: date
- notes: string

### 4.5 CreateMedicationAllergyDto
- petId: string
- medicationName: string
- severity: 'MILD' | 'MODERATE' | 'SEVERE'
- reaction: string
- notes: string

### 4.6 CreateDiagnosticOrderDto
- medicalVisitId: string
- petId: string
- testType: enum
- testName: string
- reason: string
- dueDate: date
- labName: string (optional)

### 4.7 SignMedicalRecordDto
- medicalVisitId: string
- signatureImage: string (base64 o URL)
- timestamp: ISO 8601

---

## 5. Validaciones de Negocio

1. **Multi-tenancy**: Todas las queries incluyen `clinic_id` filter
2. **UTC Dates**: Usar `timestamp with time zone` en BD, conversiones en Frontend
3. **Vet Signature**: Solo veterinarios pueden firmar con permiso `visits:sign_medical_record`
4. **Medication Allergies**: Validar antes de prescribir (warning en UI)
5. **Vaccination Schedule**: Validar next_due_date > today
6. **Diagnostic Orders**: Status flow: ORDERED → SAMPLE_COLLECTED → IN_PROGRESS → COMPLETED
7. **Follow-up Appointments**: Auto-crear si `follow_up_required = true`

---

## 6. Plan de Implementación

### FASE 1: Entidades + Migraciones (Hoy)
- [ ] Crear entities en TypeORM
- [ ] Crear migraciones de BD
- [ ] Verificar relaciones FK

### FASE 2: DTOs + Repositories (Hoy)
- [ ] Crear DTOs con validadores
- [ ] Crear repositories para todas las tablas
- [ ] Implementar queries multi-tenant

### FASE 3: Services (Hoy/Mañana)
- [ ] MedicalVisitsService (CRUD + validaciones)
- [ ] PrescriptionService
- [ ] VaccinationService
- [ ] MedicationAllergyService
- [ ] DiagnosticOrderService
- [ ] MedicalSignatureService

### FASE 4: Controllers (Mañana)
- [ ] MedicalVisitsController
- [ ] Endpoints para cada módulo
- [ ] Permission guards

### FASE 5: UI (Pronto)
- [ ] Medical Visit Form component
- [ ] Signature component
- [ ] Allergy warnings
- [ ] Medical history view

---

## 7. Consideraciones Especiales

### Multi-tenancy
- Las queries de `getByClinic()` deben filtrar por `clinic_id`
- FK relationships NO incluyen clinic_id (redundancia)
- Indexes en (clinic_id, otro_campo) para performance

### UTC & Timezone
- BD: `timestamp with time zone` (UTC)
- API: Recibe/envía ISO 8601 UTC
- Frontend: Convierte con `date-fns-tz` usando clinic timezone
- Métodos helper existentes del TimezoneService

### Permisos
- `@UseGuards(AuthGuard, TenantGuard, PermissionGuard)`
- `@RequirePermission('visits:xxx')`
- Validar rol + permission en cada endpoint crítico

### Performance
- Indices en (clinic_id, pet_id, date_range)
- Pagination en GET endpoints
- Eager loading de relationships donde sea needed

---

## Siguiente Paso
Empezar con FASE 1: Crear entities y migraciones.
