'use client';

import React, { useEffect, useState } from 'react';
import { PermissionGate } from '@/components/PermissionGate';
import { MdAdd } from 'react-icons/md';

interface Clinic {
  id: string;
  name: string;
  phone: string;
  city: string;
  status: string;
  plan: string;
}

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        // Placeholder: In production, this would be an actual API call
        setClinics([
          { id: '1', name: 'Clínica Central', phone: '+34912345678', city: 'Madrid', status: 'ACTIVE', plan: 'PROFESSIONAL' },
          { id: '2', name: 'Vetcare Barcelona', phone: '+34932145678', city: 'Barcelona', status: 'ACTIVE', plan: 'STARTER' },
          { id: '3', name: 'Pet Clinic Valencia', phone: '+34961345678', city: 'Valencia', status: 'ACTIVE', plan: 'ENTERPRISE' },
        ]);
      } catch (error) {
        console.error('Error fetching clinics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClinics();
  }, []);

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Clínicas</h2>
          <PermissionGate require={{ permissions: ['clinics:create'] }}>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
              <MdAdd size={20} />
              Nueva Clínica
            </button>
          </PermissionGate>
        </div>

        {/* Table */}
        {!loading ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Teléfono</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ciudad</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Plan</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clinics.map((clinic) => (
                  <tr key={clinic.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{clinic.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{clinic.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{clinic.city}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        {clinic.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                        {clinic.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-blue-600 hover:text-blue-800 font-semibold">Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">Cargando clínicas...</p>
          </div>
        )}
      </div>
    </>
  );
}
