'use client';

import { MedicalAttachment } from '@/types/ehr';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MdAdd, MdDownload, MdInsertDriveFile, MdImage } from 'react-icons/md';
import { useState } from 'react';

interface AttachmentsTabProps {
  attachments: MedicalAttachment[];
  petId: string;
  onDataUpdated: () => Promise<void>;
}

export function AttachmentsTab({
  attachments,
  petId,
  onDataUpdated,
}: AttachmentsTabProps) {
  const [showNewForm, setShowNewForm] = useState(false);

  if (attachments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">No hay adjuntos médicos</p>
        <button
          onClick={() => setShowNewForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <MdAdd size={20} />
          Subir Archivo
        </button>
      </div>
    );
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <MdImage className="text-blue-600" size={24} />;
    }
    return <MdInsertDriveFile className="text-slate-600" size={24} />;
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">
          Adjuntos ({attachments.length})
        </h3>
        <button
          onClick={() => setShowNewForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
        >
          <MdAdd size={18} />
          Subir Archivo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition">
            <div className="flex items-start gap-3">
              {getFileIcon(attachment.file_type)}
              <div className="flex-1 min-w-0">
                <h5 className="font-semibold text-slate-900 break-words">
                  {attachment.file_name}
                </h5>
                {attachment.description && (
                  <p className="text-sm text-slate-600 mt-1">
                    {attachment.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-slate-500">
                    {formatFileSize(attachment.file_size_bytes)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {format(new Date(attachment.uploaded_at), 'd MMM', { locale: es })}
                  </p>
                </div>
              </div>
              <a
                href={attachment.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-primary-100 text-primary-600 rounded transition flex-shrink-0"
                title="Descargar"
              >
                <MdDownload size={20} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}