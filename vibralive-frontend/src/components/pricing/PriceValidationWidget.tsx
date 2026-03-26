'use client';

import React, { useState } from 'react';
import { pricingApi, ValidationResult } from '@/api/pricing-api';

interface PriceValidationWidgetProps {
  appointmentId: string;
  onValidationComplete?: (result: ValidationResult) => void;
}

export const PriceValidationWidget: React.FC<PriceValidationWidgetProps> = ({
  appointmentId,
  onValidationComplete,
}) => {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePrices = async () => {
    try {
      setLoading(true);
      setError(null);

      const validationResult = await pricingApi.validateAppointmentPricing(appointmentId);
      setResult(validationResult);
      onValidationComplete?.(validationResult);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to validate pricing';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!result) {
    return (
      <button
        onClick={validatePrices}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
      >
        {loading ? 'Validando precios...' : 'Verificar Cambios de Precio'}
      </button>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">Error: {error}</p>
      </div>
    );
  }

  if (result.isValid) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-700 font-medium">✓ Los precios siguen siendo válidos</p>
      </div>
    );
  }

  // Show price changes
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h3 className="font-semibold text-yellow-900 mb-3">⚠ Cambios de Precio Detectados</h3>
      <div className="space-y-2">
        {result.changedServices.map((service, idx) => (
          <div key={idx} className="text-sm text-yellow-800 p-2 bg-yellow-100 rounded">
            <p className="font-medium">Servicio {idx + 1}</p>
            <p>Precio original: {pricingApi.formatPrice(service.originalPrice)}</p>
            <p>Precio actual: {pricingApi.formatPrice(service.currentPrice)}</p>
            <p className="font-semibold text-yellow-900">
              Diferencia: {pricingApi.formatPrice(
                service.currentPrice - service.originalPrice
              )}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-yellow-700 mt-3">
        Los precios han cambiado desde que se realizó la reserva. 
        Requiere confirmación del cliente.
      </p>
    </div>
  );
};

export default PriceValidationWidget;
