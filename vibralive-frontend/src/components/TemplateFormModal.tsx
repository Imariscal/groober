'use client';

import React, { useState, useEffect } from 'react';
import { MdClose, MdCheck } from 'react-icons/md';
import { campaignTemplatesApi, type CampaignTemplate, type CreateCampaignTemplateDto, type UpdateCampaignTemplateDto } from '@/lib/campaigns-api';
import toast from 'react-hot-toast';

const SUPPORTED_VARIABLES = [
  '{{clientName}}',
  '{{clientFirstName}}',
  '{{clientEmail}}',
  '{{clientPhone}}',
  '{{clientCity}}',
  '{{clientState}}',
  '{{petName}}',
  '{{petSpecies}}',
  '{{petBreed}}',
  '{{petAge}}',
  '{{petWeightKg}}',
  '{{microchipId}}',
  '{{appointmentDate}}',
  '{{appointmentTime}}',
  '{{appointmentType}}',
  '{{veterinarianName}}',
  '{{clinicName}}',
  '{{clinicPhone}}',
  '{{clinicEmail}}',
  '{{clinicCity}}',
  '{{clinicAddress}}',
  '{{confirmationLink}}',
  '{{currentDate}}',
  '{{currentTime}}',
  '{{currentYear}}',
];

interface TemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  template?: CampaignTemplate; // Si existe, es modo editar
}

export function TemplateFormModal({
  isOpen,
  onClose,
  onSuccess,
  template,
}: TemplateFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);

  const isEditing = !!template;

  const [formData, setFormData] = useState<CreateCampaignTemplateDto>({
    name: '',
    description: '',
    channel: 'WHATSAPP',
    subject: '',
    body: '',
    bodyHtml: '',
    whatsappTemplateName: '',
    whatsappTemplateLanguage: 'es',
  });

  // Inicializar form cuando el template cambia
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        channel: template.channel,
        subject: template.subject || '',
        body: template.body,
        bodyHtml: template.bodyHtml || '',
        whatsappTemplateName: '',
        whatsappTemplateLanguage: 'es',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        channel: 'WHATSAPP',
        subject: '',
        body: '',
        bodyHtml: '',
        whatsappTemplateName: '',
        whatsappTemplateLanguage: 'es',
      });
    }
    setError(null);
  }, [template]);

  // Detectar variables
  useEffect(() => {
    const regex = /\{\{([a-zA-Z]+)\}\}/g;
    const found = new Set<string>();

    const checkContent = [formData.body, formData.subject, formData.bodyHtml]
      .filter(Boolean)
      .join(' ');

    let match;
    while ((match = regex.exec(checkContent)) !== null) {
      found.add(`{{${match[1]}}}`);
    }

    setDetectedVariables(Array.from(found));
  }, [formData.body, formData.subject, formData.bodyHtml]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name || !formData.body) {
      setError('Por favor completa los campos obligatorios');
      return;
    }

    if (formData.channel === 'EMAIL' && !formData.subject) {
      setError('El asunto es obligatorio para plantillas de Email');
      return;
    }

    if (formData.channel === 'WHATSAPP' && !isEditing && !formData.whatsappTemplateName) {
      setError('El nombre de plantilla de WhatsApp es obligatorio');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (isEditing && template) {
        // Actualizar
        const updateData: UpdateCampaignTemplateDto = {
          name: formData.name,
          description: formData.description,
          subject: formData.subject,
          body: formData.body,
          bodyHtml: formData.bodyHtml,
        };
        await campaignTemplatesApi.updateTemplate(template.id, updateData);
        toast.success('Plantilla actualizada correctamente');
      } else {
        // Crear
        const createData: CreateCampaignTemplateDto = {
          name: formData.name,
          description: formData.description,
          channel: formData.channel,
          subject: formData.subject,
          body: formData.body,
          bodyHtml: formData.bodyHtml,
          whatsappTemplateName: formData.channel === 'WHATSAPP' ? formData.whatsappTemplateName : undefined,
          whatsappTemplateLanguage: formData.channel === 'WHATSAPP' ? formData.whatsappTemplateLanguage : undefined,
        };
        await campaignTemplatesApi.createTemplate(createData);
        toast.success('Plantilla creada correctamente');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error saving template:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar la plantilla';
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
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
          {/* Header - Primary Gradient */}
          <div className="z-20 bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between border-b border-primary-600 shadow-sm">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                {isEditing ? 'Editar plantilla' : 'Nueva plantilla de campaña'}
              </h2>
              <p className="text-primary-100 text-sm mt-1">
                {isEditing ? 'Actualiza la información de la plantilla' : 'Completa los datos para crear una nueva plantilla'}
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
          <form onSubmit={handleSubmit} id="template-form" className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Nombre *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Recordatorio de vacunación"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            {/* Canal */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Canal {!isEditing && '*'}</label>
              <select
                value={formData.channel}
                onChange={(e) =>
                  setFormData({ ...formData, channel: e.target.value as 'WHATSAPP' | 'EMAIL' })
                }
                disabled={isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                required={!isEditing}
              >
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">Email</option>
              </select>
              {isEditing && <p className="text-xs text-gray-500 mt-1">No se puede cambiar el canal al editar</p>}
            </div>
          </div>

          {/* Nombre de Plantilla WhatsApp (solo para WhatsApp, solo al crear) */}
          {formData.channel === 'WHATSAPP' && !isEditing && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Nombre de Plantilla WhatsApp *
                </label>
                <input
                  type="text"
                  value={formData.whatsappTemplateName}
                  onChange={(e) => setFormData({ ...formData, whatsappTemplateName: e.target.value })}
                  placeholder="Ej: mi_plantilla_vacunacion"
                  required={formData.channel === 'WHATSAPP' && !isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Nombre exacto de la plantilla registrada en Meta/WhatsApp</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Idioma de Plantilla</label>
                <select
                  value={formData.whatsappTemplateLanguage || 'es'}
                  onChange={(e) => setFormData({ ...formData, whatsappTemplateLanguage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="es">Español (es)</option>
                  <option value="en">Inglés (en)</option>
                  <option value="pt">Portugués (pt)</option>
                  <option value="pt_BR">Portugués Brasil (pt_BR)</option>
                  <option value="fr">Francés (fr)</option>
                </select>
              </div>
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción de la plantilla..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              rows={2}
            />
          </div>

          {/* Asunto (solo para Email) */}
          {formData.channel === 'EMAIL' && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Asunto del Email *</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Ej: Recuerda tu cita veterinaria"
                required={formData.channel === 'EMAIL'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
          )}

          {/* Cuerpo del mensaje */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Cuerpo del mensaje *</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Ej: Hola {{clientName}}, recuerda que {{petName}} tiene una cita el {{appointmentDate}}..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm text-gray-900"
              rows={6}
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              Usa variables como {`{{clientName}}`} para personalizar el mensaje
            </p>
          </div>

          {/* Body HTML (opcional para Email) */}
          {formData.channel === 'EMAIL' && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Cuerpo HTML (opcional)</label>
              <textarea
                value={formData.bodyHtml}
                onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
                placeholder="HTML del email (opcional)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm text-gray-900"
                rows={6}
              />
            </div>
          )}

          {/* Variables detectadas */}
          {detectedVariables.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm">Variables detectadas:</h3>
              <div className="flex flex-wrap gap-2">
                {detectedVariables.map((variable) => (
                  <span
                    key={variable}
                    className="bg-blue-200 text-blue-900 px-3 py-1 rounded text-xs font-medium"
                  >
                    {variable}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Variables disponibles */}
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Variables disponibles:</h3>
            <div className="grid grid-cols-3 gap-2">
              {SUPPORTED_VARIABLES.map((variable) => (
                <button
                  key={variable}
                  type="button"
                  onClick={() => {
                    const textarea = document.querySelector(
                      `textarea[placeholder*="Hola"]`
                    ) as HTMLTextAreaElement;
                    if (textarea) {
                      const insertPos = textarea.selectionStart || 0;
                      const currentBody = formData.body;
                      const newBody =
                        currentBody.slice(0, insertPos) +
                        variable +
                        currentBody.slice(insertPos);
                      setFormData({ ...formData, body: newBody });
                    }
                  }}
                  className="text-left text-xs bg-white border border-gray-200 rounded p-2 hover:bg-blue-50 hover:border-blue-300 transition text-gray-700 font-medium"
                >
                  {variable}
                </button>
              ))}
            </div>
          </div>
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
              form="template-form"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 hover:shadow-lg rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
            >
              <MdCheck className="w-5 h-5" />
              {isSubmitting ? (isEditing ? 'Actualizando...' : 'Creando...') : isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
