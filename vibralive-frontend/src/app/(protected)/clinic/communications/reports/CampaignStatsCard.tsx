'use client';

import React from 'react';
import { FiActivity, FiTrendingUp, FiUsers, FiCheck } from 'react-icons/fi';

interface CampaignStats {
  totalCampaigns: number;
  completedCampaigns: number;
  totalRecipientsReached: number;
  averageOpenRate: number;
  averageReadRate: number;
}

interface CampaignStatsCardProps {
  stats: CampaignStats;
  isLoading?: boolean;
}

interface StatBoxProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: string;
  unit?: string;
  isLoading?: boolean;
}

function StatBox({ icon: Icon, label, value, color, unit = '', isLoading = false }: StatBoxProps) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${color}`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium opacity-75">{label}</p>
        <p className="text-lg font-bold">
          {isLoading ? '—' : value}
          {unit && <span className="text-sm ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}

export default function CampaignStatsCard({ stats, isLoading = false }: CampaignStatsCardProps) {

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <StatBox
        icon={FiActivity}
        label="Total Campañas"
        value={stats.totalCampaigns}
        color="bg-slate-100 text-slate-700"
        isLoading={isLoading}
      />
      <StatBox
        icon={FiCheck}
        label="Completadas"
        value={stats.completedCampaigns}
        color="bg-green-100 text-green-700"
        isLoading={isLoading}
      />
      <StatBox
        icon={FiUsers}
        label="Destinatarios"
        value={stats.totalRecipientsReached}
        color="bg-blue-100 text-blue-700"
        isLoading={isLoading}
      />
      <StatBox
        icon={FiTrendingUp}
        label="Tasa Apertura"
        value={stats.averageOpenRate.toFixed(1)}
        color="bg-purple-100 text-purple-700"
        unit="%"
        isLoading={isLoading}
      />
      <StatBox
        icon={FiTrendingUp}
        label="Tasa Lectura"
        value={stats.averageReadRate.toFixed(1)}
        color="bg-orange-100 text-orange-700"
        unit="%"
        isLoading={isLoading}
      />
    </div>
  );
}
