'use client';

import React, { useEffect, useState } from 'react';
import { FiX, FiActivity, FiUsers, FiTrendingUp, FiClock, FiMail } from 'react-icons/fi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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

interface CampaignReportDetailDrawerProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CampaignReportDetailDrawer({
  campaign,
  isOpen,
  onClose,
}: CampaignReportDetailDrawerProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && campaign) {
      loadMetrics();
    }
  }, [isOpen, campaign?.id]);

  async function loadMetrics() {
    if (!campaign) return;
    try {
      setIsLoading(true);
      const result = await campaignsApi.analytical?.(campaign.id) || null;
      if (result) {
        setMetrics(result);
      } else {
        // Fallback si el endpoint no existe
        setMetrics({
          delivery: {
            total: campaign.actualRecipients,
            sent: campaign.successfulCount,
            delivered: campaign.successfulCount,
            failed: campaign.failedCount,
          },
          engagement: {
            opened: campaign.openedCount,
            read: campaign.readCount,
            openRate: campaign.actualRecipients > 0 ? ((campaign.openedCount / campaign.actualRecipients) * 100) : 0,
            readRate: campaign.actualRecipients > 0 ? ((campaign.readCount / campaign.actualRecipients) * 100) : 0,
          },
        });
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen || !campaign) return null;

  const openRate = metrics?.engagement?.openRate || 0;
  const readRate = metrics?.engagement?.readRate || 0;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between border-b border-indigo-700">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white truncate">{campaign.name}</h2>
            <p className="text-indigo-100 text-sm mt-1">{campaign.channel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-indigo-500 rounded-lg transition text-white"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {campaign.description && (
            <div className="pb-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Descripción</h3>
              <p className="text-sm text-slate-600">{campaign.description}</p>
            </div>
          )}

          {/* Campaign Status & Dates */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Estado</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">{campaign.status}</p>
            </div>
            {campaign.startedAt && (
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Inicio</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {format(new Date(campaign.startedAt), 'dd MMM yyyy', { locale: es })}
                </p>
              </div>
            )}
          </div>

          {/* Delivery Metrics */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FiUsers className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Entrega</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-slate-600 uppercase">Total</p>
                <p className="text-2xl font-bold text-slate-900">
                  {isLoading ? '—' : campaign.actualRecipients}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 uppercase">Exitosos</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoading ? '—' : campaign.successfulCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 uppercase">Fallidos</p>
                <p className="text-2xl font-bold text-red-600">
                  {isLoading ? '—' : campaign.failedCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 uppercase">Tasa Éxito</p>
                <p className="text-2xl font-bold text-slate-900">
                  {isLoading
                    ? '—'
                    : `${campaign.actualRecipients > 0 ? Math.round((campaign.successfulCount / campaign.actualRecipients) * 100) : 0}%`}
                </p>
              </div>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FiTrendingUp className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-slate-900">Engagement</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-slate-600 uppercase">Abiertos</p>
                <p className="text-2xl font-bold text-purple-600">
                  {isLoading ? '—' : campaign.openedCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 uppercase">Leídos</p>
                <p className="text-2xl font-bold text-purple-600">
                  {isLoading ? '—' : campaign.readCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 uppercase">Tasa Apertura</p>
                <p className="text-2xl font-bold text-purple-600">
                  {isLoading ? '—' : `${openRate.toFixed(1)}%`}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 uppercase">Tasa Lectura</p>
                <p className="text-2xl font-bold text-purple-600">
                  {isLoading ? '—' : `${readRate.toFixed(1)}%`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
