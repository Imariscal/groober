'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoginLeftSideBranding } from '@/components/LoginLeftSideBranding';
import { LoginMobileHeader } from '@/components/LoginMobileHeader';
import toast from 'react-hot-toast';
import Link from 'next/link';

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { acceptInvitation, isLoading } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Password validation state
  const [validations, setValidations] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
    passwordsMatch: false,
  });

  useEffect(() => {
    setValidations({
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*]/.test(password),
      passwordsMatch: password.length > 0 && password === confirmPassword,
    });
  }, [password, confirmPassword]);

  const allValid = Object.values(validations).every(Boolean);

  if (!token) {
    return (
      <div className="min-h-screen flex">
        <LoginLeftSideBranding />
        <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center px-6 sm:px-8 py-12 lg:py-0">
          <div className="w-full max-w-md text-center">
            <LoginMobileHeader />
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Token no encontrado</h2>
            <p className="text-gray-600 mb-6">
              El enlace de invitación no es válido. Verifica que hayas copiado el enlace completo.
            </p>
            <Link
              href="/auth/login"
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
            >
              ← Ir a Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex">
        <LoginLeftSideBranding />
        <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center px-6 sm:px-8 py-12 lg:py-0">
          <div className="w-full max-w-md text-center">
            <LoginMobileHeader />
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Cuenta Activada!</h2>
            <p className="text-gray-600 mb-6">
              Tu cuenta ha sido activada exitosamente. Serás redirigido al dashboard en un momento...
            </p>
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!allValid) {
      toast.error('Por favor cumple todos los requisitos de contraseña');
      return;
    }

    try {
      await acceptInvitation(token, password);
      setAccepted(true);
      toast.success('¡Cuenta activada exitosamente!');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al aceptar la invitación';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen flex">
      <LoginLeftSideBranding />

      {/* Right Side - Accept Invitation Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center px-6 sm:px-8 py-12 lg:py-0">
        <div className="w-full max-w-md">
          <LoginMobileHeader />

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Activar Cuenta</h2>
            <p className="text-gray-600">Establece tu contraseña para acceder a tu clínica</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nueva Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirmar Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Password requirements */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-xs font-semibold text-gray-600 mb-2.5">Requisitos de contraseña:</p>
              <div className="grid grid-cols-2 gap-1.5">
                <ValidationItem valid={validations.minLength} label="Mínimo 8 caracteres" />
                <ValidationItem valid={validations.hasUpper} label="Una mayúscula" />
                <ValidationItem valid={validations.hasLower} label="Una minúscula" />
                <ValidationItem valid={validations.hasNumber} label="Un número" />
                <ValidationItem valid={validations.hasSpecial} label="Carácter especial (!@#$%^&*)" />
                <ValidationItem valid={validations.passwordsMatch} label="Contraseñas coinciden" />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !allValid}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Activando cuenta...
                </>
              ) : (
                <>
                  Activar Cuenta
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-gray-500 hover:text-blue-600 transition"
            >
              ¿Ya tienes cuenta? <span className="font-semibold">Inicia sesión</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ValidationItem({ valid, label }: { valid: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className={`transition-colors ${valid ? 'text-green-500' : 'text-gray-300'}`}>
        {valid ? '✓' : '○'}
      </span>
      <span className={`transition-colors ${valid ? 'text-green-700' : 'text-gray-500'}`}>{label}</span>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
