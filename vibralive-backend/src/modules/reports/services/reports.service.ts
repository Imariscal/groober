import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportsService {
  /**
   * Normalize date range based on period parameter
   */
  getNormalizeDateRange(period: string = 'month'): {
    startDate: Date;
    endDate: Date;
  } {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    switch (period) {
      case 'today':
        return { startDate: startOfDay, endDate: endOfDay };

      case 'week': {
        const weekStart = new Date(startOfDay);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return { startDate: weekStart, endDate: weekEnd };
      }

      case 'month': {
        const monthStart = new Date(startOfDay);
        monthStart.setDate(1);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);
        return { startDate: monthStart, endDate: monthEnd };
      }

      case 'year': {
        const yearStart = new Date(startOfDay);
        yearStart.setMonth(0);
        yearStart.setDate(1);
        const yearEnd = new Date(startOfDay);
        yearEnd.setMonth(11);
        yearEnd.setDate(31);
        yearEnd.setHours(23, 59, 59, 999);
        return { startDate: yearStart, endDate: yearEnd };
      }

      default:
        return { startDate: startOfDay, endDate: endOfDay };
    }
  }

  /**
   * Format number as currency
   */
  formatCurrency(amount: number, currency: string = 'MXN'): string {
    const formatted = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
    return formatted;
  }

  /**
   * Calculate percentage change between two values
   */
  calculatePercentageChange(current: number, previous: number): string {
    if (previous === 0) return '0%';
    const change = ((current - previous) / previous) * 100;
    const direction = change >= 0 ? '↑' : '↓';
    return `${direction} ${Math.abs(Math.round(change))}%`;
  }
}
