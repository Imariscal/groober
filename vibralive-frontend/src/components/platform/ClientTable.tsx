'use client';

import React from 'react';
import {
  MdEdit,
  MdDelete,
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdHome,
  MdStar,
  MdAccessTime,
  MdBlock,
  MdLocalOffer,
  MdPets,
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { Client } from '@/types';

interface ClientTableProps {
  clients: Client[];
  onEdit?: (client: Client) => void;
  onDeactivate?: (client: Client) => void;
  onDelete?: (client: Client) => void;
}

// Helper to format address from addresses array
const formatDefaultAddress = (client: Client): string | null => {
  const addr = client.addresses?.find(a => a.is_default) || client.addresses?.[0];
  if (!addr) return client.address || null;
  
  const parts = [
    addr.street,
    addr.number_ext && `#${addr.number_ext}`,
    addr.neighborhood && `Col. ${addr.neighborhood}`,
    addr.city,
  ].filter(Boolean);
  return parts.join(', ');
};

// Helper to get address label
const getAddressLabel = (client: Client): string | null => {
  const addr = client.addresses?.find(a => a.is_default) || client.addresses?.[0];
  return addr?.label || null;
};

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Activo' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Inactivo' },
  SUSPENDED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Suspendido' },
  BLACKLISTED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Bloqueado' },
};

const housingLabels: Record<string, string> = {
  HOUSE: 'Casa',
  APARTMENT: 'Depto',
  OTHER: 'Otro',
};

const contactMethodLabels: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  PHONE: 'Teléfono',
  EMAIL: 'Email',
  SMS: 'SMS',
};

// Pet species emoji mapping
const petSpeciesEmoji: Record<string, string> = {
  DOG: '🐕',
  CAT: '🐱',
  BIRD: '🐦',
  RABBIT: '🐰',
  HAMSTER: '🐹',
  GUINEA_PIG: '🐹',
  FISH: '🐟',
  TURTLE: '🐢',
  FERRET: '🦡',
  OTHER: '🐾',
};

/**
 * ClientTable
 * Enhanced table with comprehensive client information
 * UI/UX optimized for scannability and actionability
 */
export function ClientTable({
  clients,
  onEdit,
  onDeactivate,
  onDelete,
}: ClientTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50/80 border-b border-gray-200">
          <tr>
            <th className="px-3 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Cliente
            </th>
            <th className="px-3 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Contacto
            </th>
            <th className="px-3 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Dirección
            </th>
            <th className="px-3 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Preferencias
            </th>
            <th className="px-3 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Tags
            </th>
            <th className="px-3 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Mascotas
            </th>
            <th className="px-3 py-2.5 text-center font-medium text-gray-600 text-xs uppercase tracking-wide w-24">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {clients.map((client) => {
            const status = statusConfig[client.status || 'ACTIVE'] || statusConfig.ACTIVE;
            const addressText = formatDefaultAddress(client);
            const addressLabel = getAddressLabel(client);

            return (
              <tr key={client.id} className={`transition group ${
                client.do_not_contact
                  ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500'
                  : 'hover:bg-blue-50/30 border-l-4 border-l-transparent'
              }`}>
                {/* CLIENTE - Name, ID, Status */}
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{client.name}</span>
                      {client.do_not_contact && (
                        <MdBlock className="w-4 h-4 text-red-500" title="No contactar" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-mono">
                        {client.id.slice(0, 8)}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                </td>

                {/* CONTACTO - Phone, WhatsApp, Secondary, Email */}
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-1 max-w-[200px]">
                    {/* Primary Phone */}
                    <a
                      href={client.phone ? `tel:${client.phone}` : undefined}
                      className={`flex items-center gap-1.5 ${client.phone ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400'}`}
                    >
                      <MdPhone className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-xs truncate">{client.phone || '-'}</span>
                    </a>
                    
                    {/* WhatsApp */}
                    <a
                      href={client.whatsapp_number ? `https://wa.me/${client.whatsapp_number.replace(/[^0-9]/g, '')}` : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1.5 ${client.whatsapp_number ? 'text-green-600 hover:text-green-800' : 'text-gray-400'}`}
                    >
                      <FaWhatsapp className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-xs truncate">{client.whatsapp_number || '-'}</span>
                    </a>

                    {/* Secondary Phone (only if exists) */}
                    {client.phone_secondary && (
                      <a
                        href={`tel:${client.phone_secondary}`}
                        className="flex items-center gap-1.5 text-orange-500 hover:text-orange-700"
                      >
                        <MdPhone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs truncate">{client.phone_secondary}</span>
                      </a>
                    )}

                    {/* Email */}
                    <a
                      href={client.email ? `mailto:${client.email}` : undefined}
                      className={`flex items-center gap-1.5 ${client.email ? 'text-teal-600 hover:text-teal-800' : 'text-gray-400'}`}
                    >
                      <MdEmail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-xs truncate">{client.email || '-'}</span>
                    </a>
                  </div>
                </td>

                {/* DIRECCIÓN - Address + Housing Type */}
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-1 max-w-[250px]">
                    {/* Address */}
                    <a
                      href={addressText ? `https://www.google.com/maps/search/${encodeURIComponent(addressText)}` : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={addressText || undefined}
                      className={`flex items-start gap-1.5 ${addressText ? 'text-gray-700 hover:text-red-600' : 'text-gray-400'}`}
                    >
                      <MdLocationOn className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-red-500" />
                      <span className="text-xs line-clamp-2 leading-tight">
                        {addressLabel && <span className="font-semibold">{addressLabel}: </span>}
                        {addressText || '-'}
                      </span>
                    </a>

                    {/* Housing Type */}
                    <div className="flex items-center gap-1.5">
                      <MdHome className="w-3.5 h-3.5 flex-shrink-0 text-purple-500" />
                      <span className={`text-xs ${client.housing_type ? 'text-gray-600' : 'text-gray-400'}`}>
                        {housingLabels[client.housing_type || ''] || '-'}
                      </span>
                    </div>
                  </div>
                </td>

                {/* PREFERENCIAS - Method + Time */}
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-1">
                    {/* Preferred Method */}
                    <div className="flex items-center gap-1.5">
                      <MdStar className="w-3.5 h-3.5 flex-shrink-0 text-yellow-500" />
                      <span className={`text-xs ${client.preferred_contact_method ? 'text-gray-600' : 'text-gray-400'}`}>
                        {contactMethodLabels[client.preferred_contact_method || ''] || '-'}
                      </span>
                    </div>

                    {/* Preferred Time */}
                    <div className="flex items-center gap-1.5">
                      <MdAccessTime className="w-3.5 h-3.5 flex-shrink-0 text-cyan-500" />
                      <span className={`text-xs ${client.preferred_contact_time_start ? 'text-gray-600' : 'text-gray-400'}`}>
                        {client.preferred_contact_time_start 
                          ? `${client.preferred_contact_time_start}${client.preferred_contact_time_end ? ` - ${client.preferred_contact_time_end}` : ''}`
                          : '-'
                        }
                      </span>
                    </div>
                  </div>
                </td>

                {/* TAGS */}
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {client.tags && client.tags.length > 0 ? (
                      <>
                        {client.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-medium rounded"
                          >
                            <MdLocalOffer className="w-2.5 h-2.5" />
                            {tag}
                          </span>
                        ))}
                        {client.tags.length > 2 && (
                          <span className="text-[10px] text-gray-500 font-medium">
                            +{client.tags.length - 2}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                </td>

                {/* MASCOTAS */}
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {client.pets && client.pets.length > 0 ? (
                      <>
                        {client.pets.slice(0, 2).map((pet, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-pink-100 text-pink-700 text-[10px] font-medium rounded"
                            title={pet.species}
                          >
                            <span className="text-xs">{petSpeciesEmoji[pet.species as keyof typeof petSpeciesEmoji] || '🐾'}</span>
                            {pet.name}
                          </span>
                        ))}
                        {client.pets.length > 2 && (
                          <span className="text-[10px] text-gray-500 font-medium">
                            +{client.pets.length - 2}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                </td>

                {/* ACCIONES */}
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-center gap-1 relative">
                    {/* Quick Action Buttons */}
                    <button
                      onClick={() => onEdit?.(client)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition opacity-60 group-hover:opacity-100"
                      title="Editar"
                    >
                      <MdEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeactivate?.(client)}
                      className="p-1.5 text-orange-600 hover:bg-orange-100 rounded-lg transition opacity-60 group-hover:opacity-100"
                      title="Desactivar"
                    >
                      <MdBlock className="w-4 h-4" />
                    </button>
                    {/* TODO: Control visibility with RBAC permissions */}
                    <button
                      onClick={() => onDelete?.(client)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition opacity-60 group-hover:opacity-100"
                      title="Eliminar permanentemente"
                    >
                      <MdDelete className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
