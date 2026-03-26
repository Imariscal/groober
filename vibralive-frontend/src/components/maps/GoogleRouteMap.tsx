'use client';

import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';
import { Appointment, Stylist } from '@/types';
import { format } from 'date-fns';

interface StylistRoute {
  stylist: Stylist;
  appointments: Appointment[];
  totalDistance: number;
  totalTravelTime: number;
}

interface GoogleRouteMapProps {
  appointments: Appointment[];
  stylists: Stylist[];
  selectedAppointment?: Appointment | null;
  onAppointmentSelect?: (appointment: Appointment) => void;
  routes?: StylistRoute[];
  baseLat?: number | null;
  baseLng?: number | null;
}

// Default center: Ciudad de México (fallback if no base location)
const DEFAULT_CENTER = { lat: 19.4326, lng: -99.1332 };
const DEFAULT_ZOOM = 12;

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

export default function GoogleRouteMap({
  appointments,
  stylists,
  selectedAppointment,
  onAppointmentSelect,
  routes = [],
  baseLat,
  baseLng,
}: GoogleRouteMapProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [activeInfoWindow, setActiveInfoWindow] = useState<string | null>(null);

  // Determine initial center from props or default
  const initialCenter = useMemo(() => {
    if (baseLat && baseLng) {
      return { lat: Number(baseLat), lng: Number(baseLng) };
    }
    return DEFAULT_CENTER;
  }, [baseLat, baseLng]);

  // Get color for appointment marker
  const getMarkerColor = useCallback((appointment: Appointment): string => {
    if (appointment.assigned_staff_user_id) {
      const stylist = stylists.find(s => s.userId === appointment.assigned_staff_user_id);
      return stylist?.calendarColor || '#22c55e';
    }
    return '#f59e0b';
  }, [stylists]);

  // Valid appointments with coordinates
  const validAppointments = useMemo(() => 
    appointments.filter(apt => apt.address?.lat && apt.address?.lng),
    [appointments]
  );

  // Group appointments by stylist
  const stylistAppointments = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    
    validAppointments.forEach(apt => {
      const stylistId = apt.assigned_staff_user_id || 'unassigned';
      if (!grouped[stylistId]) {
        grouped[stylistId] = [];
      }
      grouped[stylistId].push(apt);
    });

    return grouped;
  }, [validAppointments]);

  // Get route number for appointment
  const getRouteNumber = useCallback((apt: Appointment): number | undefined => {
    if (!apt.assigned_staff_user_id) return undefined;
    
    const stylistApts = stylistAppointments[apt.assigned_staff_user_id] || [];
    const sortedApts = [...stylistApts].sort(
      (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );
    return sortedApts.findIndex(a => a.id === apt.id) + 1;
  }, [stylistAppointments]);

  // Create SVG marker icon
  const createMarkerIcon = useCallback((color: string, number?: number, isSelected: boolean = false): google.maps.Icon | google.maps.Symbol => {
    const size = isSelected ? 40 : 32;
    
    if (number) {
      // Numbered marker SVG
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" stroke="white" stroke-width="2"/>
          <text x="50%" y="50%" text-anchor="middle" dy=".35em" fill="white" font-weight="bold" font-size="${size * 0.4}">${number}</text>
        </svg>
      `;
      return {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new google.maps.Size(size, size),
        anchor: new google.maps.Point(size / 2, size / 2),
      };
    }

    // Simple colored dot
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" stroke="white" stroke-width="2"/>
      </svg>
    `;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new google.maps.Size(size, size),
      anchor: new google.maps.Point(size / 2, size / 2),
    };
  }, []);

  // Create home icon
  const homeIcon = useMemo(() => {
    if (!isLoaded) return undefined;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="url(#grad)" stroke="white" stroke-width="3"/>
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3b82f6"/>
            <stop offset="100%" style="stop-color:#1d4ed8"/>
          </linearGradient>
        </defs>
        <text x="50%" y="50%" text-anchor="middle" dy=".35em" font-size="16">🏠</text>
      </svg>
    `;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new google.maps.Size(40, 40),
      anchor: new google.maps.Point(20, 20),
    };
  }, [isLoaded]);

  // Calculate route polylines
  // Calculate route polylines
  const routePolylines = useMemo(() => {
    const lines: Array<{
      path: Array<{ lat: number; lng: number }>;
      color: string;
    }> = [];

    // If routes have been explicitly optimized, use those
    if (routes && routes.length > 0) {
      routes.forEach((route) => {
        const sortedApts = [...route.appointments].sort(
          (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        );

        const path = sortedApts
          .filter(apt => apt.address?.lat && apt.address?.lng)
          .map(apt => ({ lat: Number(apt.address!.lat!), lng: Number(apt.address!.lng!) }));

        if (path.length >= 2) {
          const color = route.stylist?.calendarColor || '#6366f1';
          lines.push({ path, color });
        }
      });
    } else {
      // If no explicit routes, calculate from assignments
      Object.entries(stylistAppointments).forEach(([stylistId, apts]) => {
        if (stylistId === 'unassigned' || apts.length < 2) return;

        const stylist = stylists.find(s => s.userId === stylistId);
        const color = stylist?.calendarColor || '#6366f1';

        const sortedApts = [...apts].sort(
          (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        );

        const path = sortedApts
          .filter(apt => apt.address?.lat && apt.address?.lng)
          .map(apt => ({ lat: Number(apt.address!.lat!), lng: Number(apt.address!.lng!) }));

        if (path.length >= 2) {
          lines.push({ path, color });
        }
      });
    }

    return lines;
  }, [routes, stylistAppointments, stylists]);

  // Fit bounds when appointments change
  useEffect(() => {
    if (!mapRef.current || validAppointments.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    
    validAppointments.forEach(apt => {
      if (apt.address?.lat && apt.address?.lng) {
        bounds.extend({ lat: Number(apt.address.lat), lng: Number(apt.address.lng) });
      }
    });

    if (baseLat && baseLng) {
      bounds.extend({ lat: Number(baseLat), lng: Number(baseLng) });
    }

    mapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    
    // Prevent too much zoom
    const listener = google.maps.event.addListener(mapRef.current, 'idle', () => {
      if (mapRef.current && mapRef.current.getZoom()! > 14) {
        mapRef.current.setZoom(14);
      }
      google.maps.event.removeListener(listener);
    });
  }, [validAppointments, baseLat, baseLng]);

  // Center on selected appointment
  useEffect(() => {
    if (!mapRef.current || !selectedAppointment?.address?.lat || !selectedAppointment?.address?.lng) return;

    mapRef.current.panTo({
      lat: Number(selectedAppointment.address.lat),
      lng: Number(selectedAppointment.address.lng),
    });
    mapRef.current.setZoom(15);
    setActiveInfoWindow(selectedAppointment.id);
  }, [selectedAppointment]);

  // Map load handler
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  if (loadError) {
    return (
      <div className="w-full h-full bg-red-50 flex items-center justify-center">
        <p className="text-red-600">Error cargando Google Maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center text-slate-500 gap-2">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Cargando mapa...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={initialCenter}
        zoom={DEFAULT_ZOOM}
        options={mapOptions}
        onLoad={onMapLoad}
      >
        {/* Base location marker */}
        {baseLat && baseLng && homeIcon && (
          <Marker
            position={{ lat: Number(baseLat), lng: Number(baseLng) }}
            icon={homeIcon}
            zIndex={1000}
            title="Ubicación Base - Punto de partida"
          />
        )}

        {/* Route polylines */}
        {routePolylines.map((line, idx) => (
          <Polyline
            key={`route-${idx}`}
            path={line.path}
            options={{
              strokeColor: line.color,
              strokeWeight: 3,
              strokeOpacity: 0.7,
              icons: [{
                icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3 },
                offset: '50%',
              }],
            }}
          />
        ))}

        {/* Appointment markers */}
        {validAppointments.map((apt) => {
          const isSelected = selectedAppointment?.id === apt.id;
          const color = getMarkerColor(apt);
          const routeNumber = getRouteNumber(apt);

          return (
            <React.Fragment key={apt.id}>
              <Marker
                position={{ lat: Number(apt.address!.lat!), lng: Number(apt.address!.lng!) }}
                icon={createMarkerIcon(color, routeNumber, isSelected)}
                onClick={() => {
                  setActiveInfoWindow(apt.id);
                  if (onAppointmentSelect) {
                    onAppointmentSelect(apt);
                  }
                }}
                zIndex={isSelected ? 999 : routeNumber ? 100 + routeNumber : 50}
              />
              
              {activeInfoWindow === apt.id && (
                <InfoWindow
                  position={{ lat: Number(apt.address!.lat!), lng: Number(apt.address!.lng!) }}
                  onCloseClick={() => setActiveInfoWindow(null)}
                >
                  <div style={{ minWidth: '200px', padding: '4px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                      🐾 {apt.pet?.name || 'Mascota'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      <strong>⏰ Hora:</strong> {format(new Date(apt.scheduled_at), 'HH:mm')}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      <strong>👤 Cliente:</strong> {apt.client?.name || 'N/A'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      <strong>📍 Dirección:</strong><br />
                      {apt.address?.street} {apt.address?.number_ext || ''}<br />
                      {apt.address?.neighborhood || ''}
                    </div>
                    {apt.assigned_staff_user_id ? (
                      <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '8px' }}>
                        ✅ Estilista asignado
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '8px' }}>
                        ⚠️ Sin estilista asignado
                      </div>
                    )}
                  </div>
                </InfoWindow>
              )}
            </React.Fragment>
          );
        })}
      </GoogleMap>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-slate-200 p-3 z-10">
        <p className="text-xs font-semibold text-slate-700 mb-2">Leyenda</p>
        <div className="space-y-1.5">
          {baseLat && baseLng && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[8px]">🏠</div>
              <span className="text-xs text-slate-600">Punto base</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs text-slate-600">Sin asignar</span>
          </div>
          {/* Show each stylist with their color */}
          {stylists.filter(s => stylistAppointments[s.userId]?.length > 0).map(stylist => (
            <div key={stylist.id} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: stylist.calendarColor || '#6366f1' }}
              />
              <span className="text-xs text-slate-600">{stylist.displayName || stylist.user?.name || 'Estilista'}</span>
            </div>
          ))}
          {routePolylines.length > 0 && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 mt-1">
              <div className="w-4 h-0.5 bg-slate-500" />
              <span className="text-xs text-slate-600">Ruta</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-slate-200 p-3 z-10">
        <p className="text-xs font-semibold text-slate-700 mb-1">En mapa</p>
        <p className="text-lg font-bold text-slate-900">
          {validAppointments.length}
          <span className="text-xs font-normal text-slate-500 ml-1">citas</span>
        </p>
        {appointments.length > validAppointments.length && (
          <p className="text-xs text-amber-600">
            {appointments.length - validAppointments.length} sin coordenadas
          </p>
        )}
      </div>
    </div>
  );
}
