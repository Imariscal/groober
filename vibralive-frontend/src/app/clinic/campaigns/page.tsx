'use client';

import React, { useState } from 'react';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiTrash2, FiEdit } from 'react-icons/fi';
import { ModernDashboardLayout } from '@/components/dashboard/ModernDashboardLayout';

interface Campaign {
  id: string;
  name: string;
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
  channel: 'WHATSAPP' | 'EMAIL';
  estimatedRecipients: number;
  actualRecipients: number;
  successfulCount: number;
  failedCount: number;
  createdAt: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || campaign.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    'DRAFT': 'bg-slate-100 text-slate-700',
    'SCHEDULED': 'bg-blue-100 text-blue-700',
    'RUNNING': 'bg-green-100 text-green-700',
    'COMPLETED': 'bg-emerald-100 text-emerald-700',
    'PAUSED': 'bg-yellow-100 text-yellow-700',
    'CANCELLED': 'bg-red-100 text-red-700',
  };

  const channelIcons: Record<string, string> = {
    'WHATSAPP': '💬',
    'EMAIL': '📧',
  };

  return (
    <ModernDashboardLayout
      title="Campañas"
      breadcrumbs={[
        { label: 'Dashboard', href: '/clinic/dashboard' },
        { label: 'Campañas', href: '/clinic/campaigns' },
      ]}
      ctaLabel="Nueva Campaña"
      ctaHref="/clinic/campaigns/create"
    >
      <div className="space-y-6">
        {/* Header with Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
          <div className="flex gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
              <FiSearch className="text-slate-400 w-5 h-5 flex-shrink-0" />
              <input
                type="text"
                placeholder="Buscar campañas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border-none focus:outline-none focus:ring-0"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="DRAFT">Borrador</option>
              <option value="SCHEDULED">Programada</option>
              <option value="RUNNING">En ejecución</option>
              <option value="COMPLETED">Completada</option>
              <option value="PAUSED">Pausada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>
        </div>

        {/* Empty State */}
        {filteredCampaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 border border-slate-200 text-center">
            <div className="text-slate-400 mb-2">
              <div className="text-4xl mb-2">📧</div>
              <h3 className="text-lg font-medium text-slate-900">No hay campañas</h3>
              <p className="text-slate-500 mt-1">
                Crea tu primera campaña de email o WhatsApp para comenzar
              </p>
            </div>
            <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              + Nueva Campaña
            </button>
          </div>
        ) : (
          /* Campaigns Table */
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Campaña</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Canal</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Estado</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Destinatarios</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Exitosas</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Fallidas</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{campaign.name}</p>
                        <p className="text-sm text-slate-500">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xl">{channelIcons[campaign.channel]}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          statusColors[campaign.status]
                        }`}
                      >
                        {campaign.status === 'DRAFT' && 'Borrador'}
                        {campaign.status === 'SCHEDULED' && 'Programada'}
                        {campaign.status === 'RUNNING' && 'En ejecución'}
                        {campaign.status === 'COMPLETED' && 'Completada'}
                        {campaign.status === 'PAUSED' && 'Pausada'}
                        {campaign.status === 'CANCELLED' && 'Cancelada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {campaign.actualRecipients} de {campaign.estimatedRecipients}
                    </td>
                    <td className="px-6 py-4 text-sm text-green-600 font-medium">
                      {campaign.successfulCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600 font-medium">
                      {campaign.failedCount}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="inline-flex items-center justify-center p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">
                        <FiMoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ModernDashboardLayout>
  );
}
