'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useClinicConfiguration } from '@/hooks/useClinicConfiguration';

// Configurar iconos de Leaflet para usar CDN
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

// Default center: Ciudad de México
const DEFAULT_LAT = 19.4326;
const DEFAULT_LNG = -99.1332;

export default function MapComponent({
  onCoordinatesSelected,
  onAddressSelected,
  initialLat,
  initialLng,
  searchAddress,
  onMapReady,
}: MapComponentProps) {
  const { config } = useClinicConfiguration();
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState(searchAddress || '');
  const [searching, setSearching] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [lastSync, setLastSync] = useState<'form' | 'map' | null>(null);
  
  // Track if initial search was performed
  const initialSearchDone = useRef(false);
  const mapReadyCalled = useRef(false);

  // Función de reverse geocoding para obtener dirección desde coordenadas
  const getReverseGeocode = useCallback(async (lat: number, lng: number, updateForm = true) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.address && onAddressSelected && updateForm) {
        const addressData = data.address;
        onAddressSelected({
          street: addressData.road || addressData.street || '',
          number_ext: addressData.house_number || '',
          neighborhood: addressData.neighbourhood || addressData.suburb || addressData.hamlet || '',
          city: addressData.city || addressData.town || addressData.village || addressData.municipality || '',
          state: addressData.state || addressData.region || '',
          zip_code: addressData.postcode || '',
          lat,
          lng,
        });
        setLastSync('map');
      }
      
      // Siempre notificar coordenadas
      onCoordinatesSelected(lat, lng);
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      // Si falla reverse geocoding, al menos pasa las coordenadas
      onCoordinatesSelected(lat, lng);
    }
  }, [onAddressSelected, onCoordinatesSelected]);

  // Función para buscar por dirección
  const searchByAddress = useCallback(async (address: string) => {
    if (!address.trim()) return;

    setSearching(true);
    setSearchQuery(address);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);

        // Actualizar mapa y marcador
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([latNum, lonNum], 16);
          markerRef.current.setLatLng([latNum, lonNum]);
        }
        
        // Hacer reverse geocoding para obtener datos completos
        await getReverseGeocode(latNum, lonNum);
        setLastSync('form');
      }
    } catch (error) {
      console.error('Error searching address:', error);
    } finally {
      setSearching(false);
    }
  }, [getReverseGeocode]);

  // Función para establecer posición directamente
  const setPosition = useCallback((lat: number, lng: number) => {
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.setView([lat, lng], 16);
    }
  }, []);

  // Obtener posición actual
  const getCurrentPosition = useCallback(() => {
    if (markerRef.current) {
      const latlng = markerRef.current.getLatLng();
      return { lat: latlng.lat, lng: latlng.lng };
    }
    return null;
  }, []);

  // Notify parent when map methods are ready
  useEffect(() => {
    if (onMapReady && !mapReadyCalled.current) {
      mapReadyCalled.current = true;
      onMapReady({
        searchByAddress,
        setPosition,
        getCurrentPosition,
      });
    }
  }, [onMapReady, searchByAddress, setPosition, getCurrentPosition]);

  // Solo renderizar después de montar en cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Inicializar mapa una sola vez
  useEffect(() => {
    if (!mounted || mapRef.current || !mapContainerRef.current) return;

    try {
      // Use initialLat/Lng, then clinic base location, then default (CDMX)
      const startLat = initialLat || (config?.baseLat ? Number(config.baseLat) : DEFAULT_LAT);
      const startLng = initialLng || (config?.baseLng ? Number(config.baseLng) : DEFAULT_LNG);

      mapRef.current = L.map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: 15,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);

      // Agregar marcador draggable
      markerRef.current = L.marker([startLat, startLng], {
        draggable: true,
      }).addTo(mapRef.current);

      // Evento cuando se arrastra el marcador
      markerRef.current.on('dragend', () => {
        if (markerRef.current) {
          const latlng = markerRef.current.getLatLng();
          getReverseGeocode(latlng.lat, latlng.lng);
        }
      });

      // Evento al hacer click en el mapa
      mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        getReverseGeocode(lat, lng);
      });

      // Si hay searchAddress inicial, buscarlo
      if (searchAddress && searchAddress.trim() && !initialSearchDone.current) {
        initialSearchDone.current = true;
        searchByAddress(searchAddress);
      }
    } catch (error) {
      console.error('Error inicializando mapa:', error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // Actualizar marcador si cambian las coordenadas iniciales (desde props)
  useEffect(() => {
    if (!mounted || !mapRef.current || !markerRef.current) return;
    if (!initialLat || !initialLng) return;

    const currentLatlng = markerRef.current.getLatLng();
    
    // Solo actualizar si son significativamente diferentes
    if (
      Math.abs(currentLatlng.lat - initialLat) > 0.0001 ||
      Math.abs(currentLatlng.lng - initialLng) > 0.0001
    ) {
      markerRef.current.setLatLng([initialLat, initialLng]);
      mapRef.current.setView([initialLat, initialLng], 16);
    }
  }, [mounted, initialLat, initialLng]);

  // Manejar búsqueda manual
  const handleSearch = async () => {
    await searchByAddress(searchQuery);
  };

  // Obtener ubicación actual del usuario
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([latitude, longitude], 17);
          markerRef.current.setLatLng([latitude, longitude]);
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
      <div
        ref={mapContainerRef}
        className="w-full h-72 rounded-lg border-2 border-gray-300 shadow-inner"
      />

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
