'use client';

import { MedicalVisit } from '@/types/ehr';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MdAdd, MdVisibility } from 'react-icons/md';
import { useState } from 'react';
import { CreateMedicalVisitModal } from '@/components/ehr/modals/CreateMedicalVisitModal';
import { EditMedicalVisitModal } from '@/components/EditMedicalVisitModal';

interface MedicalHistoryTabProps {
  medicalVisits: MedicalVisit[];
  appointmentId: string;
  petId: string;
  onDataUpdated: () => Promise<void>;
}

export function MedicalHistoryTab({
  medicalVisits,
  appointmentId,
  petId,
  onDataUpdated,
}: MedicalHistoryTabProps) {
  const [showNewVisitForm, setShowNewVisitForm] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<MedicalVisit | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (medicalVisits.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">No hay visitas médicas registradas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">
          Historial Clínico ({medicalVisits.length})
        </h3>
      </div>

      {/* Visits Timeline */}
      <div className="space-y-3">
        {medicalVisits.map((visit, index) => (
          <div
            key={visit.id}
            className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-900">
                    {visit.reasonForVisit === 'CHECKUP' && '🔍 Revisión General'}
                    {visit.reasonForVisit === 'VACCINATION' && '💉 Vacunación'}
                    {visit.reasonForVisit === 'DIAGNOSIS' && '🩺 Diagnóstico'}
                    {visit.reasonForVisit === 'FOLLOW_UP' && '⏰ Seguimiento'}
                    {visit.reasonForVisit === 'OTHER' && '📋 Otra'}
                  </h4>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      visit.status === 'DRAFT'
                        ? 'bg-gray-100 text-gray-700'
                        : visit.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-700'
                          : visit.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {visit.status === 'DRAFT' && 'Borrador'}
                    {visit.status === 'IN_PROGRESS' && 'En progreso'}
                    {visit.status === 'COMPLETED' && 'Completada'}
                    {visit.status === 'SIGNED' && 'Firmada'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {format(new Date(visit.visitDate), 'd MMMM yyyy HH:mm', { locale: es })}
                </p>
              </div>
              
              <button
                onClick={() => {
                  if (visit.status === 'DRAFT' || visit.status === 'IN_PROGRESS') {
                    setSelectedVisit(visit);
                    setIsEditModalOpen(true);
                  }
                }}
                disabled={visit.status !== 'DRAFT' && visit.status !== 'IN_PROGRESS'}
                className="p-2 hover:bg-primary-50 text-primary-600 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                title={visit.status === 'DRAFT' || visit.status === 'IN_PROGRESS' ? 'Editar visita' : 'Solo se pueden editar visitas en borrador o en progreso'}
              >
                <MdVisibility size={20} />
              </button>
            </div>

            {/* Vital Signs */}
            {(visit.temperature ||
              visit.weight ||
              visit.heartRate ||
              visit.respiratoryRate) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-200">
                {visit.temperature && (
                  <div className="text-sm">
                    <span className="text-slate-500">Temperatura</span>
                    <p className="font-semibold text-slate-900">
                      {Number(visit.temperature).toFixed(1)}°C
                    </p>
                  </div>
                )}
                {visit.weight && (
                  <div className="text-sm">
                    <span className="text-slate-500">Peso</span>
                    <p className="font-semibold text-slate-900">{Number(visit.weight).toFixed(2)} kg</p>
                  </div>
                )}
                {visit.heartRate && (
                  <div className="text-sm">
                    <span className="text-slate-500">Freq. Cardíaca</span>
                    <p className="font-semibold text-slate-900">{visit.heartRate} bpm</p>
                  </div>
                )}
                {visit.respiratoryRate && (
                  <div className="text-sm">
                    <span className="text-slate-500">Freq. Respiratoria</span>
                    <p className="font-semibold text-slate-900">{visit.respiratoryRate} rpm</p>
                  </div>
                )}
              </div>
            )}

            {/* Chief Complaint */}
            {visit.chiefComplaint && (
              <div className="mt-3 pt-3 border-t border-slate-200 text-sm">
                <span className="text-slate-500">Motivo de consulta</span>
                <p className="text-slate-900">{visit.chiefComplaint}</p>
              </div>
            )}

            {/* Follow-up Info */}
            {visit.followUpRequired && (
              <div className="mt-3 pt-3 border-t border-slate-200 text-sm">
                <span className="text-slate-500">Seguimiento requerido</span>
                {visit.followUpDate && (
                  <p className="text-amber-700 font-medium">
                    📅 {format(new Date(visit.followUpDate), 'd MMMM yyyy', { locale: es })}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      <CreateMedicalVisitModal
        isOpen={showNewVisitForm}
        appointmentId={appointmentId}
        petId={petId}
        onClose={() => setShowNewVisitForm(false)}
        onSuccess={() => {
          onDataUpdated();
          setShowNewVisitForm(false);
        }}
      />

      {/* Edit Modal - Para editar visitas DRAFT o IN_PROGRESS */}
      {selectedVisit && (
        <EditMedicalVisitModal
          isOpen={isEditModalOpen}
          visit={selectedVisit}
          appointmentId={appointmentId}
          petId={petId}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedVisit(null);
          }}
          onSuccess={() => {
            onDataUpdated();
            setIsEditModalOpen(false);
            setSelectedVisit(null);
          }}
        />
      )}
    </div>
  );
}
