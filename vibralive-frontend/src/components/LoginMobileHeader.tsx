'use client';

export function LoginMobileHeader() {
  return (
    <div className="lg:hidden text-center space-y-4 mb-8">
      <div className="w-28 h-28 mx-auto flex items-center justify-center">
        <img 
          src="/Groober-logo.png" 
          alt="Groober"
          className="w-full h-full object-contain drop-shadow-lg"
        />
      </div>
      <div>
        <h1 className="text-4xl font-black text-gray-900">Groober</h1>
        <p className="text-sm text-gray-600 mt-1">🐾 Plataforma de estética canina</p>
      </div>
    </div>
  );
}
