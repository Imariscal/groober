# Frontend Pricing Integration Guide

## Overview

The frontend pricing system provides real-time price calculation and tracking for appointments. Three components work together:

1. **pricingApi.ts** - API wrapper for pricing endpoints
2. **PricingBreakdown.tsx** - Component to display price breakdown with live calculation
3. **PriceValidationWidget.tsx** - Component to validate pricing changes

## API Wrapper (pricingApi)

### Installation

```typescript
import { pricingApi } from '@/api/pricing-api';
```

### Methods

#### 1. Calculate Pricing (Preview)

```typescript
const result = await pricingApi.calculatePricing({
  clinicId: 'clinic-uuid',
  priceListId: 'pricelist-uuid', // optional
  serviceIds: ['service1', 'service2'],
  quantities: [1, 2] // optional, defaults to 1 each
});

// Result:
{
  items: [
    {
      serviceId: 'uuid',
      serviceName: 'Baño',
      priceAtBooking: 150.00,
      quantity: 1,
      subtotal: 150.00
    }
  ],
  totalAmount: 150.00,
  priceLockAt: new Date(),
  priceListId: 'uuid'
}
```

#### 2. Create Appointment with Pricing

```typescript
const appointment = await pricingApi.createAppointmentWithPricing({
  clinicId: 'clinic-uuid',
  clientId: 'client-uuid',
  petId: 'pet-uuid',
  scheduledAt: '2025-03-05T10:00:00Z',
  durationMinutes: 30,
  reason: 'Annual checkup',
  serviceIds: ['service1', 'service2'],
  quantities: [1, 2],
  customPriceListId: 'optional-uuid' // override price list
});

// Returns full AppointmentPricing with appointmentId
```

#### 3. Get Appointment Pricing

```typescript
const pricing = await pricingApi.getAppointmentPricing('appointment-uuid');
```

#### 4. Validate Pricing

```typescript
const validation = await pricingApi.validateAppointmentPricing('appointment-uuid');

// Result if prices have NOT changed:
{
  isValid: true,
  changedServices: []
}

// Result if prices HAVE changed:
{
  isValid: false,
  changedServices: [
    {
      serviceId: 'uuid',
      originalPrice: 150.00,
      currentPrice: 175.00 // Price increased
    }
  ]
}
```

#### 5. Helper Methods

```typescript
// Format price to local currency (COP by default)
const formatted = pricingApi.formatPrice(150.00); // "₩150,00"
const formatted = pricingApi.formatPrice(150.00, 'USD'); // "$150.00"

// Calculate subtotal
const subtotal = pricingApi.calculateSubtotal(100, 2); // 200
```

## Component Integration

### PricingBreakdown Component

Display pricing calculation while creating an appointment.

**Usage in Appointment Form:**

```typescript
import PricingBreakdown from '@/components/pricing/PricingBreakdown';

export function CreateAppointmentForm() {
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<number[]>([]);
  const [selectedPricing, setSelectedPricing] = useState(null);

  return (
    <form className="space-y-6">
      {/* Service Selection */}
      <ServiceSelector 
        onServicesChange={setSelectedServiceIds}
        onQuantitiesChange={setQuantities}
      />

      {/* PRICING BREAKDOWN */}
      <PricingBreakdown
        clinicId={clinicId}
        serviceIds={selectedServiceIds}
        quantities={quantities}
        priceListId={client?.priceListId} // Use client's price list if assigned
        onPricingCalculated={setSelectedPricing}
        showDetails={true}
      />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!selectedPricing}
        className="btn btn-primary w-full"
      >
        Confirmar Cita - {selectedPricing && pricingApi.formatPrice(selectedPricing.totalAmount)}
      </button>
    </form>
  );
}
```

**Props:**

```typescript
interface PricingBreakdownProps {
  clinicId: string;                    // Required: clinic UUID
  serviceIds: string[];                // Required: selected service UUIDs
  quantities?: number[];               // Optional: qty per service (default: 1)
  priceListId?: string;                // Optional: override price list
  onPricingCalculated?: (pricing) => void; // Callback when pricing calculated
  showDetails?: boolean;               // Show item breakdown (default: true)
}
```

### PriceValidationWidget Component

Display a button to validate if prices have changed since booking.

**Usage in Appointment Details:**

```typescript
import PriceValidationWidget from '@/components/pricing/PriceValidationWidget';

export function AppointmentDetailsView({ appointmentId }) {
  const handleValidationComplete = (result) => {
    if (!result.isValid) {
      // Notify admin/client about price changes
      console.warn('Prices have changed:', result.changedServices);
    }
  };

  return (
    <div className="space-y-6">
      {/* Appointment Details */}
      <AppointmentCard appointmentId={appointmentId} />

      {/* Price Validation Widget */}
      <PriceValidationWidget
        appointmentId={appointmentId}
        onValidationComplete={handleValidationComplete}
      />
    </div>
  );
}
```

**Props:**

```typescript
interface PriceValidationWidgetProps {
  appointmentId: string;                          // Required: appointment UUID
  onValidationComplete?: (result) => void;       // Callback when validation done
}
```

## Full Appointment Creation Flow

Here's a complete example integrating pricing into appointment creation:

```typescript
'use client';

import { useState } from 'react';
import { pricingApi } from '@/api/pricing-api';
import PricingBreakdown from '@/components/pricing/PricingBreakdown';
import { useAppointmentStore } from '@/stores/appointment.store';
import { useClinicStore } from '@/stores/clinic.store';

export function CreateAppointmentPage() {
  const clinic = useClinicStore(s => s.selectedClinic);
  const { createAppointment } = useAppointmentStore();

  const [formState, setFormState] = useState({
    clientId: '',
    petId: '',
    scheduledAt: '',
    reason: '',
    selectedServiceIds: [],
    quantities: [],
  });

  const [selectedPricing, setSelectedPricing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPricing) {
      setError('Por favor selecciona servicios');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Use the pricing service to create appointment with frozen prices
      const response = await pricingApi.createAppointmentWithPricing({
        clinicId: clinic!.id,
        clientId: formState.clientId,
        petId: formState.petId,
        scheduledAt: formState.scheduledAt,
        reason: formState.reason,
        serviceIds: formState.selectedServiceIds,
        quantities: formState.quantities,
        // Optionally override price list for this appointment
        // customPriceListId: 'override-uuid'
      });

      // Update store and navigate
      await createAppointment(response);
      
      // Navigate to appointment details or success page
      // router.push(`/appointments/${response.appointmentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Nueva Cita</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Cliente</label>
          <select
            value={formState.clientId}
            onChange={(e) => setFormState(s => ({ ...s, clientId: e.target.value }))}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Selecciona un cliente</option>
            {/* Options */}
          </select>
        </div>

        {/* Pet Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Mascota</label>
          <select
            value={formState.petId}
            onChange={(e) => setFormState(s => ({ ...s, petId: e.target.value }))}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Selecciona una mascota</option>
            {/* Options */}
          </select>
        </div>

        {/* Date/Time */}
        <div>
          <label className="block text-sm font-medium mb-2">Fecha y Hora</label>
          <input
            type="datetime-local"
            value={formState.scheduledAt}
            onChange={(e) => setFormState(s => ({ ...s, scheduledAt: e.target.value }))}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Service Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Servicios</label>
          <ServiceMultiSelect
            selectedIds={formState.selectedServiceIds}
            quantities={formState.quantities}
            onChange={(ids, qtys) => 
              setFormState(s => ({ 
                ...s,
                selectedServiceIds: ids,
                quantities: qtys 
              }))
            }
          />
        </div>

        {/* PRICING BREAKDOWN COMPONENT */}
        <PricingBreakdown
          clinicId={clinic!.id}
          serviceIds={formState.selectedServiceIds}
          quantities={formState.quantities}
          onPricingCalculated={setSelectedPricing}
          showDetails={true}
        />

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!selectedPricing || isSubmitting}
          className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Creando cita...' : 'Confirmar Cita'}
        </button>
      </form>
    </div>
  );
}
```

## Store Integration

Update your appointment store to handle the new pricing-aware creation:

```typescript
// stores/appointment.store.ts

interface AppointmentStore {
  appointments: Appointment[];
  
  // New: Create appointment with pricing
  createAppointmentWithPricing: (pricing: AppointmentPricing) => Promise<void>;
  
  // Existing: Get appointment
  getAppointment: (id: string) => Appointment | undefined;
  
  // New: Validate appointment pricing
  validateAppointmentPricing: (id: string) => Promise<boolean>;
}

export const useAppointmentStore = create<AppointmentStore>((set, get) => ({
  appointments: [],
  
  createAppointmentWithPricing: async (pricing) => {
    set(state => ({
      appointments: [...state.appointments, {
        id: pricing.appointmentId,
        totalAmount: pricing.totalAmount,
        priceLockAt: pricing.priceLockAt,
        priceListId: pricing.priceListId,
        items: pricing.items,
        // ... other appointment fields
      }]
    }));
  },
  
  validateAppointmentPricing: async (appointmentId) => {
    const validation = await pricingApi.validateAppointmentPricing(appointmentId);
    return validation.isValid;
  },
}));
```

## Error Handling

The API wrapper throws descriptive errors that can be caught and displayed:

```typescript
try {
  const pricing = await pricingApi.calculatePricing({...});
} catch (error) {
  // error.message contains user-friendly error text
  const message = error instanceof Error ? error.message : 'Unknown error';
  
  if (message.includes('No active price list')) {
    // Handle missing price list
  } else if (message.includes('Service price not found')) {
    // Handle missing service pricing
  }
  // ... etc
}
```

## Styling & UX Best Practices

1. **Show Pricing During Selection**: Update prices in real-time as services are selected
2. **Highlight Total**: Make the total amount prominent and clear
3. **Lock Badge**: Show when prices were locked/frozen
4. **Price Changes Warning**: Alert users if prices change after booking
5. **Quantity Controls**: Let users adjust service quantities and see instant price updates

## Testing

```bash
# Test pricing calculation
curl -X POST http://localhost:3000/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "clinicId": "clinic-1",
    "priceListId": "list-1", 
    "serviceIds": ["service-1"],
    "quantities": [1]
  }'

# Create appointment with pricing
curl -X POST http://localhost:3000/pricing/appointments/create-with-pricing \
  -H "Content-Type: application/json" \
  -d '{
    "clinicId": "clinic-1",
    "clientId": "client-1",
    "petId": "pet-1",
    "scheduledAt": "2025-03-05T10:00:00Z",
    "serviceIds": ["service-1"]
  }'
```

---

**Status**: ✅ Ready for frontend integration
