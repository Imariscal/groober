'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ModernDashboardLayout } from '@/components/dashboard/ModernDashboardLayout';
import { PageHeader } from '@/components/dashboard/page-header/PageHeader';
import { TableToolbar } from '@/components/dashboard/table/TableEnhancements';
import { RowActionsMenu, makeRowActions } from '@/components/dashboard/table/TableEnhancements';
import { BulkActionBar } from '@/components/dashboard/table/TableEnhancements';
import { useDensityStore } from '@/hooks/useDensity';
import { FiDownload, FiEdit, FiEye, FiTrash2, FiCopy } from 'react-icons/fi';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  pets: number;
  lastVisit: string;
}

const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Juan Pérez', email: 'juan@example.com', phone: '+34 612 34 56 78', pets: 2, lastVisit: '2025-02-20' },
  { id: '2', name: 'María García', email: 'maria@example.com', phone: '+34 623 45 67 89', pets: 1, lastVisit: '2025-02-19' },
  { id: '3', name: 'Carlos López', email: 'carlos@example.com', phone: '+34 634 56 78 90', pets: 3, lastVisit: '2025-02-18' },
  { id: '4', name: 'Ana Martínez', email: 'ana@example.com', phone: '+34 645 67 89 01', pets: 1, lastVisit: '2025-02-17' },
  { id: '5', name: 'David Rodríguez', email: 'david@example.com', phone: '+34 656 78 90 12', pets: 2, lastVisit: '2025-02-16' },
];

export default function EnterpriseExamplePage() {
  const { density, getSpacing, getFontSize } = useDensityStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [filteredClients, setFilteredClients] = useState<Client[]>(MOCK_CLIENTS);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredClients(MOCK_CLIENTS);
    } else {
      setFilteredClients(
        MOCK_CLIENTS.filter(
          (client) =>
            client.name.toLowerCase().includes(query.toLowerCase()) ||
            client.email.toLowerCase().includes(query.toLowerCase())
        )
      );
    }
  };

  // Handle row selection
  const toggleRowSelection = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.size === filteredClients.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredClients.map((c) => c.id)));
    }
  };

  // Row actions
  const rowActions = makeRowActions({
    onEdit: (id) => console.log('Edit:', id),
    onView: (id) => console.log('View:', id),
    onDelete: (id) => console.log('Delete:', id),
    onCopy: (id) => console.log('Copy:', id),
  });

  return (
    <ModernDashboardLayout
      pageHeader={{
        title: 'Clientes',
        subtitle: 'Gestiona tu cartera de clientes',
        breadcrumbs: [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Clientes' },
        ],
        primaryAction: {
          label: 'Nuevo Cliente',
          onClick: () => console.log('Create new client'),
        },
        secondaryActions: [
          {
            label: 'Importar',
            icon: <FiDownload className="w-4 h-4" />,
            onClick: () => console.log('Import clients'),
            variant: 'secondary',
          },
        ],
      }}
    >
      {/* Info Card - Enterprise Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${getSpacing('card')} bg-blue-50 border border-blue-200 rounded-lg mb-8`}
      >
        <h3 className="font-semibold text-blue-900 mb-2">✨ Enterprise Panel Demo</h3>
        <p className="text-sm text-blue-800">
          Este ejemplo muestra todos los componentes del nuevo panel enterprise integrados. Prueba:
        </p>
        <ul className="text-sm text-blue-700 mt-3 space-y-1 list-disc list-inside">
          <li>Toggle de densidad en la barra superior (iconos de maximizar/minimizar)</li>
          <li>Búsqueda y filtrado en la tabla</li>
          <li>Seleccionar filas y acciones en masa</li>
          <li>Menú de acciones por fila (edit, view, delete, copy)</li>
          <li>Comportamiento responsive en móvil</li>
        </ul>
      </motion.div>

      {/* Density Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={`${getSpacing('card')} bg-slate-100 rounded-lg mb-8 border border-slate-200`}
      >
        <p className={`text-slate-700 font-medium`}>
          Modo actual: <span className="text-primary-600">{density === 'comfortable' ? 'Cómodo' : 'Compacto'}</span>
        </p>
        <p className={`text-slate-600 ${getFontSize('label')}`}>
          Haz clic en el botón de maximizar/minimizar en la barra superior para cambiar
        </p>
      </motion.div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-lg border border-slate-200 overflow-hidden"
      >
        {/* Toolbar */}
        <div className={`${getSpacing('row')} bg-slate-50 border-b border-slate-200 sticky top-0 z-10`}>
          <TableToolbar
            onSearch={handleSearch}
            onFilterClick={() => console.log('Filter')}
            onColumnsClick={() => console.log('Columns')}
            onExportClick={() => console.log('Export')}
          />
        </div>

        {/* Table Header */}
        <div
          className={`${getSpacing('row')} bg-slate-50 border-b border-slate-200 sticky top-16 z-10
            flex items-center gap-4 font-semibold text-slate-900`}
        >
          <input
            type="checkbox"
            checked={selectedRows.size === filteredClients.length && filteredClients.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded border-slate-300 cursor-pointer"
            aria-label="Seleccionar todos"
          />
          <div className="flex-1 grid grid-cols-4 gap-4 w-full">
            <div>Nombre</div>
            <div>Email</div>
            <div>Teléfono</div>
            <div>Mascotas</div>
          </div>
          <div className="w-12 text-center">Acciones</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-200">
          {filteredClients.map((client) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`${getSpacing('row')} bg-white hover:bg-slate-50 transition-colors duration-150
                flex items-center gap-4`}
            >
              <input
                type="checkbox"
                checked={selectedRows.has(client.id)}
                onChange={() => toggleRowSelection(client.id)}
                className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                aria-label={`Seleccionar ${client.name}`}
              />
              <div className="flex-1 grid grid-cols-4 gap-4 w-full">
                <div className={`font-medium text-slate-900 ${getFontSize('body')}`}>{client.name}</div>
                <div className={`text-slate-600 ${getFontSize('body')}`}>{client.email}</div>
                <div className={`text-slate-600 ${getFontSize('body')}`}>{client.phone}</div>
                <div className={`text-slate-600 ${getFontSize('body')}`}>{client.pets} mascotas</div>
              </div>

              {/* Row Actions */}
              <div className="w-12 flex justify-center">
                <RowActionsMenu actions={rowActions} rowId={client.id} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <div className={`${getSpacing('card')} text-center bg-slate-50 border-t border-slate-200`}>
            <p className="text-slate-500">No se encontraron clientes</p>
          </div>
        )}
      </motion.div>

      {/* Bulk Action Bar */}
      {selectedRows.size > 0 && (
        <BulkActionBar
          selectedCount={selectedRows.size}
          onDeselectAll={() => setSelectedRows(new Set())}
          actions={[
            {
              label: 'Editar',
              onClick: () => console.log('Bulk edit:', Array.from(selectedRows)),
              icon: <FiEdit className="w-4 h-4" />,
            },
            {
              label: 'Eliminar',
              onClick: () => console.log('Bulk delete:', Array.from(selectedRows)),
              variant: 'danger',
              icon: <FiTrash2 className="w-4 h-4" />,
            },
          ]}
        />
      )}

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`mt-8 grid grid-cols-1 md:grid-cols-3 gap-4`}
      >
        <div className={`${getSpacing('card')} bg-white rounded-lg border border-slate-200`}>
          <p className="text-slate-600 text-sm font-medium">Total Clientes</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">{MOCK_CLIENTS.length}</p>
        </div>

        <div className={`${getSpacing('card')} bg-white rounded-lg border border-slate-200`}>
          <p className="text-slate-600 text-sm font-medium">Total Mascotas</p>
          <p className="text-3xl font-bold text-success-600 mt-2">
            {MOCK_CLIENTS.reduce((sum, c) => sum + c.pets, 0)}
          </p>
        </div>

        <div className={`${getSpacing('card')} bg-white rounded-lg border border-slate-200`}>
          <p className="text-slate-600 text-sm font-medium">Seleccionados</p>
          <p className="text-3xl font-bold text-info-600 mt-2">{selectedRows.size}</p>
        </div>
      </motion.div>
    </ModernDashboardLayout>
  );
}
