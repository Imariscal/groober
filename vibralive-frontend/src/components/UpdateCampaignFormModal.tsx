'use client';

import React, { useState, useEffect } from 'react';
import { MdClose, MdCheck } from 'react-icons/md';
import {
  campaignsApi,
  campaignTemplatesApi,
  type CampaignTemplate,
  type CampaignFilter,
  type Campaign,
} from '@/lib/campaigns-api';
import { PetSpecies } from '@/types';
import toast from 'react-hot-toast';

// Especies disponibles con sus labels y emojis
const SPECIES_OPTIONS: Array<{ value: PetSpecies; label: string; emoji: string }> = [
  { value: 'DOG', label: 'Perro', emoji: '🐕' },
  { value: 'CAT', label: 'Gato', emoji: '🐱' },
  { value: 'BIRD', label: 'Ave', emoji: '🦜' },
  { value: 'RABBIT', label: 'Conejo', emoji: '🐰' },
  { value: 'HAMSTER', label: 'Hámster', emoji: '🐹' },
  { value: 'GUINEA_PIG', label: 'Conejillo de Indias', emoji: '🐹' },
  { value: 'FISH', label: 'Pez', emoji: '🐠' },
  { value: 'TURTLE', label: 'Tortuga', emoji: '🐢' },
  { value: 'FERRET', label: 'Hurón', emoji: '🦝' },
  { value: 'OTHER', label: 'Otra', emoji: '🐾' },
];

interface UpdateCampaignFormModalProps {
  isOpen: boolean;
  campaign: Campaign | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UpdateCampaignFormModal({
  isOpen,
  campaign,
  onClose,
  onSuccess,
}: UpdateCampaignFormModalProps) {
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const [filters, setFilters] = useState<CampaignFilter>({});
  const [estimatedCount, setEstimatedCount] = useState(0);

  useEffect(() => {
    if (isOpen && campaign) {
      loadTemplates();
      initializeForm();
    }
  }, [isOpen, campaign]);

  async function loadTemplates() {
    try {
      setIsLoading(true);
      const result = await campaignTemplatesApi.listTemplates(1, 100);
      setTemplates(result);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('No se pudieron cargar las plantillas');
      toast.error('Error al cargar las plantillas');
    } finally {
      setIsLoading(false);
    }
  }

  function initializeForm() {
    if (campaign) {
      setFormData({
        name: campaign.name,
        description: campaign.description || '',
      });
      setFilters(campaign.filtersJson || {});
      setEstimatedCount(campaign.estimatedRecipients);
      setError(null);
    }
  }

  async function handlePreviewAudience() {
    if (!campaign) return;

    try {
      const result = await campaignsApi.previewAudience(campaign.campaignTemplateId, filters);
      setEstimatedCount(result.estimatedCount);
    } catch (err) {
      console.error('Error previewing audience:', err);
      const errorMessage = err instanceof Error ? err.message : 'No se pudo estimar la audiencia';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name || !campaign) {
      setError('Por favor completa todos los campos obligatorios');
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await campaignsApi.updateCampaign(campaign.id, {
        name: formData.name,
        description: formData.description,
        filter: filters,
      });

      toast.success('Campaña actualizada exitosamente');
      onClose();
      onSuccess?.();
    } catch (err) {
      console.error('Error updating campaign:', err);
      const errorMessage = err instanceof Error ? err.message : 'No se pudo actualizar la campaña';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen || !campaign) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          {/* Header - Primary Gradient */}
          <div className="z-20 bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between border-b border-primary-600 shadow-sm">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">Editar campaña</h2>
              <p className="text-primary-100 text-sm mt-1">
                Actualiza los datos de la campaña
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>

          {/* Body - Scrollable */}
          <form onSubmit={handleSubmit} id="campaign-form" className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Cargando plantillas...</div>
            ) : (
              <>
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Nombre de la campaña *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Recordatorio de vacunación"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción de la campaña..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    rows={3}
                  />
                </div>

                {/* Plantilla (solo lectura) */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Plantilla de campaña</label>
                  <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                    {templates.find(t => t.id === campaign.campaignTemplateId)?.name || 'Plantilla no encontrada'}
                  </div>
                </div>

                {/* Filtros */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Filtros de audiencia</h3>

                  <div className="space-y-4">
                    {/* Especie */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">Tipos de mascota</label>
                      <div className="grid grid-cols-2 gap-3">
                        {SPECIES_OPTIONS.map((specie) => (
                          <label key={specie.value} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-primary-50 cursor-pointer transition">
                            <input
                              type="checkbox"
                              checked={filters.species?.includes(specie.value) || false}
                              onChange={(e) => {
                                const species = filters.species || [];
                                setFilters({
                                  ...filters,
                                  species: e.target.checked
                                    ? [...species, specie.value]
                                    : species.filter((s) => s !== specie.value),
                                });
                              }}
                              className="mr-2 rounded w-4 h-4 cursor-pointer"
                            />
                            <span className="text-gray-700 text-sm">
                              {specie.emoji} {specie.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Cliente tiene WhatsApp/Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Disponibilidad de contacto</label>
                      <div className="flex gap-4">
                        {campaign.channel === 'WHATSAPP' && (
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={filters.clientHasWhatsapp || false}
                              onChange={(e) =>
                                setFilters({ ...filters, clientHasWhatsapp: e.target.checked })
                              }
                              className="mr-2 rounded"
                            />
                            <span className="text-gray-700">Con WhatsApp</span>
                          </label>
                        )}
                        {campaign.channel === 'EMAIL' && (
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={filters.clientHasEmail || false}
                              onChange={(e) =>
                                setFilters({ ...filters, clientHasEmail: e.target.checked })
                              }
                              className="mr-2 rounded"
                            />
                            <span className="text-gray-700">Con Email</span>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Cliente activo */}
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.clientActive || false}
                          onChange={(e) => setFilters({ ...filters, clientActive: e.target.checked })}
                          className="mr-2 rounded"
                        />
                        <span className="text-sm font-medium text-gray-900">Solo clientes activos</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Preview de audiencia */}
                <div className="bg-primary-50 border border-primary-200 p-4 rounded-lg">
                  <button
                    type="button"
                    onClick={handlePreviewAudience}
                    className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition font-medium"
                  >
                    Recalcular audiencia
                  </button>
                  {estimatedCount > 0 && (
                    <p className="text-sm text-primary-700 mt-3">
                      Se enviará a aproximadamente <strong>{estimatedCount}</strong> destinatarios
                    </p>
                  )}
                </div>
              </>
            )}
          </form>

          {/* Footer - Sticky Buttons */}
          <div className="sticky bottom-0 flex gap-3 justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="campaign-form"
              disabled={isSubmitting || isLoading}
              className="px-6 py-2.5 text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 hover:shadow-lg rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
            >
              <MdCheck className="w-5 h-5" />
              {isSubmitting ? 'Actualizando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
