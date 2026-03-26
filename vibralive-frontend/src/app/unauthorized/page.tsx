'use client';

import Link from 'next/link';
import { MdLock } from 'react-icons/md';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <div className="text-center">
        <MdLock size={64} className="text-red-600 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-red-600 mb-2">403</h1>
        <p className="text-gray-700 text-lg mb-8">No tienes permisos para acceder a esta página</p>

        <div className="space-x-4">
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Volver al Dashboard
          </Link>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
          >
            Cerrar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
