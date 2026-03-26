'use client';

import {
  MdArrowBack,
  MdRefresh,
  MdSearch,
  MdFilterList,
  MdMedicalServices,
  MdCalendarToday,
  MdPets,
  MdPerson,
  MdCheckCircle,
  MdError,
  MdDownload,
  MdPrint,
} from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ehrApi } from '@/api/ehr-api';
import { appointmentsApi } from '@/lib/appointments-api';
import { clinicUsersApi } from '@/api/clinic-users-api';
import { useAuthStore } from '@/store/auth-store';
import { Appointment } from '@/types';
import { PetMedicalHistory } from '@/types/ehr';

interface MedicalHistoryRecord {
  appointmentId: string;
  petName: string;
  petId: string;
  clientName: string;
  clientId: string;
  visitDate: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'DRAFT';
  veterinarian?: string;
  diagnosis?: string;
  prescriptions: number;
  vaccinations: number;
  diagnostics: number;
  notes?: string;
}

export default function MedicalHistoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const clinicId = user?.clinic_id;
  
  const [records, setRecords] = useState<MedicalHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'DRAFT'>('COMPLETED');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedRecord, setSelectedRecord] = useState<MedicalHistoryRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userCache, setUserCache] = useState<Map<string, string>>(new Map());

  // Obtener nombre del usuario por ID (con caché)
  const getUserName = async (userId: string | null | undefined): Promise<string> => {
    if (!userId) return 'N/A';
    
    // Verificar caché
    if (userCache.has(userId)) {
      return userCache.get(userId) || 'N/A';
    }
    
    try {
      const user = await clinicUsersApi.getUser(userId);
      const userName = (user as any).name || (user as any).email || 'N/A';
      
      // Guardar en caché
      setUserCache((prev) => new Map(prev).set(userId, userName));
      return userName;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      return 'N/A';
    }
  };

  // Cargar expedientes médicos
  useEffect(() => {
    if (clinicId) {
      loadMedicalHistory();
    }
  }, [filterStatus, dateFrom, dateTo, clinicId]);

  const loadMedicalHistory = async () => {
    try {
      setLoading(true);

      // Obtener citas según filtros
      const filters: any = {
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
        startDate: dateFrom || undefined,
        endDate: dateTo || undefined,
      };

      const response = await appointmentsApi.getAppointments(filters);
      const appointments = response.data || response;

      // Enriquecer con datos médicos
      const enrichedRecords: MedicalHistoryRecord[] = [];

      for (const apt of appointments) {
        // Solo incluir citas de tipo MEDICAL, no GROOMING
        if ((apt as any).service_type !== 'MEDICAL') {
          continue;
        }

        try {
          // Obtener historial médico de la mascota
          if (apt.pet_id || apt.pet?.id) {
            const petId = (apt.pet_id || apt.pet?.id)!;
            const medicalHistory = await ehrApi.getPetMedicalHistory(petId);

            // Buscar la visita correspondiente a este appointment
            const visit = medicalHistory?.medicalVisits?.find(
              (v: any) => v.appointmentId === apt.id
            );
            
            // Obtener nombre del veterinario
            const veterinarianName = await getUserName((apt as any).assigned_staff_user_id);

            if (visit) {
              // Filtrar prescripciones, vacunas y diagnósticos para esta visita específica
              const visitPrescriptions = medicalHistory.prescriptions?.filter(
                (p: any) => p.appointmentId === apt.id || p.medicalVisitId === visit.id
              ) || [];
              const visitVaccinations = medicalHistory.vaccinations?.filter(
                (v: any) => v.appointmentId === apt.id || v.medicalVisitId === visit.id
              ) || [];
              const visitDiagnostics = medicalHistory.diagnosticOrders?.filter(
                (d: any) => d.appointmentId === apt.id || d.medicalVisitId === visit.id
              ) || [];

              enrichedRecords.push({
                appointmentId: apt.id,
                petName: apt.pet?.name || 'N/A',
                petId: petId!,
                clientName: apt.client?.name || 'N/A',
                clientId: apt.client?.id || '',
                visitDate: apt.scheduled_at || new Date().toISOString(),
                status: apt.status as 'COMPLETED' | 'IN_PROGRESS' | 'DRAFT',
                veterinarian: veterinarianName,
                diagnosis: (visit as any).diagnosis || '',
                prescriptions: visitPrescriptions.length,
                vaccinations: visitVaccinations.length,
                diagnostics: visitDiagnostics.length,
                notes: (visit as any).notes || '',
              });
            } else if (apt.status === 'COMPLETED') {
              // Si existe cita completada pero sin visita médica registrada
              enrichedRecords.push({
                appointmentId: apt.id,
                petName: apt.pet?.name || 'N/A',
                petId: petId!,
                clientName: apt.client?.name || 'N/A',
                clientId: apt.client?.id || '',
                visitDate: apt.scheduled_at || new Date().toISOString(),
                status: 'COMPLETED' as const,
                veterinarian: veterinarianName,
                diagnosis: '',
                prescriptions: 0,
                vaccinations: 0,
                diagnostics: 0,
                notes: 'Cita completada sin datos médicos registrados',
              });
            }
          }
        } catch (error) {
          console.error(`Error loading medical history for appointment ${apt.id}:`, error);
          // Continuar con el siguiente appointment
        }
      }

      setRecords(enrichedRecords);
    } catch (error: any) {
      console.error('Error loading medical history:', error);
      toast.error(error?.message || 'Error al cargar el historial médico');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.petName.toLowerCase().includes(searchLower) ||
      record.clientName.toLowerCase().includes(searchLower) ||
      (record.diagnosis && record.diagnosis.toLowerCase().includes(searchLower))
    );
  });

  // Columnas para la tabla
  const tableColumns = [
    {
      key: 'visitDate',
      header: '📅 Fecha',
      render: (value: string) => new Date(value).toLocaleDateString('es-ES'),
    },
    {
      key: 'petName',
      header: '🐾 Mascota',
      render: (value: string) => <span className="font-semibold">{value}</span>,
    },
    {
      key: 'clientName',
      header: '👤 Cliente',
      render: (value: string) => value,
    },
    {
      key: 'veterinarian',
      header: '👨‍⚕️ Veterinario',
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'status',
      header: '✅ Estado',
      render: (value: string) => {
        const statusStyles: Record<string, string> = {
          COMPLETED: 'bg-green-100 text-green-800',
          IN_PROGRESS: 'bg-blue-100 text-blue-800',
          DRAFT: 'bg-gray-100 text-gray-800',
        };
        return (
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusStyles[value] || 'bg-gray-100'}`}>
            {value === 'COMPLETED' ? '✅ Completada' : value === 'IN_PROGRESS' ? '⏳ En Progreso' : '📝 Borrador'}
          </span>
        );
      },
    },
    {
      key: 'diagnostics',
      header: '📋 Estudios',
      render: (value: number) => <span className="text-center font-semibold">{value}</span>,
    },
    {
      key: 'prescriptions',
      header: '💊 Recetas',
      render: (value: number) => <span className="text-center font-semibold">{value}</span>,
    },
    {
      key: 'vaccinations',
      header: '💉 Vacunas',
      render: (value: number) => <span className="text-center font-semibold">{value}</span>,
    },
  ];

  const handleRowClick = (record: MedicalHistoryRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleViewDetail = (record: MedicalHistoryRecord) => {
    // Navegar a la vista detallada del expediente
    router.push(`/clinic/medical-history/${record.appointmentId}`);
  };

  const handleExport = () => {
    toast.info('Función de exportación en desarrollo');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MdMedicalServices className="text-primary-600 text-3xl" />
              Historial Médico
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Consulta el historial de visitasmédicas de las mascotas
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadMedicalHistory}
              disabled={loading}
              className="p-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 rounded-lg transition"
              title="Actualizar"
            >
              <MdRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
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

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
            <MdSearch className="text-slate-500" />
            <span className="text-slate-600">Total:</span>
            <span className="font-semibold">{filteredRecords.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg text-sm">
            <MdCheckCircle className="text-green-600" />
            <span className="text-green-700">Completadas:</span>
            <span className="font-semibold text-green-700">
              {filteredRecords.filter((r) => r.status === 'COMPLETED').length}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-sm">
            <MdSearch className="text-blue-600" />
            <span className="text-blue-700">Estudios:</span>
            <span className="font-semibold text-blue-700">
              {filteredRecords.reduce((sum, r) => sum + r.diagnostics, 0)}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-lg text-sm">
            <MdMedicalServices className="text-yellow-600" />
            <span className="text-yellow-700">Recetas:</span>
            <span className="font-semibold text-yellow-700">
              {filteredRecords.reduce((sum, r) => sum + r.prescriptions, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Filters */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
                <MdSearch className="text-slate-400 w-4 h-4 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar mascota..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-none focus:outline-none focus:ring-0 text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <MdFilterList className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Estado</span>
              </div>
              <div className="space-y-2">
                {(['ALL', 'COMPLETED', 'IN_PROGRESS', 'DRAFT'] as any[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                      filterStatus === status
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {status === 'ALL' && '⚙️ Todos'}
                    {status === 'COMPLETED' && '✅ Completadas'}
                    {status === 'IN_PROGRESS' && '⏳ En Progreso'}
                    {status === 'DRAFT' && '📝 Borradores'}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <label className="text-sm font-medium text-slate-700 block mb-3">
                Rango de Fechas
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  title="Desde"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  title="Hasta"
                />
              </div>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setSearchTerm('');
                setFilterStatus('COMPLETED');
              }}
              className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm font-semibold"
            >
              <MdFilterList className="w-4 h-4 inline mr-2" />
              Limpiar Filtros
            </button>
          </div>

          {/* Right Panel - Medical Records */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin text-primary-600">
                      <MdRefresh className="w-8 h-8" />
                    </div>
                    <p className="text-slate-600">Cargando historial médico...</p>
                  </div>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="p-12 text-center">
                  <MdMedicalServices className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <h2 className="text-xl font-semibold text-slate-700 mb-2">Sin resultados</h2>
                  <p className="text-slate-600">
                    No se encontraron expedientes médicos con los filtros especificados.
                  </p>
                </div>
              ) : (
                <>
                  {/* Tabla */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {tableColumns.map((col) => (
                            <th
                              key={col.key}
                              className="px-6 py-3 text-left text-sm font-semibold text-slate-700"
                            >
                              {col.header}
                            </th>
                          ))}
                          <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.map((record, index) => (
                          <tr
                            key={record.appointmentId}
                            className="border-b border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                          >
                            {tableColumns.map((col) => (
                              <td
                                key={col.key}
                                className="px-6 py-4 text-sm"
                                onClick={() => handleRowClick(record)}
                              >
                                {(col as any).render((record as any)[col.key] ?? '')}
                              </td>
                            ))}
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetail(record);
                                }}
                                className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
                              >
                                Ver Detalle →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de preview rápido */}
      {isModalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                📋 {selectedRecord.petName} - {new Date(selectedRecord.visitDate).toLocaleDateString('es-ES')}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-200 rounded transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Cliente</p>
                  <p className="font-semibold text-slate-900">{selectedRecord.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Mascota</p>
                  <p className="font-semibold text-slate-900">{selectedRecord.petName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Veterinario</p>
                  <p className="font-semibold text-slate-900">{selectedRecord.veterinarian || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Estado</p>
                  <p className="font-semibold">
                    {selectedRecord.status === 'COMPLETED' ? '✅ Completada' : '⏳ En Progreso'}
                  </p>
                </div>
              </div>

              {selectedRecord.diagnosis && (
                <div>
                  <p className="text-sm text-slate-600">Diagnóstico</p>
                  <p className="text-slate-900">{selectedRecord.diagnosis}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{selectedRecord.diagnostics}</p>
                  <p className="text-sm text-slate-600">Estudios</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{selectedRecord.prescriptions}</p>
                  <p className="text-sm text-slate-600">Recetas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedRecord.vaccinations}</p>
                  <p className="text-sm text-slate-600">Vacunas</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    handleViewDetail(selectedRecord);
                  }}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  Ver Expediente Completo →
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-2 rounded-lg transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
