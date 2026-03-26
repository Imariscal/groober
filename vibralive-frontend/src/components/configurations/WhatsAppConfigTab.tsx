'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MdSave, MdSend, MdCheckCircle, MdError, MdInfo, MdNotifications, MdWarning } from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { WhatsAppConfig, WhatsAppProvider } from '@/types';
import { clinicConfigurationsApi } from '@/api/clinic-configurations-api';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

// Validation patterns
const VALIDATION_PATTERNS = {
  PHONE: /^\+?[1-9]\d{6,14}$/,
  URL: /^https?:\/\/.+/,
};

interface ValidationErrors {
  accessToken?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  accountSid?: string;
  authToken?: string;
  twilioPhoneNumber?: string;
  apiKey?: string;
  senderPhone?: string;
  webhookUrl?: string;
  dailyLimit?: string;
  reminderHoursBefore?: string;
}

const WHATSAPP_PROVIDERS: { id: WhatsAppProvider; name: string; description: string; docs: string }[] = [
  { id: 'meta', name: 'Meta Business API', description: 'API oficial de WhatsApp', docs: 'https://developers.facebook.com/docs/whatsapp' },
  { id: 'twilio', name: 'Twilio', description: 'Fácil integración, sandbox disponible', docs: 'https://www.twilio.com/whatsapp' },
  { id: '360dialog', name: '360dialog', description: 'Partner oficial de Meta', docs: 'https://www.360dialog.com' },
  { id: 'messagebird', name: 'MessageBird', description: 'Multi-canal', docs: 'https://messagebird.com' },
  { id: 'wati', name: 'WATI', description: 'Simple y accesible', docs: 'https://www.wati.io' },
];

export const WhatsAppConfigTab: React.FC = () => {
  const { user } = useAuth();
  const clinicId = user?.clinic_id || '';

  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    provider: 'meta' as WhatsAppProvider,
    // Meta
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    appId: '',
    // Twilio
    accountSid: '',
    authToken: '',
    twilioPhoneNumber: '',
    // Common
    apiKey: '',
    senderPhone: '',
    webhookUrl: '',
    webhookSecret: '',
    dailyLimit: 1000,
    // Preferences
    sendAppointmentConfirmation: true,
    sendAppointmentReminder: true,
    reminderHoursBefore: 24,
    sendStylistOnWay: true,
    sendServiceCompleted: true,
  });

  useEffect(() => {
    loadConfig();
  }, [clinicId]);

  const loadConfig = async () => {
    if (!clinicId) return;
    try {
      setIsLoading(true);
      const data = await clinicConfigurationsApi.getWhatsAppConfig(clinicId);
      if (data && typeof data === 'object' && 'clinicId' in data) {
        setConfig(data);
        setFormData({
          provider: data.provider || 'meta',
          accessToken: '',
          phoneNumberId: data.phoneNumberId || '',
          businessAccountId: data.businessAccountId || '',
          appId: data.appId || '',
          accountSid: data.accountSid || '',
          authToken: '',
          twilioPhoneNumber: data.twilioPhoneNumber || '',
          apiKey: '',
          senderPhone: data.senderPhone || '',
          webhookUrl: data.webhookUrl || '',
          webhookSecret: '',
          dailyLimit: data.dailyLimit || 1000,
          sendAppointmentConfirmation: data.sendAppointmentConfirmation ?? true,
          sendAppointmentReminder: data.sendAppointmentReminder ?? true,
          reminderHoursBefore: data.reminderHoursBefore || 24,
          sendStylistOnWay: data.sendStylistOnWay ?? true,
          sendServiceCompleted: data.sendServiceCompleted ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading WhatsApp config:', error);
      toast.error('Error al cargar configuración de WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };

  // Validation function - always validate based on selected provider
  const validateForm = useCallback((): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // Meta API validations
    if (formData.provider === 'meta') {
      if (!formData.accessToken && !config?.accessToken) {
        newErrors.accessToken = 'El Access Token es obligatorio';
      }
      if (!formData.phoneNumberId.trim()) {
        newErrors.phoneNumberId = 'El Phone Number ID es obligatorio';
      }
    }

    // Twilio validations
    if (formData.provider === 'twilio') {
      if (!formData.accountSid.trim()) {
        newErrors.accountSid = 'El Account SID es obligatorio';
      }
      if (!formData.authToken && !config?.authToken) {
        newErrors.authToken = 'El Auth Token es obligatorio';
      }
      if (!formData.twilioPhoneNumber.trim()) {
        newErrors.twilioPhoneNumber = 'El número de WhatsApp Twilio es obligatorio';
      } else if (!VALIDATION_PATTERNS.PHONE.test(formData.twilioPhoneNumber.replace(/[\s\-]/g, ''))) {
        newErrors.twilioPhoneNumber = 'Número de teléfono inválido';
      }
    }

    // Other providers validations (360dialog, messagebird, wati)
    if (['360dialog', 'messagebird', 'wati'].includes(formData.provider)) {
      if (!formData.apiKey && !config?.apiKey) {
        newErrors.apiKey = 'El API Key es obligatorio';
      }
      if (!formData.senderPhone.trim()) {
        newErrors.senderPhone = 'El número de envío es obligatorio';
      } else if (!VALIDATION_PATTERNS.PHONE.test(formData.senderPhone.replace(/[\s\-]/g, ''))) {
        newErrors.senderPhone = 'Número de teléfono inválido';
      }
    }

    // Webhook URL validation (optional but must be valid if provided)
    if (formData.webhookUrl.trim() && !VALIDATION_PATTERNS.URL.test(formData.webhookUrl)) {
      newErrors.webhookUrl = 'URL inválida. Debe empezar con http:// o https://';
    }

    // Daily limit validation
    if (formData.dailyLimit < 1 || formData.dailyLimit > 10000) {
      newErrors.dailyLimit = 'El límite diario debe estar entre 1 y 10,000';
    }

    // Reminder hours validation
    if (formData.reminderHoursBefore < 1 || formData.reminderHoursBefore > 72) {
      newErrors.reminderHoursBefore = 'Las horas de recordatorio deben estar entre 1 y 72';
    }

    return newErrors;
  }, [formData, config]);

  // Validate on form data change
  useEffect(() => {
    const newErrors = validateForm();
    setErrors(newErrors);
  }, [formData, validateForm]);

  // Mark field as touched on blur
  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  // Helper to show error for a field
  const showError = (fieldName: string) => touched[fieldName] && errors[fieldName as keyof ValidationErrors];
  const getErrorMessage = (fieldName: string) => errors[fieldName as keyof ValidationErrors];
  const hasErrors = Object.keys(errors).length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                     type === 'number' ? parseInt(value) || 0 : value;
    
    setTouched(prev => ({ ...prev, [name]: true }));
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleProviderChange = (provider: WhatsAppProvider) => {
    // Mark provider-specific required fields as touched when changing provider
    const providerTouchedFields: Record<string, boolean> = {
      provider: true,
    };
    if (provider === 'meta') {
      providerTouchedFields.accessToken = true;
      providerTouchedFields.phoneNumberId = true;
    } else if (provider === 'twilio') {
      providerTouchedFields.accountSid = true;
      providerTouchedFields.authToken = true;
      providerTouchedFields.twilioPhoneNumber = true;
    } else if (['360dialog', 'messagebird', 'wati'].includes(provider)) {
      providerTouchedFields.apiKey = true;
      providerTouchedFields.senderPhone = true;
    }
    setTouched(prev => ({ ...prev, ...providerTouchedFields }));
    setFormData(prev => ({ ...prev, provider }));
  };

  const handleSave = async () => {
    if (!clinicId) return;

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => { allTouched[key] = true; });
    setTouched(allTouched);

    // Validate
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      toast.error('Por favor corrige los errores antes de guardar');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = { ...formData };
      // Only send secrets if changed
      if (!payload.accessToken) delete payload.accessToken;
      if (!payload.authToken) delete payload.authToken;
      if (!payload.apiKey) delete payload.apiKey;
      if (!payload.webhookSecret) delete payload.webhookSecret;

      await clinicConfigurationsApi.updateWhatsAppConfig(clinicId, payload);
      toast.success('Configuración de WhatsApp guardada');
      await loadConfig();
    } catch (error) {
      console.error('Error saving WhatsApp config:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!clinicId || !testPhone) {
      toast.error('Ingresa un número de teléfono');
      return;
    }

    setIsTesting(true);
    try {
      const result = await clinicConfigurationsApi.testWhatsAppConfig(clinicId, testPhone);
      if (result.success) {
        toast.success(result.message);
        await loadConfig();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error('Error al enviar mensaje de prueba');
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl">
      {/* Status Card */}
      {config && (
        <div className={`rounded-xl p-4 border ${
          config.isVerified 
            ? 'bg-emerald-50 border-emerald-200' 
            : config.lastError 
              ? 'bg-red-50 border-red-200'
              : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {config.isVerified ? (
                <MdCheckCircle className="w-6 h-6 text-emerald-500" />
              ) : config.lastError ? (
                <MdError className="w-6 h-6 text-red-500" />
              ) : (
                <MdInfo className="w-6 h-6 text-amber-500" />
              )}
              <div>
                <p className={`font-medium ${
                  config.isVerified ? 'text-emerald-700' : 
                  config.lastError ? 'text-red-700' : 'text-amber-700'
                }`}>
                  {config.isVerified ? 'Conexión verificada' : 
                   config.lastError ? 'Error en conexión' : 'Pendiente de verificar'}
                </p>
                {config.lastError && (
                  <p className="text-sm text-red-600">{config.lastError}</p>
                )}
              </div>
            </div>
            {config.isActive && (
              <div className="text-right">
                <p className="text-sm text-slate-600">
                  Mensajes hoy: <span className="font-semibold">{config.messagesSentToday}</span> / {config.dailyLimit}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Provider Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white">
            <FaWhatsapp className="text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Seleccionar Proveedor</h3>
            <p className="text-sm text-slate-500">Elige el servicio para enviar mensajes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {WHATSAPP_PROVIDERS.map(provider => (
            <button
              key={provider.id}
              onClick={() => handleProviderChange(provider.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                formData.provider === provider.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-medium text-slate-900">{provider.name}</p>
              <p className="text-xs text-slate-500">{provider.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Meta API Config */}
      {formData.provider === 'meta' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
              <MdInfo className="text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Configuración Meta Business API</h3>
              <p className="text-sm text-slate-500">Credenciales del panel de Meta for Developers</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Access Token <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="accessToken"
                value={formData.accessToken}
                onChange={handleChange}
                onBlur={() => handleBlur('accessToken')}
                placeholder="••••••••"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  showError('accessToken') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              />
              {showError('accessToken') && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <MdWarning className="w-3 h-3" /> {getErrorMessage('accessToken')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone Number ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phoneNumberId"
                value={formData.phoneNumberId}
                onChange={handleChange}
                onBlur={() => handleBlur('phoneNumberId')}
                placeholder="123456789012345"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  showError('phoneNumberId') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              />
              {showError('phoneNumberId') && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <MdWarning className="w-3 h-3" /> {getErrorMessage('phoneNumberId')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Business Account ID
              </label>
              <input
                type="text"
                name="businessAccountId"
                value={formData.businessAccountId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                App ID
              </label>
              <input
                type="text"
                name="appId"
                value={formData.appId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Twilio Config */}
      {formData.provider === 'twilio' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white">
              <MdInfo className="text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Configuración Twilio</h3>
              <p className="text-sm text-slate-500">Credenciales de tu cuenta Twilio</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Account SID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="accountSid"
                value={formData.accountSid}
                onChange={handleChange}
                onBlur={() => handleBlur('accountSid')}
                placeholder="AC..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  showError('accountSid') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              />
              {showError('accountSid') && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <MdWarning className="w-3 h-3" /> {getErrorMessage('accountSid')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Auth Token <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="authToken"
                value={formData.authToken}
                onChange={handleChange}
                onBlur={() => handleBlur('authToken')}
                placeholder="••••••••"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  showError('authToken') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              />
              {showError('authToken') && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <MdWarning className="w-3 h-3" /> {getErrorMessage('authToken')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Número WhatsApp Twilio <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="twilioPhoneNumber"
                value={formData.twilioPhoneNumber}
                onChange={handleChange}
                onBlur={() => handleBlur('twilioPhoneNumber')}
                placeholder="+14155238886"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  showError('twilioPhoneNumber') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              />
              {showError('twilioPhoneNumber') && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <MdWarning className="w-3 h-3" /> {getErrorMessage('twilioPhoneNumber')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Other providers (360dialog, messagebird, wati) */}
      {['360dialog', 'messagebird', 'vonage', 'wati'].includes(formData.provider) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center text-white">
              <MdInfo className="text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Configuración API</h3>
              <p className="text-sm text-slate-500">Credenciales del proveedor seleccionado</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                API Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="apiKey"
                value={formData.apiKey}
                onChange={handleChange}
                onBlur={() => handleBlur('apiKey')}
                placeholder="••••••••"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  showError('apiKey') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              />
              {showError('apiKey') && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <MdWarning className="w-3 h-3" /> {getErrorMessage('apiKey')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Número de Envío <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="senderPhone"
                value={formData.senderPhone}
                onChange={handleChange}
                onBlur={() => handleBlur('senderPhone')}
                placeholder="+521234567890"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  showError('senderPhone') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              />
              {showError('senderPhone') && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <MdWarning className="w-3 h-3" /> {getErrorMessage('senderPhone')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Common Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white">
            <MdInfo className="text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Configuración General</h3>
            <p className="text-sm text-slate-500">Webhook y límites de mensajes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Webhook URL (opcional)
            </label>
            <input
              type="text"
              name="webhookUrl"
              value={formData.webhookUrl}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Límite Diario de Mensajes
            </label>
            <input
              type="number"
              name="dailyLimit"
              value={formData.dailyLimit}
              onChange={handleChange}
              min={1}
              max={10000}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center text-white">
            <MdNotifications className="text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Notificaciones Automáticas</h3>
            <p className="text-sm text-slate-500">Envíos automáticos de mensajes</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50">
            <input
              type="checkbox"
              name="sendAppointmentConfirmation"
              checked={formData.sendAppointmentConfirmation}
              onChange={handleChange}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
            />
            <div>
              <span className="font-medium text-slate-700">Confirmación de cita</span>
              <p className="text-sm text-slate-500">Enviar mensaje cuando se agenda una cita</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50">
            <input
              type="checkbox"
              name="sendAppointmentReminder"
              checked={formData.sendAppointmentReminder}
              onChange={handleChange}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
            />
            <div className="flex-1">
              <span className="font-medium text-slate-700">Recordatorio de cita</span>
              <p className="text-sm text-slate-500">Enviar recordatorio antes de la cita</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="reminderHoursBefore"
                value={formData.reminderHoursBefore}
                onChange={handleChange}
                min={1}
                max={72}
                className="w-16 px-2 py-1 text-sm border border-slate-300 rounded"
              />
              <span className="text-sm text-slate-500">horas antes</span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50">
            <input
              type="checkbox"
              name="sendStylistOnWay"
              checked={formData.sendStylistOnWay}
              onChange={handleChange}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
            />
            <div>
              <span className="font-medium text-slate-700">Estilista en camino</span>
              <p className="text-sm text-slate-500">Notificar cuando el estilista va en camino (domicilio)</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50">
            <input
              type="checkbox"
              name="sendServiceCompleted"
              checked={formData.sendServiceCompleted}
              onChange={handleChange}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
            />
            <div>
              <span className="font-medium text-slate-700">Servicio completado</span>
              <p className="text-sm text-slate-500">Notificar cuando la mascota está lista</p>
            </div>
          </label>
        </div>
      </div>

      {/* Test Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white">
            <MdSend className="text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Probar Conexión</h3>
            <p className="text-sm text-slate-500">Envía un mensaje de prueba</p>
          </div>
        </div>
        <div className="flex gap-3">
          <input
            type="tel"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="+521234567890"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <button
            onClick={handleTest}
            disabled={isTesting || !testPhone}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
          >
            {isTesting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <MdSend className="w-5 h-5" />
            )}
            Enviar Prueba
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving || hasErrors}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <MdSave className="w-5 h-5" />
          )}
          Guardar Cambios
        </button>
      </div>
    </div>
  );
};
