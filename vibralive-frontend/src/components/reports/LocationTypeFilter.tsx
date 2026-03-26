'use client';

import React from 'react';
import { MdLocationOn } from 'react-icons/md';

export type LocationType = 'all' | 'CLINIC' | 'HOME';

interface LocationTypeFilterProps {
  selectedLocation?: LocationType;
  onLocationChange: (location: LocationType) => void;
}

/**
 * Filtro de tipo de ubicación (Clínica, Domicilio, Todas)
 */
export const LocationTypeFilter: React.FC<LocationTypeFilterProps> = ({
  selectedLocation = 'all',
  onLocationChange,
}) => {
  const locations = [
    { id: 'all', label: 'Todas' },
    { id: 'CLINIC', label: 'Clínica' },
    { id: 'HOME', label: 'Domicilio' },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Ubicación</h3>
        <MdLocationOn className="w-4 h-4 text-slate-400" />
      </div>

      <div className="flex flex-wrap gap-2">
        {locations.map((location) => (
          <button
            key={location.id}
            onClick={() => onLocationChange(location.id as LocationType)}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
              selectedLocation === location.id
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {location.label}
          </button>
        ))}
      </div>
    </div>
  );
};
