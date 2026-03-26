/**
 * 🏥 EHR Store - State Management con Zustand
 * Gestiona todo el estado del módulo de expediente médico electrónico
 * 
 * Patrón: Zustand store siguiendo el patrón de auth-store.ts
 * Estructura:
 * - State: Datos cacheados
 * - Actions: Métodos para actualizar estado
 * - Selectors: Getters computados
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { toast } from 'react-hot-toast';
import type {
  MedicalVisit,
  MedicalVisitDetail,
  MedicalVisitDiagnosis,
  Prescription,
  Vaccination,
  MedicationAllergy,
  DiagnosticOrder,
  PetMedicalHistory,
  CreateMedicalVisitDto,
  MedicalVisitStatus,
  UpdateMedicalVisitStatusDto,
  SignMedicalRecordDto,
  AddDiagnosisDto,
  CreatePrescriptionDto,
  RecordVaccinationDto,
  RecordAllergyDto,
  CreateDiagnosticOrderDto,
} from '@/types/ehr';
import * as ehrApi from '@/api/ehr-api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface EhrStore {
  // ========== MEDICAL VISITS STATE ==========
  medicalVisits: MedicalVisit[];
  selectedVisit: MedicalVisitDetail | null;
  isLoadingVisits: boolean;
  visitsError: string | null;

  // ========== PET MEDICAL DATA ==========
  petMedicalHistory: PetMedicalHistory | null;
  petPrescriptions: Prescription[];
  petVaccinations: Vaccination[];
  petAllergies: MedicationAllergy[];
  petOverdueVaccinations: Vaccination[];
  isLoadingPetData: boolean;
  petDataError: string | null;

  // ========== DIAGNOSTIC ORDERS STATE ==========
  diagnosticOrders: DiagnosticOrder[];
  isLoadingDiagnostics: boolean;
  diagnosticsError: string | null;

  // ========== UI STATE (MODALS) ==========
  showCreateVisitModal: boolean;
  showEditVisitModal: boolean;
  showDeleteConfirmation: boolean;
  editingVisit: MedicalVisit | null;
  deletingVisit: MedicalVisit | null;

  // ========== ACTIONS: MEDICAL VISITS ==========
  fetchMedicalVisits: (filters?: any) => Promise<void>;
  fetchMedicalVisit: (id: string) => Promise<void>;
  fetchPetMedicalVisits: (petId: string) => Promise<void>;
  createMedicalVisit: (data: CreateMedicalVisitDto) => Promise<MedicalVisit>;
  updateMedicalVisit: (id: string, data: Partial<CreateMedicalVisitDto>) => Promise<MedicalVisit>;
  updateMedicalVisitStatus: (id: string, status: MedicalVisitStatus) => Promise<MedicalVisit>;
  deleteMedicalVisit: (id: string) => Promise<void>;
  signMedicalRecord: (id: string, data: Omit<SignMedicalRecordDto, 'medicalVisitId'>) => Promise<MedicalVisit>;

  // ========== ACTIONS: DIAGNOSES ==========
  addDiagnosis: (visitId: string, data: Omit<AddDiagnosisDto, 'medicalVisitId'>) => Promise<MedicalVisitDiagnosis>;
  fetchDiagnosesByVisit: (visitId: string) => Promise<MedicalVisitDiagnosis[]>;
  updateDiagnosis: (visitId: string, diagnosisId: string, data: Partial<MedicalVisitDiagnosis>) => Promise<MedicalVisitDiagnosis>;
  deleteDiagnosis: (visitId: string, diagnosisId: string) => Promise<void>;

  // ========== ACTIONS: PRESCRIPTIONS ==========
  createPrescription: (data: CreatePrescriptionDto) => Promise<Prescription>;
  fetchActivePrescriptions: (petId: string) => Promise<void>;
  fetchAllPrescriptions: (petId: string) => Promise<void>;
  updatePrescription: (id: string, data: Partial<CreatePrescriptionDto>) => Promise<Prescription>;
  deletePrescription: (id: string) => Promise<void>;

  // ========== ACTIONS: VACCINATIONS ==========
  recordVaccination: (data: RecordVaccinationDto) => Promise<Vaccination>;
  fetchVaccinationSchedule: (petId: string) => Promise<void>;
  fetchOverdueVaccinations: (petId: string) => Promise<void>;
  updateVaccination: (id: string, data: Partial<RecordVaccinationDto>) => Promise<Vaccination>;
  deleteVaccination: (id: string) => Promise<void>;

  // ========== ACTIONS: ALLERGIES ==========
  recordAllergy: (data: RecordAllergyDto) => Promise<MedicationAllergy>;
  fetchAllergies: (petId: string) => Promise<void>;
  updateAllergy: (id: string, data: Partial<RecordAllergyDto>) => Promise<MedicationAllergy>;
  deleteAllergy: (id: string) => Promise<void>;

  // ========== ACTIONS: DIAGNOSTIC ORDERS ==========
  createDiagnosticOrder: (data: CreateDiagnosticOrderDto) => Promise<DiagnosticOrder>;
  fetchDiagnosticOrders: (visitId: string) => Promise<void>;
  markSampleCollected: (orderId: string) => Promise<DiagnosticOrder>;
  completeDiagnosticOrder: (orderId: string, resultsSummary?: string) => Promise<DiagnosticOrder>;
  cancelDiagnosticOrder: (orderId: string) => Promise<DiagnosticOrder>;

  // ========== ACTIONS: MEDICAL HISTORY ==========
  fetchPetMedicalHistory: (petId: string) => Promise<void>;
  exportMedicalHistoryPDF: (petId: string) => Promise<Blob>;

  // ========== ACTIONS: UI STATE ==========
  openCreateVisitModal: () => void;
  closeCreateVisitModal: () => void;
  openEditVisitModal: (visit: MedicalVisit) => void;
  closeEditVisitModal: () => void;
  openDeleteConfirmation: (visit: MedicalVisit) => void;
  closeDeleteConfirmation: () => void;

  // ========== RESET ==========
  reset: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState = {
  // Medical Visits
  medicalVisits: [],
  selectedVisit: null,
  isLoadingVisits: false,
  visitsError: null,

  // Pet Medical Data
  petMedicalHistory: null,
  petPrescriptions: [],
  petVaccinations: [],
  petAllergies: [],
  petOverdueVaccinations: [],
  isLoadingPetData: false,
  petDataError: null,

  // Diagnostic Orders
  diagnosticOrders: [],
  isLoadingDiagnostics: false,
  diagnosticsError: null,

  // UI State
  showCreateVisitModal: false,
  showEditVisitModal: false,
  showDeleteConfirmation: false,
  editingVisit: null,
  deletingVisit: null,
};

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const useEhrStore = create<EhrStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // ====================================================================
        // ACTIONS: MEDICAL VISITS
        // ====================================================================

        fetchMedicalVisits: async (filters?: any) => {
          set({ isLoadingVisits: true, visitsError: null });
          try {
            const response = await ehrApi.listMedicalVisits(filters);
            set({ medicalVisits: response.data });
          } catch (error: any) {
            const message = error.message || 'Error al cargar visitas médicas';
            set({ visitsError: message });
            toast.error(message);
          } finally {
            set({ isLoadingVisits: false });
          }
        },

        fetchMedicalVisit: async (id: string) => {
          set({ isLoadingVisits: true, visitsError: null });
          try {
            const visit = await ehrApi.getMedicalVisit(id);
            set({ selectedVisit: visit });
          } catch (error: any) {
            const message = error.message || 'Error al cargar visita médica';
            set({ visitsError: message });
            toast.error(message);
          } finally {
            set({ isLoadingVisits: false });
          }
        },

        fetchPetMedicalVisits: async (petId: string) => {
          set({ isLoadingVisits: true, visitsError: null });
          try {
            const visits = await ehrApi.listPetMedicalVisits(petId);
            set({ medicalVisits: visits });
          } catch (error: any) {
            const message = error.message || 'Error al cargar visitas de la mascota';
            set({ visitsError: message });
            toast.error(message);
          } finally {
            set({ isLoadingVisits: false });
          }
        },

        createMedicalVisit: async (data: CreateMedicalVisitDto) => {
          try {
            const newVisit = await ehrApi.createMedicalVisit(data);
            set((state) => ({
              medicalVisits: [newVisit, ...state.medicalVisits],
            }));
            toast.success('Visita médica creada exitosamente');
            get().closeCreateVisitModal();
            return newVisit;
          } catch (error: any) {
            const message = error.message || 'Error al crear visita médica';
            toast.error(message);
            throw error;
          }
        },

        updateMedicalVisit: async (id: string, data: Partial<CreateMedicalVisitDto>) => {
          try {
            const updatedVisit = await ehrApi.updateMedicalVisit(id, data);
            set((state) => ({
              medicalVisits: state.medicalVisits.map((v) =>
                v.id === id ? { ...v, ...updatedVisit } : v
              ),
              selectedVisit:
                state.selectedVisit?.id === id
                  ? { ...state.selectedVisit, ...updatedVisit }
                  : state.selectedVisit,
            }));
            toast.success('Visita médica actualizada exitosamente');
            get().closeEditVisitModal();
            return updatedVisit;
          } catch (error: any) {
            const message = error.message || 'Error al actualizar visita médica';
            toast.error(message);
            throw error;
          }
        },

        updateMedicalVisitStatus: async (id: string, status: MedicalVisitStatus) => {
          try {
            const updatedVisit = await ehrApi.updateMedicalVisitStatus(id, status);
            set((state) => ({
              medicalVisits: state.medicalVisits.map((v) =>
                v.id === id ? { ...v, status: updatedVisit.status } : v
              ),
              selectedVisit:
                state.selectedVisit?.id === id
                  ? { ...state.selectedVisit, status: updatedVisit.status }
                  : state.selectedVisit,
            }));
            toast.success(`Visita médica marcada como ${status}`);
            return updatedVisit;
          } catch (error: any) {
            const message = error.message || 'Error al cambiar estado de visita';
            toast.error(message);
            throw error;
          }
        },

        deleteMedicalVisit: async (id: string) => {
          try {
            await ehrApi.deleteMedicalVisit(id);
            set((state) => ({
              medicalVisits: state.medicalVisits.filter((v) => v.id !== id),
              selectedVisit:
                state.selectedVisit?.id === id ? null : state.selectedVisit,
            }));
            toast.success('Visita médica eliminada exitosamente');
            get().closeDeleteConfirmation();
          } catch (error: any) {
            const message = error.message || 'Error al eliminar visita médica';
            toast.error(message);
            throw error;
          }
        },

        signMedicalRecord: async (
          id: string,
          data: Omit<SignMedicalRecordDto, 'medicalVisitId'>
        ) => {
          try {
            const signedVisit = await ehrApi.signMedicalRecord(id, data);
            set((state) => ({
              medicalVisits: state.medicalVisits.map((v) =>
                v.id === id
                  ? { ...v, status: signedVisit.status, signedAt: signedVisit.signedAt }
                  : v
              ),
              selectedVisit:
                state.selectedVisit?.id === id
                  ? { ...state.selectedVisit, status: signedVisit.status, signedAt: signedVisit.signedAt }
                  : state.selectedVisit,
            }));
            toast.success('Registro médico firmado exitosamente');
            return signedVisit;
          } catch (error: any) {
            const message = error.message || 'Error al firmar registro médico';
            toast.error(message);
            throw error;
          }
        },

        // ====================================================================
        // ACTIONS: DIAGNOSES
        // ====================================================================

        addDiagnosis: async (
          visitId: string,
          data: Omit<AddDiagnosisDto, 'medicalVisitId'>
        ) => {
          try {
            const newDiagnosis = await ehrApi.addDiagnosis(visitId, data);
            if (get().selectedVisit?.id === visitId) {
              set((state) => ({
                selectedVisit: state.selectedVisit
                  ? {
                      ...state.selectedVisit,
                      diagnoses: [...(state.selectedVisit.diagnoses || []), newDiagnosis],
                    }
                  : null,
              }));
            }
            toast.success('Diagnóstico agregado exitosamente');
            return newDiagnosis;
          } catch (error: any) {
            const message = error.message || 'Error al agregar diagnóstico';
            toast.error(message);
            throw error;
          }
        },

        fetchDiagnosesByVisit: async (visitId: string) => {
          try {
            const diagnoses = await ehrApi.getDiagnosesByVisit(visitId);
            if (get().selectedVisit?.id === visitId) {
              set((state) => ({
                selectedVisit: state.selectedVisit
                  ? { ...state.selectedVisit, diagnoses }
                  : null,
              }));
            }
            return diagnoses;
          } catch (error: any) {
            const message = error.message || 'Error al cargar diagnósticos';
            toast.error(message);
            return [];
          }
        },

        updateDiagnosis: async (
          visitId: string,
          diagnosisId: string,
          data: Partial<MedicalVisitDiagnosis>
        ) => {
          try {
            const updatedDiagnosis = await ehrApi.updateDiagnosis(
              visitId,
              diagnosisId,
              data
            );
            if (get().selectedVisit?.id === visitId) {
              set((state) => ({
                selectedVisit: state.selectedVisit
                  ? {
                      ...state.selectedVisit,
                      diagnoses: (state.selectedVisit.diagnoses || []).map((d) =>
                        d.id === diagnosisId ? updatedDiagnosis : d
                      ),
                    }
                  : null,
              }));
            }
            toast.success('Diagnóstico actualizado exitosamente');
            return updatedDiagnosis;
          } catch (error: any) {
            const message = error.message || 'Error al actualizar diagnóstico';
            toast.error(message);
            throw error;
          }
        },

        deleteDiagnosis: async (visitId: string, diagnosisId: string) => {
          try {
            await ehrApi.deleteDiagnosis(visitId, diagnosisId);
            if (get().selectedVisit?.id === visitId) {
              set((state) => ({
                selectedVisit: state.selectedVisit
                  ? {
                      ...state.selectedVisit,
                      diagnoses: (state.selectedVisit.diagnoses || []).filter(
                        (d) => d.id !== diagnosisId
                      ),
                    }
                  : null,
              }));
            }
            toast.success('Diagnóstico eliminado exitosamente');
          } catch (error: any) {
            const message = error.message || 'Error al eliminar diagnóstico';
            toast.error(message);
            throw error;
          }
        },

        // ====================================================================
        // ACTIONS: PRESCRIPTIONS
        // ====================================================================

        createPrescription: async (data: CreatePrescriptionDto) => {
          try {
            const newPrescription = await ehrApi.createPrescription(data);
            set((state) => ({
              petPrescriptions: [newPrescription, ...state.petPrescriptions],
            }));
            toast.success('Prescripción creada exitosamente');
            return newPrescription;
          } catch (error: any) {
            const message = error.message || 'Error al crear prescripción';
            toast.error(message);
            throw error;
          }
        },

        fetchActivePrescriptions: async (petId: string) => {
          set({ isLoadingPetData: true, petDataError: null });
          try {
            const prescriptions = await ehrApi.getActivePrescriptions(petId);
            set({ petPrescriptions: prescriptions });
          } catch (error: any) {
            const message = error.message || 'Error al cargar prescripciones activas';
            set({ petDataError: message });
            toast.error(message);
          } finally {
            set({ isLoadingPetData: false });
          }
        },

        fetchAllPrescriptions: async (petId: string) => {
          set({ isLoadingPetData: true, petDataError: null });
          try {
            const prescriptions = await ehrApi.getAllPrescriptions(petId);
            set({ petPrescriptions: prescriptions });
          } catch (error: any) {
            const message = error.message || 'Error al cargar prescripciones';
            set({ petDataError: message });
            toast.error(message);
          } finally {
            set({ isLoadingPetData: false });
          }
        },

        updatePrescription: async (
          id: string,
          data: Partial<CreatePrescriptionDto>
        ) => {
          try {
            const updatedPrescription = await ehrApi.updatePrescription(id, data);
            set((state) => ({
              petPrescriptions: state.petPrescriptions.map((p) =>
                p.id === id ? updatedPrescription : p
              ),
            }));
            toast.success('Prescripción actualizada exitosamente');
            return updatedPrescription;
          } catch (error: any) {
            const message = error.message || 'Error al actualizar prescripción';
            toast.error(message);
            throw error;
          }
        },

        deletePrescription: async (id: string) => {
          try {
            await ehrApi.deletePrescription(id);
            set((state) => ({
              petPrescriptions: state.petPrescriptions.filter((p) => p.id !== id),
            }));
            toast.success('Prescripción eliminada exitosamente');
          } catch (error: any) {
            const message = error.message || 'Error al eliminar prescripción';
            toast.error(message);
            throw error;
          }
        },

        // ====================================================================
        // ACTIONS: VACCINATIONS
        // ====================================================================

        recordVaccination: async (data: RecordVaccinationDto) => {
          try {
            const newVaccination = await ehrApi.recordVaccination(data);
            set((state) => ({
              petVaccinations: [newVaccination, ...state.petVaccinations],
            }));
            toast.success('Vacunación registrada exitosamente');
            return newVaccination;
          } catch (error: any) {
            const message = error.message || 'Error al registrar vacunación';
            toast.error(message);
            throw error;
          }
        },

        fetchVaccinationSchedule: async (petId: string) => {
          set({ isLoadingPetData: true, petDataError: null });
          try {
            const vaccinations = await ehrApi.getVaccinationSchedule(petId);
            set({ petVaccinations: vaccinations });
          } catch (error: any) {
            const message = error.message || 'Error al cargar cronograma de vacunas';
            set({ petDataError: message });
            toast.error(message);
          } finally {
            set({ isLoadingPetData: false });
          }
        },

        fetchOverdueVaccinations: async (petId: string) => {
          try {
            const overdue = await ehrApi.getOverdueVaccinations(petId);
            set({ petOverdueVaccinations: overdue });
          } catch (error: any) {
            const message = error.message || 'Error al cargar vacunas vencidas';
            toast.error(message);
          }
        },

        updateVaccination: async (
          id: string,
          data: Partial<RecordVaccinationDto>
        ) => {
          try {
            const updatedVaccination = await ehrApi.updateVaccination(id, data);
            set((state) => ({
              petVaccinations: state.petVaccinations.map((v) =>
                v.id === id ? updatedVaccination : v
              ),
            }));
            toast.success('Vacunación actualizada exitosamente');
            return updatedVaccination;
          } catch (error: any) {
            const message = error.message || 'Error al actualizar vacunación';
            toast.error(message);
            throw error;
          }
        },

        deleteVaccination: async (id: string) => {
          try {
            await ehrApi.deleteVaccination(id);
            set((state) => ({
              petVaccinations: state.petVaccinations.filter((v) => v.id !== id),
            }));
            toast.success('Vacunación eliminada exitosamente');
          } catch (error: any) {
            const message = error.message || 'Error al eliminar vacunación';
            toast.error(message);
            throw error;
          }
        },

        // ====================================================================
        // ACTIONS: ALLERGIES
        // ====================================================================

        recordAllergy: async (data: RecordAllergyDto) => {
          try {
            const newAllergy = await ehrApi.recordAllergy(data);
            set((state) => ({
              petAllergies: [newAllergy, ...state.petAllergies],
            }));
            toast.success('Alergia registrada exitosamente');
            return newAllergy;
          } catch (error: any) {
            const message = error.message || 'Error al registrar alergia';
            toast.error(message);
            throw error;
          }
        },

        fetchAllergies: async (petId: string) => {
          set({ isLoadingPetData: true, petDataError: null });
          try {
            const allergies = await ehrApi.getAllergies(petId);
            set({ petAllergies: allergies });
          } catch (error: any) {
            const message = error.message || 'Error al cargar alergias';
            set({ petDataError: message });
            toast.error(message);
          } finally {
            set({ isLoadingPetData: false });
          }
        },

        updateAllergy: async (id: string, data: Partial<RecordAllergyDto>) => {
          try {
            const updatedAllergy = await ehrApi.updateAllergy(id, data);
            set((state) => ({
              petAllergies: state.petAllergies.map((a) =>
                a.id === id ? updatedAllergy : a
              ),
            }));
            toast.success('Alergia actualizada exitosamente');
            return updatedAllergy;
          } catch (error: any) {
            const message = error.message || 'Error al actualizar alergia';
            toast.error(message);
            throw error;
          }
        },

        deleteAllergy: async (id: string) => {
          try {
            await ehrApi.deleteAllergy(id);
            set((state) => ({
              petAllergies: state.petAllergies.filter((a) => a.id !== id),
            }));
            toast.success('Alergia eliminada exitosamente');
          } catch (error: any) {
            const message = error.message || 'Error al eliminar alergia';
            toast.error(message);
            throw error;
          }
        },

        // ====================================================================
        // ACTIONS: DIAGNOSTIC ORDERS
        // ====================================================================

        createDiagnosticOrder: async (data: CreateDiagnosticOrderDto) => {
          try {
            const newOrder = await ehrApi.createDiagnosticOrder(data);
            set((state) => ({
              diagnosticOrders: [newOrder, ...state.diagnosticOrders],
            }));
            toast.success('Orden diagnóstica creada exitosamente');
            return newOrder;
          } catch (error: any) {
            const message = error.message || 'Error al crear orden diagnóstica';
            toast.error(message);
            throw error;
          }
        },

        fetchDiagnosticOrders: async (visitId: string) => {
          set({ isLoadingDiagnostics: true, diagnosticsError: null });
          try {
            const orders = await ehrApi.getDiagnosticOrdersByVisit(visitId);
            set({ diagnosticOrders: orders });
          } catch (error: any) {
            const message = error.message || 'Error al cargar órdenes diagnósticas';
            set({ diagnosticsError: message });
            toast.error(message);
          } finally {
            set({ isLoadingDiagnostics: false });
          }
        },

        markSampleCollected: async (orderId: string) => {
          try {
            const updatedOrder = await ehrApi.markSampleAsCollected(orderId);
            set((state) => ({
              diagnosticOrders: state.diagnosticOrders.map((o) =>
                o.id === orderId ? updatedOrder : o
              ),
            }));
            toast.success('Muestra marcada como recolectada');
            return updatedOrder;
          } catch (error: any) {
            const message = error.message || 'Error al marcar muestra';
            toast.error(message);
            throw error;
          }
        },

        completeDiagnosticOrder: async (orderId: string, resultsSummary?: string) => {
          try {
            const completedOrder = await ehrApi.completeDiagnosticOrder(
              orderId,
              resultsSummary
            );
            set((state) => ({
              diagnosticOrders: state.diagnosticOrders.map((o) =>
                o.id === orderId ? completedOrder : o
              ),
            }));
            toast.success('Orden diagnóstica completada');
            return completedOrder;
          } catch (error: any) {
            const message = error.message || 'Error al completar orden diagnóstica';
            toast.error(message);
            throw error;
          }
        },

        cancelDiagnosticOrder: async (orderId: string) => {
          try {
            const canceledOrder = await ehrApi.cancelDiagnosticOrder(orderId);
            set((state) => ({
              diagnosticOrders: state.diagnosticOrders.map((o) =>
                o.id === orderId ? canceledOrder : o
              ),
            }));
            toast.success('Orden diagnóstica cancelada');
            return canceledOrder;
          } catch (error: any) {
            const message = error.message || 'Error al cancelar orden diagnóstica';
            toast.error(message);
            throw error;
          }
        },

        // ====================================================================
        // ACTIONS: MEDICAL HISTORY
        // ====================================================================

        fetchPetMedicalHistory: async (petId: string) => {
          set({ isLoadingPetData: true, petDataError: null });
          try {
            const history = await ehrApi.getPetMedicalHistory(petId);
            set({
              petMedicalHistory: history,
              petPrescriptions: history.activePrescriptions,
              petVaccinations: history.vaccinations,
              petAllergies: history.allergies,
              petOverdueVaccinations: history.overdueVaccinations,
            });
          } catch (error: any) {
            const message = error.message || 'Error al cargar historial médico';
            set({ petDataError: message });
            toast.error(message);
          } finally {
            set({ isLoadingPetData: false });
          }
        },

        exportMedicalHistoryPDF: async (petId: string) => {
          try {
            const blob = await ehrApi.exportMedicalHistoryPDF(petId);
            // Crear descarga automática
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `historial-medico-${petId}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success('Historial médico exportado exitosamente');
            return blob;
          } catch (error: any) {
            const message = error.message || 'Error al exportar historial médico';
            toast.error(message);
            throw error;
          }
        },

        // ====================================================================
        // ACTIONS: UI STATE
        // ====================================================================

        openCreateVisitModal: () => {
          set({ showCreateVisitModal: true });
        },

        closeCreateVisitModal: () => {
          set({ showCreateVisitModal: false });
        },

        openEditVisitModal: (visit: MedicalVisit) => {
          set({ editingVisit: visit, showEditVisitModal: true });
        },

        closeEditVisitModal: () => {
          set({ editingVisit: null, showEditVisitModal: false });
        },

        openDeleteConfirmation: (visit: MedicalVisit) => {
          set({ deletingVisit: visit, showDeleteConfirmation: true });
        },

        closeDeleteConfirmation: () => {
          set({ deletingVisit: null, showDeleteConfirmation: false });
        },

        // ====================================================================
        // RESET
        // ====================================================================

        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'ehr-store', // Key para localStorage (opcional)
        partialize: (state) => ({
          // Opcional: persistir solo ciertos valores
          // Aquí persistimos todo excepto modales y loading states
          medicalVisits: state.medicalVisits,
          petMedicalHistory: state.petMedicalHistory,
        }),
      }
    )
  )
);

// ============================================================================
// SELECTORS (Funciones helper para acceder a estado computado)
// ============================================================================

export const selectMedicalVisits = (state: EhrStore) => state.medicalVisits;
export const selectSelectedVisit = (state: EhrStore) => state.selectedVisit;
export const selectIsLoadingVisits = (state: EhrStore) => state.isLoadingVisits;
export const selectVisitsError = (state: EhrStore) => state.visitsError;

export const selectPetMedicalHistory = (state: EhrStore) =>
  state.petMedicalHistory;
export const selectPetPrescriptions = (state: EhrStore) =>
  state.petPrescriptions;
export const selectPetVaccinations = (state: EhrStore) =>
  state.petVaccinations;
export const selectPetAllergies = (state: EhrStore) => state.petAllergies;
export const selectPetOverdueVaccinations = (state: EhrStore) =>
  state.petOverdueVaccinations;
export const selectIsLoadingPetData = (state: EhrStore) =>
  state.isLoadingPetData;

export const selectDiagnosticOrders = (state: EhrStore) =>
  state.diagnosticOrders;
export const selectIsLoadingDiagnostics = (state: EhrStore) =>
  state.isLoadingDiagnostics;

export const selectShowCreateVisitModal = (state: EhrStore) =>
  state.showCreateVisitModal;
export const selectShowEditVisitModal = (state: EhrStore) =>
  state.showEditVisitModal;
export const selectEditingVisit = (state: EhrStore) => state.editingVisit;
export const selectShowDeleteConfirmation = (state: EhrStore) =>
  state.showDeleteConfirmation;
export const selectDeletingVisit = (state: EhrStore) => state.deletingVisit;
