/**
 * 🏥 EHR API Service Layer
 * Cliente HTTP para todas las operaciones del módulo de expediente médico
 * 
 * Patrón: Singleton instance con métodos estáticos
 * Sigue el mismo patrón que otros servicios del proyecto (auth-api, clients-api, etc)
 */

import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import type {
  MedicalVisit,
  MedicalVisitDetail,
  MedicalVisitDiagnosis,
  Prescription,
  Vaccination,
  MedicationAllergy,
  DiagnosticOrder,
  DiagnosticTestResult,
  PetMedicalHistory,
  CreateMedicalVisitDto,
  UpdateMedicalVisitDto,
  UpdateMedicalVisitStatusDto,
  SignMedicalRecordDto,
  AddDiagnosisDto,
  CreatePrescriptionDto,
  RecordVaccinationDto,
  RecordAllergyDto,
  CreateDiagnosticOrderDto,
  PaginatedResponse,
  MedicalVisitsFilterOptions,
  PrescriptionsFilterOptions,
  VaccinationsFilterOptions,
  AllergiesFilterOptions,
} from '@/types/ehr';

// ============================================================================
// API BASE PATHS
// ============================================================================

const MEDICAL_VISITS_API = '/medical-visits';
const VACCINE_CATALOG_API = '/vaccine-catalog';
const PRESCRIPTIONS_API = '/medical-visits/prescriptions';
const VACCINATIONS_API = '/medical-visits/vaccinations';
const ALLERGIES_API = '/medical-visits/allergies';
const DIAGNOSTICS_API = '/medical-visits/diagnostic-orders';
const MEDICAL_HISTORY_API = '/medical-visits/history';

// ============================================================================
// UTILITY: Build Query String
// ============================================================================

const buildQueryString = (params: Record<string, any>): string => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => query.append(key, String(v)));
      } else if (value instanceof Date) {
        query.append(key, value.toISOString());
      } else {
        query.append(key, String(value));
      }
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

// ============================================================================
// MEDICAL VISITS API
// ============================================================================

/**
 * Crear una nueva visita médica
 */
export const createMedicalVisit = async (
  data: CreateMedicalVisitDto
): Promise<MedicalVisit> => {
  try {
    const response = await apiClient.post<MedicalVisit>(
      MEDICAL_VISITS_API,
      data
    );
    return response;
  } catch (error: any) {
    console.error('Error creating medical visit:', error);
    throw new Error(
      error?.response?.data?.message || 'Error al crear la visita médica'
    );
  }
};

/**
 * Obtener una visita médica por ID
 */
export const getMedicalVisit = async (
  medicalVisitId: string
): Promise<MedicalVisitDetail> => {
  try {
    const response = await apiClient.get<MedicalVisitDetail>(
      `${MEDICAL_VISITS_API}/${medicalVisitId}`
    );
    return response;
  } catch (error: any) {
    console.error(`Error getting medical visit ${medicalVisitId}:`, error);
    return {} as MedicalVisitDetail;
  }
};

/**
 * Listar todas las visitas médicas con filtros opcionales
 */
export const listMedicalVisits = async (
  filters?: MedicalVisitsFilterOptions & { page?: number; pageSize?: number }
): Promise<PaginatedResponse<MedicalVisit>> => {
  try {
    const queryString = buildQueryString(filters || {});
    const response = await apiClient.get<PaginatedResponse<MedicalVisit>>(
      `${MEDICAL_VISITS_API}${queryString}`
    );
    return response;
  } catch (error: any) {
    console.error('Error listing medical visits:', error);
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    };
  }
};

/**
 * Listar visitas médicas de una mascota específica
 */
export const listPetMedicalVisits = async (
  petId: string,
  filters?: Omit<MedicalVisitsFilterOptions, 'petId'>
): Promise<MedicalVisit[]> => {
  try {
    const queryString = buildQueryString({ ...filters, petId });
    const response = await apiClient.get<MedicalVisit[]>(
      `${MEDICAL_VISITS_API}${queryString}`
    );
    return response;
  } catch (error: any) {
    console.error(`Error listing pet medical visits for ${petId}:`, error);
    return [];
  }
};

/**
 * Actualizar una visita médica (solo si está en DRAFT)
 */
export const updateMedicalVisit = async (
  medicalVisitId: string,
  data: Partial<CreateMedicalVisitDto>
): Promise<MedicalVisit> => {
  try {
    const response = await apiClient.put<MedicalVisit>(
      `${MEDICAL_VISITS_API}/${medicalVisitId}`,
      data
    );
    return response;
  } catch (error: any) {
    console.error(`Error updating medical visit ${medicalVisitId}:`, error);
    throw new Error(
      error?.response?.data?.message || 'Error al actualizar la visita médica'
    );
  }
};

/**
 * Cambiar estado de una visita médica
 */
export const updateMedicalVisitStatus = async (
  medicalVisitId: string,
  newStatus: MedicalVisitStatus,
  signedByVeterinarianId?: string
): Promise<MedicalVisit> => {
  try {
    const body: any = { status: newStatus };
    if (signedByVeterinarianId) {
      body.signedByVeterinarianId = signedByVeterinarianId;
    }
    const response = await apiClient.patch<MedicalVisit>(
      `${MEDICAL_VISITS_API}/${medicalVisitId}/status`,
      body
    );
    return response;
  } catch (error: any) {
    console.error(
      `Error updating status for medical visit ${medicalVisitId}:`,
      error
    );
    throw new Error(
      error?.response?.data?.message ||
        'Error al cambiar el estado de la visita médica'
    );
  }
};

/**
 * Eliminar una visita médica
 */
export const deleteMedicalVisit = async (
  medicalVisitId: string
): Promise<void> => {
  try {
    await apiClient.delete(`${MEDICAL_VISITS_API}/${medicalVisitId}`);
  } catch (error: any) {
    console.error(`Error deleting medical visit ${medicalVisitId}:`, error);
    throw new Error(
      error?.response?.data?.message || 'Error al eliminar la visita médica'
    );
  }
};

/**
 * Firmar un registro médico (veterinario-only)
 */
export const signMedicalRecord = async (
  medicalVisitId: string,
  data: Omit<SignMedicalRecordDto, 'medicalVisitId'>
): Promise<MedicalVisit> => {
  try {
    const response = await apiClient.post<MedicalVisit>(
      `${MEDICAL_VISITS_API}/${medicalVisitId}/sign`,
      data
    );
    return response;
  } catch (error: any) {
    console.error(`Error signing medical record ${medicalVisitId}:`, error);
    throw new Error(
      error?.response?.data?.message || 'Error al firmar el registro médico'
    );
  }
};

// ============================================================================
// DIAGNOSES API
// ============================================================================

/**
 * Agregar un diagnóstico a una visita
 */
export const addDiagnosis = async (
  medicalVisitId: string,
  data: Omit<AddDiagnosisDto, 'medicalVisitId'>
): Promise<MedicalVisitDiagnosis> => {
  try {
    const response = await apiClient.post<MedicalVisitDiagnosis>(
      `${MEDICAL_VISITS_API}/${medicalVisitId}/diagnoses`,
      data
    );
    return response;
  } catch (error: any) {
    console.error(
      `Error adding diagnosis to visit ${medicalVisitId}:`,
      error
    );
    throw new Error(
      error?.response?.data?.message ||
        'Error al agregar el diagnóstico'
    );
  }
};

/**
 * Obtener diagnósticos de una visita
 */
export const getDiagnosesByVisit = async (
  medicalVisitId: string
): Promise<MedicalVisitDiagnosis[]> => {
  try {
    const response = await apiClient.get<MedicalVisitDiagnosis[]>(
      `${MEDICAL_VISITS_API}/${medicalVisitId}/diagnoses`
    );
    return response;
  } catch (error: any) {
    console.error(
      `Error getting diagnoses for visit ${medicalVisitId}:`,
      error
    );
    return [];
  }
};

/**
 * Actualizar un diagnóstico
 */
export const updateDiagnosis = async (
  medicalVisitId: string,
  diagnosisId: string,
  data: Partial<MedicalVisitDiagnosis>
): Promise<MedicalVisitDiagnosis> => {
  try {
    const response = await apiClient.put<MedicalVisitDiagnosis>(
      `${MEDICAL_VISITS_API}/${medicalVisitId}/diagnoses/${diagnosisId}`,
      data
    );
    return response;
  } catch (error: any) {
    console.error(
      `Error updating diagnosis ${diagnosisId}:`,
      error
    );
    throw new Error(
      error?.response?.data?.message || 'Error al actualizar el diagnóstico'
    );
  }
};

/**
 * Eliminar un diagnóstico
 */
export const deleteDiagnosis = async (
  medicalVisitId: string,
  diagnosisId: string
): Promise<void> => {
  try {
    await apiClient.delete(
      `${MEDICAL_VISITS_API}/${medicalVisitId}/diagnoses/${diagnosisId}`
    );
  } catch (error: any) {
    console.error(`Error deleting diagnosis ${diagnosisId}:`, error);
    throw new Error(
      error?.response?.data?.message || 'Error al eliminar el diagnóstico'
    );
  }
};

// ============================================================================
// PRESCRIPTIONS API
// ============================================================================

/**
 * Crear una prescripción
 */
export const createPrescription = async (
  medicalVisitId: string,
  data: CreatePrescriptionDto
): Promise<Prescription> => {
  try {
    const response = await apiClient.post<Prescription>(
      `/medical-visits/${medicalVisitId}/prescriptions`,
      data
    );
    return response;
  } catch (error: any) {
    console.error('Error creating prescription:', error);
    throw new Error(
      error?.response?.data?.message || 'Error al crear la prescripción'
    );
  }
};

/**
 * Obtener medicamentos únicos prescritos (para autocomplete)
 */
export const getUniqueMedications = async (): Promise<string[]> => {
  try {
    const response = await apiClient.get<string[]>(
      '/medical-visits/medications'
    );
    return response || [];
  } catch (error: any) {
    console.error('Error fetching medications:', error);
    return [];
  }
};

/**
 * Obtener medicamentos más usados recientemente
 */
export const getMostUsedMedications = async (
  limit: number = 10
): Promise<{ medicationName: string; usageCount: number }[]> => {
  try {
    const response = await apiClient.get<
      { medicationName: string; usageCount: number }[]
    >('/medical-visits/medications/most-used', {
      params: { limit },
    });
    return response || [];
  } catch (error: any) {
    console.error('Error fetching most used medications:', error);
    return [];
  }
};

/**
 * Obtener prescripción por ID
 */
export const getPrescription = async (
  prescriptionId: string
): Promise<Prescription> => {
  try {
    const response = await apiClient.get<Prescription>(
      `${PRESCRIPTIONS_API}/${prescriptionId}`
    );
    return response;
  } catch (error: any) {
    console.error(`Error getting prescription ${prescriptionId}:`, error);
    return {} as Prescription;
  }
};

/**
 * Listar prescripciones activas de una mascota
 */
export const getActivePrescriptions = async (
  petId: string
): Promise<Prescription[]> => {
  try {
    const response = await apiClient.get<Prescription[]>(
      `/medical-visits/pet/${petId}/prescriptions`
    );
    // Filter for active prescriptions on client side as needed
    return response.filter((p: any) => p.status === 'ACTIVE');
  } catch (error: any) {
    console.error(`Error getting active prescriptions for pet ${petId}:`, error);
    return [];
  }
};

/**
 * Listar todas las prescripciones de una mascota
 */
export const getAllPrescriptions = async (
  petId: string,
  filters?: Omit<PrescriptionsFilterOptions, 'petId'>
): Promise<Prescription[]> => {
  try {
    const response = await apiClient.get<Prescription[]>(
      `/medical-visits/pet/${petId}/prescriptions`
    );
    return response;
  } catch (error: any) {
    console.error(`Error getting prescriptions for pet ${petId}:`, error);
    return [];
  }
};

/**
 * Actualizar prescripción
 */
export const updatePrescription = async (
  prescriptionId: string,
  data: Partial<CreatePrescriptionDto>
): Promise<Prescription> => {
  try {
    const response = await apiClient.put<Prescription>(
      `${PRESCRIPTIONS_API}/${prescriptionId}`,
      data
    );
    return response;
  } catch (error: any) {
    console.error(`Error updating prescription ${prescriptionId}:`, error);
    throw new Error(
      error?.response?.data?.message || 'Error al actualizar la prescripción'
    );
  }
};

/**
 * Eliminar prescripción
 */
export const deletePrescription = async (
  prescriptionId: string
): Promise<void> => {
  try {
    await apiClient.delete(`${PRESCRIPTIONS_API}/${prescriptionId}`);
  } catch (error: any) {
    console.error(`Error deleting prescription ${prescriptionId}:`, error);
    throw new Error(
      error?.response?.data?.message || 'Error al eliminar la prescripción'
    );
  }
};

// ============================================================================
// VACCINATIONS API
// ============================================================================

/**
 * Registrar una vacunación
 */
export const recordVaccination = async (
  data: RecordVaccinationDto
): Promise<Vaccination> => {
  try {
    const response = await apiClient.post<Vaccination>(
      VACCINATIONS_API,
      data
    );
    return response;
  } catch (error: any) {
    console.error('Error recording vaccination:', error);
    throw new Error(
      error?.response?.data?.message || 'Error al registrar la vacunación'
    );
  }
};

/**
 * Obtener vacunación por ID
 */
export const getVaccination = async (
  vaccinationId: string
): Promise<Vaccination> => {
  try {
    const response = await apiClient.get<Vaccination>(
      `${VACCINATIONS_API}/${vaccinationId}`
    );
    return response;
  } catch (error: any) {
    console.error(`Error getting vaccination ${vaccinationId}:`, error);
    return {} as Vaccination;
  }
};

/**
 * Obtener cronograma de vacunación de una mascota
 */
export const getVaccinationSchedule = async (
  petId: string
): Promise<Vaccination[]> => {
  try {
    const response = await apiClient.get<Vaccination[]>(
      `/medical-visits/pet/${petId}/vaccinations`
    );
    return response;
  } catch (error: any) {
    console.error(`Error getting vaccination schedule for pet ${petId}:`, error);
    return [];
  }
};

/**
 * Obtener vacunaciones vencidas de una mascota
 */
export const getOverdueVaccinations = async (
  petId: string
): Promise<Vaccination[]> => {
  try {
    const response = await apiClient.get<Vaccination[]>(
      `/medical-visits/pet/${petId}/vaccinations/overdue`
    );
    return response;
  } catch (error: any) {
    console.error(`Error getting overdue vaccinations for pet ${petId}:`, error);
    return [];
  }
};

/**
 * Actualizar vacunación
 */
export const updateVaccination = async (
  vaccinationId: string,
  data: Partial<RecordVaccinationDto>
): Promise<Vaccination> => {
  try {
    const response = await apiClient.put<Vaccination>(
      `${VACCINATIONS_API}/${vaccinationId}`,
      data
    );
    return response;
  } catch (error: any) {
    console.error(`Error updating vaccination ${vaccinationId}:`, error);
    throw new Error(
      error?.response?.data?.message || 'Error al actualizar la vacunación'
    );
  }
};

/**
 * Eliminar vacunación
 */
export const deleteVaccination = async (
  vaccinationId: string
): Promise<void> => {
  try {
    await apiClient.delete(`${VACCINATIONS_API}/${vaccinationId}`);
  } catch (error: any) {
    console.error(`Error deleting vaccination ${vaccinationId}:`, error);
    throw new Error(
      error?.response?.data?.message || 'Error al eliminar la vacunación'
    );
  }
};

// ============================================================================
// MEDICATION ALLERGIES API
// ============================================================================

/**
 * Registrar una alergia a medicamento
 */
export const recordAllergy = async (
  data: RecordAllergyDto
): Promise<MedicationAllergy> => {
  try {
    const response = await apiClient.post<MedicationAllergy>(
      ALLERGIES_API,
      data
    );
    return response;
  } catch (error: any) {
    console.error('Error recording allergy:', error);
    throw new Error(
      error?.response?.data?.message || 'Error al registrar la alergia'
    );
  }
};

/**
 * Obtener alergia por ID
 */
export const getAllergy = async (
  allergyId: string
): Promise<MedicationAllergy> => {
  try {
    const response = await apiClient.get<MedicationAllergy>(
      `${ALLERGIES_API}/${allergyId}`
    );
    return response;
  } catch (error: any) {
    console.error(`Error getting allergy ${allergyId}:`, error);
    return {} as MedicationAllergy;
  }
};

/**
 * Obtener todas las alergias de una mascota
 */
export const getAllergies = async (
  petId: string,
  filters?: Omit<AllergiesFilterOptions, 'petId'>
): Promise<MedicationAllergy[]> => {
  try {
    const response = await apiClient.get<MedicationAllergy[]>(
      `/medical-visits/pet/${petId}/allergies`
    );
    return response;
  } catch (error: any) {
    console.error(`Error getting allergies for pet ${petId}:`, error);
    return [];
  }
};

/**
 * Actualizar alergia
 */
export const updateAllergy = async (
  allergyId: string,
  data: Partial<RecordAllergyDto>
): Promise<MedicationAllergy> => {
  try {
    const response = await apiClient.put<MedicationAllergy>(
      `${ALLERGIES_API}/${allergyId}`,
      data
    );
    return response;
  } catch (error: any) {
    console.error(`Error updating allergy ${allergyId}:`, error);
    throw new Error(
      error?.response?.data?.message || 'Error al actualizar la alergia'
    );
  }
};

/**
 * Eliminar alergia
 */
export const deleteAllergy = async (
  allergyId: string
): Promise<void> => {
  try {
    await apiClient.delete(`${ALLERGIES_API}/${allergyId}`);
  } catch (error: any) {
    console.error(`Error deleting allergy ${allergyId}:`, error);
    throw new Error(
      error?.response?.data?.message || 'Error al eliminar la alergia'
    );
  }
};

// ============================================================================
// DIAGNOSTIC ORDERS API
// ============================================================================

/**
 * Crear una orden diagnóstica
 */
export const createDiagnosticOrder = async (
  data: CreateDiagnosticOrderDto,
  medicalVisitId: string
): Promise<DiagnosticOrder> => {
  try {
    const endpoint = `/medical-visits/${medicalVisitId}/diagnostic-orders`;
    const response = await apiClient.post<DiagnosticOrder>(
      endpoint,
      data  // payload completo sin appointmentId
    );
    return response;
  } catch (error: any) {
    console.error('Error creating diagnostic order:', error);
    throw new Error(
      error?.response?.data?.message ||
        'Error al crear la orden diagnóstica'
    );
  }
};

/**
 * Obtener orden diagnóstica por ID
 */
export const getDiagnosticOrder = async (
  orderId: string
): Promise<DiagnosticOrder> => {
  try {
    const response = await apiClient.get<DiagnosticOrder>(
      `${DIAGNOSTICS_API}/${orderId}`
    );
    return response;
  } catch (error: any) {
    console.error(`Error getting diagnostic order ${orderId}:`, error);
    return {} as DiagnosticOrder;
  }
};

/**
 * Listar órdenes diagnósticas de una visita
 */
export const getDiagnosticOrdersByVisit = async (
  medicalVisitId: string
): Promise<DiagnosticOrder[]> => {
  try {
    const endpoint = `/medical-visits/${medicalVisitId}/diagnostic-orders`;
    const response = await apiClient.get<DiagnosticOrder[]>(
      endpoint
    );
    return response;
  } catch (error: any) {
    console.error(
      `Error getting diagnostic orders for medical visit ${medicalVisitId}:`,
      error
    );
    return [];
  }
};

/**
 * Marcar muestra como recolectada
 */
export const markSampleAsCollected = async (
  orderId: string
): Promise<DiagnosticOrder> => {
  try {
    const response = await apiClient.patch<DiagnosticOrder>(
      `${DIAGNOSTICS_API}/${orderId}/sample-collected`,
      {}
    );
    return response;
  } catch (error: any) {
    console.error(`Error marking sample as collected for order ${orderId}:`, error);
    throw new Error(
      error?.response?.data?.message ||
        'Error al marcar muestra como recolectada'
    );
  }
};

/**
 * Completar orden diagnóstica
 */
export const completeDiagnosticOrder = async (
  orderId: string,
  resultsSummary?: string
): Promise<DiagnosticOrder> => {
  try {
    const response = await apiClient.patch<DiagnosticOrder>(
      `${DIAGNOSTICS_API}/${orderId}/complete`,
      { resultsSummary }
    );
    return response;
  } catch (error: any) {
    console.error(`Error completing diagnostic order ${orderId}:`, error);
    throw new Error(
      error?.response?.data?.message ||
        'Error al completar la orden diagnóstica'
    );
  }
};

/**
 * Obtener resultados de una orden
 */
export const getDiagnosticTestResults = async (
  orderId: string
): Promise<DiagnosticTestResult[]> => {
  try {
    const response = await apiClient.get<DiagnosticTestResult[]>(
      `${DIAGNOSTICS_API}/${orderId}/results`
    );
    return response;
  } catch (error: any) {
    console.error(`Error getting test results for order ${orderId}:`, error);
    return [];
  }
};

/**
 * Cancelar orden diagnóstica
 */
export const cancelDiagnosticOrder = async (
  orderId: string
): Promise<DiagnosticOrder> => {
  try {
    const response = await apiClient.patch<DiagnosticOrder>(
      `${DIAGNOSTICS_API}/${orderId}/cancel`,
      {}
    );
    return response;
  } catch (error: any) {
    console.error(`Error canceling diagnostic order ${orderId}:`, error);
    throw new Error(
      error?.response?.data?.message ||
        'Error al cancelar la orden diagnóstica'
    );
  }
};

/**
 * Actualizar orden diagnóstica
 */
export const updateDiagnosticOrder = async (
  orderId: string,
  data: Partial<CreateDiagnosticOrderDto>
): Promise<DiagnosticOrder> => {
  try {
    const response = await apiClient.put<DiagnosticOrder>(
      `${DIAGNOSTICS_API}/${orderId}`,
      data
    );
    return response;
  } catch (error: any) {
    console.error(`Error updating diagnostic order ${orderId}:`, error);
    throw new Error(
      error?.response?.data?.message ||
        'Error al actualizar la orden diagnóstica'
    );
  }
};

/**
 * Eliminar orden diagnóstica
 */
export const deleteDiagnosticOrder = async (
  orderId: string
): Promise<void> => {
  try {
    await apiClient.delete(`${DIAGNOSTICS_API}/${orderId}`);
  } catch (error: any) {
    console.error(`Error deleting diagnostic order ${orderId}:`, error);
    throw new Error(
      error?.response?.data?.message ||
        'Error al eliminar la orden diagnóstica'
    );
  }
};

// ============================================================================
// MEDICAL HISTORY API
// ============================================================================

/**
 * Obtener historial médico completo de una mascota
 */
export const getPetMedicalHistory = async (
  petId: string
): Promise<PetMedicalHistory> => {
  try {
    const url = `${MEDICAL_VISITS_API}/pet/${petId}/history`;
    console.log('[EHR API] Calling getPetMedicalHistory:', { url, MEDICAL_VISITS_API, petId });
    
    // apiClient.get() already returns response.data directly (not the full response)
    const medicalHistory = await apiClient.get<PetMedicalHistory>(url);
    console.log('[EHR API] ✅ Successfully loaded medical history:', medicalHistory);
    console.log('[EHR API] 📊 medicalHistory:', medicalHistory);
    console.log('[EHR API] 📊 medicalVisits:', medicalHistory?.medicalVisits);
    console.log('[EHR API] 📊 medicalVisits.length:', medicalHistory?.medicalVisits?.length);
    
    return medicalHistory;
  } catch (error: any) {
    console.error('[EHR API] Error getting medical history for pet', petId, error);
    console.error('[EHR API] Error details:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      url: error?.config?.url,
    });
    throw new Error(
      error?.response?.data?.message ||
        'Error al cargar el historial médico'
    );
  }
};

/**
 * Obtener solo datos maestros de mascota (sin visitas previas ni prescripciones)
 * Ideal para formularios de citas NUEVAS
 */
export const getPetMasterData = async (
  petId: string
): Promise<Partial<PetMedicalHistory>> => {
  try {
    const url = `${MEDICAL_VISITS_API}/pet/${petId}/master-data`;
    console.log('[EHR API] Calling getPetMasterData:', { url, petId });
    
    // Try to call the dedicated endpoint if it exists
    try {
      const masterData = await apiClient.get<Partial<PetMedicalHistory>>(url);
      console.log('[EHR API] ✅ Master data loaded from dedicated endpoint');
      return masterData;
    } catch (endpointError: any) {
      // If endpoint doesn't exist (404), fallback to loading full history and filtering
      if (endpointError?.response?.status === 404) {
        console.log('[EHR API] Master data endpoint not available, loading full history and filtering...');
        const fullHistory = await getPetMedicalHistory(petId);
        
        // Return only master data (pet info, vaccinations, allergies) - NO visits or prescriptions
        return {
          pet: fullHistory.pet,
          vaccinations: fullHistory.vaccinations,
          allergies: fullHistory.allergies,
          overdueVaccinations: fullHistory.overdueVaccinations,
          knownAllergies: fullHistory.knownAllergies,
          medicalVisits: [], // Empty - don't include past visits
          prescriptions: [], // Empty - don't include past prescriptions
          diagnosticOrders: [],
          totalVisits: 0,
          activePrescriptions: [],
        };
      }
      throw endpointError;
    }
  } catch (error: any) {
    console.error('[EHR API] Error getting master data for pet', petId, error);
    throw new Error(
      error?.response?.data?.message ||
        'Error al cargar datos de la mascota'
    );
  }
};

/**
 * Exportar historial médico a PDF (si aplica)
 */
export const exportMedicalHistoryPDF = async (
  petId: string
): Promise<Blob> => {
  try {
    const response = await apiClient.get(
      `${MEDICAL_HISTORY_API}/${petId}/export/pdf`,
      { responseType: 'blob' }
    );
    return response;
  } catch (error: any) {
    console.error(`Error exporting medical history for pet ${petId}:`, error);
    throw new Error(
      error?.response?.data?.message ||
        'Error al exportar el historial médico'
    );
  }
};

// ============================================================================
// PROCEDURES API
// ============================================================================

/**
 * Crear un procedimiento médico
 */
export const createProcedure = async (
  medicalVisitId: string,
  data: any
): Promise<any> => {
  try {
    const endpoint = `/medical-visits/${medicalVisitId}/procedures`;
    const response = await apiClient.post<any>(endpoint, data);
    return response;
  } catch (error: any) {
    console.error('Error creating procedure:', error);
    throw new Error(
      error?.response?.data?.message || 'Error al registrar el procedimiento'
    );
  }
};

/**
 * Obtener procedimiento por ID
 */
export const getProcedure = async (procedureId: string): Promise<any> => {
  try {
    const response = await apiClient.get<any>(`/medical-visits/procedures/${procedureId}`);
    return response;
  } catch (error: any) {
    console.error(`Error getting procedure ${procedureId}:`, error);
    throw new Error(
      error?.response?.data?.message || 'Error al obtener el procedimiento'
    );
  }
};

/**
 * Actualizar procedimiento
 */
export const updateProcedure = async (
  procedureId: string,
  data: any
): Promise<any> => {
  try {
    const response = await apiClient.put<any>(
      `/medical-visits/procedures/${procedureId}`,
      data
    );
    return response;
  } catch (error: any) {
    console.error(`Error updating procedure ${procedureId}:`, error);
    throw new Error(
      error?.response?.data?.message || 'Error al actualizar el procedimiento'
    );
  }
};

/**
 * Eliminar procedimiento
 */
export const deleteProcedure = async (procedureId: string): Promise<void> => {
  try {
    await apiClient.delete(`/medical-visits/procedures/${procedureId}`);
  } catch (error: any) {
    console.error(`Error deleting procedure ${procedureId}:`, error);
    throw new Error(
      error?.response?.data?.message || 'Error al eliminar el procedimiento'
    );
  }
};

// ============================================================================
// FOLLOW-UP NOTES API
// ============================================================================

/**
 * Crear una nota de seguimiento
 */
export const createFollowUpNote = async (
  medicalVisitId: string,
  data: any
): Promise<any> => {
  try {
    const endpoint = `/medical-visits/${medicalVisitId}/follow-up-notes`;
    const response = await apiClient.post<any>(endpoint, data);
    return response;
  } catch (error: any) {
    console.error('Error creating follow-up note:', error);
    throw new Error(
      error?.response?.data?.message || 'Error al crear la nota de seguimiento'
    );
  }
};

/**
 * Obtener nota de seguimiento por ID
 */
export const getFollowUpNote = async (noteId: string): Promise<any> => {
  try {
    const response = await apiClient.get<any>(
      `/medical-visits/follow-up-notes/${noteId}`
    );
    return response;
  } catch (error: any) {
    console.error(`Error getting follow-up note ${noteId}:`, error);
    throw new Error(
      error?.response?.data?.message || 'Error al obtener la nota de seguimiento'
    );
  }
};

/**
 * Actualizar nota de seguimiento
 */
export const updateFollowUpNote = async (
  noteId: string,
  data: any
): Promise<any> => {
  try {
    const response = await apiClient.put<any>(
      `/medical-visits/follow-up-notes/${noteId}`,
      data
    );
    return response;
  } catch (error: any) {
    console.error(`Error updating follow-up note ${noteId}:`, error);
    throw new Error(
      error?.response?.data?.message || 'Error al actualizar la nota de seguimiento'
    );
  }
};

/**
 * Eliminar nota de seguimiento
 */
export const deleteFollowUpNote = async (noteId: string): Promise<void> => {
  try {
    await apiClient.delete(`/medical-visits/follow-up-notes/${noteId}`);
  } catch (error: any) {
    console.error(`Error deleting follow-up note ${noteId}:`, error);
    throw new Error(
      error?.response?.data?.message || 'Error al eliminar la nota de seguimiento'
    );
  }
};

// ============================================================================
// VACCINE CATALOG API
// ============================================================================

/**
 * Obtener listado de vacunas activas en el catálogo
 */
export const getActiveVaccines = async (): Promise<any[]> => {
  try {
    const response = await apiClient.get(`${VACCINE_CATALOG_API}`);
    return response?.data || [];
  } catch (error: any) {
    console.error('[EHR API] Error loading active vaccines', error);
    throw new Error(
      error?.response?.data?.message ||
        'Error al cargar el catálogo de vacunas'
    );
  }
};

/**
 * Obtener listado completo de vacunas (incluyendo inactivas)
 */
export const getAllVaccines = async (): Promise<any[]> => {
  try {
    const response = await apiClient.get(`${VACCINE_CATALOG_API}/all`);
    return response?.data || [];
  } catch (error: any) {
    console.error('[EHR API] Error loading all vaccines', error);
    throw new Error(
      error?.response?.data?.message ||
        'Error al cargar el catálogo de vacunas'
    );
  }
};

/**
 * Obtener una vacuna específica
 */
export const getVaccineById = async (vaccineId: string): Promise<any> => {
  try {
    const response = await apiClient.get(`${VACCINE_CATALOG_API}/${vaccineId}`);
    return response?.data;
  } catch (error: any) {
    console.error('[EHR API] Error loading vaccine', vaccineId, error);
    throw new Error(
      error?.response?.data?.message ||
        'Error al cargar la vacuna'
    );
  }
};

/**
 * Crear una nueva vacuna en el catálogo
 */
export const createVaccine = async (data: any): Promise<any> => {
  try {
    const response = await apiClient.post(`${VACCINE_CATALOG_API}`, data);
    toast.success('Vacuna creada exitosamente');
    return response?.data;
  } catch (error: any) {
    console.error('[EHR API] Error creating vaccine', error);
    toast.error(error?.response?.data?.message || 'Error al crear la vacuna');
    throw error;
  }
};

/**
 * Actualizar una vacuna en el catálogo
 */
export const updateVaccine = async (vaccineId: string, data: any): Promise<any> => {
  try {
    const response = await apiClient.patch(
      `${VACCINE_CATALOG_API}/${vaccineId}`,
      data
    );
    toast.success('Vacuna actualizada exitosamente');
    return response?.data;
  } catch (error: any) {
    console.error('[EHR API] Error updating vaccine', vaccineId, error);
    toast.error(error?.response?.data?.message || 'Error al actualizar la vacuna');
    throw error;
  }
};

/**
 * Activar una vacuna
 */
export const activateVaccine = async (vaccineId: string): Promise<any> => {
  try {
    const response = await apiClient.patch(
      `${VACCINE_CATALOG_API}/${vaccineId}/activate`
    );
    toast.success('Vacuna activada');
    return response?.data;
  } catch (error: any) {
    console.error('[EHR API] Error activating vaccine', vaccineId, error);
    toast.error(error?.response?.data?.message || 'Error al activar la vacuna');
    throw error;
  }
};

/**
 * Desactivar una vacuna
 */
export const deactivateVaccine = async (vaccineId: string): Promise<any> => {
  try {
    const response = await apiClient.patch(
      `${VACCINE_CATALOG_API}/${vaccineId}/deactivate`
    );
    toast.success('Vacuna desactivada');
    return response?.data;
  } catch (error: any) {
    console.error('[EHR API] Error deactivating vaccine', vaccineId, error);
    toast.error(error?.response?.data?.message || 'Error al desactivar la vacuna');
    throw error;
  }
};

/**
 * Eliminar una vacuna
 */
export const deleteVaccine = async (vaccineId: string): Promise<void> => {
  try {
    await apiClient.delete(`${VACCINE_CATALOG_API}/${vaccineId}`);
    toast.success('Vacuna eliminada exitosamente');
  } catch (error: any) {
    console.error('[EHR API] Error deleting vaccine', vaccineId, error);
    toast.error(error?.response?.data?.message || 'Error al eliminar la vacuna');
    throw error;
  }
};

// ============================================================================
// HELPER: Export all methods as object for easy reference
// ============================================================================

export const ehrApi = {
  // Medical Visits
  createMedicalVisit,
  getMedicalVisit,
  listMedicalVisits,
  listPetMedicalVisits,
  updateMedicalVisit,
  updateMedicalVisitStatus,
  deleteMedicalVisit,
  signMedicalRecord,

  // Diagnoses
  addDiagnosis,
  getDiagnosesByVisit,
  updateDiagnosis,
  deleteDiagnosis,

  // Prescriptions
  createPrescription,
  getUniqueMedications,
  getMostUsedMedications,
  getPrescription,
  getActivePrescriptions,
  getAllPrescriptions,
  updatePrescription,
  deletePrescription,

  // Vaccinations
  recordVaccination,
  getVaccination,
  getVaccinationSchedule,
  getOverdueVaccinations,
  updateVaccination,
  deleteVaccination,

  // Allergies
  recordAllergy,
  getAllergy,
  getAllergies,
  updateAllergy,
  deleteAllergy,

  // Diagnostic Orders
  createDiagnosticOrder,
  getDiagnosticOrder,
  getDiagnosticOrdersByVisit,
  markSampleAsCollected,
  completeDiagnosticOrder,
  getDiagnosticTestResults,
  cancelDiagnosticOrder,
  updateDiagnosticOrder,
  deleteDiagnosticOrder,

  // Medical History
  getPetMedicalHistory,
  getPetMasterData,
  exportMedicalHistoryPDF,

  // Procedures
  createProcedure,
  getProcedure,
  updateProcedure,
  deleteProcedure,

  // Follow-Up Notes
  createFollowUpNote,
  getFollowUpNote,
  updateFollowUpNote,
  deleteFollowUpNote,

  // Vaccine Catalog
  getActiveVaccines,
  getAllVaccines,
  getVaccineById,
  createVaccine,
  updateVaccine,
  activateVaccine,
  deactivateVaccine,
  deleteVaccine,
};

export default ehrApi;
