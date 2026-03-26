'use client';

import React from 'react';
import {
  MdChevronLeft,
  MdChevronRight,
  MdFirstPage,
  MdLastPage,
  MdList,
} from 'react-icons/md';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const itemsPerPageOptions = [10, 20, 50, 100];
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8 bg-white rounded-2xl border border-gray-100 shadow-md p-4 sm:p-6 mt-8 transition-all duration-300 hover:shadow-lg">
      {/* Left section - Items per page selector */}
      <div className="flex items-center gap-2 sm:gap-3 order-2 sm:order-1">
        <div className="p-2 bg-blue-50 rounded-lg">
          <MdList className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex flex-col gap-0.5">
          <label htmlFor="items-per-page" className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
            Mostrar por página
          </label>
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(parseInt(e.target.value));
              onPageChange(1);
            }}
            className="px-3 py-2 bg-gradient-to-br from-blue-50 to-transparent border border-blue-200 rounded-lg text-sm font-bold text-blue-700 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-all duration-200"
          >
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center section - Item info */}
      <div className="order-1 sm:order-2">
        <div className="text-center">
          <div className="inline-block px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-gray-200">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
              Total de registros
            </div>
            <div className="text-sm sm:text-base text-gray-900">
              <span className="font-bold text-blue-600">{startItem}</span>
              <span className="text-gray-400 mx-1">–</span>
              <span className="font-bold text-blue-600">{endItem}</span>
              <span className="text-gray-400 mx-1">de</span>
              <span className="font-bold text-blue-600">{totalItems}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right section - Page navigation */}
      <div className="flex items-center gap-1 order-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-1.5 sm:p-2">
        {/* First page button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 sm:p-2.5 rounded-lg text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-all duration-200 active:scale-95"
          title="Primera página"
          aria-label="Primera página"
        >
          <MdFirstPage className="w-4 sm:w-5 h-4 sm:h-5" />
        </button>

        {/* Previous button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 sm:p-2.5 rounded-lg text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-all duration-200 active:scale-95"
          title="Página anterior"
          aria-label="Página anterior"
        >
          <MdChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-gray-300 mx-0.5 sm:mx-1"></div>

        {/* Page input section */}
        <div className="flex items-center gap-1 px-2">
          <input
            type="number"
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= totalPages) {
                onPageChange(page);
              }
            }}
            min={1}
            max={totalPages}
            className="w-10 sm:w-12 px-2 py-2 text-center text-xs sm:text-sm font-bold text-blue-600 bg-white rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
          <span className="text-xs text-gray-600 font-medium whitespace-nowrap">de {totalPages}</span>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-gray-300 mx-0.5 sm:mx-1"></div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 sm:p-2.5 rounded-lg text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-all duration-200 active:scale-95"
          title="Próxima página"
          aria-label="Próxima página"
        >
          <MdChevronRight className="w-4 sm:w-5 h-4 sm:h-5" />
        </button>

        {/* Last page button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 sm:p-2.5 rounded-lg text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-all duration-200 active:scale-95"
          title="Última página"
          aria-label="Última página"
        >
          <MdLastPage className="w-4 sm:w-5 h-4 sm:h-5" />
        </button>
      </div>
    </div>
  );
};
