# 🗂️ Diagrama de Relaciones EHR - VibraLive

## 1. Modelo de Datos Relacional

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLINIC (Tenant)                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                  ▼
    ┌────────┐        ┌─────────┐
    │  PET   │        │   USER  │
    └───┬────┘        └────┬────┘
        │                  │
        │    ┌─────────────┼──────────────┐
        │    │             │              │
        ▼    ▼             ▼              ▼
    ┌────────────────────────────────────────┐
    │         MEDICAL_VISIT                  │
    │  (Visita médica - contexto temporal)   │
    │  • visitDate                           │
    │  • status: DRAFT→SIGNED                │
    │  • clinicId (index)                    │
    │  • petId (index)                       │
    │  • veterinarianId                      │
    │  • appointmentId                       │
    └───┬────┬──────────┬──────────┬────────┘
        │    │          │          │
        │    │          │          └─ Linked to Visit
        │    │          │             Only
        │    │          │
        ▼    ▼          ▼           ▼
    ┌──────────────┐  ┌──────────┐  ┌──────────────────┐
    │PRESCRIPTIONS │  │DIAGNOSTIC│  │MEDICAL_VISIT_    │
    │  (Recetas)   │  │ ORDERS   │  │ DIAGNOSES        │
    │              │  │          │  │                  │
    │• medicalVisit│  │•medical  │  │• medicalVisit    │
    │  Id ← **KEY**│  │ VisitId  │  │  Id ← **KEY**    │
    │• petId       │  │← **KEY** │  │• diagnosisCode   │
    │• medication  │  │• petId   │  │• diagnosisName   │
    │• status: ACTIVE│ │• testType│  │• severity        │
    │• dosage      │  │• status  │  │• status          │
    │• frequency   │  │          │  │                  │
    └──────────────┘  └──────────┘  └──────────────────┘
        │                 │
        └──────┬──────────┘
               │ (Cascade Delete on MV)
               ▼

    ┌──────────────────────────────────────────┐
    │  MedicalVisitDetail (Detail View)        │
    │  - Diagnoses                             │
    │  - Prescriptions                         │
    │  - DiagnosticOrders                      │
    │  - Procedures                            │
    │  - FollowUpNotes                         │
    │  - Attachments                           │
    │  ✖️ NO Vaccinations                      │
    │  ✖️ NO Allergies                         │
    └──────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    PET (Mascota)                                │
│  (Contexto permanente - historiales)                           │
└────────────────┬────────────────────────────────────────────────┘
                 │
        ┌────────┼────────────┐
        │        │            │
        ▼        ▼            ▼
    ┌──────────────┐  ┌──────────────┐
    │VACCINATIONS  │  │MEDICATION_   │
    │  (Vacunas)   │  │ ALLERGIES    │
    │              │  │              │
    │• petId ← **  │  │• petId ← **  │
    │  ONLY KEY**  │  │  ONLY KEY**  │
    │• vaccine Id  │  │• allergy Id  │
    │• vaccineNm   │  │• medication  │
    │• admin Date  │  │• severity    │
    │• nextDueDateà│  │• reaction    │
    │            │  │• doc date    │
    │• status:ADMIN│  │              │
    │  OVERDUE    │  │• Status: Per- │
    │  PENDING    │  │  manent       │
    │              │  │              │
    │⚠️ NO medical │  │⚠️ NO medical │
    │  VisitId    │  │  VisitId    │
    └──────────────┘  └──────────────┘
        │                    │
        └────────┬───────────┘
                 │
                 ▼
    ┌──────────────────────────────────┐
    │  PetMedicalHistory (Aggregate)   │
    │  - medicalVisits (all)           │
    │  - prescriptions (all)           │
    │  - vaccinations (all) ← FROM PET │
    │  - allergies (all) ← FROM PET    │
    │  - diagnosticOrders (all)        │
    │  - procedures (all)              │
    │  - overdueVaccinations           │
    │  - activePrescriptions           │
    │  - knownAllergies                │
    └──────────────────────────────────┘
```

---

## 2. Flujo de Datos: Visita Médica vs. Historial

### Escenario: Veterinario maneja visita de mascota

```
┌─ DURANTE LA VISITA (MedicalVisit Context) ─────────────────────┐
│                                                                  │
│  1. Crea MedicalVisit (DRAFT)                                  │
│     └─ Registra: temperatura, peso, signos vitales             │
│                                                                  │
│  2. Agrega diagnósticos (MedicalVisitDiagnosis)               │
│     └─ medicalVisitId ← REQUERIDO                             │
│     ├─ "Infección de oído"                                     │
│     └─ "Alergias de piel"                                      │
│                                                                  │
│  3. Prescribe medicamentos (Prescription)                      │
│     └─ medicalVisitId ← REQUERIDO                             │
│     ├─ "Amoxicilina 250mg c/8hs x 10 días"                   │
│     └─ ⚠️ Valida: ¿Tiene alergia a Amoxicilina?             │
│        └─ Consulta ALLERGIES table (sin medicalVisitId)       │
│                                                                  │
│  4. Ordena tests (DiagnosticOrder)                            │
│     └─ medicalVisitId ← REQUERIDO                             │
│     ├─ "Hemograma completo"                                    │
│     └─ petId ← también requerido (para routing)               │
│                                                                  │
│  5. Inyecta vacuna (OPCIONAL - puede hacerse aquí)           │
│     └─ Registra en VACCINATIONS table                         │
│        ├─ medicalVisitId ← NO REQUERIDO (por diseño)         │
│        └─ petId ← solo esto se necesita                       │
│                                                                  │
│  6. Firma el registro (MedicalVisit.status = SIGNED)          │
│     └─ Cierra la visita                                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌─ DESPUÉS (Pet Permanent Record) ───────────────────────────────┐
│                                                                  │
│  HISTORIAL DE MASCOTA (petMedicalHistory)                      │
│  └─ Agrupa TODAS las entidades por petId:                     │
│     ├─ [✓] Visita #1 del 2024-01-15                           │
│     │   ├─ Diagnósticos de esa visita                          │
│     │   ├─ Prescripciones de esa visita                        │
│     │   └─ Órdenes diagnósticas de esa visita                  │
│     │                                                           │
│     ├─ [✓] Visita #2 del 2024-02-20                           │
│     │   ├─ Diagnósticos de esa visita                          │
│     │   ├─ Prescripciones de esa visita                        │
│     │   └─ Órdenes diagnósticas de esa visita                  │
│     │                                                           │
│     ├─ [═] Vacunaciones (TODAS, independiente de visita):      │
│     │   ├─ DHPP: 2024-01-10 (próximo: 2024-04-10)             │
│     │   ├─ Rabia: 2024-01-10 (próximo: 2025-01-10)            │
│     │   └─ Bordetella: 2024-02-15 (próximo: 2024-05-15)       │
│     │                                                           │
│     └─ [═] Alergias (TODAS, permanentes):                      │
│         ├─ Penicilina - SEVERE                                 │
│         └─ Sulfas - MODERATE                                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Índices y Búsquedas por Entidad

### Medical Visits
```sql
Index 1: (clinic_id, pet_id, visit_date)
  USE: "Obtener historial de visitas de esta mascota"
  
Index 2: (clinic_id, appointment_id)
  USE: "Buscar visita de un appointment"
  
Index 3: (clinic_id, status)
  USE: "Listar visitas pendientes de firma"
```

### Prescriptions (WITH medicalVisitId)
```sql
Index 1: (clinic_id, pet_id, status)
  USE: "Obtener prescripciones activas de mascota"
  
Index 2: (clinic_id, medical_visit_id)
  USE: "Obtener prescripciones de esta visita"
  └─ ESTE es más importante que el anterior
```

### Vaccinations (WITHOUT medicalVisitId)
```sql
Index 1: (clinic_id, pet_id, administered_date)
  USE: "Historial de vacunas"
  
Index 2: (clinic_id, pet_id, next_due_date)
  USE: "¿Cuáles vacunas vencen próximas?"
  └─ CRÍTICO para recordatorios
```

### Medication Allergies (WITHOUT medicalVisitId)
```sql
Index 1: (clinic_id, pet_id)
  USE: "¿Qué medicamentos NO puedo dar?"
  └─ CRÍTICO para validación en prescripción
```

### Diagnostic Orders (WITH medicalVisitId)
```sql
Index 1: (clinic_id, pet_id, status)
  USE: "Órdenes pendientes de procesar"
  
Index 2: (clinic_id, medical_visit_id)
  USE: "Qué órdenes ordené en esta visita"
```

---

## 4. Cascade Delete Behavior

```
Si se ELIMINA una MedicalVisit (status = DRAFT, rechazar):

ELIMINA en CASCADE:
├─ Prescriptions (donde medical_visit_id = MV.id)
│  └─ Razón: eran acciones pendientes de esa visita
├─ DiagnosticOrders (donde medical_visit_id = MV.id)
│  └─ Razón: eran requisiciones pendientes
├─ MedicalVisitDiagnoses (donde medical_visit_id = MV.id)
│  └─ Razón: eran hallazgos de esa visita
├─ MedicalProcedures (donde medical_visit_id = MV.id)
│  └─ Razón: eran acciones de esa visita
├─ FollowUpNotes (donde medical_visit_id = MV.id)
│  └─ Razón: eran notas de esa visita
└─ MedicalAttachments (donde medical_visit_id = MV.id)
   └─ Razón: eran documentos de esa visita

MANTIENE (NO deleta):
├─ Vaccinations (no tienen medical_visit_id)
│  └─ Razón: son historial permanente
└─ MedicationAllergies (no tienen medical_visit_id)
   └─ Razón: son información permanente del paciente
```

---

## 5. Frontend Components Usage Pattern

### Vista: Medical History por Mascota

```
/clinic/medical-history?petId=xxx
│
├─ Carga: GET /medical-visits/pet/:petId/history
│  └─ Devuelve PetMedicalHistory (TODAS las entidades)
│
├─ Tabs:
│  ├─ Visitas Médicas
│  │  └─ Click → Abre MedicalVisitDetail
│  │     └─ Carter READ: GET /medical-visits/:mvId
│  │
│  ├─ Prescripciones
│  │  ├─ Click "Nueva" → Modal Crear
│  │  │  └─ POST /medical-visits/:mvId/prescriptions
│  │  │     └─ ⚠️ mvId requerido
│  │  │
│  │  └─ Click "Editar" → Modal Edit
│  │     └─ PUT /medical-visits/prescriptions/:prId
│  │
│  ├─ Vacunaciones
│  │  ├─ Click "Nueva" → Modal Crear
│  │  │  └─ POST /medical-visits/vaccinations
│  │  │     └─ ✅ NO mvId requerido
│  │  │
│  │  └─ Mostrar "Próximas dosis" (orden por nextDueDate)
│  │
│  ├─ Alergias
│  │  ├─ Click "Nueva" → Modal Crear
│  │  │  └─ POST /medical-visits/allergies
│  │  │     └─ ✅ NO mvId requerido
│  │  │
│  │  └─ Mostrar en ROJO si hay alergias
│  │
│  └─ Órdenes Diagnósticas
│     ├─ Click "Nueva" → Modal Crear
│     │  └─ POST /medical-visits/:mvId/diagnostic-orders
│     │     └─ ⚠️ mvId requerido
│     │
│     └─ Mostrar estado (Ordered → In Progress → Completed)
│
└─ Validación:
   └─ ANTES de prescribir:
      └─ GET /medical-visits/pet/:petId/allergies
         └─ Prevenir prescripción de medicamento alérgico
```

### Vista: Detalle de Visita

```
/clinic/medical-history/:mvId
│
├─ Carga: GET /medical-visits/:mvId
│  └─ Devuelve MedicalVisitDetail
│
├─ Tabs:
│  ├─ General → Signos vitales, notas
│  ├─ Diagnósticos → Diagnósticos de ESTA visita
│  │  └─ medical_visit_diagnoses.medical_visit_id = mvId
│  │
│  ├─ Prescripciones → Prescripciones de ESTA visita
│  │  └─ prescriptions.medical_visit_id = mvId
│  │
│  ├─ Órdenes → Órdenes de ESTA visita
│  │  └─ diagnostic_orders.medical_visit_id = mvId
│  │
│  ├─ Procedimientos → Procedimientos de ESTA visita
│  │  └─ medical_procedures.medical_visit_id = mvId
│  │
│  ├─ Notas → Notas de seguimiento
│  │  └─ follow_up_notes.medical_visit_id = mvId
│  │
│  └─ Adjuntos → Documentos/imágenes
│     └─ medical_attachments.medical_visit_id = mvId
│
├─ ✖️ NO tiene tabs para:
│  └─ Vacunaciones (eso está en la vista de mascota general)
│  └─ Alergias (eso está en la vista de mascota general)
│
└─ Actions:
   └─ Firmar → PATCH /medical-visits/:mvId/sign
      └─ status: DRAFT → SIGNED
      └─ Después de firmar, no se puede editar
```

---

## 6. Data Flow Diagram: Prescription Creation

```
FRONTEND (React)
│
├─ 1️⃣ User abre modal "Nueva Prescripción"
│  ├─ Está EN visita (mvId conocido)
│  └─ Selecciona medicamento
│
├─ 2️⃣ VALIDACIÓN CLIENTE
│  ├─ Llama: store.getAllergies(petId)
│  │  └─ De PetMedicalHistory.allergies (ya cargado)
│  │
│  └─ SI medicamento está en allergies:
│     └─ Muestra advertencia ⚠️ ALERGIA CONOCIDA
│
├─ 3️⃣ User confirma creación
│  └─ POST /medical-visits/:mvId/prescriptions
│     ├─ Body: {
│     │   medicalVisitId: mvId,    ← ENVIADO EN BODY (redundante pero requerido)
│     │   petId: petId,
│     │   medicationName: "Amoxicilina",
│     │   dosage: "250mg",
│     │   frequency: "TWICE_DAILY",
│     │   durationDays: 10,
│     │   route: "ORAL",
│     │   startDate: "2024-03-25",
│     │   endDate: "2024-04-04"
│     │ }
│     │
│     └─ Backend (NestJS):
│        ├─ Valida medicalVisitId existe
│        ├─ Valida petId es correcta
│        ├─ Crea Prescription entidad
│        │  ├─ prescription.medicalVisitId = mvId
│        │  ├─ prescription.petId = petId
│        │  └─ prescription.status = "ACTIVE"
│        │
│        ├─ INSERT prescription table
│        │  └─ Index hit: (clinic_id, medical_visit_id)
│        │
│        └─ Retorna Prescription object
│
├─ 4️⃣ Actualiza Store
│  └─ store.prescriptions.push(newPrescription)
│
└─ 5️⃣ UI se actualiza
   └─ Mostrar en tabla de prescripciones de esa visita
```

---

## 7. Query Examples: Real-World Scenarios

### Escenario 1: "Entrar a historial de mascota"

```typescript
// Frontend
const { data: history } = await get('/medical-visits/pet/pet123/history');
// history: PetMedicalHistory {
//   medicalVisits: [
//     { id: 'mv1', visitDate: '2024-01-15', ... },
//     { id: 'mv2', visitDate: '2024-02-20', ... }
//   ],
//   prescriptions: [
//     { id: 'p1', medicalVisitId: 'mv1', medicationName: 'Amoxicilina', ... },
//     { id: 'p2', medicalVisitId: 'mv2', medicationName: 'Fluconazol', ... }
//   ],
//   vaccinations: [  // ← Sin medicalVisitId en BD
//     { id: 'v1', petId: 'pet123', vaccineName: 'DHPP', administeredDate: '2024-01-10', nextDueDate: '2024-04-10' },
//     { id: 'v2', petId: 'pet123', vaccineName: 'Rabia', administeredDate: '2024-01-10', nextDueDate: '2025-01-10' }
//   ],
//   allergies: [  // ← Sin medicalVisitId en BD
//     { id: 'a1', petId: 'pet123', medicationName: 'Penicilina', severity: 'SEVERE' }
//   ],
//   overdueVaccinations: [
//     { id: 'v1', ... }  // si hoy > nextDueDate
//   ]
// }
```

### Escenario 2: "Crear prescripción en visita"

```typescript
// Backend Query: Validar veterinario puede modificar visita
SELECT * FROM medical_visits 
WHERE id = 'mv1' 
  AND clinic_id = 'clinic1' 
  AND status IN ('DRAFT', 'IN_PROGRESS');

// Insert prescripción
INSERT INTO prescriptions (
  id, clinic_id, medical_visit_id, pet_id, 
  prescribed_by_veterinarian_id, medication_name, 
  dosage, frequency, duration_days, route, status
) VALUES (
  'p123', 'clinic1', 'mv1', 'pet123',
  'vet1', 'Amoxicilina', '250mg', 'TWICE_DAILY', 
  10, 'ORAL', 'ACTIVE'
);

// Index used: (clinic_id, medical_visit_id)
```

### Escenario 3: "Validar alergia antes de prescribir"

```typescript
// Backend Query: Obtener alergias de mascota
SELECT * FROM medication_allergies 
WHERE clinic_id = 'clinic1' 
  AND pet_id = 'pet123';

// Return: [{ medicationName: 'Penicilina', severity: 'SEVERE' }]

// Si medicationName.includes('Penicilina'):
//   → WARN: "No puedes prescribir Penicilina a este pet"

// Index used: (clinic_id, pet_id)
```

### Escenario 4: "Ver próximas vacunaciones vencidas"

```typescript
// Backend Query: Vacunas vencidas
SELECT * FROM vaccinations 
WHERE clinic_id = 'clinic1' 
  AND pet_id = 'pet123' 
  AND (next_due_date IS NULL OR next_due_date < NOW());

// Return: [
//   { vaccineName: 'DHPP', nextDueDate: '2024-02-15' },  // ya pasó
//   { vaccineName: 'Bordetella', nextDueDate: '2024-04-01' }  // próximo
// ]

// Index used: (clinic_id, pet_id, next_due_date)
```

### Escenario 5: "Eliminar borradores de visita"

```typescript
// Backend: DELETE medical_visit (cascade)
DELETE FROM medical_visits 
WHERE id = 'mv_draft' AND status = 'DRAFT';

// Cascade deletes:
DELETE FROM prescriptions WHERE medical_visit_id = 'mv_draft';
DELETE FROM diagnostic_orders WHERE medical_visit_id = 'mv_draft';
DELETE FROM medical_visit_diagnoses WHERE medical_visit_id = 'mv_draft';

// NO delete:
SELECT * FROM vaccinations WHERE medical_visit_id = 'mv_draft';  // 0 rows (sin relación)
SELECT * FROM medication_allergies WHERE medical_visit_id = 'mv_draft';  // 0 rows
```

