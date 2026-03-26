'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { MdArrowBack } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    clinic_name: '',
    clinic_phone: '',
    city: '',
    owner_name: '',
    owner_email: '',
    password: '',
    confirmPassword: '',
  });
  const { register, isLoading } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    try {
      await register(
        formData.clinic_name,
        formData.clinic_phone,
        formData.city,
        formData.owner_name,
        formData.owner_email,
        formData.password,
      );
      toast.success('¡Registro exitoso!');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al registrar';
      toast.error(message);
    }
  };

  return (
    <div>
      <Link
        href="/login"
        className="flex items-center text-blue-600 hover:text-blue-700 mb-6 font-semibold text-sm"
      >
        <MdArrowBack size={18} />
        <span className="ml-1">Volver a Login</span>
      </Link>

      <h2 className="text-2xl font-bold text-gray-900 mb-4">Crear Clínica</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Clinic Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Información de la Clínica</h3>

          <input
            type="text"
            name="clinic_name"
            value={formData.clinic_name}
            onChange={handleChange}
            placeholder="Nombre de clínica"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2"
            disabled={isLoading}
          />

          <input
            type="tel"
            name="clinic_phone"
            value={formData.clinic_phone}
            onChange={handleChange}
            placeholder="+525512345678"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2"
            disabled={isLoading}
          />

          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Ciudad"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={isLoading}
          />
        </div>

        {/* Owner Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Datos del Propietario</h3>

          <input
            type="text"
            name="owner_name"
            value={formData.owner_name}
            onChange={handleChange}
            placeholder="Nombre completo"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2"
            disabled={isLoading}
          />

          <input
            type="email"
            name="owner_email"
            value={formData.owner_email}
            onChange={handleChange}
            placeholder="tu@email.com"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2"
            disabled={isLoading}
          />

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Contraseña"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2"
            disabled={isLoading}
          />

          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirmar contraseña"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition mt-4"
        >
          {isLoading ? 'Registrando...' : 'Crear Clínica y Cuenta'}
        </button>
      </form>
    </div>
  );
}
