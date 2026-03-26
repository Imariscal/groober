/**
 * ClientGeneralTab.tsx
 * Tab component for displaying and editing general client information
 * Includes: basic info, housing preferences, and price list selection
 */

import React, { useState, useEffect } from 'react';
import { MdCheckCircle, MdOpenInNew } from 'react-icons/md';
import { Client, PriceList } from '@/types';
import { priceListsApi } from '@/api/price-lists-api';
import toast from 'react-hot-toast';

// Helper function to format phone number for WhatsApp
const formatPhoneForWhatsApp = (phone: string): string => {
  if (!phone) return '';
  // Remove all non-numeric characters except + at the start
  const cleaned = phone.replace(/[^\d+]/g, '');
  // Remove leading + if present (WhatsApp API adds it)
  return cleaned.replace(/^\+/, '');
};

// Helper function to create WhatsApp link
const getWhatsAppLink = (phone: string): string => {
  const formatted = formatPhoneForWhatsApp(phone);
  if (!formatted) return '';
  return `https://wa.me/${formatted}`;
};

interface ClientGeneralTabProps {
  client: Client;
  isEditing: boolean;
  onClientChange: (client: Client) => void;
}

export const ClientGeneralTab: React.FC<ClientGeneralTabProps> = ({
  client,
  isEditing,
  onClientChange,
}) => {
  const [formData, setFormData] = useState<Partial<Client>>(client);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [defaultPriceList, setDefaultPriceList] = useState<PriceList | null>(null);
  const [isLoadingPriceLists, setIsLoadingPriceLists] = useState(true);

  // Load price lists on component mount
  useEffect(() => {
    const loadPriceLists = async () => {
      try {
        const [lists, defaultList] = await Promise.all([
          priceListsApi.getActivePriceLists(),
          priceListsApi.getDefaultPriceList(),
        ]);
        setPriceLists(lists || []);
        setDefaultPriceList(defaultList || null);
      } catch (error) {
        console.warn('Price lists API not available:', error);
        setPriceLists([]);
        setDefaultPriceList(null);
      } finally {
        setIsLoadingPriceLists(false);
      }
    };

    loadPriceLists();
  }, []);

  // View mode
  if (!isEditing) {
    const usesDefaultPriceList = !client.price_list_id && !!defaultPriceList;
    const selectedPriceList = priceLists.find((pl) => pl.id === client.price_list_id) || null;

    return (
      <div className="space-y-6">
        {/* Información General */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Información General</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase">
                Nombre
              </label>
              <p className="text-gray-900 font-medium">{client.name}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase">
                Teléfono
              </label>
              <a
                href={getWhatsAppLink(client.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 font-medium hover:text-blue-700 hover:underline flex items-center gap-1 w-fit"
              >
                {client.phone}
                <MdOpenInNew className="w-3 h-3" />
              </a>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase">
                Email
              </label>
              <p className="text-gray-900 font-medium">{client.email || '—'}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase">
                WhatsApp
              </label>
              {client.whatsapp_number ? (
                <a
                  href={getWhatsAppLink(client.whatsapp_number)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-medium hover:text-blue-700 hover:underline flex items-center gap-1 w-fit"
                >
                  {client.whatsapp_number}
                  <MdOpenInNew className="w-3 h-3" />
                </a>
              ) : (
                <p className="text-gray-500">—</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase">
                Teléfono Secundario
              </label>
              {client.phone_secondary ? (
                <a
                  href={getWhatsAppLink(client.phone_secondary)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-medium hover:text-blue-700 hover:underline flex items-center gap-1 w-fit"
                >
                  {client.phone_secondary}
                  <MdOpenInNew className="w-3 h-3" />
                </a>
              ) : (
                <p className="text-gray-500">—</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase">
                Dirección
              </label>
              <p className="text-gray-900 font-medium">{client.address || '—'}</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
            Notas
          </label>
          <p className="text-gray-900 text-sm">{client.notes || '—'}</p>
        </div>

        <div className="pt-4 border-t">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
            Estado
          </label>
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            {client.status || 'ACTIVE'}
          </div>
        </div>

        {/* Preferencias de Domicilio */}
        {(client.housing_type || client.access_notes || client.service_notes) && (
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Preferencias de Domicilio</h3>
            <div className="grid grid-cols-2 gap-4">
              {client.housing_type && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Tipo de Vivienda
                  </label>
                  <p className="text-gray-900">
                    {
                      {
                        HOUSE: 'Casa',
                        APARTMENT: 'Departamento',
                        OTHER: 'Otro',
                      }[client.housing_type] || client.housing_type
                    }
                  </p>
                </div>
              )}
              {client.access_notes && (
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Acceso
                  </label>
                  <p className="text-gray-900 text-sm">{client.access_notes}</p>
                </div>
              )}
              {client.service_notes && (
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Notas de Servicio
                  </label>
                  <p className="text-gray-900 text-sm">{client.service_notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contacto Avanzado */}
        {(client.whatsapp_number || client.phone_secondary || client.preferred_contact_method || client.preferred_contact_time_start || client.preferred_contact_time_end || client.do_not_contact) && (
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Contacto Avanzado</h3>
            <div className="grid grid-cols-2 gap-4">
              {client.whatsapp_number && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    WhatsApp
                  </label>
                  <a
                    href={getWhatsAppLink(client.whatsapp_number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-medium hover:text-blue-700 hover:underline flex items-center gap-1 w-fit"
                  >
                    {client.whatsapp_number}
                    <MdOpenInNew className="w-3 h-3" />
                  </a>
                </div>
              )}
              {client.phone_secondary && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Teléfono Secundario
                  </label>
                  <a
                    href={getWhatsAppLink(client.phone_secondary)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-medium hover:text-blue-700 hover:underline flex items-center gap-1 w-fit"
                  >
                    {client.phone_secondary}
                    <MdOpenInNew className="w-3 h-3" />
                  </a>
                </div>
              )}
              {client.preferred_contact_method && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Método de Contacto Preferido
                  </label>
                  <p className="text-gray-900">
                    {
                      {
                        WHATSAPP: 'WhatsApp',
                        PHONE: 'Teléfono',
                        EMAIL: 'Email',
                        SMS: 'SMS',
                      }[client.preferred_contact_method] || client.preferred_contact_method
                    }
                  </p>
                </div>
              )}
              {(client.preferred_contact_time_start || client.preferred_contact_time_end) && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Horario de Contacto
                  </label>
                  <p className="text-gray-900">
                    {client.preferred_contact_time_start && client.preferred_contact_time_end
                      ? `${client.preferred_contact_time_start} - ${client.preferred_contact_time_end}`
                      : client.preferred_contact_time_start
                      ? `Desde ${client.preferred_contact_time_start}`
                      : `Hasta ${client.preferred_contact_time_end}`}
                  </p>
                </div>
              )}
              {client.do_not_contact && (
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    No Contactar
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                      Activo
                    </span>
                    {client.do_not_contact_reason && (
                      <span className="text-sm text-gray-700">{client.do_not_contact_reason}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comercial */}
        {!isLoadingPriceLists && (
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Comercial</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                Lista de Precios
              </label>
              {usesDefaultPriceList || !client.price_list_id ? (
                <p className="text-gray-900">
                  {defaultPriceList?.name || 'Por defecto de la clínica'}
                </p>
              ) : selectedPriceList ? (
                <p className="text-gray-900">{selectedPriceList.name}</p>
              ) : (
                <p className="text-gray-500">—</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Edit mode
  const usesDefaultPriceList =
    !formData.price_list_id && !!defaultPriceList;
  const housingTypeOptions = [
    { value: 'HOUSE', label: 'Casa' },
    { value: 'APARTMENT', label: 'Departamento' },
    { value: 'OTHER', label: 'Otro' },
  ];

  return (
    <div className="space-y-6">
      {/* Información General */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Información General</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => {
                const updated = { ...formData, name: e.target.value };
                setFormData(updated);
                onClientChange({ ...client, ...updated });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => {
                const updated = { ...formData, phone: e.target.value };
                setFormData(updated);
                onClientChange({ ...client, ...updated });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => {
                const updated = { ...formData, email: e.target.value };
                setFormData(updated);
                onClientChange({ ...client, ...updated });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              WhatsApp
            </label>
            <input
              type="tel"
              value={formData.whatsapp_number || ''}
              onChange={(e) => {
                const updated = { ...formData, whatsapp_number: e.target.value };
                setFormData(updated);
                onClientChange({ ...client, ...updated });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Teléfono Secundario
            </label>
            <input
              type="tel"
              value={formData.phone_secondary || ''}
              onChange={(e) => {
                const updated = { ...formData, phone_secondary: e.target.value };
                setFormData(updated);
                onClientChange({ ...client, ...updated });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => {
                const updated = { ...formData, address: e.target.value };
                setFormData(updated);
                onClientChange({ ...client, ...updated });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
          Notas
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => {
            const updated = { ...formData, notes: e.target.value };
            setFormData(updated);
            onClientChange({ ...client, ...updated });
          }}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
          Estado
        </label>
        <select
          value={formData.status || 'ACTIVE'}
          onChange={(e) => {
            const updated = { ...formData, status: e.target.value as any };
            setFormData(updated);
            onClientChange({ ...client, ...updated });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
          <option value="ARCHIVED">Archivado</option>
          <option value="BLACKLISTED">Bloqueado</option>
        </select>
      </div>

      {/* Comercial - Asignación de Lista de Precios */}
      {!isLoadingPriceLists && (
        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">💰 Lista de Precios</h3>

          {priceLists.length === 0 ? (
            <p className="text-sm text-gray-500">No hay listas de precios disponibles</p>
          ) : (
            <div className="space-y-3">
              {/* Default Price List Option */}
              <label
                className={
                  'flex items-start p-4 border-2 rounded-lg cursor-pointer transition duration-200 ' +
                  (usesDefaultPriceList
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50')
                }
              >
                <div className="pt-1 pr-3">
                  <input
                    type="radio"
                    name="priceList"
                    value=""
                    checked={usesDefaultPriceList}
                    onChange={() => {
                      const updated = { ...formData, price_list_id: null };
                      setFormData(updated);
                      onClientChange({ ...client, ...updated });
                    }}
                    className="w-5 h-5 text-blue-600 cursor-pointer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">
                    {defaultPriceList?.name || 'Por defecto de la clínica'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Utiliza la tarifa estándar de la clínica</p>
                </div>
                {usesDefaultPriceList && (
                  <div className="flex items-center gap-2 ml-3 text-blue-600">
                    <MdCheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Actual</span>
                  </div>
                )}
              </label>

              {/* Custom Price Lists - Excluir la predeterminada */}
              {priceLists
                .filter((pl) => !defaultPriceList || pl.id !== defaultPriceList.id)
                .map((priceList) => (
                <label
                  key={priceList.id}
                  className={
                    'flex items-start p-4 border-2 rounded-lg cursor-pointer transition duration-200 ' +
                    (formData.price_list_id === priceList.id && !usesDefaultPriceList
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50')
                  }
                >
                  <div className="pt-1 pr-3">
                    <input
                      type="radio"
                      name="priceList"
                      value={priceList.id}
                      checked={formData.price_list_id === priceList.id}
                      onChange={() => {
                        const updated = { ...formData, price_list_id: priceList.id };
                        setFormData(updated);
                        onClientChange({ ...client, ...updated });
                      }}
                      className="w-5 h-5 text-blue-600 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{priceList.name}</p>
                    {priceList.isDefault && (
                      <p className="text-sm text-gray-600 mt-1">Tarifa predeterminada de la clínica</p>
                    )}
                  </div>
                  {formData.price_list_id === priceList.id && !usesDefaultPriceList && (
                    <div className="flex items-center gap-2 ml-3 text-blue-600">
                      <MdCheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Actual</span>
                    </div>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preferencias de Domicilio (opcional) */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Preferencias de Domicilio (opcional)</h3>
        <p className="text-xs text-gray-500 mb-4">Estas preferencias ayudan a servicios a domicilio (grooming) y rutas futuras.</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Tipo de Vivienda
            </label>
            <select
              value={formData.housing_type || ''}
              onChange={(e) => {
                const updated = { ...formData, housing_type: (e.target.value || null) as any };
                setFormData(updated);
                onClientChange({ ...client, ...updated });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar...</option>
              {housingTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Acceso
          </label>
          <textarea
            value={formData.access_notes || ''}
            onChange={(e) => {
              const updated = { ...formData, access_notes: e.target.value || null };
              setFormData(updated);
              onClientChange({ ...client, ...updated });
            }}
            placeholder="Vigilancia, portón, entre calles, indicaciones…"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-3">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Notas de Servicio
          </label>
          <textarea
            value={formData.service_notes || ''}
            onChange={(e) => {
              const updated = { ...formData, service_notes: e.target.value || null };
              setFormData(updated);
              onClientChange({ ...client, ...updated });
            }}
            placeholder="Perro nervioso, usar bozal, tocar fuerte, etc."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Contacto Avanzado */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Contacto Avanzado (opcional)</h3>
        <p className="text-xs text-gray-500 mb-4">Preferencias adicionales de contacto y restricciones para la comunicación.</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Método de Contacto Preferido
            </label>
            <select
              value={formData.preferred_contact_method || ''}
              onChange={(e) => {
                const updated = { ...formData, preferred_contact_method: (e.target.value || null) as any };
                setFormData(updated);
                onClientChange({ ...client, ...updated });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar...</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="PHONE">Teléfono</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Horario Inicio
            </label>
            <input
              type="time"
              value={formData.preferred_contact_time_start || ''}
              onChange={(e) => {
                const updated = { ...formData, preferred_contact_time_start: e.target.value || null };
                setFormData(updated);
                onClientChange({ ...client, ...updated });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Horario Fin
            </label>
            <input
              type="time"
              value={formData.preferred_contact_time_end || ''}
              onChange={(e) => {
                const updated = { ...formData, preferred_contact_time_end: e.target.value || null };
                setFormData(updated);
                onClientChange({ ...client, ...updated });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* do_not_contact toggle and conditional reason */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={formData.do_not_contact || false}
              onChange={(e) => {
                const updated = { ...formData, do_not_contact: e.target.checked ? true : null };
                setFormData(updated);
                onClientChange({ ...client, ...updated });
              }}
              className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
            />
            <span className="text-sm font-semibold text-gray-700">No Contactar (bloqueado)</span>
          </label>

          {formData.do_not_contact && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Razón de Bloqueo *
              </label>
              <textarea
                value={formData.do_not_contact_reason || ''}
                onChange={(e) => {
                  const updated = { ...formData, do_not_contact_reason: e.target.value || null };
                  setFormData(updated);
                  onClientChange({ ...client, ...updated });
                }}
                placeholder="Razón por la que no debe ser contactado..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
