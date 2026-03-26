'use client';

import { useState } from 'react';
import { MdClose, MdContentCopy, MdCheck } from 'react-icons/md';
import { createClinicOwner, CreateOwnerResponse } from '@/lib/platformApi';
import { CreateOwnerPayload } from '@/types';

interface AssignOwnerModalProps {
  isOpen: boolean;
  clinicId: string | null;
  clinicName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AssignOwnerModal({
  isOpen,
  clinicId,
  clinicName = 'Clínica',
  onClose,
  onSuccess,
}: AssignOwnerModalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [ownerData, setOwnerData] = useState<CreateOwnerResponse | null>(null);
  const [formData, setFormData] = useState<CreateOwnerPayload>({
    name: '',
    email: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;

    setIsLoading(true);
    try {
      const result = await createClinicOwner(clinicId, formData);
      setOwnerData(result);
      setStep('success');
    } catch (error) {
      console.error('Error creating owner:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (ownerData?.invitation_token) {
      navigator.clipboard.writeText(ownerData.invitation_token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleClose = () => {
    setStep('form');
    setFormData({ name: '', email: '', phone: '' });
    setOwnerData(null);
    setCopiedToken(false);
    onClose();
  };

  const handleSuccess = () => {
    onSuccess?.();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-white">
            Asignar Admin a {clinicName}
          </h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition"
            disabled={isLoading}
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Admin *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej: Juan García"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Admin *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Ej: juan@clinica.com"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono (Opcional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Ej: +5255123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <strong>Nota:</strong> Se enviará un token de invitación al email del admin. El token expira en 24 horas.
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition disabled:opacity-50"
                >
                  {isLoading ? 'Creando...' : 'Crear Admin'}
                </button>
              </div>
            </form>
          ) : (
            // Success state
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MdCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">Admin Creado</h3>
                    <p className="text-sm text-green-700">{ownerData?.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token de Invitación (Copiar y guardar):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ownerData?.invitation_token || ''}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg font-mono text-xs"
                  />
                  <button
                    onClick={handleCopyToken}
                    className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                      copiedToken
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {copiedToken ? (
                      <>
                        <MdCheck className="w-4 h-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <MdContentCopy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expira:
                </label>
                <p className="text-gray-600">
                  {ownerData?.invitation_expires_at
                    ? new Date(ownerData.invitation_expires_at).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })
                    : ''}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                <strong>⚠️ Importante:</strong> Este token se muestra solo una vez. Cópialo y guárdalo en un lugar seguro. El admin lo necesitará para aceptar la invitación.
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleSuccess}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition"
                >
                  Listo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
