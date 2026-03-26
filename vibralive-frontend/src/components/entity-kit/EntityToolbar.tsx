'use client';

import React from 'react';
import {
  MdSearch,
  MdRefresh,
  MdTableChart,
  MdViewAgenda,
  MdClose,
} from 'react-icons/md';
import { EntityToolbarConfig } from './types';

export interface EntityToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
  onRefresh: () => void;
  config: EntityToolbarConfig;
  stats?: {
    total: number;
    filtered: number;
  };
  sortOptions?: { value: string; label: string }[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  isLoading?: boolean;
}

/**
 * EntityToolbar - Compact unified toolbar
 * Clean design with search, sort, view toggle and refresh in one row
 */
export function EntityToolbar({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onRefresh,
  config,
  stats,
  sortOptions,
  sortValue,
  onSortChange,
  isLoading = false,
}: EntityToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2.5">
      {/* Left: Search + Stats */}
      <div className="flex items-center gap-3 flex-1">
        {/* Search Input */}
        <div className="flex-1 sm:max-w-xs">
          <MdSearch className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={config.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
              aria-label="Limpiar búsqueda"
            >
              <MdClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Stats Badge */}
        {stats && (
          <span className="hidden sm:inline text-xs text-gray-500 whitespace-nowrap">
            {stats.filtered === stats.total 
              ? `${stats.total} registros`
              : `${stats.filtered} de ${stats.total}`
            }
          </span>
        )}
      </div>

      {/* Right: Sort + View Toggle + Refresh */}
      <div className="flex gap-2 items-center">
        {/* Sort Select */}
        {sortOptions && sortOptions.length > 0 && (
          <select
            value={sortValue || 'name-asc'}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 hover:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {/* View Toggle */}
        {(config.enableViewToggle !== false) && (
          <div className="flex border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => onViewModeChange('cards')}
              className={`px-2 py-1.5 transition ${
                viewMode === 'cards'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
              title="Vista tarjetas"
            >
              <MdViewAgenda className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`px-2 py-1.5 transition border-l border-gray-200 ${
                viewMode === 'table'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
              title="Vista tabla"
            >
              <MdTableChart className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition disabled:opacity-50"
          aria-label="Refrescar"
        >
          <MdRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
