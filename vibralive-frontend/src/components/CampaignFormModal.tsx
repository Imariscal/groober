'use client';

import React, { useState, useEffect } from 'react';
import { MdClose, MdCheck, MdRefresh } from 'react-icons/md';
import {
  campaignsApi,
  campaignTemplatesApi,
  type CampaignTemplate,
  type CampaignFilter,
  type Campaign,
} from '@/lib/campaigns-api';
import { PetSpecies } from '@/types';
import toast from 'react-hot-toast';

// Recurrence type options
const RECURRENCE_OPTIONS = [
  { value: 'ONCE', label: 'Una sola vez (Sin repetición)' },
  { value: 'DAILY', label: 'Diariamente' },
  { value: 'WEEKLY', label: 'Semanalmente' },
  { value: 'MONTHLY', label: 'Mensualmente' },
];

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

interface CampaignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialCampaign?: Campaign | null;
}

export function CampaignFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialCampaign,
}: CampaignFormModalProps) {
  const isEditMode = !!initialCampaign;
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaignTemplateId: '',
    isRecurring: false,
    recurrenceType: 'ONCE' as 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY',
    recurrenceInterval: 1,
    recurrenceEndDate: '',
  });

  const [filters, setFilters] = useState<CampaignFilter>({});
  const [estimatedCount, setEstimatedCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      if (isEditMode && initialCampaign) {
        // Pre-load data for edit mode
        setFormData({
          name: initialCampaign.name,
          description: initialCampaign.description || '',
          campaignTemplateId: initialCampaign.campaignTemplateId,
          isRecurring: initialCampaign.isRecurring || false,
          recurrenceType: initialCampaign.recurrenceType || 'ONCE',
          recurrenceInterval: initialCampaign.recurrenceInterval || 1,
          recurrenceEndDate: initialCampaign.recurrenceEndDate || '',
        });
        setFilters(initialCampaign.filtersJson || {});
      } else {
        resetForm();
      }
    }
  }, [isOpen, isEditMode, initialCampaign]);

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

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      campaignTemplateId: '',
      isRecurring: false,
      recurrenceType: 'ONCE' as 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY',
      recurrenceInterval: 1,
      recurrenceEndDate: '',
    });
    setFilters({});
    setEstimatedCount(0);
    setError(null);
  }

  async function handlePreviewAudience() {
    if (!formData.campaignTemplateId) {
      setError('Por favor selecciona una plantilla de campaña primero');
      toast.error('Por favor selecciona una plantilla de campaña primero');
      return;
    }

    try {
      const result = await campaignsApi.previewAudience(formData.campaignTemplateId, filters);
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

    if (!formData.name || !formData.campaignTemplateId) {
      setError('Por favor completa todos los campos obligatorios');
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Get the selected template to retrieve its channel
      const selectedTemplate = templates.find(t => t.id === formData.campaignTemplateId);
      
      if (!selectedTemplate) {
        throw new Error('Plantilla no encontrada');
      }

      if (isEditMode && initialCampaign) {
        // Update existing campaign
        await campaignsApi.updateCampaign(initialCampaign.id, {
          name: formData.name,
          description: formData.description,
          filter: filters,
          isRecurring: formData.isRecurring,
          recurrenceType: formData.isRecurring ? formData.recurrenceType : undefined,
          recurrenceInterval: formData.isRecurring ? formData.recurrenceInterval : undefined,
          recurrenceEndDate: formData.isRecurring && formData.recurrenceEndDate ? formData.recurrenceEndDate : undefined,
        });
        toast.success('Campaña actualizada exitosamente');
      } else {
        // Create new campaign
        await campaignsApi.createCampaign({
          name: formData.name,
          description: formData.description,
          campaignTemplateId: formData.campaignTemplateId,
          channel: selectedTemplate.channel,
          filter: filters,
          isRecurring: formData.isRecurring,
          recurrenceType: formData.isRecurring ? formData.recurrenceType : undefined,
          recurrenceInterval: formData.isRecurring ? formData.recurrenceInterval : undefined,
          recurrenceEndDate: formData.isRecurring && formData.recurrenceEndDate ? formData.recurrenceEndDate : undefined,
        });
        toast.success('Campaña creada exitosamente');
      }

      resetForm();
      onClose();
      onSuccess?.();
    } catch (err) {
      console.error('Error saving campaign:', err);
      const errorMessage = err instanceof Error ? err.message : 'No se pudo guardar la campaña';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

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
              <h2 className="text-xl font-bold text-white">
                {isEditMode ? 'Editar campaña' : 'Nueva campaña'}
              </h2>
              <p className="text-primary-100 text-sm mt-1">
                {isEditMode 
                  ? 'Actualiza los datos de la campaña'
                  : 'Completa los datos para crear una nueva campaña de marketing'
                }
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

                {/* Plantilla */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Plantilla de campaña *</label>
                  <select
                    value={formData.campaignTemplateId}
                    onChange={(e) => setFormData({ ...formData, campaignTemplateId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    required
                  >
                    <option value="">Seleccionar plantilla...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.channel})
                      </option>
                    ))}
                  </select>
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
                        {formData.campaignTemplateId && templates.find(t => t.id === formData.campaignTemplateId)?.channel === 'WHATSAPP' && (
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
                        {formData.campaignTemplateId && templates.find(t => t.id === formData.campaignTemplateId)?.channel === 'EMAIL' && (
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
                    disabled={!formData.campaignTemplateId}
                    className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition font-medium"
                  >
                    {!formData.campaignTemplateId ? 'Selecciona una plantilla para estimar' : 'Estimar audiencia'}
                  </button>
                  {estimatedCount > 0 && (
                    <p className="text-sm text-primary-700 mt-3">
                      Se enviará a aproximadamente <strong>{estimatedCount}</strong> destinatarios
                    </p>
                  )}
                  {!formData.campaignTemplateId && (
                    <p className="text-xs text-primary-600 mt-2">
                      ℹ️ Selecciona primero una plantilla de campaña para estimar la audiencia
                    </p>
                  )}
                </div>

                {/* Recurrencia */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MdRefresh className="w-5 h-5 text-primary-600" />
                    <h3 className="font-semibold text-gray-900">Configurar periodicidad</h3>
                  </div>

                  {/* Is Recurring */}
                  <div className="mb-4">
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-primary-50 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={formData.isRecurring}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isRecurring: e.target.checked,
                            recurrenceType: e.target.checked ? 'DAILY' : 'ONCE',
                          })
                        }
                        className="mr-3 rounded w-4 h-4 cursor-pointer"
                      />
                      <span className="text-gray-700 font-medium">Esta es una campaña recurrente</span>
                    </label>
                  </div>

                  {/* Recurrence options (shown only if recurring) */}
                  {formData.isRecurring && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      {/* Recurrence Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Frecuencia de envío</label>
                        <select
                          value={formData.recurrenceType}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              recurrenceType: e.target.value as 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY',
                              recurrenceInterval: e.target.value === 'ONCE' ? 1 : formData.recurrenceInterval,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                        >
                          {RECURRENCE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Recurrence Interval */}
                      {formData.recurrenceType !== 'ONCE' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Cada cuántos {
                              formData.recurrenceType === 'DAILY' ? 'días' :
                              formData.recurrenceType === 'WEEKLY' ? 'semanas' :
                              formData.recurrenceType === 'MONTHLY' ? 'meses' :
                              'periodos'
                            }
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={formData.recurrenceInterval}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                recurrenceInterval: Math.max(1, parseInt(e.target.value) || 1),
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.recurrenceType === 'DAILY' 
                              ? `Se enviará cada ${formData.recurrenceInterval} día(s)`
                              : formData.recurrenceType === 'WEEKLY'
                              ? `Se enviará cada ${formData.recurrenceInterval} semana(s)`
                              : `Se enviará cada ${formData.recurrenceInterval} mes(es)`
                            }
                          </p>
                        </div>
                      )}

                      {/* Recurrence End Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Fecha de finalización (opcional)
                        </label>
                        <input
                          type="date"
                          value={formData.recurrenceEndDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              recurrenceEndDate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Si se deja vacío, la campaña se repetirá indefinidamente
                        </p>
                      </div>
                    </div>
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
              {isSubmitting 
                ? isEditMode ? 'Actualizando...' : 'Creando...'
                : isEditMode ? 'Actualizar Campaña' : 'Crear Campaña'
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
