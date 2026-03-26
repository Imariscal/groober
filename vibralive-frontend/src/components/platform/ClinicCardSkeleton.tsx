'use client';

import React from 'react';

export function ClinicCardSkeleton() {
  return (
    <div className="rounded-xl border-2 border-gray-200 overflow-hidden bg-white animate-pulse">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-300 to-gray-200 px-5 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-gray-400 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-400 rounded w-32" />
              <div className="h-3 bg-gray-400 rounded w-24" />
            </div>
          </div>
          <div className="w-10 h-10 bg-gray-400 rounded-lg" />
        </div>
        <div className="mt-3">
          <div className="h-6 bg-gray-400 rounded w-24" />
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 bg-gray-300 rounded" />
            <div className="h-4 bg-gray-300 rounded flex-1" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-100 border-t border-gray-200 flex items-center justify-between">
        <div className="h-4 bg-gray-300 rounded w-20" />
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-gray-300 rounded" />
          <div className="w-8 h-8 bg-gray-300 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ClinicCardSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <ClinicCardSkeleton key={i} />
      ))}
    </div>
  );
}

