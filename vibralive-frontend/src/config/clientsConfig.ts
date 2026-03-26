/**
 * Clients Configuration
 * Maps the Client entity to the EntityConfig<Client> pattern
 * This allows ClientsPage to use the generic EntityManagementPage component
 */

import { MdPerson, MdPhone, MdEmail, MdLocationOn, MdCheckCircle, MdHighlightOff, MdBlock } from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { Client } from '@/types';
import { EntityConfig, EntityCardModel, ColumnDef } from '@/components/entity-kit';

// Helper to format address from ClientAddress
const formatClientAddress = (client: Client): string | null => {
  const addr = client.addresses?.find(a => a.is_default) || client.addresses?.[0];
  if (!addr) return client.address || null;
  
  const parts = [
    addr.street,
    addr.number_ext && `#${addr.number_ext}`,
    addr.neighborhood,
    addr.city,
  ].filter(Boolean);
  return parts.join(', ');
};

/**
 * clientsConfig
 * Defines how Client entities are displayed and managed
 */
export const clientsConfig: EntityConfig<Client> = {
  // Metadata
  entityNameSingular: 'Cliente',
  entityNamePlural: 'Clientes',

  // Page header configuration
  pageHeader: {
    title: 'Gestión de Clientes',
    subtitle: 'Administra todos tus clientes en un solo lugar',
    breadcrumbs: [
      { label: 'Clínica', href: '/clinic' },
      { label: 'Gestión de Clientes' },
    ],
    primaryAction: {
      label: 'Nuevo Cliente',
      onClick: () => {}, // Will be overridden by page
      icon: undefined,
    },
  },

  // KPI calculations from data
  kpis: (data: Client[]) => [
    {
      label: 'Total de Clientes',
      value: data.length,
      icon: MdPerson,
      color: 'primary',
    },
    {
      label: 'Clientes Activos',
      value: data.length,
      icon: MdCheckCircle,
      color: 'success',
    },
    {
      label: 'Clientes Inactivos',
      value: 0,
      icon: MdHighlightOff,
      color: 'info',
    },
  ],

  // Card view adapter - transforms Client[] to EntityCardModel[]
  cardAdapter: (client: Client): EntityCardModel => {
    const initials = client.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const addressText = formatClientAddress(client);

    return {
      id: client.id,
      title: client.name,
      subtitle: `ID: ${client.id.slice(0, 8)}...`,
      avatar: {
        text: initials,
      },
      status: {
        label: client.do_not_contact ? 'No contactar' : 'Activo',
        color: client.do_not_contact ? 'danger' : 'success',
      },
      fields: [
        ...(client.phone
          ? [
              {
                icon: MdPhone,
                label: 'Teléfono',
                value: client.phone,
              },
            ]
          : []),
        ...(client.whatsapp_number
          ? [
              {
                icon: FaWhatsapp,
                label: 'WhatsApp',
                value: client.whatsapp_number,
              },
            ]
          : []),
        ...(client.email
          ? [
              {
                icon: MdEmail,
                label: 'Email',
                value: client.email,
              },
            ]
          : []),
        ...(addressText
          ? [
              {
                icon: MdLocationOn,
                label: 'Dirección',
                value: addressText,
              },
            ]
          : []),
      ],
      actions: [],
    };
  },

  // Table columns configuration
  tableColumns: [
    {
      key: 'name',
      label: 'Cliente',
      accessor: (client: Client) => {
        return client.name;
      },
      width: 'min-w-[180px]',
    },
    {
      key: 'phone',
      label: 'Teléfono',
      accessor: (client) => client.phone || '-',
      width: 'min-w-[140px]',
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      accessor: (client) => client.whatsapp_number || '-',
      width: 'min-w-[140px]',
    },
    {
      key: 'email',
      label: 'Correo',
      accessor: (client) => client.email || '-',
      width: 'min-w-[180px]',
    },
    {
      key: 'address',
      label: 'Dirección',
      accessor: (client) => formatClientAddress(client) || '-',
      width: 'min-w-[200px]',
    },
    {
      key: 'housing_type',
      label: 'Vivienda',
      accessor: (client) => {
        if (!client.housing_type) return '-';
        const types: Record<string, string> = {
          'HOUSE': 'Casa',
          'APARTMENT': 'Depto',
          'OTHER': 'Otro',
        };
        return types[client.housing_type] || '-';
      },
      width: 'min-w-[100px]',
    },
    {
      key: 'status',
      label: 'Estado',
      accessor: (client) => {
        if (client.do_not_contact) return '🚫 No contactar';
        const statusLabels: Record<string, string> = {
          'ACTIVE': '✅ Activo',
          'INACTIVE': '⏸️ Inactivo',
          'ARCHIVED': '📦 Archivado',
          'BLACKLISTED': '⛔ Bloqueado',
        };
        return statusLabels[client.status || 'ACTIVE'] || '✅ Activo';
      },
      width: 'min-w-[120px]',
    },
  ] as ColumnDef<Client>[],

  // Toolbar configuration
  toolbar: {
    searchPlaceholder: 'Buscar cliente, teléfono, dirección...',
    enableFilters: true,
    enableSort: true,
    enableViewToggle: true,
  },

  // Filter options
  filters: {
    sortOptions: [
      { label: 'Nombre A-Z', value: 'name-asc' },
      { label: 'Nombre Z-A', value: 'name-desc' },
      { label: 'Más recientes', value: 'created-desc' },
      { label: 'Más antiguos', value: 'created-asc' },
    ],
  },

  // View mode configuration
  defaultViewMode: 'cards',
  supportedViewModes: ['cards', 'table'],
};

/**
 * Mock data - Replace with real API call in production
 */
export const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Juan García',
    email: 'juan@example.com',
    phone: '+34 912-345-678',
    address: 'Madrid, España',
    clinic_id: 'clinic-1',
    notes: null,
    price_list_id: null,
    whatsapp_number: '+34 612-345-678',
    phone_secondary: null,
    preferred_contact_method: 'WHATSAPP',
    preferred_contact_time_start: null,
    preferred_contact_time_end: null,
    housing_type: 'HOUSE',
    access_notes: null,
    service_notes: null,
    do_not_contact: false,
    do_not_contact_reason: null,
    status: 'ACTIVE',
    tags: [],
    created_at: '2024-01-15',
    updated_at: '2024-01-15',
  },
  {
    id: 'client-2',
    name: 'María López',
    email: 'maria@example.com',
    phone: '+34 932-145-678',
    address: 'Barcelona, España',
    clinic_id: 'clinic-1',
    notes: null,
    price_list_id: null,
    whatsapp_number: null,
    phone_secondary: null,
    preferred_contact_method: 'PHONE',
    preferred_contact_time_start: null,
    preferred_contact_time_end: null,
    housing_type: 'APARTMENT',
    access_notes: null,
    service_notes: null,
    do_not_contact: false,
    do_not_contact_reason: null,
    status: 'ACTIVE',
    tags: [],
    created_at: '2024-01-16',
    updated_at: '2024-01-16',
  },
  {
    id: 'client-3',
    name: 'Carlos Martínez',
    email: 'carlos@example.com',
    phone: '+34 961-345-678',
    address: 'Valencia, España',
    clinic_id: 'clinic-1',
    notes: null,
    price_list_id: null,
    whatsapp_number: null,
    phone_secondary: null,
    preferred_contact_method: null,
    preferred_contact_time_start: null,
    preferred_contact_time_end: null,
    housing_type: null,
    access_notes: null,
    service_notes: null,
    do_not_contact: true,
    do_not_contact_reason: 'Solicitó no ser contactado',
    status: 'ACTIVE',
    tags: [],
    created_at: '2024-01-17',
    updated_at: '2024-01-17',
  },
];
