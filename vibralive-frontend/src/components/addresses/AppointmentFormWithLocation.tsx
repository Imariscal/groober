'use client';

import { useState, useEffect } from 'react';
import {
  Appointment,
  CreateAppointmentPayload,
  AppointmentLocationTypeType,
  AssignmentSourceType,
  ClientAddress,
} from '@/types';
import { useClientAddressesStore } from '@/store/clientAddresses.store';
import { AddressForm } from './AddressForm';
import Modal from '../Modal';

interface AppointmentFormProps {
  appointment?: Appointment;
  clientId: string;
  onSubmit: (data: CreateAppointmentPayload) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function AppointmentFormWithLocation({
  appointment,
  clientId,
  onSubmit,
  onCancel,
  loading = false,
}: AppointmentFormProps) {
  const { addresses, setSelectedClient, fetchAddresses } =
    useClientAddressesStore();

  const [locationType, setLocationType] =
    useState<AppointmentLocationTypeType>(
      appointment?.location_type || 'CLINIC',
    );
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(
    appointment?.address_id,
  );
  const [assignmentSource, setAssignmentSource] = useState<AssignmentSourceType>(
    appointment?.assignment_source || 'NONE',
  );
  const [assignedStaffUserId, setAssignedStaffUserId] = useState<string | undefined>(
    appointment?.assigned_staff_user_id,
  );
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Cargar direcciones del cliente
  useEffect(() => {
    if (clientId) {
      setSelectedClient(clientId);
    }
  }, [clientId, setSelectedClient]);

  // Validación: si location_type es HOME, debe haber address_id
  const isValid = locationType === 'CLINIC' || selectedAddressId;

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const defaultAddress = addresses.find((a) => a.is_default);

  const handleAddressCreated = async () => {
    setShowAddressModal(false);
    // Re-fetch addresses
    await fetchAddresses(clientId);
  };

  const addressBadge = selectedAddress ? (
    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
      <p className="text-blue-900 font-medium">{selectedAddress.label}</p>
      <p className="text-blue-700">
        {[
          selectedAddress.street,
          selectedAddress.number_ext && `#${selectedAddress.number_ext}`,
          selectedAddress.city,
        ]
          .filter(Boolean)
          .join(', ')}
      </p>
      {selectedAddress.geocode_status === 'PENDING' && (
        <p className="text-yellow-700 text-xs mt-1">
          ⚠️ Sin geolocalizar (se puede usar pero sin ruteo automático)
        </p>
      )}
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      {formError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {formError}
        </div>
      )}

      {/* Location Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Modalidad de cita
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value="CLINIC"
              checked={locationType === 'CLINIC'}
              onChange={(e) => {
                setLocationType(e.target.value as AppointmentLocationTypeType);
                setSelectedAddressId(undefined);
              }}
              className="w-4 h-4"
            />
            <span>
              <span className="block font-medium text-gray-900">
                En clínica
              </span>
              <span className="text-sm text-gray-600">
                El cliente asiste a la clínica
              </span>
            </span>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value="HOME"
              checked={locationType === 'HOME'}
              onChange={(e) => {
                setLocationType(e.target.value as AppointmentLocationTypeType);
              }}
              className="w-4 h-4"
            />
            <span>
              <span className="block font-medium text-gray-900">
                A domicilio (Grooming)
              </span>
              <span className="text-sm text-gray-600">
                Servicio en casa del cliente
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* Address Selector (solo si HOME) */}
      {locationType === 'HOME' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección *
          </label>

          {addresses.length > 0 ? (
            <>
              <select
                value={selectedAddressId || ''}
                onChange={(e) => setSelectedAddressId(e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Seleccionar dirección --</option>
                {addresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.label || 'Sin etiqueta'} -{' '}
                    {addr.is_default ? '(Default)' : ''}{' '}
                    {addr.geocode_status === 'PENDING'
                      ? '(Sin geolocalizacion)'
                      : ''}
                  </option>
                ))}
              </select>

              {addressBadge}

              <button
                type="button"
                onClick={() => setShowAddressModal(true)}
                className="mt-2 w-full px-3 py-2 text-sm border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition"
              >
                + Agregar nueva dirección
              </button>
            </>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
              <p className="font-medium mb-2">
                Este cliente no tiene direcciones registradas
              </p>
              <button
                type="button"
                onClick={() => setShowAddressModal(true)}
                className="text-blue-700 underline"
              >
                Crear dirección ahora
              </button>
            </div>
          )}
        </div>
      )}

      {/* Assignment Configuration (HOME appointments only) */}
      {locationType === 'HOME' && (
        <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded">
          <label className="block text-sm font-medium text-gray-700">
            Asignación de estilista
          </label>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="assignment"
                value="NONE"
                checked={assignmentSource === 'NONE'}
                onChange={() => {
                  setAssignmentSource('NONE');
                  setAssignedStaffUserId(undefined);
                }}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">
                Sin asignar (Asignación manual después)
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="assignment"
                value="MANUAL_RECEPTION"
                checked={assignmentSource === 'MANUAL_RECEPTION'}
                onChange={() => setAssignmentSource('MANUAL_RECEPTION')}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">
                Asignación manual (Especificar estilista ahora)
              </span>
            </label>
          </div>

          {assignmentSource === 'MANUAL_RECEPTION' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estilista asignado (opcional)
              </label>
              <input
                type="text"
                placeholder="ID de estilista"
                value={assignedStaffUserId || ''}
                onChange={(e) => setAssignedStaffUserId(e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ingrese el ID del estilista o nombre
              </p>
            </div>
          )}
        </div>
      )}

      {/* Address Modal */}
      <Modal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        title="Agregar dirección"
      >
        <AddressForm
          onSubmit={async (addressData) => {
            // TODO: Llamar a addressesApi.createAddress(clientId, addressData)
            // luego setSelectedAddressId con el ID retornado
            // y handleAddressCreated()
            await handleAddressCreated();
          }}
          onCancel={() => setShowAddressModal(false)}
        />
      </Modal>

      {/* Form validity indicator */}
      {locationType === 'HOME' && !isValid && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          ⚠️ Debe seleccionar una dirección para citas a domicilio
        </div>
      )}
    </div>
  );
}
