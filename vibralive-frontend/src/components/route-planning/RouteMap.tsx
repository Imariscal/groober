'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Appointment, Stylist } from '@/types';
import { format } from 'date-fns';

// Configure Leaflet icons
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored marker
const createColoredMarker = (color: string, isSelected: boolean = false) => {
  const size = isSelected ? 14 : 10;
  const border = isSelected ? 4 : 2;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: ${border}px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ${isSelected ? 'transform: scale(1.5);' : ''}
      "></div>
    `,
    iconSize: [size + border * 2, size + border * 2],
    iconAnchor: [(size + border * 2) / 2, (size + border * 2) / 2],
  });
};

// Numbered marker for route order
const createNumberedMarker = (number: number, color: string, isSelected: boolean = false) => {
  const size = isSelected ? 32 : 24;
  
  return L.divIcon({
    className: 'custom-numbered-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${size * 0.5}px;
        ${isSelected ? 'transform: scale(1.2);' : ''}
      ">${number}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

interface StylistRoute {
  stylist: Stylist;
  appointments: Appointment[];
  totalDistance: number;
  totalTravelTime: number;
}

interface RouteMapProps {
  appointments: Appointment[];
  stylists: Stylist[];
  selectedAppointment?: Appointment | null;
  onAppointmentSelect?: (appointment: Appointment) => void;
  routes?: StylistRoute[];
  baseLat?: number | null; // Base location for initial map center
  baseLng?: number | null;
}

// Default center: Ciudad de México (fallback if no base location)
const DEFAULT_CENTER: [number, number] = [19.4326, -99.1332];
const DEFAULT_ZOOM = 12;

// Home icon for base location (defined outside component to avoid re-creation)
const createHomeIcon = () => L.divIcon({
  html: `<div style="
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
  ">🏠</div>`,
  className: 'custom-home-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export default function RouteMap({
  appointments,
  stylists,
  selectedAppointment,
  onAppointmentSelect,
  routes = [],
  baseLat,
  baseLng,
}: RouteMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylinesRef = useRef<L.Polyline[]>([]);
  const baseMarkerRef = useRef<L.Marker | null>(null);

  // Determine initial center from props or default
  const initialCenter: [number, number] = baseLat && baseLng 
    ? [Number(baseLat), Number(baseLng)] 
    : DEFAULT_CENTER;

  // Get color for appointment marker
  const getMarkerColor = (appointment: Appointment): string => {
    if (appointment.assigned_staff_user_id) {
      const stylist = stylists.find(s => s.userId === appointment.assigned_staff_user_id);
      return stylist?.calendarColor || '#22c55e'; // Green if assigned
    }
    return '#f59e0b'; // Amber if unassigned
  };

  // Valid appointments with coordinates
  const validAppointments = useMemo(() => 
    appointments.filter(apt => apt.address?.lat && apt.address?.lng),
    [appointments]
  );

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapRef.current);

    // Add base location marker if configured
    if (baseLat && baseLng) {
      baseMarkerRef.current = L.marker([Number(baseLat), Number(baseLng)], {
        icon: createHomeIcon(),
        zIndexOffset: 1000, // Always on top
      })
        .addTo(mapRef.current)
        .bindPopup('<strong>📍 Ubicación Base</strong><br/>Punto de partida');
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initialCenter, baseLat, baseLng]);

  // Update markers when appointments change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Clear existing polylines
    polylinesRef.current.forEach(line => line.remove());
    polylinesRef.current = [];

    if (validAppointments.length === 0) return;

    // Group appointments by stylist for route lines
    const stylistAppointments: Record<string, Appointment[]> = {};
    
    validAppointments.forEach(apt => {
      const stylistId = apt.assigned_staff_user_id || 'unassigned';
      if (!stylistAppointments[stylistId]) {
        stylistAppointments[stylistId] = [];
      }
      stylistAppointments[stylistId].push(apt);
    });

    // Draw route lines for each stylist
    Object.entries(stylistAppointments).forEach(([stylistId, apts]) => {
      if (stylistId === 'unassigned' || apts.length < 2) return;

      const stylist = stylists.find(s => s.userId === stylistId);
      const color = stylist?.calendarColor || '#6366f1';

      // Sort by scheduled time
      const sortedApts = [...apts].sort(
        (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      );

      const points: [number, number][] = sortedApts
        .filter(apt => apt.address?.lat && apt.address?.lng)
        .map(apt => [apt.address!.lat!, apt.address!.lng!]);

      if (points.length >= 2) {
        const polyline = L.polyline(points, {
          color,
          weight: 3,
          opacity: 0.7,
          dashArray: '10, 5',
        }).addTo(mapRef.current!);
        polylinesRef.current.push(polyline);
      }
    });

    // Add markers
    validAppointments.forEach((apt, index) => {
      const lat = apt.address!.lat!;
      const lng = apt.address!.lng!;
      const isSelected = selectedAppointment?.id === apt.id;
      const color = getMarkerColor(apt);

      // Determine if we should show route number
      let routeNumber: number | undefined;
      if (apt.assigned_staff_user_id) {
        const stylistApts = stylistAppointments[apt.assigned_staff_user_id] || [];
        const sortedApts = [...stylistApts].sort(
          (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        );
        routeNumber = sortedApts.findIndex(a => a.id === apt.id) + 1;
      }

      const marker = L.marker([lat, lng], {
        icon: routeNumber 
          ? createNumberedMarker(routeNumber, color, isSelected)
          : createColoredMarker(color, isSelected),
      });

      // Popup content
      const popupContent = `
        <div style="min-width: 200px;">
          <div style="font-weight: bold; margin-bottom: 8px;">
            🐾 ${apt.pet?.name || 'Mascota'} 
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
            <strong>⏰ Hora:</strong> ${format(new Date(apt.scheduled_at), 'HH:mm')}
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
            <strong>👤 Cliente:</strong> ${apt.client?.name || 'N/A'}
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
            <strong>📍 Dirección:</strong><br/>
            ${apt.address?.street} ${apt.address?.number_ext || ''}<br/>
            ${apt.address?.neighborhood || ''}
          </div>
          ${apt.assigned_staff_user_id 
            ? `<div style="font-size: 12px; color: #22c55e; margin-top: 8px;">
                ✅ Estilista asignado
              </div>`
            : `<div style="font-size: 12px; color: #f59e0b; margin-top: 8px;">
                ⚠️ Sin estilista asignado
              </div>`
          }
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onAppointmentSelect) {
          onAppointmentSelect(apt);
        }
      });

      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (validAppointments.length > 0) {
      const bounds = L.latLngBounds(
        validAppointments.map(apt => [apt.address!.lat!, apt.address!.lng!])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [validAppointments, selectedAppointment, stylists, onAppointmentSelect]);

  // Center on selected appointment
  useEffect(() => {
    if (!mapRef.current || !selectedAppointment?.address?.lat || !selectedAppointment?.address?.lng) return;

    mapRef.current.setView(
      [selectedAppointment.address.lat, selectedAppointment.address.lng],
      15,
      { animate: true }
    );

    // Open popup for selected marker
    const selectedMarkerIndex = validAppointments.findIndex(
      apt => apt.id === selectedAppointment.id
    );
    if (selectedMarkerIndex >= 0 && markersRef.current[selectedMarkerIndex]) {
      markersRef.current[selectedMarkerIndex].openPopup();
    }
  }, [selectedAppointment, validAppointments]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-slate-200 p-3 z-[1000]">
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
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-slate-600">Con estilista</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-indigo-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 3px, #6366f1 3px, #6366f1 8px)' }} />
            <span className="text-xs text-slate-600">Ruta</span>
          </div>
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-slate-200 p-3 z-[1000]">
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
