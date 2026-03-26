import React from 'react';
import { SaleStatus } from '../stores/saleStore';

interface SaleStatusBadgeProps {
  status: SaleStatus;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const SaleStatusBadge: React.FC<SaleStatusBadgeProps> = ({
  status,
  size = 'md',
  showTooltip = true,
}) => {
  const config: Record<
    SaleStatus,
    {
      color: string;
      label: string;
      icon: string;
      tip: string;
      bgColor: string;
    }
  > = {
    DRAFT: {
      color: 'text-yellow-800',
      bgColor: 'bg-yellow-100',
      label: 'Borrador',
      icon: '📝',
      tip: 'Venta en edición - no afecta inventario',
    },
    COMPLETED: {
      color: 'text-green-800',
      bgColor: 'bg-green-100',
      label: 'Completada',
      icon: '✅',
      tip: 'Venta finalizada - inventario comprometido',
    },
    CANCELLED: {
      color: 'text-gray-800',
      bgColor: 'bg-gray-100',
      label: 'Cancelada',
      icon: '⛔',
      tip: 'Venta anulada - sin impacto en inventario',
    },
    REFUNDED: {
      color: 'text-blue-800',
      bgColor: 'bg-blue-100',
      label: 'Reembolsada',
      icon: '♻️',
      tip: 'Venta revertida - inventario restaurado',
    },
  };

  const cfg = config[status];
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <div
      className={`
        inline-flex items-center gap-2 rounded-full font-semibold
        border border-current ${cfg.color} ${cfg.bgColor} 
        ${sizeClasses[size]} 
        ${showTooltip ? 'cursor-help' : ''}
        transition-all duration-200
      `}
      title={showTooltip ? cfg.tip : undefined}
    >
      <span className="text-base">{cfg.icon}</span>
      <span>{cfg.label}</span>
    </div>
  );
};

export default SaleStatusBadge;
