'use client';

import React, { useEffect, useState } from 'react';
import { KPICard, KPICardSkeleton } from './KPICard';
import { ClientGrowthKPIs } from '@/types';
import { clientKPIsApi } from '@/api/client-kpis-api';
import {
  MdTrendingUp,
  MdPeople,
  MdCalendarToday,
  MdCheckCircle,
} from 'react-icons/md';

interface ClientGrowthKPIsSectionProps {
  showTitle?: boolean;
  compact?: boolean;
  className?: string;
}

export function ClientGrowthKPIsSection({
  showTitle = true,
  compact = false,
  className = '',
}: ClientGrowthKPIsSectionProps) {
  const [kpis, setKpis] = useState<ClientGrowthKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await clientKPIsApi.getGrowthKPIs();
        if (data) {
          setKpis(data);
        } else {
          setError('No se pudieron cargar los KPIs de crecimiento');
        }
      } catch (err: any) {
        console.error('[ClientGrowthKPIsSection] Error:', err);
        setError(err.message || 'Error al cargar los KPIs');
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  // Render skeletons while loading
  if (loading) {
    return (
      <div className={className}>
        {showTitle && (
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-900">Crecimiento de Clientes</h3>
            <p className="text-slate-600 text-sm mt-1">Métricas de registro y actividad de clientes</p>
          </div>
        )}
        <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'} gap-4`}>
          {[...Array(compact ? 3 : 4)].map((_, i) => (
            <KPICardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !kpis) {
    return (
      <div className={className}>
        {showTitle && (
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-900">Crecimiento de Clientes</h3>
          </div>
        )}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm font-medium">{error || 'No se pudieron cargar los KPIs'}</p>
        </div>
      </div>
    );
  }

  // Calculate growth trend
  const growthTrend = {
    value: kpis.growthPercentage,
    direction: kpis.growthPercentage >= 0 ? ('up' as const) : ('down' as const),
    period: 'vs mes anterior',
  };

  // Determine trend colors based on growth
  const growthColor = kpis.growthPercentage >= 0 ? 'success' : 'warning';

  return (
    <div className={className}>
      {showTitle && (
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-slate-900">Crecimiento de Clientes</h3>
          <p className="text-slate-600 text-sm mt-1">Métricas de registro y actividad de clientes</p>
        </div>
      )}

      <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'} gap-4`}>
        {/* New Clients Today */}
        <KPICard
          icon={MdCalendarToday}
          metric={kpis.newClientsToday}
          label="Nuevos Hoy"
          color="primary"
        />

        {/* New Clients This Week */}
        <KPICard
          icon={MdPeople}
          metric={kpis.newClientsThisWeek}
          label="Esta Semana"
          color="info"
        />

        {/* New Clients This Month */}
        <KPICard
          icon={MdTrendingUp}
          metric={kpis.newClientsThisMonth}
          label="Este Mes"
          trend={growthTrend}
          color={growthColor}
        />

        {/* Active Clients */}
        {!compact && (
          <KPICard
            icon={MdCheckCircle}
            metric={kpis.activeClients}
            label="Activos"
            color="success"
          />
        )}
      </div>

      {/* Secondary metrics row (optional, if not compact) */}
      {!compact && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Daily Average */}
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-5 border border-cyan-200">
            <p className="text-cyan-700 font-semibold text-sm uppercase tracking-wider">Promedio Diario</p>
            <p className="text-3xl font-bold text-cyan-900 mt-2">
              {kpis.dailyAverage.toFixed(1)}
            </p>
            <p className="text-xs text-cyan-600 mt-2">clientes por día</p>
          </div>

          {/* Total Clients */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5 border border-indigo-200">
            <p className="text-indigo-700 font-semibold text-sm uppercase tracking-wider">Total de Clientes</p>
            <p className="text-3xl font-bold text-indigo-900 mt-2">
              {kpis.totalClients}
            </p>
            <p className="text-xs text-indigo-600 mt-2">registrados</p>
          </div>

          {/* Last Month Context */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
            <p className="text-orange-700 font-semibold text-sm uppercase tracking-wider">Mes Anterior</p>
            <p className="text-3xl font-bold text-orange-900 mt-2">
              {kpis.clientsLastMonth}
            </p>
            <p className="text-xs text-orange-600 mt-2">clientes registrados</p>
          </div>
        </div>
      )}
    </div>
  );
}
