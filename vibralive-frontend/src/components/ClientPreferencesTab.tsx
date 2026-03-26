/**
 * ClientPreferencesTab.tsx
 * Tab component for managing client contact preferences and tags
 */

import React, { useState, useEffect } from 'react';
import { Client } from '@/types';
import { useClientsStore } from '@/store/useClientsStore';
import { MdCancel, MdAdd } from 'react-icons/md';
import toast from 'react-hot-toast';

interface ClientPreferencesTabProps {
  client: Client;
  isEditing: boolean;
  onClientChange: (client: Client) => void;
}

export const ClientPreferencesTab: React.FC<ClientPreferencesTabProps> = ({
  client,
  isEditing,
  onClientChange,
}) => {
  const [formData, setFormData] = useState<Partial<Client>>(client);
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>(client.tags || []);
  const { addClientTag, removeClientTag, tagsLoading } = useClientsStore();

  useEffect(() => {
    setTags(client.tags || []);
  }, [client.tags]);

  const handleAddTag = async () => {
    if (!newTag.trim()) {
      toast.error('Escribe una etiqueta válida');
      return;
    }

    if (tags.includes(newTag.trim())) {
      toast.error('Esta etiqueta ya existe');
      return;
    }

    try {
      await addClientTag(client.id, newTag.trim());
      setNewTag('');
      setTags((prev) => [...prev, newTag.trim()]);
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    try {
      await removeClientTag(client.id, tag);
      setTags((prev) => prev.filter((t) => t !== tag));
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        {/* Contact Preferences */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Preferencias de Contacto</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Método Preferido
              </label>
              <p className="text-gray-900 font-medium">
                {client.preferred_contact_method || 'WHATSAPP'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Ventana de Contacto
              </label>
              <p className="text-gray-900 font-medium">
                {client.preferred_contact_time_start && client.preferred_contact_time_end
                  ? `${client.preferred_contact_time_start} - ${client.preferred_contact_time_end}`
                  : '—'}
              </p>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Tipo de Vivienda
              </label>
              <p className="text-gray-900 font-medium">{client.housing_type || '—'}</p>
            </div>
          </div>
        </div>

        {/* Do Not Contact */}
        {client.do_not_contact && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <label className="block text-xs font-semibold text-red-700 uppercase mb-1">
              ⚠️ No Contactar
            </label>
            <p className="text-sm text-red-900">{client.do_not_contact_reason || 'Sin especificar'}</p>
          </div>
        )}

        {/* Notes */}
        {(client.access_notes || client.service_notes) && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Notas Adicionales</h3>
            {client.access_notes && (
              <div className="mb-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Acceso
                </label>
                <p className="text-sm text-gray-700">{client.access_notes}</p>
              </div>
            )}
            {client.service_notes && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Servicio
                </label>
                <p className="text-sm text-gray-700">{client.service_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Etiquetas</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Edit mode
  return (
    <div className="space-y-6">
      {/* Contact Preferences */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Preferencias de Contacto</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Método Preferido
            </label>
            <select
              value={formData.preferred_contact_method || 'WHATSAPP'}
              onChange={(e) => {
                const updated = { ...formData, preferred_contact_method: e.target.value as any };
                setFormData(updated);
                onClientChange({ ...client, ...updated });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="WHATSAPP">WhatsApp</option>
              <option value="PHONE">Teléfono</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Tipo de Vivienda
            </label>
            <select
              value={formData.housing_type || ''}
              onChange={(e) => {
                const updated = { ...formData, housing_type: e.target.value as any };
                setFormData(updated);
                onClientChange({ ...client, ...updated });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar...</option>
              <option value="HOUSE">Casa</option>
              <option value="APARTMENT">Apartamento</option>
              <option value="COMMERCIAL">Comercial</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Hora Inicio
            </label>
            <input
              type="time"
              value={formData.preferred_contact_time_start || ''}
              onChange={(e) => {
                const updated = { ...formData, preferred_contact_time_start: e.target.value };
                setFormData(updated);
                onClientChange({ ...client, ...updated });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Hora Fin
            </label>
            <input
              type="time"
              value={formData.preferred_contact_time_end || ''}
              onChange={(e) => {
                const updated = { ...formData, preferred_contact_time_end: e.target.value };
                setFormData(updated);
                onClientChange({ ...client, ...updated });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Access and Service Notes */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Notas de Acceso
          </label>
          <textarea
            value={formData.access_notes || ''}
            onChange={(e) => {
              const updated = { ...formData, access_notes: e.target.value };
              setFormData(updated);
              onClientChange({ ...client, ...updated });
            }}
            rows={3}
            placeholder="Código, portero automático, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Notas de Servicio
          </label>
          <textarea
            value={formData.service_notes || ''}
            onChange={(e) => {
              const updated = { ...formData, service_notes: e.target.value };
              setFormData(updated);
              onClientChange({ ...client, ...updated });
            }}
            rows={3}
            placeholder="Cuidados especiales, preferencias, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Do Not Contact */}
      <div className="border-t pt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.do_not_contact || false}
            onChange={(e) => {
              const updated = { ...formData, do_not_contact: e.target.checked };
              setFormData(updated);
              onClientChange({ ...client, ...updated });
            }}
            className="w-4 h-4"
          />
          <span className="text-sm font-semibold text-gray-700">No Contactar</span>
        </label>

        {formData.do_not_contact && (
          <div className="mt-2">
            <textarea
              value={formData.do_not_contact_reason || ''}
              onChange={(e) => {
                const updated = { ...formData, do_not_contact_reason: e.target.value };
                setFormData(updated);
                onClientChange({ ...client, ...updated });
              }}
              rows={2}
              placeholder="Razón por la cual no contactar..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Etiquetas</h3>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddTag();
              }
            }}
            placeholder="Agregar etiqueta..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddTag}
            disabled={tagsLoading}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            <MdAdd className="w-4 h-4" />
          </button>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  disabled={tagsLoading}
                  className="hover:text-blue-600 transition disabled:opacity-50"
                >
                  <MdCancel className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
