'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MdSave, MdAdd, MdEdit, MdDelete, MdVisibility, MdClose,
  MdEmail, MdCode, MdInfo, MdPlayArrow, MdWarning
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { MessageTemplate, MessageChannel, MessageTrigger, MessageTiming } from '@/types';
import { clinicConfigurationsApi } from '@/api/clinic-configurations-api';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface TemplateValidationErrors {
  name?: string;
  content?: string;
  subject?: string;
  timingValue?: string;
}

const CHANNELS: { id: MessageChannel; name: string; icon: React.ReactNode }[] = [
  { id: 'whatsapp', name: 'WhatsApp', icon: <FaWhatsapp className="w-4 h-4" /> },
  { id: 'email', name: 'Email', icon: <MdEmail className="w-4 h-4" /> },
];

const TRIGGERS: { id: MessageTrigger; name: string; description: string }[] = [
  { id: 'appointment_created', name: 'Cita Creada', description: 'Cuando se agenda una nueva cita' },
  { id: 'appointment_confirmed', name: 'Cita Confirmada', description: 'Cuando el cliente confirma' },
  { id: 'appointment_reminder', name: 'Recordatorio', description: 'Antes de la cita' },
  { id: 'stylist_on_way', name: 'Estilista en Camino', description: 'Servicio a domicilio' },
  { id: 'service_started', name: 'Servicio Iniciado', description: 'Cuando comienza el servicio' },
  { id: 'service_completed', name: 'Servicio Completado', description: 'Cuando la mascota está lista' },
  { id: 'appointment_cancelled', name: 'Cita Cancelada', description: 'Cuando se cancela' },
  { id: 'payment_received', name: 'Pago Recibido', description: 'Confirmación de pago' },
  { id: 'review_request', name: 'Solicitar Reseña', description: 'Pedir opinión del servicio' },
  { id: 'birthday', name: 'Cumpleaños', description: 'Cumpleaños de mascota' },
  { id: 'vaccination_reminder', name: 'Vacunación', description: 'Recordatorio de vacuna' },
  { id: 'custom', name: 'Personalizado', description: 'Envío manual' },
];

const TIMINGS: { id: MessageTiming; name: string }[] = [
  { id: 'immediate', name: 'Inmediato' },
  { id: 'minutes_before', name: 'Minutos antes' },
  { id: 'hours_before', name: 'Horas antes' },
  { id: 'days_before', name: 'Días antes' },
  { id: 'hours_after', name: 'Horas después' },
  { id: 'days_after', name: 'Días después' },
];

const TEMPLATE_VARIABLES = [
  { key: '{{clientName}}', description: 'Nombre del cliente' },
  { key: '{{petName}}', description: 'Nombre de la mascota' },
  { key: '{{petBreed}}', description: 'Raza de la mascota' },
  { key: '{{appointmentDate}}', description: 'Fecha de la cita' },
  { key: '{{appointmentTime}}', description: 'Hora de la cita' },
  { key: '{{serviceName}}', description: 'Nombre del servicio' },
  { key: '{{servicePrice}}', description: 'Precio del servicio' },
  { key: '{{stylistName}}', description: 'Nombre del estilista' },
  { key: '{{clinicName}}', description: 'Nombre de la clínica' },
  { key: '{{clinicPhone}}', description: 'Teléfono de la clínica' },
  { key: '{{clinicAddress}}', description: 'Dirección de la clínica' },
  { key: '{{confirmationLink}}', description: 'Link para confirmar' },
  { key: '{{cancellationLink}}', description: 'Link para cancelar' },
  { key: '{{reviewLink}}', description: 'Link para reseña' },
];

const DEFAULT_TEMPLATE: Partial<MessageTemplate> = {
  name: '',
  channel: 'whatsapp',
  trigger: 'appointment_created',
  timing: 'immediate',
  timingValue: 0,
  subject: '',
  content: '',
  isActive: true,
};

export const MessageTemplatesTab: React.FC = () => {
  const { user } = useAuth();
  const clinicId = user?.clinic_id || '';

  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<MessageChannel>('whatsapp');
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<MessageTemplate>>(DEFAULT_TEMPLATE);
  const [templateErrors, setTemplateErrors] = useState<TemplateValidationErrors>({});
  const [templateTouched, setTemplateTouched] = useState<Record<string, boolean>>({});

  // Template validation function
  const validateTemplate = useCallback((): TemplateValidationErrors => {
    const newErrors: TemplateValidationErrors = {};

    if (!editingTemplate.name?.trim()) {
      newErrors.name = 'El nombre de la plantilla es requerido';
    } else if (editingTemplate.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!editingTemplate.content?.trim()) {
      newErrors.content = 'El contenido es requerido';
    } else if (editingTemplate.content.trim().length < 10) {
      newErrors.content = 'El contenido debe tener al menos 10 caracteres';
    }

    if (editingTemplate.channel === 'email' && !editingTemplate.subject?.trim()) {
      newErrors.subject = 'El asunto es requerido para emails';
    }

    if (editingTemplate.timing !== 'immediate') {
      if (!editingTemplate.timingValue || editingTemplate.timingValue < 1) {
        newErrors.timingValue = 'El valor debe ser mayor a 0';
      }
    }

    return newErrors;
  }, [editingTemplate]);

  // Validate on template change
  useEffect(() => {
    if (showEditor) {
      const newErrors = validateTemplate();
      setTemplateErrors(newErrors);
    }
  }, [editingTemplate, showEditor, validateTemplate]);

  // Template field blur handler
  const handleTemplateBlur = (fieldName: string) => {
    setTemplateTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  // Template error helpers
  const showTemplateError = (fieldName: string) => templateTouched[fieldName] && templateErrors[fieldName as keyof TemplateValidationErrors];
  const getTemplateErrorMessage = (fieldName: string) => templateErrors[fieldName as keyof TemplateValidationErrors];
  const hasTemplateErrors = Object.keys(templateErrors).length > 0;

  useEffect(() => {
    loadTemplates();
  }, [clinicId]);

  const loadTemplates = async () => {
    if (!clinicId) return;
    try {
      setIsLoading(true);
      const data = await clinicConfigurationsApi.getMessageTemplates(clinicId);
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Error al cargar plantillas');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t => t.channel === selectedChannel);

  const handleCreate = () => {
    setEditingTemplate({ ...DEFAULT_TEMPLATE, channel: selectedChannel });
    setTemplateTouched({});
    setTemplateErrors({});
    setShowEditor(true);
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setTemplateTouched({});
    setTemplateErrors({});
    setShowEditor(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    try {
      await clinicConfigurationsApi.deleteMessageTemplate(clinicId, id);
      toast.success('Plantilla eliminada');
      await loadTemplates();
    } catch (error) {
      toast.error('Error al eliminar plantilla');
    }
  };

  const handleSave = async () => {
    // Mark all fields as touched
    setTemplateTouched({ name: true, content: true, subject: true, timingValue: true });

    // Validate
    const validationErrors = validateTemplate();
    if (Object.keys(validationErrors).length > 0) {
      toast.error('Completa los campos requeridos correctamente');
      return;
    }

    setIsSaving(true);
    try {
      if (editingTemplate.id) {
        await clinicConfigurationsApi.updateMessageTemplate(clinicId, editingTemplate.id, editingTemplate);
      } else {
        await clinicConfigurationsApi.createMessageTemplate(clinicId, editingTemplate);
      }
      toast.success('Plantilla guardada');
      setShowEditor(false);
      await loadTemplates();
    } catch (error) {
      toast.error('Error al guardar plantilla');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setTemplateTouched(prev => ({ ...prev, [name]: true }));
    setEditingTemplate(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const content = editingTemplate.content || '';
      const newContent = content.substring(0, start) + variable + content.substring(end);
      setEditingTemplate(prev => ({ ...prev, content: newContent }));
    }
  };

  const getPreviewContent = () => {
    let content = editingTemplate.content || '';
    const sampleData: Record<string, string> = {
      '{{clientName}}': 'María García',
      '{{petName}}': 'Luna',
      '{{petBreed}}': 'Golden Retriever',
      '{{appointmentDate}}': '15 de Marzo',
      '{{appointmentTime}}': '10:30 AM',
      '{{serviceName}}': 'Baño y Corte',
      '{{servicePrice}}': '$450',
      '{{stylistName}}': 'Carlos',
      '{{clinicName}}': 'Vibrapet',
      '{{clinicPhone}}': '+52 55 1234 5678',
      '{{clinicAddress}}': 'Av. Principal 123',
      '{{confirmationLink}}': 'https://...',
      '{{cancellationLink}}': 'https://...',
      '{{reviewLink}}': 'https://...',
    };
    Object.entries(sampleData).forEach(([key, value]) => {
      content = content.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    return content;
  };

  const getTriggerLabel = (trigger: MessageTrigger) => {
    return TRIGGERS.find(t => t.id === trigger)?.name || trigger;
  };

  const getTimingLabel = (timing: MessageTiming, value?: number) => {
    const t = TIMINGS.find(t => t.id === timing);
    if (timing === 'immediate') return 'Inmediato';
    return `${value} ${t?.name.toLowerCase()}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl">
      {/* Channel Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {CHANNELS.map(channel => (
          <button
            key={channel.id}
            onClick={() => setSelectedChannel(channel.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              selectedChannel === channel.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {channel.icon}
            {channel.name}
          </button>
        ))}
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white">
              <MdCode className="text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                Plantillas de {selectedChannel === 'whatsapp' ? 'WhatsApp' : 'Email'}
              </h3>
              <p className="text-sm text-slate-500">Administra tus plantillas de mensajes</p>
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            <MdAdd className="w-5 h-5" />
            Nueva Plantilla
          </button>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p>No hay plantillas configuradas</p>
            <p className="text-sm mt-1">Crea una plantilla para automatizar mensajes</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTemplates.map(template => (
              <div key={template.id} className="p-4 hover:bg-slate-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-900">{template.name}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        template.isActive 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {template.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-slate-500">
                        Trigger: <span className="text-slate-700">{getTriggerLabel(template.trigger)}</span>
                      </span>
                      <span className="text-sm text-slate-500">
                        Timing: <span className="text-slate-700">{getTimingLabel(template.timing, template.timingValue)}</span>
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                      {template.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => { setEditingTemplate(template); setShowPreview(true); }}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                      title="Vista previa"
                    >
                      <MdVisibility className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg"
                      title="Editar"
                    >
                      <MdEdit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Eliminar"
                    >
                      <MdDelete className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
            onClick={() => setShowEditor(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between shadow-sm rounded-t-xl">
              <h3 className="font-semibold text-lg text-white">
                {editingTemplate.id ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h3>
              <button 
                onClick={() => setShowEditor(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition duration-200"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nombre de la Plantilla <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editingTemplate.name || ''}
                      onChange={handleChange}
                      onBlur={() => handleTemplateBlur('name')}
                      placeholder="Ej: Confirmación de cita"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        showTemplateError('name') ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {showTemplateError('name') && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <MdWarning className="w-3 h-3" /> {getTemplateErrorMessage('name')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Canal
                    </label>
                    <select
                      name="channel"
                      value={editingTemplate.channel}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {CHANNELS.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Trigger and Timing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Disparador
                    </label>
                    <select
                      name="trigger"
                      value={editingTemplate.trigger}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {TRIGGERS.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Timing
                    </label>
                    <select
                      name="timing"
                      value={editingTemplate.timing}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {TIMINGS.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {editingTemplate.timing !== 'immediate' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Valor <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="timingValue"
                        value={editingTemplate.timingValue || 0}
                        onChange={handleChange}
                        onBlur={() => handleTemplateBlur('timingValue')}
                        min={1}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          showTemplateError('timingValue') ? 'border-red-400 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {showTemplateError('timingValue') && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <MdWarning className="w-3 h-3" /> {getTemplateErrorMessage('timingValue')}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Subject (Email only) */}
                {editingTemplate.channel === 'email' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Asunto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={editingTemplate.subject || ''}
                      onChange={handleChange}
                      onBlur={() => handleTemplateBlur('subject')}
                      placeholder="Ej: Tu cita en {{clinicName}} está confirmada"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        showTemplateError('subject') ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {showTemplateError('subject') && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <MdWarning className="w-3 h-3" /> {getTemplateErrorMessage('subject')}
                      </p>
                    )}
                  </div>
                )}

                {/* Content */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-slate-700">
                      Contenido <span className="text-red-500">*</span>
                    </label>
                    <button
                      onClick={() => setShowVariables(!showVariables)}
                      className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                    >
                      <MdCode className="w-4 h-4" />
                      {showVariables ? 'Ocultar' : 'Ver'} Variables
                    </button>
                  </div>

                  {showVariables && (
                    <div className="mb-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-500 mb-2">Click para insertar:</p>
                      <div className="flex flex-wrap gap-2">
                        {TEMPLATE_VARIABLES.map(v => (
                          <button
                            key={v.key}
                            onClick={() => insertVariable(v.key)}
                            className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-primary-50 hover:border-primary-300"
                            title={v.description}
                          >
                            {v.key}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <textarea
                    id="template-content"
                    name="content"
                    value={editingTemplate.content || ''}
                    onChange={handleChange}
                    onBlur={() => handleTemplateBlur('content')}
                    rows={6}
                    placeholder="Hola {{clientName}}, tu cita para {{petName}} ha sido confirmada para el {{appointmentDate}} a las {{appointmentTime}}..."
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm ${
                      showTemplateError('content') ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {showTemplateError('content') && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <MdWarning className="w-3 h-3" /> {getTemplateErrorMessage('content')}
                    </p>
                  )}
                </div>

                {/* Active Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={editingTemplate.isActive ?? true}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Plantilla activa
                  </span>
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => { setShowEditor(false); setShowPreview(true); }}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition"
              >
                <MdPlayArrow className="w-5 h-5" />
                Vista Previa
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || hasTemplateErrors}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <MdSave className="w-5 h-5" />
                  )}
                  Guardar
                </button>
              </div>
            </div>
            </div>
          </div>
        </>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
            onClick={() => setShowPreview(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between shadow-sm rounded-t-xl">
              <h3 className="font-semibold text-lg text-white">Vista Previa</h3>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition duration-200"
              >
                <MdClose className="w-5 h-5" />
                </button>
              </div>

            <div className="p-6">
              {editingTemplate.channel === 'whatsapp' ? (
                <div className="bg-[#e5ddd5] rounded-lg p-4">
                  <div className="bg-white rounded-lg p-3 shadow-sm max-w-[85%]">
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">
                      {getPreviewContent()}
                    </p>
                    <p className="text-xs text-slate-400 text-right mt-1">10:30 AM</p>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 p-3 border-b border-slate-200">
                    <p className="text-sm">
                      <span className="text-slate-500">Asunto:</span>{' '}
                      <span className="font-medium text-slate-700">{editingTemplate.subject || '(Sin asunto)'}</span>
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {getPreviewContent()}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <MdInfo className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Las variables se reemplazarán con datos reales al enviar el mensaje.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition"
              >
                Cerrar
              </button>
            </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
