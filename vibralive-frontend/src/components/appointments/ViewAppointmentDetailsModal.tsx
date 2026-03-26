'use client';

import { useState, useEffect } from 'react';
import { MdClose, MdCalendarToday, MdAccessTime, MdLocationOn, MdPerson, MdPets, MdContentCut, MdHome, MdBusiness, MdList, MdCheckCircle } from 'react-icons/md';
import { Appointment } from '@/types';
import { format, addMinutes } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { pricingApi, PricingItem, AppointmentPricing } from '@/api/pricing-api';
import { clinicUsersApi } from '@/api/clinic-users-api';

interface ViewAppointmentDetailsModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
}

/**
 * Modal informativo para ver los detalles de una cita
 * 
 * Features:
 * - Muestra información de mascota (nombre, especie, raza, tamaño, sexo, color)
 * - Muestra información del cliente (nombre, teléfono, email)
 * - Muestra dirección si es cita a domicilio
 * - Muestra servicios (sin costos para CLINIC, con costos para HOME)
 * - Muestra fecha, hora inicio y hora fin
 * - Muestra estado de la cita
 * - Muestra notas si las hay
 * - Solo lectura - sin acciones de modificación
 */
export function ViewAppointmentDetailsModal({
  isOpen,
  appointment,
  onClose,
}: ViewAppointmentDetailsModalProps) {
  const clinicTimezone = useClinicTimezone();
  const [services, setServices] = useState<PricingItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [loadingServices, setLoadingServices] = useState(false);
  const [stylistName, setStylistName] = useState<string | null>(null);
  const [performedByName, setPerformedByName] = useState<string | null>(null);

  // Cargar nombre del estilista asignado
  useEffect(() => {
    const loadStylistName = async () => {
      if (!isOpen || !appointment?.assigned_staff_user_id) {
        setStylistName(null);
        return;
      }

      try {
        const user = await clinicUsersApi.getUser(appointment.assigned_staff_user_id);
        setStylistName(user?.name || null);
      } catch (error) {
        console.error('Error loading stylist name:', error);
        setStylistName(null);
      }
    };

    loadStylistName();
  }, [isOpen, appointment?.assigned_staff_user_id]);

  // Cargar nombre del estilista que completó la cita (si es diferente al asignado)
  useEffect(() => {
    const loadPerformedByName = async () => {
      if (!isOpen || !appointment?.performed_by_user_id) {
        setPerformedByName(null);
        return;
      }

      try {
        const user = await clinicUsersApi.getUser(appointment.performed_by_user_id);
        setPerformedByName(user?.name || null);
      } catch (error) {
        console.error('Error loading performed by stylist name:', error);
        setPerformedByName(null);
      }
    };

    loadPerformedByName();
  }, [isOpen, appointment?.performed_by_user_id]);

  // Cargar servicios cuando se abre el modal
  useEffect(() => {
    const loadServices = async () => {
      if (!isOpen || !appointment?.id) {
        setServices([]);
        setTotalAmount(0);
        return;
      }

      setLoadingServices(true);
      try {
        const pricingData = await pricingApi.getAppointmentPricing(appointment.id);
        if (pricingData?.items && Array.isArray(pricingData.items)) {
          setServices(pricingData.items);
          setTotalAmount(pricingData.totalAmount || 0);
        }
      } catch (error) {
        console.error('Error loading appointment services:', error);
        setServices([]);
        setTotalAmount(0);
      } finally {
        setLoadingServices(false);
      }
    };

    loadServices();
  }, [isOpen, appointment?.id]);
  
  if (!isOpen || !appointment) return null;

  const isHome = appointment.location_type === 'HOME';
  const scheduledAt = utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone);
  const endTime = addMinutes(scheduledAt, appointment.duration_minutes || 30);

  // Helper: Emoji de especie
  const getSpeciesEmoji = (species?: string) => {
    if (!species) return '🐾';
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

  // Helper: Nombre de especie
  const getSpeciesName = (species?: string) => {
    if (!species) return '-';
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

  // Helper: Status badge
  const getStatusBadge = () => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      'SCHEDULED': { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Programada' },
      'CONFIRMED': { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Confirmada' },
      'IN_PROGRESS': { bg: 'bg-amber-50', text: 'text-amber-600', label: 'En progreso' },
      'COMPLETED': { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Completada' },
      'CANCELLED': { bg: 'bg-red-50', text: 'text-red-500', label: 'Cancelada' },
      'NO_SHOW': { bg: 'bg-gray-100', text: 'text-gray-500', label: 'No asistió' },
    };
    return statusConfig[appointment.status] || statusConfig['SCHEDULED'];
  };

  const statusBadge = getStatusBadge();

  // Section component
  const Section = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        <Icon className="text-gray-600" size={18} />
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col transform transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between rounded-t-xl flex-shrink-0">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <MdCalendarToday className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Detalles de la cita</h2>
              </div>
              <p className="text-primary-100 text-sm">
                Información completa de la cita
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition duration-200"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          {/* Content - Layout 2 columnas */}
          <div className="p-4 overflow-y-auto flex-1">
            {/* Status & Location Badge - Full width */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                {statusBadge.label}
              </span>
              <span className={`text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                isHome ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
              }`}>
                {isHome ? <MdHome size={16} /> : <MdBusiness size={16} />}
                {isHome ? 'A domicilio' : 'En clínica'}
              </span>
            </div>

            {/* Grid 2 columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Columna Izquierda */}
              <div className="space-y-4">
                {/* Fecha y Hora */}
                <Section title="Fecha y Hora" icon={MdAccessTime}>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-1">Fecha</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {format(scheduledAt, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-1">Horario</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {format(scheduledAt, 'HH:mm')} → {format(endTime, 'HH:mm')} <span className="text-xs text-gray-500">({appointment.duration_minutes || 30} min)</span>
                      </p>
                    </div>
                  </div>
                </Section>

                {/* Mascota */}
                <Section title="Mascota" icon={MdPets}>
                  {appointment.pet ? (
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">{getSpeciesEmoji(appointment.pet.species)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-gray-900">{appointment.pet.name}</p>
                        <div className="flex flex-wrap gap-1 text-xs mt-1">
                          {appointment.pet.species && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                              {getSpeciesName(appointment.pet.species)}
                            </span>
                          )}
                          {appointment.pet.sex && appointment.pet.sex !== 'UNKNOWN' && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                              {appointment.pet.sex === 'MALE' ? '♂ Macho' : '♀ Hembra'}
                            </span>
                          )}
                          {appointment.pet.size && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                              {appointment.pet.size}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Información de mascota no disponible</p>
                  )}
                </Section>

                {/* Cliente y Contacto - SIEMPRE mostrar nombre, teléfono, email */}
                <Section title="Cliente y Contacto" icon={MdPerson}>
                  {appointment.client ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-primary-700 uppercase mb-1">Nombre</p>
                        <p className="text-sm font-bold text-gray-900">{appointment.client.name}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {appointment.client.phone && (
                          <a href={`tel:${appointment.client.phone}`} className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded">
                            📱 {appointment.client.phone}
                          </a>
                        )}
                        {appointment.client.email && (
                          <a href={`mailto:${appointment.client.email}`} className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded truncate">
                            📧 {appointment.client.email}
                          </a>
                        )}
                      </div>
                      {/* Dirección SOLO para citas HOME */}
                      {isHome && appointment.address && (
                        <a 
                          href={appointment.address.lat && appointment.address.lng 
                            ? `https://www.google.com/maps?q=${appointment.address.lat},${appointment.address.lng}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                [
                                  appointment.address.street,
                                  appointment.address.number_ext && `#${appointment.address.number_ext}`,
                                  appointment.address.neighborhood,
                                  appointment.address.city,
                                  appointment.address.state,
                                  appointment.address.zip_code
                                ].filter(Boolean).join(', ')
                              )}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2 hover:bg-amber-100 hover:border-amber-300 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MdLocationOn className="text-amber-600" size={16} />
                              <span className="text-xs font-semibold text-amber-800">Dirección de servicio</span>
                              {appointment.address.label && (
                                <span className="bg-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                                  {appointment.address.label}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-amber-600 group-hover:text-amber-700 flex items-center gap-1">
                              🗺️ <span className="underline">Abrir en Maps</span>
                            </span>
                          </div>
                          <div className="text-sm text-gray-800 space-y-1 pl-5">
                            {/* Calle y número */}
                            <p className="font-medium">
                              {appointment.address.street}
                              {appointment.address.number_ext && ` #${appointment.address.number_ext}`}
                              {appointment.address.number_int && `, Int. ${appointment.address.number_int}`}
                            </p>
                            {/* Colonia */}
                            {appointment.address.neighborhood && (
                              <p className="text-xs text-gray-700">
                                <span className="font-semibold">Colonia:</span> {appointment.address.neighborhood}
                              </p>
                            )}
                            {/* Ciudad y Estado */}
                            <p className="text-xs text-gray-700">
                              {appointment.address.city && (
                                <><span className="font-semibold">Ciudad:</span> {appointment.address.city}</>
                              )}
                              {appointment.address.city && appointment.address.state && ' • '}
                              {appointment.address.state && (
                                <><span className="font-semibold">Estado:</span> {appointment.address.state}</>
                              )}
                            </p>
                            {/* Código Postal */}
                            {appointment.address.zip_code && (
                              <p className="text-xs text-gray-700">
                                <span className="font-semibold">C.P.:</span> {appointment.address.zip_code}
                              </p>
                            )}
                            {/* Referencias */}
                            {appointment.address.references && (
                              <p className="text-xs text-amber-700 italic pt-1 border-t border-amber-200 mt-2">
                                📍 <span className="font-semibold">Referencias:</span> {appointment.address.references}
                              </p>
                            )}
                          </div>
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Información de cliente no disponible</p>
                  )}
                </Section>

                {/* Estilista/Veterinario Asignado */}
                {appointment.assigned_staff_user_id && (
                  <Section 
                    title={appointment.service_type === 'MEDICAL' ? 'Veterinario Asignado' : 'Estilista Asignado'} 
                    icon={appointment.service_type === 'MEDICAL' ? MdPerson : MdContentCut}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <MdPerson className="text-primary-600" size={16} />
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {stylistName || 'Cargando...'}
                      </p>
                    </div>
                  </Section>
                )}

                {/* Estilista que Completó (si es diferente al asignado y la cita está completada) */}
                {appointment.status === 'COMPLETED' && 
                 appointment.performed_by_user_id && 
                 appointment.performed_by_user_id !== appointment.assigned_staff_user_id && (
                  <Section title="Cita Completada por" icon={MdCheckCircle}>
                    <div className="flex items-center gap-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <MdPerson className="text-emerald-600" size={16} />
                      </div>
                      <p className="text-sm font-medium text-emerald-900">
                        {performedByName || 'Cargando...'}
                      </p>
                    </div>
                  </Section>
                )}
              </div>

              {/* Columna Derecha */}
              <div className="space-y-4">
                {/* Servicios */}
                <Section title="Servicios" icon={MdList}>
                  {loadingServices ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                      Cargando...
                    </div>
                  ) : services.length > 0 ? (
                    <div className="space-y-2">
                      {services.map((service, index) => (
                        <div key={service.serviceId || index} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{service.serviceName}</p>
                            {service.quantity > 1 && (
                              <p className="text-xs text-gray-500">x{service.quantity}</p>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 ml-2">
                            {pricingApi.formatPrice(service.subtotal || service.priceAtBooking * service.quantity)}
                          </p>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-300">
                        <p className="text-sm font-bold text-gray-700">TOTAL</p>
                        <p className="text-base font-bold text-primary-600">
                          {pricingApi.formatPrice(totalAmount)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Sin servicios registrados</p>
                  )}
                </Section>

                {/* Notas */}
                {appointment.notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">📝 Notas</p>
                    <p className="text-sm text-amber-900">{appointment.notes}</p>
                  </div>
                )}

                {/* Razón de cancelación */}
                {appointment.status === 'CANCELLED' && appointment.cancellation_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">❌ Cancelación</p>
                    <p className="text-sm text-red-900">{appointment.cancellation_reason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata - Full width */}
            <div className="text-xs text-gray-400 pt-3 mt-4 border-t border-gray-100 flex flex-wrap gap-x-4">
              <span>ID: {appointment.id}</span>
              <span>Creada: {format(utcToZonedTime(new Date(appointment.created_at), clinicTimezone), "d MMM yyyy, HH:mm", { locale: es })}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex-shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
