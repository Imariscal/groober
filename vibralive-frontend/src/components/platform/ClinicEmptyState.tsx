'use client';

import React from 'react';
import { MdLocalHospital, MdAdd } from 'react-icons/md';

interface ClinicEmptyStateProps {
  onCreateNew: () => void;
  hasFilters?: boolean;
  filterTerm?: string;
}

export function ClinicEmptyState({
  onCreateNew,
  hasFilters = false,
  filterTerm = '',
}: ClinicEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-full p-6 mb-6">
        <MdLocalHospital className="w-12 h-12 text-blue-600" />
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        {hasFilters
          ? 'No se encontraron clínicas'
          : 'No hay clínicas registradas'}
      </h3>

      <p className="text-center text-gray-600 mb-8 max-w-md">
        {hasFilters ? (
          <>
            No hay clínicas que coincidan con los filtros aplicados. Intenta
            cambiar los filtros o{' '}
            <button
              onClick={onCreateNew}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              crear una nueva clínica
            </button>
            .
          </>
        ) : (
          <>
            Comienza a gestionar tus clínicas creando una nueva. Tendrás acceso
            a todas las herramientas para administrarlas.
          </>
        )}
      </p>

      {!hasFilters && (
        <button
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
        >
          <MdAdd className="w-5 h-5" />
          Crear Primera Clínica
        </button>
      )}
    </div>
  );
}
