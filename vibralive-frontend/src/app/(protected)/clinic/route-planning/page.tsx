'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useClinicConfiguration } from '@/hooks/useClinicConfiguration';
import { usePermissions } from '@/hooks/usePermissions';
import { appointmentsApi } from '@/lib/appointments-api';
import { stylistsApi } from '@/api/stylists-api';
import { 
  routeOptimizerApi, 
  OptimizationResponse, 
  OptimizedRoute as ORToolsRoute,
  RouteAppointmentInput,
  RouteStylistInput,
} from '@/lib/route-optimizer-api';
import { Appointment, Stylist, ClientAddress } from '@/types';
import { ClientAddressBook } from '@/components/addresses/ClientAddressBook';
import { PermissionGate } from '@/components/PermissionGate';
import { MdClose, MdLocationOn } from 'react-icons/md';
import { format, addDays, startOfDay, isBefore, addHours } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  FiMap,
  FiUser,
  FiCalendar,
  FiClock,
  FiRefreshCw,
  FiCheck,
  FiAlertCircle,
  FiNavigation,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiZap,
  FiCpu,
  FiSettings,
} from 'react-icons/fi';
import { MdPets } from 'react-icons/md';
import dynamic from 'next/dynamic';

// Loading component for maps
const MapLoading = () => (
  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-500 gap-2">
    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
    <span className="text-sm font-medium">Cargando mapa...</span>
  </div>
);

// Dynamic import for Google Maps RouteMap
const RouteMapComponent = dynamic(
  () => import('@/components/maps/GoogleRouteMap'),
  { ssr: false, loading: MapLoading }
);

// Types for route planning
interface RouteAppointment extends Appointment {
  distance?: number; // Distance from previous point in km
  estimatedTravelTime?: number; // Minutes
  routeOrder?: number;
}

interface StylistRoute {
  stylist: Stylist;
  appointments: RouteAppointment[];
  totalDistance: number;
  totalTravelTime: number;
}

type FilterType = 'all' | 'unassigned' | 'assigned';

export default function RoutePlanningPage() {
  console.log('[RoutePlanningPage] Component rendering...');
  const { user } = useAuthStore();
  const { has } = usePermissions();
  const clinicId = user?.clinic_id;
  console.log('[RoutePlanningPage] clinicId:', clinicId);
  const { config } = useClinicConfiguration();

  // State
  const [appointments, setAppointments] = useState<RouteAppointment[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<RouteAppointment | null>(null);
  const [routes, setRoutes] = useState<StylistRoute[]>([]);
  // Modal para verificar/cambiar dirección
  const [verifyAddressAppointment, setVerifyAddressAppointment] = useState<RouteAppointment | null>(null);
  // Key para forzar remount de ClientAddressBook
  const [addressBookKey, setAddressBookKey] = useState(0);
  // OR-Tools optimizer state
  const [optimizerAvailable, setOptimizerAvailable] = useState<boolean | null>(null);
  const [lastOptimizationResult, setLastOptimizationResult] = useState<OptimizationResponse | null>(null);
  const [useORTools, setUseORTools] = useState(true); // Toggle between OR-Tools and simple algorithm
  const [routesOptimized, setRoutesOptimized] = useState(false); // True after auto-assign, hides manual assign buttons

  // Función para abrir el modal
  const openVerifyAddressModal = useCallback((apt: RouteAppointment) => {
    console.log('[RoutePlanning] Opening verify address modal');
    console.log('[RoutePlanning] Appointment:', apt);
    console.log('[RoutePlanning] client.id:', apt.client?.id);
    console.log('[RoutePlanning] address_id:', apt.address_id);
    setAddressBookKey(k => k + 1); // Forzar remount con nuevo key
    setVerifyAddressAppointment(apt);
  }, []);

  // Función para cerrar el modal
  const closeVerifyAddressModal = useCallback(() => {
    setVerifyAddressAppointment(null);
  }, []);

  // Fetch home appointments
  const fetchHomeAppointments = useCallback(async () => {
    console.log('[RoutePlanning] fetchHomeAppointments called, clinicId:', clinicId);
    if (!clinicId) return;

    setLoading(true);
    try {
      // Get appointments for the selected date (single day)
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      console.log('[RoutePlanning] Fetching for date:', dateStr);

      const response = await appointmentsApi.getAppointments({
        location_type: 'HOME',
        from: dateStr,
        to: dateStr,
        status: 'SCHEDULED,CONFIRMED',
        limit: 100,
      });

      // apiClient.get already extracts .data, so response is the final object {data: [], total: n}
      // But check in case it's the array directly
      let homeAppointments: any[] = [];
      
      if (Array.isArray(response)) {
        // Response is already the appointments array
        homeAppointments = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        // Response is {data: [...], total: n}
        homeAppointments = response.data;
      }
      
      console.log('[RoutePlanning] Raw response:', response);
      console.log('[RoutePlanning] Date:', dateStr);
      console.log('[RoutePlanning] Home appointments:', homeAppointments);
      console.log('[RoutePlanning] Count:', homeAppointments.length);
      
      // Debug: Ver estructura de direcciones
      if (homeAppointments.length > 0) {
        console.log('[RoutePlanning] Sample appointment address:', homeAppointments[0]?.address);
        console.log('[RoutePlanning] Address has lat/lng?:', 
          homeAppointments.map((apt: any) => ({
            id: apt.id,
            address_id: apt.address_id,
            hasAddress: !!apt.address,
            lat: apt.address?.lat,
            lng: apt.address?.lng,
          }))
        );
      }

      setAppointments(homeAppointments);
    } catch (error) {
      console.error('Error fetching home appointments:', error);
      toast.error('Error al cargar las citas a domicilio');
    } finally {
      setLoading(false);
    }
  }, [clinicId, selectedDate]);

  // Fetch stylists that can do home visits - filtered by type HOME and availability
  const fetchStylists = useCallback(async () => {
    if (!clinicId) return;

    try {
      const allStylists = await stylistsApi.listStylists(clinicId);
      
      // Step 1: Filter only HOME type stylists
      const homeStylists = allStylists.filter((s: any) => s.type === 'HOME');
      
      if (homeStylists.length === 0) {
        console.log('[RoutePlanning] No HOME type stylists found');
        setStylists([]);
        return;
      }

      // Step 2: Get day of week from selected date (0=Monday, 6=Sunday - matching backend format)
      const dayOfWeek = (selectedDate.getDay() + 6) % 7; // Convert JS (0=Sun) to backend (0=Mon)
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
      
      console.log('[RoutePlanning] Filtering stylists for day:', dayOfWeek, 'date:', selectedDateStr);

      // Step 3: Check availability and unavailable periods for each stylist
      const availableStylists = await Promise.all(
        homeStylists.map(async (stylist: any) => {
          try {
            // Get weekly availability
            const availabilities = await stylistsApi.listAvailabilities(clinicId, stylist.id);
            
            // Check if stylist has active availability for this day of week
            const hasAvailability = availabilities.some(
              (a: any) => a.day_of_week === dayOfWeek && a.is_active
            );
            
            if (!hasAvailability) {
              console.log(`[RoutePlanning] Stylist ${stylist.name} has no availability for day ${dayOfWeek}`);
              return null;
            }

            // Get unavailable periods to check if stylist is blocked on selected date
            const unavailablePeriods = await stylistsApi.listUnavailablePeriods(clinicId, stylist.id);
            
            // Check if selected date falls within any unavailable period
            const isUnavailable = unavailablePeriods.some((period: any) => {
              const startDate = new Date(period.start_date);
              const endDate = new Date(period.end_date);
              const checkDate = new Date(selectedDateStr);
              return checkDate >= startDate && checkDate <= endDate;
            });

            if (isUnavailable) {
              console.log(`[RoutePlanning] Stylist ${stylist.name} is unavailable on ${selectedDateStr}`);
              return null;
            }

            // Store availability for time window calculation
            const dayAvailability = availabilities.find(
              (a: any) => a.day_of_week === dayOfWeek && a.is_active
            );
            
            return {
              ...stylist,
              dayAvailability, // Store for time window reference
            };
          } catch (error) {
            console.error(`[RoutePlanning] Error checking availability for stylist ${stylist.id}:`, error);
            return null;
          }
        })
      );

      // Filter out null results (unavailable stylists)
      const validStylists = availableStylists.filter((s): s is Stylist => s !== null);
      
      console.log('[RoutePlanning] Available HOME stylists for route:', validStylists.length);
      setStylists(validStylists);
    } catch (error) {
      console.error('Error fetching stylists:', error);
      toast.error('Error al cargar estilistas disponibles');
    }
  }, [clinicId, selectedDate]);

  // Initial data load
  useEffect(() => {
    fetchHomeAppointments();
    fetchStylists();
    setRoutesOptimized(false); // Reset when date changes
    setRoutes([]); // Clear previous routes
  }, [fetchHomeAppointments, fetchStylists]);

  // Check OR-Tools optimizer availability
  useEffect(() => {
    const checkOptimizer = async () => {
      try {
        const available = await routeOptimizerApi.healthCheck();
        setOptimizerAvailable(available);
        if (available) {
          console.log('[RoutePlanning] OR-Tools optimizer is available');
        } else {
          console.log('[RoutePlanning] OR-Tools optimizer not available, using fallback algorithm');
        }
      } catch (error) {
        console.error('[RoutePlanning] Error checking optimizer:', error);
        setOptimizerAvailable(false);
      }
    };
    checkOptimizer();
  }, []);

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    switch (filter) {
      case 'unassigned':
        return appointments.filter((apt) => !apt.assigned_staff_user_id);
      case 'assigned':
        return appointments.filter((apt) => apt.assigned_staff_user_id);
      default:
        return appointments;
    }
  }, [appointments, filter]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, RouteAppointment[]> = {};
    
    filteredAppointments.forEach((apt) => {
      const dateKey = format(new Date(apt.scheduled_at), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(apt);
    });

    // Sort by date
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, apts]) => ({
        date,
        appointments: apts.sort((a, b) => 
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        ),
      }));
  }, [filteredAppointments]);

  // Haversine formula to calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Optimize routes using OR-Tools VRPTW or fallback Nearest Neighbor algorithm
  const optimizeRoutes = useCallback(async () => {
    if (!clinicId || stylists.length === 0) {
      toast.error('No hay estilistas disponibles para rutas a domicilio');
      return;
    }

    const unassigned = appointments.filter((apt) => !apt.assigned_staff_user_id);
    if (unassigned.length === 0) {
      toast('Todas las citas ya tienen estilista asignado', { icon: 'ℹ️' });
      return;
    }

    // Filter appointments with valid coordinates
    const appointmentsWithCoords = unassigned.filter(
      (apt) => apt.address?.lat && apt.address?.lng
    );

    console.log('[RoutePlanning] Unassigned appointments:', unassigned.length);
    console.log('[RoutePlanning] Appointments with coordinates:', appointmentsWithCoords.length);
    console.log('[RoutePlanning] Coordinates check:', unassigned.map(apt => ({
      id: apt.id,
      hasAddress: !!apt.address,
      lat: apt.address?.lat,
      lng: apt.address?.lng,
    })));

    if (appointmentsWithCoords.length === 0) {
      toast.error('No hay citas con direcciones geolocalizadas para optimizar');
      return;
    }

    setOptimizing(true);
    
    try {
      // Try OR-Tools optimization if available and enabled
      if (useORTools && optimizerAvailable) {
        await optimizeWithORTools(appointmentsWithCoords);
      } else {
        await optimizeWithNearestNeighbor(appointmentsWithCoords);
      }
    } catch (error) {
      console.error('Error optimizing routes:', error);
      toast.error('Error al optimizar rutas');
    } finally {
      setOptimizing(false);
    }
  }, [clinicId, appointments, stylists, useORTools, optimizerAvailable]);

  // OR-Tools optimization via Python microservice
  const optimizeWithORTools = async (appointmentsWithCoords: RouteAppointment[]) => {
    console.log('[RoutePlanning] Using OR-Tools VRPTW optimization');
    
    // Get clinic base location for stylist start
    const clinicLat = config?.baseLat || 19.4326; // Default Mexico City
    const clinicLng = config?.baseLng || -99.1332;
    
    // Transform appointments to OR-Tools format
    const orToolsAppointments: RouteAppointmentInput[] = appointmentsWithCoords.map((apt) => {
      const scheduledTime = new Date(apt.scheduled_at);
      const duration = apt.duration_minutes || 60;
      
      // Ventana de tiempo: la cita debe empezar máximo 30 min después de la hora programada
      // Esto da flexibilidad para rutas pero mantiene puntualidad razonable
      const windowStart = scheduledTime;
      const windowEnd = new Date(scheduledTime.getTime() + 30 * 60 * 1000); // +30 min tolerancia
      
      return {
        id: apt.id,
        client_id: apt.client_id || apt.client?.id || '',
        client_name: apt.client?.name,
        pet_name: apt.pet?.name,
        location: {
          lat: apt.address?.lat || 0,
          lng: apt.address?.lng || 0,
          address: apt.address 
            ? `${apt.address.street}${apt.address.number_ext ? ' ' + apt.address.number_ext : ''}, ${apt.address.neighborhood || ''}, ${apt.address.city}`
            : undefined,
        },
        time_window: {
          start: windowStart.toISOString(),
          end: windowEnd.toISOString(),
        },
        duration_minutes: duration,
        required_stylist_id: undefined, // Never pre-assign during optimization
      };
    });

    // Calcular max_appointments balanceado para forzar distribución
    const balancedMaxAppointments = Math.ceil(appointmentsWithCoords.length / stylists.length) + 1;
    
    // Transform stylists to OR-Tools format - using their actual availability
    const orToolsStylists: RouteStylistInput[] = stylists.map((stylist: any) => {
      // Use actual availability from dayAvailability (set in fetchStylists)
      const availability = stylist.dayAvailability;
      const startTime = availability?.start_time || '08:00';
      const endTime = availability?.end_time || '18:00';
      
      console.log(`[RoutePlanning] Stylist ${stylist.displayName || stylist.name}: schedule ${startTime}-${endTime}, max: ${balancedMaxAppointments}`);
      
      return {
        id: stylist.userId,
        name: stylist.displayName || stylist.user?.name || 'Estilista',
        start_location: {
          lat: clinicLat,
          lng: clinicLng,
          address: 'Clínica',
        },
        work_schedule: {
          start_time: startTime,
          end_time: endTime,
        },
        max_appointments: balancedMaxAppointments, // Limitar capacidad para forzar distribución
        skills: [],
        avg_speed_kmh: 25, // Velocidad promedio en ciudad
      };
    });

    // Build optimization request
    const request = {
      clinic_id: clinicId!,
      date: selectedDate.toISOString(),
      appointments: orToolsAppointments,
      stylists: orToolsStylists,
      config: {
        max_solve_time_seconds: 30,
        allow_unassigned: true,
        first_solution_strategy: 'PARALLEL_CHEAPEST_INSERTION', // Distribuye mejor entre estilistas
        local_search_metaheuristic: 'GUIDED_LOCAL_SEARCH',
      },
    };

    // Debug: log stylists being sent to OR-Tools
    console.log('[RoutePlanning] Stylists for optimization:', orToolsStylists.map(s => ({
      id: s.id,
      name: s.name,
      schedule: `${s.work_schedule.start_time}-${s.work_schedule.end_time}`
    })));
    console.log('[RoutePlanning] Appointments time windows:', orToolsAppointments.map(a => ({
      id: a.id,
      client: a.client_name,
      window: `${new Date(a.time_window.start).toLocaleTimeString()}-${new Date(a.time_window.end).toLocaleTimeString()}`,
      duration: a.duration_minutes
    })));
    console.log('[RoutePlanning] Sending optimization request:', request);
    
    // Call OR-Tools microservice
    const result = await routeOptimizerApi.optimize(request);
    setLastOptimizationResult(result);
    
    console.log('[RoutePlanning] Optimization result:', result);
    
    // Debug: show distribution
    if (result.routes) {
      console.log('[RoutePlanning] Route distribution:');
      result.routes.forEach(route => {
        console.log(`  Stylist ${route.stylist_name} (${route.stylist_id}): ${route.stops.length} stops`);
        route.stops.forEach(stop => {
          console.log(`    - ${stop.appointment_id} @ ${stop.planned_arrival}`);
        });
      });
      if (result.unassigned_appointments?.length > 0) {
        console.log(`  Unassigned: ${result.unassigned_appointments.length} appointments`);
      }
    }

    if (!result.success) {
      toast.error(result.message || 'Error en la optimización');
      return;
    }

    // Apply assignments via API
    const assignmentsToMake: Array<{ appointmentId: string; stylistId: string }> = [];
    const newRoutes: StylistRoute[] = [];

    for (const route of result.routes) {
      const stylistData = stylists.find((s) => s.userId === route.stylist_id);
      if (!stylistData) continue;

      const routeAppointments: RouteAppointment[] = [];

      for (const stop of route.stops) {
        const originalAppt = appointmentsWithCoords.find((a) => a.id === stop.appointment_id);
        if (!originalAppt) continue;

        routeAppointments.push({
          ...originalAppt,
          routeOrder: stop.stop_order + 1,
          distance: stop.travel_distance_km,
          estimatedTravelTime: stop.travel_time_minutes,
        });

        assignmentsToMake.push({
          appointmentId: stop.appointment_id,
          stylistId: route.stylist_id,
        });
      }

      newRoutes.push({
        stylist: stylistData,
        appointments: routeAppointments,
        totalDistance: route.total_travel_distance_km,
        totalTravelTime: route.total_travel_time_minutes,
      });
    }

    // Apply assignments to backend
    let successCount = 0;
    for (const assignment of assignmentsToMake) {
      try {
        await appointmentsApi.updateAppointmentServices(assignment.appointmentId, {
          assigned_staff_user_id: assignment.stylistId,
        });
        successCount++;
      } catch (error) {
        console.error(`Error assigning appointment ${assignment.appointmentId}:`, error);
      }
    }

    setRoutes(newRoutes);
    
    if (successCount > 0) {
      setRoutesOptimized(true); // Hide manual assign buttons
      const unassignedCount = result.unassigned_appointments.length;
      const message = unassignedCount > 0
        ? `${successCount} citas asignadas. ${unassignedCount} sin asignar (sin capacidad).`
        : `${successCount} citas asignadas exitosamente con OR-Tools.`;
      
      toast.success(message, {
        duration: 5000,
        icon: '🚀',
      });
      
      // Show optimization stats
      toast(
        `⏱️ Tiempo total: ${Math.round(result.total_travel_time_minutes)} min | 📍 Distancia: ${result.total_travel_distance_km.toFixed(1)} km`,
        { duration: 4000 }
      );
      
      fetchHomeAppointments();
    }
  };

  // Fallback Nearest Neighbor optimization
  const optimizeWithNearestNeighbor = async (appointmentsWithCoords: RouteAppointment[]) => {
    console.log('[RoutePlanning] Using fallback Nearest Neighbor algorithm');
    
    // Group unassigned appointments by date
    const byDate: Record<string, RouteAppointment[]> = {};
    appointmentsWithCoords.forEach((apt) => {
      const dateKey = format(new Date(apt.scheduled_at), 'yyyy-MM-dd');
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(apt);
    });

    const newRoutes: StylistRoute[] = [];
    const assignmentsToMake: Array<{ appointmentId: string; stylistId: string }> = [];

    // For each date, optimize and assign
    for (const [dateKey, dateAppointments] of Object.entries(byDate)) {
      // Distribute appointments to stylists based on zones
      const appointmentsPerStylist = Math.ceil(dateAppointments.length / stylists.length);

      // Sort appointments by lat then lng for basic geographic grouping
      const sorted = [...dateAppointments].sort((a, b) => {
        const latDiff = (a.address?.lat || 0) - (b.address?.lat || 0);
        if (Math.abs(latDiff) > 0.01) return latDiff;
        return (a.address?.lng || 0) - (b.address?.lng || 0);
      });

      // Assign to stylists
      stylists.forEach((stylist, stylistIndex) => {
        const start = stylistIndex * appointmentsPerStylist;
        const end = Math.min(start + appointmentsPerStylist, sorted.length);
        const stylistAppointments = sorted.slice(start, end);

        if (stylistAppointments.length === 0) return;

        // Optimize order using Nearest Neighbor within stylist's appointments
        const optimizedOrder = optimizeRouteOrder(stylistAppointments);

        let totalDistance = 0;
        optimizedOrder.forEach((apt, idx) => {
          if (idx > 0) {
            const prev = optimizedOrder[idx - 1];
            const distance = calculateDistance(
              prev.address?.lat || 0,
              prev.address?.lng || 0,
              apt.address?.lat || 0,
              apt.address?.lng || 0
            );
            apt.distance = distance;
            totalDistance += distance;
          }
          apt.routeOrder = idx + 1;

          assignmentsToMake.push({
            appointmentId: apt.id,
            stylistId: stylist.userId,
          });
        });

        newRoutes.push({
          stylist,
          appointments: optimizedOrder,
          totalDistance,
          totalTravelTime: Math.round(totalDistance * 3), // Rough estimate: 3 min per km
        });
      });
    }

    // Apply assignments via API
    let successCount = 0;
    for (const assignment of assignmentsToMake) {
      try {
        await appointmentsApi.updateAppointmentServices(assignment.appointmentId, {
          assigned_staff_user_id: assignment.stylistId,
        });
        successCount++;
      } catch (error) {
        console.error(`Error assigning appointment ${assignment.appointmentId}:`, error);
      }
    }

    setRoutes(newRoutes);
    
    if (successCount > 0) {
      setRoutesOptimized(true); // Hide manual assign buttons
      toast.success(`${successCount} citas asignadas (algoritmo simple)`);
      fetchHomeAppointments();
    }
  };

  // Nearest Neighbor route optimization
  const optimizeRouteOrder = (appointments: RouteAppointment[]): RouteAppointment[] => {
    if (appointments.length <= 1) return appointments;

    const result: RouteAppointment[] = [];
    const remaining = [...appointments];

    // Start with the first appointment (could improve by starting from clinic location)
    result.push(remaining.shift()!);

    while (remaining.length > 0) {
      const last = result[result.length - 1];
      let nearestIdx = 0;
      let nearestDist = Infinity;

      remaining.forEach((apt, idx) => {
        const dist = calculateDistance(
          last.address?.lat || 0,
          last.address?.lng || 0,
          apt.address?.lat || 0,
          apt.address?.lng || 0
        );
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = idx;
        }
      });

      result.push(remaining.splice(nearestIdx, 1)[0]);
    }

    return result;
  };

  // Manual assignment handler
  const handleManualAssign = async (appointmentId: string, stylistId: string) => {
    try {
      await appointmentsApi.updateAppointmentServices(appointmentId, {
        assigned_staff_user_id: stylistId,
      });
      toast.success('Estilista asignado exitosamente');
      fetchHomeAppointments();
    } catch (error) {
      console.error('Error assigning stylist:', error);
      toast.error('Error al asignar estilista');
    }
  };

  // Unassign handler
  const handleUnassign = async (appointmentId: string) => {
    try {
      // Update UI immediately
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointmentId
            ? { ...apt, assigned_staff_user_id: undefined }
            : apt
        )
      );
      
      // Clear routes immediately
      setRoutes([]);
      setRoutesOptimized(false);
      
      // Update backend
      await appointmentsApi.updateAppointmentServices(appointmentId, {
        assigned_staff_user_id: null, // null to unassign
      });
      toast.success('Estilista desasignado');
      
      // Refresh in background to sync any changes
      fetchHomeAppointments();
    } catch (error) {
      console.error('Error unassigning stylist:', error);
      toast.error('Error al desasignar estilista');
      // Revert on error
      fetchHomeAppointments();
    }
  };

  // Handler para cambiar la dirección de una cita
  const handleAddressChange = async (appointmentId: string, newAddress: ClientAddress) => {
    try {
      await appointmentsApi.updateAppointment(appointmentId, {
        address_id: newAddress.id,
      });
      toast.success('Dirección de la cita actualizada');
      closeVerifyAddressModal();
      fetchHomeAppointments();
    } catch (error) {
      console.error('Error updating appointment address:', error);
      toast.error('Error al actualizar la dirección de la cita');
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = appointments.length;
    const assigned = appointments.filter((a) => a.assigned_staff_user_id).length;
    const unassigned = total - assigned;
    const withCoords = appointments.filter((a) => a.address?.lat && a.address?.lng).length;
    const withoutAddress = appointments.filter((a) => !a.address || !a.address.lat || !a.address.lng).length;
    
    return { total, assigned, unassigned, withCoords, withoutAddress };
  }, [appointments]);

  // Navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate((prev) =>
      direction === 'next' ? addDays(prev, 1) : addDays(prev, -1)
    );
  };

  // Handle date input change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value + 'T00:00:00');
    if (!isNaN(date.getTime())) {
      setSelectedDate(startOfDay(date));
    }
  };

  if (!clinicId) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        No se encontró la clínica asociada
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FiMap className="text-primary-500" />
              Rutas a Domicilio
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Planifica y optimiza las rutas de visitas a domicilio
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Selector */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => navigateDate('prev')}
                disabled={optimizing}
                className="p-2 hover:bg-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Día anterior"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 px-2">
                <FiCalendar className="w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={handleDateChange}
                  disabled={optimizing}
                  className="bg-transparent border-none text-sm font-medium text-slate-700 cursor-pointer focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:text-slate-400"
                />
              </div>
              <button
                onClick={() => navigateDate('next')}
                disabled={optimizing}
                className="p-2 hover:bg-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Día siguiente"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchHomeAppointments}
              disabled={loading || optimizing}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualizar"
            >
              <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* OR-Tools Toggle */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setUseORTools(false)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition ${
                  !useORTools ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Algoritmo simple (Nearest Neighbor)"
              >
                <FiZap className="w-3.5 h-3.5" />
                Simple
              </button>
              <button
                onClick={() => setUseORTools(true)}
                disabled={!optimizerAvailable}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition ${
                  useORTools && optimizerAvailable
                    ? 'bg-white shadow-sm text-primary-700'
                    : optimizerAvailable
                    ? 'text-slate-500 hover:text-slate-700'
                    : 'text-slate-300 cursor-not-allowed'
                }`}
                title={optimizerAvailable ? 'Optimización avanzada con OR-Tools' : 'Servicio OR-Tools no disponible'}
              >
                <FiCpu className="w-3.5 h-3.5" />
                OR-Tools
                {optimizerAvailable === false && (
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
                {optimizerAvailable === true && (
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                )}
              </button>
            </div>

            {/* Auto-optimize */}
            <PermissionGate require={{ permissions: ['appointments:update'] }}>
              <button
                onClick={optimizeRoutes}
                disabled={optimizing || stats.unassigned === 0 || stylists.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                title={stylists.length === 0 ? 'No hay estilistas HOME disponibles este día' : undefined}
              >
                {useORTools && optimizerAvailable ? (
                  <FiCpu className={`w-4 h-4 ${optimizing ? 'animate-pulse' : ''}`} />
                ) : (
                  <FiZap className={`w-4 h-4 ${optimizing ? 'animate-pulse' : ''}`} />
                )}
                <span className="hidden sm:inline">
                  {optimizing ? 'Optimizando...' : 'Auto-asignar'}
                </span>
              </button>
            </PermissionGate>

            {/* Reset button - shows after optimization to re-enable manual mode */}
            {routesOptimized && (
              <button
                onClick={() => {
                  setRoutesOptimized(false);
                  setRoutes([]);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition text-sm"
                title="Reiniciar para asignación manual"
              >
                <FiRefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Reiniciar</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-4 mt-4">
          {/* OR-Tools Status Indicator */}
          {optimizerAvailable !== null && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
              optimizerAvailable ? 'bg-green-50' : 'bg-slate-100'
            }`}>
              <FiCpu className={optimizerAvailable ? 'text-green-600' : 'text-slate-400'} />
              <span className={optimizerAvailable ? 'text-green-700' : 'text-slate-500'}>
                OR-Tools: {optimizerAvailable ? 'Activo' : 'No disponible'}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
            <FiCalendar className="text-slate-500" />
            <span className="text-slate-600">Total:</span>
            <span className="font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg text-sm">
            <FiCheck className="text-green-600" />
            <span className="text-green-700">Asignadas:</span>
            <span className="font-semibold text-green-700">{stats.assigned}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg text-sm">
            <FiAlertCircle className="text-amber-600" />
            <span className="text-amber-700">Sin asignar:</span>
            <span className="font-semibold text-amber-700">{stats.unassigned}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-sm">
            <FiNavigation className="text-blue-600" />
            <span className="text-blue-700">Enrutables:</span>
            <span className="font-semibold text-blue-700">{stats.withCoords}</span>
          </div>
          {stats.withoutAddress > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg text-sm">
              <FiAlertCircle className="text-red-600" />
              <span className="text-red-700">Sin dirección verificada:</span>
              <span className="font-semibold text-red-700">{stats.withoutAddress}</span>
            </div>
          )}
          {/* Available HOME Stylists */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg text-sm">
            <FiUser className="text-purple-600" />
            <span className="text-purple-700">Estilistas HOME:</span>
            <span className="font-semibold text-purple-700">{stylists.length}</span>
            {stylists.length > 0 && (
              <span className="text-purple-500 text-xs">
                ({stylists.map((s: any) => s.displayName || s.name || 'N/A').join(', ')})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Panel - Appointments List */}
          <div className="xl:col-span-1 space-y-4">
            {/* Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiFilter className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Filtrar por</span>
              </div>
              <div className="flex gap-2">
                {(['all', 'unassigned', 'assigned'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      filter === f
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f === 'all' ? 'Todas' : f === 'unassigned' ? 'Sin asignar' : 'Asignadas'}
                  </button>
                ))}
              </div>
            </div>

            {/* Appointments by Date */}
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500">Cargando citas...</p>
              </div>
            ) : appointmentsByDate.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                <FiMap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No hay citas a domicilio en este período</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
                {appointmentsByDate.map(({ date, appointments: dayAppointments }) => (
                  <div
                    key={date}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                  >
                    {/* Date Header */}
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                      <h3 className="font-semibold text-slate-700">
                        {format(new Date(date + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es })}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {dayAppointments.length} cita{dayAppointments.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Appointments */}
                    <div className="divide-y divide-slate-100">
                      {dayAppointments.map((apt) => (
                        <AppointmentCard
                          key={apt.id}
                          appointment={apt}
                          stylists={stylists}
                          isSelected={selectedAppointment?.id === apt.id}
                          onSelect={() => setSelectedAppointment(apt)}
                          onAssign={(stylistId) => handleManualAssign(apt.id, stylistId)}
                          onUnassign={() => handleUnassign(apt.id)}
                          onVerifyAddress={() => openVerifyAddressModal(apt)}
                          routesOptimized={routesOptimized}
                          optimizing={optimizing}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - Map */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-[calc(100vh-250px)]">
              <RouteMapComponent
                appointments={filteredAppointments}
                stylists={stylists}
                selectedAppointment={selectedAppointment}
                onAppointmentSelect={setSelectedAppointment}
                routes={routes}
                baseLat={config?.baseLat}
                baseLng={config?.baseLng}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal para verificar/cambiar dirección */}
      {verifyAddressAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="flex items-center gap-3 text-white">
                <MdLocationOn className="w-6 h-6" />
                <div>
                  <h2 className="text-lg font-bold">Verificar Dirección</h2>
                  <p className="text-sm text-blue-100">
                    {verifyAddressAppointment.client?.name || 'Cliente'} - {verifyAddressAppointment.pet?.name || 'Mascota'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeVerifyAddressModal}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            {/* Info de la cita actual */}
            <div className="px-6 py-3 bg-amber-50 border-b border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Dirección actual de la cita:</strong>{' '}
                {verifyAddressAppointment.address
                  ? `${verifyAddressAppointment.address.street || ''} ${verifyAddressAppointment.address.number_ext || ''}, ${verifyAddressAppointment.address.neighborhood || verifyAddressAppointment.address.city || ''}`
                  : 'Sin dirección'}
                {verifyAddressAppointment.address?.lat && verifyAddressAppointment.address?.lng
                  ? ' ✓ Verificada'
                  : ' ⚠️ Sin verificar'}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Selecciona una dirección verificada para actualizar la cita, o agrega/edita direcciones.
              </p>
            </div>

            {/* ClientAddressBook */}
            <div className="flex-1 overflow-y-auto">
              {(() => {
                console.log('[RoutePlanning] Rendering ClientAddressBook with:', {
                  key: `${verifyAddressAppointment.client?.id}-${addressBookKey}`,
                  clientId: verifyAddressAppointment.client?.id,
                  initialAddressId: verifyAddressAppointment.address_id,
                });
                return null;
              })()}
              <ClientAddressBook
                key={`${verifyAddressAppointment.client?.id}-${addressBookKey}`}
                clientId={verifyAddressAppointment.client?.id}
                initialAddressId={verifyAddressAppointment.address_id}
                onAddressSelected={(address) => {
                  if (address.lat && address.lng) {
                    handleAddressChange(verifyAddressAppointment.id, address);
                  } else {
                    toast.error('Esta dirección no está verificada. Edítala primero para agregar coordenadas.');
                  }
                }}
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={closeVerifyAddressModal}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Appointment Card Component
interface AppointmentCardProps {
  appointment: RouteAppointment;
  stylists: Stylist[];
  isSelected: boolean;
  onSelect: () => void;
  onAssign: (stylistId: string) => void;
  onUnassign: () => void;
  onVerifyAddress: () => void;
  routesOptimized?: boolean; // When true, hide manual assign button
  optimizing?: boolean; // When true, disable all assignment actions
}

function AppointmentCard({
  appointment,
  stylists,
  isSelected,
  onSelect,
  onAssign,
  onUnassign,
  onVerifyAddress,
  routesOptimized = false,
  optimizing = false,
}: AppointmentCardProps) {
  const [showStylistPicker, setShowStylistPicker] = useState(false);

  const assignedStylist = stylists.find(
    (s) => s.userId === appointment.assigned_staff_user_id
  );

  const hasCoordinates = appointment.address?.lat && appointment.address?.lng;
  const canBeRouted = hasCoordinates;

  return (
    <div
      onClick={onSelect}
      className={`p-4 cursor-pointer transition hover:bg-slate-50 ${
        isSelected ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''
      } ${!canBeRouted ? 'bg-red-50/50 border-l-4 border-l-red-300' : ''}`}
    >
      {/* Warning banner for non-routable appointments */}
      {!canBeRouted && (
        <div className="flex items-center justify-between gap-2 mb-3 p-2 bg-red-100 rounded-md text-xs text-red-700">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">No se puede enrutar - Falta verificar dirección</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVerifyAddress();
            }}
            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition font-medium flex-shrink-0"
          >
            Verificar
          </button>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Time and Pet */}
          <div className="flex items-center gap-2 mb-1">
            <FiClock className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="font-medium text-slate-900">
              {format(new Date(appointment.scheduled_at), 'HH:mm')}
            </span>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1 text-slate-600">
              <MdPets className="w-4 h-4" />
              <span className="truncate">{appointment.pet?.name || 'Mascota'}</span>
            </div>
          </div>

          {/* Client */}
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <FiUser className="w-3 h-3" />
            <span className="truncate">
              {appointment.client?.name || 'Cliente'}
            </span>
          </div>

          {/* Address */}
          <div className={`flex items-start gap-2 text-sm ${!canBeRouted ? 'text-red-500' : 'text-slate-500'}`}>
            <FiMap className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">
              {appointment.address
                ? `${appointment.address.street || 'Sin calle'} ${appointment.address.number_ext || ''}, ${appointment.address.neighborhood || appointment.address.city || ''}`
                : 'Sin dirección registrada'}
            </span>
          </div>
        </div>

        {/* Assignment Status */}
        <div className="flex-shrink-0">
          {assignedStylist ? (
            <div className="flex flex-col items-end relative">
              <span className="text-xs text-green-600 font-medium mb-1">Asignado</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStylistPicker(!showStylistPicker);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold hover:ring-2 hover:ring-offset-1 hover:ring-slate-300 transition"
                style={{ backgroundColor: assignedStylist.calendarColor || '#6366f1' }}
                title={`${assignedStylist.displayName || 'Estilista'} - Click para cambiar o desasignar`}
              >
                {(assignedStylist.displayName || assignedStylist.user?.name || 'E').charAt(0).toUpperCase()}
              </button>
              
              {/* Reassign/Unassign Dropdown */}
              {showStylistPicker && (
                <div 
                  className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-10 min-w-[180px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2 border-b border-slate-100">
                    <button
                      onClick={() => {
                        onUnassign();
                        setShowStylistPicker(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-sm text-red-600 rounded-md"
                    >
                      <FiAlertCircle className="w-4 h-4" />
                      <span>Desasignar</span>
                    </button>
                  </div>
                  <div className="p-1">
                    <p className="px-3 py-1 text-xs text-slate-400 font-medium">Reasignar a:</p>
                    {stylists
                      .filter((s) => s.userId !== appointment.assigned_staff_user_id)
                      .map((stylist) => (
                        <button
                          key={stylist.id}
                          onClick={() => {
                            onAssign(stylist.userId);
                            setShowStylistPicker(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-sm rounded-md"
                        >
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                            style={{ backgroundColor: stylist.calendarColor || '#6366f1' }}
                          >
                            {(stylist.displayName || stylist.user?.name || 'E').charAt(0).toUpperCase()}
                          </div>
                          <span>{stylist.displayName}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : optimizing ? (
            // Show loading indicator during optimization
            <div className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-md animate-pulse">
              Optimizando...
            </div>
          ) : routesOptimized ? (
            // When routes are optimized, show a badge instead of assign button
            <div className="px-2 py-1 text-xs bg-slate-100 text-slate-500 rounded-md">
              Pendiente
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStylistPicker(!showStylistPicker);
                }}
                className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition"
              >
                Asignar
              </button>

              {/* Stylist Picker Dropdown */}
              {showStylistPicker && (
                <div 
                  className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-10 min-w-[150px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {stylists.length === 0 ? (
                    <p className="p-3 text-sm text-slate-500">No hay estilistas</p>
                  ) : (
                    stylists.map((stylist) => (
                      <button
                        key={stylist.id}
                        onClick={() => {
                          onAssign(stylist.userId);
                          setShowStylistPicker(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-sm"
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                          style={{ backgroundColor: stylist.calendarColor || '#6366f1' }}
                        >
                          {(stylist.displayName || stylist.user?.name || 'E').charAt(0).toUpperCase()}
                        </div>
                        <span>{stylist.displayName}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Distance info if available */}
      {appointment.distance !== undefined && appointment.distance > 0 && (
        <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
          <FiNavigation className="w-3 h-3" />
          <span>{appointment.distance.toFixed(1)} km desde anterior</span>
        </div>
      )}
    </div>
  );
}
