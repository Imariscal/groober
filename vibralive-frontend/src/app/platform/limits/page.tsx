'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/dashboard/page-header/PageHeader';
import { MdEdit, MdDelete, MdAdd } from 'react-icons/md';

interface LimitConfig {
  id: string;
  planName: string;
  maxStaffUsers: number;
  maxClients: number;
  maxPets: number;
  status: 'active' | 'inactive';
}

export default function LimitsPage() {
  const [limits, setLimits] = useState<LimitConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch limits from API
    setIsLoading(false);
  }, []);

  const pageHeader = {
    title: 'Gestión de Límites',
    subtitle: 'Configura los límites de usuarios, clientes y mascotas por plan',
    breadcrumbs: [
      { label: 'Plataforma', href: '/platform/dashboard' },
      { label: 'Gestión de Límites' },
    ],
    primaryAction: {
      label: 'Nuevo Límite',
      onClick: () => {},
      icon: <MdAdd />,
    },
  };

  return (
    <>
      <PageHeader {...pageHeader} />
      <div className="grid grid-cols-1 gap-6">
        {/* Placeholder - TODO: Implement limits management */}
        <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg">
          <p>Módulo de Gestión de Límites en desarrollo</p>
        </div>
      </div>
    </>
  );
}
