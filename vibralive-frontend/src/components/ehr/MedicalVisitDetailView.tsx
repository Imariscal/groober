import { useState, useEffect } from 'react';
import { Appointment } from '@/types';
import { PetMedicalHistory } from '@/types/ehr';
import { CreateMedicalVisitDto, VisitType } from '@/types/ehr';
import { ehrApi } from '@/api/ehr-api';
import { appointmentsApi } from '@/lib/appointments-api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { MdAdd, MdError, MdRefresh, MdMedicalServices, MdArrowBack, MdCheckCircle } from 'react-icons/md';
import { useRouter } from 'next/navigation';
 
import { PrescriptionsTab } from './PrescriptionsTab';
import { VaccinationsTab } from './VaccinationsTab';
import { AllergiesTab } from './AllergiesTab';
import { DiagnosticsTab } from './DiagnosticsTab';
import { ProceduresTab } from './ProceduresTab';
import { FollowUpNotesTab } from './FollowUpNotesTab';

/**
 * Componente principal para ver el historial médico unificado de una mascota
 * 
 * Modos:
 * - 'capture': Permite EDITAR formulario de visita, completar cita, crear datos
 * - 'view': Solo lectura, sin formulario de captura, sin botón completar
 * 
 * Features:
 * - Tabs para cada sección (Prescripciones, Vacunas, Alergias, Diagnósticos)
 * - Cada tab muestra datos READ-ONLY
 * - Botón "Agregar" por tab para abrir modales de CRUD
 * - Carga datos de toda la historia médica de la mascota
 */
export function MedicalVisitDetailView({ 
  appointment, 
  mode = 'capture' 
}: { 
  appointment: Appointment;
  mode?: 'capture' | 'view';
}) {
  // Extract petId from either appointment.pet_id or appointment.pet?.id
  const petId = appointment.pet_id || appointment.pet?.id;
  const router = useRouter();
  const { user } = useAuth();
  
  // Check appointment status for conditional rendering
  const appointmentStatus = appointment.status;
  const isCancelled = appointmentStatus === 'CANCELLED';
  const isCompleted = appointmentStatus === 'COMPLETED';
  const isEditable = !isCancelled && !isCompleted;
  
  // Early return for cancelled appointments
  if (isCancelled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-6 -m-6 lg:-m-4">
        <div className="bg-white rounded-lg shadow-xl border border-red-200 p-12 text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-red-700 mb-2">Cita Cancelada</h1>
          <div className="border-b-2 border-red-200 my-6"></div>
          <p className="text-lg text-red-600 mb-6 font-semibold">Esta cita ha sido cancelada</p>
          <p className="text-slate-600 mb-6">No es posible completar información en una cita cancelada.</p>
          {appointment.cancelled_at && (
            <p className="text-sm text-slate-500 mb-6">
              Fecha de cancelación: {new Date(appointment.cancelled_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">
              💡 Por favor, cree una nueva cita si necesita registrar información médica.
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2"
          >
            <MdArrowBack size={20} />
            Atrás
          </button>
        </div>
      </div>
    );
  }
  
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'vaccinations' | 'allergies' | 'diagnostics' | 'procedures' | 'followup'>('prescriptions');
  
  const [medicalHistory, setMedicalHistory] = useState<PetMedicalHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewVisit, setIsNewVisit] = useState(false);
  const [isUpdatingExistingVisit, setIsUpdatingExistingVisit] = useState(false);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [isCompletingVisit, setIsCompletingVisit] = useState(false);

  // Form state for inline capture
  const [formData, setFormData] = useState<CreateMedicalVisitDto>({
    visitType: 'CHECKUP',
    reasonForVisit: undefined,
    chiefComplaint: '',
    weight: undefined,
    temperature: undefined,
    heartRate: undefined,
    respiratoryRate: undefined,
    bloodPressure: undefined,
    bodyConditionScore: 5,
    coatCondition: undefined,
    generalNotes: '',
    preliminaryDiagnosis: '',
    treatmentPlan: '',
    followUpRequired: false,
    petId: petId || '',
    appointmentId: appointment.id,
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [formLoading, setFormLoading] = useState(false);

  // Cargar datos médicos de la mascota
  useEffect(() => {
    const loadMedicalHistory = async () => {
      console.log('[MedicalVisitDetailView] loadMedicalHistory started:', { 
        petId,
        appointmentId: appointment.id,
      });
      
      if (!petId) {
        console.warn('[MedicalVisitDetailView] No pet_id found, skipping load');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('[MedicalVisitDetailView] Fetching medical history for petId:', petId);
        const data = await ehrApi.getPetMedicalHistory(petId);
        console.log('[MedicalVisitDetailView] ✅ Successfully loaded medical history:', data);
        console.log('[MedicalVisitDetailView] 📊 medicalVisits:', data?.medicalVisits);
        console.log('[MedicalVisitDetailView] 📊 medicalVisits.length:', data?.medicalVisits?.length);
        
        // Check if THIS APPOINTMENT has a medical visit associated
        // (Not whether the pet has any prior visits)
        const currentMedicalVisit = data?.medicalVisits?.find(
          (visit) => visit.appointmentId === appointment.id
        );
        const isThisAppointmentNew = !currentMedicalVisit;
        
        console.log('[MedicalVisitDetailView] ✅ isThisAppointmentNew:', isThisAppointmentNew);
        
        // Load ALL history data for signos vitales, vacunas, alergias, estudios, procedimientos, seguimientos
        // Set full data without filtering - we'll handle "no prescriptions shown" at the Tab level
        console.log('[MedicalVisitDetailView] 📋 Loaded full history');
        setMedicalHistory(data);
        setIsNewVisit(isThisAppointmentNew);
      } catch (err: any) {
        console.error('[MedicalVisitDetailView] Error loading medical history:', err);
        
        // Si hay un error, pero tenemos datos de la cita y mascota,
        // creamos un objeto medicalHistory vacío para mostrar el formulario
        // (es una cita nueva que nunca ha tenido historial médico)
        if (appointment.pet) {
          console.log('[MedicalVisitDetailView] Creating empty medical history for new visit');
          const emptyHistory: PetMedicalHistory = {
            pet: {
              id: appointment.pet.id || petId || '',
              name: appointment.pet.name || 'Mascota',
              species: appointment.pet.species || 'UNKNOWN',
              breed: appointment.pet.breed || '',
              dateOfBirth: appointment.pet.date_of_birth ? new Date(appointment.pet.date_of_birth) : undefined,
            },
            medicalVisits: [],
            prescriptions: [],
            vaccinations: [],
            allergies: [],
            diagnosticOrders: [],
            totalVisits: 0,
            lastVisitDate: undefined,
            overdueVaccinations: [],
            activePrescriptions: [],
            knownAllergies: [],
          };
          setMedicalHistory(emptyHistory);
          setIsNewVisit(true);
          setError(null); // No mostrar error, es esperado para citas nuevas
          console.log('[MedicalVisitDetailView] Empty history set, showing capture form');
        } else {
          // Sin datos de mascota, mostrar error
          const errorMsg = err?.message || 'Error al cargar información de la mascota';
          setError(errorMsg);
          console.error('[MedicalVisitDetailView] Cannot create empty history, no pet data:', errorMsg);
          toast.error(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    loadMedicalHistory();
  }, [petId]);

  // Callback para refrescar datos después de crear/actualizar
  const handleDataUpdated = async () => {
    if (!petId) return;
    
    try {
      const data = await ehrApi.getPetMedicalHistory(petId);
      
      // Load full history without filtering - allows new prescriptions to save
      setMedicalHistory(data);
      
      // Check if this appointment has a medical visit
      const currentMedicalVisit = data?.medicalVisits?.find(
        (visit) => visit.appointmentId === appointment.id
      );
      setIsNewVisit(!currentMedicalVisit);
      
      toast.success('Datos actualizados');
    } catch (err) {
      toast.error('Error al actualizar datos');
    }
  };

  // Completar visita médica y cita
  const handleCompleteVisit = async () => {
    try {
      setIsCompletingVisit(true);
      
      // Si hay una visita médica, actualizar su estado
      if (medicalHistory?.medicalVisits && medicalHistory.medicalVisits.length > 0) {
        const medicalVisit = medicalHistory.medicalVisits[0];
        
        // Cambiar el estado de medical_visit a SIGNED con el veterinario asignado
        await ehrApi.updateMedicalVisitStatus(
          medicalVisit.id,
          'COMPLETED',
          appointment.assigned_staff_user_id  // El veterinario que atendió
        );
      }
      
      // Completar la cita (appointment) pasando el usuario actual
      await appointmentsApi.completeAppointment(appointment.id, user?.id);
      
      // Actualizar el estado local
      toast.success('✅ Visita completada correctamente');
      
      // Redirigir a la lista de citas médicas
      setTimeout(() => {
        router.push('/clinic/visits');
      }, 800);
    } catch (err: any) {
      console.error('Error completing visit:', err);
      toast.error(err?.message || 'Error al completar la visita');
    } finally {
      setIsCompletingVisit(false);
    }
  };

  // Pre-cargar datos SOLO si estamos editando la visita actual de esta cita (NO de visitas previas)
  useEffect(() => {
    if (isEditable && medicalHistory?.medicalVisits && medicalHistory.medicalVisits.length > 0) {
      // Buscar una visita médica que tiene el MISMO appointmentId (es decir, estamos editando la visita de ESTA cita)
      const currentMedicalVisit = medicalHistory.medicalVisits.find(
        (visit) => visit.appointmentId === appointment.id
      );
      
      if (currentMedicalVisit) {
        // Solo pre-cargar si encontramos la visita de ESTA cita
        console.log('[MedicalVisitDetailView] Found existing medical visit for this appointment, pre-loading data');
        
        setFormData((prev) => ({
          ...prev,
          visitType: (currentMedicalVisit.reasonForVisit || 'CHECKUP') as any,
          chiefComplaint: currentMedicalVisit.chiefComplaint || '',
          weight: currentMedicalVisit.weight,
          temperature: currentMedicalVisit.temperature,
          heartRate: currentMedicalVisit.heartRate,
          respiratoryRate: currentMedicalVisit.respiratoryRate,
          bloodPressure: currentMedicalVisit.bloodPressure,
          bodyConditionScore: currentMedicalVisit.bodyConditionScore || 5,
          coatCondition: currentMedicalVisit.coatCondition || '',
          generalNotes: currentMedicalVisit.generalNotes || '',
          preliminaryDiagnosis: currentMedicalVisit.preliminaryDiagnosis || '',
          treatmentPlan: currentMedicalVisit.treatmentPlan || '',
          followUpRequired: currentMedicalVisit.followUpRequired || false,
        }));
        
        setEditingVisitId(currentMedicalVisit.id);
        setIsUpdatingExistingVisit(true);
        console.log('[MedicalVisitDetailView] Pre-loaded form data from current visit:', currentMedicalVisit);
      } else {
        // NO pre-cargar datos de visitas anteriores - Esta es una cita NUEVA
        console.log('[MedicalVisitDetailView] No medical visit found for this appointment - NEW VISIT, keeping form empty');
        setIsUpdatingExistingVisit(false);
      }
    } else {
      setIsUpdatingExistingVisit(false);
    }
  }, [isEditable, medicalHistory?.medicalVisits, appointment.id]);

  // Form handlers for inline capture
  const handleFormChange = (field: keyof CreateMedicalVisitDto, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.visitType) newErrors.visitType = 'Requerido';
    // chiefComplaint not required anymore - it's optional
    if (!formData.weight || formData.weight <= 0) newErrors.weight = 'Debe ser > 0';
    if (!formData.temperature || formData.temperature < 35 || formData.temperature > 42) {
      newErrors.temperature = 'Rango: 35-42°C';
    }
    if (!formData.heartRate || formData.heartRate < 40 || formData.heartRate > 300) {
      newErrors.heartRate = 'Rango: 40-300 bpm';
    }
    if (!formData.respiratoryRate || formData.respiratoryRate < 5 || formData.respiratoryRate > 100) {
      newErrors.respiratoryRate = 'Rango: 5-100 rpm';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrige los errores');
      return;
    }

    try {
      setFormLoading(true);
      
      // Preparar payload: solo incluir campos no vacíos para opcional
      const payload: CreateMedicalVisitDto = {
        visitType: formData.visitType,
        petId: formData.petId,
        appointmentId: formData.appointmentId,
        reasonForVisit: formData.reasonForVisit && formData.reasonForVisit.trim() ? formData.reasonForVisit : undefined,
        chiefComplaint: formData.chiefComplaint && formData.chiefComplaint.trim() ? formData.chiefComplaint : undefined,
        weight: formData.weight && formData.weight > 0 ? formData.weight : undefined,
        temperature: formData.temperature && formData.temperature > 0 ? formData.temperature : undefined,
        heartRate: formData.heartRate && formData.heartRate > 0 ? formData.heartRate : undefined,
        respiratoryRate: formData.respiratoryRate && formData.respiratoryRate > 0 ? formData.respiratoryRate : undefined,
        bloodPressure: formData.bloodPressure && formData.bloodPressure.trim() ? formData.bloodPressure : undefined,
        bodyConditionScore: formData.bodyConditionScore,
        coatCondition: formData.coatCondition && formData.coatCondition.trim() ? formData.coatCondition : undefined,
        generalNotes: formData.generalNotes && formData.generalNotes.trim() ? formData.generalNotes : undefined,
        preliminaryDiagnosis: formData.preliminaryDiagnosis && formData.preliminaryDiagnosis.trim() ? formData.preliminaryDiagnosis : undefined,
        treatmentPlan: formData.treatmentPlan && formData.treatmentPlan.trim() ? formData.treatmentPlan : undefined,
        followUpRequired: formData.followUpRequired,
      };
      
      // Si está editando una visita existente, usar update; si no, crear nueva
      if (isUpdatingExistingVisit && editingVisitId) {
        await ehrApi.updateMedicalVisit(editingVisitId, payload);
        toast.success('Visita médica actualizada exitosamente');
      } else {
        await ehrApi.createMedicalVisit(payload);
        toast.success('Visita médica creada exitosamente');
      }
      // Reload medical history
      await handleDataUpdated();
      // Reset form
      setFormData({
        visitType: 'CHECKUP',
        reasonForVisit: undefined,
        chiefComplaint: '',
        weight: undefined,
        temperature: undefined,
        heartRate: undefined,
        respiratoryRate: undefined,
        bloodPressure: undefined,
        bodyConditionScore: 5,
        coatCondition: undefined,
        generalNotes: '',
        preliminaryDiagnosis: '',
        treatmentPlan: '',
        followUpRequired: false,
        petId: petId || '',
        appointmentId: appointment.id,
      });
      setEditingVisitId(null);
      setIsUpdatingExistingVisit(false);
    } catch (err: any) {
      console.error('Error creating medical visit:', err);
      toast.error(err?.message || 'Error al crear visita');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin text-primary-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-slate-600">Cargando historial médico...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <MdError size={32} className="text-red-500 mx-auto mb-2" />
        <p className="text-red-800 font-semibold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2 mx-auto"
        >
          <MdRefresh size={18} />
          Reintentar
        </button>
      </div>
    );
  }

  if (!medicalHistory) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <MdError size={32} className="text-yellow-600 mx-auto mb-2" />
        <p className="text-yellow-800 font-semibold">No se pudo cargar el historial médico</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 flex items-center gap-2 mx-auto"
        >
          <MdRefresh size={18} />
          Reintentar
        </button>
      </div>
    );
  }

  // Tabs navigation
  // TODO: OCULTO - Tab 'Historial Clínico' deshabilitado pero código se guarda para usarlo en otro lugar
  
  // Get current medical visit ID - only for EXISTING appointments
  // For NEW appointments: no medical visit yet, so prescriptions should be empty
  let currentMedicalVisitId: string | undefined;
  let currentVisitPrescriptions: Prescription[];
  
  if (isNewVisit) {
    // ✅ CITA NUEVA: No mostrar prescripciones de citas anteriores
    currentMedicalVisitId = undefined;
    currentVisitPrescriptions = [];
  } else {
    // ✅ CITA EXISTENTE: Filtrar prescripciones de ESTA visita (coincidiendo appointmentId)
    const currentVisitData = medicalHistory?.medicalVisits?.find(
      (visit) => visit.appointmentId === appointment.id
    );
    currentMedicalVisitId = currentVisitData?.id;
    currentVisitPrescriptions = (medicalHistory?.prescriptions || []).filter(
      (rx) => rx.medicalVisitId === currentMedicalVisitId
    );
  }
  
  if (currentMedicalVisitId) {
    console.log('[MedicalVisitDetailView] 💊 Prescription Filter Debug:', {
      currentMedicalVisitId,
      totalPrescriptions: medicalHistory?.prescriptions?.length || 0,
      filteredPrescriptions: currentVisitPrescriptions.length,
      prescriptions: medicalHistory?.prescriptions?.map(rx => ({
        id: rx.id,
        medicalVisitId: rx.medicalVisitId,
        name: rx.medicationName,
        matches: rx.medicalVisitId === currentMedicalVisitId
      }))
    });
  }
  
  const tabs = [
    // { id: 'history', label: '📋 Historial Clínico', count: medicalHistory.medicalVisits?.length || 0 }, // OCULTADO TEMPORALMENTE
    { id: 'prescriptions', label: '💊 Prescripciones', count: currentVisitPrescriptions.length }, // ✅ Contar solo de ESTA cita
    { id: 'vaccinations', label: '💉 Vacunas', count: medicalHistory.vaccinations?.length || 0 },
    { id: 'allergies', label: '⚠️ Alergias', count: medicalHistory.allergies?.length || 0 },
    { id: 'diagnostics', label: '🔬 Estudios', count: medicalHistory.diagnosticOrders?.length || 0 },
    { id: 'procedures', label: '🏥 Procedimientos', count: medicalHistory.medicalVisits?.[0]?.procedures?.length || 0 },
    { id: 'followup', label: '📝 Seguimiento', count: medicalHistory.medicalVisits?.[0]?.followUpNotes?.length || 0 },
  ] as const;

  // Check if this is a new pet without any medical history
  const hasNoPriorHistory = !medicalHistory.medicalVisits || medicalHistory.medicalVisits.length === 0;

  console.log('[MedicalVisitDetailView] 🔍 RENDER CHECK:');
  console.log('  - isNewVisit:', isNewVisit);
  console.log('  - medicalHistory is set:', !!medicalHistory);
  console.log('  - hasNoPriorHistory:', hasNoPriorHistory);
  console.log('  - Condition (isNewVisit && medicalHistory):', isNewVisit && medicalHistory);

  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
      {/* Header - Exactly like pets/page.tsx */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="p-1 hover:bg-slate-100 rounded transition"
                title="Atrás"
              >
                <MdArrowBack className="w-5 h-5 text-slate-600" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <MdMedicalServices className="text-primary-600 text-3xl" />
                Visita Médica
              </h1>
            </div>

          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDataUpdated}
              disabled={isCompletingVisit}
              className="p-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 rounded-lg transition"
              title="Actualizar"
            >
              <MdRefresh className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Appointment Info Bar */}
        <div className="flex flex-wrap gap-3 mt-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-sm">
              <span className="text-blue-600">📋 Mascota:</span>
              <span className="font-semibold text-blue-700">{medicalHistory.pet.name}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg text-sm">
              <span className="text-purple-600">👤 Cliente:</span>
              <span className="font-semibold text-purple-700">{appointment.client?.name || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg text-sm">
              <span className="text-green-600">📅 Fecha:</span>
              <span className="font-semibold text-green-700">
                {appointment.scheduled_at ? new Date(appointment.scheduled_at).toLocaleDateString('es-ES') : 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg text-sm">
              <span className="text-orange-600">🕐 Hora:</span>
              <span className="font-semibold text-orange-700">
                {appointment.scheduled_at ? new Date(appointment.scheduled_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
              </span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${isCompleted ? 'bg-green-50 border border-green-200 text-green-700' : isEditable ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'bg-slate-50 border border-slate-200 text-slate-700'}`}>
              <span>{isCompleted ? '✅ Completada' : isEditable ? '⏳ En Progreso' : '❓ ' + (appointmentStatus || 'Desconocido')}</span>
            </div>
          </div>
          {isEditable && mode === 'capture' && (
            <button
              onClick={handleCompleteVisit}
              disabled={isCompletingVisit}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition font-semibold whitespace-nowrap"
              title="Completar visita médica y cita"
            >
              <MdCheckCircle className="w-5 h-5" />
              Completar Visita
            </button>
          )}
        </div>
      </div>

      {/* Main Content - Layout (2 cols en capture, 1 en view) */}
      <div className="p-6">
        <div className={`grid gap-6 ${mode === 'capture' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Left Column - Medical Visit Capture Form (33%) - Solo en modo capture */}
          {mode === 'capture' && (
          <div className="lg:col-span-1">
            {isCompleted && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6 sticky top-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">✅</span>
                  <h3 className="text-lg font-semibold text-green-700">Cita Completada</h3>
                </div>
                <p className="text-sm text-green-600 mb-4">
                  Esta cita ya ha sido completada. La información se muestra en modo solo lectura.
                </p>
                {appointment.updated_at && (
                  <p className="text-xs text-green-600 mt-4 pt-4 border-t border-green-200">
                    Actualizada el {new Date(appointment.updated_at).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>
            )}
            {isEditable && (
              <div className="bg-white rounded-lg border border-slate-200 p-6 sticky top-6 max-h-[calc(100vh-120px)] flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📝</span>
                  <h3 className="text-lg font-semibold text-slate-900">{isUpdatingExistingVisit ? 'Editar Visita' : hasNoPriorHistory ? 'Nueva Visita' : 'Información Médica'}</h3>
                </div>
                
                <form onSubmit={handleFormSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2">
                  {/* Información Básica */}
                  <section className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">Tipo de Visita</label>
                    <select
                      value={formData.visitType}
                      onChange={(e) =>
                        handleFormChange('visitType', e.target.value as VisitType)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    >
                      <option value="CHECKUP">🔍 Revisión General</option>
                      <option value="VACCINATION">💉 Vacunación</option>
                      <option value="SURGERY">🏥 Cirugía</option>
                      <option value="CONSULTATION">🩺 Consulta</option>
                      <option value="FOLLOWUP">⏰ Seguimiento</option>
                      <option value="EMERGENCY">🚨 Emergencia</option>
                    </select>
                    {formErrors.visitType && (
                      <p className="text-xs text-red-500">{formErrors.visitType}</p>
                    )}
                  </section>

                  <section className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">Motivo Principal</label>
                    <input
                      type="text"
                      value={formData.chiefComplaint || ''}
                      onChange={(e) => handleFormChange('chiefComplaint', e.target.value)}
                      placeholder="Ej: Revisión rutinaria"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                    {formErrors.chiefComplaint && (
                      <p className="text-xs text-red-500">{formErrors.chiefComplaint}</p>
                    )}
                  </section>

                  {/* Signos Vitales + Condición - 2 Columnas */}
                  <section className="space-y-3 pt-3 border-t border-slate-200">
                    <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">Signos Vitales & Condición</label>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Peso (kg) *</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.weight || ''}
                          onChange={(e) => handleFormChange('weight', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                        />
                        {formErrors.weight && <p className="text-xs text-red-500">{formErrors.weight}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Temperatura (°C) *</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.temperature || ''}
                          onChange={(e) => handleFormChange('temperature', parseFloat(e.target.value) || 37)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                        />
                        {formErrors.temperature && <p className="text-xs text-red-500">{formErrors.temperature}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Frec. Cardíaca (bpm) *</label>
                        <input
                          type="number"
                          value={formData.heartRate || ''}
                          onChange={(e) => handleFormChange('heartRate', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                        />
                        {formErrors.heartRate && <p className="text-xs text-red-500">{formErrors.heartRate}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Frec. Respiratoria (rpm) *</label>
                        <input
                          type="number"
                          value={formData.respiratoryRate || ''}
                          onChange={(e) => handleFormChange('respiratoryRate', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                        />
                        {formErrors.respiratoryRate && <p className="text-xs text-red-500">{formErrors.respiratoryRate}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Presión Arterial</label>
                        <input
                          type="text"
                          placeholder="Ej: 120/80"
                          value={formData.bloodPressure || ''}
                          onChange={(e) => handleFormChange('bloodPressure', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Body Condition (1-9)</label>
                        <input
                          type="number"
                          min="1"
                          max="9"
                          value={formData.bodyConditionScore || 5}
                          onChange={(e) => handleFormChange('bodyConditionScore', parseInt(e.target.value) || 5)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Estado del Pelaje</label>
                        <input
                          type="text"
                          placeholder="Ej: Normal, brillante"
                          value={formData.coatCondition || ''}
                          onChange={(e) => handleFormChange('coatCondition', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Notas Clínicas */}
                  <section className="space-y-3 pt-3 border-t border-slate-200">
                    <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">Notas Clínicas</label>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Hallazgos del Examen</label>
                      <textarea
                        value={formData.generalNotes || ''}
                        onChange={(e) => handleFormChange('generalNotes', e.target.value)}
                        placeholder="Comportamiento, signos, mucosas..."
                        rows={2}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Diagnóstico Preliminar</label>
                      <textarea
                        value={formData.preliminaryDiagnosis || ''}
                        onChange={(e) => handleFormChange('preliminaryDiagnosis', e.target.value)}
                        placeholder="Diagnóstico probable..."
                        rows={2}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Plan de Tratamiento</label>
                      <textarea
                        value={formData.treatmentPlan || ''}
                        onChange={(e) => handleFormChange('treatmentPlan', e.target.value)}
                        placeholder="Medicamentos, recomendaciones..."
                        rows={2}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm resize-none"
                      />
                    </div>
                  </section>

                  {/* Seguimiento */}
                  <section className="space-y-3 pt-3 border-t border-slate-200 pb-20">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.followUpRequired}
                        onChange={(e) => handleFormChange('followUpRequired', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <span className="text-sm font-medium text-slate-700">Requiere Seguimiento</span>
                    </label>
                  </section>
                </form>

                {/* Submit Button - Fixed at bottom */}
                <button
                  type="submit"
                  onClick={handleFormSubmit}
                  disabled={formLoading}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition text-sm font-medium flex items-center justify-center gap-2 mt-4"
                >
                  <MdAdd size={18} />
                  {formLoading ? 'Guardando...' : isUpdatingExistingVisit ? 'Actualizar Visita' : 'Guardar Visita'}
                </button>
              </div>
            )}
            
            {/* When there is prior history and is NOT editable, show a summary card */}
            {!hasNoPriorHistory && !isEditable && (
              <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg border border-primary-200 p-6 sticky top-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📋</span>
                  <h3 className="text-lg font-semibold text-slate-900">Información</h3>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="bg-white rounded p-3 border border-slate-200">
                    <p className="text-slate-500 text-xs uppercase tracking-wide font-semibold">Nombre</p>
                    <p className="text-slate-900 font-semibold mt-1">{medicalHistory.pet.name}</p>
                  </div>
                  
                  <div className="bg-white rounded p-3 border border-slate-200">
                    <p className="text-slate-500 text-xs uppercase tracking-wide font-semibold">Cliente</p>
                    <p className="text-slate-900 font-semibold mt-1">{appointment.client?.name || 'N/A'}</p>
                  </div>
                  
                  <div className="bg-white rounded p-3 border border-slate-200">
                    <p className="text-slate-500 text-xs uppercase tracking-wide font-semibold">Visitas Previas</p>
                    <p className="text-slate-900 font-semibold mt-1">{medicalHistory.medicalVisits?.length || 0}</p>
                  </div>

                  <div className="bg-white rounded p-3 border border-slate-200">
                    <p className="text-slate-500 text-xs uppercase tracking-wide font-semibold">Última Visita</p>
                    <p className="text-slate-900 font-semibold mt-1">
                      {medicalHistory.lastVisitDate 
                        ? new Date(medicalHistory.lastVisitDate).toLocaleDateString('es-ES')
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Right Column - Tabs and Content (66% en capture, 100% en view) */}
          <div className={`space-y-4 ${mode === 'capture' ? 'lg:col-span-2' : 'col-span-1'}`} style={isCompleted && mode === 'capture' ? { opacity: 0.8 } : {}}>
            {/* Tabs Navigation */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition min-w-max
                      ${
                        activeTab === tab.id
                          ? 'border-primary-600 text-primary-600 bg-primary-50'
                          : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }
                    `}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${
                      activeTab === tab.id
                        ? 'bg-primary-200 text-primary-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              {/* OCULTADO - MedicalHistoryTab se preserva para usarlo en otro lugar
              {activeTab === 'history' && (
                <MedicalHistoryTab
                  medicalVisits={medicalHistory.medicalVisits || []}
                  appointmentId={appointment.id}
                  petId={petId || ''}
                  onDataUpdated={handleDataUpdated}
                />
              )}
              */}

              {activeTab === 'prescriptions' && (
                <PrescriptionsTab
                  prescriptions={currentVisitPrescriptions} // ✅ Only show prescriptions from current visit
                  petId={petId || ''}
                  medicalVisitId={currentMedicalVisitId || appointment.id}
                  currentMedicalVisitId={currentMedicalVisitId} // ✅ Pass current visit ID for edit/delete control
                  onDataUpdated={handleDataUpdated}
                />
              )}

              {activeTab === 'vaccinations' && (
                <VaccinationsTab
                  vaccinations={medicalHistory.vaccinations || []}
                  overdueVaccinations={medicalHistory.overdueVaccinations || []}
                  petId={petId || ''}
                  onDataUpdated={handleDataUpdated}
                />
              )}

              {activeTab === 'allergies' && (
                <AllergiesTab
                  allergies={medicalHistory.allergies || []}
                  petId={petId || ''}
                  onDataUpdated={handleDataUpdated}
                />
              )}

              {activeTab === 'diagnostics' && (
                <DiagnosticsTab
                  diagnosticOrders={medicalHistory.diagnosticOrders || []}
                  petId={petId || ''}
                  medicalVisitId={currentMedicalVisitId || appointment.id}
                  currentMedicalVisitId={currentMedicalVisitId} // ✅ Pass current visit ID to differentiate current vs previous
                  onDataUpdated={handleDataUpdated}
                />
              )}

              {activeTab === 'procedures' && (
                <ProceduresTab
                  procedures={medicalHistory.medicalVisits?.[0]?.procedures || []}
                  petId={petId || ''}
                  medicalVisitId={medicalHistory.medicalVisits?.[0]?.id || appointment.id}
                  currentMedicalVisitId={currentMedicalVisitId} // ✅ Pass current visit ID to differentiate current vs previous
                  onProcedureAdd={handleDataUpdated}
                  onProcedureUpdate={handleDataUpdated}
                  onProcedureDelete={handleDataUpdated}
                />
              )}

              {activeTab === 'followup' && (
                <FollowUpNotesTab
                  petId={petId || ''}
                  medicalVisitId={medicalHistory.medicalVisits?.[0]?.id || appointment.id}
                  currentMedicalVisitId={currentMedicalVisitId} // ✅ Pass current visit ID to differentiate current vs previous
                  initialFollowUpRequired={formData.followUpRequired}
                  notes={medicalHistory.medicalVisits?.[0]?.followUpNotes || []}
                  onFollowUpUpdate={handleDataUpdated}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
