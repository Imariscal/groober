'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MdSave, MdRefresh, MdImage, MdPalette, MdTextFields, 
  MdVisibility, MdClose, MdAdd, MdDelete, MdInfo, MdWarning 
} from 'react-icons/md';
import { BrandingConfig, BrandingFeature, UpdateBrandingConfigPayload } from '@/types';
import { clinicConfigurationsApi } from '@/api/clinic-configurations-api';
import { useAuth } from '@/hooks/useAuth';
import { useBranding } from '@/contexts/BrandingContext';
import toast from 'react-hot-toast';

// Validation patterns
const VALIDATION_PATTERNS = {
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  CSS_UNIT: /^\d+(\.\d+)?(rem|px|em|%)$/,
};

interface ValidationErrors {
  brandName?: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  loginBackgroundUrl?: string;
  primaryColor?: string;
  primaryColorLight?: string;
  primaryColorDark?: string;
  secondaryColor?: string;
  accentColor?: string;
  sidebarBgColor?: string;
  sidebarTextColor?: string;
  sidebarActiveBg?: string;
  sidebarActiveText?: string;
  topbarBgColor?: string;
  topbarTextColor?: string;
  loginGradientFrom?: string;
  loginGradientTo?: string;
  loginTextColor?: string;
  borderRadius?: string;
  buttonRadius?: string;
  features?: string;
}

const COLOR_PRESETS = [
  { name: 'Sky', primary: '#0ea5e9', gradient: ['#2563eb', '#1d4ed8'] },
  { name: 'Violet', primary: '#8b5cf6', gradient: ['#7c3aed', '#6d28d9'] },
  { name: 'Emerald', primary: '#10b981', gradient: ['#059669', '#047857'] },
  { name: 'Rose', primary: '#f43f5e', gradient: ['#e11d48', '#be123c'] },
  { name: 'Amber', primary: '#f59e0b', gradient: ['#d97706', '#b45309'] },
  { name: 'Teal', primary: '#14b8a6', gradient: ['#0d9488', '#0f766e'] },
];

const FONT_OPTIONS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Poppins',
  'Montserrat',
  'Nunito',
  'Source Sans Pro',
];

const ICON_OPTIONS = [
  { value: 'calendar', label: 'Calendario' },
  { value: 'pets', label: 'Mascotas' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'message', label: 'Mensaje' },
  { value: 'check', label: 'Check' },
  { value: 'star', label: 'Estrella' },
  { value: 'heart', label: 'Corazón' },
  { value: 'bell', label: 'Campana' },
];

export function BrandingTab() {
  const { user } = useAuth();
  const { refreshBranding } = useBranding();
  const clinicId = user?.clinic_id || '';

  const [config, setConfig] = useState<BrandingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeSection, setActiveSection] = useState<'identity' | 'colors' | 'navigation' | 'login' | 'features'>('identity');

  const [formData, setFormData] = useState<UpdateBrandingConfigPayload>({
    logoUrl: '',
    logoDarkUrl: '',
    faviconUrl: '',
    loginBackgroundUrl: '',
    brandName: '',
    tagline: '',
    primaryColor: '#0ea5e9',
    primaryColorLight: '#38bdf8',
    primaryColorDark: '#0284c7',
    secondaryColor: '#8b5cf6',
    accentColor: '#f59e0b',
    sidebarBgColor: '#0f172a',
    sidebarTextColor: '#e2e8f0',
    sidebarActiveBg: '#1e293b',
    sidebarActiveText: '#38bdf8',
    topbarBgColor: '#ffffff',
    topbarTextColor: '#1e293b',
    loginGradientFrom: '#2563eb',
    loginGradientTo: '#1d4ed8',
    loginTextColor: '#ffffff',
    fontFamily: 'Inter',
    borderRadius: '0.5rem',
    buttonRadius: '0.5rem',
    features: [],
    footerText: '',
    isActive: true,
  });

  // Validation state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation function
  const validateForm = useCallback((data: UpdateBrandingConfigPayload): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    
    // Brand name required when active
    if (data.isActive && (!data.brandName || data.brandName.trim() === '')) {
      newErrors.brandName = 'El nombre de marca es obligatorio cuando está activo';
    }

    // URL validations (optional but must be valid if provided)
    if (data.logoUrl && data.logoUrl.trim() !== '' && !VALIDATION_PATTERNS.URL.test(data.logoUrl)) {
      newErrors.logoUrl = 'URL de logo inválida';
    }
    if (data.logoDarkUrl && data.logoDarkUrl.trim() !== '' && !VALIDATION_PATTERNS.URL.test(data.logoDarkUrl)) {
      newErrors.logoDarkUrl = 'URL de logo oscuro inválida';
    }
    if (data.faviconUrl && data.faviconUrl.trim() !== '' && !VALIDATION_PATTERNS.URL.test(data.faviconUrl)) {
      newErrors.faviconUrl = 'URL de favicon inválida';
    }
    if (data.loginBackgroundUrl && data.loginBackgroundUrl.trim() !== '' && !VALIDATION_PATTERNS.URL.test(data.loginBackgroundUrl)) {
      newErrors.loginBackgroundUrl = 'URL de fondo de login inválida';
    }

    // Color validations
    const colorFields = [
      { key: 'primaryColor', label: 'Color primario' },
      { key: 'primaryColorLight', label: 'Color primario claro' },
      { key: 'primaryColorDark', label: 'Color primario oscuro' },
      { key: 'secondaryColor', label: 'Color secundario' },
      { key: 'accentColor', label: 'Color de acento' },
      { key: 'sidebarBgColor', label: 'Fondo sidebar' },
      { key: 'sidebarTextColor', label: 'Texto sidebar' },
      { key: 'sidebarActiveBg', label: 'Fondo activo sidebar' },
      { key: 'sidebarActiveText', label: 'Texto activo sidebar' },
      { key: 'topbarBgColor', label: 'Fondo topbar' },
      { key: 'topbarTextColor', label: 'Texto topbar' },
      { key: 'loginGradientFrom', label: 'Gradiente login desde' },
      { key: 'loginGradientTo', label: 'Gradiente login hasta' },
      { key: 'loginTextColor', label: 'Texto login' },
    ];

    colorFields.forEach(({ key, label }) => {
      const value = data[key as keyof UpdateBrandingConfigPayload] as string;
      if (value && !VALIDATION_PATTERNS.HEX_COLOR.test(value)) {
        newErrors[key as keyof ValidationErrors] = `${label} debe ser un color hex válido (#RRGGBB)`;
      }
    });

    // CSS unit validations
    if (data.borderRadius && !VALIDATION_PATTERNS.CSS_UNIT.test(data.borderRadius)) {
      newErrors.borderRadius = 'Formato inválido (ej: 0.5rem, 8px)';
    }
    if (data.buttonRadius && !VALIDATION_PATTERNS.CSS_UNIT.test(data.buttonRadius)) {
      newErrors.buttonRadius = 'Formato inválido (ej: 0.5rem, 8px)';
    }

    // Features validation - each feature needs a title
    if (data.features && data.features.length > 0) {
      const invalidFeatures = data.features.filter(f => !f.title || f.title.trim() === '');
      if (invalidFeatures.length > 0) {
        newErrors.features = `${invalidFeatures.length} característica(s) sin título`;
      }
    }

    return newErrors;
  }, []);

  // Run validation when formData changes
  useEffect(() => {
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
  }, [formData, validateForm]);

  // Handle field blur
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Helper to show error
  const showError = (field: keyof ValidationErrors): boolean => {
    return touched[field] === true && errors[field] !== undefined;
  };

  // Helper to get error message
  const getErrorMessage = (field: keyof ValidationErrors): string | undefined => {
    return errors[field];
  };

  // Check if form has errors
  const hasErrors = Object.keys(errors).length > 0;

  useEffect(() => {
    loadConfig();
  }, [clinicId]);

  const loadConfig = async () => {
    if (!clinicId) return;
    try {
      setIsLoading(true);
      const data = await clinicConfigurationsApi.getBrandingConfig(clinicId);
      if (data && typeof data === 'object' && 'id' in data) {
        setConfig(data);
        setFormData({
          logoUrl: data.logoUrl || '',
          logoDarkUrl: data.logoDarkUrl || '',
          faviconUrl: data.faviconUrl || '',
          loginBackgroundUrl: data.loginBackgroundUrl || '',
          brandName: data.brandName || '',
          tagline: data.tagline || '',
          primaryColor: data.primaryColor || '#0ea5e9',
          primaryColorLight: data.primaryColorLight || '#38bdf8',
          primaryColorDark: data.primaryColorDark || '#0284c7',
          secondaryColor: data.secondaryColor || '#8b5cf6',
          accentColor: data.accentColor || '#f59e0b',
          sidebarBgColor: data.sidebarBgColor || '#0f172a',
          sidebarTextColor: data.sidebarTextColor || '#e2e8f0',
          sidebarActiveBg: data.sidebarActiveBg || '#1e293b',
          sidebarActiveText: data.sidebarActiveText || '#38bdf8',
          topbarBgColor: data.topbarBgColor || '#ffffff',
          topbarTextColor: data.topbarTextColor || '#1e293b',
          loginGradientFrom: data.loginGradientFrom || '#2563eb',
          loginGradientTo: data.loginGradientTo || '#1d4ed8',
          loginTextColor: data.loginTextColor || '#ffffff',
          fontFamily: data.fontFamily || 'Inter',
          borderRadius: data.borderRadius || '0.5rem',
          buttonRadius: data.buttonRadius || '0.5rem',
          features: data.features || [],
          footerText: data.footerText || '',
          isActive: data.isActive ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading branding:', error);
      toast.error('Error al cargar configuración de branding');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    // Mark as touched on change for better UX
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      primaryColor: preset.primary,
      loginGradientFrom: preset.gradient[0],
      loginGradientTo: preset.gradient[1],
      sidebarActiveText: preset.primary,
    }));
  };

  const handleAddFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...(prev.features || []), { icon: 'check', title: '', description: '' }],
    }));
  };

  const handleFeatureChange = (index: number, field: keyof BrandingFeature, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: (prev.features || []).map((f, i) => 
        i === index ? { ...f, [field]: value } : f
      ),
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!clinicId) return;

    // Validate before saving
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      // Mark all fields as touched to show errors
      const allTouched: Record<string, boolean> = {};
      Object.keys(formData).forEach(key => { allTouched[key] = true; });
      setTouched(allTouched);
      toast.error('Por favor corrige los errores antes de guardar');
      return;
    }

    setIsSaving(true);
    try {
      await clinicConfigurationsApi.updateBrandingConfig(clinicId, formData);
      toast.success('Branding guardado exitosamente');
      await loadConfig();
      refreshBranding(); // Update context
    } catch (error) {
      console.error('Error saving branding:', error);
      toast.error('Error al guardar branding');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('¿Restablecer a valores por defecto? Se perderán todos los cambios.')) return;
    if (!clinicId) return;

    try {
      await clinicConfigurationsApi.resetBrandingConfig(clinicId);
      toast.success('Branding restablecido');
      await loadConfig();
      refreshBranding();
    } catch (error) {
      toast.error('Error al restablecer branding');
    }
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
      {/* Section Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 flex gap-1 overflow-x-auto">
        {[
          { id: 'identity', label: 'Identidad', icon: MdTextFields },
          { id: 'colors', label: 'Colores', icon: MdPalette },
          { id: 'navigation', label: 'Navegación', icon: MdVisibility },
          { id: 'login', label: 'Página de Login', icon: MdImage },
          { id: 'features', label: 'Características', icon: MdAdd },
        ].map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeSection === section.id
                ? 'bg-primary-100 text-primary-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Identity Section */}
      {activeSection === 'identity' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
              <MdTextFields className="text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Identidad de Marca</h3>
              <p className="text-sm text-slate-500">Logo, nombre y tagline</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre de la Marca {formData.isActive && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                name="brandName"
                value={formData.brandName}
                onChange={handleChange}
                onBlur={() => handleBlur('brandName')}
                placeholder="Mi Clínica"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  showError('brandName') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              />
              {showError('brandName') ? (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <MdWarning className="w-3 h-3" /> {getErrorMessage('brandName')}
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">Reemplaza "Groober" en la interfaz</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tagline
              </label>
              <input
                type="text"
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                placeholder="Tu clínica de confianza"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Logo URL (claro)
              </label>
              <input
                type="url"
                name="logoUrl"
                value={formData.logoUrl}
                onChange={handleChange}
                onBlur={() => handleBlur('logoUrl')}
                placeholder="https://..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  showError('logoUrl') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              />
              {showError('logoUrl') && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <MdWarning className="w-3 h-3" /> {getErrorMessage('logoUrl')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Logo URL (oscuro)
              </label>
              <input
                type="url"
                name="logoDarkUrl"
                value={formData.logoDarkUrl}
                onChange={handleChange}
                onBlur={() => handleBlur('logoDarkUrl')}
                placeholder="https://..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  showError('logoDarkUrl') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              />
              {showError('logoDarkUrl') ? (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <MdWarning className="w-3 h-3" /> {getErrorMessage('logoDarkUrl')}
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">Para fondos oscuros (sidebar)</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Favicon URL
              </label>
              <input
                type="url"
                name="faviconUrl"
                value={formData.faviconUrl}
                onChange={handleChange}
                onBlur={() => handleBlur('faviconUrl')}
                placeholder="https://..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  showError('faviconUrl') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              />
              {showError('faviconUrl') && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <MdWarning className="w-3 h-3" /> {getErrorMessage('faviconUrl')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipografía
              </label>
              <select
                name="fontFamily"
                value={formData.fontFamily}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {FONT_OPTIONS.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Logo Preview */}
          {(formData.logoUrl || formData.logoDarkUrl) && (
            <div className="mt-4 p-4 bg-slate-100 rounded-lg">
              <p className="text-sm text-slate-600 mb-2">Vista previa de logos:</p>
              <div className="flex gap-4">
                {formData.logoUrl && (
                  <div className="p-4 bg-white rounded-lg">
                    <img src={formData.logoUrl} alt="Logo" className="h-12 object-contain" />
                  </div>
                )}
                {formData.logoDarkUrl && (
                  <div className="p-4 bg-slate-900 rounded-lg">
                    <img src={formData.logoDarkUrl} alt="Logo oscuro" className="h-12 object-contain" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Colors Section */}
      {activeSection === 'colors' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center text-white">
              <MdPalette className="text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Colores de Marca</h3>
              <p className="text-sm text-slate-500">Personaliza la paleta de colores</p>
            </div>
          </div>
          
          {/* Presets */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Presets de Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => handleColorPreset(preset)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300"
                >
                  <div 
                    className="w-6 h-6 rounded-full" 
                    style={{ backgroundColor: preset.primary }}
                  />
                  <span className="text-sm text-slate-700">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Color Primario
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Secundario
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleChange}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Acento
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="accentColor"
                  value={formData.accentColor}
                  onChange={handleChange}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.accentColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                  className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-4 p-4 bg-slate-100 rounded-lg">
            <p className="text-sm text-slate-600 mb-3">Vista previa:</p>
            <div className="flex gap-3">
              <button 
                className="px-4 py-2 text-white rounded-lg"
                style={{ backgroundColor: formData.primaryColor }}
              >
                Botón Primario
              </button>
              <button 
                className="px-4 py-2 text-white rounded-lg"
                style={{ backgroundColor: formData.secondaryColor }}
              >
                Secundario
              </button>
              <button 
                className="px-4 py-2 text-white rounded-lg"
                style={{ backgroundColor: formData.accentColor }}
              >
                Acento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Section */}
      {activeSection === 'navigation' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
              <MdVisibility className="text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Colores de Navegación</h3>
              <p className="text-sm text-slate-500">Customiza sidebar y topbar</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sidebar Preview */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3">Sidebar</h4>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Fondo</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="sidebarBgColor"
                      value={formData.sidebarBgColor}
                      onChange={handleChange}
                      className="w-10 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.sidebarBgColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, sidebarBgColor: e.target.value }))}
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Texto</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="sidebarTextColor"
                      value={formData.sidebarTextColor}
                      onChange={handleChange}
                      className="w-10 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.sidebarTextColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, sidebarTextColor: e.target.value }))}
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Activo BG</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="sidebarActiveBg"
                      value={formData.sidebarActiveBg}
                      onChange={handleChange}
                      className="w-10 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.sidebarActiveBg}
                      onChange={(e) => setFormData(prev => ({ ...prev, sidebarActiveBg: e.target.value }))}
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Activo Texto</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="sidebarActiveText"
                      value={formData.sidebarActiveText}
                      onChange={handleChange}
                      className="w-10 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.sidebarActiveText}
                      onChange={(e) => setFormData(prev => ({ ...prev, sidebarActiveText: e.target.value }))}
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Sidebar Preview */}
              <div 
                className="w-48 rounded-lg p-3 space-y-2"
                style={{ backgroundColor: formData.sidebarBgColor }}
              >
                <div 
                  className="px-3 py-2 rounded"
                  style={{ color: formData.sidebarTextColor }}
                >
                  Dashboard
                </div>
                <div 
                  className="px-3 py-2 rounded"
                  style={{ 
                    backgroundColor: formData.sidebarActiveBg,
                    color: formData.sidebarActiveText 
                  }}
                >
                  Clientes (activo)
                </div>
                <div 
                  className="px-3 py-2 rounded"
                  style={{ color: formData.sidebarTextColor }}
                >
                  Mascotas
                </div>
              </div>
            </div>

            {/* TopBar Preview */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3">Barra Superior</h4>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Fondo</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="topbarBgColor"
                      value={formData.topbarBgColor}
                      onChange={handleChange}
                      className="w-10 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.topbarBgColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, topbarBgColor: e.target.value }))}
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Texto</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="topbarTextColor"
                      value={formData.topbarTextColor}
                      onChange={handleChange}
                      className="w-10 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.topbarTextColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, topbarTextColor: e.target.value }))}
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* TopBar Preview */}
              <div 
                className="rounded-lg px-4 py-3 flex justify-between items-center border"
                style={{ 
                  backgroundColor: formData.topbarBgColor,
                  borderColor: formData.topbarBgColor === '#ffffff' ? '#e2e8f0' : 'transparent'
                }}
              >
                <span style={{ color: formData.topbarTextColor }}>
                  {formData.brandName || 'Mi Clínica'}
                </span>
                <div className="flex gap-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: formData.primaryColor, color: '#fff' }}
                  >
                    U
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Section */}
      {activeSection === 'login' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center text-white">
              <MdImage className="text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Página de Login</h3>
              <p className="text-sm text-slate-500">Personaliza la pantalla de acceso</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Imagen de Fondo (opcional)
                </label>
                <input
                  type="url"
                  name="loginBackgroundUrl"
                  value={formData.loginBackgroundUrl}
                  onChange={handleChange}
                  onBlur={() => handleBlur('loginBackgroundUrl')}
                  placeholder="https://..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    showError('loginBackgroundUrl') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {showError('loginBackgroundUrl') && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <MdWarning className="w-3 h-3" /> {getErrorMessage('loginBackgroundUrl')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Gradiente Desde</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="loginGradientFrom"
                      value={formData.loginGradientFrom}
                      onChange={handleChange}
                      className="w-10 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.loginGradientFrom}
                      onChange={(e) => setFormData(prev => ({ ...prev, loginGradientFrom: e.target.value }))}
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Gradiente Hasta</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="loginGradientTo"
                      value={formData.loginGradientTo}
                      onChange={handleChange}
                      className="w-10 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.loginGradientTo}
                      onChange={(e) => setFormData(prev => ({ ...prev, loginGradientTo: e.target.value }))}
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Color de Texto</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    name="loginTextColor"
                    value={formData.loginTextColor}
                    onChange={handleChange}
                    className="w-10 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.loginTextColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, loginTextColor: e.target.value }))}
                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Texto del Footer
                </label>
                <input
                  type="text"
                  name="footerText"
                  value={formData.footerText}
                  onChange={handleChange}
                  placeholder="© 2024 Mi Clínica"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Login Preview */}
            <div>
              <p className="text-sm text-slate-600 mb-2">Vista previa:</p>
              <div 
                className="h-64 rounded-lg p-6 flex flex-col justify-center items-center"
                style={{ 
                  background: formData.loginBackgroundUrl 
                    ? `url(${formData.loginBackgroundUrl}) center/cover`
                    : `linear-gradient(to bottom, ${formData.loginGradientFrom}, ${formData.loginGradientTo})`
                }}
              >
                {formData.logoUrl && (
                  <img src={formData.logoUrl} alt="Logo" className="h-12 mb-4" />
                )}
                <h3 
                  className="text-2xl font-bold mb-1"
                  style={{ color: formData.loginTextColor }}
                >
                  {formData.brandName || 'Mi Clínica'}
                </h3>
                <p 
                  className="text-sm opacity-80"
                  style={{ color: formData.loginTextColor }}
                >
                  {formData.tagline || 'Tu clínica de confianza'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      {activeSection === 'features' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white">
                <MdAdd className="text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Características del Login</h3>
                <p className="text-sm text-slate-500">Panel izquierdo de acceso</p>
              </div>
            </div>
            <button
              onClick={handleAddFeature}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
            >
              <MdAdd className="w-4 h-4" />
              Agregar
            </button>
          </div>

          {errors.features && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <MdWarning className="w-4 h-4" />
              {errors.features}
            </div>
          )}

          {(formData.features || []).length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <MdInfo className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay características configuradas</p>
              <p className="text-sm">Se usarán las características por defecto</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(formData.features || []).map((feature, index) => (
                <div key={index} className="flex gap-4 p-4 bg-slate-50 rounded-lg">
                  <select
                    value={feature.icon}
                    onChange={(e) => handleFeatureChange(index, 'icon', e.target.value)}
                    className="w-24 px-2 py-1 border border-slate-300 rounded text-sm"
                  >
                    {ICON_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={feature.title}
                    onChange={(e) => handleFeatureChange(index, 'title', e.target.value)}
                    placeholder="Título *"
                    className={`flex-1 px-3 py-1 border rounded ${
                      !feature.title || feature.title.trim() === '' ? 'border-red-300 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  <input
                    type="text"
                    value={feature.description}
                    onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                    placeholder="Descripción"
                    className="flex-[2] px-3 py-1 border border-slate-300 rounded"
                  />
                  <button
                    onClick={() => handleRemoveFeature(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <MdDelete className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <MdRefresh className="w-5 h-5" />
          Restablecer
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <MdVisibility className="w-5 h-5" />
            Vista Previa
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || hasErrors}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 transition-all font-semibold"
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

      {/* Toggle Active */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
          />
          <div>
            <span className="font-medium text-amber-800">Activar branding personalizado</span>
            <p className="text-sm text-amber-600">
              Si está desactivado, se usará el branding por defecto de Groober
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
