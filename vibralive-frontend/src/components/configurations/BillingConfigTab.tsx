'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MdSave, MdBusiness, MdReceipt, MdPayment, MdWarning } from 'react-icons/md';
import { BillingConfig } from '@/types';
import { clinicConfigurationsApi } from '@/api/clinic-configurations-api';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

// Validation helpers
const VALIDATION_PATTERNS = {
  // RFC México: 3-4 letras + 6 dígitos (fecha) + 3 caracteres homoclave
  RFC_MX: /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i,
  // NIT Colombia: 9-10 dígitos + guión + dígito verificador
  NIT_CO: /^\d{9,10}-?\d$/,
  // RUT Chile: 7-8 dígitos + guión + dígito verificador o K
  RUT_CL: /^\d{7,8}-?[\dkK]$/,
  // CUIT Argentina: XX-XXXXXXXX-X
  CUIT_AR: /^\d{2}-?\d{8}-?\d$/,
  // Email
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Phone (general, 7-15 dígitos con espacios, guiones o paréntesis opcionales)
  PHONE: /^[\d\s\-\(\)\+]{7,20}$/,
  // Postal code Mexico (5 digits)
  ZIP_MX: /^\d{5}$/,
  // Postal code US (5 or 9 digits)
  ZIP_US: /^\d{5}(-\d{4})?$/,
  // Postal code Colombia (6 digits)
  ZIP_CO: /^\d{6}$/,
  // Postal code general
  ZIP_GENERAL: /^[\dA-Z\-\s]{3,10}$/i,
};

interface ValidationErrors {
  legalName?: string;
  taxId?: string;
  taxRegime?: string;
  fiscalAddress?: string;
  fiscalCity?: string;
  fiscalState?: string;
  fiscalZip?: string;
  billingEmail?: string;
  billingPhone?: string;
  taxRate?: string;
  invoicePrefix?: string;
  billingProvider?: string;
  billingApiKey?: string;
}

const CURRENCIES = [
  { code: 'MXN', name: 'Peso Mexicano' },
  { code: 'USD', name: 'Dólar Estadounidense' },
  { code: 'EUR', name: 'Euro' },
  { code: 'COP', name: 'Peso Colombiano' },
  { code: 'ARS', name: 'Peso Argentino' },
  { code: 'CLP', name: 'Peso Chileno' },
];

const TAX_REGIMES_MX = [
  'Persona Física con Actividad Empresarial',
  'Régimen Simplificado de Confianza (RESICO)',
  'Persona Moral - Régimen General',
  'Pequeño Contribuyente',
];

const BILLING_PROVIDERS = [
  { id: '', name: 'Sin proveedor' },
  { id: 'facturapi', name: 'FacturAPI' },
  { id: 'sat', name: 'Servicio SAT' },
  { id: 'siigo', name: 'Siigo (Colombia)' },
];

export const BillingConfigTab: React.FC = () => {
  const { user } = useAuth();
  const clinicId = user?.clinic_id || '';
  
  const [config, setConfig] = useState<BillingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState({
    legalName: '',
    taxId: '',
    taxRegime: '',
    fiscalAddress: '',
    fiscalCity: '',
    fiscalState: '',
    fiscalZip: '',
    fiscalCountry: 'MX',
    billingEmail: '',
    billingPhone: '',
    currency: 'MXN',
    taxRate: 16,
    invoicePrefix: '',
    invoiceFooterText: '',
    billingProvider: '',
    billingApiKey: '',
  });

  // Validate Tax ID based on country (only if has value)
  const validateTaxId = useCallback((taxId: string, country: string): string | undefined => {
    if (!taxId.trim()) return undefined; // Optional field
    
    // Backend: @Length(1, 20)
    if (taxId.trim().length > 20) {
      return 'El RFC/NIT/RUT no puede exceder 20 caracteres';
    }
    
    const normalizedTaxId = taxId.toUpperCase().replace(/[\s-]/g, '');
    
    switch (country) {
      case 'MX':
        if (!VALIDATION_PATTERNS.RFC_MX.test(normalizedTaxId)) {
          return 'RFC inválido. Formato: XXXX000000XXX (persona moral) o XXX000000XXX (persona física)';
        }
        break;
      case 'CO':
        if (!VALIDATION_PATTERNS.NIT_CO.test(normalizedTaxId)) {
          return 'NIT inválido. Formato: 000000000-0';
        }
        break;
      case 'CL':
        if (!VALIDATION_PATTERNS.RUT_CL.test(normalizedTaxId)) {
          return 'RUT inválido. Formato: 00000000-X';
        }
        break;
      case 'AR':
        if (!VALIDATION_PATTERNS.CUIT_AR.test(normalizedTaxId)) {
          return 'CUIT inválido. Formato: 00-00000000-0';
        }
        break;
    }
    return undefined;
  }, []);

  // Validate Postal Code based on country
  const validateZipCode = useCallback((zip: string, country: string): string | undefined => {
    if (!zip.trim()) return undefined;
    
    switch (country) {
      case 'MX':
        if (!VALIDATION_PATTERNS.ZIP_MX.test(zip)) {
          return 'Código postal inválido. Debe ser de 5 dígitos';
        }
        break;
      case 'US':
        if (!VALIDATION_PATTERNS.ZIP_US.test(zip)) {
          return 'Código postal inválido. Formato: 00000 o 00000-0000';
        }
        break;
      case 'CO':
        if (!VALIDATION_PATTERNS.ZIP_CO.test(zip)) {
          return 'Código postal inválido. Debe ser de 6 dígitos';
        }
        break;
      default:
        if (!VALIDATION_PATTERNS.ZIP_GENERAL.test(zip)) {
          return 'Código postal inválido';
        }
    }
    return undefined;
  }, []);

  // Full form validation function - aligned with backend DTO validations
  // All required fields are always required
  const validateForm = useCallback((): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // === REQUIRED FIELDS ===
    if (!formData.legalName.trim()) {
      newErrors.legalName = 'La razón social es obligatoria';
    } else if (formData.legalName.trim().length > 200) {
      newErrors.legalName = 'La razón social no puede exceder 200 caracteres';
    }

    if (!formData.taxId.trim()) {
      newErrors.taxId = 'El RFC/NIT/RUT es obligatorio';
    } else {
      const taxIdError = validateTaxId(formData.taxId, formData.fiscalCountry);
      if (taxIdError) newErrors.taxId = taxIdError;
    }

    if (!formData.taxRegime) {
      newErrors.taxRegime = 'El régimen fiscal es obligatorio';
    } else if (formData.taxRegime.length > 100) {
      newErrors.taxRegime = 'El régimen fiscal no puede exceder 100 caracteres';
    }

    if (!formData.fiscalAddress.trim()) {
      newErrors.fiscalAddress = 'La dirección fiscal es obligatoria';
    } else if (formData.fiscalAddress.trim().length > 300) {
      newErrors.fiscalAddress = 'La dirección fiscal no puede exceder 300 caracteres';
    }

    if (!formData.fiscalCity.trim()) {
      newErrors.fiscalCity = 'La ciudad es obligatoria';
    } else if (formData.fiscalCity.trim().length > 100) {
      newErrors.fiscalCity = 'La ciudad no puede exceder 100 caracteres';
    }

    if (!formData.fiscalState.trim()) {
      newErrors.fiscalState = 'El estado es obligatorio';
    } else if (formData.fiscalState.trim().length > 100) {
      newErrors.fiscalState = 'El estado no puede exceder 100 caracteres';
    }

    if (!formData.fiscalZip.trim()) {
      newErrors.fiscalZip = 'El código postal es obligatorio';
    } else if (formData.fiscalZip.trim().length > 20) {
      newErrors.fiscalZip = 'El código postal no puede exceder 20 caracteres';
    } else {
      const zipError = validateZipCode(formData.fiscalZip, formData.fiscalCountry);
      if (zipError) newErrors.fiscalZip = zipError;
    }

    if (!formData.billingEmail.trim()) {
      newErrors.billingEmail = 'El email de facturación es obligatorio';
    } else if (!VALIDATION_PATTERNS.EMAIL.test(formData.billingEmail)) {
      newErrors.billingEmail = 'Email inválido';
    }

    if (!formData.billingPhone.trim()) {
      newErrors.billingPhone = 'El teléfono de facturación es obligatorio';
    } else if (formData.billingPhone.trim().length > 20) {
      newErrors.billingPhone = 'El teléfono no puede exceder 20 caracteres';
    } else if (!VALIDATION_PATTERNS.PHONE.test(formData.billingPhone)) {
      newErrors.billingPhone = 'Teléfono inválido. Use solo números, espacios, guiones o paréntesis';
    }

    // === OPTIONAL FIELDS FORMAT VALIDATIONS ===
    
    // taxRate: @Min(0) @Max(100)
    if (formData.taxRate < 0 || formData.taxRate > 100) {
      newErrors.taxRate = 'La tasa de impuesto debe estar entre 0 y 100';
    } else if (isNaN(formData.taxRate)) {
      newErrors.taxRate = 'La tasa de impuesto debe ser un número válido';
    }

    // invoicePrefix: @Length(1, 50)
    if (formData.invoicePrefix) {
      if (formData.invoicePrefix.length > 50) {
        newErrors.invoicePrefix = 'El prefijo no puede exceder 50 caracteres';
      } else if (!/^[A-Za-z0-9\-_]*$/.test(formData.invoicePrefix)) {
        newErrors.invoicePrefix = 'El prefijo solo puede contener letras, números, guiones y guiones bajos';
      }
    }

    // billingApiKey - required if provider is selected
    if (formData.billingProvider && !formData.billingApiKey && !config?.billingApiKey) {
      newErrors.billingApiKey = 'Se requiere API Key para el proveedor seleccionado';
    }

    return newErrors;
  }, [formData, config, validateTaxId, validateZipCode]);

  // Validate on form data change
  useEffect(() => {
    const newErrors = validateForm();
    setErrors(newErrors);
  }, [formData, validateForm]);

  // Mark field as touched on blur
  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  // Error helpers
  const showError = (fieldName: string) => touched[fieldName] && errors[fieldName as keyof ValidationErrors];
  const getErrorMessage = (fieldName: string) => errors[fieldName as keyof ValidationErrors];
  const hasErrors = Object.keys(errors).length > 0;

  useEffect(() => {
    loadConfig();
  }, [clinicId]);

  const loadConfig = async () => {
    if (!clinicId) return;
    try {
      setIsLoading(true);
      const data = await clinicConfigurationsApi.getBillingConfig(clinicId);
      if (data && typeof data === 'object' && 'clinicId' in data) {
        setConfig(data);
        const loadedData = {
          legalName: data.legalName || '',
          taxId: data.taxId || '',
          taxRegime: data.taxRegime || '',
          fiscalAddress: data.fiscalAddress || '',
          fiscalCity: data.fiscalCity || '',
          fiscalState: data.fiscalState || '',
          fiscalZip: data.fiscalZip || '',
          fiscalCountry: data.fiscalCountry || 'MX',
          billingEmail: data.billingEmail || '',
          billingPhone: data.billingPhone || '',
          currency: data.currency || 'MXN',
          taxRate: data.taxRate || 16,
          invoicePrefix: data.invoicePrefix || '',
          invoiceFooterText: data.invoiceFooterText || '',
          billingProvider: data.billingProvider || '',
          billingApiKey: '', // Never show API key
        };
        setFormData(loadedData);
        setTouched({});
      }
    } catch (error) {
      console.error('Error loading billing config:', error);
      toast.error('Error al cargar configuración de facturación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                     type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value;
    
    setTouched(prev => ({ ...prev, [name]: true }));
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSave = async () => {
    if (!clinicId) return;
    
    // Mark all fields as touched to show all errors
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => { allTouched[key] = true; });
    setTouched(allTouched);

    // Check for validation errors
    if (Object.keys(errors).length > 0) {
      toast.error('Por favor corrige los errores antes de guardar');
      return;
    }
    
    setIsSaving(true);
    try {
      // Clean empty strings - backend fails @Length(1,X) validation on empty strings
      const cleanedData: Record<string, any> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim() === '') {
          // Skip empty strings (don't send them)
          return;
        }
        cleanedData[key] = value;
      });
      
      const payload: any = { 
        ...cleanedData,
        taxRate: Number(formData.taxRate) || 0,
        ...(formData.taxId && { taxId: formData.taxId.toUpperCase().trim() }),
      };
      // Only send API key if it was changed (not empty)
      if (!payload.billingApiKey) {
        delete payload.billingApiKey;
      }
      
      await clinicConfigurationsApi.updateBillingConfig(clinicId, payload);
      toast.success('Configuración de facturación guardada');
    } catch (error) {
      console.error('Error saving billing config:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setIsSaving(false);
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
    <div className="space-y-6">
      {/* Datos Fiscales */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-sky-100 rounded-lg">
            <MdBusiness className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Datos Fiscales</h3>
            <p className="text-sm text-slate-500">Información para facturación</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Razón Social <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="legalName"
              value={formData.legalName}
              onChange={handleChange}
              onBlur={() => handleBlur('legalName')}
              placeholder="Nombre legal de la empresa"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                showError('legalName') ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
            />
            {showError('legalName') && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <MdWarning className="w-3 h-3" /> {getErrorMessage('legalName')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              RFC / NIT / RUT <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              onBlur={() => handleBlur('taxId')}
              placeholder="Identificación fiscal"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent uppercase ${
                showError('taxId') ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
            />
            {showError('taxId') && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <MdWarning className="w-3 h-3" /> {getErrorMessage('taxId')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Régimen Fiscal <span className="text-red-500">*</span>
            </label>
            <select
              name="taxRegime"
              value={formData.taxRegime}
              onChange={handleChange}
              onBlur={() => handleBlur('taxRegime')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                showError('taxRegime') ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
            >
              <option value="">Selecciona régimen</option>
              {TAX_REGIMES_MX.map(regime => (
                <option key={regime} value={regime}>{regime}</option>
              ))}
            </select>
            {showError('taxRegime') && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <MdWarning className="w-3 h-3" /> {getErrorMessage('taxRegime')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              País
            </label>
            <select
              name="fiscalCountry"
              value={formData.fiscalCountry}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="MX">México</option>
              <option value="US">Estados Unidos</option>
              <option value="CO">Colombia</option>
              <option value="AR">Argentina</option>
              <option value="CL">Chile</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Dirección Fiscal <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fiscalAddress"
              value={formData.fiscalAddress}
              onChange={handleChange}
              onBlur={() => handleBlur('fiscalAddress')}
              placeholder="Calle, número, colonia"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                showError('fiscalAddress') ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
            />
            {showError('fiscalAddress') && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <MdWarning className="w-3 h-3" /> {getErrorMessage('fiscalAddress')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ciudad <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fiscalCity"
              value={formData.fiscalCity}
              onChange={handleChange}
              onBlur={() => handleBlur('fiscalCity')}
              placeholder="Ciudad"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                showError('fiscalCity') ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
            />
            {showError('fiscalCity') && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <MdWarning className="w-3 h-3" /> {getErrorMessage('fiscalCity')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Estado <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fiscalState"
              value={formData.fiscalState}
              onChange={handleChange}
              onBlur={() => handleBlur('fiscalState')}
              placeholder="Estado"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                showError('fiscalState') ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
            />
            {showError('fiscalState') && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <MdWarning className="w-3 h-3" /> {getErrorMessage('fiscalState')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Código Postal <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fiscalZip"
              value={formData.fiscalZip}
              onChange={handleChange}
              onBlur={() => handleBlur('fiscalZip')}
              placeholder="Código postal"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                showError('fiscalZip') ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
            />
            {showError('fiscalZip') && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <MdWarning className="w-3 h-3" /> {getErrorMessage('fiscalZip')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Contacto de Facturación */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <MdReceipt className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Contacto y Facturas</h3>
            <p className="text-sm text-slate-500">Configuración de facturas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email de Facturación <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="billingEmail"
              value={formData.billingEmail}
              onChange={handleChange}
              onBlur={() => handleBlur('billingEmail')}
              placeholder="facturas@clinica.com"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                showError('billingEmail') ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
            />
            {showError('billingEmail') && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <MdWarning className="w-3 h-3" /> {getErrorMessage('billingEmail')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Teléfono de Facturación <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="billingPhone"
              value={formData.billingPhone}
              onChange={handleChange}
              onBlur={() => handleBlur('billingPhone')}
              placeholder="+52 55 1234 5678"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                showError('billingPhone') ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
            />
            {showError('billingPhone') && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <MdWarning className="w-3 h-3" /> {getErrorMessage('billingPhone')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Moneda
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              {CURRENCIES.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tasa de Impuesto (%)
            </label>
            <input
              type="number"
              name="taxRate"
              value={formData.taxRate}
              onChange={handleChange}
              onBlur={() => handleBlur('taxRate')}
              min={0}
              max={100}
              step={0.01}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                showError('taxRate') ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
            />
            {showError('taxRate') && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <MdWarning className="w-3 h-3" /> {getErrorMessage('taxRate')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Prefijo de Facturas
            </label>
            <input
              type="text"
              name="invoicePrefix"
              value={formData.invoicePrefix}
              onChange={handleChange}
              onBlur={() => handleBlur('invoicePrefix')}
              placeholder="VL-"
              maxLength={10}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                showError('invoicePrefix') ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
            />
            {showError('invoicePrefix') ? (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <MdWarning className="w-3 h-3" /> {getErrorMessage('invoicePrefix')}
              </p>
            ) : config && (
              <p className="text-xs text-slate-500 mt-1">
                Siguiente factura: {formData.invoicePrefix || 'VL-'}{config.invoiceNextNumber.toString().padStart(4, '0')}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Texto al Pie de Factura
            </label>
            <textarea
              name="invoiceFooterText"
              value={formData.invoiceFooterText}
              onChange={handleChange}
              rows={2}
              placeholder="Gracias por su preferencia..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Integración PAC */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-violet-100 rounded-lg">
            <MdPayment className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Integración de Facturación</h3>
            <p className="text-sm text-slate-500">Conexión con proveedor de facturación electrónica</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Proveedor
            </label>
            <select
              name="billingProvider"
              value={formData.billingProvider}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              {BILLING_PROVIDERS.map(provider => (
                <option key={provider.id} value={provider.id}>{provider.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              API Key {formData.billingProvider && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              name="billingApiKey"
              value={formData.billingApiKey}
              onChange={handleChange}
              onBlur={() => handleBlur('billingApiKey')}
              placeholder="••••••••••••"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                showError('billingApiKey') ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
            />
            {showError('billingApiKey') ? (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <MdWarning className="w-3 h-3" /> {getErrorMessage('billingApiKey')}
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">Dejar vacío para mantener la clave actual</p>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving || hasErrors}
          className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
