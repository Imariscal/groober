'use client';

import React from 'react';
import {
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdMoreVert,
  MdHome,
  MdBlock,
  MdAccessTime,
  MdStar,
  MdLocalOffer,
  MdEdit,
  MdDelete,
  MdPets,
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { Client } from '@/types';
import { EntityAction } from '@/components/entity-kit';

interface ClientCardProps {
  client: Client;
  actions?: EntityAction[];
  size?: 'S' | 'M' | 'L'; // S: 250px, M: 320px, L: 380px
  onActionClick?: (action: EntityAction) => void;
  onEdit?: (client: Client) => void;
  onDeactivate?: (client: Client) => void;
  onDelete?: (client: Client) => void;
}

const statusConfig = {
  ACTIVE: {
    bg: 'bg-white border-gray-200',
    badge: 'bg-green-500 text-white',
    label: 'Activo',
  },
  INACTIVE: {
    bg: 'bg-white border-gray-200',
    badge: 'bg-gray-400 text-white',
    label: 'Inactivo',
  },
  SUSPENDED: {
    bg: 'bg-white border-gray-200',
    badge: 'bg-red-500 text-white',
    label: 'Suspendido',
  },
  DELETED: {
    bg: 'bg-gray-50 border-gray-200',
    badge: 'bg-gray-500 text-white',
    label: 'Eliminado',
  },
};

const housingLabels: Record<string, string> = {
  HOUSE: 'Casa',
  APARTMENT: 'Departamento',
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

// Helper component for "No disponible" label
const NotAvailable = () => (
  <span className="text-[10px] text-gray-400 italic">No disponible</span>
);

/**
 * ClientCard - Fixed height, consistent layout
 * All fields shown with "No disponible" fallback
 */
export function ClientCard({
  client,
  actions = [],
  onActionClick,
  size = 'L',
  onEdit,
  onDeactivate,
  onDelete,
}: ClientCardProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const sizeMap = {
    S: 'h-64',    // 256px
    M: 'h-80',    // 320px
    L: 'h-96',    // 384px
  };

  // Get default address or first address
  const defaultAddress = client.addresses?.find(a => a.is_default) || client.addresses?.[0];
  const formatAddress = (addr: typeof defaultAddress) => {
    if (!addr) return null;
    const streetParts = [
      addr.street,
      addr.number_ext && `#${addr.number_ext}`,
    ].filter(Boolean).join(' ');
    const locationParts = [
      addr.neighborhood && `Col. ${addr.neighborhood}`,
      addr.city,
    ].filter(Boolean).join(', ');
    return [streetParts, locationParts].filter(Boolean).join(', ');
  };
  const addressText = formatAddress(defaultAddress) || client.address;

  const handleActionClick = (action: EntityAction) => {
    if (onActionClick) {
      onActionClick(action);
      return;
    }
    switch (action.id) {
      case 'edit':
        onEdit?.(client);
        break;
      case 'delete':
        onDelete?.(client);
        break;
    }
  };

  const status = (client.status || 'ACTIVE') as keyof typeof statusConfig;
  const config = statusConfig[status] || statusConfig.ACTIVE;
  const initials = client.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`rounded-lg border overflow-hidden transition-all hover:shadow-md ${sizeMap[size]} flex flex-col ${
      client.do_not_contact 
        ? 'bg-red-50 border-red-300 hover:border-red-400' 
        : `${config.bg} border-primary-200 hover:border-primary-200`
    }`}>
      {/* HEADER */}
      <div className={`${
        client.do_not_contact 
          ? 'bg-gradient-to-r from-red-600 to-red-700' 
          : 'bg-gradient-to-r from-primary-600 to-primary-700'
      } px-4 py-3 relative flex-shrink-0`}>
        {/* Status Badge */}
        <span className={`absolute top-3 right-12 px-2.5 py-0.5 rounded text-xs font-semibold ${config.badge}`}>
          {config.label}
        </span>

        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {initials}
          </div>
          
          {/* Name + ID */}
          <div className="flex-1 min-w-0 pr-10">
            <h3 className="font-bold text-white text-base leading-tight truncate">
              {client.name}
            </h3>
            <p className="text-white/60 text-xs font-mono mt-0.5">
              {client.id.slice(0, 8)}
            </p>
          </div>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setExpandedId(expandedId === client.id ? null : client.id)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition"
            >
              <MdMoreVert className="w-5 h-5" />
            </button>

            {expandedId === client.id && (
              <div className="absolute right-0 top-10 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-10 overflow-hidden">
                {actions.length > 0 ? (
                  actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        handleActionClick(action);
                        setExpandedId(null);
                      }}
                      className={`w-full px-3 py-2 text-left font-medium text-xs flex items-center gap-2 transition ${
                        action.id === 'delete' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {action.icon && <action.icon className="w-3.5 h-3.5" />}
                      {action.label}
                    </button>
                  ))
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onEdit?.(client);
                        setExpandedId(null);
                      }}
                      className="w-full px-3 py-2 text-left text-primary-600 hover:bg-primary-50 transition font-medium text-xs flex items-center gap-2"
                    >
                      <MdEdit className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        onDeactivate?.(client);
                        setExpandedId(null);
                      }}
                      className="w-full px-3 py-2 text-left text-orange-600 hover:bg-orange-50 transition font-medium text-xs flex items-center gap-2"
                    >
                      <MdBlock className="w-3.5 h-3.5" />
                      Desactivar
                    </button>
                    {/* TODO: Control visibility with RBAC permissions */}
                    <button
                      onClick={() => {
                        onDelete?.(client);
                        setExpandedId(null);
                      }}
                      className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 transition font-medium text-xs flex items-center gap-2 border-t border-gray-100"
                    >
                      <MdDelete className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Primary Contact Row - Teléfono y Email */}
        <div className="flex items-center gap-3 mt-2 text-white/95 text-xs">
          {client.phone ? (
            <a href={`tel:${client.phone}`} className="flex items-center gap-1 hover:text-white transition min-w-0">
              <MdPhone className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{client.phone}</span>
            </a>
          ) : (
            <div className="flex items-center gap-1 text-white/40">
              <MdPhone className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Sin teléfono</span>
            </div>
          )}
          {client.email && (
            <a href={`mailto:${client.email}`} className="flex items-center gap-1 hover:text-white transition min-w-0">
              <MdEmail className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate max-w-[120px]">{client.email}</span>
            </a>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="px-4 py-3 flex-1 flex flex-col gap-3 overflow-y-auto">
        
        {/* Contactos Secundarios - WhatsApp y Teléfono */}
        <div className="flex items-center gap-3 text-xs">
          {/* WhatsApp */}
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <FaWhatsapp className="w-4 h-4 text-green-500 flex-shrink-0" />
            {client.whatsapp_number ? (
              <a 
                href={`https://wa.me/${client.whatsapp_number.replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-700 hover:text-green-600 transition truncate"
              >
                {client.whatsapp_number}
              </a>
            ) : (
              <span className="text-gray-400 italic">No disponible</span>
            )}
          </div>
          {/* Secondary Phone */}
          {client.phone_secondary && (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <MdPhone className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <a 
                href={`tel:${client.phone_secondary}`} 
                className="text-gray-700 hover:text-orange-600 transition truncate"
              >
                {client.phone_secondary}
              </a>
            </div>
          )}
        </div>

        {/* UBICACIÓN */}
        {addressText && (
          <div className="text-xs">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Ubicación</p>
            <div className="flex items-start gap-1.5">
              <MdLocationOn className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <a 
                href={`https://www.google.com/maps/search/${encodeURIComponent(addressText)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                title={addressText}
                className="text-gray-700 hover:text-red-600 transition line-clamp-2 text-xs leading-snug"
              >
                {defaultAddress?.label && <span className="font-medium">{defaultAddress.label}: </span>}
                {addressText}
              </a>
            </div>
            {client.housing_type && (
              <div className="flex items-center gap-1.5 mt-1">
                <MdHome className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className="text-xs text-gray-700">{housingLabels[client.housing_type]}</span>
              </div>
            )}
          </div>
        )}

        {/* MASCOTAS - Importante */}
        {client.pets && client.pets.length > 0 && (
          <div className="text-xs">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Mascotas ({client.pets.length})</p>
            <div className="flex items-center gap-1 flex-wrap">
              {client.pets.slice(0, 4).map((pet) => (
                <span 
                  key={pet.id} 
                  className="px-2 py-0.5 bg-pink-50 text-pink-700 text-xs rounded font-medium flex items-center gap-0.5 whitespace-nowrap"
                  title={pet.species}
                >
                  <span>{petSpeciesEmoji[pet.species as keyof typeof petSpeciesEmoji] || '🐾'}</span>
                  <span className="truncate">{pet.name}</span>
                </span>
              ))}
              {client.pets.length > 4 && (
                <span className="px-1.5 py-0.5 text-gray-500 text-xs">+{client.pets.length - 4}</span>
              )}
            </div>
          </div>
        )}

        {/* PREFERENCIAS */}
        <div className="text-xs space-y-1">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Preferencias</p>
          <div className="flex items-center gap-1">
            <MdStar className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            {client.preferred_contact_method ? (
              <span className="text-gray-700">{contactMethodLabels[client.preferred_contact_method]}</span>
            ) : (
              <span className="text-gray-400 italic">No disponible</span>
            )}
          </div>
          {client.preferred_contact_time_start && (
            <div className="flex items-center gap-1">
              <MdAccessTime className="w-4 h-4 text-cyan-500 flex-shrink-0" />
              <span className="text-gray-700">
                {client.preferred_contact_time_start}
                {client.preferred_contact_time_end && ` - ${client.preferred_contact_time_end}`}
              </span>
            </div>
          )}
        </div>

        {/* TAGS - Al final */}
        {client.tags && client.tags.length > 0 && (
          <div className="text-xs mt-auto">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Tags</p>
            <div className="flex items-center gap-1 flex-wrap">
              {client.tags.slice(0, 3).map((tag) => (
                <span 
                  key={tag} 
                  className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded font-medium whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
              {client.tags.length > 3 && (
                <span className="px-1.5 py-0.5 text-gray-500 text-xs">+{client.tags.length - 3}</span>
              )}
            </div>
          </div>
        )}

        {/* DO NOT CONTACT Banner - at bottom */}
        {client.do_not_contact && (
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-red-50 border border-red-200 rounded mt-auto">
            <MdBlock className="w-4 h-4 text-red-500" />
            <span className="text-red-700 text-xs font-semibold">No contactar</span>
          </div>
        )}
      </div>
    </div>
  );
}


