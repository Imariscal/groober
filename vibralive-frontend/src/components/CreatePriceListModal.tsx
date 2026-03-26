'use client';

import { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import { priceListsApi } from '@/api/price-lists-api';
import { PriceList, CreatePriceListPayload } from '@/types';
import toast from 'react-hot-toast';

interface CreatePriceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  priceList?: PriceList; // If provided, this becomes an edit modal
}

interface FormErrors {
  name?: string;
}

export function CreatePriceListModal({
  isOpen,
  onClose,
  onSuccess,
  priceList,
}: CreatePriceListModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [existingLists, setExistingLists] = useState<PriceList[]>([]);
  const isEditMode = !!priceList;

  const [formData, setFormData] = useState<CreatePriceListPayload & { is_default?: boolean }>({
    name: '',
    description: '',
    is_default: false,
    copyFromPriceListId: undefined,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch existing price lists and populate form
  useEffect(() => {
    if (isOpen) {
      const fetchLists = async () => {
        try {
          const lists = await priceListsApi.getActivePriceLists();
          setExistingLists(lists?.filter((l) => l.id !== priceList?.id) || []);
        } catch (error) {
          console.error('Error fetching lists:', error);
        }
      };
      fetchLists();

      // Reset or populate form based on mode
      if (isEditMode && priceList) {
        setFormData({
          name: priceList.name,
          description: priceList.description || '',
          is_default: priceList.isDefault,
          copyFromPriceListId: undefined,
        });
      } else {
        setFormData({
          name: '',
          description: '',
          is_default: false,
          copyFromPriceListId: undefined,
        });
      }
      setErrors({});
    }
  }, [isOpen, priceList, isEditMode]);

  // Validations
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (isEditMode && priceList) {
        // Edit mode
        await priceListsApi.updatePriceList(priceList.id, formData);
        toast.success('Lista de precios actualizada');
      } else {
        // Create mode
        await priceListsApi.createPriceList(formData);
        toast.success('Lista de precios creada');
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = isEditMode ? 'Error al actualizar la lista' : 'Error al crear la lista';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between border-b border-primary-600 shadow-sm rounded-t-xl">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                {isEditMode ? 'Editar Lista de Precios' : 'Nueva Lista de Precios'}
              </h2>
              <p className="text-primary-100 text-sm mt-1">
                {isEditMode
                  ? 'Actualiza los datos de la lista'
                  : 'Completa los datos para crear una nueva lista de precios'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition duration-200"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: Precios VIP"
              disabled={isLoading}
            />
            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ej: Precios especiales para clientes VIP"
              rows={2}
              disabled={isLoading}
            />
          </div>

          {/* Copy from existing list - Only in create mode */}
          {!isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Copiar desde (opcional)
              </label>
              <select
                value={formData.copyFromPriceListId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, copyFromPriceListId: e.target.value || undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isLoading}
              >
                <option value="">-- Sin copiar --</option>
                {existingLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Selecciona una lista para copiar todos sus precios de servicios
              </p>
            </div>
          )}

          {/* Is Default Checkbox */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_default || false}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-700">
                Marcar como predeterminada
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              La lista predeterminada se asigna a nuevos servicios automáticamente
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition disabled:opacity-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium transition disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (isEditMode ? 'Guardando...' : 'Creando...') : (isEditMode ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}


