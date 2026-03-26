'use client';

import { useState, useEffect } from 'react';
import { MdClose, MdAdd } from 'react-icons/md';
import { createClinic, updateClinic, listActivePlans, SubscriptionPlan } from '@/lib/platformApi';
import { CreateClinicPayload, Clinic } from '@/types';
import toast from 'react-hot-toast';

interface CreateClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  clinic?: Clinic; // Si existe, es modo editar
}

interface FormTouched {
  name: boolean;
  phone: boolean;
  email: boolean;
  responsable: boolean;
  city: boolean;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  responsable?: string;
  city?: string;
}

// Validación de teléfono: 7-20 dígitos/caracteres válidos
const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
  return phoneRegex.test(phone);
};

// Formatea el teléfono mientras se escribe
const formatPhone = (phone: string): string => {
  // Remover caracteres no numéricos excepto +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Si está vacío o solo tiene +, devolver como está
  if (!cleaned || cleaned === '+') return phone;
  
  // Separar el código de país si existe
  let result = '';
  
  if (cleaned.startsWith('+')) {
    result = '+';
    const digits = cleaned.slice(1);
    
    // Formato: +55 (555) 123-4567
    if (digits.length <= 2) {
      result += digits;
    } else if (digits.length <= 5) {
      result += digits.slice(0, 2) + ' (' + digits.slice(2);
    } else if (digits.length <= 8) {
      result += digits.slice(0, 2) + ' (' + digits.slice(2, 5) + ') ' + digits.slice(5);
    } else {
      result += digits.slice(0, 2) + ' (' + digits.slice(2, 5) + ') ' + digits.slice(5, 8) + '-' + digits.slice(8, 12);
    }
  } else {
    // Sin código de país: (555) 123-4567
    if (cleaned.length <= 3) {
      result = cleaned;
    } else if (cleaned.length <= 6) {
      result = '(' + cleaned.slice(0, 3) + ') ' + cleaned.slice(3);
    } else {
      result = '(' + cleaned.slice(0, 3) + ') ' + cleaned.slice(3, 6) + '-' + cleaned.slice(6, 10);
    }
  }
  
  return result;
};

// Validación de email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Mapa de planes por defecto (fallback)
const defaultPlanLimits = { staff: 5, clients: 100, pets: 200 };

export function CreateClinicModal({
  isOpen,
  onClose,
  onSuccess,
  clinic,
}: CreateClinicModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [formData, setFormData] = useState<CreateClinicPayload>({
    name: '',
    phone: '',
    email: '',
    responsable: '',
    city: '',
    country: 'MX',
    subscription_plan: 'starter',
    max_staff_users: 5,
    max_clients: 100,
    max_pets: 200,
  });

  // Fetch plans on mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await listActivePlans();
        setPlans(response.data);
        // Initialize with first plan if available
        if (response.data.length > 0 && !clinic) {
          const firstPlan = response.data[0];
          setFormData(prev => ({
            ...prev,
            subscription_plan: firstPlan.code,
            max_staff_users: firstPlan.maxStaffUsers,
            max_clients: firstPlan.maxClients,
            max_pets: firstPlan.maxPets,
          }));
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      }
    };
    fetchPlans();
  }, []);

  // Helper function to get plan limits by code
  const getPlanLimits = (planCode: string) => {
    const plan = plans.find(p => p.code === planCode);
    if (plan) {
      return { staff: plan.maxStaffUsers, clients: plan.maxClients, pets: plan.maxPets };
    }
    return defaultPlanLimits;
  };

  const [touched, setTouched] = useState<FormTouched>({
    name: false,
    phone: false,
    email: false,
    responsable: false,
    city: false,
  });

  // Limpiar formulario cuando se abre el modal o cambiar modo editar
  useEffect(() => {
    if (isOpen) {
      if (clinic) {
        // Modo editar: precargar datos y aplicar límites del plan
        const plan = clinic.subscriptionPlan || 'starter';
        const planLimits = getPlanLimits(plan);
        
        setFormData({
          name: clinic.name,
          phone: clinic.phone,
          email: clinic.email || '',
          responsable: clinic.responsable || '',
          city: clinic.city || '',
          country: clinic.country || 'MX',
          subscription_plan: plan,
          max_staff_users: planLimits.staff,
          max_clients: planLimits.clients,
          max_pets: planLimits.pets,
        });
      } else {
        // Modo crear: inicializar con primer plan disponible
        const firstPlan = plans.length > 0 ? plans[0] : null;
        const defaultCode = firstPlan?.code || 'starter';
        const limits = firstPlan 
          ? { staff: firstPlan.maxStaffUsers, clients: firstPlan.maxClients, pets: firstPlan.maxPets }
          : defaultPlanLimits;
        setFormData({
          name: '',
          phone: '',
          email: '',
          responsable: '',
          city: '',
          country: 'MX',
          subscription_plan: defaultCode,
          max_staff_users: limits.staff,
          max_clients: limits.clients,
          max_pets: limits.pets,
        });
      }
      setTouched({
        name: false,
        phone: false,
        email: false,
        responsable: false,
        city: false,
      });
    }
  }, [isOpen, clinic, plans]);

  // Validaciones
  const validateField = (name: keyof CreateClinicPayload, value: any): string => {
    switch (name) {
      case 'name':
        if (!value || value.trim().length < 3) {
          return 'El nombre debe tener al menos 3 caracteres';
        }
        return '';
      
      case 'phone':
        if (!value) {
          return 'El teléfono es requerido';
        } else if (!isValidPhone(value)) {
          return 'Teléfono inválido. Mínimo 7 caracteres (ej: +55 (555) 123-4567)';
        }
        return '';
      
      case 'email':
        if (value && !isValidEmail(value)) {
          return 'Correo electrónico inválido';
        }
        return '';
      
      case 'responsable':
        if (!value || value.trim().length < 3) {
          return 'El responsable debe tener al menos 3 caracteres';
        }
        return '';
      
      case 'city':
        if (!value || value.trim().length < 2) {
          return 'La ciudad es requerida';
        }
        return '';
      
      default:
        return '';
    }
  };

  // Calcular errores
  const errors: FormErrors = {
    name: validateField('name', formData.name),
    phone: validateField('phone', formData.phone),
    email: validateField('email', formData.email),
    responsable: validateField('responsable', formData.responsable),
    city: validateField('city', formData.city),
  };

  // Determinar si mostrar error (solo si fue tocado)
  const showError = (field: keyof FormErrors): boolean => {
    return touched[field] && !!errors[field];
  };

  // Determinar si el formulario es válido
  const isFormValid =
    formData.name &&
    formData.name.trim() !== '' &&
    formData.phone &&
    formData.phone.trim() !== '' &&
    formData.city &&
    formData.city.trim() !== '' &&
    formData.responsable &&
    formData.responsable.trim() !== '' &&
    !errors.name &&
    !errors.phone &&
    !errors.email &&
    !errors.responsable &&
    !errors.city;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let finalValue = value;

    // Aplicar formato al teléfono
    if (name === 'phone') {
      finalValue = formatPhone(value);
    }

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: name.includes('max_') || name === 'max_staff_users' ? parseInt(finalValue) : finalValue,
      };

      // Si cambió el plan, actualizar automáticamente los límites
      if (name === 'subscription_plan') {
        const selectedPlan = plans.find(p => p.code === finalValue);
        if (selectedPlan) {
          updated.max_staff_users = selectedPlan.maxStaffUsers;
          updated.max_clients = selectedPlan.maxClients;
          updated.max_pets = selectedPlan.maxPets;
        }
      }

      return updated;
    });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marcar todos los campos como tocados
    setTouched({
      name: true,
      phone: true,
      email: true,
      responsable: true,
      city: true,
    });

    if (!isFormValid) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }

    setIsLoading(true);

    try {
      if (clinic) {
        // Modo editar
        await updateClinic(clinic.id, formData);
      } else {
        // Modo crear
        await createClinic(formData);
      }
      
      // Reset form with first plan defaults
      const firstPlan = plans.length > 0 ? plans[0] : null;
      const defaultCode = firstPlan?.code || 'starter';
      const limits = firstPlan 
        ? { staff: firstPlan.maxStaffUsers, clients: firstPlan.maxClients, pets: firstPlan.maxPets }
        : defaultPlanLimits;
      setFormData({
        name: '',
        phone: '',
        email: '',
        responsable: '',
        city: '',
        country: 'MX',
        subscription_plan: defaultCode,
        max_staff_users: limits.staff,
        max_clients: limits.clients,
        max_pets: limits.pets,
      });
      setTouched({
        name: false,
        phone: false,
        email: false,
        responsable: false,
        city: false,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-white">
            {clinic ? 'Editar Clínica' : 'Crear Nueva Clínica'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition"
            disabled={isLoading}
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name & Phone row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Clínica <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Ej: Clínica Veterinaria Central"
                required
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                  showError('name')
                    ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                }`}
              />
              {showError('name') && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 font-normal ml-1">(Formato automático)</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="+55 (555) 123-4567"
                required
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                  showError('phone')
                    ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                }`}
              />
              {showError('phone') && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Email & Responsable row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Ej: contact@clinica.com"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                  showError('email')
                    ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                }`}
              />
              {showError('email') && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsable <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="responsable"
                value={formData.responsable || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Ej: Dr. Juan Pérez"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                  showError('responsable')
                    ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                }`}
              />
              {showError('responsable') && (
                <p className="text-red-500 text-xs mt-1">{errors.responsable}</p>
              )}
            </div>
          </div>

          {/* City & Country row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Ej: Mexico City"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                  showError('city')
                    ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                }`}
              />
              {showError('city') && (
                <p className="text-red-500 text-xs mt-1">{errors.city}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                País
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Plan & Limits - Auto-populated from Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Suscripción <span className="text-red-500">*</span>
              </label>
              <select
                name="subscription_plan"
                value={formData.subscription_plan}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.code}>
                    {plan.name} (${Number(plan.price).toLocaleString()} {plan.currency}/{plan.billingPeriod === 'monthly' ? 'mes' : 'año'})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Los límites se establecen automáticamente según el plan</p>
            </div>
          </div>

          {/* Limits - Read-only, auto-populated from plan */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Límites del Plan</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Max Usuarios Staff
                </label>
                <div className="text-2xl font-bold text-blue-600">
                  {formData.max_staff_users}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Max Clientes
                </label>
                <div className="text-2xl font-bold text-blue-600">
                  {formData.max_clients}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Max Mascotas
                </label>
                <div className="text-2xl font-bold text-blue-600">
                  {formData.max_pets}
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-gray-500">
              WhatsApp Account ID (Opcional)
            </label>
            <input
              type="text"
              name="whatsapp_account_id"
              value={formData.whatsapp_account_id || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                isFormValid
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } disabled:opacity-50`}
            >
              <MdAdd className="w-5 h-5" />
              {isLoading ? (clinic ? 'Guardando...' : 'Creando...') : clinic ? 'Guardar Cambios' : 'Crear Clínica'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
