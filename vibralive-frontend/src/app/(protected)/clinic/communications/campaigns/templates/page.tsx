'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiGrid, FiList, FiEye } from 'react-icons/fi';
import { campaignTemplatesApi, type CampaignTemplate } from '@/lib/campaigns-api';
import { TemplateFormModal } from '@/components/TemplateFormModal';
import { DeleteTemplateConfirmModal } from '@/components/DeleteTemplateConfirmModal';
import TemplatePreviewModal from './TemplatePreviewModal';
import toast from 'react-hot-toast';

const channelLabels: Record<'WHATSAPP' | 'EMAIL', string> = {
  WHATSAPP: 'WhatsApp',
  EMAIL: 'Email',
};

const channelIcons: Record<'WHATSAPP' | 'EMAIL', string> = {
  WHATSAPP: '📱',
  EMAIL: '📧',
};

const channelColors: Record<'WHATSAPP' | 'EMAIL', { bg: string; text: string; border: string }> = {
  WHATSAPP: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  EMAIL: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

export default function CampaignTemplatesPage() {
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<'WHATSAPP' | 'EMAIL' | ''>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CampaignTemplate | null>(null);
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState<CampaignTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<CampaignTemplate | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await campaignTemplatesApi.listTemplates(
        1,
        100,
        channelFilter || undefined,
      );
      setTemplates(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
      toast.error('Error al cargar plantillas');
    } finally {
      setIsLoading(false);
    }
  }, [channelFilter]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleCreateNew = useCallback(() => {
    setEditingTemplate(null);
    setIsFormModalOpen(true);
  }, []);

  const handleEditTemplate = useCallback((template: CampaignTemplate) => {
    setEditingTemplate(template);
    setIsFormModalOpen(true);
  }, []);

  const handleFormModalSuccess = useCallback(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleOpenDeleteModal = useCallback((template: CampaignTemplate) => {
    setDeleteConfirmTemplate(template);
  }, []);

  const handleDeleteSuccess = useCallback(() => {
    loadTemplates();
  }, [loadTemplates]);

  const filteredTemplates = templates
    .filter((template) => template.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((template) => !channelFilter || template.channel === channelFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 -m-6 lg:-m-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Plantillas de Campaña</h1>
            <p className="text-sm text-slate-600 mt-1">
              {filteredTemplates.length} plantilla{filteredTemplates.length !== 1 ? 's' : ''} disponible{filteredTemplates.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                title="Vista en grid"
              >
                <FiGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                title="Vista en lista"
              >
                <FiList className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-2.5 rounded-lg transition font-medium shadow-sm"
            >
              <FiPlus className="w-5 h-5" />
              Nueva Plantilla
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-4 gap-6' : 'space-y-4'}>
          {/* Left Panel - Filters */}
          <div className={viewMode === 'grid' ? 'lg:col-span-1 space-y-4' : ''}>
            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
                <FiSearch className="text-slate-400 w-4 h-4 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar plantillas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-none focus:outline-none focus:ring-0 text-sm"
                />
              </div>
            </div>

            {/* Channel Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Canal</span>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setChannelFilter('')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    channelFilter === ''
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  🎯 Todos los canales
                </button>
                <button
                  onClick={() => setChannelFilter('WHATSAPP')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    channelFilter === 'WHATSAPP'
                      ? 'bg-green-100 text-green-700 shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  📱 WhatsApp
                </button>
                <button
                  onClick={() => setChannelFilter('EMAIL')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    channelFilter === 'EMAIL'
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                  }`}
                >
                  📧 Email
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Content */}
          <div className={viewMode === 'grid' ? 'lg:col-span-3' : 'w-full'}>
            {isLoading ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <p className="text-slate-600 font-medium">Cargando plantillas...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="mb-3 text-4xl">📋</div>
                <p className="text-slate-600 font-medium">No hay plantillas disponibles</p>
                <p className="text-slate-500 text-sm mt-1">Crea una nueva plantilla para comenzar</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'}>
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`${
                      viewMode === 'grid'
                        ? 'flex flex-col'
                        : 'flex items-start justify-between'
                    } bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition p-5 group`}
                  >
                    {/* Card Header */}
                    <div className="flex-1 w-full">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition truncate">
                            {template.name}
                          </h3>
                          {template.description && (
                            <p className="text-slate-600 text-sm mt-1 line-clamp-1">{template.description}</p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 ${
                            channelColors[template.channel].bg
                          } ${channelColors[template.channel].text} border ${
                            channelColors[template.channel].border
                          }`}
                        >
                          {channelIcons[template.channel]} {channelLabels[template.channel]}
                        </span>
                      </div>

                      {/* Preview */}
                      <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Vista previa</p>
                        <p className="text-slate-700 text-sm line-clamp-2 leading-relaxed">
                          {template.body}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="w-full flex items-center justify-between pt-3 border-t border-slate-200">
                      <span className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(template.createdAt), { locale: es, addSuffix: true })}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPreviewTemplate(template)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Vista previa"
                        >
                          <FiEye className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Editar"
                        >
                          <FiEdit2 className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(template)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar"
                        >
                          <FiTrash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          template={{
            name: previewTemplate.name,
            channel: previewTemplate.channel as 'WHATSAPP' | 'EMAIL',
            body: previewTemplate.body,
            description: previewTemplate.description,
          }}
        />
      )}

      {/* Modal */}
      <TemplateFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingTemplate(null);
        }}
        onSuccess={handleFormModalSuccess}
        template={editingTemplate || undefined}
      />

      {/* Delete Confirmation Modal */}
      <DeleteTemplateConfirmModal
        isOpen={!!deleteConfirmTemplate}
        template={deleteConfirmTemplate}
        onClose={() => setDeleteConfirmTemplate(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
