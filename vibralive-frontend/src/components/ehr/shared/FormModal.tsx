'use client';

import { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import { FormModalProps, FormField } from './types';
import { toast } from 'react-hot-toast';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { toClinicZonedDate } from '@/lib/datetime-tz';

export function FormModal({
  isOpen,
  isEditing,
  fields,
  initialData,
  title,
  onClose,
  onSubmit,
  loading,
  error,
  sidePanel,
}: FormModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autocompleteOptions, setAutocompleteOptions] = useState<Record<string, string[]>>({});
  const [showAutocomplete, setShowAutocomplete] = useState<Record<string, boolean>>({});

  // Convert ISO date string to yyyy-MM-dd format for date inputs
  const clinicTimezone = useClinicTimezone();
  
  const formatDateForInput = (value: any): string | '' => {
    if (!value) return '';
    try {
      // Convert from UTC ISO to clinic timezone, then to yyyy-MM-dd
      const zonedDate = toClinicZonedDate(value, clinicTimezone);
      return zonedDate.toISOString().split('T')[0]; // Returns yyyy-MM-dd
    } catch {
      return '';
    }
  };

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (initialData && isEditing) {
        // Convert date fields from ISO to yyyy-MM-dd format
        const processedData = { ...initialData };
        fields.forEach((field) => {
          if (field.type === 'date' && processedData[field.name]) {
            processedData[field.name] = formatDateForInput(processedData[field.name]);
          }
        });
        setFormData(processedData);
      } else {
        const newData: Record<string, any> = {};
        fields.forEach((field) => {
          if (field.defaultValue !== undefined) {
            newData[field.name] = field.type === 'date' 
              ? formatDateForInput(field.defaultValue) 
              : field.defaultValue;
          } else {
            newData[field.name] = field.type === 'number' ? 0 : '';
          }
        });
        setFormData(newData);
      }
      setErrors({});
    }
  }, [isOpen, initialData, isEditing, fields]);

  const handleChange = async (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // Clear error
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }

    // Load autocomplete options if applicable
    const field = fields.find((f) => f.name === fieldName);
    if (field?.type === 'autocomplete' && field.autocompleteOnChange && value.length > 0) {
      try {
        const options = await field.autocompleteOnChange(value);
        setAutocompleteOptions((prev) => ({
          ...prev,
          [fieldName]: options,
        }));
        setShowAutocomplete((prev) => ({
          ...prev,
          [fieldName]: true,
        }));
      } catch (err) {
        console.error('Error loading autocomplete options:', err);
      }
    } else if (field?.type === 'autocomplete') {
      // Close dropdown if input is empty
      setShowAutocomplete((prev) => ({
        ...prev,
        [fieldName]: false,
      }));
    }
  };

  const isFormValid = (): boolean => {
    let isValid = true;

    fields.forEach((field) => {
      if (field.required && (!formData[field.name] || formData[field.name] === '')) {
        isValid = false;
      } else if (field.validation) {
        const validationError = field.validation(formData[field.name]);
        if (validationError) {
          isValid = false;
        }
      }
    });

    return isValid;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      if (field.required && (!formData[field.name] || formData[field.name] === '')) {
        newErrors[field.name] = 'Este campo es requerido';
      } else if (field.validation) {
        const validationError = field.validation(formData[field.name]);
        if (validationError) {
          newErrors[field.name] = validationError;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrige los errores');
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      console.error('Error submitting form:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 flex items-center justify-between sticky top-0">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-primary-600 rounded transition disabled:opacity-50"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content Container - Flex */}
        <div className="flex flex-1 overflow-hidden">
          {/* Form Section */}
          <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4 overflow-y-auto">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-4">
            {fields.map((field) => (
              <div 
                key={field.name} 
                style={{ 
                  width: field.width && field.width !== 'auto' ? field.width : 'calc(50% - 8px)',
                  minWidth: field.width === '100%' ? '100%' : 'auto'
                }}
                className={field.width === '100%' ? 'w-full' : ''}
              >
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.type === 'select' ? (
                  <select
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    <option value="">Seleccionar...</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    disabled={loading}
                    rows={field.multiline ? 4 : 3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 resize-none"
                  />
                ) : field.type === 'autocomplete' ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={formData[field.name] || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                    />
                    {showAutocomplete[field.name] && (autocompleteOptions[field.name]?.length ?? 0) > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 rounded-lg mt-1 max-h-40 overflow-y-auto z-10 shadow-lg">
                        {autocompleteOptions[field.name]?.map((opt) => (
                          <div
                            key={opt}
                            onClick={() => {
                              handleChange(field.name, opt);
                              setShowAutocomplete((prev) => ({
                                ...prev,
                                [field.name]: false,
                              }));
                            }}
                            className="px-3 py-2 hover:bg-slate-100 cursor-pointer border-b border-slate-100 last:border-b-0"
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    disabled={loading}
                    {...(field.type === 'date' && field.min && { min: field.min })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  />
                )}

                {errors[field.name] && (
                  <p className="text-xs text-red-500 mt-1">{errors[field.name]}</p>
                )}
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
          </form>

          {/* Side Panel - Recent Medications */}
          {sidePanel && (
            <div className="w-80 border-l border-slate-200 bg-slate-50 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-200 sticky top-0 bg-slate-50">
                <h3 className="font-semibold text-slate-900">{sidePanel.title}</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {sidePanel.items.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">No hay medicamentos recientes</p>
                ) : (
                  sidePanel.items.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        // Update the medicationName field with the selected medication
                        setFormData((prev) => ({
                          ...prev,
                          medicationName: item.name,
                        }));
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-primary-50 hover:border-primary-300 transition"
                    >
                      <div className="font-medium text-sm text-slate-900">{item.name}</div>
                      {item.count !== undefined && (
                        <div className="text-xs text-slate-500 mt-1">
                          Usado {item.count} {item.count === 1 ? 'vez' : 'veces'}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
