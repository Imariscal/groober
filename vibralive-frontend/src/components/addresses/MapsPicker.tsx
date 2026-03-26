'use client';

import { forwardRef, useRef, useImperativeHandle, useState, ComponentType } from 'react';
import dynamic from 'next/dynamic';

// Re-export the ref type
export interface MapComponentRef {
  searchByAddress: (address: string) => Promise<void>;
  setPosition: (lat: number, lng: number) => void;
  getCurrentPosition: () => { lat: number; lng: number } | null;
}

interface MapComponentProps {
  onCoordinatesSelected: (lat: number, lng: number) => void;
  onAddressSelected?: (address: {
    street: string;
    number_ext: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    lat: number;
    lng: number;
  }) => void;
  initialLat?: number;
  initialLng?: number;
  searchAddress?: string;
  onMapReady?: (ref: MapComponentRef) => void;
}

interface MapsPickerProps {
  onCoordinatesSelected: (lat: number, lng: number) => void;
  onAddressSelected?: (address: {
    street: string;
    number_ext: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    lat: number;
    lng: number;
  }) => void;
  initialLat?: number;
  initialLng?: number;
  searchAddress?: string;
}

// Loading component
const MapLoading = () => (
  <div className="w-full h-72 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-500 gap-2">
    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
    <span className="text-sm font-medium">Cargando mapa...</span>
  </div>
);

// Dynamic import for Google Maps
const GoogleMapComponent = dynamic<MapComponentProps>(
  () => import('../maps/GoogleMapComponent') as Promise<{ default: ComponentType<MapComponentProps> }>,
  { ssr: false, loading: MapLoading }
);

export const MapsPicker = forwardRef<MapComponentRef, MapsPickerProps>(({
  onCoordinatesSelected,
  onAddressSelected,
  initialLat,
  initialLng,
  searchAddress,
}, ref) => {
  const mapsEnabled = process.env.NEXT_PUBLIC_MAPS_ENABLED === 'true';
  
  // Internal ref to hold the map component ref once loaded
  const internalRef = useRef<MapComponentRef | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Expose methods via ref - these will work once MapComponent is loaded
  useImperativeHandle(ref, () => ({
    searchByAddress: async (address: string) => {
      if (internalRef.current) {
        await internalRef.current.searchByAddress(address);
      }
    },
    setPosition: (lat: number, lng: number) => {
      if (internalRef.current) {
        internalRef.current.setPosition(lat, lng);
      }
    },
    getCurrentPosition: () => {
      if (internalRef.current) {
        return internalRef.current.getCurrentPosition();
      }
      return null;
    },
  }), [isLoaded]);

  if (!mapsEnabled) {
    return (
      <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg text-sm text-blue-700">
        <p className="font-medium mb-1">🗺️ Mapas deshabilitado</p>
        <p className="text-blue-600">Ingrese coordenadas manualmente o complete la dirección.</p>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
      <GoogleMapComponent
        onCoordinatesSelected={onCoordinatesSelected}
        onAddressSelected={onAddressSelected}
        initialLat={initialLat}
        initialLng={initialLng}
        searchAddress={searchAddress}
        onMapReady={(mapRef: MapComponentRef) => {
          internalRef.current = mapRef;
          setIsLoaded(true);
        }}
      />
    </div>
  );
});

MapsPicker.displayName = 'MapsPicker';
