'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { IconType } from 'react-icons';
import { FiArrowRight } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export interface ActivityItem {
  id: string;
  icon: IconType;
  title: string;
  description: string;
  timestamp: Date;
  type: 'success' | 'warning' | 'info' | 'critical';
  actionUrl?: string;
}

interface ActivityPanelProps {
  title?: string;
  items: ActivityItem[];
  isLoading?: boolean;
  onViewAll?: () => void;
  maxItems?: number;
}

const typeConfig = {
  success: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  info: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  critical: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
};

export function ActivityPanel({
  title = 'Actividad Reciente',
  items,
  isLoading = false,
  onViewAll,
  maxItems = 5,
}: ActivityPanelProps) {
  const displayItems = items.slice(0, maxItems);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
          >
            Ver todo
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ActivityPanelSkeleton />
        ) : displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <span className="text-2xl">📭</span>
            </div>
            <p className="text-sm text-slate-600 font-medium">Sin actividad reciente</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {displayItems.map((item, index) => {
              const config = typeConfig[item.type];
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-6 py-4 hover:bg-slate-50 transition-colors duration-150 group cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon Circle */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${config.bg}`}>
                      <Icon className={`w-5 h-5 ${config.text}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 leading-none mb-1">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-1 mb-1">
                        {item.description}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDistanceToNow(item.timestamp, {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>

                    {/* Arrow Action */}
                    {item.actionUrl && (
                      <FiArrowRight className="flex-shrink-0 w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors ml-2 mt-0.5" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer - View All Link */}
      {items.length > maxItems && onViewAll && (
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors"
          >
            Mostrar {items.length - maxItems} más →
          </button>
        </div>
      )}
    </div>
  );
}

// Skeleton Loader
function ActivityPanelSkeleton() {
  return (
    <div className="divide-y divide-slate-200">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="px-6 py-4 flex items-start gap-3 animate-pulse">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-200" />
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded w-32 mb-2" />
            <div className="h-3 bg-slate-200 rounded w-48 mb-2" />
            <div className="h-3 bg-slate-200 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty State Component
export function ActivityPanelEmpty({ onViewAll }: { onViewAll?: () => void }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <span className="text-2xl">📭</span>
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">Sin actividad</h3>
      <p className="text-xs text-slate-600 mb-4">No hay eventos recientes para mostrar</p>
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-primary-500 hover:text-primary-600"
        >
          Ver historial completo
        </button>
      )}
    </div>
  );
}
