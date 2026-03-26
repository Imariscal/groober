'use client';

import React from 'react';
import { FiX, FiInfo } from 'react-icons/fi';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: {
    name: string;
    channel: 'WHATSAPP' | 'EMAIL';
    body: string;
    description?: string;
    subject?: string;
  };
}

const TEMPLATE_VARIABLES = [
  { key: '{{clinicName}}', example: 'Mi Clínica de Mascotas' },
  { key: '{{clientName}}', example: 'Juan García' },
  { key: '{{petName}}', example: 'Luna' },
  { key: '{{appointmentDate}}', example: '15 de marzo de 2026' },
  { key: '{{appointmentTime}}', example: '10:30 AM' },
  { key: '{{clinicPhone}}', example: '+34 912 345 678' },
  { key: '{{clinicAddress}}', example: 'Calle Principal 123, Madrid' },
];

function getPreviewContent(content: string): string {
  let preview = content;
  TEMPLATE_VARIABLES.forEach(({ key, example }) => {
    preview = preview.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), example);
  });
  return preview;
}

export default function TemplatePreviewModal({
  isOpen,
  onClose,
  template,
}: TemplatePreviewModalProps) {
  if (!isOpen) return null;

  const previewContent = getPreviewContent(template.body);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between border-b border-indigo-700 flex-shrink-0">
            <div>
              <h3 className="font-bold text-lg text-white">{template.name}</h3>
              <p className="text-indigo-100 text-sm mt-0.5">Vista previa de plantilla</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-indigo-500 rounded-lg transition text-white flex-shrink-0"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content - Scrollable only if needed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Template Info */}
            <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                template.channel === 'WHATSAPP'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {template.channel === 'WHATSAPP' ? '📱' : '📧'} {template.channel}
              </span>
            </div>

            {/* Preview */}
            {template.channel === 'WHATSAPP' ? (
              // WhatsApp Preview
              <div className="bg-gradient-to-b from-green-50 to-blue-50 rounded-lg p-6 min-h-[300px]">
                <div className="max-w-sm mx-auto">
                  <div className="bg-[#ece5dd] rounded-lg p-4 shadow-sm">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {previewContent}
                      </p>
                      <p className="text-xs text-slate-400 text-right mt-2">10:30 AM</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Email Preview
              <div className="border-2 border-slate-200 rounded-lg overflow-hidden bg-white">
                {/* Email Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-600 font-semibold">De:</p>
                      <p className="text-sm text-slate-900">Mi Clínica de Mascotas</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-semibold">Asunto:</p>
                      <p className="text-sm font-medium text-slate-900">
                        {template.subject || '(Sin asunto)'}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Email Body */}
                <div className="p-6">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {previewContent}
                  </p>
                </div>
              </div>
            )}

            {/* Variables Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FiInfo className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-2">
                    Variables disponibles
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATE_VARIABLES.map(({ key, example }) => (
                      <div key={key} className="text-xs">
                        <code className="bg-white px-2 py-1 rounded border border-amber-200 text-amber-700 font-mono">
                          {key}
                        </code>
                        <p className="text-amber-700 mt-0.5">{example}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-amber-700 mt-3 italic">
                    Las variables se reemplazarán con datos reales al enviar la campaña.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end flex-shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
