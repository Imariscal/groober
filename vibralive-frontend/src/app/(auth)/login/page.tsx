'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ModernLoginForm } from '@/components/ModernLoginForm';
import { DemoRequestForm } from '@/components/DemoRequestForm';
import { LoginLeftSideBranding } from '@/components/LoginLeftSideBranding';
import { LoginMobileHeader } from '@/components/LoginMobileHeader';
import { LoginFormHeader } from '@/components/LoginFormHeader';
import { LoginFormFooter } from '@/components/LoginFormFooter';
import { PublicBranding } from '@/types';
import { clinicConfigurationsApi } from '@/api/clinic-configurations-api';

type FormType = 'login' | 'demo';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const clinicParam = searchParams.get('clinic'); // ?clinic=my-clinic-slug
  
  const [formType, setFormType] = useState<FormType>('login');
  const [branding, setBranding] = useState<PublicBranding | null>(null);
  const [isLoading, setIsLoading] = useState(!!clinicParam);

  useEffect(() => {
    const loadBranding = async () => {
      if (!clinicParam) return;
      
      try {
        const data = await clinicConfigurationsApi.getPublicBranding(clinicParam);
        setBranding(data);
        
        // Update page title with brand name
        if (data.brandName) {
          document.title = `Iniciar Sesión - ${data.brandName}`;
        }
      } catch (err) {
        console.error('Error loading clinic branding:', err);
        // Fall back to default branding
      } finally {
        setIsLoading(false);
      }
    };

    loadBranding();
  }, [clinicParam]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <LoginLeftSideBranding branding={branding} />

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center px-6 sm:px-8 py-12 lg:py-0">
        <div className="w-full max-w-md">
          <LoginMobileHeader />

          {/* Header dinámico según el formulario */}
          {formType === 'login' ? (
            <LoginFormHeader />
          ) : (
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Solicitar Demo</h2>
              <p className="text-gray-600">Conoce {branding?.brandName || 'Groober'} de forma gratuita</p>
            </div>
          )}

          {/* Formulario dinámico */}
          {formType === 'login' ? <ModernLoginForm /> : <DemoRequestForm />}

          {/* Footer con botón de demo */}
          {formType === 'login' ? (
            <LoginFormFooter onDemoClick={() => setFormType('demo')} />
          ) : (
            <div className="mt-6 text-center">
              <button
                onClick={() => setFormType('login')}
                className="text-blue-600 font-semibold hover:text-blue-700 text-sm"
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
