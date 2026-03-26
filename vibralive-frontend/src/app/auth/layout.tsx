import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-blue-200 to-transparent rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-t from-cyan-200 to-transparent rounded-full opacity-20 blur-3xl"></div>
      
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden relative z-10 max-h-screen">
        {children}
      </div>
    </div>
  );
}
