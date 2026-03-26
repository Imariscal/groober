'use client';

import React from 'react';

function ClinicTableRowSkeleton() {
  return (
    <tr className="border-b border-gray-200 animate-pulse">
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded w-32" />
          <div className="h-3 bg-gray-300 rounded w-24" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-300 rounded w-28" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-300 rounded w-40" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-300 rounded w-32" />
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-300 rounded w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-300 rounded w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-center gap-2">
          <div className="w-8 h-8 bg-gray-300 rounded" />
          <div className="w-8 h-8 bg-gray-300 rounded" />
        </div>
      </td>
    </tr>
  );
}

export function ClinicTableRowSkeletonList() {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">
              Clínica
            </th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">
              Teléfono
            </th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">
              Correo
            </th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">
              Ciudad
            </th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">
              Plan
            </th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">
              Estado
            </th>
            <th className="px-6 py-3 text-center font-semibold text-gray-700">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <ClinicTableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
