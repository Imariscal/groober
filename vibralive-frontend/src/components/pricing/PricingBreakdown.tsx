'use client';

import React, { useState, useEffect } from 'react';
import { pricingApi, AppointmentPricing } from '@/api/pricing-api';
import { useClinicStore } from '@/stores/clinic.store';
import { useAppointmentStore } from '@/stores/appointment.store';
import { parseISO, format } from 'date-fns';

interface PricingBreakdownProps {
  clinicId: string;
  serviceIds: string[];
  quantities?: number[];
  priceListId?: string;
  onPricingCalculated?: (pricing: AppointmentPricing) => void;
  showDetails?: boolean;
}

export const PricingBreakdown: React.FC<PricingBreakdownProps> = ({
  clinicId,
  serviceIds,
  quantities = [],
  priceListId,
  onPricingCalculated,
  showDetails = true,
}) => {
  const [pricing, setPricing] = useState<AppointmentPricing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceIds || serviceIds.length === 0) {
      setPricing(null);
      return;
    }

    const calculatePricing = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await pricingApi.calculatePricing({
          clinicId,
          priceListId,
          serviceIds,
          quantities: quantities.length > 0 ? quantities : undefined,
        });

        // Create a full pricing object with appointmentId placeholder
        const fullPricing: AppointmentPricing = {
          appointmentId: 'PREVIEW', // This will be set when appointment is created
          ...result,
        };

        setPricing(fullPricing);
        onPricingCalculated?.(fullPricing);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to calculate pricing';
        setError(message);
        setPricing(null);
      } finally {
        setLoading(false);
      }
    };

    calculatePricing();
  }, [clinicId, serviceIds.join(','), quantities.join(','), priceListId]);

  if (!pricing && !loading && !error) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-500">Selecciona servicios para ver los precios</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-600">Calculando precios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <p className="text-sm text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!pricing) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Pricing Items Breakdown */}
      {showDetails && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Desglose de Precios</h3>
          <div className="space-y-2">
            {pricing.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.serviceName}</p>
                  <p className="text-gray-500">
                    {pricingApi.formatPrice(item.priceAtBooking)} x {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {pricingApi.formatPrice(item.subtotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="my-3 border-t border-gray-200"></div>

          {/* Total Amount */}
          <div className="flex justify-between items-center">
            <p className="font-semibold text-gray-900">Total</p>
            <p className="text-lg font-bold text-green-600">
              {pricingApi.formatPrice(pricing.totalAmount)}
            </p>
          </div>
        </div>
      )}

      {/* Price Lock Badge */}
      <div className="bg-amber-50 rounded-lg border border-amber-200 p-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
          <div className="text-xs text-amber-700">
            <p className="font-semibold">Precio congelado</p>
            <p className="text-amber-600">
              Estos precios se registrarán al confirmar la cita
              <br />
              {format(parseISO(pricing.priceLockAt), 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-green-50 rounded-lg border border-green-200 p-4">
        <p className="text-sm text-green-700">
          ✓ Monto total: <span className="font-bold">{pricingApi.formatPrice(pricing.totalAmount)}</span>
        </p>
      </div>
    </div>
  );
};

export default PricingBreakdown;
