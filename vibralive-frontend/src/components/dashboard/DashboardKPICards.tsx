'use client';

import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MdTrendingUp, MdTrendingDown } from 'react-icons/md';

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  color: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'indigo';
}

const colorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200' },
  red: { bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-200' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-900', border: 'border-indigo-200' },
};

export const RevenueKPICard: React.FC<KPICardProps> = ({
  label,
  value,
  unit = 'MXN',
  trend,
  trendLabel,
  color,
}) => {
  const colors = colorMap[color];
  const isTrendUp = trend && trend > 0;

  return (
    <div className={`${colors.bg} rounded-xl border ${colors.border} p-6 shadow-sm`}>
      <p className={`${colors.text} text-sm font-semibold uppercase tracking-wide opacity-75`}>
        {label}
      </p>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className={`${colors.text} text-3xl font-bold`}>
            ${typeof value === 'number' ? value.toLocaleString('es-MX', { maximumFractionDigits: 0 }) : value}
          </p>
          <p className={`${colors.text} text-xs opacity-60 mt-1`}>{unit}</p>
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className="flex items-center gap-1">
            {isTrendUp ? (
              <MdTrendingUp className={`text-emerald-600 w-5 h-5`} />
            ) : (
              <MdTrendingDown className={`text-red-600 w-5 h-5`} />
            )}
            <span className={`${isTrendUp ? 'text-emerald-600' : 'text-red-600'} font-semibold text-sm`}>
              {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
      {trendLabel && <p className={`${colors.text} text-xs opacity-60 mt-2`}>{trendLabel}</p>}
    </div>
  );
};

interface ChartProps {
  data: any[];
  title: string;
  type?: 'line' | 'bar';
}

export const SimpleLineChart: React.FC<ChartProps> = ({ data, title }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '0.5rem', color: '#f1f5f9' }}
          />
          <Legend wrapperStyle={{ paddingTop: '1rem' }} />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} name="Valor" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SimpleBarChart: React.FC<ChartProps> = ({ data, title }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '0.5rem', color: '#f1f5f9' }} />
          <Legend wrapperStyle={{ paddingTop: '1rem' }} />
          <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} name="Valor" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const LoadingSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-40 bg-white rounded-xl border border-slate-100 animate-pulse" />
    ))}
  </>
);
