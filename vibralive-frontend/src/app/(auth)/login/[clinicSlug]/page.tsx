'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ModernLoginForm } from '@/components/ModernLoginForm';
import { DemoRequestForm } from '@/components/DemoRequestForm';
import { LoginLeftSideBranding } from '@/components/LoginLeftSideBranding';
import { LoginMobileHeader } from '@/components/LoginMobileHeader';
import { LoginFormHeader } from '@/components/LoginFormHeader';
import { LoginFormFooter } from '@/components/LoginFormFooter';
import { PublicBranding } from '@/types';
import { clinicConfigurationsApi } from '@/api/clinic-configurations-api';

type FormType = 'login' | 'demo';

export default function ClinicLoginPage() {
  const params = useParams();
  const clinicSlug = params.clinicSlug as string;
  
  const [formType, setFormType] = useState<FormType>('login');
  const [branding, setBranding] = useState<PublicBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBranding = async () => {
      if (!clinicSlug) return;
      
      try {
        setIsLoading(true);
        const data = await clinicConfigurationsApi.getPublicBranding(clinicSlug);
        setBranding(data);
        
        // Update page title with brand name
        if (data.brandName) {
          document.title = `Iniciar Sesión - ${data.brandName}`;
        }
        
        // Update favicon if provided
        if (data.faviconUrl) {
          const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement 
            || document.createElement('link');
          link.rel = 'icon';
          link.href = data.faviconUrl;
          document.head.appendChild(link);
        }
      } catch (err) {
        console.error('Error loading clinic branding:', err);
        setError('Clínica no encontrada');
      } finally {
        setIsLoading(false);
      }
    };

    loadBranding();
  }, [clinicSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Clínica no encontrada</h1>
          <p className="text-slate-600 mb-4">El enlace que seguiste puede estar incorrecto.</p>
          <a href="/login" className="text-primary-600 hover:underline">
            Ir al login principal
          </a>
        </div>
      </div>
    );
  }

  const brandName = branding?.brandName || 'Groober';

  return (
    <div className="min-h-screen flex">
      <LoginLeftSideBranding branding={branding} />

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center px-6 sm:px-8 py-12 lg:py-0">
        <div className="w-full max-w-md">
          {/* Mobile Header with branding */}
          <div className="lg:hidden mb-8 text-center">
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt={brandName} className="h-12 mx-auto mb-4" />
            ) : (
              <div 
                className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4"
                style={{ backgroundColor: branding?.primaryColor || '#0ea5e9' }}
              >
                {brandName.charAt(0)}
              </div>
            )}
            <h1 className="text-xl font-bold text-slate-900">{brandName}</h1>
            {branding?.tagline && (
              <p className="text-sm text-slate-500">{branding.tagline}</p>
            )}
          </div>

          {/* Header dinámico según el formulario */}
          {formType === 'login' ? (
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h2>
              <p className="text-gray-600">Inicia sesión en {brandName}</p>
            </div>
          ) : (
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Solicitar Demo</h2>
              <p className="text-gray-600">Conoce {brandName} de forma gratuita</p>
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
                className="font-semibold hover:opacity-80 text-sm"
                style={{ color: branding?.primaryColor || '#2563eb' }}
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          )}

          {/* Legal Links */}
          {(branding?.privacyPolicyUrl || branding?.termsUrl) && (
            <div className="mt-8 text-center text-xs text-slate-500 space-x-4">
              {branding.privacyPolicyUrl && (
                <a href={branding.privacyPolicyUrl} target="_blank" className="hover:underline">
                  Privacidad
                </a>
              )}
              {branding.termsUrl && (
                <a href={branding.termsUrl} target="_blank" className="hover:underline">
                  Términos
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
