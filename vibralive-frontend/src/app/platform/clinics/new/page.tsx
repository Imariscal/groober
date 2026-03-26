'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateClinicPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Clinic data
  const [formData, setFormData] = useState({
    name: '',
    city: 'CDMX',
    phone: '+52 (55) ',
    plan: 'STARTER',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError('El nombre de la clínica es requerido');
      return false;
    }
    if (formData.name.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setError('El teléfono es inválido');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
      return;
    }

    if (step === 2) {
      await submitClinic();
    }
  };

  const submitClinic = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('platform_token');

      if (!token) {
        router.push('/platform/login');
        return;
      }

      const response = await fetch(
        '/api/platform/clinics',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(
          data.message ||
          'Error al crear la clínica. Por favor intenta nuevamente.'
        );
        return;
      }

      const clinic = await response.json();
      router.push(`/platform/clinics/${clinic.id}`);
    } catch (err) {
      setError('Error de conexión');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cities = [
    { value: 'CDMX', label: 'Ciudad de México' },
    { value: 'GDL', label: 'Guadalajara' },
    { value: 'MTY', label: 'Monterrey' },
    { value: 'CUN', label: 'Cancún' },
    { value: 'OTRO', label: 'Otra' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <div className="bg-white shadow border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <Link href="/platform/clinics" className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block">
            ← Volver
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Crear Clínica</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow p-8">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-700">
                Paso {step} de 2
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <>
                <h2 className="text-xl font-bold text-slate-900 mb-6">
                  Información de la Clínica
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nombre de la Clínica *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ej: Mascota Monterrey"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Máximo 100 caracteres
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Ciudad *
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {cities.map((city) => (
                        <option key={city.value} value={city.value}>
                          {city.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+52 (55) 1234-5678"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Formato: +52 (XX) XXXX-XXXX
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Plan *
                    </label>
                    <select
                      name="plan"
                      value={formData.plan}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="STARTER">
                        Starter (100 usuarios, 1000 clientes)
                      </option>
                      <option value="PROFESSIONAL">
                        Professional (300 usuarios, 5000 clientes)
                      </option>
                      <option value="ENTERPRISE">
                        Enterprise (Ilimitado)
                      </option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-slate-900 mb-6">
                  Resumen
                </h2>

                <div className="bg-slate-50 rounded-lg p-6 space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-slate-600">Nombre</p>
                    <p className="font-medium text-slate-900">
                      {formData.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Ciudad</p>
                    <p className="font-medium text-slate-900">
                      {cities.find((c) => c.value === formData.city)
                        ?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Teléfono</p>
                    <p className="font-medium text-slate-900">
                      {formData.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Plan</p>
                    <p className="font-medium text-slate-900">
                      {formData.plan}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-6">
                  La clínica se creará con estos datos. Podrás editar la
                  información después.
                </p>
              </>
            )}

            {/* Buttons */}
            <div className="flex gap-4 mt-8">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                >
                  ← Atrás
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${
                  loading
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading
                  ? 'Creando...'
                  : step === 1
                    ? 'Siguiente →'
                    : 'Crear Clínica'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
