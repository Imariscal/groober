'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';
import { useClinicConfiguration } from '@/hooks/useClinicConfiguration';

export interface MapComponentRef {
  searchByAddress: (address: string) => Promise<void>;
  setPosition: (lat: number, lng: number) => void;
  getCurrentPosition: () => { lat: number; lng: number } | null;
}

interface GoogleMapComponentProps {
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

// Default center: Ciudad de México
const DEFAULT_LAT = 19.4326;
const DEFAULT_LNG = -99.1332;

const mapContainerStyle = {
  width: '100%',
  height: '288px', // h-72 equivalent
  borderRadius: '0.5rem',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
};

export default function GoogleMapComponent({
  onCoordinatesSelected,
  onAddressSelected,
  initialLat,
  initialLng,
  searchAddress,
  onMapReady,
}: GoogleMapComponentProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const { config } = useClinicConfiguration();
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchAddress || '');
  const [searching, setSearching] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [lastSync, setLastSync] = useState<'form' | 'map' | null>(null);
  
  const initialSearchDone = useRef(false);
  const mapReadyCalled = useRef(false);

  // Calculate initial center
  const getInitialCenter = useCallback(() => {
    let lat = DEFAULT_LAT;
    let lng = DEFAULT_LNG;

    // Priority: initialLat/Lng > config.baseLat/Lng > defaults
    if (initialLat !== undefined && typeof initialLat === 'number' && isFinite(initialLat)) {
      lat = initialLat;
    } else if (config?.baseLat !== undefined && config.baseLat !== null) {
      const parsed = typeof config.baseLat === 'string' ? parseFloat(config.baseLat) : config.baseLat;
      if (typeof parsed === 'number' && isFinite(parsed)) {
        lat = parsed;
      }
    }

    if (initialLng !== undefined && typeof initialLng === 'number' && isFinite(initialLng)) {
      lng = initialLng;
    } else if (config?.baseLng !== undefined && config.baseLng !== null) {
      const parsed = typeof config.baseLng === 'string' ? parseFloat(config.baseLng) : config.baseLng;
      if (typeof parsed === 'number' && isFinite(parsed)) {
        lng = parsed;
      }
    }

    return { lat, lng };
  }, [initialLat, initialLng, config?.baseLat, config?.baseLng]);

  const [center, setCenter] = useState(getInitialCenter);

  // Update center when config coordinates change
  useEffect(() => {
    const newCenter = getInitialCenter();
    setCenter(newCenter);
  }, [config?.baseLat, config?.baseLng, initialLat, initialLng, getInitialCenter]);

  // Initialize geocoder when loaded
  useEffect(() => {
    if (isLoaded && !geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
    }
  }, [isLoaded]);

  // Reverse geocoding to get address from coordinates
  const getReverseGeocode = useCallback(async (lat: number, lng: number, updateForm = true) => {
    if (!geocoderRef.current) return;

    try {
      const response = await geocoderRef.current.geocode({
        location: { lat, lng },
      });

      if (response.results && response.results[0] && onAddressSelected && updateForm) {
        const result = response.results[0];
        const components = result.address_components;
        
        const getComponent = (types: string[]) => {
          const comp = components.find(c => types.some(t => c.types.includes(t)));
          return comp?.long_name || '';
        };

        onAddressSelected({
          street: getComponent(['route', 'street_address']),
          number_ext: getComponent(['street_number']),
          neighborhood: getComponent(['neighborhood', 'sublocality', 'sublocality_level_1']),
          city: getComponent(['locality', 'administrative_area_level_2']),
          state: getComponent(['administrative_area_level_1']),
          zip_code: getComponent(['postal_code']),
          lat,
          lng,
        });
        setLastSync('map');
      }

      onCoordinatesSelected(lat, lng);
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      onCoordinatesSelected(lat, lng);
    }
  }, [onAddressSelected, onCoordinatesSelected]);

  // Search by address
  const searchByAddress = useCallback(async (address: string) => {
    if (!address.trim() || !geocoderRef.current) return;

    setSearching(true);
    setSearchQuery(address);

    try {
      const response = await geocoderRef.current.geocode({
        address: address,
        region: 'MX',
      });

      if (response.results && response.results[0]) {
        const location = response.results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();

        setMarkerPosition({ lat, lng });
        setCenter({ lat, lng });
        
        if (mapRef.current) {
          mapRef.current.setZoom(16);
          mapRef.current.panTo({ lat, lng });
        }

        await getReverseGeocode(lat, lng);
        setLastSync('form');
      }
    } catch (error) {
      console.error('Error searching address:', error);
    } finally {
      setSearching(false);
    }
  }, [getReverseGeocode]);

  // Set position directly
  const setPosition = useCallback((lat: number, lng: number) => {
    setMarkerPosition({ lat, lng });
    setCenter({ lat, lng });
    if (mapRef.current) {
      mapRef.current.setZoom(16);
      mapRef.current.panTo({ lat, lng });
    }
  }, []);

  // Get current position
  const getCurrentPosition = useCallback(() => {
    return markerPosition;
  }, [markerPosition]);

  // Notify parent when map methods are ready
  useEffect(() => {
    if (isLoaded && onMapReady && !mapReadyCalled.current) {
      mapReadyCalled.current = true;
      onMapReady({
        searchByAddress,
        setPosition,
        getCurrentPosition,
      });
    }
  }, [isLoaded, onMapReady, searchByAddress, setPosition, getCurrentPosition]);

  // Set initial marker position
  useEffect(() => {
    if (isLoaded && !markerPosition) {
      const initial = getInitialCenter();
      setMarkerPosition(initial);
    }
  }, [isLoaded, markerPosition, getInitialCenter]);

  // Update marker when initialLat/Lng change
  useEffect(() => {
    if (!isLoaded || !initialLat || !initialLng) return;

    const current = markerPosition;
    if (
      current &&
      (Math.abs(current.lat - initialLat) > 0.0001 ||
        Math.abs(current.lng - initialLng) > 0.0001)
    ) {
      setMarkerPosition({ lat: initialLat, lng: initialLng });
      setCenter({ lat: initialLat, lng: initialLng });
    }
  }, [isLoaded, initialLat, initialLng, markerPosition]);

  // Initial search if searchAddress provided
  useEffect(() => {
    if (isLoaded && searchAddress && searchAddress.trim() && !initialSearchDone.current) {
      initialSearchDone.current = true;
      searchByAddress(searchAddress);
    }
  }, [isLoaded, searchAddress, searchByAddress]);

  // Handle map click
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      getReverseGeocode(lat, lng);
    }
  }, [getReverseGeocode]);

  // Handle marker drag end
  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      getReverseGeocode(lat, lng);
    }
  }, [getReverseGeocode]);

  // Handle search
  const handleSearch = async () => {
    await searchByAddress(searchQuery);
  };

  // Get current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMarkerPosition({ lat: latitude, lng: longitude });
        setCenter({ lat: latitude, lng: longitude });
        
        if (mapRef.current) {
          mapRef.current.setZoom(17);
          mapRef.current.panTo({ lat: latitude, lng: longitude });
        }

        await getReverseGeocode(latitude, longitude);
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('No se pudo obtener tu ubicación. Verifica los permisos.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Map load handler
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  if (loadError) {
    return (
      <div className="w-full h-72 bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center">
        <p className="text-red-600">Error cargando Google Maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-72 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-500 gap-2">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Cargando mapa...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3">
      {/* Search box */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Ej: Av. Constitución 500, Centro, Monterrey, NL"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
        >
          {searching ? '⏳' : '🔍'}
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <button
          onClick={handleGetCurrentLocation}
          disabled={gettingLocation}
          className="flex-1 px-3 py-2 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 text-sm rounded-lg hover:bg-emerald-100 hover:border-emerald-300 transition disabled:opacity-50 font-medium flex items-center justify-center gap-1"
        >
          {gettingLocation ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              Obteniendo...
            </>
          ) : (
            <>📍 Mi ubicación</>
          )}
        </button>
      </div>

      {/* Map container */}
      <div className="rounded-lg border-2 border-gray-300 shadow-inner overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={15}
          options={mapOptions}
          onLoad={onMapLoad}
          onClick={handleMapClick}
        >
          {markerPosition && (
            <Marker
              position={markerPosition}
              draggable={true}
              onDragEnd={handleMarkerDragEnd}
            />
          )}
        </GoogleMap>
      </div>

      {/* Status indicator */}
      {lastSync && (
        <div className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
          lastSync === 'map' 
            ? 'bg-blue-50 text-blue-600' 
            : 'bg-green-50 text-green-600'
        }`}>
          {lastSync === 'map' 
            ? '↑ Datos del mapa enviados al formulario' 
            : '↓ Dirección del formulario localizada'}
        </div>
      )}

      {/* Help text */}
      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-200">
        <p className="font-medium mb-1">💡 Cómo usar:</p>
        <ul className="list-disc list-inside space-y-0.5 text-gray-500">
          <li><strong>Click en el mapa</strong> o <strong>arrastra el marcador</strong> para seleccionar ubicación</li>
          <li><strong>Busca</strong> una dirección para localizarla</li>
          <li><strong>Mi ubicación</strong> usa GPS para encontrarte</li>
        </ul>
      </div>
    </div>
  );
}
