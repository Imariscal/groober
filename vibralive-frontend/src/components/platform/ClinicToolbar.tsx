'use client';

import React from 'react';
import {
  MdSearch,
  MdRefresh,
  MdAdd,
  MdTableChart,
  MdViewAgenda,
  MdTune,
  MdClose,
} from 'react-icons/md';

interface ClinicToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
  isLoading?: boolean;
  onRefresh: () => void;
  onCreateNew: () => void;
  totalClinics: number;
  filteredClinics: number;
}

export function ClinicToolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
  isLoading = false,
  onRefresh,
  onCreateNew,
  totalClinics,
  filteredClinics,
}: ClinicToolbarProps) {
  const [showFilters, setShowFilters] = React.useState(false);

  return (
    <div className="space-y-3">
      {/* Main Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search Input */}
        <div className="flex-1 w-full sm:max-w-sm">
          <MdSearch className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar clínica, teléfono, ciudad..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <MdClose className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 items-center w-full sm:w-auto">
          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg border transition flex items-center gap-2 text-sm font-medium ${
              showFilters
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MdTune className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>

          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => onViewModeChange('cards')}
              className={`px-3 py-2 transition ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title="Vista Cards"
            >
              <MdViewAgenda className="w-5 h-5" />
            </button>
            <div className="w-px bg-gray-300" />
            <button
              onClick={() => onViewModeChange('table')}
              className={`px-3 py-2 transition ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title="Vista Tabla"
            >
              <MdTableChart className="w-5 h-5" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            title="Actualizar"
          >
            <MdRefresh
              className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>

          {/* Create New Button */}
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2 text-sm font-medium"
          >
            <MdAdd className="w-5 h-5" />
            <span className="hidden sm:inline">Nueva</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">Todos los estados</option>
                <option value="ACTIVE">Activas</option>
                <option value="SUSPENDED">Suspendidas</option>
                <option value="DELETED">Eliminadas</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="name-asc">Nombre (A-Z)</option>
                <option value="name-desc">Nombre (Z-A)</option>
                <option value="created-desc">Más recientes</option>
                <option value="created-asc">Más antiguas</option>
                <option value="status">Estado</option>
              </select>
            </div>
          </div>

          {/* Clear filters button */}
          {(searchTerm || statusFilter !== 'all' || sortBy !== 'name-asc') && (
            <button
              onClick={() => {
                onSearchChange('');
                onStatusFilterChange('all');
                onSortByChange('name-asc');
                setShowFilters(false);
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="text-xs text-gray-600">
        Mostrando <span className="font-semibold">{filteredClinics}</span> de{' '}
        <span className="font-semibold">{totalClinics}</span> clínicas
      </div>
    </div>
  );
}
