'use client';

import React, { useState, useEffect } from 'react';
import { MdClose, MdPhone, MdEmail, MdPerson, MdLocationOn, MdCheckCircle, MdLocalOffer, MdAdd } from 'react-icons/md';
import { Client, PriceList, CreateClientPayload, CreateClientAddressPayload, CreateClientPetPayload } from '@/types';
import { clientsApi } from '@/lib/clients-api';
import { priceListsApi } from '@/api/price-lists-api';
import { ClientAddressBook, DraftAddress } from './addresses/ClientAddressBook';
import { ClientPetBook, DraftPet } from './pets/ClientPetBook';
import toast from 'react-hot-toast';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (client?: Client) => void; // Client is passed on success
  client?: Client; // Si existe, es modo editar
}

interface FormErrors {
  name?: string;
  phone?: string;
  phone_secondary?: string;
  email?: string;
  address?: string;
  notes?: string;
}

interface FormTouched {
  name: boolean;
  phone: boolean;
  email: boolean;
  address: boolean;
  notes: boolean;
}

// Validación de teléfono
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
  if (!email) return true; // Email es opcional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * ClientFormModal
 * Modal reutilizable para crear y editar clientes
 * Patrón: Basado en CreateClinicModal para consistencia
 * 
 * Flujo:
 * 1. Crear cliente (formulario simple)
 * 2. Mostrar tabs (General | Direcciones | Comercial) para gestionar cliente
 */
export function ClientFormModal({
  isOpen,
  onClose,
  onSuccess,
  client,
}: ClientFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateClientPayload>({
    name: '',
    phone: '',
    email: null,
    address: null,
    notes: null,
    price_list_id: null,
    whatsapp_number: null,
    phone_secondary: null,
    preferred_contact_method: null,
    preferred_contact_time_start: null,
    preferred_contact_time_end: null,
    housing_type: null,
    access_notes: null,
    service_notes: null,
    do_not_contact: null,
    do_not_contact_reason: null,
    status: 'ACTIVE',
  });

  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [defaultPriceList, setDefaultPriceList] = useState<PriceList | null>(null);
  const [isLoadingPriceLists, setIsLoadingPriceLists] = useState(true);

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({
    name: false,
    phone: false,
    email: false,
    address: false,
    notes: false,
  });

  // Tab state - always visible (even in CREATE mode)
  const [activeTab, setActiveTab] = useState<'general' | 'addresses' | 'pets'>('general');
  
  // Addresses to create with new client (draft mode)
  const [draftAddresses, setDraftAddresses] = useState<DraftAddress[]>([]);
  
  // Pets to create with new client (draft mode)
  const [draftPets, setDraftPets] = useState<DraftPet[]>([]);
  
  // Address count for edit mode (updated by ClientAddressBook)
  const [editModeAddressCount, setEditModeAddressCount] = useState<number>(0);
  
  // Pet count for edit mode (updated by ClientPetBook)
  const [editModePetCount, setEditModePetCount] = useState<number>(0);

  // Tags management
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>('');

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Normalize addresses before sending (ensure exactly 1 is_default=true, strip _draftId)
  const normalizeAddresses = (): CreateClientAddressPayload[] => {
    if (draftAddresses.length === 0) return [];
    
    let hasDefault = draftAddresses.some(a => a.is_default);
    return draftAddresses.map((addr, idx) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _draftId, ...rest } = addr;
      return {
        ...rest,
        is_default: hasDefault ? rest.is_default : idx === 0,
        label: rest.label || undefined,
        street: rest.street || '',
        number_ext: rest.number_ext || undefined,
        number_int: rest.number_int || undefined,
        neighborhood: rest.neighborhood || undefined,
        city: rest.city || '',
        state: rest.state || undefined,
        zip_code: rest.zip_code || undefined,
        references: rest.references || undefined,
        // IMPORTANTE: Incluir coordenadas para geocode_status = 'OK' en backend
        lat: rest.lat,
        lng: rest.lng,
      };
    });
  };

  // Normalize pets before sending (strip _draftId)
  const normalizePets = (): CreateClientPetPayload[] => {
    if (draftPets.length === 0) return [];
    
    return draftPets.map((pet) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _draftId, ...rest } = pet;
      return {
        name: rest.name,
        species: rest.species,
        breed: rest.breed || undefined,
        dateOfBirth: rest.dateOfBirth || undefined,
        sex: rest.sex || undefined,
        isSterilized: rest.isSterilized ?? false,
        color: rest.color || undefined,
        size: rest.size || undefined,
        microchipNumber: rest.microchipNumber || undefined,
        tagNumber: rest.tagNumber || undefined,
        notes: rest.notes || undefined,
        allergies: rest.allergies || undefined,
      };
    });
  };

  // Inicializar formulario cuando se abre o cambia el cliente
  useEffect(() => {
    if (isOpen) {
      if (client) {
        // Modo editar
        setFormData({
          name: client.name || '',
          phone: client.phone || '',
          email: client.email,
          address: client.address,
          notes: client.notes,
          price_list_id: client.price_list_id,
          whatsapp_number: client.whatsapp_number,
          phone_secondary: client.phone_secondary,
          preferred_contact_method: client.preferred_contact_method,
          preferred_contact_time_start: client.preferred_contact_time_start,
          preferred_contact_time_end: client.preferred_contact_time_end,
          housing_type: client.housing_type,
          access_notes: client.access_notes,
          service_notes: client.service_notes,
          do_not_contact: client.do_not_contact,
          do_not_contact_reason: client.do_not_contact_reason,          status: client.status || 'ACTIVE',        });
        setTags(client.tags || []);
        setDraftAddresses([]);
        setDraftPets([]);
      } else {
        // Modo crear
        setFormData({
          name: '',
          phone: '',
          email: null,
          address: null,
          notes: null,
          price_list_id: null,
          whatsapp_number: null,
          phone_secondary: null,
          preferred_contact_method: null,
          preferred_contact_time_start: null,
          preferred_contact_time_end: null,
          housing_type: null,
          access_notes: null,
          service_notes: null,
          do_not_contact: null,
          do_not_contact_reason: null,
          status: 'ACTIVE',
        });
        setTags([]);
      }
      setActiveTab('general');
      setNewTag('');
      setErrors({});
      setTouched({ name: false, phone: false, email: false, address: false, notes: false });
    }
  }, [isOpen, client]);

  // Load price lists
  useEffect(() => {
    const loadPriceLists = async () => {
      try {
        const [lists, defaultList] = await Promise.all([
          priceListsApi.getActivePriceLists(),
          priceListsApi.getDefaultPriceList(),
        ]);
        setPriceLists(lists || []);
        setDefaultPriceList(defaultList || null);
      } catch (error) {
        console.warn('Price lists API not available:', error);
        setPriceLists([]);
        setDefaultPriceList(null);
      } finally {
        setIsLoadingPriceLists(false);
      }
    };

    loadPriceLists();
  }, []);

  // Validación en tiempo real
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'El nombre es requerido';
        if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
        if (value.trim().length > 255) return 'El nombre no puede exceder 255 caracteres';
        return undefined;

      case 'phone':
        if (!value) return 'El teléfono es requerido';
        if (!isValidPhone(value)) return 'Teléfono inválido (7-20 caracteres)';
        return undefined;

      case 'email':
        if (value && !isValidEmail(value)) return 'Email inválido';
        return undefined;

      case 'address':
        if (value && value.length > 500) return 'La dirección no puede exceder 500 caracteres';
        return undefined;

      default:
        return undefined;
    }
  };

  // Manejador de cambio de campo
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue = value;

    // Aplicar formato al teléfono
    if (name === 'phone' || name === 'phone_secondary' || name === 'whatsapp_number') {
      finalValue = formatPhone(value);
    }

    setFormData((prev: CreateClientPayload) => ({ ...prev, [name]: finalValue || null }));

    // Validar si el campo ya fue tocado
    if (touched[name as keyof FormTouched]) {
      const error = validateField(name, finalValue);
      setErrors((prev: FormErrors) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  // Marcar campo como tocado
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  };

  // Validar todo el formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    Object.keys(formData).forEach(key => {
      const value = formData[key as keyof CreateClientPayload];
      // Solo validar campos de texto
      if (typeof value === 'string') {
        const error = validateField(key, value);
        if (error) newErrors[key as keyof FormErrors] = error;
      }
    });

    // Validar que el teléfono secundario sea diferente al principal y WhatsApp (si se ingresa)
    const cleanPhoneForCompare = (p: string | null | undefined) => p?.replace(/[^\d+]/g, '') || '';
    const mainPhone = cleanPhoneForCompare(formData.phone);
    const whatsapp = cleanPhoneForCompare(formData.whatsapp_number);
    const secondary = cleanPhoneForCompare(formData.phone_secondary);

    // Solo validar si el teléfono secundario tiene valor
    if (secondary) {
      if (mainPhone && mainPhone === secondary) {
        newErrors.phone_secondary = 'El teléfono secundario no puede ser igual al principal';
      }
      if (whatsapp && whatsapp === secondary) {
        newErrors.phone_secondary = 'El teléfono secundario no puede ser igual al WhatsApp';
      }
    }

    // Validar que el horario de inicio sea menor al de fin
    const startTime = formData.preferred_contact_time_start;
    const endTime = formData.preferred_contact_time_end;
    if (startTime && endTime && startTime >= endTime) {
      toast.error('El horario de inicio debe ser menor al horario de fin');
      return false;
    }

    // Validar que tenga al menos una dirección
    if (!client) {
      // Modo crear: verificar draftAddresses
      if (draftAddresses.length === 0) {
        toast.error('Debe agregar al menos una dirección');
        setActiveTab('addresses');
        return false;
      }
    } else {
      // Modo editar: verificar direcciones cargadas del API
      if (editModeAddressCount === 0) {
        toast.error('El cliente debe tener al menos una dirección');
        setActiveTab('addresses');
        return false;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor completa todos los campos correctamente');
      return;
    }

    setIsLoading(true);
    try {
      if (client) {
        // Modo editar
        console.log('📝 EDIT CLIENT FORM DATA:', {
          formDataPriceListId: formData.price_list_id,
          clientPriceListId: client.price_list_id,
          formDataFull: formData,
        });
        await clientsApi.updateClient(client.id, formData);
        
        // Sync tags: add new ones, remove deleted ones
        const originalTags = client.tags || [];
        const tagsToAdd = tags.filter(t => !originalTags.includes(t));
        const tagsToRemove = originalTags.filter(t => !tags.includes(t));
        
        for (const tag of tagsToAdd) {
          await clientsApi.tags.addTag(client.id, tag);
        }
        for (const tag of tagsToRemove) {
          await clientsApi.tags.removeTag(client.id, tag);
        }
        
        toast.success('Cliente actualizado exitosamente');
        onSuccess?.(client);
        onClose();
      } else {
        // Modo crear - ATOMIC: incluir direcciones y mascotas normalizadas en un solo POST
        const normalizedAddresses = normalizeAddresses();
        const normalizedPets = normalizePets();
        const payload = {
          ...formData,
          addresses: normalizedAddresses.length > 0 ? normalizedAddresses : undefined,
          pets: normalizedPets.length > 0 ? normalizedPets : undefined,
        };
        const newClient = await clientsApi.createClient(payload);
        
        // Add tags to new client
        if (newClient && tags.length > 0) {
          for (const tag of tags) {
            await clientsApi.tags.addTag(newClient.id, tag);
          }
        }
        
        toast.success('Cliente creado exitosamente');
        // Reset form, addresses, and pets
        setFormData({
          name: '',
          phone: '',
          email: null,
          address: null,
          notes: null,
          price_list_id: null,
          whatsapp_number: null,
          phone_secondary: null,
          preferred_contact_method: null,
          preferred_contact_time_start: null,
          preferred_contact_time_end: null,
          housing_type: null,
          access_notes: null,
          service_notes: null,
          do_not_contact: null,
          do_not_contact_reason: null,
          status: 'ACTIVE',
        });
        setDraftAddresses([]);
        setDraftPets([]);
        setTags([]);
        onSuccess?.(newClient);
        onClose();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al guardar el cliente';
      toast.error(message);
      console.error('Error saving client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isCreating = !client;
  const title = isCreating ? 'Nuevo Cliente' : 'Editar Cliente';

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col transform transition-all duration-300">
          {/* Header - Improved Design */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between border-b border-primary-600 shadow-sm">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
              <p className="text-primary-100 text-sm">
                {isCreating 
                  ? 'Completa los datos para crear un nuevo cliente'
                  : client ? 'Edita la información del cliente' : 'Gestiona los datos del cliente'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition duration-200"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          {/* Content - ALWAYS show TABS (both CREATE and EDIT modes) */}
          <>
            {/* Tab Navigation */}
            <div className="sticky top-[72px] bg-white border-b border-gray-200 z-10">
              <div className="px-8 flex gap-8">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`relative py-4 px-1 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'general'
                      ? 'text-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📋 General
                  {activeTab === 'general' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`relative py-4 px-1 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'addresses'
                      ? 'text-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📍 Direcciones
                  {activeTab === 'addresses' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('pets')}
                  className={`relative py-4 px-1 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'pets'
                      ? 'text-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🐾 Mascotas
                  {activeTab === 'pets' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
                  )}
                </button>
              </div>
            </div>

            {/* General Tab - Form (same for CREATE and EDIT) */}
            {activeTab === 'general' && (
              <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1 overflow-y-auto">
                {/* Sección: Información Principal */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-5 bg-primary-600 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-gray-900">Información Principal</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Name Field */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Nombre Completo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Juan Pérez García"
                        value={formData.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                          touched.name && errors.name
                            ? 'border-red-400 bg-red-50 focus:ring-red-200'
                            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                        }`}
                      />
                      {touched.name && errors.name && (
                        <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                      )}
                    </div>

                    {/* Phone Field */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Teléfono <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="8182757411"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                          touched.phone && errors.phone
                            ? 'border-red-400 bg-red-50 focus:ring-red-200'
                            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                        }`}
                      />
                      {touched.phone && errors.phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                      )}
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Email <span className="text-gray-400 font-normal text-[10px]">(opcional)</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder="correo@ejemplo.com"
                        value={formData.email || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                          touched.email && errors.email
                            ? 'border-red-400 bg-red-50 focus:ring-red-200'
                            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                        }`}
                      />
                      {touched.email && errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sección: Lista de Precios */}
                {!isLoadingPriceLists && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-5 bg-amber-600 rounded-full"></div>
                        <h3 className="text-sm font-semibold text-gray-900">💰 Lista de Precios</h3>
                      </div>
                      <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Opcional</span>
                    </div>

                    {priceLists.length === 0 ? (
                      <p className="text-sm text-gray-600">No hay listas de precios disponibles. Crea una primero.</p>
                    ) : (
                      <div className="space-y-2">
                        {/* Default Price List Option */}
                        <label
                          className={
                            'flex items-start p-3 border-2 rounded-lg cursor-pointer transition duration-150 ' +
                            (!formData.price_list_id
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50')
                          }
                        >
                          <div className="pt-0.5 pr-3">
                            <input
                              type="radio"
                              name="priceList"
                              value=""
                              checked={!formData.price_list_id}
                              onChange={() => {
                                setFormData({ ...formData, price_list_id: null });
                              }}
                              className="w-4 h-4 text-amber-600 cursor-pointer"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">
                              {defaultPriceList?.name || 'Por defecto de la clínica'}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">Utiliza la tarifa estándar</p>
                          </div>
                          {!formData.price_list_id && (
                            <div className="flex items-center gap-1 ml-2 text-amber-600 flex-shrink-0">
                              <MdCheckCircle className="w-4 h-4" />
                            </div>
                          )}
                        </label>

                        {/* Custom Price Lists - Excluir la predeterminada */}
                        {priceLists
                          .filter((pl) => !defaultPriceList || pl.id !== defaultPriceList.id)
                          .map((priceList) => (
                          <label
                            key={priceList.id}
                            className={
                              'flex items-start p-3 border-2 rounded-lg cursor-pointer transition duration-150 ' +
                              (formData.price_list_id === priceList.id
                                ? 'border-amber-500 bg-amber-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50')
                            }
                          >
                            <div className="pt-0.5 pr-3">
                              <input
                                type="radio"
                                name="priceList"
                                value={priceList.id}
                                checked={formData.price_list_id === priceList.id}
                                onChange={() => {
                                  setFormData({ ...formData, price_list_id: priceList.id });
                                }}
                                className="w-4 h-4 text-amber-600 cursor-pointer"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm">{priceList.name}</p>
                              {priceList.isDefault && (
                                <p className="text-xs text-gray-600 mt-0.5">Tarifa predeterminada</p>
                              )}
                            </div>
                            {formData.price_list_id === priceList.id && (
                              <div className="flex items-center gap-1 ml-2 text-amber-600 flex-shrink-0">
                                <MdCheckCircle className="w-4 h-4" />
                              </div>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sección: Preferencias de Domicilio */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-5 bg-primary-600 rounded-full"></div>
                      <h3 className="text-sm font-semibold text-gray-900">Preferencias de Domicilio</h3>
                    </div>
                    <span className="text-[10px] font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">Opcional</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Housing Type */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        🏠 Tipo de Vivienda
                      </label>
                      <select
                        name="housing_type"
                        value={formData.housing_type || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="HOUSE">Casa</option>
                        <option value="APARTMENT">Departamento</option>
                        <option value="OTHER">Otro</option>
                      </select>
                    </div>

                    {/* Access Notes */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        🔑 Acceso
                      </label>
                      <textarea
                        name="access_notes"
                        placeholder="ej. Vigilancia, portón automático, entre calles, código..."
                        value={formData.access_notes || ''}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      />
                    </div>

                    {/* Service Notes */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        ✂️ Notas de Servicio
                      </label>
                      <textarea
                        name="service_notes"
                        placeholder="ej. Perro nervioso, usar bozal, tocar fuerte timbre..."
                        value={formData.service_notes || ''}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección: Contacto Avanzado */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-5 bg-primary-600 rounded-full"></div>
                      <h3 className="text-sm font-semibold text-gray-900">Contacto Avanzado</h3>
                    </div>
                    <span className="text-[10px] font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">Opcional</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* WhatsApp */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        WhatsApp
                      </label>
                      <input
                        type="tel"
                        name="whatsapp_number"
                        placeholder="+52 555 123 4567"
                        value={formData.whatsapp_number || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    {/* Phone Secondary */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Teléfono Secundario
                      </label>
                      <input
                        type="tel"
                        name="phone_secondary"
                        placeholder="+52 555 987 6543"
                        value={formData.phone_secondary || ''}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.phone_secondary ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.phone_secondary && (
                        <p className="text-xs text-red-500 mt-1">{errors.phone_secondary}</p>
                      )}
                    </div>

                    {/* Preferred Contact Method */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Método Preferido
                      </label>
                      <select
                        name="preferred_contact_method"
                        value={formData.preferred_contact_method || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="PHONE">Teléfono</option>
                        <option value="EMAIL">Email</option>
                        <option value="SMS">SMS</option>
                      </select>
                    </div>

                    {/* Preferred Contact Time */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Horario Preferido
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="time"
                          name="preferred_contact_time_start"
                          value={formData.preferred_contact_time_start || ''}
                          onChange={handleChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <span className="text-gray-400 text-sm">a</span>
                        <input
                          type="time"
                          name="preferred_contact_time_end"
                          value={formData.preferred_contact_time_end || ''}
                          onChange={handleChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    {/* Do Not Contact */}
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="do_not_contact"
                          checked={formData.do_not_contact || false}
                          onChange={(e) => setFormData({ ...formData, do_not_contact: e.target.checked })}
                          className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                        />
                        <span className="text-xs font-medium text-gray-700">🚫 No contactar</span>
                      </label>
                      {formData.do_not_contact && (
                        <input
                          type="text"
                          name="do_not_contact_reason"
                          placeholder="Razón del bloqueo..."
                          value={formData.do_not_contact_reason || ''}
                          onChange={handleChange}
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Sección: Tags */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-5 bg-indigo-600 rounded-full"></div>
                      <h3 className="text-sm font-semibold text-gray-900">Tags</h3>
                    </div>
                    <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Opcional</span>
                  </div>

                  {/* Tag Input */}
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1 relative">
                      <MdLocalOffer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Escribe un tag y presiona Enter..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddTag}
                      disabled={!newTag.trim()}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MdAdd className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Tags Display */}
                  <div className="flex flex-wrap gap-2 min-h-[32px]">
                    {tags.length > 0 ? (
                      tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium group"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="w-4 h-4 rounded-full hover:bg-indigo-200 flex items-center justify-center transition"
                          >
                            <MdClose className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">Sin tags agregados</span>
                    )}
                  </div>
                </div>

            </form>
            )}

            {/* Addresses Tab - ClientAddressBook for both CREATE (draft) and EDIT (API) */}
            {/* Always render to load addresses count, hide when not active */}
            <div className={`p-4 space-y-4 flex-1 overflow-y-auto ${activeTab !== 'addresses' ? 'hidden' : ''}`}>
              {client ? (
                // EDIT Mode: use ClientAddressBook for API-based CRUD
                <ClientAddressBook 
                  clientId={client.id} 
                  onAddressCountChange={setEditModeAddressCount}
                />
              ) : (
                // CREATE Mode: use ClientAddressBook in draft mode
                <ClientAddressBook
                  draftAddresses={draftAddresses}
                  onDraftChange={setDraftAddresses}
                />
              )}
            </div>

            {/* Pets Tab - ClientPetBook for both CREATE (draft) and EDIT (API) */}
            {/* Always render to load pets count, hide when not active */}
            <div className={`p-4 space-y-4 flex-1 overflow-y-auto ${activeTab !== 'pets' ? 'hidden' : ''}`}>
              {client ? (
                // EDIT Mode: use ClientPetBook for API-based CRUD
                <ClientPetBook 
                  clientId={client.id} 
                  onPetCountChange={setEditModePetCount}
                />
              ) : (
                // CREATE Mode: use ClientPetBook in draft mode
                <ClientPetBook
                  draftPets={draftPets}
                  onDraftChange={setDraftPets}
                />
              )}
            </div>

            {/* Actions Footer */}
            <div className="sticky bottom-0 flex gap-3 justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-2.5 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 py-2.5 text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 hover:shadow-lg rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isCreating ? 'Creando...' : 'Guardando...'}
                  </>
                ) : (
                  <>
                    <MdCheckCircle className="w-5 h-5" />
                    {isCreating ? 'Crear Cliente' : 'Guardar Cambios'}
                  </>
                )}
              </button>
            </div>
          </>
        </div>
      </div>
    </>
  );
}


