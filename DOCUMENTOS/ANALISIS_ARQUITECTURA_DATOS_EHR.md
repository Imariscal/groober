# 📋 Análisis Completo: Arquitectura de Datos EHR en VibraLive

**Análisis realizado:** 25/03/2026

## 📊 Resumen Ejecutivo

Se ha analizado la arquitectura de datos para las 5 entidades médicas principales en VibraLive. La conclusión es que **NO hay inconsistencia**: vaccinations y allergies intencional no tienen `medicalVisitId` porque están diseñadas como registros permanentes a nivel de mascota, mientras que prescriptions, diagnostic_orders y diagnoses están ligadas a visitas específicas.

---

## 1️⃣ ESQUEMA DE CAMPOS POR TABLA

### 1.1 MEDICAL_VISITS (Tabla Principal)

**Archivo:** [`vibralive-backend/src/database/entities/medical-visit.entity.ts`](vibralive-backend/src/database/entities/medical-visit.entity.ts)

```typescript
@Entity('medical_visits')
export class MedicalVisit {
  // === PRIMARY & FOREIGN KEYS ===
  id: uuid (PK)
  clinicId: uuid (FK → Clinic)
  appointmentId: uuid (FK → Appointment)
  petId: uuid (FK → Pet) ← NEXO CON MASCOTA
  veterinarianId: uuid (FK → User)
  
  // === VISIT INFO ===
  visitDate: timestamp with time zone
  visitType: 'CHECKUP' | 'VACCINATION' | 'SURGERY' | 'CONSULTATION' | 'FOLLOWUP' | 'EMERGENCY'
  reasonForVisit: text
  chiefComplaint: text
  
  // === VITAL SIGNS (EXAM) ===
  weight: numeric(5,2) [kg]
  temperature: numeric(5,2) [°C]
  heartRate: integer [bpm]
  respiratoryRate: integer [rpm]
  bloodPressure: varchar(20) [ej: "120/80"]
  bodyConditionScore: integer [1-9 scale]
  coatCondition: text
  generalNotes: text
  
  // === DIAGNOSIS & TREATMENT ===
  preliminaryDiagnosis: text
  finalDiagnosis: text
  treatmentPlan: text
  prognosis: text
  
  // === WORKFLOW ===
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'SIGNED'
  signedAt: timestamp (nullable)
  signedByVeterinarianId: uuid (nullable)
  
  // === FOLLOW-UP ===
  followUpRequired: boolean
  followUpDate: timestamp (nullable)
  followUpAppointmentId: uuid (nullable)
  visitNotes: text
  
  // === AUDIT ===
  createdBy: uuid (FK → User)
  modifiedBy: uuid (FK → User)
  createdAt: timestamp
  updatedAt: timestamp
}

// === INDEXED COLUMNS ===
@Index(['clinicId', 'petId', 'visitDate'])
@Index(['clinicId', 'appointmentId'])
@Index(['clinicId', 'status'])
@Index(['clinicId', 'veterinarianId'])
```

**Relaciones:**
```
MedicalVisit → Clinic (N:1)
MedicalVisit → Pet (N:1)
MedicalVisit → User (N:1) [veterinarian]
MedicalVisit → Appointment (N:1)
MedicalVisit ← Prescription (1:N) cascade delete
MedicalVisit ← DiagnosticOrder (1:N) cascade delete
MedicalVisit ← MedicalVisitDiagnosis (1:N) cascade delete
MedicalVisit ← MedicalProcedure (1:N) cascade delete
MedicalVisit ← FollowUpNote (1:N) cascade delete
MedicalVisit ← MedicalAttachment (1:N) cascade delete
```

---

### 1.2 PRESCRIPTIONS (Recetas Ligadas a Visita)

**Archivo:** [`vibralive-backend/src/database/entities/prescription.entity.ts`](vibralive-backend/src/database/entities/prescription.entity.ts)

```typescript
@Entity('prescriptions')
export class Prescription {
  // === PRIMARY & FOREIGN KEYS ===
  id: uuid (PK)
  clinicId: uuid (FK → Clinic)
  medicalVisitId: uuid (FK → MedicalVisit) ← ⭐ KEY RELATIONSHIP
  petId: uuid (FK → Pet)
  prescribedByVeterinarianId: uuid (FK → User)
  
  // === MEDICATION INFO ===
  medicationId: varchar(100) (nullable) [Catalog reference]
  medicationName: varchar(200) ← REQUIRED
  dosage: varchar(50) [ej: "250mg"]
  dosageUnit: varchar(20) [mg, ml, units, etc]
  frequency: varchar(100) [ONCE_DAILY, TWICE_DAILY, etc]
  route: 'ORAL' | 'INJECTION' | 'TOPICAL' | 'INHALED'
  
  // === PRESCRIPTION CONTROL ===
  durationDays: integer [days]
  quantity: integer [total pills/doses]
  instructions: text (nullable)
  refillsAllowed: integer [default: 0]
  
  // === DATES ===
  prescribedDate: timestamp with time zone
  startDate: date
  endDate: date
  
  // === WORKFLOW ===
  status: 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED' | 'EXPIRED'
  
  // === AUDIT ===
  createdAt: timestamp
  updatedAt: timestamp
}

// === INDEXED COLUMNS ===
@Index(['clinicId', 'petId', 'status'])
@Index(['clinicId', 'medicalVisitId']) ← ÍNDICE PRINCIPAL
```

**DTO para Creación:**
```typescript
export interface CreatePrescriptionDto {
  medicalVisitId: string;     ← PARÁMETRO REQUIRED
  petId: string;
  medicationName: string;
  medicationId?: string;
  dosage: string;
  dosageUnit: string;
  frequency: string;
  durationDays: number;
  quantity: number;
  route: AdministrationRoute;
  instructions?: string;
  refillsAllowed?: number;
  startDate: string;          // YYYY-MM-DD
  endDate: string;            // YYYY-MM-DD
}
```

**Relaciones:**
```
Prescription → Clinic (N:1)
Prescription → Pet (N:1)
Prescription → MedicalVisit (N:1) [cascade delete]
Prescription → User (N:1) [prescribedByVeterinarian]
```

---

### 1.3 VACCINATIONS (Registro Global de Vacunas)

**Archivo:** [`vibralive-backend/src/database/entities/vaccination.entity.ts`](vibralive-backend/src/database/entities/vaccination.entity.ts)

```typescript
@Entity('vaccinations')
export class Vaccination {
  // === PRIMARY & FOREIGN KEYS ===
  id: uuid (PK)
  clinicId: uuid (FK → Clinic)
  petId: uuid (FK → Pet) ← NEXO DIRECTO A PET (NO a MedicalVisit)
  vaccineId: uuid (FK → Vaccine)
  veterinarianId: uuid (FK → User)
  
  // ⚠️ NOTE: NO medicalVisitId - DISEÑO INTENCIONAL
  
  // === VACCINE INFO ===
  vaccineName: varchar(100) ← REQUIRED
  vaccineBatch: varchar(100) (nullable)
  manufacturer: varchar(50) (nullable)
  lotNumber: varchar(100) (nullable)
  
  // === ADMINISTRATION ===
  administeredDate: timestamp with time zone ← REQUIRED
  expirationDate: timestamp with time zone (nullable)
  nextDueDate: date (nullable)
  
  // === REACTIONS & NOTES ===
  adverseReactions: text (nullable)
  notes: text (nullable)
  
  // === WORKFLOW ===
  status: 'ADMINISTERED' | 'OVERDUE' | 'PENDING' | 'OMITTED'
  
  // === AUDIT ===
  createdAt: timestamp
  updatedAt: timestamp
}

// === INDEXED COLUMNS ===
@Index(['clinicId', 'petId', 'administeredDate'])
@Index(['clinicId', 'petId', 'nextDueDate']) ← Para búsqueda de próximas dosis
```

**DTO para Creación:**
```typescript
export interface CreateVaccinationDto {
  petId: string;                      ← SOLO petId, NO medicalVisitId
  vaccineId: string;
  vaccineBatch?: string;
  manufacturer?: string;
  lotNumber?: string;
  administeredDate: string;           // ISO 8601
  expirationDate?: string;            // YYYY-MM-DD
  adverseReactions?: string;
  notes?: string;
}
```

**Relaciones:**
```
Vaccination → Clinic (N:1)
Vaccination → Pet (N:1)
Vaccination → Vaccine (N:1) [ForeignKey a catálogo de vacunas]
Vaccination → User (N:1) [veterinarian]

⚠️ NO TIENE: Vaccination → MedicalVisit
```

---

### 1.4 MEDICATION_ALLERGIES (Registro Global de Alergias)

**Archivo:** [`vibralive-backend/src/database/entities/medication-allergy.entity.ts`](vibralive-backend/src/database/entities/medication-allergy.entity.ts)

```typescript
@Entity('medication_allergies')
export class MedicationAllergy {
  // === PRIMARY & FOREIGN KEYS ===
  id: uuid (PK)
  clinicId: uuid (FK → Clinic)
  petId: uuid (FK → Pet) ← NEXO DIRECTO A PET (NO a MedicalVisit)
  documentedBy: uuid (FK → User)
  
  // ⚠️ NOTE: NO medicalVisitId - DISEÑO INTENCIONAL
  
  // === ALLERGY INFO ===
  medicationId: varchar(100) (nullable) [Catalog reference]
  medicationName: varchar(200) ← REQUIRED
  severity: 'MILD' | 'MODERATE' | 'SEVERE'
  
  // === REACTION DETAILS ===
  reaction: text ← REQUIRED
  notes: text (nullable)
  
  // === AUDIT ===
  documentedDate: timestamp with time zone
  createdAt: timestamp
  updatedAt: timestamp
}

// === INDEXED COLUMNS ===
@Index(['clinicId', 'petId']) ← Búsqueda por mascota
```

**DTO para Creación:**
```typescript
export interface CreateMedicationAllergyDto {
  petId: string;                   ← SOLO petId, NO medicalVisitId
  medicationName: string;
  medicationId?: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  reaction: string;
  notes?: string;
}
```

**Relaciones:**
```
MedicationAllergy → Clinic (N:1)
MedicationAllergy → Pet (N:1)
MedicationAllergy → User (N:1) [documentedBy]

⚠️ NO TIENE: MedicationAllergy → MedicalVisit
```

---

### 1.5 DIAGNOSTIC_ORDERS (Órdenes Ligadas a Visita)

**Archivo:** [`vibralive-backend/src/database/entities/diagnostic-order.entity.ts`](vibralive-backend/src/database/entities/diagnostic-order.entity.ts)

```typescript
@Entity('diagnostic_orders')
export class DiagnosticOrder {
  // === PRIMARY & FOREIGN KEYS ===
  id: uuid (PK)
  clinicId: uuid (FK → Clinic)
  medicalVisitId: uuid (FK → MedicalVisit) ← ⭐ KEY RELATIONSHIP
  petId: uuid (FK → Pet)
  orderedByVeterinarianId: uuid (FK → User)
  
  // === TEST INFO ===
  testType: 'BLOOD_TEST' | 'URINE_TEST' | 'FECAL_TEST' | 'XRAY' | 'ULTRASOUND' | 'ECG' | 'ENDOSCOPY'
  testName: varchar(100) ← REQUIRED [ej: "CBC Panel", "Chest X-Ray"]
  reason: text ← REQUIRED [Por qué se ordena la prueba]
  
  // === SAMPLING ===
  specimenCollectedDate: timestamp (nullable)
  
  // === WORKFLOW ===
  status: 'ORDERED' | 'SAMPLE_COLLECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  
  // === LAB INFO ===
  labName: varchar(100) (nullable) [Nombre del laboratorio]
  labReferenceId: varchar(100) (nullable) [ID en sistema del lab]
  
  // === DATES ===
  orderDate: timestamp
  dueDate: date [Fecha para recopilar muestras]
  
  // === AUDIT ===
  createdAt: timestamp
  updatedAt: timestamp
}

// === INDEXED COLUMNS ===
@Index(['clinicId', 'petId', 'status'])
@Index(['clinicId', 'medicalVisitId']) ← ÍNDICE PRINCIPAL
```

**DTO para Creación:**
```typescript
export interface CreateDiagnosticOrderDto {
  // medicalVisitId viene como parámetro de ruta: POST /medical-visits/:medicalVisitId/diagnostic-orders
  petId: string;
  testType: TestType;
  testName: string;     // 1-100 caracteres
  reason: string;       // 1-500 caracteres
  dueDate: string;      // YYYY-MM-DD
  testCode?: string;
  description?: string;
  priority?: 'ROUTINE' | 'URGENT';
}
```

**Relaciones:**
```
DiagnosticOrder → Clinic (N:1)
DiagnosticOrder → Pet (N:1)
DiagnosticOrder → MedicalVisit (N:1) [cascade delete]
DiagnosticOrder → User (N:1) [orderedByVeterinarian]
DiagnosticOrder ← DiagnosticTestResult (1:N) [cascade delete]
```

---

### 1.6 MEDICAL_VISIT_DIAGNOSIS (Diagnósticos Ligados a Visita)

**Archivo:** [`vibralive-backend/src/database/entities/medical-visit-diagnosis.entity.ts`](vibralive-backend/src/database/entities/medical-visit-diagnosis.entity.ts)

```typescript
@Entity('medical_visit_diagnoses')
export class MedicalVisitDiagnosis {
  // === PRIMARY & FOREIGN KEYS ===
  id: uuid (PK)
  medicalVisitId: uuid (FK → MedicalVisit) ← ⭐ KEY RELATIONSHIP
  
  // ⚠️ NOTE: Solo MedicalVisit, NO petId directo
  
  // === DIAGNOSIS INFO ===
  diagnosisCode: varchar(50) (nullable) [ICD, SNOMED, etc]
  diagnosisName: varchar(200) ← REQUIRED
  severity: 'MILD' | 'MODERATE' | 'SEVERE' [default: MODERATE]
  
  // === WORKFLOW ===
  status: 'PRELIMINARY' | 'CONFIRMED' | 'RULED_OUT' [default: PRELIMINARY]
  
  // === NOTES ===
  notes: text (nullable)
  
  // === AUDIT ===
  createdAt: timestamp
  updatedAt: timestamp
}

// === INDEXED COLUMNS ===
// Índice implícito en FK
```

**Relaciones:**
```
MedicalVisitDiagnosis → MedicalVisit (N:1) [cascade delete]
```

---

## 2️⃣ ANÁLISIS COMPARATIVO: CAMPOS POR ENTIDAD

| Aspecto | Prescription | Vaccination | MedicAllergy | DiagOrder | DiagDiagnosis |
|---------|--------------|-------------|--------------|-----------|---------------|
| **Tabla BD** | `prescriptions` | `vaccinations` | `medication_allergies` | `diagnostic_orders` | `medical_visit_diagnoses` |
| **Tiene medicalVisitId** | ✅ **SÍ** | ❌ **NO** | ❌ **NO** | ✅ **SÍ** | ✅ **SÍ** |
| **Tiene petId** | ✅ SÍ | ✅ SÍ | ✅ SÍ | ✅ SÍ | ❌ NO (via MV) |
| **Scope** | Acción clínica de visita | Registro permanente Pet | Registro permanente Pet | Orden solicitada en visita | Diagnóstico de visita |
| **Cascade Delete** | En MV | No | No | En MV | En MV |
| **Endpoint** | `/medical-visits/:mvId/prescriptions` | `/medical-visits/prescriptions` | `/medical-visits/allergies` | `/medical-visits/:mvId/diagnostic-orders` | Agregado en MV detail |

---

## 3️⃣ ENDPOINTS DEL BACKEND

**Archivo Controller:** [`vibralive-backend/src/modules/medical-visits/medical-visits.controller.ts`](vibralive-backend/src/modules/medical-visits/medical-visits.controller.ts)

### 3.1 PRESCRIPTIONS ENDPOINTS

```typescript
// ========== PRESCRIPTIONS ==========

/**
 * POST /medical-visits/:medicalVisitId/prescriptions
 * Crear prescripción (ligada a visita específica)
 */
@Post(':medicalVisitId/prescriptions')
@HttpCode(201)
@RequirePermission('ehr:prescriptions:create')
async createPrescription(
  @CurrentClinicId() clinicId: string,
  @CurrentUser() user: any,
  @Param('medicalVisitId') medicalVisitId: string,
  @Body() dto: CreatePrescriptionDto,
)

/**
 * GET /medical-visits/:medicalVisitId/prescriptions
 * Obtener prescripciones de una visita
 */
@Get(':medicalVisitId/prescriptions')
@RequirePermission('ehr:prescriptions:read')
async getPrescriptionsForVisit(
  @CurrentClinicId() clinicId: string,
  @Param('medicalVisitId') medicalVisitId: string,
)

/**
 * PUT /medical-visits/prescriptions/:prescriptionId
 * Actualizar prescripción
 */
@Put('prescriptions/:prescriptionId')
@RequirePermission('ehr:prescriptions:update')
async updatePrescription(
  @CurrentClinicId() clinicId: string,
  @Param('prescriptionId') prescriptionId: string,
  @Body() dto: Partial<CreatePrescriptionDto>,
)

/**
 * DELETE /medical-visits/prescriptions/:prescriptionId
 * Eliminar prescripción
 */
@Delete('prescriptions/:prescriptionId')
@RequirePermission('ehr:prescriptions:update')
async deletePrescription(
  @CurrentClinicId() clinicId: string,
  @Param('prescriptionId') prescriptionId: string,
)
```

### 3.2 VACCINATIONS ENDPOINTS

```typescript
// ========== VACCINATIONS ==========

/**
 * POST /medical-visits/vaccinations
 * Registrar vacunación (NO requiere medicalVisitId)
 */
@Post('vaccinations')
@HttpCode(201)
@RequirePermission('ehr:vaccinations:create')
async recordVaccination(
  @CurrentClinicId() clinicId: string,
  @CurrentUser() user: any,
  @Body() dto: CreateVaccinationDto,  // Solo petId + vaccine info
)

/**
 * GET /medical-visits/pet/:petId/vaccinations
 * Obtener cronograma de vacunaciones de mascota
 */
@Get('pet/:petId/vaccinations')
@RequirePermission('ehr:vaccinations:read')
async getVaccinationSchedule(
  @CurrentClinicId() clinicId: string,
  @Param('petId') petId: string,
)

/**
 * GET /medical-visits/pet/:petId/vaccinations/overdue
 * Obtener vacunaciones vencidas
 */
@Get('pet/:petId/vaccinations/overdue')
@RequirePermission('ehr:vaccinations:read')
async getOverdueVaccinations(
  @CurrentClinicId() clinicId: string,
  @Param('petId') petId: string,
)

/**
 * PUT /medical-visits/vaccinations/:vaccinationId
 * Actualizar vacunación
 */
@Put('vaccinations/:vaccinationId')
@RequirePermission('ehr:vaccinations:update')
async updateVaccination(
  @CurrentClinicId() clinicId: string,
  @Param('vaccinationId') vaccinationId: string,
  @Body() dto: Partial<CreateVaccinationDto>,
)

/**
 * DELETE /medical-visits/vaccinations/:vaccinationId
 * Eliminar vacunación
 */
@Delete('vaccinations/:vaccinationId')
@RequirePermission('ehr:vaccinations:update')
async deleteVaccination(
  @CurrentClinicId() clinicId: string,
  @Param('vaccinationId') vaccinationId: string,
)
```

### 3.3 ALLERGIES ENDPOINTS

```typescript
// ========== MEDICATION ALLERGIES ==========

/**
 * POST /medical-visits/allergies
 * Registrar alergia a medicamento (NO requiere medicalVisitId)
 */
@Post('allergies')
@HttpCode(201)
@RequirePermission('ehr:allergies:create')
async recordAllergy(
  @CurrentClinicId() clinicId: string,
  @CurrentUser() user: any,
  @Body() dto: CreateMedicationAllergyDto,  // Solo petId + allergy info
)

/**
 * GET /medical-visits/pet/:petId/allergies
 * Obtener alergias de mascota
 */
@Get('pet/:petId/allergies')
@RequirePermission('ehr:allergies:read')
async getAllergies(
  @CurrentClinicId() clinicId: string,
  @Param('petId') petId: string,
)

/**
 * PUT /medical-visits/allergies/:allergyId
 * Actualizar alergia
 */
@Put('allergies/:allergyId')
@RequirePermission('ehr:allergies:update')
async updateAllergy(
  @CurrentClinicId() clinicId: string,
  @Param('allergyId') allergyId: string,
  @Body() dto: Partial<CreateMedicationAllergyDto>,
)

/**
 * DELETE /medical-visits/allergies/:allergyId
 * Eliminar alergia
 */
@Delete('allergies/:allergyId')
@RequirePermission('ehr:allergies:update')
async deleteAllergy(
  @CurrentClinicId() clinicId: string,
  @Param('allergyId') allergyId: string,
)
```

### 3.4 DIAGNOSTIC ORDERS ENDPOINTS

```typescript
// ========== DIAGNOSTIC ORDERS ==========

/**
 * POST /medical-visits/:medicalVisitId/diagnostic-orders
 * Crear orden de diagnóstico (ligada a visita específica)
 */
@Post(':medicalVisitId/diagnostic-orders')
@HttpCode(201)
@RequirePermission('ehr:diagnostics:create')  // Note: 'diagnostics' not 'diagnostic_orders'
async createDiagnosticOrder(
  @CurrentClinicId() clinicId: string,
  @CurrentUser() user: any,
  @Param('medicalVisitId') medicalVisitId: string,
  @Body() dto: CreateDiagnosticOrderDto,
)

/**
 * GET /medical-visits/:medicalVisitId/diagnostic-orders
 * Obtener órdenes de diagnóstico de una visita
 */
@Get(':medicalVisitId/diagnostic-orders')
@RequirePermission('ehr:diagnostics:read')
async getDiagnosticOrdersByVisit(
  @CurrentClinicId() clinicId: string,
  @Param('medicalVisitId') medicalVisitId: string,
)

/**
 * PUT /medical-visits/diagnostic-orders/:orderId
 * Actualizar orden de diagnóstico
 */
@Put('diagnostic-orders/:orderId')
@RequirePermission('ehr:diagnostic_orders:update')
async updateDiagnosticOrder(
  @CurrentClinicId() clinicId: string,
  @Param('orderId') orderId: string,
  @Body() dto: Partial<CreateDiagnosticOrderDto>,
)

/**
 * DELETE /medical-visits/diagnostic-orders/:orderId
 * Eliminar orden de diagnóstico
 */
@Delete('diagnostic-orders/:orderId')
@RequirePermission('ehr:diagnostic_orders:update')
async deleteDiagnosticOrder(
  @CurrentClinicId() clinicId: string,
  @Param('orderId') orderId: string,
)

/**
 * PATCH /medical-visits/diagnostic-orders/:orderId/sample-collected
 * Marcar muestra como recolectada
 */
@Patch('diagnostic-orders/:orderId/sample-collected')
@RequirePermission('ehr:diagnostic_orders:update')
async markSampleAsCollected(
  @CurrentClinicId() clinicId: string,
  @Param('orderId') orderId: string,
)

/**
 * PATCH /medical-visits/diagnostic-orders/:orderId/complete
 * Completar orden de diagnóstico
 */
@Patch('diagnostic-orders/:orderId/complete')
@RequirePermission('ehr:diagnostic_orders:update')
async completeOrder(
  @CurrentClinicId() clinicId: string,
  @Param('orderId') orderId: string,
)
```

### 3.5 MEDICAL HISTORY ENDPOINT

```typescript
// ========== MEDICAL HISTORY (AGGREGATE) ==========

/**
 * GET /medical-visits/pet/:petId/history
 * Obtener historial médico completo de una mascota
 * Retorna: visitas + prescripciones + vacunaciones + alergias + órdenes diagnósticas + procedimientos
 */
@Get('pet/:petId/history')
@RequirePermission('ehr:medical_history:read')
async getPetMedicalHistory(
  @CurrentClinicId() clinicId: string,
  @Param('petId') petId: string,
)
// Llamado en backend: medicalVisitsService.getMedicalHistory(clinicId, petId)
```

---

## 4️⃣ INTERFACES & DTOs TYPESCRIPT

**Archivo:** [`vibralive-frontend/src/types/ehr.ts`](vibralive-frontend/src/types/ehr.ts)

### 4.1 MedicalVisitDetail (Visita Específica)

```typescript
/**
 * Medical Visit Detail - Visita con todas sus entidades relacionadas
 * Se usa cuando se abre el detalle de una visita
 */
export interface MedicalVisitDetail extends MedicalVisit {
  // === ENTIDADES LIGADAS A ESTA VISITA ===
  diagnoses: MedicalVisitDiagnosis[];     // Diagnósticos de esta visita
  prescriptions: Prescription[];           // Prescripciones de esta visita
  diagnosticOrders: DiagnosticOrder[];     // Órdenes de esta visita
  procedures: MedicalProcedure[];          // Procedimientos de esta visita
  followUpNotes: FollowUpNote[];           // Notas de seguimiento
  attachments: MedicalAttachment[];        // Documentos/imágenes
  
  // ⚠️ NOTE: NO incluye vaccinations ni allergies
  // Esas están a nivel de mascota, no de visita
  
  // === INFO RELACIONADA ===
  veterinarian?: {
    id: string;
    name: string;
    email: string;
  };
  
  pet?: {
    id: string;
    name: string;
    species: string;
    breed?: string;
  };
}
```

### 4.2 PetMedicalHistory (Historial Completo)

```typescript
/**
 * Pet Medical History - Historial médico completo de una mascota
 * Se usa en la vista de historial médico por mascota
 * Agrupa TODAS las entidades relacionadas a la mascota
 */
export interface PetMedicalHistory {
  // === PET INFO ===
  pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    dateOfBirth?: Date;
  };
  
  // === TODAS LAS ENTIDADES ===
  medicalVisits: MedicalVisit[];          // Todas las visitas
  prescriptions: Prescription[];          // Todas las prescripciones (cada una tiene medicalVisitId)
  vaccinations: Vaccination[];            // Todas las vacunas (NO ligadas a visita)
  allergies: MedicationAllergy[];         // Todas las alergias (NO ligadas a visita)
  diagnosticOrders: DiagnosticOrder[];    // Todas las órdenes (cada una tiene medicalVisitId)
  procedures: MedicalProcedure[];         // Todos los procedimientos
  
  // === RESUMEN ===
  totalVisits: number;
  lastVisitDate?: Date;
  overdueVaccinations: Vaccination[];     // Vacunas vencidas
  activePrescriptions: Prescription[];    // Prescripciones activas
  knownAllergies: string[];               // Nombres de medicamentos alérgicos
}
```

### 4.3 Individual Entity Interfaces

```typescript
/**
 * Prescription - Receta de medicamento
 */
export interface Prescription {
  id: string;
  clinicId: string;
  medicalVisitId: string;           // ← FK REQUERIDA
  petId: string;
  prescribedByVeterinarianId: string;
  medicationName: string;
  medicationCode?: string;
  dosage: string;
  frequency: string;
  route: AdministrationRoute;
  durationDays: number;
  quantity?: number;
  instructions?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  expiresAt?: Date;
  updatedAt: Date;
}

/**
 * Vaccination - Registro de vacunación
 */
export interface Vaccination {
  id: string;
  clinicId: string;
  petId: string;                     // ← FK ÚNICA (NO medicalVisitId)
  veterinarianId: string;
  vaccineId: string;
  vaccine?: {
    id: string;
    name: string;
    boosterDays?: number;
    isSingleDose: boolean;
  };
  vaccineBatch?: string;
  manufacturer?: string;
  lotNumber?: string;
  administeredDate: Date | string;
  expirationDate?: Date | string;
  nextDueDate: Date | string;        // ← IMPORTANTE para scheduling
  adverseReactions?: string;
  notes?: string;
  isOverdue?: boolean;
  status: 'PENDING' | 'ADMINISTERED' | 'OVERDUE' | 'OMITTED';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MedicationAllergy - Alergia a medicamento
 */
export interface MedicationAllergy {
  id: string;
  petId: string;                     // ← FK ÚNICA (NO medicalVisitId)
  clinicId: string;
  documentedBy: string;
  medicationName: string;
  medicationId?: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  reaction: string;
  notes?: string;
  documentedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DiagnosticOrder - Orden de diagnóstico/laboratorio
 */
export interface DiagnosticOrder {
  id: string;
  clinicId: string;
  medicalVisitId: string;            // ← FK REQUERIDA
  petId: string;
  requestedByVeterinarianId: string;
  testType: string;
  testCode?: string;
  description?: string;
  priority: 'ROUTINE' | 'URGENT';
  sampleCollected: boolean;
  sampleCollectedDate?: Date;
  sampleCollectedBy?: string;
  status: DiagnosticOrderStatus;
  completedDate?: Date;
  resultsSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 5️⃣ FRONTEND COMPONENTS & USAGE

**Directorio:** [`vibralive-frontend/src/app/(protected)/clinic/medical-history/`](vibralive-frontend/src/app/(protected)/clinic/medical-history/)

### 5.1 Medical History Page Structure

```
medical-history/
├── page.tsx                          ← Vista principal de historial médico por mascota
│                                      Tabs: Medical Visits | Prescriptions | Vaccinations | Allergies | Diagnostic Orders
├── [appointmentId]/
│   └── page.tsx                      ← Vista de detalle de una visita médica específica
│                                      Tabs: General | Diagnoses | Prescriptions | Diagnostic Orders | Procedures | Notes | Attachments
├── vaccinations/
│   └── page.tsx                      ← Vista de CRUD de vacunaciones
└── prescriptions/
    └── page.tsx                      ← Vista de CRUD de prescripciones
```

### 5.2 Store Integration

**Archivo:** [`vibralive-frontend/src/store/ehr-store.ts`](vibralive-frontend/src/store/ehr-store.ts)

```typescript
interface EhrStore {
  // ========== PET MEDICAL DATA STATE ==========
  petMedicalHistory: PetMedicalHistory | null;
  petPrescriptions: Prescription[];
  petVaccinations: Vaccination[];
  petAllergies: MedicationAllergy[];
  petOverdueVaccinations: Vaccination[];
  isLoadingPetData: boolean;
  petDataError: string | null;

  // ========== ACTIONS ==========
  
  // Fetch la historia completa de una mascota (TODAS las entidades)
  fetchPetMedicalHistory: (petId: string) => Promise<void>;
  
  // Actions específicas para cada entidad
  createPrescription: (data: CreatePrescriptionDto) => Promise<Prescription>;
  updatePrescription: (id: string, data: Partial<CreatePrescriptionDto>) => Promise<Prescription>;
  deletePrescription: (id: string) => Promise<void>;
  
  recordVaccination: (data: CreateVaccinationDto) => Promise<Vaccination>;
  updateVaccination: (id: string, data: Partial<CreateVaccinationDto>) => Promise<Vaccination>;
  deleteVaccination: (id: string) => Promise<void>;
  
  recordAllergy: (data: CreateMedicationAllergyDto) => Promise<MedicationAllergy>;
  updateAllergy: (id: string, data: Partial<CreateMedicationAllergyDto>) => Promise<MedicationAllergy>;
  deleteAllergy: (id: string) => Promise<void>;
  
  createDiagnosticOrder: (visitId: string, data: CreateDiagnosticOrderDto) => Promise<DiagnosticOrder>;
  updateDiagnosticOrder: (id: string, data: Partial<CreateDiagnosticOrderDto>) => Promise<DiagnosticOrder>;
  deleteDiagnosticOrder: (id: string) => Promise<void>;
}
```

### 5.3 API Integration

**Archivo:** [`vibralive-frontend/src/api/ehr-api.ts`](vibralive-frontend/src/api/ehr-api.ts)

```typescript
// Fetching complete medical history
export const getPetMedicalHistory = async (
  petId: string,
): Promise<PetMedicalHistory> => {
  const url = `${MEDICAL_VISITS_API}/pet/${petId}/history`;
  const medicalHistory = await apiClient.get<PetMedicalHistory>(url);
  return medicalHistory.data;
};

// Prescription APIs
export const createPrescription = async (data: CreatePrescriptionDto) => {
  const url = `${PRESCRIPTIONS_API}`;
  return await apiClient.post(url, data);
};

// Vaccination APIs
export const recordVaccination = async (data: RecordVaccinationDto) => {
  const url = `${VACCINATIONS_API}`;
  return await apiClient.post(url, data);
};

// Allergy APIs
export const recordAllergy = async (data: RecordAllergyDto) => {
  const url = `${ALLERGIES_API}`;
  return await apiClient.post(url, data);
};

// Diagnostic Order APIs
export const createDiagnosticOrder = async (data: CreateDiagnosticOrderDto) => {
  const url = `${DIAGNOSTICS_API}`;
  return await apiClient.post(url, data);
};
```

---

## 6️⃣ CONCLUSIÓN: ¿POR QUÉ ESTA ARQUITECTURA?

### ✅ Vaccinations y Allergies SIN medicalVisitId: INTENCIONAL

**Razón 1: Datos de Mascota vs. Datos de Visita**
```
Datos de MASCOTA (nivel Pet):
- Vacunaciones: son historiales de la mascota, no de una visita específica
  → Una mascota puede tener N vacunaciones en N visitas diferentes
  → Se necesita verlas TODAS para saber si está al día
  
- Alergias: son propiedades permanentes de la mascota
  → Se documentan una vez y afectan TODAS las futuras prescripciones
  → No están "asociadas" a una visita específica

Datos de VISITA (nivel MedicalVisit):
- Prescripciones: se escriben DURANTE una visita específica
  → Son acciones clínicas de esa consulta
  → Están asociadas a diagnósticos y plan de tratamiento de esa visita
  
- Órdenes diagnósticas: se solicitan DURANTE una visita
  → Son investigaciones ordenadas en esa consulta
  → Están ligadas al tratamiento de esa visita
  
- Diagnósticos: se confirman DURANTE una visita
  → Son hallazgos clínicos de esa consulta
```

**Razón 2: Cascade Delete**
```
Si una visita se elimina (DRAFT → descartar):
- Prescripciones de esa visita → se eliminan (cascade)
- Órdenes diagnósticas → se eliminan (cascade)
- Diagnósticos → se eliminan (cascade)

Si se elimina una vacunación o alergia:
- La mascota sigue teniendo el registro en su historial
- No está ligada a una visita, así que no se elimina en cascade
```

**Razón 3: Búsquedas y Reporting**
```
Vacunaciones:
- "¿Qué vacunas tiene esta mascota?" → búsqueda por petId
- "¿Cuáles están vencidas?" → búsqueda por nextDueDate
- "¿Necesita próxima dosis?" → búsqueda por nextDueDate < hoy

Alergias:
- "¿Qué medicamentos NO puedo dar a esta mascota?" → búsqueda por petId
- "Validar antes de prescribir" → búsqueda por petId + medicationName

Prescripciones:
- "¿Qué prescribí en esta visita?" → búsqueda por medicalVisitId
- "¿Cuáles están activas?" → búsqueda por petId + status = ACTIVE

Órdenes diagnósticas:
- "¿Qué pruebas ordené en esta visita?" → búsqueda por medicalVisitId
- "¿Cuál es el estado?" → búsqueda por medicalVisitId + status
```

### ✅ Resumen de Intención Arquitectónica

| Concepto | Vaccination | Allergy | Prescription | DiagnosticOrder |
|----------|-------------|---------|--------------|-----------------|
| **Naturaleza** | Historial permanente | Información permanente | Acción clínica | Requisición clínica |
| **Scope** | Pet | Pet | Visit | Visit |
| **Ciclo de vida** | Largo (años) | Largo (vida del pet) | Corto (semanas/meses) | Corto (días/semanas) |
| **Búsqueda principal** | Por mascota | Por mascota | Por visita | Por visita |
| **Impacto de eliminar** | Pérdida de historial | Pérdida de info crítica | Reversión de acción | Reversión de acción |
| **Validación** | Al prescribir | Al prescribir | En el contexto de visita | En el contexto de visita |

**NO es inconsistencia: es diseño deliberado.**

---

## 7️⃣ ARCHIVOS CLAVE RESUMEN

### Backend - Entidades
```
vibralive-backend/src/database/entities/
├── medical-visit.entity.ts               ← 200+ líneas, tabla principal
├── prescription.entity.ts                ← tiene medicalVisitId
├── vaccination.entity.ts                 ← NO tiene medicalVisitId
├── medication-allergy.entity.ts          ← NO tiene medicalVisitId
├── diagnostic-order.entity.ts            ← tiene medicalVisitId
└── medical-visit-diagnosis.entity.ts     ← tiene medicalVisitId
```

### Backend - DTOs
```
vibralive-backend/src/modules/medical-visits/dtos/
├── create-prescription.dto.ts
├── create-vaccination.dto.ts
├── create-medication-allergy.dto.ts
├── create-diagnostic-order.dto.ts
└── add-diagnosis.dto.ts
```

### Backend - Service/Controller
```
vibralive-backend/src/modules/medical-visits/
├── medical-visits.controller.ts          ← endpoints
└── services/medical-visits.service.ts    ← getMedicalHistory, operaciones CRUD
```

### Frontend - Types
```
vibralive-frontend/src/types/
└── ehr.ts                                ← 600+ líneas, todas las interfaces

vibralive-frontend/src/api/
└── ehr-api.ts                            ← llamadas a endpoints

vibralive-frontend/src/store/
└── ehr-store.ts                          ← Zustand store con estado

vibralive-frontend/src/app/(protected)/clinic/
├── medical-history/page.tsx              ← Vista historial por mascota
├── medical-history/[appointmentId]/      ← Vista detalle de visita
├── medical-records/                      ← CRUD view
├── medical-records/vaccinations/page.tsx ← Tab de vacunaciones
└── medical-records/prescriptions/page.tsx← Tab de prescripciones
```

---

## 📋 DECISIONES ARQUITECTÓNICAS VALIDADAS ✅

1. ✅ **Vaccinations** ligadas a Pet, NOT Visit → Intencional
2. ✅ **Allergies** ligadas a Pet, NOT Visit → Intencional
3. ✅ **Prescriptions** ligadas a Visit → Intencional
4. ✅ **DiagnosticOrders** ligadas a Visit → Intencional
5. ✅ **Cascade delete** solo en Visit-related → Intencional
6. ✅ **PetMedicalHistory** agrupa TODO → Para vista general
7. ✅ **MedicalVisitDetail** agrupa solo Visit-related → Para vista específica

**No hay inconsistencias que corregir. La arquitectura es coherente y bien pensada.**

