'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiPlay, FiPause, FiRefreshCw } from 'react-icons/fi';
import { campaignsApi, type Campaign } from '@/lib/campaigns-api';

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

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  useEffect(() => {
    loadCampaign();
  }, [campaignId]);

  async function loadCampaign() {
    try {
      setIsLoading(true);
      const data = await campaignsApi.getCampaign(campaignId);
      setCampaign(data);
      setError(null);
    } catch (err) {
      console.error('Error loading campaign:', err);
      setError('No se pudo cargar la campaña');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStartCampaign() {
    if (!campaign) return;
    try {
      setIsPerformingAction(true);
      const updated = await campaignsApi.startCampaign(campaignId);
      setCampaign(updated);
    } catch (err) {
      console.error('Error starting campaign:', err);
      setError('No se pudo iniciar la campaña');
    } finally {
      setIsPerformingAction(false);
    }
  }

  async function handlePauseCampaign() {
    if (!campaign) return;
    try {
      setIsPerformingAction(true);
      const updated = await campaignsApi.pauseCampaign(campaignId);
      setCampaign(updated);
    } catch (err) {
      console.error('Error pausing campaign:', err);
      setError('No se pudo pausar la campaña');
    } finally {
      setIsPerformingAction(false);
    }
  }

  async function handleResumeCampaign() {
    if (!campaign) return;
    try {
      setIsPerformingAction(true);
      const updated = await campaignsApi.resumeCampaign(campaignId);
      setCampaign(updated);
    } catch (err) {
      console.error('Error resuming campaign:', err);
      setError('No se pudo reanudar la campaña');
    } finally {
      setIsPerformingAction(false);
    }
  }

  if (isLoading) {
    return <div className="text-center py-12">Cargando campaña...</div>;
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-red-600 mb-4">{error || 'Campaña no encontrada'}</p>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 font-medium"
            >
              <FiArrowLeft className="w-4 h-4" />
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  const successRate = campaign.actualRecipients > 0 
    ? Math.round((campaign.successfulCount / campaign.actualRecipients) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
            {campaign.description && <p className="text-sm text-slate-500 mt-1">{campaign.description}</p>}
          </div>
          <span className={`px-4 py-2 rounded-full font-medium whitespace-nowrap ${statusColors[campaign.status].bg} ${statusColors[campaign.status].text}`}>
            {statusLabels[campaign.status]}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="space-y-6">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {/* Grid de información */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información General */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Información General</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Canal</p>
                  <span className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-slate-700 text-sm mt-1 font-medium">
                    {campaign.channel === 'WHATSAPP' ? '📱 WhatsApp' : '📧 Email'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Estado</p>
                  <p className="font-medium text-slate-900">{statusLabels[campaign.status]}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Fecha de creación</p>
                  <p className="font-medium text-slate-900">{new Date(campaign.createdAt).toLocaleDateString('es-MX')}</p>
                </div>
                {campaign.scheduledAt && (
                  <div>
                    <p className="text-sm text-slate-600">Programada para</p>
                    <p className="font-medium text-slate-900">{new Date(campaign.scheduledAt).toLocaleDateString('es-MX')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Métricas */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Métricas</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">Destinatarios estimados</span>
                  <span className="font-bold text-lg text-slate-900">{campaign.estimatedRecipients}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">Destinatarios reales</span>
                  <span className="font-bold text-lg text-slate-900">{campaign.actualRecipients}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">Entregadas</span>
                  <span className="font-bold text-lg text-green-600">{campaign.successfulCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">No entregadas</span>
                  <span className="font-bold text-lg text-red-600">{campaign.failedCount}</span>
                </div>
                {campaign.actualRecipients > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-slate-700">Tasa de éxito</span>
                    <span className="font-bold text-lg text-slate-900">{successRate}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Acciones</h2>
            <div className="flex gap-2 flex-wrap">
              {campaign.status === 'DRAFT' && (
                <>
                  <button
                    onClick={handleStartCampaign}
                    disabled={isPerformingAction}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition font-medium"
                  >
                    <FiPlay className="w-4 h-4" />
                    Iniciar campaña
                  </button>
                </>
              )}
              {campaign.status === 'SCHEDULED' && (
                <>
                  <button
                    onClick={handleStartCampaign}
                    disabled={isPerformingAction}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition font-medium"
                  >
                    <FiPlay className="w-4 h-4" />
                    Ejecutar ahora
                  </button>
                </>
              )}
              {campaign.status === 'RUNNING' && (
                <button
                  onClick={handlePauseCampaign}
                  disabled={isPerformingAction}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition font-medium"
                >
                  <FiPause className="w-4 h-4" />
                  Pausar
                </button>
              )}
              {campaign.status === 'PAUSED' && (
                <button
                  onClick={handleResumeCampaign}
                  disabled={isPerformingAction}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition font-medium"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  Reanudar
                </button>
              )}
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition text-slate-600 font-medium"
              >
                <FiArrowLeft className="w-4 h-4" />
                Volver
              </button>
            </div>
          </div>

          {/* Filtros aplicados */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Filtros de audiencia</h2>
            <pre className="bg-slate-50 p-4 rounded-lg text-xs overflow-auto text-slate-700 border border-slate-200">
              {JSON.stringify(campaign.filtersJson, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
