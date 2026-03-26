'use client';

import React from 'react';
import { FiX, FiCopy, FiExternalLink } from 'react-icons/fi';
import { format } from 'date-fns';
import { type NotificationDetail } from '@/store/notificationStore';

interface NotificationDetailDrawerProps {
  notification: NotificationDetail;
  onClose: () => void;
}

export default function NotificationDetailDrawer({
  notification,
  onClose,
}: NotificationDetailDrawerProps) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 py-6">
        <div className="mx-auto max-w-2xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Detalle de Notificación
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Client Info */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Información del Cliente</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Nombre</p>
                  <p className="text-sm text-gray-900 mt-1">{notification.clientName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Teléfono</p>
                  <p className="text-sm text-gray-900 mt-1">{notification.phoneNumber}</p>
                </div>
              </div>
            </section>

            {/* Message Info */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Información del Mensaje</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Tipo</p>
                  <p className="text-sm text-gray-900 mt-1">{notification.messageType}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Dirección</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {notification.direction === 'inbound' ? 'Entrante' : 'Saliente'}
                  </p>
                </div>
              </div>
            </section>

            {/* Message Body */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Contenido del Mensaje</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {notification.fullMessageBody}
                </p>
              </div>
            </section>

            {/* Timestamps */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Línea de Tiempo</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">Creado</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                  </p>
                </div>
                {notification.sentAt && (
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Enviado</p>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(notification.sentAt), 'dd/MM/yyyy HH:mm:ss')}
                    </p>
                  </div>
                )}
                {notification.deliveredAt && (
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Entregado</p>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(notification.deliveredAt), 'dd/MM/yyyy HH:mm:ss')}
                    </p>
                  </div>
                )}
                {notification.readAt && (
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Leído</p>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(notification.readAt), 'dd/MM/yyyy HH:mm:ss')}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* WhatsApp IDs */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">IDs WhatsApp</h3>
              {notification.whatsappMessageId && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Message ID (wamid)</p>
                    <p className="text-sm text-gray-900 font-mono">{notification.whatsappMessageId}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(notification.whatsappMessageId!)}
                    className="ml-2 p-2 text-gray-400 hover:text-gray-600"
                    title={copied ? 'Copiado!' : 'Copiar'}
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>
                </div>
              )}
            </section>

            {/* Error Info */}
            {notification.errorCode && (
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Error</h3>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-red-600 uppercase">Código</p>
                      <p className="text-sm text-red-900 mt-1">{notification.errorCode}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-600 uppercase">Detalles</p>
                      <p className="text-sm text-red-900 mt-1">{notification.errorMessage}</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Payload JSON */}
            {notification.payloadJson && (
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Payload JSON</h3>
                <details className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <summary className="cursor-pointer font-medium text-gray-700 text-sm">
                    Mostrar payload completo
                  </summary>
                  <pre className="mt-4 text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(notification.payloadJson, null, 2)}
                  </pre>
                </details>
              </section>
            )}

            {/* Related Records */}
            {(notification.relatedReminderId || notification.relatedAppointmentId) && (
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Registros Relacionados</h3>
                <div className="space-y-2">
                  {notification.relatedReminderId && (
                    <a
                      href={`/clinic/reminders/${notification.relatedReminderId}`}
                      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                    >
                      <span className="text-sm font-medium text-blue-900">Ver Recordatorio</span>
                      <FiExternalLink className="w-4 h-4 text-blue-600" />
                    </a>
                  )}
                  {notification.relatedAppointmentId && (
                    <a
                      href={`/clinic/appointments/${notification.relatedAppointmentId}`}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
                    >
                      <span className="text-sm font-medium text-green-900">Ver Cita</span>
                      <FiExternalLink className="w-4 h-4 text-green-600" />
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
