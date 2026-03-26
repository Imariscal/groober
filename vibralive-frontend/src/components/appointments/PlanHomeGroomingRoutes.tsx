'use client';

import { useState } from 'react';
import { MdPlayArrow, MdAccessTime } from 'react-icons/md';
import { appointmentsApi } from '@/lib/appointments-api';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { getClinicDateKey } from '@/lib/datetime-tz';
import toast from 'react-hot-toast';

interface PlanHomeGroomingRoutesProps {
  onSuccess?: () => void;
}

/**
 * Component to plan home grooming routes for a specific date
 * 
 * Features:
 * - Select date to plan routes
 * - Auto-assign HOME grooming appointments to available stylists
 * - Shows assignment results
 */
export function PlanHomeGroomingRoutes({
  onSuccess,
}: PlanHomeGroomingRoutesProps) {
  const clinicTimezone = useClinicTimezone();
  const [selectedDate, setSelectedDate] = useState<string>(
    getClinicDateKey(new Date(), clinicTimezone)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handlePlanRoutes = async () => {
    if (!selectedDate) {
      toast.error('Por favor selecciona una fecha');
      return;
    }

    try {
      setIsLoading(true);
      const response = await appointmentsApi.planHomeGroomingRoutes(selectedDate);
      
      setResult(response);
      
      if (response.assignedCount > 0) {
        toast.success(
          `${response.assignedCount} citas asignadas exitosamente`
        );
      } else {
        toast.info('No hay citas para asignar en esta fecha');
      }

      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al planificar rutas';
      toast.error(message);
      console.error('Error planning routes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Planificar rutas de grooming a domicilio
      </h3>

      <p className="text-sm text-gray-600">
        Asigna automáticamente citas a domicilio sin asignar a los estilistas disponibles.
      </p>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={handlePlanRoutes}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <MdPlayArrow size={20} />
            {isLoading ? 'Planificando...' : 'Planificar'}
          </button>
        </div>
      </div>

      {result && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center gap-2 mb-3">
            <MdAccessTime className="text-blue-600" size={20} />
            <h4 className="font-semibold text-blue-900">Resultados</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-blue-700">Citas encontradas</p>
              <p className="text-2xl font-bold text-blue-900">
                {result.totalFound || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Citas asignadas</p>
              <p className="text-2xl font-bold text-green-600">
                {result.assignedCount || 0}
              </p>
            </div>
          </div>

          {result.assignments && result.assignments.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-blue-900">Asignaciones:</p>
              <ul className="text-sm text-blue-700 space-y-1">
                {result.assignments.slice(0, 5).map((assignment: any, idx: number) => (
                  <li key={idx}>
                    • {assignment.petName} → {assignment.stylistName}
                  </li>
                ))}
                {result.assignments.length > 5 && (
                  <li className="text-blue-600 font-medium">
                    + {result.assignments.length - 5} más
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
