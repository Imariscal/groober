'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiPlus, FiRefreshCw, FiSearch, FiChevronLeft, FiChevronRight, FiMail, FiClock, FiFilter, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import { MdVisibility, MdPlayArrow, MdPause } from 'react-icons/md';
import { campaignsApi, type Campaign } from '@/lib/campaigns-api';
import { CampaignFormModal } from '@/components/CampaignFormModal';
import { DeleteCampaignConfirmModal } from '@/components/DeleteCampaignConfirmModal';
import toast from 'react-hot-toast';

const statusColors: Record<Campaign['status'], { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-slate-100', text: 'text-slate-800' },
  SCHEDULED: { bg: 'bg-blue-100', text: 'text-blue-800' },
  RUNNING: { bg: 'bg-green-100', text: 'text-green-800' },
  COMPLETED: { bg: 'bg-purple-100', text: 'text-purple-800' },
  PAUSED: { bg: 'bg-orange-100', text: 'text-orange-800' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800' },
};

const statusLabels: Record<Campaign['status'], string> = {
  DRAFT: 'Borrador',
  SCHEDULED: 'Programada',
  RUNNING: 'En ejecución',
  COMPLETED: 'Completada',
  PAUSED: 'Pausada',
  CANCELLED: 'Cancelada',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Campaign['status'] | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deleteConfirmCampaign, setDeleteConfirmCampaign] = useState<Campaign | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const limit = 20;

  useEffect(() => {
    loadCampaigns();
  }, [page, statusFilter]);

  async function loadCampaigns() {
    try {
      setIsLoading(true);
      const result = await campaignsApi.listCampaigns(page, limit, statusFilter || undefined);
      setCampaigns(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(total / limit);

  const handleRefresh = () => {
    loadCampaigns();
  };

  async function handleStartCampaign(campaign: Campaign) {
    try {
      setActionLoading(campaign.id);
      await campaignsApi.startCampaign(campaign.id);
      toast.success('Campaña iniciada');
      loadCampaigns();
    } catch (err) {
      console.error('Error starting campaign:', err);
      toast.error('Error al iniciar la campaña');
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePauseCampaign(campaign: Campaign) {
    try {
      setActionLoading(campaign.id);
      await campaignsApi.pauseCampaign(campaign.id);
      toast.success('Campaña pausada');
      loadCampaigns();
    } catch (err) {
      console.error('Error pausing campaign:', err);
      toast.error('Error al pausar la campaña');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResumeCampaign(campaign: Campaign) {
    try {
      setActionLoading(campaign.id);
      await campaignsApi.resumeCampaign(campaign.id);
      toast.success('Campaña reanudada');
      loadCampaigns();
    } catch (err) {
      console.error('Error resuming campaign:', err);
      toast.error('Error al reanudar la campaña');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FiMail className="text-blue-600 text-3xl" />
              Campañas
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gestiona y monitorea tus campañas de marketing
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualizar"
            >
              <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* New Campaign Button */}
            <button
              onClick={() => setIsFormModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <FiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Campaña</span>
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
            <FiMail className="text-slate-500" />
            <span className="text-slate-600">Total:</span>
            <span className="font-semibold">{total}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-sm">
            <MdPlayArrow className="text-blue-600" />
            <span className="text-blue-700">En ejecución:</span>
            <span className="font-semibold text-blue-700">{campaigns.filter(c => c.status === 'RUNNING').length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg text-sm">
            <MdVisibility className="text-green-600" />
            <span className="text-green-700">Completadas:</span>
            <span className="font-semibold text-green-700">{campaigns.filter(c => c.status === 'COMPLETED').length}</span>
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
                  placeholder="Buscar campañas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-none focus:outline-none focus:ring-0 text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiFilter className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Estado</span>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setStatusFilter('');
                    setPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                    statusFilter === ''
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos los estados
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('DRAFT');
                    setPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                    statusFilter === 'DRAFT'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Borrador
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('SCHEDULED');
                    setPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                    statusFilter === 'SCHEDULED'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Programada
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('RUNNING');
                    setPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                    statusFilter === 'RUNNING'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  En ejecución
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('COMPLETED');
                    setPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                    statusFilter === 'COMPLETED'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Completada
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('PAUSED');
                    setPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                    statusFilter === 'PAUSED'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Pausada
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('CANCELLED');
                    setPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                    statusFilter === 'CANCELLED'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Cancelada
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Content */}
          <div className="lg:col-span-3">
            {/* Campaigns Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Canal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Destinatarios
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Entregadas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        <div className="inline-flex items-center gap-2">
                          <div className="animate-spin">
                            <FiRefreshCw className="w-5 h-5" />
                          </div>
                          <span>Cargando campañas...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        <div className="inline-flex items-center gap-2">
                          <FiMail className="w-5 h-5" />
                          <span>Sin campañas</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCampaigns.map((campaign) => (
                      <tr
                        key={campaign.id}
                        className="hover:bg-slate-50 transition cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          <span className="font-medium text-slate-900">{campaign.name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {campaign.channel === 'WHATSAPP' ? '📱 WhatsApp' : '📧 Email'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[campaign.status].bg} ${statusColors[campaign.status].text}`}>
                            {statusLabels[campaign.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900 font-medium">
                          {campaign.actualRecipients || campaign.estimatedRecipients}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                          {campaign.successfulCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {formatDistanceToNow(new Date(campaign.createdAt), { locale: es, addSuffix: true })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Start button - only for DRAFT/SCHEDULED */}
                            {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
                              <button
                                onClick={() => handleStartCampaign(campaign)}
                                disabled={actionLoading === campaign.id}
                                className="text-green-600 hover:text-green-800 transition disabled:opacity-50"
                                title="Iniciar campaña"
                              >
                                <MdPlayArrow className="w-5 h-5" />
                              </button>
                            )}

                            {/* Pause button - only for RUNNING */}
                            {campaign.status === 'RUNNING' && (
                              <button
                                onClick={() => handlePauseCampaign(campaign)}
                                disabled={actionLoading === campaign.id}
                                className="text-orange-600 hover:text-orange-800 transition disabled:opacity-50"
                                title="Pausar campaña"
                              >
                                <MdPause className="w-5 h-5" />
                              </button>
                            )}

                            {/* Resume button - only for PAUSED */}
                            {campaign.status === 'PAUSED' && (
                              <button
                                onClick={() => handleResumeCampaign(campaign)}
                                disabled={actionLoading === campaign.id}
                                className="text-blue-600 hover:text-blue-800 transition disabled:opacity-50"
                                title="Reanudar campaña"
                              >
                                <MdPlayArrow className="w-5 h-5" />
                              </button>
                            )}

                            {/* Edit button - pencil icon */}
                            <button
                              onClick={() => setEditingCampaign(campaign)}
                              className="text-blue-600 hover:text-blue-800 transition"
                              title="Editar campaña"
                            >
                              <FiEdit2 className="w-5 h-5" />
                            </button>
                            
                            {/* Delete button - trash icon (only for DRAFT) */}
                            {campaign.status === 'DRAFT' && (
                              <button
                                onClick={() => setDeleteConfirmCampaign(campaign)}
                                className="text-red-600 hover:text-red-800 transition"
                                title="Eliminar campaña"
                              >
                                <FiTrash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Anterior
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const startPage = Math.max(1, page - 2);
                  return startPage + i;
                }).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                      p === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Siguiente
                </button>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Link to Templates - Full Width */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700">
            ¿Necesitas crear o editar plantillas?{' '}
            <Link href="/clinic/communications/campaigns/templates" className="text-blue-600 font-semibold hover:underline">
              Gestionar plantillas
            </Link>
          </p>
        </div>
      </div>

      {/* Campaign Form Modal */}
      <CampaignFormModal
        isOpen={isFormModalOpen || editingCampaign !== null}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingCampaign(null);
        }}
        onSuccess={loadCampaigns}
        initialCampaign={editingCampaign}
      />

      {/* Delete Campaign Confirmation Modal */}
      <DeleteCampaignConfirmModal
        isOpen={deleteConfirmCampaign !== null}
        campaign={deleteConfirmCampaign}
        onClose={() => setDeleteConfirmCampaign(null)}
        onSuccess={loadCampaigns}
      />
    </div>
  );
}
