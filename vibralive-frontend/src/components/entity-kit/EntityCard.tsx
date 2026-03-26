'use client';

import React from 'react';
import { MdMoreVert } from 'react-icons/md';
import { EntityCardModel, EntityAction } from './types';

export interface EntityCardProps {
  model: EntityCardModel;
  actions?: EntityAction[];
  onActionClick?: (action: EntityAction) => void;
  className?: string;
}

/**
 * EntityCard
 * Generic, reusable card component for displaying entity data
 * 
 * Structure:
 * - Header: avatar + title + status badge
 * - Body: fields grid (icon + label + value)
 * - Footer: action buttons
 */
export function EntityCard({
  model,
  actions = [],
  onActionClick,
  className = '',
}: EntityCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);

  const statusColorMap = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    neutral: 'bg-gray-100 text-gray-800',
  };

  const statusColor = model.status ? statusColorMap[model.status.color] : '';

  return (
    <div
      className={`
        rounded-xl border border-gray-200 overflow-hidden 
        hover:shadow-lg transition-all duration-300 
        bg-white
        ${className}
      `}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {model.avatar?.text ? (
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {model.avatar.text}
              </div>
            ) : model.avatar?.icon ? (
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-white">
                <model.avatar.icon className="w-5 h-5" />
              </div>
            ) : null}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-sm line-clamp-1">
                {model.title}
              </h3>
              {model.subtitle && (
                <p className="text-primary-100 text-xs">
                  {model.subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {model.status && (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${statusColor}`}>
                {model.status.label}
              </span>
            )}
            {actions.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  aria-label="Más opciones"
                >
                  <MdMoreVert className="w-5 h-5" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-max">
                    {actions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => {
                          onActionClick?.(action);
                          setShowMenu(false);
                        }}
                        className={`
                          w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors
                          first:rounded-t-lg last:rounded-b-lg
                          ${
                            action.variant === 'danger'
                              ? 'text-red-600 hover:bg-red-50'
                              : action.variant === 'secondary'
                                ? 'text-gray-600 hover:bg-gray-100'
                                : 'text-gray-700 hover:bg-gray-50'
                          }
                        `}
                      >
                        {action.icon && <action.icon className="w-4 h-4 flex-shrink-0" />}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body - Fields Grid */}
      {model.fields.length > 0 && (
        <div className="px-5 py-4 space-y-3 border-t border-gray-100">
          {model.fields.map((field, idx) => (
            <div key={idx} className="flex items-start gap-3">
              {field.icon && (
                <div className="text-gray-400 mt-0.5 flex-shrink-0">
                  <field.icon className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {field.label && (
                  <p className="text-xs text-gray-500 font-medium">{field.label}</p>
                )}
                <p className="text-sm text-gray-900 break-words">
                  {field.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer - Actions */}
      {model.actions && model.actions.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 flex-wrap">
          {model.actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`
                flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg 
                transition-colors
                ${
                  action.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50'
                    : action.variant === 'secondary'
                      ? 'text-gray-600 hover:bg-gray-50'
                      : 'text-primary-600 hover:bg-primary-50'
                }
              `}
            >
              {action.icon && <action.icon className="w-4 h-4" />}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


