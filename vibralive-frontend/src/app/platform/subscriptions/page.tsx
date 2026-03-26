'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/dashboard/page-header/PageHeader';
import { MdEdit, MdDelete, MdAdd, MdCheck, MdClose, MdStar } from 'react-icons/md';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { formatInTimeZone } from 'date-fns-tz';
import {
  listPlans,
  createPlan,
  updatePlan,
  togglePlanStatus,
  deletePlan,
  SubscriptionPlan,
  CreatePlanPayload,
  UpdatePlanPayload,
} from '@/lib/platformApi';

interface PlanFormData {
  code: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'yearly';
  maxStaffUsers: number;
  maxClients: number;
  maxPets: number;
  features: string[];
  sortOrder: number;
  isPopular: boolean;
}

interface FormTouched {
  code: boolean;
  name: boolean;
  price: boolean;
  maxStaffUsers: boolean;
  maxClients: boolean;
  maxPets: boolean;
}

interface FormErrors {
  code?: string;
  name?: string;
  price?: string;
  maxStaffUsers?: string;
  maxClients?: string;
  maxPets?: string;
}

const initialFormData: PlanFormData = {
  code: '',
  name: '',
  description: '',
  price: 0,
  currency: 'MXN',
  billingPeriod: 'monthly',
  maxStaffUsers: 5,
  maxClients: 100,
  maxPets: 200,
  features: [],
  sortOrder: 0,
  isPopular: false,
};

export default function SubscriptionsPage() {
  const clinicTimezone = useClinicTimezone();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(initialFormData);
  const [newFeature, setNewFeature] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [touched, setTouched] = useState<FormTouched>({
    code: false,
    name: false,
    price: false,
    maxStaffUsers: false,
    maxClients: false,
    maxPets: false,
  });

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const response = await listPlans();
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubscriptionPlans = async () => {
    const response = await fetch('/api/subscription-plans');
    const data = await response.json();
    setSubscriptionPlans(data);
  };

  useEffect(() => {
    fetchPlans();
    fetchSubscriptionPlans();
  }, []);

  const pageHeader = {
    title: 'Planes & Suscripciones',
    subtitle: 'Gestiona los planes disponibles para las clínicas',
    breadcrumbs: [
      { label: 'Plataforma', href: '/platform/dashboard' },
      { label: 'Planes & Suscripciones' },
    ],
    primaryAction: {
      label: 'Nuevo Plan',
      onClick: () => {
        setEditingPlan(null);
        setFormData(initialFormData);
        setShowModal(true);
      },
      icon: <MdAdd />,
    },
  };

  const handleToggleStatus = async (planId: string) => {
    try {
      await togglePlanStatus(planId);
      fetchPlans();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('¿Estás seguro de eliminar este plan?')) return;
    try {
      await deletePlan(planId);
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      code: plan.code,
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      currency: plan.currency,
      billingPeriod: plan.billingPeriod,
      maxStaffUsers: plan.maxStaffUsers,
      maxClients: plan.maxClients,
      maxPets: plan.maxPets,
      features: plan.features || [],
      sortOrder: plan.sortOrder,
      isPopular: plan.isPopular,
    });
    setTouched({
      code: false,
      name: false,
      price: false,
      maxStaffUsers: false,
      maxClients: false,
      maxPets: false,
    });
    setShowModal(true);
  };

  // Validaciones
  const validateField = (name: keyof FormErrors, value: any): string => {
    switch (name) {
      case 'code':
        if (!value || value.trim().length < 2) {
          return 'El código debe tener al menos 2 caracteres';
        }
        return '';
      case 'name':
        if (!value || value.trim().length < 3) {
          return 'El nombre debe tener al menos 3 caracteres';
        }
        return '';
      case 'price':
        if (value < 0) {
          return 'El precio no puede ser negativo';
        }
        return '';
      case 'maxStaffUsers':
      case 'maxClients':
      case 'maxPets':
        if (value < 1) {
          return 'Debe ser al menos 1';
        }
        return '';
      default:
        return '';
    }
  };

  // Calcular errores
  const errors: FormErrors = {
    code: validateField('code', formData.code),
    name: validateField('name', formData.name),
    price: validateField('price', formData.price),
    maxStaffUsers: validateField('maxStaffUsers', formData.maxStaffUsers),
    maxClients: validateField('maxClients', formData.maxClients),
    maxPets: validateField('maxPets', formData.maxPets),
  };

  // Determinar si mostrar error (solo si fue tocado)
  const showError = (field: keyof FormErrors): boolean => {
    return touched[field] && !!errors[field];
  };

  // Determinar si el formulario es válido
  const isFormValid =
    formData.code.trim().length >= 2 &&
    formData.name.trim().length >= 3 &&
    formData.price >= 0 &&
    formData.maxStaffUsers >= 1 &&
    formData.maxClients >= 1 &&
    formData.maxPets >= 1 &&
    !errors.code &&
    !errors.name &&
    !errors.price &&
    !errors.maxStaffUsers &&
    !errors.maxClients &&
    !errors.maxPets;

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingPlan) {
        const payload: UpdatePlanPayload = {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          currency: formData.currency,
          billingPeriod: formData.billingPeriod,
          maxStaffUsers: formData.maxStaffUsers,
          maxClients: formData.maxClients,
          maxPets: formData.maxPets,
          features: formData.features,
          sortOrder: formData.sortOrder,
          isPopular: formData.isPopular,
        };
        await updatePlan(editingPlan.id, payload);
      } else {
        const payload: CreatePlanPayload = {
          code: formData.code,
          name: formData.name,
          description: formData.description,
          price: formData.price,
          currency: formData.currency,
          billingPeriod: formData.billingPeriod,
          maxStaffUsers: formData.maxStaffUsers,
          maxClients: formData.maxClients,
          maxPets: formData.maxPets,
          features: formData.features,
          sortOrder: formData.sortOrder,
          isPopular: formData.isPopular,
        };
        await createPlan(payload);
      }
      setShowModal(false);
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  return (
    <>
      <PageHeader {...pageHeader} />
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="text-slate-500">Cargando planes...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow relative"
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute top-2 right-2">
                  <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                    <MdStar className="w-3 h-3" /> Popular
                  </span>
                </div>
              )}

              {/* Header */}
              <div className={`px-6 py-4 ${plan.status === 'active' ? 'bg-blue-50 border-b border-blue-200' : 'bg-gray-50 border-b border-gray-200'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{plan.code}</p>
                    <p className="text-sm text-slate-600 mt-1">{plan.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    plan.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {plan.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="px-6 py-4 border-b border-slate-200">
                <p className="text-3xl font-bold text-slate-900">
                  ${Number(plan.price).toLocaleString()}
                  <span className="text-sm font-normal text-slate-600">
                    {' '}{plan.currency}/{plan.billingPeriod === 'monthly' ? 'mes' : 'año'}
                  </span>
                </p>
              </div>

              {/* Limits */}
              <div className="px-6 py-4 border-b border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Límites</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Usuarios</span>
                    <span className="font-semibold text-slate-900">{plan.maxStaffUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Clientes</span>
                    <span className="font-semibold text-slate-900">{plan.maxClients.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Mascotas</span>
                    <span className="font-semibold text-slate-900">{plan.maxPets.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="px-6 py-4 border-b border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Características</h4>
                <ul className="space-y-2">
                  {plan.features?.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                      <MdCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 flex gap-2">
                <button
                  onClick={() => handleEditPlan(plan)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                >
                  <MdEdit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleToggleStatus(plan.id)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition ${
                    plan.status === 'active'
                      ? 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                      : 'text-green-600 bg-green-50 hover:bg-green-100'
                  }`}
                >
                  {plan.status === 'active' ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                >
                  <MdDelete className="w-4 h-4" />
                </button>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-slate-50 text-xs text-slate-500">
                Creado: {formatInTimeZone(new Date(plan.createdAt), clinicTimezone, 'dd/MM/yyyy')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para crear/editar planes */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">
                  {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-white hover:text-gray-200 transition rounded-lg"
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Código y Nombre */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Código <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      onBlur={handleBlur}
                      disabled={!!editingPlan}
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                        showError('code')
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500 disabled:bg-red-50'
                          : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100'
                      }`}
                      placeholder="ej: premium"
                    />
                    {showError('code') && (
                      <p className="text-red-600 text-xs mt-1.5">{errors.code}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">Identificador único (no editable)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                        showError('name')
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="ej: Premium"
                    />
                    {showError('name') && (
                      <p className="text-red-600 text-xs mt-1.5">{errors.name}</p>
                    )}
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Descripción del plan..."
                  />
                </div>

                {/* Precio y Facturación */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Precio <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                        showError('price')
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      min="0"
                    />
                    {showError('price') && (
                      <p className="text-red-600 text-xs mt-1.5">{errors.price}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Moneda
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="MXN">MXN</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Período
                    </label>
                    <select
                      value={formData.billingPeriod}
                      onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value as 'monthly' | 'yearly' })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="monthly">Mensual</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>
                </div>

                {/* Límites */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Límites del Plan
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Max. Usuarios <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="maxStaffUsers"
                        value={formData.maxStaffUsers}
                        onChange={(e) => setFormData({ ...formData, maxStaffUsers: Number(e.target.value) })}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                          showError('maxStaffUsers')
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        min="1"
                      />
                      {showError('maxStaffUsers') && (
                        <p className="text-red-600 text-xs mt-1">{errors.maxStaffUsers}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Max. Clientes <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="maxClients"
                        value={formData.maxClients}
                        onChange={(e) => setFormData({ ...formData, maxClients: Number(e.target.value) })}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                          showError('maxClients')
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        min="1"
                      />
                      {showError('maxClients') && (
                        <p className="text-red-600 text-xs mt-1">{errors.maxClients}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Max. Mascotas <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="maxPets"
                        value={formData.maxPets}
                        onChange={(e) => setFormData({ ...formData, maxPets: Number(e.target.value) })}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                          showError('maxPets')
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        min="1"
                      />
                      {showError('maxPets') && (
                        <p className="text-red-600 text-xs mt-1">{errors.maxPets}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Características */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Características
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nueva característica..."
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <MdAdd className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                        <MdCheck className="w-4 h-4 text-green-500" />
                        <span className="flex-1 text-sm">{feature}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          <MdClose className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Opciones adicionales */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Orden de visualización
                    </label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer mt-6">
                      <input
                        type="checkbox"
                        checked={formData.isPopular}
                        onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                        <MdStar className="w-4 h-4 text-yellow-500" /> Marcar como Popular
                      </span>
                    </label>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid || isSaving}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition ${
                      !isFormValid || isSaving
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isSaving ? 'Guardando...' : editingPlan ? 'Guardar Cambios' : 'Crear Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
