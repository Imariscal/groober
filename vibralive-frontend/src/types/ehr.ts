/**
 * 🏥 EHR (Electronic Health Record) Types
 * Tipos para el módulo de expediente médico electrónico
 * 
 * Entidades principales:
 * - MedicalVisit: Visita médica con signos vitales
 * - Prescription: Prescripciones de medicamentos
 * - Vaccination: Registro de vacunas
 * - MedicationAllergy: Alergias a medicamentos
 * - DiagnosticOrder: Órdenes de diagnóstico
 * - MedicalProcedure: Procedimientos realizados
 * - FollowUpNote: Notas de seguimiento
 * - MedicalAttachment: Adjuntos médicos (reportes, imágenes, etc)
 */

// ============================================================================
// ENUMS - Estados y Opciones
// ============================================================================

/**
 * Estados de una visita médica
 * DRAFT → IN_PROGRESS → COMPLETED → SIGNED
 */
export type MedicalVisitStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'SIGNED';

/**
 * Tipos de visita médica - Sincronizado con backend
 */
export type VisitType = 'CHECKUP' | 'VACCINATION' | 'SURGERY' | 'CONSULTATION' | 'FOLLOWUP' | 'EMERGENCY';

/**
 * Tipos de exámenes médicos
 */
export type ExamType = 'PHYSICAL' | 'BLOOD_WORK' | 'URINALYSIS' | 'XRAY' | 'ULTRASOUND' | 'ECG' | 'ENDOSCOPY';

/**
 * Estados de diagnóstico
 */
export type DiagnosisStatus = 'PRELIMINARY' | 'CONFIRMED' | 'RESOLVED' | 'CHRONIC';

/**
 * Severidad de alergias
 */
export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE';

/**
 * Frecuencia de medicamentos
 */
export type MedicationFrequency = 'ONCE_DAILY' | 'TWICE_DAILY' | 'THREE_TIMES_DAILY' | 'FOUR_TIMES_DAILY' | 'EVERY_12_HOURS' | 'EVERY_8_HOURS' | 'AS_NEEDED';

/**
 * Rutas de administración
 */
export type AdministrationRoute = 'ORAL' | 'INJECTION' | 'TOPICAL' | 'INHALATION' | 'INTRAVENOUS' | 'INTRAMUSCULAR';

/**
 * Estados de órdenes diagnósticas
 */
export type DiagnosticOrderStatus = 'PENDING' | 'SAMPLE_COLLECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/**
 * Tipos de adjuntos
 */
export type AttachmentType = 'REPORT' | 'IMAGE' | 'XRAY' | 'ULTRASOUND' | 'LAB_RESULT' | 'PRESCRIPTION' | 'OTHER';

// ============================================================================
// CORE ENTITIES - Entidades Principales
// ============================================================================

/**
 * Visita Médica - Entidad principal del EHR
 * Contiene todos los datos de una visita (signos vitales, diagnósticos, etc)
 */
export interface MedicalVisit {
  id: string;
  clinicId: string;
  petId: string;
  appointmentId?: string;
  veterinarianId: string;
  
  // Info básica
  reasonForVisit: ReasonForVisit;
  chiefComplaint: string;
  visitDate: Date;
  visitType?: 'CHECKUP' | 'VACCINATION' | 'SURGERY' | 'CONSULTATION' | 'FOLLOWUP' | 'EMERGENCY';
  
  // Signos Vitales
  weight?: number; // kg
  temperature?: number; // °C
  heartRate?: number; // bpm
  respiratoryRate?: number; // rpm
  bloodPressure?: string; // ej: "120/80"
  bodyConditionScore?: number; // 1-9 scale
  coatCondition?: string;
  
  // Notas Clínicas
  generalNotes?: string;
  preliminaryDiagnosis?: string;
  treatmentPlan?: string;
  finalDiagnosis?: string;
  prognosis?: string;
  
  // Seguimiento
  followUpRequired: boolean;
  followUpDate?: Date;
  
  // Estado del registro
  status: MedicalVisitStatus;
  signedBy?: string; // ID del veterinario que firmó
  signedByVeterinarianId?: string;
  signedAt?: Date;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  modifiedBy: string;
  updatedAt: Date;
  
  // Relaciones opcionales (cuando se cargan con include)
  procedures?: MedicalProcedure[];
  followUpNotes?: FollowUpNote[];
  exams?: any[];
  diagnoses?: any[];
  prescriptions?: any[];
  diagnosticOrders?: any[];
  attachments?: any[];
}

/**
 * Diagnóstico asociado a una visita
 */
export interface MedicalVisitDiagnosis {
  id: string;
  medicalVisitId: string;
  diagnosisCode?: string;
  diagnosisName: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  status: DiagnosisStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Prescripción de medicamento
 */
export interface Prescription {
  id: string;
  clinicId: string;
  medicalVisitId: string;
  petId: string;
  prescribedByVeterinarianId: string;
  
  // Info del medicamento
  medicationName: string;
  medicationCode?: string;
  dosage: string; // ej: "250mg"
  frequency: MedicationFrequency;
  route: AdministrationRoute;
  durationDays: number; // en días
  quantity?: number;
  
  // Control
  instructions?: string;
  refillsRemaining?: number;
  maxRefills?: number;
  
  // Metadata
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  expiresAt?: Date;
  updatedAt: Date;
}

/**
 * Registro de Vacunación
 */
export interface Vaccination {
  id: string;
  clinicId: string;
  petId: string;
  veterinarianId: string;
  
  // Vacuna
  vaccineId: string; // FK to vaccine catalog
  vaccine?: {
    id: string;
    name: string;
    boosterDays?: number;
    isSingleDose: boolean;
  };
  
  vaccineBatch?: string;
  manufacturer?: string;
  lotNumber?: string;
  
  // Administración
  administeredDate: Date | string;
  expirationDate?: Date | string;
  nextDueDate: Date | string;
  
  // Reacciones
  adverseReactions?: string;
  notes?: string;
  
  // Control
  isOverdue?: boolean;
  status: 'PENDING' | 'ADMINISTERED' | 'OVERDUE' | 'OMITTED';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Alergia a Medicamento
 */
export interface MedicationAllergy {
  id: string;
  petId: string;
  clinicId: string;
  documentedBy: string;
  
  // Alergia
  medicationName: string;
  medicationId?: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  
  // Reacción
  reaction: string;
  notes?: string;
  
  // Metadata
  documentedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Orden de Diagnóstico (Lab, Imaging, etc)
 */
export interface DiagnosticOrder {
  id: string;
  clinicId: string;
  medicalVisitId: string;
  petId: string;
  requestedByVeterinarianId: string;
  
  // Orden
  testType: string; // ej: "Blood Panel", "Ultrasound"
  testCode?: string;
  description?: string;
  priority: 'ROUTINE' | 'URGENT';
  
  // Muestras
  sampleCollected: boolean;
  sampleCollectedDate?: Date;
  sampleCollectedBy?: string;
  
  // Resultados
  status: DiagnosticOrderStatus;
  completedDate?: Date;
  resultsSummary?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Resultado de Diagnóstico
 */
export interface DiagnosticTestResult {
  id: string;
  diagnosticOrderId: string;
  testCode: string;
  testName: string;
  
  result: string; // Valor del resultado
  referenceRange?: string; // Rango normal
  unit?: string; // Unidad de medida
  status: 'NORMAL' | 'ABNORMAL' | 'CRITICAL';
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Procedimiento Médico
 */
export interface MedicalProcedure {
  id: string;
  medicalVisitId: string;
  clinicId: string;
  petId: string;
  
  procedureType: string;
  procedureName: string;
  procedureDate: Date | string;
  
  performedByVeterinarianId: string;
  durationMinutes?: number;
  anesthesiaType?: string;
  complications?: string;
  
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO para crear un procedimiento médico
 */
export interface CreateMedicalProcedureDto {
  procedureType: string;
  procedureName: string;
  procedureDate?: string; // ISO 8601
  durationMinutes?: number;
  anesthesiaType?: string;
  complications?: string;
  notes?: string;
}

/**
 * DTO para actualizar un procedimiento médico
 */
export interface UpdateMedicalProcedureDto extends Partial<CreateMedicalProcedureDto> {
  id: string;
}

/**
 * Nota de Seguimiento
 */
export interface FollowUpNote {
  id: string;
  medicalVisitId: string;
  clinicId: string;
  petId: string;
  
  noteDate: Date | string;
  noteContent: string;
  statusUpdate?: string;
  
  writtenBy: string;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO para crear una nota de seguimiento
 */
export interface CreateFollowUpNoteDto {
  noteContent: string;
  noteDate?: string; // ISO 8601
  statusUpdate?: string;
}

/**
 * DTO para actualizar una nota de seguimiento
 */
export interface UpdateFollowUpNoteDto extends Partial<CreateFollowUpNoteDto> {
  id: string;
}

/**
 * Adjunto Médico (reportes, imágenes, documentos)
 */
export interface MedicalAttachment {
  id: string;
  medicalVisitId: string;
  clinicId: string;
  
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  attachmentType: AttachmentType;
  
  description?: string;
  uploadedBy: string;
  uploadedAt: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// DTOs - Data Transfer Objects para Formularios
// ============================================================================

/**
 * DTO para crear Medical Visit
 */
export interface CreateMedicalVisitDto {
  petId: string;
  appointmentId: string;
  
  // Info básica
  visitType: VisitType;
  reasonForVisit?: string;  // Campo descriptivo opcional
  chiefComplaint?: string;
  
  // Signos Vitales
  weight?: number;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  bloodPressure?: string;  // Optional - no enviar si está vacío
  bodyConditionScore?: number;
  coatCondition?: string;  // Optional - no enviar si está vacío
  
  // Notas
  generalNotes?: string;
  preliminaryDiagnosis?: string;
  treatmentPlan?: string;
  
  // Seguimiento
  followUpRequired?: boolean;
  followUpDate?: Date;
}

/**
 * DTO para actualizar Medical Visit
 */
export interface UpdateMedicalVisitDto extends Partial<CreateMedicalVisitDto> {
  id: string;
}

/**
 * DTO para cambiar estado de Medical Visit
 */
export interface UpdateMedicalVisitStatusDto {
  medicalVisitId: string;
  newStatus: MedicalVisitStatus;
}

/**
 * DTO para firmar registro médico
 */
export interface SignMedicalRecordDto {
  medicalVisitId: string;
  signatureData?: string; // Canvas signature data si aplica
  notes?: string;
}

/**
 * DTO para agregar diagnóstico
 */
export interface AddDiagnosisDto {
  medicalVisitId: string;
  diagnosisCode?: string;
  diagnosisName: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  notes?: string;
}

/**
 * DTO para crear prescripción
 */
export interface CreatePrescriptionDto {
  medicalVisitId: string;
  petId: string;
  
  medicationName: string;
  medicationId?: string;
  dosage: string;
  dosageUnit: string;          // mg, ml, units, etc
  frequency: string;           // ONCE_DAILY, TWICE_DAILY, etc
  durationDays: number;        // Number of days for prescription
  quantity: number;            // Total quantity to dispense
  route: AdministrationRoute;
  
  instructions?: string;
  refillsAllowed?: number;
  
  startDate: string;           // ISO 8601 date (YYYY-MM-DD)
  endDate: string;             // ISO 8601 date (YYYY-MM-DD)
}

/**
 * DTO para grabar vacunación
 */
export interface RecordVaccinationDto {
  petId: string;
  
  vaccineId: string; // FK to vaccine catalog - REQUERIDO
  vaccineName: string; // Nombre de la vacuna - REQUERIDO
  vaccineBatch: string; // Lote de vacuna - REQUERIDO
  manufacturer: string; // Fabricante - REQUERIDO
  lotNumber: string; // Número de lote - REQUERIDO
  
  administeredDate: Date | string; // Fecha de administración - REQUERIDO
  expirationDate: Date | string; // Fecha de expiración - REQUERIDO
  
  adverseReactions: string; // Reacciones adversas - REQUERIDO
  notes: string; // Notas adicionales - REQUERIDO
}

/**
 * DTO para registrar alergia
 */
export interface RecordAllergyDto {
  petId: string;
  medicationName: string;
  medicationId?: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  reaction: string;
  notes?: string;
}

/**
 * DTO para crear orden diagnóstica
 */
/**
 * Tipos de pruebas diagnósticas
 */
export type TestType = 'BLOOD_TEST' | 'URINE_TEST' | 'FECAL_TEST' | 'XRAY' | 'ULTRASOUND' | 'ECG' | 'ENDOSCOPY';

export interface CreateDiagnosticOrderDto {
  // appointmentId viene como parámetro de ruta, NO en el body
  petId: string;
  testType: TestType;
  testName: string; // Nombre descriptivo de la prueba (1-100 caracteres)
  reason: string; // Razón de la orden (1-500 caracteres)
  dueDate: string; // Fecha vencimiento (YYYY-MM-DD)
  testCode?: string;
  description?: string;
  priority?: 'ROUTINE' | 'URGENT';
}

// ============================================================================
// AGGREGATE TYPES - Tipos Compuestos
// ============================================================================

/**
 * Pet Medical History - Historial médico completo de una mascota
 * Agrupa todas las entidades relacionadas a una mascota
 */
export interface PetMedicalHistory {
  pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    dateOfBirth?: Date;
  };
  
  medicalVisits: MedicalVisit[];
  prescriptions: Prescription[];
  vaccinations: Vaccination[];
  allergies: MedicationAllergy[];
  diagnosticOrders: DiagnosticOrder[];
  
  // Resumen
  totalVisits: number;
  lastVisitDate?: Date;
  overdueVaccinations: Vaccination[];
  activePrescriptions: Prescription[];
  knownAllergies: string[];
}

/**
 * Medical Visit Detail - Visita con todas sus entidades relacionadas
 */
export interface MedicalVisitDetail extends MedicalVisit {
  diagnoses: MedicalVisitDiagnosis[];
  prescriptions: Prescription[];
  diagnosticOrders: DiagnosticOrder[];
  procedures: MedicalProcedure[];
  followUpNotes: FollowUpNote[];
  attachments: MedicalAttachment[];
  
  // Info del veterinario
  veterinarian?: {
    id: string;
    name: string;
    email: string;
  };
  
  // Info de la mascota
  pet?: {
    id: string;
    name: string;
    species: string;
    breed?: string;
  };
}

// ============================================================================
// TABLE & CARD DISPLAY TYPES
// ============================================================================

/**
 * Modelo para mostrar MedicalVisit en tarjeta
 */
export interface MedicalVisitCardModel {
  id: string;
  visitType: ReasonForVisit;
  chiefComplaint: string;
  visitDate: Date;
  status: MedicalVisitStatus;
  temperature: number;
  veterinarian: string;
  petName?: string;
}

/**
 * Modelo para mostrar Prescription en lista
 */
export interface PrescriptionListModel {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: MedicationFrequency;
  route: AdministrationRoute;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  petName?: string;
  expiresAt?: Date;
}

/**
 * Modelo para mostrar Vaccination en lista
 */
export interface VaccinationListModel {
  id: string;
  vaccineName: string;
  administrationDate: Date;
  nextDueDate: Date;
  status: 'PENDING' | 'ADMINISTERED' | 'OVERDUE' | 'SKIPPED';
  isOverdue: boolean;
  petName?: string;
}

// ============================================================================
// FILTER & SEARCH TYPES
// ============================================================================

/**
 * Opciones de filtrado para Medical Visits
 */
export interface MedicalVisitsFilterOptions {
  status?: MedicalVisitStatus[];
  reasonForVisit?: ReasonForVisit[];
  veterinarianId?: string;
  petId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasFollowUp?: boolean;
  isSigned?: boolean;
}

/**
 * Opciones de ordenamiento para Medical Visits
 */
export type MedicalVisitsSortOption = 
  | 'date-asc'
  | 'date-desc'
  | 'pet-asc'
  | 'pet-desc'
  | 'status-asc'
  | 'status-desc'
  | 'temperature-asc'
  | 'temperature-desc';

/**
 * Opciones de filtrado para Prescriptions
 */
export interface PrescriptionsFilterOptions {
  status?: ('ACTIVE' | 'COMPLETED' | 'CANCELLED')[];
  petId?: string;
  medicationName?: string;
  route?: AdministrationRoute[];
  frequency?: MedicationFrequency[];
  expiresFrom?: Date;
  expiresTo?: Date;
}

/**
 * Opciones de filtrado para Vaccinations
 */
export interface VaccinationsFilterOptions {
  status?: ('PENDING' | 'ADMINISTERED' | 'OVERDUE' | 'SKIPPED')[];
  petId?: string;
  vaccineName?: string;
  isOverdue?: boolean;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

/**
 * Opciones de filtrado para Allergies
 */
export interface AllergiesFilterOptions {
  severity?: AllergySeverity[];
  petId?: string;
  allergen?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Respuesta paginada genérica
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Respuesta de error
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}
