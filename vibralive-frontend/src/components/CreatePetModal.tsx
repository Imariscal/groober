'use client';

import React, { useState, useEffect } from 'react';
import { MdClose, MdPets, MdPerson } from 'react-icons/md';
import { Pet, Client, CreateClientPetPayload } from '@/types';
import { petsApi } from '@/lib/pets-api';
import { clientsApi } from '@/lib/clients-api';
import toast from 'react-hot-toast';

interface CreatePetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (pet: Pet) => void;
}

export function CreatePetModal({ isOpen, onClose, onSuccess }: CreatePetModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);
  
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSearchInput, setClientSearchInput] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    dateOfBirth: '',
    sex: 'UNKNOWN',
    isSterilized: false,
    color: '',
    size: '',
    microchipNumber: '',
    tagNumber: '',
    notes: '',
    allergies: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch clients on mount
  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(clientSearchInput.toLowerCase()) ||
    client.phone?.toLowerCase().includes(clientSearchInput.toLowerCase())
  );

  const fetchClients = async () => {
    try {
      setClientsLoading(true);
      const response = await clientsApi.listClients(1, 1000);
      setClients(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedClientId(response.data[0].id);
        setClientSearchInput(response.data[0].name);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Error al cargar clientes');
    } finally {
      setClientsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedClientId) {
      newErrors.clientId = 'Selecciona un cliente';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la mascota es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'El nombre no puede exceder 50 caracteres';
    }

    if (!formData.species) {
      newErrors.species = 'Selecciona una especie';
    }

    if (!formData.size) {
      newErrors.size = 'Selecciona un tamaño';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const payload: CreateClientPetPayload = {
        name: formData.name,
        species: formData.species as any,
        breed: formData.breed || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        sex: formData.sex as any,
        isSterilized: formData.isSterilized,
        color: formData.color || undefined,
        size: (formData.size || undefined) as any,
        microchipNumber: formData.microchipNumber || undefined,
        tagNumber: formData.tagNumber || undefined,
        notes: formData.notes || undefined,
        allergies: formData.allergies || undefined,
      };

      const newPet = await petsApi.createPet(selectedClientId, payload);
      toast.success('Mascota creada exitosamente');
      onSuccess?.(newPet);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        species: '',
        breed: '',
        dateOfBirth: '',
        sex: 'UNKNOWN',
        isSterilized: false,
        color: '',
        size: '',
        microchipNumber: '',
        tagNumber: '',
        notes: '',
        allergies: '',
      });
      setErrors({});
      setSelectedClientId(clients[0]?.id || '');
      setClientSearchInput(clients[0]?.name || '');
    } catch (error: any) {
      console.error('Error creating pet:', error);
      toast.error(error.message || 'Error al crear mascota');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col transform transition-all duration-300">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between border-b border-primary-600 shadow-sm">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <MdPets className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Nueva Mascota</h2>
              </div>
              <p className="text-primary-100 text-sm">
                Agrega una nueva mascota a tu sistema
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition duration-200"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Sección: Cliente */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-5 bg-primary-600 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-900">Seleccionar Cliente</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                  Cliente <span className="text-red-500">*</span>
                </label>
                {clientsLoading ? (
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                ) : (
                  <div className="relative">
                    {/* Autocomplete Input */}
                    <input
                      type="text"
                      placeholder="Busca por nombre o teléfono..."
                      value={clientSearchInput}
                      onChange={(e) => {
                        setClientSearchInput(e.target.value);
                        setShowClientDropdown(true);
                        if (errors.clientId) {
                          setErrors((prev) => ({
                            ...prev,
                            clientId: '',
                          }));
                        }
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors.clientId
                          ? 'border-red-300 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-primary-500 focus:border-primary-300 bg-white'
                      }`}
                    />

                    {/* Dropdown List */}
                    {showClientDropdown && filteredClients.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                        {filteredClients.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => {
                              setSelectedClientId(client.id);
                              setClientSearchInput(client.name);
                              setShowClientDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-primary-50 border-b border-gray-100 last:border-b-0 transition flex flex-col"
                          >
                            <span className="font-medium text-gray-900">{client.name}</span>
                            <span className="text-xs text-gray-500">↳ {client.phone || 'Sin teléfono'}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No results message */}
                    {showClientDropdown && clientSearchInput && filteredClients.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3">
                        <p className="text-xs text-gray-500 text-center">No se encontraron clientes</p>
                      </div>
                    )}

                    {/* Close dropdown when clicking outside */}
                    {showClientDropdown && (
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowClientDropdown(false)}
                      />
                    )}

                    {errors.clientId && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        ⚠️ {errors.clientId}
                      </p>
                    )}
                  </div>
                )}
                {selectedClient && !errors.clientId && (
                  <div className="mt-3 p-3 bg-primary-50 border border-primary-100 rounded-lg">
                    <p className="text-xs text-primary-700 font-medium">
                      <span className="font-semibold">{selectedClient.name}</span> • Teléfono: {selectedClient.phone}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sección: Información Básica */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-5 bg-primary-600 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-900">Información Básica</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="ej: Max"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.name
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-primary-500 focus:border-primary-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      ⚠️ {errors.name}
                    </p>
                  )}
                </div>

                {/* Species */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Especie <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="species"
                    value={formData.species}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.species
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-primary-500 focus:border-primary-300'
                    }`}
                  >
                    <option value="">Selecciona una especie</option>
                    <option value="DOG">Perro</option>
                    <option value="CAT">Gato</option>
                    <option value="BIRD">Ave</option>
                    <option value="RABBIT">Conejo</option>
                    <option value="HAMSTER">Hámster</option>
                    <option value="GUINEA_PIG">Cobaya</option>
                    <option value="FISH">Pez</option>
                    <option value="TURTLE">Tortuga</option>
                    <option value="FERRET">Hurón</option>
                    <option value="OTHER">Otro</option>
                  </select>
                  {errors.species && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      ⚠️ {errors.species}
                    </p>
                  )}
                </div>

                {/* Breed */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Raza
                  </label>
                  <input
                    type="text"
                    name="breed"
                    value={formData.breed}
                    onChange={handleInputChange}
                    placeholder="ej: Golden Retriever"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 transition"
                  />
                </div>

                {/* Sex */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Sexo
                  </label>
                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300 transition"
                  >
                    <option value="UNKNOWN">Desconocido</option>
                    <option value="MALE">♂️ Macho</option>
                    <option value="FEMALE">♀️ Hembra</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300 transition"
                  />
                </div>

                {/* Size */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Tamaño <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.size
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-primary-500 focus:border-primary-300'
                    }`}
                  >
                    <option value="">Selecciona un tamaño</option>
                    <option value="XS">XS - Miniatura (&lt; 3kg)</option>
                    <option value="S">S - Pequeño (3-10kg)</option>
                    <option value="M">M - Mediano (10-25kg)</option>
                    <option value="L">L - Grande (25-45kg)</option>
                    <option value="XL">XL - Gigante (&gt; 45kg)</option>
                  </select>
                  {errors.size && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      ⚠️ {errors.size}
                    </p>
                  )}
                </div>

                {/* Color */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Color
                  </label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    placeholder="ej: Blanco y marrón"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300 transition"
                  />
                </div>
              </div>

              {/* Esterilization Checkbox */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isSterilized"
                    checked={formData.isSterilized}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Mascota esterilizada</span>
                </label>
              </div>
            </div>

            {/* Sección: Información Médica */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-5 bg-primary-600 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-900">Información Médica</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Microchip */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Número de Microchip
                  </label>
                  <input
                    type="text"
                    name="microchipNumber"
                    value={formData.microchipNumber}
                    onChange={handleInputChange}
                    placeholder="Número de microchip"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300 transition"
                  />
                </div>

                {/* Tag Number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Número de Placa
                  </label>
                  <input
                    type="text"
                    name="tagNumber"
                    value={formData.tagNumber}
                    onChange={handleInputChange}
                    placeholder="Número de placa/tag"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300 transition"
                  />
                </div>
              </div>

              {/* Allergies */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                  Alergias
                </label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  placeholder="Describe cualquier alergia conocida..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300 transition resize-none"
                />
              </div>
            </div>

            {/* Sección: Notas Adicionales */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-5 bg-primary-600 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-900">Notas Adicionales</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                  Observaciones
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Agrega cualquier nota adicional sobre la mascota..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300 transition resize-none"
                />
              </div>
            </div>

            {/* Footer - Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !selectedClientId}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <MdPets className="w-4 h-4" />
                    Crear Mascota
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}



