'use client';

import React, { useEffect, useState } from 'react';
import { PermissionGateRoute } from '@/components/PermissionGateRoute';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { ClinicConfiguration, ClinicCalendarException, CreateCalendarExceptionPayload } from '@/types';
import { clinicConfigurationsApi } from '@/api/clinic-configurations-api';
import { ConfigurationTab } from '@/components/ConfigurationTab';
import { CalendarExceptionsTab } from '@/components/CalendarExceptionsTab';
import { BrandingTab } from '@/components/BrandingTab';
import { BillingConfigTab } from '@/components/configurations/BillingConfigTab';
import { EmailConfigTab } from '@/components/configurations/EmailConfigTab';
import { WhatsAppConfigTab } from '@/components/configurations/WhatsAppConfigTab';
import { MessageTemplatesTab } from '@/components/configurations/MessageTemplatesTab';
import { StylistAvailabilityTab } from '@/components/configurations/StylistAvailabilityTab';
import { VeterinarianAvailabilityTab } from '@/components/configurations/VeterinarianAvailabilityTab';
import toast from 'react-hot-toast';

type TabType = 'configuration' | 'exceptions' | 'branding' | 'billing' | 'email' | 'whatsapp' | 'templates' | 'stylists' | 'veterinarians';

interface SubMenuItem {
  id: TabType;
  label: string;
  disabled: boolean;
}

const SUB_MENU: SubMenuItem[] = [
  { id: 'configuration', label: 'Configuración', disabled: false },
  { id: 'exceptions', label: 'Días festivos', disabled: false },
  { id: 'stylists', label: 'Estilistas', disabled: false },
  { id: 'veterinarians', label: 'Veterinarios', disabled: false },
  { id: 'billing', label: 'Facturación', disabled: false },
  { id: 'email', label: 'Email', disabled: false },
  { id: 'whatsapp', label: 'WhatsApp', disabled: false },
  { id: 'templates', label: 'Plantillas', disabled: false },
  { id: 'branding', label: 'Branding', disabled: false },
];

function ConfigurationsPageContent() {
  const { has } = usePermissions();
  const [activeTab, setActiveTab] = useState<TabType>('configuration');
  const [config, setConfig] = useState<ClinicConfiguration | null>(null);
  const [exceptions, setExceptions] = useState<ClinicCalendarException[]>([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isLoadingExceptions, setIsLoadingExceptions] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Load configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoadingConfig(true);
        const data = await clinicConfigurationsApi.getConfiguration();
        setConfig(data);
      } catch (error) {
        console.error('Error loading configuration:', error);
        toast.error('Error al cargar la configuración');
      } finally {
        setIsLoadingConfig(false);
      }
    };
    loadConfig();
  }, []);

  // Load exceptions when switching to that tab
  useEffect(() => {
    if (activeTab === 'exceptions') {
      loadExceptions();
    }
  }, [activeTab]);

  const loadExceptions = async () => {
    try {
      setIsLoadingExceptions(true);
      const now = new Date();
      const from = `${now.getFullYear()}-01-01`;
      const to = `${now.getFullYear()}-12-31`;
      const data = await clinicConfigurationsApi.getExceptions(from, to);
      setExceptions(data);
    } catch (error) {
      console.error('Error loading exceptions:', error);
      toast.error('Error al cargar los días festivos');
    } finally {
      setIsLoadingExceptions(false);
    }
  };

  const handleSaveConfiguration = async (updatedConfig: Partial<ClinicConfiguration>) => {
    setIsSavingConfig(true);
    try {
      const data = await clinicConfigurationsApi.updateConfiguration(updatedConfig);
      setConfig(data);
      // ✅ Also update localStorage for instant access across the app
      if (typeof window !== 'undefined') {
        localStorage.setItem('clinic_configuration', JSON.stringify(data));
      }
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleAddException = async (payload: CreateCalendarExceptionPayload) => {
    await clinicConfigurationsApi.createException(payload);
    await loadExceptions();
  };

  const handleUpdateException = async (
    id: string,
    payload: Partial<ClinicCalendarException>,
  ) => {
    await clinicConfigurationsApi.updateException(id, {
      date: payload.date,
      type: payload.type,
      startTime: payload.startTime,
      endTime: payload.endTime,
      reason: payload.reason,
    });
    await loadExceptions();
  };

  const handleDeleteException = async (id: string) => {
    await clinicConfigurationsApi.deleteException(id);
    await loadExceptions();
  };

  if (isLoadingConfig || !config) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mi Clínica</h1>
        <p className="text-gray-600">Administra la configuración operativa de tu clínica</p>
      </div>

      {/* Main Container - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Sub Menu */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <nav className="space-y-2">
              {SUB_MENU.map((item) => (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && setActiveTab(item.id)}
                  disabled={item.disabled}
                  className={`w-full text-left px-4 py-3 rounded-lg transition font-medium text-sm ${
                    activeTab === item.id && !item.disabled
                      ? 'bg-primary-100 text-primary-700 border-l-4 border-primary-600'
                      : item.disabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Right Content - Tab Content */}
        <div className="lg:col-span-3">
          {activeTab === 'configuration' && (
            <ConfigurationTab
              config={config}
              isSaving={isSavingConfig}
              onSave={handleSaveConfiguration}
            />
          )}

          {activeTab === 'exceptions' && (
            <CalendarExceptionsTab
              exceptions={exceptions}
              isLoading={isLoadingExceptions}
              onAdd={handleAddException}
              onUpdate={handleUpdateException}
              onDelete={handleDeleteException}
            />
          )}

          {activeTab === 'stylists' && <StylistAvailabilityTab />}

          {activeTab === 'veterinarians' && <VeterinarianAvailabilityTab />}

          {activeTab === 'billing' && <BillingConfigTab />}

          {activeTab === 'email' && <EmailConfigTab />}

          {activeTab === 'whatsapp' && <WhatsAppConfigTab />}

          {activeTab === 'templates' && <MessageTemplatesTab />}

          {activeTab === 'branding' && <BrandingTab />}
        </div>
      </div>
    </div>
  );
}

export default function ConfigurationsPage() {
  return (
    <PermissionGateRoute permissions={['clinic:settings']}>
      <ConfigurationsPageContent />
    </PermissionGateRoute>
  );
}
