'use client';

import { useEffect, useRef } from 'react';
import { 
  MdCheckCircle, 
  MdCancel, 
  MdEdit, 
  MdVisibility, 
  MdPersonAdd,
  MdSchedule,
  MdContentCut,
  MdPlayArrow,
  MdEventBusy
} from 'react-icons/md';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { utcToZonedTime } from 'date-fns-tz';
import { Appointment } from '@/types';

interface AppointmentContextMenuProps {
  isOpen: boolean;
  appointment: Appointment | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onViewDetails: (appointment: Appointment) => void;
  onAssignStylist: (appointment: Appointment) => void;
  onEdit: (appointment: Appointment) => void;
  onStartAppointment: (appointment: Appointment) => void;
  onComplete: (appointment: Appointment) => void;
  onReschedule: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
  onMarkNoShow: (appointment: Appointment) => void;
}

/**
 * Floating context menu para opciones de cita
 * Se muestra al hacer clic en un evento del calendario
 * 
 * Opciones disponibles según estado:
 * - SCHEDULED/CONFIRMED: Ver, Editar, Asignar, Empezar, Completar, Reprogramar, Cancelar
 * - IN_PROGRESS: Ver, Completar
 * - UNATTENDED: Ver, Completar, No asistió, Cancelar, Reagendar
 * - COMPLETED/CANCELLED/NO_SHOW: Solo Ver detalles
 * 
 * UX Design:
 * - Agrupación lógica: Info → Edición → Acciones de estado → Acciones destructivas
 * - Iconografía semántica y consistente
 * - Feedback visual con hover states diferenciados
 */
export function AppointmentContextMenu({
  isOpen,
  appointment,
  position,
  onClose,
  onViewDetails,
  onAssignStylist,
  onEdit,
  onStartAppointment,
  onComplete,
  onReschedule,
  onCancel,
  onMarkNoShow,
}: AppointmentContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const clinicTimezone = useClinicTimezone();

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !appointment || !position) return null;

  const canChangeStatus = ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);
  const isUnattended = appointment.status === 'UNATTENDED';
  const isInProgress = appointment.status === 'IN_PROGRESS';
  
  // 🎯 Verificar si la cita es futura (comparando fecha y hora)
  const isFutureAppointment = () => {
    if (!appointment.scheduled_at) return true;
    
    const appointmentDateTime = utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone);
    const now = utcToZonedTime(new Date(), clinicTimezone);
    
    // Compare complete datetime: if appointment time is after now, it's future
    return appointmentDateTime > now;
  };

  // 🎯 Traducir tipo de mascota
  const getSpeciesEmoji = (species: string) => {
    const emojiMap: { [key: string]: string } = {
      'DOG': '🐕',
      'CAT': '🐱',
      'BIRD': '🐦',
      'RABBIT': '🐰',
      'HAMSTER': '🐹',
      'GUINEA_PIG': '🐹',
      'FISH': '🐠',
      'TURTLE': '🐢',
      'FERRET': '🦝',
      'OTHER': '🐾',
    };
    return emojiMap[species] || '🐾';
  };

  const getSpeciesName = (species: string) => {
    const namesMap: { [key: string]: string } = {
      'DOG': 'Perro',
      'CAT': 'Gato',
      'BIRD': 'Ave',
      'RABBIT': 'Conejo',
      'HAMSTER': 'Hámster',
      'GUINEA_PIG': 'Cobaya',
      'FISH': 'Pez',
      'TURTLE': 'Tortuga',
      'FERRET': 'Hurón',
      'OTHER': 'Otro',
    };
    return namesMap[species] || species;
  };

  // 🎯 Calcular posición del menú según la hora de la cita
  const getMenuTransform = () => {
    if (!appointment.scheduled_at) {
      return 'translateX(calc(-100% - 8px)) translateY(calc(-100% - 8px))';
    }

    const appointmentTime = utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone);
    const hour = appointmentTime.getHours();

    // Antes de las 12:00 → menú abajo a la izquierda
    if (hour < 12) {
      return 'translateX(calc(-100% - 8px)) translateY(8px)';
    }
    // 12:00 en adelante → menú arriba a la izquierda
    return 'translateX(calc(-100% - 8px)) translateY(calc(-100% - 8px))';
  };

  // Status badge styling
  const getStatusBadge = () => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      'SCHEDULED': { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Programada' },
      'CONFIRMED': { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Confirmada' },
      'IN_PROGRESS': { bg: 'bg-amber-50', text: 'text-amber-600', label: 'En progreso' },
      'COMPLETED': { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Completada' },
      'CANCELLED': { bg: 'bg-red-50', text: 'text-red-500', label: 'Cancelada' },
      'NO_SHOW': { bg: 'bg-gray-100', text: 'text-gray-500', label: 'No asistió' },
      'UNATTENDED': { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Sin atender' },
    };
    return statusConfig[appointment.status] || statusConfig['SCHEDULED'];
  };

  const statusBadge = getStatusBadge();

  // MenuItem component for consistent styling
  const MenuItem = ({ 
    onClick, 
    icon: Icon, 
    label, 
    variant = 'default' 
  }: { 
    onClick: () => void; 
    icon: React.ElementType; 
    label: string; 
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  }) => {
    const variants = {
      default: 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
      primary: 'text-blue-600 hover:bg-blue-50 hover:text-blue-700',
      success: 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700',
      warning: 'text-amber-600 hover:bg-amber-50 hover:text-amber-700',
      danger: 'text-red-500 hover:bg-red-50 hover:text-red-600',
    };

    const iconVariants = {
      default: 'text-slate-400 group-hover:text-slate-600',
      primary: 'text-blue-400 group-hover:text-blue-600',
      success: 'text-emerald-400 group-hover:text-emerald-600',
      warning: 'text-amber-400 group-hover:text-amber-600',
      danger: 'text-red-400 group-hover:text-red-500',
    };

    return (
      <button
        onClick={onClick}
        className={`group w-full px-3 py-2 text-left transition-all duration-150 flex items-center gap-2.5 text-[13px] font-medium rounded-md ${variants[variant]}`}
      >
        <Icon className={`transition-colors duration-150 ${iconVariants[variant]}`} size={18} />
        {label}
      </button>
    );
  };

  // Divider component
  const Divider = () => <div className="my-1.5 h-px bg-slate-100" />;

  return (
    <>
      {/* Backdrop sutil */}
      <div
        className="fixed inset-0 z-40 bg-black/5"
        onClick={onClose}
      />

      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-white rounded-xl shadow-xl border border-slate-200/80 min-w-[240px] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
          transform: getMenuTransform(),
        }}
      >
        {/* Header - Compact & Clean */}
        <div className="px-3 py-3 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
          {/* Pet Info Row */}
          <div className="flex items-center gap-2.5">
            {appointment.pet?.species && (
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <span className="text-lg">{getSpeciesEmoji(appointment.pet.species)}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 truncate">
                {appointment.pet?.name || 'Cita'}
              </h3>
              {appointment.pet && (
                <p className="text-xs text-slate-500 truncate">
                  {[
                    appointment.pet.species && getSpeciesName(appointment.pet.species),
                    appointment.pet.breed,
                    appointment.pet.size
                  ].filter(Boolean).join(' • ')}
                </p>
              )}
            </div>
          </div>

          {/* Client & Status Row */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100/80">
            <span className="text-xs text-slate-600 font-medium truncate max-w-[140px]">
              {appointment.client?.name || 'Cliente'}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
              {statusBadge.label}
            </span>
          </div>
        </div>

        {/* Actions - Grouped logically */}
        <div className="p-1.5">
          {/* 📋 Info Action - Always visible */}
          <MenuItem
            onClick={() => { onViewDetails(appointment); onClose(); }}
            icon={MdVisibility}
            label="Ver detalles"
            variant="default"
          />

          {/* IN_PROGRESS: Solo completar */}
          {isInProgress && (
            <>
              <Divider />
              <MenuItem
                onClick={() => { onComplete(appointment); onClose(); }}
                icon={MdCheckCircle}
                label="Completar cita"
                variant="success"
              />
            </>
          )}

          {/* UNATTENDED: Opciones para resolver */}
          {isUnattended && (
            <>
              <Divider />
              
              {/* ✅ Resolver como completada */}
              <MenuItem
                onClick={() => { onComplete(appointment); onClose(); }}
                icon={MdCheckCircle}
                label="Marcar completada"
                variant="success"
              />
              
              {/* ✏️ Editar cita */}
              <MenuItem
                onClick={() => { onEdit(appointment); onClose(); }}
                icon={MdEdit}
                label="Editar cita"
                variant="primary"
              />
              
              <Divider />
              
              {/* ❌ Cancelar */}
              <MenuItem
                onClick={() => { onCancel(appointment); onClose(); }}
                icon={MdCancel}
                label="Cancelar cita"
                variant="danger"
              />
            </>
          )}

          {canChangeStatus && (
            <>
              <Divider />
              
              {/* ✏️ Edit Actions Group */}
              <MenuItem
                onClick={() => { onEdit(appointment); onClose(); }}
                icon={MdEdit}
                label="Editar cita"
                variant="primary"
              />
              <MenuItem
                onClick={() => { onAssignStylist(appointment); onClose(); }}
                icon={appointment?.service_type === 'MEDICAL' ? MdPersonAdd : MdContentCut}
                label={appointment?.service_type === 'MEDICAL' ? 'Asignar veterinario' : 'Asignar estilista'}
                variant="primary"
              />
              
              <Divider />
              
              {/* ▶️ Start Action - Only for today/past appointments */}
              {!isFutureAppointment() && (
                <MenuItem
                  onClick={() => { onStartAppointment(appointment); onClose(); }}
                  icon={MdPlayArrow}
                  label="Empezar"
                  variant="success"
                />
              )}
              
              {/* ✅ Status Actions Group */}
              {!isFutureAppointment() && (
                <MenuItem
                  onClick={() => { onComplete(appointment); onClose(); }}
                  icon={MdCheckCircle}
                  label="Completar cita"
                  variant="success"
                />
              )}
              
              <Divider />
              
              {/* ❌ Destructive Action - Always last */}
              <MenuItem
                onClick={() => { onCancel(appointment); onClose(); }}
                icon={MdCancel}
                label="Cancelar cita"
                variant="danger"
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
