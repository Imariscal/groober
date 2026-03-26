'use client';

import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import { format } from 'date-fns';
import { type ErrorItem } from '@/store/notificationStore';

interface NotificationErrorsProps {
  items: ErrorItem[];
}

export default function NotificationErrors({ items }: NotificationErrorsProps) {
  return (
    <div className="divide-y divide-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Fecha/Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Teléfono
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Mensaje
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Código de Error
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Detalles del Error
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  <div className="inline-flex items-center gap-2">
                    <FiAlertCircle className="w-5 h-5" />
                    <span>Sin errores</span>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-red-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    <div className="flex items-center space-x-2">
                      <FiAlertCircle className="w-4 h-4 text-red-500" />
                      <span>{format(new Date(item.dateTime), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {item.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {item.phoneNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 max-w-xs truncate">
                    {item.messagePreview}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {item.errorCode || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-sm">
                    <details className="cursor-pointer">
                      <summary className="font-medium text-red-700">
                        {item.errorMessage ? item.errorMessage.substring(0, 50) : 'Ver detalles'}...
                      </summary>
                      <p className="mt-2 text-xs">{item.errorMessage}</p>
                    </details>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
