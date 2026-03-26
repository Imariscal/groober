'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MdAdd, MdEdit, MdDelete, MdToggleOff, MdToggleOn } from 'react-icons/md';
import { ehrApi } from '@/api/ehr-api';
import { toast } from 'react-hot-toast';

interface Vaccine {
  id: string;
  clinicId: string;
  name: string;
  description?: string;
  boosterDays: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface FormData {
  name: string;
  description: string;
  boosterDays: number;
}

export default function VaccineCatalogPage() {
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    boosterDays: 365,
  });

  // Load vaccines on mount
  useEffect(() => {
    loadVaccines();
  }, []);

  const loadVaccines = async () => {
    try {
      setLoading(true);
      const data = await ehrApi.getAllVaccines();
      setVaccines(data);
    } catch (error) {
      console.error('Error loading vaccines:', error);
      toast.error('Error al cargar el catálogo de vacunas');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      boosterDays: 365,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (vaccine: Vaccine) => {
    setIsEditing(true);
    setEditingId(vaccine.id);
    setFormData({
      name: vaccine.name,
      description: vaccine.description || '',
      boosterDays: vaccine.boosterDays,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('El nombre de la vacuna es requerido');
      return;
    }

    try {
      if (isEditing && editingId) {
        await ehrApi.updateVaccine(editingId, {
          name: formData.name,
          description: formData.description,
          boosterDays: formData.boosterDays,
        });
      } else {
        await ehrApi.createVaccine({
          name: formData.name,
          description: formData.description,
          boosterDays: formData.boosterDays,
          isActive: true,
        });
      }
      await loadVaccines();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving vaccine:', error);
    }
  };

  const handleToggleActive = async (vaccineId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await ehrApi.deactivateVaccine(vaccineId);
      } else {
        await ehrApi.activateVaccine(vaccineId);
      }
      await loadVaccines();
    } catch (error) {
      console.error('Error toggling vaccine status:', error);
    }
  };

  const handleDelete = async (vaccineId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta vacuna?')) {
      try {
        await ehrApi.deleteVaccine(vaccineId);
        await loadVaccines();
      } catch (error) {
        console.error('Error deleting vaccine:', error);
      }
    }
  };

  const activeVaccines = vaccines.filter((v) => v.isActive);
  const inactiveVaccines = vaccines.filter((v) => !v.isActive);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Catálogo de Vacunas</h1>
              <p className="text-slate-500 mt-2">Gestiona las vacunas disponibles para tus mascotas</p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              <MdAdd size={20} />
              Agregar Vacuna
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="text-slate-500 mt-4">Cargando vacunas...</p>
          </div>
        ) : vaccines.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-slate-500 mb-4">No hay vacunas en el catálogo</p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <MdAdd size={18} />
              Crear Primera Vacuna
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Vaccines */}
            {activeVaccines.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Vacunas Activas ({activeVaccines.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeVaccines.map((vaccine) => (
                    <div
                      key={vaccine.id}
                      className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-slate-900">{vaccine.name}</h3>
                          {vaccine.description && (
                            <p className="text-sm text-slate-500 mt-1">{vaccine.description}</p>
                          )}
                        </div>
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                          Activa
                        </span>
                      </div>

                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Intervalo Booster:</span>
                          <span className="font-medium text-slate-900">{vaccine.boosterDays} días</span>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEditModal(vaccine)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
                        >
                          <MdEdit size={16} />
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggleActive(vaccine.id, vaccine.isActive)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition"
                        >
                          <MdToggleOff size={16} />
                          Desactivar
                        </button>
                        <button
                          onClick={() => handleDelete(vaccine.id)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        >
                          <MdDelete size={16} />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Vaccines */}
            {inactiveVaccines.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Vacunas Inactivas ({inactiveVaccines.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {inactiveVaccines.map((vaccine) => (
                    <div
                      key={vaccine.id}
                      className="bg-slate-50 rounded-lg border border-slate-200 p-6 opacity-75"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-slate-700">{vaccine.name}</h3>
                          {vaccine.description && (
                            <p className="text-sm text-slate-500 mt-1">{vaccine.description}</p>
                          )}
                        </div>
                        <span className="inline-block px-2 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded">
                          Inactiva
                        </span>
                      </div>

                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Intervalo Booster:</span>
                          <span className="font-medium text-slate-600">{vaccine.boosterDays} días</span>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleToggleActive(vaccine.id, vaccine.isActive)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                        >
                          <MdToggleOn size={16} />
                          Activar
                        </button>
                        <button
                          onClick={() => handleDelete(vaccine.id)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        >
                          <MdDelete size={16} />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                {isEditing ? 'Editar Vacuna' : 'Agregar Vacuna'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Nombre de la Vacuna *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="ej: DHPPI, Rabia, Leptospirosis"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Información adicional sobre la vacuna"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Días para Próximo Refuerzo *
                  </label>
                  <input
                    type="number"
                    value={formData.boosterDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        boosterDays: parseInt(e.target.value) || 365,
                      })
                    }
                    min="1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Se agregará automáticamente a la fecha de administración
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                  >
                    {isEditing ? 'Guardar Cambios' : 'Crear Vacuna'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
