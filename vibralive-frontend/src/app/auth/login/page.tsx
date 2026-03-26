'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ModernLoginForm } from '@/components/ModernLoginForm';
import { DemoRequestForm } from '@/components/DemoRequestForm';
import { LoginLeftSideBranding } from '@/components/LoginLeftSideBranding';
import { LoginMobileHeader } from '@/components/LoginMobileHeader';
import { LoginFormHeader } from '@/components/LoginFormHeader';
import { LoginFormFooter } from '@/components/LoginFormFooter';

type FormType = 'login' | 'demo';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  const [formType, setFormType] = useState<FormType>(viewParam === 'demo' ? 'demo' : 'login');

  return (
    <div className="h-full flex">
      <LoginLeftSideBranding />

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center px-6 sm:px-8 py-6 lg:py-0 overflow-y-auto">
        <div className="w-full max-w-md">
          <LoginMobileHeader />

          {/* Header dinámico según el formulario */}
          {formType === 'login' ? (
            <LoginFormHeader />
          ) : (
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Solicitar Demo</h2>
              <p className="text-gray-600">Conoce Groober de forma gratuita</p>
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
