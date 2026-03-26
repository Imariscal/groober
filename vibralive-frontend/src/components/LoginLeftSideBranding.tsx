'use client';

import { PublicBranding, BrandingFeature } from '@/types';
import { FiCalendar, FiMessageCircle, FiCheck, FiStar, FiHeart, FiBell, FiScissors, FiAward, FiTrendingUp } from 'react-icons/fi';
import { MdPets, MdWhatsapp, MdAutoAwesome } from 'react-icons/md';

interface LoginLeftSideBrandingProps {
  branding?: PublicBranding | null;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  calendar: FiCalendar,
  pets: MdPets,
  whatsapp: MdWhatsapp,
  message: FiMessageCircle,
  check: FiCheck,
  star: FiStar,
  heart: FiHeart,
  bell: FiBell,
  scissors: FiScissors,
  award: FiAward,
  trending: FiTrendingUp,
  sparkle: MdAutoAwesome,
};

const DEFAULT_FEATURES: BrandingFeature[] = [
  {
    icon: 'scissors',
    title: 'Gestión de Citas',
    description: 'Agenda completa de grooming y servicios'
  },
  {
    icon: 'sparkle',
    title: 'Mejor Servicio',
    description: 'Herramientas para mantener a tus peluqueros organizados'
  },
  {
    icon: 'trending',
    title: 'Crece tu Negocio',
    description: 'Automatización para aumentar tus ganancias'
  }
];

export function LoginLeftSideBranding({ branding }: LoginLeftSideBrandingProps) {
  const brandName = branding?.brandName || 'Groober';
  const tagline = branding?.tagline || '✨ Plataforma de Gestión para Estéticas Caninas';
  const gradientFrom = branding?.loginGradientFrom || '#0284c7';
  const gradientTo = branding?.loginGradientTo || '#0369a1';
  const textColor = branding?.loginTextColor || '#ffffff';
  const logoUrl = branding?.logoUrl;
  const features = branding?.features?.length ? branding.features : DEFAULT_FEATURES;
  const bgImageUrl = branding?.loginBackgroundUrl;

  const bgStyle = bgImageUrl 
    ? { backgroundImage: `url(${bgImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})` };

  return (
    <div 
      className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
      style={bgStyle}
    >
      {/* Overlay for background images */}
      {bgImageUrl && (
        <div 
          className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom, ${gradientFrom}dd, ${gradientTo}ee)` }}
        />
      )}

      {/* Decorative Blob */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-md space-y-12 text-center" style={{ color: textColor }}>
        {/* Logo */}
        <div className="space-y-0">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} className="h-20 mx-auto object-contain" />
          ) : (
            <GrooberLogo />
          )}
          <div className="-mt-8">
            <h1 className="text-6xl font-black bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent">{brandName}</h1>
            <p className="text-lg font-medium opacity-90 mt-2">🐕 {tagline}</p>
          </div>
        </div>

        {/* Features */}
        <FeaturesList features={features} textColor={textColor} />

        {/* Footer */}
        {branding?.footerText && (
          <div className="pt-8 border-t border-white/30">
            <p className="text-sm opacity-70">{branding.footerText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GrooberLogo() {
  return (
    <div 
      className="mx-auto flex items-center justify-center"
      style={{ width: '200px', height: '200px' }}
    >
      <img 
        src="/Groober-logo.png" 
        alt="Groober - Plataforma de Estética Canina"
        className="w-full h-full object-contain drop-shadow-2xl"
      />
    </div>
  );
}

function FeaturesList({ features, textColor }: { features: BrandingFeature[]; textColor: string }) {
  return (
    <div className="space-y-5 text-left">
      {features.map((feature, index) => {
        const IconComponent = ICON_MAP[feature.icon] || FiCheck;
        return (
          <div key={index} className="flex gap-4 items-start animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <div 
              className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border border-white border-opacity-30 shadow-lg"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{feature.title}</h3>
              <p className="text-sm mt-1.5 opacity-85 leading-snug">{feature.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
