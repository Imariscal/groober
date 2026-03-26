'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MdSave, MdEmail, MdSend, MdCheckCircle, MdError, MdInfo, MdWarning } from 'react-icons/md';
import { EmailConfig, EmailProvider } from '@/types';
import { clinicConfigurationsApi } from '@/api/clinic-configurations-api';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

// Validation patterns
const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  HOST: /^[a-zA-Z0-9][a-zA-Z0-9\-\.]+[a-zA-Z0-9]$/,
  PORT: /^\d{1,5}$/,
};

interface ValidationErrors {
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPassword?: string;
  apiKey?: string;
  apiDomain?: string;
  fromEmail?: string;
  fromName?: string;
  replyToEmail?: string;
}

const EMAIL_PROVIDERS: { id: EmailProvider; name: string; description: string }[] = [
  { id: 'platform', name: 'Plataforma', description: 'Usar configuración de Groober' },
  { id: 'smtp', name: 'SMTP', description: 'Servidor SMTP personalizado' },
  { id: 'sendgrid', name: 'SendGrid', description: 'API de SendGrid' },
  { id: 'mailgun', name: 'Mailgun', description: 'API de Mailgun' },
  { id: 'resend', name: 'Resend', description: 'API de Resend' },
  { id: 'postmark', name: 'Postmark', description: 'API de Postmark' },
  { id: 'ses', name: 'Amazon SES', description: 'Amazon Simple Email Service' },
];

const SMTP_PRESETS = [
  { name: 'Gmail', host: 'smtp.gmail.com', port: 587, secure: true },
  { name: 'Outlook', host: 'smtp.office365.com', port: 587, secure: true },
  { name: 'Yahoo', host: 'smtp.mail.yahoo.com', port: 587, secure: true },
  { name: 'Personalizado', host: '', port: 587, secure: true },
];

export const EmailConfigTab: React.FC = () => {
  const { user } = useAuth();
  const clinicId = user?.clinic_id || '';

  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    provider: 'platform' as EmailProvider,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: true,
    apiKey: '',
    apiDomain: '',
    fromEmail: '',
    fromName: '',
    replyToEmail: '',
  });

  useEffect(() => {
    loadConfig();
  }, [clinicId]);

  const loadConfig = async () => {
    if (!clinicId) return;
    try {
      setIsLoading(true);
      const data = await clinicConfigurationsApi.getEmailConfig(clinicId);
      if (data && typeof data === 'object' && 'clinicId' in data) {
        setConfig(data);
        const loadedData = {
          provider: data.provider || 'platform',
          smtpHost: data.smtpHost || '',
          smtpPort: data.smtpPort || 587,
          smtpUser: data.smtpUser || '',
          smtpPassword: '',
          smtpSecure: data.smtpSecure ?? true,
          apiKey: '',
          apiDomain: data.apiDomain || '',
          fromEmail: data.fromEmail || '',
          fromName: data.fromName || '',
          replyToEmail: data.replyToEmail || '',
        };
        setFormData(loadedData);
        setTouched({});
      }
    } catch (error) {
      console.error('Error loading email config:', error);
      toast.error('Error al cargar configuración de email');
    } finally {
      setIsLoading(false);
    }
  };

  // Validation function
  const validateForm = useCallback((): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // SMTP validations (only if SMTP provider selected)
    if (formData.provider === 'smtp') {
      if (!formData.smtpHost.trim()) {
        newErrors.smtpHost = 'El servidor SMTP es requerido';
      } else if (!VALIDATION_PATTERNS.HOST.test(formData.smtpHost)) {
        newErrors.smtpHost = 'Servidor SMTP inválido';
      }

      if (!formData.smtpPort || formData.smtpPort < 1 || formData.smtpPort > 65535) {
        newErrors.smtpPort = 'Puerto debe estar entre 1 y 65535';
      }

      if (!formData.smtpUser.trim()) {
        newErrors.smtpUser = 'El usuario SMTP es requerido';
      }

      if (!formData.smtpPassword && !config?.smtpUser) {
        newErrors.smtpPassword = 'La contraseña SMTP es requerida';
      }
    }

    // API providers validations
    if (['sendgrid', 'mailgun', 'resend', 'postmark', 'ses'].includes(formData.provider)) {
      if (!formData.apiKey && !config?.apiKey) {
        newErrors.apiKey = 'El API Key es requerido';
      }

      if (formData.provider === 'mailgun' && !formData.apiDomain.trim()) {
        newErrors.apiDomain = 'El dominio es requerido para Mailgun';
      }
    }

    // === REQUIRED FIELDS (always) ===
    if (!formData.fromEmail.trim()) {
      newErrors.fromEmail = 'El email de envío es obligatorio';
    } else if (!VALIDATION_PATTERNS.EMAIL.test(formData.fromEmail)) {
      newErrors.fromEmail = 'Email de envío inválido';
    }

    if (!formData.fromName.trim()) {
      newErrors.fromName = 'El nombre del remitente es obligatorio';
    }

    // Reply-to email validation (optional but must be valid if provided)
    if (formData.replyToEmail.trim() && !VALIDATION_PATTERNS.EMAIL.test(formData.replyToEmail)) {
      newErrors.replyToEmail = 'Email de respuesta inválido';
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

  const handleProviderChange = (provider: EmailProvider) => {
    // Mark provider-specific required fields as touched when changing provider
    const providerTouchedFields: Record<string, boolean> = {
      provider: true,
      fromEmail: true,
      fromName: true,
    };
    if (provider === 'smtp') {
      providerTouchedFields.smtpHost = true;
      providerTouchedFields.smtpPort = true;
      providerTouchedFields.smtpUser = true;
      providerTouchedFields.smtpPassword = true;
    } else if (['sendgrid', 'mailgun', 'resend', 'postmark', 'ses'].includes(provider)) {
      providerTouchedFields.apiKey = true;
      if (provider === 'mailgun') {
        providerTouchedFields.apiDomain = true;
      }
    }
    setTouched(prev => ({ ...prev, ...providerTouchedFields }));
    setFormData(prev => ({ ...prev, provider }));
  };

  const handleSMTPPreset = (preset: typeof SMTP_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      smtpHost: preset.host,
      smtpPort: preset.port,
      smtpSecure: preset.secure,
    }));
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
      // Clean empty strings before sending
      const cleanedData: Record<string, any> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim() === '') {
          return; // Skip empty strings
        }
        cleanedData[key] = value;
      });
      
      const payload: any = { ...cleanedData };
      // Only send password/apiKey if changed
      if (!payload.smtpPassword) delete payload.smtpPassword;
      if (!payload.apiKey) delete payload.apiKey;

      await clinicConfigurationsApi.updateEmailConfig(clinicId, payload);
      toast.success('Configuración de email guardada');
      await loadConfig();
    } catch (error) {
      console.error('Error saving email config:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!clinicId || !testEmail) {
      toast.error('Ingresa un email de prueba');
      return;
    }

    setIsTesting(true);
    try {
      const result = await clinicConfigurationsApi.testEmailConfig(clinicId, testEmail);
      if (result.success) {
        toast.success(result.message);
        await loadConfig();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error('Error al enviar email de prueba');
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl">
      {/* Status Card */}
      {config && (
        <div className={`rounded-xl p-4 border backdrop-blur-sm ${
          config.isVerified 
            ? 'bg-emerald-50 border-emerald-200' 
            : config.lastError 
              ? 'bg-red-50 border-red-200'
              : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            {config.isVerified ? (
              <MdCheckCircle className="w-6 h-6 text-emerald-500" />
            ) : config.lastError ? (
              <MdError className="w-6 h-6 text-red-500" />
            ) : (
              <MdInfo className="w-6 h-6 text-amber-500" />
            )}
            <div>
              <p className={`font-semibold ${
                config.isVerified ? 'text-emerald-700' : 
                config.lastError ? 'text-red-700' : 'text-amber-700'
              }`}>
                {config.isVerified ? '✓ Configuración verificada' : 
                 config.lastError ? '✗ Error en configuración' : '⚠ Pendiente de verificar'}
              </p>
              {config.lastError && (
                <p className="text-sm text-red-600">{config.lastError}</p>
              )}
              {config.lastVerifiedAt && (
                <p className="text-sm opacity-75">
                  Última verificación: {new Date(config.lastVerifiedAt).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Provider Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-lg flex items-center justify-center text-white">
            <MdEmail className="text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Proveedor de Email</h3>
            <p className="text-sm text-slate-500">Selecciona tu servicio de email</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {EMAIL_PROVIDERS.map(provider => (
            <button
              key={provider.id}
              onClick={() => handleProviderChange(provider.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all font-medium ${
                formData.provider === provider.id
                  ? 'border-sky-500 bg-sky-50 text-sky-900'
                  : 'border-slate-200 hover:border-sky-300 text-slate-700'
              }`}
            >
              <p className="font-semibold">{provider.name}</p>
              <p className="text-xs opacity-75">{provider.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Provider-specific Config */}
      {formData.provider === 'smtp' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white">
              <MdInfo className="text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Configuración SMTP</h3>
              <p className="text-sm text-slate-500">Serveraileros personalizados</p>
            </div>
            <div className="ml-auto flex gap-2">
              {SMTP_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => handleSMTPPreset(preset)}
                  className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-semibold transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Servidor SMTP {formData.provider === 'smtp' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                name="smtpHost"
                value={formData.smtpHost}
                onChange={handleChange}
                onBlur={() => handleBlur('smtpHost')}
                placeholder="smtp.example.com"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                  showError('smtpHost') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              />
              {showError('smtpHost') && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <MdWarning className="w-3 h-3" /> {getErrorMessage('smtpHost')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Puerto {formData.provider === 'smtp' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                name="smtpPort"
                value={formData.smtpPort}
                onChange={handleChange}
                onBlur={() => handleBlur('smtpPort')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                  showError('smtpPort') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              />
              {showError('smtpPort') && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <MdWarning className="w-3 h-3" /> {getErrorMessage('smtpPort')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Usuario {formData.provider === 'smtp' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                name="smtpUser"
                value={formData.smtpUser}
                onChange={handleChange}
                onBlur={() => handleBlur('smtpUser')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                  showError('smtpUser') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              />
              {showError('smtpUser') && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <MdWarning className="w-3 h-3" /> {getErrorMessage('smtpUser')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña {formData.provider === 'smtp' && !config?.smtpUser && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                name="smtpPassword"
                value={formData.smtpPassword}
                onChange={handleChange}
                onBlur={() => handleBlur('smtpPassword')}
                placeholder="••••••••"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                  showError('smtpPassword') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              />
              {showError('smtpPassword') && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <MdWarning className="w-3 h-3" /> {getErrorMessage('smtpPassword')}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="smtpSecure"
                  checked={formData.smtpSecure}
                  onChange={handleChange}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Usar TLS/SSL
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* API-based providers */}
      {['sendgrid', 'mailgun', 'resend', 'postmark', 'ses'].includes(formData.provider) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
              <MdInfo className="text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Configuración de API</h3>
              <p className="text-sm text-slate-500">Credenciales del servicio externo</p>
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                  showError('apiKey') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              />
              {showError('apiKey') && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <MdWarning className="w-3 h-3" /> {getErrorMessage('apiKey')}
                </p>
              )}
            </div>

            {formData.provider === 'mailgun' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Dominio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="apiDomain"
                  value={formData.apiDomain}
                  onChange={handleChange}
                  onBlur={() => handleBlur('apiDomain')}
                  placeholder="mg.tudominio.com"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                    showError('apiDomain') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {showError('apiDomain') && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <MdWarning className="w-3 h-3" /> {getErrorMessage('apiDomain')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sender Config */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
            <MdEmail className="text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Configuración del Remitente</h3>
            <p className="text-sm text-slate-500">Email y nombre visible en los mensajes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email de Envío <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="fromEmail"
              value={formData.fromEmail}
              onChange={handleChange}
              onBlur={() => handleBlur('fromEmail')}
              placeholder="noreply@tuclinica.com"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                showError('fromEmail') ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
            />
            {showError('fromEmail') && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <MdWarning className="w-3 h-3" /> {getErrorMessage('fromEmail')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre del Remitente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fromName"
              value={formData.fromName}
              onChange={handleChange}
              onBlur={() => handleBlur('fromName')}
              placeholder="Mi Clínica"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                showError('fromName') ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
            />
            {showError('fromName') && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <MdWarning className="w-3 h-3" /> {getErrorMessage('fromName')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Responder a (Reply-To)
            </label>
            <input
              type="email"
              name="replyToEmail"
              value={formData.replyToEmail}
              onChange={handleChange}
              onBlur={() => handleBlur('replyToEmail')}
              placeholder="contacto@tuclinica.com"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                showError('replyToEmail') ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
            />
            {showError('replyToEmail') && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <MdWarning className="w-3 h-3" /> {getErrorMessage('replyToEmail')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Test Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white">
            <MdSend className="text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Probar Configuración</h3>
            <p className="text-sm text-slate-500">Envía un email de prueba</p>
          </div>
        </div>
        <div className="flex gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="email@prueba.com"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <button
            onClick={handleTest}
            disabled={isTesting || !testEmail}
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
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
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
