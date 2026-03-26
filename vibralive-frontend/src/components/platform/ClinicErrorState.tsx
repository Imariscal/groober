'use client';

import React from 'react';
import { MdError, MdRefresh } from 'react-icons/md';

interface ClinicErrorStateProps {
  error?: string;
  onRetry: () => void;
}

export function ClinicErrorState({
  error = 'No se pudieron cargar las clínicas',
  onRetry,
}: ClinicErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-full p-6 mb-6">
        <MdError className="w-12 h-12 text-red-600" />
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        Oops, algo salió mal
      </h3>

      <p className="text-center text-gray-600 mb-8 max-w-md">
        {error}
      </p>

      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
      >
        <MdRefresh className="w-5 h-5" />
        Reintentar
      </button>
    </div>
  );
}
