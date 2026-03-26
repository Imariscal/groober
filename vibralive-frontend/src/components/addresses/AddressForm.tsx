'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MdLocationOn, MdWarning, MdCheckCircle, MdWarningAmber, MdSync, MdMyLocation } from 'react-icons/md';
import { CreateClientAddressPayload } from '@/types';
import { MapsPicker, MapComponentRef } from './MapsPicker';

// Type for address prop - can be full ClientAddress or just CreateClientAddressPayload fields
// Includes optional geocode_status for displaying status badges
type AddressInput = Partial<CreateClientAddressPayload> & {
  geocode_status?: string;
};

interface AddressFormProps {
  address?: AddressInput;
  onSubmit: (data: CreateClientAddressPayload) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function AddressForm({
  address,
  onSubmit,
  onCancel,
  loading = false,
}: AddressFormProps) {
  const mapRef = useRef<MapComponentRef>(null);
  
  const [formData, setFormData] = useState<CreateClientAddressPayload>({
    label: address?.label || '',
    street: address?.street || '',
    number_ext: address?.number_ext || '',
    number_int: address?.number_int || '',
    neighborhood: address?.neighborhood || '',
    city: address?.city || '',
    state: address?.state || '',
    zip_code: address?.zip_code || '',
    references: address?.references || '',
    lat: address?.lat,
    lng: address?.lng,
  });

  const [showMapPicker, setShowMapPicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [syncingToMap, setSyncingToMap] = useState(false);

  // Actualizar formulario cuando cambia la dirección que se está editando
  useEffect(() => {
    if (address) {
      setFormData({
        label: address.label || '',
        street: address.street || '',
        number_ext: address.number_ext || '',
        number_int: address.number_int || '',
        neighborhood: address.neighborhood || '',
        city: address.city || '',
        state: address.state || '',
        zip_code: address.zip_code || '',
        references: address.references || '',
        lat: address.lat,
        lng: address.lng,
      });
      setFormError(null);
    } else {
      // Limpiar formulario si no hay dirección siendo editada
      setFormData({
        label: '',
        street: '',
        number_ext: '',
        number_int: '',
        neighborhood: '',
        city: '',
        state: '',
        zip_code: '',
        references: '',
        lat: undefined,
        lng: undefined,
      });
    }
  }, [address]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError(null);
  };

  const handleCoordinatesUpdate = useCallback((lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      lat,
      lng,
    }));
  }, []);

  const handleAddressFromMap = useCallback((addressData: {
    street: string;
    number_ext: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    lat: number;
    lng: number;
  }) => {
    setFormData((prev) => ({
      ...prev,
      // Solo actualizar campos vacíos o actualizar todos si prev estaba vacío
      street: addressData.street || prev.street,
      number_ext: addressData.number_ext || prev.number_ext,
      neighborhood: addressData.neighborhood || prev.neighborhood,
      city: addressData.city || prev.city,
      state: addressData.state || prev.state,
      zip_code: addressData.zip_code || prev.zip_code,
      lat: addressData.lat,
      lng: addressData.lng,
    }));
  }, []);

  // Sincronizar datos del formulario al mapa
  const handleSyncFormToMap = useCallback(async () => {
    if (!mapRef.current) return;
    
    // Construir dirección de búsqueda
    const addressParts = [
      formData.street,
      formData.number_ext,
      formData.neighborhood,
      formData.city,
      formData.state,
    ].filter(Boolean);
    
    if (addressParts.length < 2) {
      setFormError('Ingresa al menos calle y ciudad para buscar en el mapa');
      return;
    }
    
    const searchString = addressParts.join(', ');
    setSyncingToMap(true);
    
    try {
      await mapRef.current.searchByAddress(searchString);
    } catch (error) {
      console.error('Error syncing to map:', error);
    } finally {
      setSyncingToMap(false);
    }
  }, [formData.street, formData.number_ext, formData.neighborhood, formData.city, formData.state]);

  // Clean up empty strings to undefined for optional fields (backend validation)
  const sanitizePayload = (data: CreateClientAddressPayload): CreateClientAddressPayload => {
    return {
      ...data,
      label: data.label?.trim() || undefined,
      street: data.street?.trim() || '',
      number_ext: data.number_ext?.trim() || undefined,
      number_int: data.number_int?.trim() || undefined,
      neighborhood: data.neighborhood?.trim() || undefined,
      city: data.city?.trim() || '',
      state: data.state?.trim() || undefined,
      zip_code: data.zip_code?.trim() || undefined,
      references: data.references?.trim() || undefined,
      // IMPORTANTE: Incluir coordenadas para que el backend pueda establecer geocode_status = 'OK'
      lat: data.lat,
      lng: data.lng,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validar campos requeridos
    if (!formData.street?.trim() || !formData.city?.trim()) {
      setFormError('Calle y ciudad son requeridos');
      return;
    }

    try {
      const cleanedData = sanitizePayload(formData);
      await onSubmit(cleanedData);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Error al guardar dirección',
      );
    }
  };

  // Build initial search address for map
  const buildSearchAddress = () => {
    const parts = [formData.street, formData.number_ext, formData.city].filter(Boolean);
    return parts.length >= 2 ? parts.join(' ') : '';
  };

  const geocodeStatusBadge =
    address?.geocode_status === 'PENDING' ? (
      <div className="mt-3 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg text-sm text-yellow-700 flex items-center gap-2">
        <MdWarningAmber className="w-5 h-5 flex-shrink-0" />
        <span>Ubicación pendiente de geolocalizar. Use el mapa para precisión.</span>
      </div>
    ) : address?.geocode_status === 'FAILED' ? (
      <div className="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
        <MdWarning className="w-5 h-5 flex-shrink-0" />
        <span>Falló la geolocalización. Intente nuevamente.</span>
      </div>
    ) : address?.geocode_status === 'OK' ? (
      <div className="mt-3 p-3 bg-green-50 border-2 border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
        <MdCheckCircle className="w-5 h-5 flex-shrink-0" />
        <span>Ubicación geolocalizada correctamente.</span>
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      {formError && (
        <div className="p-3 bg-red-50 border-2 border-red-300 rounded-lg text-red-700 text-sm font-medium flex items-center gap-2">
          <MdWarning className="w-5 h-5 flex-shrink-0" />
          {formError}
        </div>
      )}

      {/* GPS & Map Section - PRIMERO para buscar ubicación */}
      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg border-2 border-green-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <MdMyLocation className="w-5 h-5 text-green-600" />
            Localización GPS
          </h3>
          {formData.lat && formData.lng && (
            <span className="px-3 py-1 bg-green-200 text-green-800 text-xs font-bold rounded-full flex items-center gap-1">
              <MdCheckCircle className="w-3 h-3" />
              Localizado
            </span>
          )}
        </div>
        <div className="space-y-4">
          {/* Coordinates Read-only */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Latitud</label>
              <input
                type="number"
                name="lat"
                value={formData.lat || ''}
                onChange={handleInputChange}
                placeholder="0.00000"
                step="0.00001"
                readOnly
                className="w-full px-3 py-2.5 border-2 border-green-300 rounded-lg bg-white text-gray-600 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Longitud</label>
              <input
                type="number"
                name="lng"
                value={formData.lng || ''}
                onChange={handleInputChange}
                placeholder="0.00000"
                step="0.00001"
                readOnly
                className="w-full px-3 py-2.5 border-2 border-green-300 rounded-lg bg-white text-gray-600 text-sm font-mono"
              />
            </div>
          </div>

          {/* Map Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMapPicker(!showMapPicker)}
            className={`w-full px-4 py-3 rounded-lg font-semibold transition-all border-2 flex items-center justify-center gap-2 ${
              showMapPicker 
                ? 'bg-red-500 border-red-600 text-white hover:bg-red-600' 
                : 'bg-blue-600 border-blue-700 text-white hover:bg-blue-700'
            }`}
          >
            {showMapPicker ? (
              <>✕ Cerrar Mapa</>
            ) : (
              <>
                <MdLocationOn className="w-5 h-5" />
                Abrir Mapa para Localizar
              </>
            )}
          </button>

          {/* Sync Button - only show when map is open and form has address data */}
          {showMapPicker && (formData.street || formData.city) && (
            <button
              type="button"
              onClick={handleSyncFormToMap}
              disabled={syncingToMap}
              className="w-full px-4 py-2.5 rounded-lg font-medium transition-all border-2 bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {syncingToMap ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  Buscando dirección...
                </>
              ) : (
                <>
                  <MdSync className="w-4 h-4" />
                  Buscar dirección del formulario en el mapa
                </>
              )}
            </button>
          )}
        </div>

        {/* Map Picker */}
        {showMapPicker && (
          <div className="mt-4 rounded-lg border-2 border-green-300 overflow-hidden">
            <MapsPicker
              ref={mapRef}
              onCoordinatesSelected={handleCoordinatesUpdate}
              onAddressSelected={handleAddressFromMap}
              initialLat={formData.lat}
              initialLng={formData.lng}
              searchAddress={buildSearchAddress()}
            />
          </div>
        )}
      </div>

      {/* Identifiers Section */}
      <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200">
        <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
          <MdLocationOn className="w-5 h-5 text-blue-600" />
          Información de Ubicación
        </h3>
        <div className="space-y-4">
          {/* Label */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Etiqueta <span className="text-gray-500 font-normal">(Casa, Trabajo, etc.)</span>
            </label>
            <input
              type="text"
              name="label"
              value={formData.label || ''}
              onChange={handleInputChange}
              placeholder="Casa"
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            />
          </div>

          {/* Street */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Calle <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleInputChange}
              placeholder="Avenida Reforestación"
              required
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            />
          </div>

          {/* Numbers Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Número Exterior</label>
              <input
                type="text"
                name="number_ext"
                value={formData.number_ext || ''}
                onChange={handleInputChange}
                placeholder="123"
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Número Interior</label>
              <input
                type="text"
                name="number_int"
                value={formData.number_int || ''}
                onChange={handleInputChange}
                placeholder="A"
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
            </div>
          </div>
        </div>
      </div>



      {/* Geographic Section */}
      <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border-2 border-indigo-200">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Ubicación Geográfica</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* City */}
          <div className="col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Ciudad <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="CDMX"
              required
              className="w-full px-4 py-2.5 border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            />
          </div>

          {/* Neighborhood */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Colonia</label>
            <input
              type="text"
              name="neighborhood"
              value={formData.neighborhood || ''}
              onChange={handleInputChange}
              placeholder="Benito Juárez"
              className="w-full px-4 py-2.5 border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Estado</label>
            <input
              type="text"
              name="state"
              value={formData.state || ''}
              onChange={handleInputChange}
              placeholder="CDMX"
              className="w-full px-4 py-2.5 border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            />
          </div>
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Información Adicional</h3>
        <div className="space-y-4">
          {/* Zip Code */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Código Postal</label>
            <input
              type="text"
              name="zip_code"
              value={formData.zip_code || ''}
              onChange={handleInputChange}
              placeholder="06600"
              className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            />
          </div>

          {/* References */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Referencias (Observaciones)</label>
            <textarea
              name="references"
              value={formData.references || ''}
              onChange={handleInputChange}
              placeholder="Puerta azul, junto al supermercado"
              rows={2}
              className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition resize-none"
            />
          </div>
        </div>
      </div>

      {geocodeStatusBadge}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
        <button
          onClick={onCancel}
          disabled={loading}
          type="button"
          className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          type="button"
          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Guardando...' : '✓ Guardar Dirección'}
        </button>
      </div>
    </div>
  );
}
