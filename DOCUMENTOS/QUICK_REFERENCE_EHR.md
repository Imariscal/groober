# ⚡ QUICK REFERENCE: Arquitectura EHR - VibraLive

## 📌 Conclusión Principal

**Vaccinations y Allergies NO tienen `medicalVisitId` = DISEÑO INTENCIONAL ✅**

| | Prescription | DiagnosticOrder | Vaccination | Allergy | Diagnosis |
|---|---|---|---|---|---|
| **Tabla** | `prescriptions` | `diagnostic_orders` | `vaccinations` | `medication_allergies` | `medical_visit_diagnoses` |
| **medicalVisitId** | ✅ **SÍ** | ✅ **SÍ** | ❌ NO | ❌ NO | ✅ **SÍ** |
| **Scope** | Esta visita | Esta visita | Historial Pet | Info permanente Pet | Esta visita |
| **Endpoint** | `/mv/:mvId/prescriptions` | `/mv/:mvId/orders` | `/prescriptions` | `/allergies` | Agregado en MV |

---

## 🔑 Campos Clave por Entidad

### Medical Visit (Tabla Principal)
```sql
id, clinicId, petId, appointmentId, veterinarianId
visitDate, visitType, chiefComplaint
weight, temperature, heartRate, bloodPressure
preliminaryDiagnosis, treatmentPlan
status (DRAFT→SIGNED), signedAt
createdBy, modifiedBy, createdAt, updatedAt
```

### Prescription → LIGADA A VISITA
```sql
id, clinicId, ✅ medicalVisitId, petId
prescribedByVeterinarianId
medicationName, dosage, frequency, route
durationDays, quantity
prescribedDate, startDate, endDate
status (ACTIVE|COMPLETED|DISCONTINUED)
```

### Diagnostic Order → LIGADA A VISITA
```sql
id, clinicId, ✅ medicalVisitId, petId
orderedByVeterinarianId
testType (BLOOD_TEST|XRAY|ULTRASOUND...)
testName, reason
orderDate, dueDate
status (ORDERED→COMPLETED)
specimenCollectedDate
labName, labReferenceId
```

### Vaccination → SOLO LINKED A PET
```sql
id, clinicId, ❌ petId ONLY, veterinarianId
vaccineId, vaccineName
vaccineBatch, manufacturer, lotNumber
administeredDate, expirationDate
✅ nextDueDate ← CRÍTICO para scheduling
adverseReactions, notes
status (ADMINISTERED|OVERDUE|PENDING)
```

### Medication Allergy → SOLO LINKED A PET
```sql
id, clinicId, ❌ petId ONLY
documentedBy
medicationName, medicationId
severity (MILD|MODERATE|SEVERE)
reaction, notes
documentedDate
```

### Medical Visit Diagnosis → LIGADA A VISITA
```sql
id, ✅ medicalVisitId
diagnosisCode (ICD/SNOMED Optional)
diagnosisName
severity, status (PRELIMINARY|CONFIRMED|RULED_OUT)
notes
```

---

## 🔌 Endpoints Resumen

### VISITS
- `POST /medical-visits` → `201 Created`
- `GET /medical-visits/pet/:petId` → lista visitas
- `GET /medical-visits/:mvId` → detalle

### PRESCRIPTIONS (Ligadas a Visita)
- `POST /medical-visits/:mvId/prescriptions` ⚠️ mvId requerido
- `GET /medical-visits/:mvId/prescriptions`
- `PUT /medical-visits/prescriptions/:prId`
- `DELETE /medical-visits/prescriptions/:prId`

### VACCINATIONS (Solo por Pet)
- `POST /medical-visits/vaccinations` ✅ NO mvId
- `GET /medical-visits/pet/:petId/vaccinations`
- `GET /medical-visits/pet/:petId/vaccinations/overdue`
- `PUT /medical-visits/vaccinations/:vacId`
- `DELETE /medical-visits/vaccinations/:vacId`

### ALLERGIES (Solo por Pet)
- `POST /medical-visits/allergies` ✅ NO mvId
- `GET /medical-visits/pet/:petId/allergies`
- `PUT /medical-visits/allergies/:allergyId`
- `DELETE /medical-visits/allergies/:allergyId`

### DIAGNOSTIC ORDERS (Ligadas a Visita)
- `POST /medical-visits/:mvId/diagnostic-orders` ⚠️ mvId requerido
- `GET /medical-visits/:mvId/diagnostic-orders`
- `PUT /medical-visits/diagnostic-orders/:orderId`
- `DELETE /medical-visits/diagnostic-orders/:orderId`
- `PATCH /medical-visits/diagnostic-orders/:orderId/sample-collected`
- `PATCH /medical-visits/diagnostic-orders/:orderId/complete`

### MEDICAL HISTORY (Agregado)
- `GET /medical-visits/pet/:petId/history` → **PetMedicalHistory**
  ```typescript
  {
    pet: {...},
    medicalVisits: [],
    prescriptions: [],      // cada una con medicalVisitId
    vaccinations: [],       // sin medicalVisitId
    allergies: [],          // sin medicalVisitId
    diagnosticOrders: [],   // cada una con medicalVisitId
    procedures: [],
    overdueVaccinations: [],
    activePrescriptions: [],
    knownAllergies: []
  }
  ```

---

## 📊 Frontend Interfaces

### MedicalVisitDetail (para /medical-history/:mvId)
```typescript
extends MedicalVisit {
  diagnoses: MedicalVisitDiagnosis[]    // FK medicalVisitId
  prescriptions: Prescription[]         // FK medicalVisitId
  diagnosticOrders: DiagnosticOrder[]   // FK medicalVisitId
  procedures: MedicalProcedure[]        // FK medicalVisitId
  followUpNotes: FollowUpNote[]         // FK medicalVisitId
  attachments: MedicalAttachment[]      // FK medicalVisitId
  // ❌ NO vaccinations, NO allergies aquí
}
```

### PetMedicalHistory (para /medical-history?petId=xxx)
```typescript
{
  pet: {...},
  medicalVisits: MedicalVisit[],          // ALL visits
  prescriptions: Prescription[],          // ALL (cada una tiene mvId)
  vaccinations: Vaccination[],            // ALL (sin mvId)
  allergies: MedicationAllergy[],         // ALL (sin mvId)
  diagnosticOrders: DiagnosticOrder[],    // ALL (cada una tiene mvId)
  procedures: MedicalProcedure[],         // ALL
  // Computed
  totalVisits: number,
  lastVisitDate?: Date,
  overdueVaccinations: Vaccination[],
  activePrescriptions: Prescription[],
  knownAllergies: string[]
}
```

---

## 🗂️ Archivos Clave

### Backend
```
vibralive-backend/src/
├── database/entities/
│   ├── medical-visit.entity.ts              (200+ líneas)
│   ├── prescription.entity.ts               (tiene mvId)
│   ├── vaccination.entity.ts                (NO mvId) ← Intencional
│   ├── medication-allergy.entity.ts         (NO mvId) ← Intencional
│   ├── diagnostic-order.entity.ts           (tiene mvId)
│   └── medical-visit-diagnosis.entity.ts    (tiene mvId)
│
├── modules/medical-visits/
│   ├── medical-visits.controller.ts         (endpoints)
│   ├── services/medical-visits.service.ts   (getMedicalHistory, CRUD)
│   └── dtos/
│       ├── create-prescription.dto.ts
│       ├── create-vaccination.dto.ts
│       ├── create-medication-allergy.dto.ts
│       ├── create-diagnostic-order.dto.ts
│       └── add-diagnosis.dto.ts
```

### Frontend
```
vibralive-frontend/src/
├── types/ehr.ts                             (600+ líneas, todas interfaces)
├── api/ehr-api.ts                           (llamadas HTTP)
├── store/ehr-store.ts                       (Zustand, estado global)
└── app/(protected)/clinic/
    ├── medical-history/page.tsx             (historial por mascota)
    ├── medical-history/[appointmentId]/     (detalle de visita)
    │   └── page.tsx
    ├── medical-records/page.tsx
    ├── medical-records/vaccinations/page.tsx
    └── medical-records/prescriptions/page.tsx
```

---

## 🎯 Decisión Arquitectónica: Por Qué Así

### Vaccinations → Solo FK petId:
1. **Historial permanente** de la mascota, no de una visita
2. **Scheduling*** → necesita `nextDueDate` para alertas
3. **Búsqueda principal** → "¿Qué vacunas tiene esta mascota?" (por Pet, no por Visit)
4. **Ciclo largo** → Años, no semanas
5. **No cascade delete** → Si se borra una visita, las vacunas permanecen

### Allergies → Solo FK petId:
1. **Información crítica permanente** de seguridad
2. **Validación en prescripción** → Consulta por (petId, medicationName)
3. **Búsqueda principal** → "¿Qué medicamentos NO puedo dar?" (por Pet)
4. **Ciclo largo** → Para toda la vida de la mascota
5. **No cascade delete** → Si se borra una visita, las alergias permanecen

### Prescriptions → FK medicalVisitId:
1. **Acción clínica específica** de esa visita
2. **Contexto de diagnóstico** → Ligada al tratamiento de esa consulta
3. **Ciclo corto** → Semanas/meses
4. **Cascade delete** → Si se rechaza una visita (DRAFT), se eliminan las prescripciones pendientes
5. **Búsqueda principal** → "¿Qué prescribí en esta visita?"

### Diagnostic Orders → FK medicalVisitId:
1. **Requisición específica** de esa visita
2. **Contexto de investigación** → Ligada a los hallazgos de esa consulta
3. **Ciclo corto** → Días/semanas
4. **Cascade delete** → Si se rechaza una visita, se eliminan las órdenes pendientes
5. **Búsqueda principal** → "¿Qué tests ordené en esta visita?"

---

## ✅ NO hay inconsistencias que corregir

La arquitectura está bien pensada y es coherente:
- Datos de **mascota permanente** (Vaccines, Allergies) → nivel Pet
- Datos de **visita específica** (Prescriptions, Orders, Diagnoses) → nivel Visit
- Validaciones en **prescripción** usan datos de Pet
- Eliminación de visita **cascade** los datos de la visita, NO los históricos

---

## 🔗 Documentos Relacionados

1. [`ANALISIS_ARQUITECTURA_DATOS_EHR.md`](ANALISIS_ARQUITECTURA_DATOS_EHR.md) - Análisis completo (200+ líneas)
2. [`DIAGRAMA_RELACIONES_EHR.md`](DIAGRAMA_RELACIONES_EHR.md) - Diagramas y flujos
3. Archivos entidades: Backend entities (/src/database/entities/)
4. Archivos controllers: Backend medical-visits module
5. Archivos tipos: vibralive-frontend/src/types/ehr.ts
