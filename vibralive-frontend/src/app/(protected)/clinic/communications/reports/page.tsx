'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiFilter,
  FiSearch,
  FiMail,
  FiCheckCircle,
  FiUsers,
  FiBarChart2,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CampaignReportFiltersPanel, { CampaignReportFilters } from './CampaignReportFiltersPanel';
import CampaignReportDetailDrawer from './CampaignReportDetailDrawer';
import { campaignsApi } from '@/lib/campaigns-api';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: string;
  channel: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  actualRecipients: number;
  successfulCount: number;
  failedCount: number;
  openedCount: number;
  readCount: number;
}

const STATUS_MAP: Record<string, string> = {
  DRAFT: 'Borrador',
  SCHEDULED: 'Programada',
  RUNNING: 'En ejecución',
  COMPLETED: 'Completada',
  PAUSED: 'Pausada',
  CANCELLED: 'Cancelada',
};

const CHANNEL_COLORS: Record<string, string> = {
  WHATSAPP: 'bg-green-100 text-green-800',
  EMAIL: 'bg-blue-100 text-blue-800',
  SMS: 'bg-yellow-100 text-yellow-800',
};

export default function CampaignsReportsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<CampaignReportFilters>({
    status: 'ALL',
    channel: 'ALL',
  });
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'recipients'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load campaigns from API
  const loadCampaigns = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await campaignsApi.listCampaigns(1, 100);
      setCampaigns(response.data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Error al cargar campañas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...campaigns];

    if (filters.status !== 'ALL') {
      result = result.filter((c) => c.status === filters.status);
    }

    if (filters.channel !== 'ALL') {
      result = result.filter((c) => c.channel === filters.channel);
    }

    // Apply date filters
    if (filters.dateFrom) {
      const dateFromMs = new Date(filters.dateFrom).getTime();
      result = result.filter((c) => {
        const campaignDate = new Date(c.startedAt || c.scheduledAt || '').getTime();
        return campaignDate >= dateFromMs;
      });
    }

    if (filters.dateTo) {
      const dateToMs = new Date(filters.dateTo).getTime();
      // Add 1 day to include the entire "hasta" date
      const dateToEndOfDay = dateToMs + (24 * 60 * 60 * 1000);
      result = result.filter((c) => {
        const campaignDate = new Date(c.startedAt || c.scheduledAt || '').getTime();
        return campaignDate <= dateToEndOfDay;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let compareValue = 0;
      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'date':
          const dateA = new Date(a.startedAt || a.scheduledAt || '').getTime();
          const dateB = new Date(b.startedAt || b.scheduledAt || '').getTime();
          compareValue = dateA - dateB;
          break;
        case 'recipients':
          compareValue = a.actualRecipients - b.actualRecipients;
          break;
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    setFilteredCampaigns(result);
  }, [campaigns, filters, sortBy, sortOrder]);

  // Initial load
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleFilterApply = (newFilters: CampaignReportFilters) => {
    setFilters(newFilters);
  };

  const handleCampaignClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDrawerOpen(true);
  };

  const handleResetAll = () => {
    setFilters({
      status: 'ALL',
      channel: 'ALL',
      dateFrom: undefined,
      dateTo: undefined,
    });
    setSortBy('date');
    setSortOrder('desc');
  };

  // Calculate stats
  const stats = {
    total: campaigns.length,
    completed: campaigns.filter((c) => c.status === 'COMPLETED').length,
    inProgress: campaigns.filter((c) => c.status === 'RUNNING').length,
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-slate-100 text-slate-800',
      SCHEDULED: 'bg-blue-100 text-blue-800',
      RUNNING: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      PAUSED: 'bg-orange-100 text-orange-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FiMail className="text-blue-600 text-3xl" />
              Reportes de Campañas
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Monitor y analiza el desempeño de tus campañas de comunicación
            </p>
          </div>

          <button
            onClick={loadCampaigns}
            disabled={isLoading}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Actualizar"
          >
            <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
            <FiBarChart2 className="text-slate-500" />
            <span className="text-slate-600">Total:</span>
            <span className="font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg text-sm">
            <FiCheckCircle className="text-green-600" />
            <span className="text-green-700">Completadas:</span>
            <span className="font-semibold text-green-700">{stats.completed}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-lg text-sm">
            <FiUsers className="text-yellow-600" />
            <span className="text-yellow-700">En Ejecución:</span>
            <span className="font-semibold text-yellow-700">{stats.inProgress}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Filters */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
                <FiSearch className="text-slate-400 w-4 h-4 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar campaña..."
                  className="flex-1 border-none focus:outline-none focus:ring-0 text-sm"
                  disabled
                />
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiFilter className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Filtros</span>
              </div>
              <CampaignReportFiltersPanel onApply={handleFilterApply} onReset={handleResetAll} />
            </div>
          </div>

          {/* Right Panel - Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Table Header - Empty */}
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 min-h-12"></div>

              {/* Table Body */}
              {filteredCampaigns.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-slate-600">
                    {isLoading ? 'Cargando campañas...' : 'Sin campañas disponibles'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-slate-200">
                      <tr className="text-xs font-semibold text-slate-600 uppercase bg-slate-50">
                        <th className="px-6 py-3 text-left">Campaña</th>
                        <th className="px-6 py-3 text-left">Canal</th>
                        <th className="px-6 py-3 text-center">Inicio</th>
                        <th className="px-6 py-3 text-center">Término</th>
                        <th className="px-6 py-3 text-center">Destinatarios</th>
                        <th className="px-6 py-3 text-center">Exitosos</th>
                        <th className="px-6 py-3 text-center">Apertura %</th>
                        <th className="px-6 py-3 text-center">Estado</th>
                        <th className="px-6 py-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCampaigns.map((campaign) => {
                        const openRate =
                          campaign.actualRecipients > 0
                            ? ((campaign.openedCount / campaign.actualRecipients) * 100).toFixed(1)
                            : '0';
                        
                        const startDate = campaign.startedAt || campaign.scheduledAt;
                        const startDateFormatted = startDate ? format(new Date(startDate), 'dd MMM yyyy', { locale: es }) : '—';
                        const endDateFormatted = campaign.completedAt ? format(new Date(campaign.completedAt), 'dd MMM yyyy', { locale: es }) : '—';

                        return (
                          <tr
                            key={campaign.id}
                            className="border-b border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                            onClick={() => handleCampaignClick(campaign)}
                          >
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-slate-900">{campaign.name}</p>
                                {campaign.description && (
                                  <p className="text-xs text-slate-500 mt-1 truncate">
                                    {campaign.description}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                  CHANNEL_COLORS[campaign.channel] || 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {campaign.channel}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-sm text-slate-700">
                              {startDateFormatted}
                            </td>
                            <td className="px-6 py-4 text-center text-sm text-slate-700">
                              {endDateFormatted}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-semibold text-slate-900">
                                {campaign.actualRecipients}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-semibold text-green-600">
                                {campaign.successfulCount}
                              </span>
                              <span className="text-xs text-slate-500 ml-1">
                                (
                                {campaign.actualRecipients > 0
                                  ? Math.round(
                                      (campaign.successfulCount / campaign.actualRecipients) * 100
                                    )
                                  : 0}
                                %)
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-semibold text-purple-600">
                                {campaign.openedCount}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-semibold text-purple-600">{openRate}%</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                                  campaign.status
                                )}`}
                              >
                                {STATUS_MAP[campaign.status] || campaign.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCampaignClick(campaign);
                                }}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                              >
                                Ver detalles
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      <CampaignReportDetailDrawer
        campaign={selectedCampaign}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
