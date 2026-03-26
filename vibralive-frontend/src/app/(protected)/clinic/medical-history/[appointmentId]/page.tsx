'use client';

import {
  MdArrowBack,
  MdRefresh,
  MdDownload,
  MdPrint,
  MdMedicalServices,
  MdCheckCircle,
  MdError,
  MdNoMeetingRoom,
  MdTrendingUp,
  MdTrendingDown,
  MdFavoriteBorder,
  MdThermostat,
  MdAir,
  MdMonitorWeight,
} from 'react-icons/md';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MdExpandMore, MdExpandLess, MdCalendarToday, MdContentCut, MdWarning, MdNotes } from 'react-icons/md';
import { toast } from 'sonner';
import { ehrApi } from '@/api/ehr-api';
import { appointmentsApi } from '@/lib/appointments-api';
import { Appointment } from '@/types';
import { PetMedicalHistory } from '@/types/ehr';

export default function MedicalHistoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.appointmentId as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<PetMedicalHistory | null>(null);
  const [medicalVisit, setMedicalVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVitals, setExpandedVitals] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  useEffect(() => {
    loadExpediente();
  }, [appointmentId]);

  const loadUpcomingAppointments = async () => {
    if (!appointment?.pet_id && !appointment?.pet?.id) return;
    
    try {
      setLoadingAppointments(true);
      const petId = appointment.pet_id || appointment.pet?.id;
      // Usar la API de appointments para obtener próximas citas
      const response = await appointmentsApi.getAppointments({ pet_id: petId });
      const allAppointments = response?.data || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Filtrar solo citas futuras
      const upcoming = allAppointments
        .filter((apt: any) => {
          const aptDate = new Date(apt.scheduled_at);
          return aptDate >= today && apt.id !== appointmentId;
        })
        .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
        .slice(0, 10);
      
      setUpcomingAppointments(upcoming);
    } catch (err) {
      console.error('Error loading upcoming appointments:', err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const loadExpediente = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Cargar datos de la cita
      const apt = await appointmentsApi.getAppointment(appointmentId);
      setAppointment(apt);

      if (!apt || (!apt.pet_id && !apt.pet?.id)) {
        setError('No se encontró información de la mascota en esta cita');
        setLoading(false);
        return;
      }

      const petId = apt.pet_id || apt.pet?.id || '';

      // 2. Cargar historial médico de la mascota
      const medHistory = await ehrApi.getPetMedicalHistory(petId);
      setMedicalHistory(medHistory);

      // 3. Buscar la visita médica específica para este appointment
      const visit = medHistory?.medicalVisits?.find((v: any) => v.appointmentId === appointmentId);
      if (visit) {
        setMedicalVisit(visit);
      } else if (apt.status === 'COMPLETED') {
        // Si está completada pero no tiene visita médica registrada, mostrar aviso
        console.log('Cita completada pero sin datos médicos registrados');
      }
      
      // 4. Cargar próximas citas
      loadUpcomingAppointments();
    } catch (err: any) {
      console.error('Error loading expediente:', err);
      setError(err?.message || 'Error al cargar el expediente médico');
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    toast.info('Función de exportación en desarrollo');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center -m-6 lg:-m-4">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin text-primary-600">
            <MdRefresh className="w-8 h-8" />
          </div>
          <p className="text-slate-600">Cargando expediente médico...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg border border-red-200 p-12 text-center max-w-md">
          <MdError className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-red-700 mb-2">Error</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Atrás
          </button>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg border border-yellow-200 p-12 text-center max-w-md">
          <MdNoMeetingRoom className="w-16 h-16 mx-auto text-yellow-600 mb-4" />
          <h1 className="text-2xl font-bold text-yellow-700 mb-2">No encontrada</h1>
          <p className="text-yellow-600 mb-6">La cita solicitada no existe</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition"
          >
            Atrás
          </button>
        </div>
      </div>
    );
  }

  const petName = appointment.pet?.name || 'N/A';
  const clientName = appointment.client?.name || 'N/A';
  const veterinarian = (appointment as any).assigned_staff?.name || 'No asignado';
  const visitDate = appointment.scheduled_at ? new Date(appointment.scheduled_at) : new Date();

  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 hover:bg-slate-100 rounded transition"
              title="Atrás"
            >
              <MdArrowBack className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MdMedicalServices className="text-primary-600 text-3xl" />
              Expediente Médico
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadExpediente}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              title="Actualizar"
            >
              <MdRefresh className="w-5 h-5" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition hidden md:block"
              title="Imprimir"
            >
              <MdPrint className="w-5 h-5" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition hidden md:block"
              title="Descargar"
            >
              <MdDownload className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>



      {/* Contenido - Layout 3 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
        {/* COLUMNA IZQUIERDA - Info mascota y vitales rápidos */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tarjeta Mascota */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl mx-auto mb-2">🐾</div>
              <h2 className="text-xl font-bold text-slate-900">{petName}</h2>
              <p className="text-sm text-slate-600 mt-1">Cliente: {clientName}</p>
            </div>
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">📅 Cita:</span>
                <span className="font-semibold text-slate-900">{visitDate.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">👨‍⚕️ Vet:</span>
                <span className="font-semibold text-slate-900">{veterinarian}</span>
              </div>
            </div>
          </div>

          {/* Signos Vitales - Acordeón */}
          {medicalVisit && (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setExpandedVitals(!expandedVitals)}
                className="w-full p-6 hover:bg-slate-50 transition flex items-center justify-between"
              >
                <h3 className="font-bold text-slate-900 text-sm uppercase">📊 Signos Vitales</h3>
                {expandedVitals ? (
                  <MdExpandLess className="w-5 h-5 text-slate-600" />
                ) : (
                  <MdExpandMore className="w-5 h-5 text-slate-600" />
                )}
              </button>

              {expandedVitals && (
                <div className="border-t border-slate-200 p-6 space-y-4">
                  {/* Vitales rápidos en lista */}
                  <div className="space-y-3 mb-6">
                    {medicalVisit.weight && (
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <span className="text-xs text-slate-600 flex items-center gap-2">
                          <MdMonitorWeight className="w-4 h-4 text-blue-600" /> Peso
                        </span>
                        <span className="font-bold text-slate-900">{medicalVisit.weight} kg</span>
                      </div>
                    )}
                    {medicalVisit.temperature && (
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <span className="text-xs text-slate-600 flex items-center gap-2">
                          <MdThermostat className="w-4 h-4 text-red-600" /> Temp
                        </span>
                        <span className={`font-bold ${medicalVisit.temperature >= 38 ? 'text-red-600' : 'text-slate-900'}`}>
                          {medicalVisit.temperature}°C
                        </span>
                      </div>
                    )}
                    {medicalVisit.heartRate && (
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <span className="text-xs text-slate-600 flex items-center gap-2">
                          <MdFavoriteBorder className="w-4 h-4 text-pink-600" /> FC
                        </span>
                        <span className="font-bold text-slate-900">{medicalVisit.heartRate} bpm</span>
                      </div>
                    )}
                    {medicalVisit.respiratoryRate && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 flex items-center gap-2">
                          <MdAir className="w-4 h-4 text-green-600" /> FR
                        </span>
                        <span className="font-bold text-slate-900">{medicalVisit.respiratoryRate} rpm</span>
                      </div>
                    )}
                  </div>

                  {/* Gráfica simple de última semana (si hay datos históricos) */}
                  {medicalHistory?.medicalVisits && medicalHistory.medicalVisits.length > 1 && (
                    <div className="pt-6 border-t border-slate-200">
                      <p className="text-xs font-bold text-slate-600 mb-3 uppercase">Tendencia de Peso (últimas 5 visitas)</p>
                      <div className="h-24 flex items-end gap-2 bg-slate-50 p-3 rounded">
                        {medicalHistory.medicalVisits
                          .slice(0, 5)
                          .reverse()
                          .map((visit, idx) => {
                            const maxWeight = Math.max(
                              ...medicalHistory.medicalVisits
                                .slice(0, 5)
                                .map((v: any) => v.weight || 0)
                            );
                            const height = visit.weight ? (visit.weight / maxWeight) * 100 : 0;
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center justify-end">
                                <div
                                  className="w-full bg-emerald-500 rounded-t transition hover:bg-emerald-600"
                                  style={{ height: `${Math.max(height, 10)}%` }}
                                  title={`${visit.weight}kg`}
                                />
                                <p className="text-xs text-slate-600 mt-1">{visit.weight || '-'}</p>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLUMNA CENTRO - Secciones principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Alergias Card */}
          {medicalHistory?.allergies && medicalHistory.allergies.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                <MdWarning className="w-5 h-5 text-red-600" /> Alergias
              </h3>
              <div className="space-y-3">
                {medicalHistory.allergies.map((allergy, idx) => (
                  <div key={idx} className="py-2 border-b border-slate-100 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-slate-900 text-sm">{allergy.medicationName}</p>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ${
                          allergy.severity === 'SEVERE'
                            ? 'bg-red-100 text-red-700'
                            : allergy.severity === 'MODERATE'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {allergy.severity === 'SEVERE' && '⚠️ Grave'}
                        {allergy.severity === 'MODERATE' && '⚡ Moderada'}
                        {allergy.severity === 'MILD' && '⚠️ Leve'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      {allergy.reaction && (
                        <p className="text-slate-700">
                          <span className="font-semibold text-slate-600">Reacción:</span> {allergy.reaction}
                        </p>
                      )}
                      {allergy.notes && <p className="text-slate-600">{allergy.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnóstico y Notas */}
          {medicalVisit?.preliminaryDiagnosis ? (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 uppercase text-sm tracking-wide flex items-center gap-2">
                <MdNotes className="text-slate-600" /> Diagnóstico y Notas
              </h3>
              <div className="space-y-4">
                {medicalVisit.preliminaryDiagnosis && (
                  <div className="pb-4 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-600 mb-2 uppercase">Diagnóstico Preliminar</p>
                    <p className="text-sm text-slate-700">{medicalVisit.preliminaryDiagnosis}</p>
                  </div>
                )}
                {medicalVisit.generalNotes && (
                  <div className="pb-4 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-600 mb-2 uppercase">Notas Clínicas</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{medicalVisit.generalNotes}</p>
                  </div>
                )}
                {medicalVisit.treatmentPlan && (
                  <div className="pb-4 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-600 mb-2 uppercase">Plan de Tratamiento</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{medicalVisit.treatmentPlan}</p>
                  </div>
                )}
                {medicalVisit.finalDiagnosis && (
                  <div className="pb-4 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-600 mb-2 uppercase">Diagnóstico Final</p>
                    <p className="text-sm text-slate-700">{medicalVisit.finalDiagnosis}</p>
                  </div>
                )}
                {medicalVisit.prognosis && (
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-2 uppercase">Pronóstico</p>
                    <p className="text-sm text-slate-700">{medicalVisit.prognosis}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
              <p className="text-slate-600 text-sm">No hay diagnóstico o notas registrados</p>
            </div>
          )}

          {/* Prescripciones */}
          {medicalHistory?.prescriptions && medicalHistory.prescriptions.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">💊 Prescripciones</h3>
              <div className="space-y-3">
                {medicalHistory.prescriptions.map((prescription: any, index: number) => (
                  <div key={index} className="py-2 border-b border-slate-100 last:border-b-0">
                    <p className="font-semibold text-slate-900 text-sm mb-2">{prescription.medicationName}</p>
                    <div className="grid grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-600 font-semibold">Dosis:</span>
                        <p className="text-slate-900 mt-1">{prescription.dosage}</p>
                      </div>
                      <div>
                        <span className="text-slate-600 font-semibold">Frecuencia:</span>
                        <p className="text-slate-900 mt-1">{prescription.frequency}</p>
                      </div>
                      <div>
                        <span className="text-slate-600 font-semibold">Duración:</span>
                        <p className="text-slate-900 mt-1">{prescription.duration}</p>
                      </div>
                      {prescription.instructions && (
                        <div>
                          <span className="text-slate-600 font-semibold">Instrucciones:</span>
                          <p className="text-slate-700 mt-1">{prescription.instructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vacunas */}
          {medicalHistory?.vaccinations && medicalHistory.vaccinations.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">💉 Vacunas</h3>
              <div className="space-y-2">
                {medicalHistory.vaccinations.map((vaccination: any, index: number) => {
                  const today = new Date();
                  const expirationDate = vaccination.expirationDate ? new Date(vaccination.expirationDate) : null;
                  const isExpired = expirationDate && expirationDate < today;
                  const daysUntilExpiration = expirationDate ? Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                  const isAboutToExpire = daysUntilExpiration && daysUntilExpiration <= 30 && daysUntilExpiration > 0;

                  let badgeClass = 'bg-green-100 text-green-700';
                  let badgeText = '✓ Vigente';

                  if (isExpired) {
                    badgeClass = 'bg-red-100 text-red-700';
                    badgeText = '✗ Vencida';
                  } else if (isAboutToExpire) {
                    badgeClass = 'bg-orange-100 text-orange-700';
                    badgeText = `${daysUntilExpiration}d`;
                  }

                  return (
                    <div key={index} className="py-2 border-b border-slate-100 last:border-b-0 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{vaccination.vaccineName}</p>
                        <div className="grid grid-cols-2 gap-6 mt-1 text-xs text-slate-600">
                          <span>Aplicada: {new Date(vaccination.dateAdministered).toLocaleDateString('es-ES')}</span>
                          <span>Vence: {vaccination.expirationDate ? new Date(vaccination.expirationDate).toLocaleDateString('es-ES') : 'N/A'}</span>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ${badgeClass}`}>{badgeText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Estudios */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 uppercase text-sm tracking-wide">📊 Estudios</h3>
            {medicalHistory?.diagnosticOrders && medicalHistory.diagnosticOrders.length > 0 ? (
              <div className="space-y-2">
                {medicalHistory.diagnosticOrders.map((order: any, index: number) => (
                  <div key={index} className="py-2 border-b border-slate-100 last:border-b-0 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm mb-1">{order.testName}</p>
                      <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
                        <span><span className="font-semibold">Tipo:</span> {order.testType}</span>
                        {order.reason && <span><span className="font-semibold">Motivo:</span> {order.reason}</span>}
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ${
                      order.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status === 'COMPLETED' ? '✅ Completado' : '⏳ Ordenado'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No hay estudios registrados</p>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA - Próximas Visitas */}
        <div className="lg:col-span-1 space-y-6">
          {/* Próximas Citas Médicas */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 uppercase text-sm tracking-wide flex items-center gap-2">
              <MdCalendarToday className="text-emerald-600" /> Próximas Citas
            </h3>
            {loadingAppointments ? (
              <p className="text-slate-500 text-xs">Cargando...</p>
            ) : upcomingAppointments && upcomingAppointments.filter((a: any) => a.type === 'MEDICAL' || a.type === 'CLINIC').length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments
                  .filter((a: any) => a.type === 'MEDICAL' || a.type === 'CLINIC')
                  .map((apt, idx) => (
                    <div
                      key={idx}
                      className="pb-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 -mx-2 px-2 py-2 rounded transition"
                    >
                      <p className="text-xs font-bold text-emerald-600 uppercase">📅 Médica</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {new Date(apt.scheduled_at).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {new Date(apt.scheduled_at).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {apt.notes && <p className="text-xs text-slate-600 mt-1 line-clamp-1">{apt.notes}</p>}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No hay próximas citas médicas</p>
            )}
          </div>

          {/* Próximas Citas de Grooming */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 uppercase text-sm tracking-wide flex items-center gap-2">
              <MdContentCut className="text-amber-600" /> Próximas Visitas Grooming
            </h3>
            {loadingAppointments ? (
              <p className="text-slate-500 text-xs">Cargando...</p>
            ) : upcomingAppointments && upcomingAppointments.filter((a: any) => a.type === 'GROOMING').length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments
                  .filter((a: any) => a.type === 'GROOMING')
                  .map((apt, idx) => (
                    <div
                      key={idx}
                      className="pb-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 -mx-2 px-2 py-2 rounded transition"
                    >
                      <p className="text-xs font-bold text-amber-600 uppercase">✂️ Grooming</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {new Date(apt.scheduled_at).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {new Date(apt.scheduled_at).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {apt.notes && <p className="text-xs text-slate-600 mt-1 line-clamp-1">{apt.notes}</p>}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No hay próximas visitas de grooming</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
