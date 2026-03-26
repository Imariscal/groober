'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGeographyReport } from '@/hooks/useGeographyReport';
import { useClinicConfiguration } from '@/hooks/useClinicConfiguration';
import { KPICard } from '@/components/dashboard';
import Link from 'next/link';
import { FiArrowLeft, FiDownload, FiMap } from 'react-icons/fi';
import { motion } from 'framer-motion';

declare global {
  interface Window {
    google: any;
  }
}

export default function HeatmapReport() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const { data, loading, error } = useGeographyReport(dateRange);
  const { config } = useClinicConfiguration();
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  const kpis = data?.kpis || {
    zonesCovered: { label: 'Zonas Cubiertas', value: '0', trending: '' },
    hottest: { label: 'Zona de mayor demanda', value: 'Sin datos', trending: '' },
    clientsPerZone: { label: 'Clientes promedio/zona', value: '0', trending: '' },
    citiesDensity: { label: 'Citas por cliente', value: '0', trending: '' },
  };

  const zones = data?.zones || [];
  const heatmapData = data?.charts.heatmap || [];

  // Load and initialize Google Map
  useEffect(() => {
    if (!mapRef.current || !heatmapData || heatmapData.length === 0) return;

    setMapLoading(true);
    setMapError(null);

    let scriptLoadTimeout: NodeJS.Timeout;

    const initMap = () => {
      console.log('initMap called, checking for google.maps...');
      console.log('window.google:', !!window.google);
      console.log('window.google.maps:', !!window.google?.maps);
      
      // Verify maps library is available and dynamically load visualization
      const checkAndInit = (retries = 0) => {
        console.log(`checkAndInit attempt ${retries + 1}/10 (delay: ${retries * 500}ms)`);
        
        if (!window.google || !window.google.maps) {
          console.log('Google Maps not available');
          console.log('  window.google exists:', !!window.google);
          console.log('  window.google.maps exists:', !!window.google?.maps);
          
          if (retries < 9) {
            scriptLoadTimeout = setTimeout(() => checkAndInit(retries + 1), 500);
            return;
          } else {
            const errorMsg = 'Mapa no disponible por el momento intente de nuevo';
            console.error('Google Maps library failed to load after 10 retries');
            console.error('  Final state - google:', !!window.google, 'maps:', !!window.google?.maps);
            setMapError(errorMsg);
            setMapLoading(false);
            return;
          }
        }

        console.log('✅ Google Maps loaded, attempting to dynamically load visualization library...');
        
        // Use the modern importLibrary pattern to load visualization
        window.google.maps.importLibrary('visualization').then(() => {
          console.log('✅ Visualization library imported successfully');
          initializeMap();
        }).catch((error: any) => {
          console.error('❌ Failed to import visualization library:', error);
          const errorMsg = 'Mapa no disponible por el momento intente de nuevo';
          setMapError(errorMsg);
          setMapLoading(false);
        });

        const initializeMap = () => {
          // Priority: Use server coordinates > config coordinates > default Mexico City
          const defaultLat = 19.4326;
          const defaultLng = -99.1332;
          
          // Parse baseLat from config (might be string in localStorage)
          let lat = defaultLat;
          let lng = defaultLng;
          
          // Try server coordinates first
          if (typeof data?.metadata?.mapCenterLat === 'number' && isFinite(data.metadata.mapCenterLat)) {
            lat = data.metadata.mapCenterLat;
          } 
          // Try config coordinates (parse if string)
          else if (config?.baseLat !== null && config?.baseLat !== undefined) {
            const parsedLat = typeof config.baseLat === 'string' ? parseFloat(config.baseLat) : config.baseLat;
            if (typeof parsedLat === 'number' && isFinite(parsedLat)) {
              lat = parsedLat;
            }
          }
          
          // Same for longitude
          if (typeof data?.metadata?.mapCenterLng === 'number' && isFinite(data.metadata.mapCenterLng)) {
            lng = data.metadata.mapCenterLng;
          }
          else if (config?.baseLng !== null && config?.baseLng !== undefined) {
            const parsedLng = typeof config.baseLng === 'string' ? parseFloat(config.baseLng) : config.baseLng;
            if (typeof parsedLng === 'number' && isFinite(parsedLng)) {
              lng = parsedLng;
            }
          }
          
          const mapCenter = { lat, lng };

          console.log('Map center:', mapCenter);
          console.log('From server - mapCenterLat:', data?.metadata?.mapCenterLat, 'mapCenterLng:', data?.metadata?.mapCenterLng);
          console.log('From config - baseLat:', config?.baseLat, 'baseLng:', config?.baseLng);
          console.log('Final values - lat:', lat, 'lng:', lng);

          const gmap = new window.google.maps.Map(mapRef.current!, {
            zoom: 12,
            center: mapCenter,
            mapTypeId: 'roadmap',
          });

          // Create weighted heatmap data
          const heatmapWeightedData = heatmapData.map((point: any) => ({
            location: new window.google.maps.LatLng(point.lat, point.lng),
            weight: point.weight || 1,
          }));

          // Add heatmap layer
          const heatmap = new window.google.maps.visualization.HeatmapLayer({
            data: heatmapWeightedData,
            map: gmap,
            radius: 25,
            opacity: 0.6,
          });

          // Add markers for each zone
          heatmapData.forEach((point: any) => {
            const marker = new window.google.maps.Marker({
              position: { lat: point.lat, lng: point.lng },
              map: gmap,
              title: `${point.zone}: ${point.appointmentCount} citas`,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: Math.max(5, Math.min(15, point.weight / 10)),
                fillColor: '#4F46E5',
                fillOpacity: 0.7,
                strokeColor: '#fff',
                strokeWeight: 2,
              },
            });

            // Add info window
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 10px;">
                  <h3 style="margin: 0 0 5px 0; font-weight: bold;">${point.zone}</h3>
                  <p style="margin: 3px 0;">📍 Citas: ${point.appointmentCount}</p>
                </div>
              `,
            });

            marker.addListener('click', () => {
              infoWindow.open(gmap, marker);
            });
          });

          setMapInstance(gmap);
          setMapLoading(false);
        };
      };

      checkAndInit();
    };

    // Load Google Maps script if not already loaded
    if (!window.google) {
      console.log('Creating Google Maps script element...');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDl6n-tJJAv_Z5P0QjQsT-kD8tzfU8GfKQ`;
      script.async = true;
      
      script.onload = () => {
        console.log('✅ Google Maps script onload event fired');
        console.log('  window.google:', typeof window.google);
        console.log('  window.google.maps:', typeof window.google?.maps);
        console.log('  window.google.maps.importLibrary:', typeof window.google?.maps?.importLibrary);
        initMap();
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load Google Maps script from CDN');
        const errorMsg = 'Error al cargar Google Maps. Verifica tu conexión e intenta de nuevo.';
        setMapError(errorMsg);
        setMapLoading(false);
      };
      
      // Monitor when script is added to DOM
      console.log('Adding script to document.head');
      document.head.appendChild(script);
    } else {
      console.log('Google Maps already loaded, initializing map...');
      initMap();
    }

    return () => {
      if (scriptLoadTimeout) clearTimeout(scriptLoadTimeout);
    };
  }, [mapRef, heatmapData, config?.baseLat, config?.baseLng, data?.metadata?.mapCenterLat, data?.metadata?.mapCenterLng]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/clinic/reports"
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <FiArrowLeft size={24} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Mapa de Calor de Citas</h1>
            <p className="text-slate-600 mt-2">Distribución geográfica de citas y zonas de mayor demanda</p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mb-8 flex gap-2">
          {(['today', 'week', 'month', 'year'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setDateRange(period)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateRange === period
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {period === 'today' ? 'Hoy' : period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Año'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            Error al cargar datos: {error}
          </div>
        )}

        {loading && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
            Cargando mapa...
          </div>
        )}

        {data?.metadata?.homeAppointmentsOmitted > 0 && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
            <p className="font-semibold">⚠️ {data.metadata.homeAppointmentsMessage}</p>
            <p className="text-sm mt-1">Estos domicilios no tienen coordenadas verificadas y se han excluido del mapa de cobertura geográfica.</p>
          </div>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <KPICard
              icon={FiMap}
              metric={kpis.zonesCovered.value}
              label={kpis.zonesCovered.label}
              trend={{
                value: 0,
                direction: 'neutral' as const,
                period: kpis.zonesCovered.trending || '',
              }}
              color="success"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <KPICard
              icon={FiMap}
              metric={kpis.hottest.value}
              label={kpis.hottest.label}
              trend={{
                value: 0,
                direction: 'up' as const,
                period: kpis.hottest.trending || '',
              }}
              color="primary"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            <KPICard
              icon={FiMap}
              metric={kpis.clientsPerZone.value}
              label={kpis.clientsPerZone.label}
              trend={{
                value: 0,
                direction: 'neutral' as const,
                period: kpis.clientsPerZone.trending || '',
              }}
              color="info"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
          >
            <KPICard
              icon={FiMap}
              metric={kpis.citiesDensity.value}
              label={kpis.citiesDensity.label}
              trend={{
                value: 0,
                direction: 'neutral' as const,
                period: kpis.citiesDensity.trending || '',
              }}
              color="warning"
            />
          </motion.div>
        </div>

        {/* Map Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8"
        >
          <div className="mb-4">
            <h3 className="font-semibold text-slate-900">Mapa de Calor - Google Maps</h3>
            <p className="text-sm text-slate-600">Colores cálidos (rojo) = mayor densidad de citas | Colores fríos (azul) = menor densidad</p>
          </div>
          <div
            className="relative"
            style={{
              width: '100%',
              height: '500px',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              ref={mapRef}
              style={{
                width: '100%',
                height: '100%',
              }}
            />
            
            {mapLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
                  <p className="text-slate-600 font-medium">Cargando mapa...</p>
                </div>
              </div>
            )}

            {mapError && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
                <div className="text-center px-6">
                  <p className="text-lg font-semibold text-red-600 mb-4">{mapError}</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Zones Detail Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-900">Análisis por Zona</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <FiDownload size={16} />
              Descargar CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Zona</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">Clientes</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">Citas</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">Ingresos</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">Citas/Cliente</th>
                </tr>
              </thead>
              <tbody>
                {zones && zones.length > 0 ? (
                  zones.map((zone, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 text-sm text-slate-900 font-medium">{zone.zone}</td>
                      <td className="py-4 px-4 text-sm text-right text-slate-700">{zone.clientCount}</td>
                      <td className="py-4 px-4 text-sm text-right text-slate-700">{zone.appointmentCount}</td>
                      <td className="py-4 px-4 text-sm text-right text-slate-900 font-semibold">
                        ${zone.totalRevenue.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-4 px-4 text-sm text-right text-slate-700">{zone.appointmentsPerClient}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 px-4 text-center text-slate-500">
                      No hay datos disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
