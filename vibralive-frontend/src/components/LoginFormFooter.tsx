'use client';

interface LoginFormFooterProps {
  onDemoClick?: () => void;
}

export function LoginFormFooter({ onDemoClick }: LoginFormFooterProps) {
  return (
    <div className="mt-8 space-y-4">
      {onDemoClick && (
        <button
          onClick={onDemoClick}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <span>✨</span> Solicita una demo gratis →
        </button>
      )}
      <p className="text-center text-xs text-gray-500 mt-4">
        🐾 Gestiona tu estética canina de forma inteligente con Groober
      </p>
    </div>
  );
}
