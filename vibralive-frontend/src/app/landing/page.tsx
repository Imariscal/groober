'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  FiCalendar,
  FiUsers,
  FiTrendingUp,
  FiCheckCircle,
  FiArrowRight,
  FiMapPin,
  FiPhone,
  FiMail,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiMap,
  FiGrid,
  FiMessageSquare,
  FiBell,
  FiDollarSign,
} from 'react-icons/fi';
import { MdPets, MdMedicalServices, MdOutlineShoppingCart } from 'react-icons/md';

const FEATURES = [
  {
    icon: FiCalendar,
    title: 'Gestión de Citas',
    description: 'Sistema inteligente de citas con confirmación automática y recordatorios para tus clientes.',
  },
  {
    icon: MdPets,
    title: 'Perfiles de Mascotas',
    description: 'Mantén el historial completo de cada mascota con fotos, peso y procedimientos anteriores.',
  },
  {
    icon: FiUsers,
    title: 'Gestión de Clientes',
    description: 'Base de datos centralizada con contactos, preferencias y historial de servicios.',
  },
  {
    icon: MdMedicalServices,
    title: 'Expediente Médico',
    description: 'Registra visitás, prescripciones y vacunas con un sistema EHR completo.',
  },
  {
    icon: MdOutlineShoppingCart,
    title: 'Punto de Venta (POS)',
    description: 'Sistema de ventas integrado para servicios y productos con reportes en tiempo real.',
  },
  {
    icon: FiTrendingUp,
    title: 'Reportes y Análitica',
    description: 'Visualiza tus ganancias, clientes más frecuentes y tendencias de servicios.',
  },
  {
    icon: FiMessageSquare,
    title: 'WhatsApp para Citas',
    description: 'Confirmación y seguimiento de citas automáticas por WhatsApp. Mensaje limitado por plan, compra add-ons para más.',
  },
  {
    icon: FiBell,
    title: 'Recordatorios Automáticos',
    description: 'Envía recordatorios para vacunas, desparasitación y baños. Mantén a tus mascotas saludables.',
  },
  {
    icon: FiDollarSign,
    title: 'Configuración de Precios',
    description: 'Define y gestiona listas de precios personalizadas para diferentes servicios y paquetes.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Dr. Carlos Mendoza',
    role: 'Veterinario, Clínica Pets Plus',
    image: '👨‍⚕️',
    text: 'Groober ha revolucionado cómo manejamos nuestras citas. Ahora tengo más tiempo para los animales.',
  },
  {
    name: 'Lucía García',
    role: 'Dueña, Grooming Studio Luxe',
    image: '👩‍💼',
    text: 'El sistema de ventas integrado nos ayudó a aumentar ingresos un 40% el primer mes.',
  },
  {
    name: 'Miguel Rodríguez',
    role: 'Gerente, Centro Felino',
    image: '👨‍💼',
    text: 'Nuestros clientes aman recibir recordatorios automáticos. Reducimos cancelaciones a la mitad.',
  },
];

const PRICING_PLANS = [
  {
    name: 'Basic',
    subtitle: 'Para empezar',
    price: '$800',
    period: '/mes',
    description: 'Ideal para nuevos negocios de estética o clínica veterinaria',
    badge: null,
    modules: ['1 módulo a elegir'],
    features: [
      '✓ Historial clínico o grooming',
      '✓ Citas ilimitadas',
      '✓ Reportes básicos',
      '✓ 250 mensajes WhatsApp/mes',
      '✗ POS no incluido',
      '✗ Marketing no incluido',
    ],
    cta: 'Comenzar gratis',
    ctaVariant: 'outline',
    highlighted: false,
  },
  {
    name: 'Growth',
    subtitle: 'Para crecer',
    price: '$1,200',
    period: '/mes',
    description: 'Para negocios que necesitan más de un servicio',
    badge: null,
    modules: ['Clínica + Grooming'],
    features: [ 
      '✓ Reportes intermedios',
      '✓ Multi-usuario (limitado)',
      '✓ 400 mensajes WhatsApp/mes',
      '+ POS disponible ($200)',
      '✗ Marketing no incluido',
    ],
    cta: 'Comenzar ahora',
    ctaVariant: 'outline',
    highlighted: false,
  },
  {
    name: 'Pro',
    subtitle: 'Más popular',
    price: '$1,500',
    period: '/mes',
    description: 'La mejor combinación para clínicas veterinarias completas',
    badge: '⭐ MÁS ELEGIDO',
    modules: ['Clínica + Grooming + POS'],
    features: [ 
      '✓ Reportes avanzados',
      '✓ Multi-usuario completo',
      '✓ Soporte prioritario',
      '✓ 550 mensajes WhatsApp/mes',
      '✓ Análisis detallado de ingresos',
    ],
    cta: 'Comenzar ahora',
    ctaVariant: 'primary',
    highlighted: true,
  },
  {
    name: 'Full',
    subtitle: 'Máximo control',
    price: '$1,800',
    period: '/mes',
    description: 'Para empresas que necesitan marketing y máxima funcionalidad',
    badge: null,
    modules: ['Clínica + Grooming + POS + Marketing'],
    features: [
      '✓ TODOS los módulos',
      '✓ Marketing y campañas premium',
      '✓ Analytics avanzado',
      '✓ 600 mensajes WhatsApp/mes',
      '✓ Integraciones de terceros',
      '✓ Soporte dedicado 24/7',
    ],
    cta: 'Comenzar ahora',
    ctaVariant: 'outline',
    highlighted: false,
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [carouselSlide, setCarouselSlide] = useState(0);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image
                  src="/groober-logo.png"
                  alt="Groober Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-sky-500 to-cyan-600 bg-clip-text text-transparent">
                Groober
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-sky-600 transition">
                Características
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-sky-600 transition">
                Precios
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-sky-600 transition">
                Testimonios
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => router.push('/auth/login')}
                className="px-4 py-2 text-gray-700 hover:text-sky-600 transition font-medium"
              >
                Ingresar
              </button>
              <button
                onClick={() => router.push('/auth/login?view=demo')}
                className="px-6 py-2 bg-gradient-to-r from-sky-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition font-medium"
              >
                Registrarse
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-3 border-t border-gray-200 pt-4">
              <a href="#features" className="block text-gray-700 hover:text-sky-600">
                Características
              </a>
              <a href="#pricing" className="block text-gray-700 hover:text-sky-600">
                Precios
              </a>
              <a href="#testimonials" className="block text-gray-700 hover:text-sky-600">
                Testimonios
              </a>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => router.push('/auth/login')}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Ingresar
                </button>
                <button
                  onClick={() => router.push('/auth/login?view=demo')}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-600 text-white rounded-lg"
                >
                  Registrarse
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-sky-50 to-slate-50">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-block mb-6">
            <span className="px-4 py-2 bg-sky-100 text-sky-700 rounded-full text-sm font-medium">
              ✨ La solución completa para tu clínica
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-sky-600 to-cyan-600 bg-clip-text text-transparent">
            Gestiona tu clínica veterinaria o grooming con Groober
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Una plataforma integral diseñada para veterinarios y groomers que buscan crecer. Citas, pacientes, ventas y reportes en un solo lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => router.push('/auth/login?view=demo')}
              className="px-8 py-4 bg-gradient-to-r from-sky-500 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-xl transition flex items-center justify-center gap-2"
            >
              Comenzar gratis
              <FiArrowRight size={20} />
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('features');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 border-2 border-gray-200 text-gray-900 rounded-lg font-semibold hover:border-sky-500 hover:bg-sky-50 transition"
            >
              Ver características
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-20 text-center">
            <div>
              <div className="text-3xl font-bold text-sky-600">500+</div>
              <p className="text-gray-600 text-sm mt-2">Clínicas activas</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-sky-600">50K+</div>
              <p className="text-gray-600 text-sm mt-2">Mascotas registradas</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-sky-600">4.9★</div>
              <p className="text-gray-600 text-sm mt-2">Calificación promedio</p>
            </div>
          </div>

          {/* Dashboard Carousel */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
            {/* Slide 1: Dashboard */}
            {carouselSlide === 0 && (
              <div className="p-8 animate-fade-in">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900">Dashboard</h3>
                  <p className="text-gray-600 text-sm">Visión en tiempo real de tu clínica</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="rounded-lg p-4 bg-gradient-to-br from-emerald-50 to-green-50 border border-green-200">
                    <p className="text-xs font-semibold text-green-700 mb-2">INGRESOS (MTD)</p>
                    <p className="text-2xl font-bold text-green-900">$7,314</p>
                    <p className="text-xs text-green-600 mt-2">↑ 5%</p>
                  </div>
                  <div className="rounded-lg p-4 bg-gradient-to-br from-sky-50 to-cyan-100 border border-sky-200">
                    <p className="text-xs font-semibold text-sky-700 mb-2">CITAS CONFIRMADAS</p>
                    <p className="text-2xl font-bold text-sky-900">24</p>
                    <p className="text-xs text-sky-600 mt-2">↑ 3%</p>
                  </div>
                  <div className="rounded-lg p-4 bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-200">
                    <p className="text-xs font-semibold text-purple-700 mb-2">CLIENTES ACTIVOS</p>
                    <p className="text-2xl font-bold text-purple-900">127</p>
                    <p className="text-xs text-purple-600 mt-2">↑ 2%</p>
                  </div>
                  <div className="rounded-lg p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                    <p className="text-xs font-semibold text-amber-700 mb-2">TASA CONFIRMACIÓN</p>
                    <p className="text-2xl font-bold text-amber-900">85%</p>
                    <p className="text-xs text-amber-600 mt-2">Meta: 85%</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="rounded-lg p-4 border border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                    <p className="font-semibold text-gray-900 mb-4 text-sm">Ingresos Acumulados</p>
                    <div className="h-32 bg-gradient-to-r from-sky-100 to-cyan-100 rounded-lg flex items-end justify-around px-4 py-6">
                      <div className="w-6 bg-sky-400 rounded-t" style={{ height: '30%' }}></div>
                      <div className="w-6 bg-sky-500 rounded-t" style={{ height: '50%' }}></div>
                      <div className="w-6 bg-sky-600 rounded-t" style={{ height: '70%' }}></div>
                      <div className="w-6 bg-cyan-500 rounded-t" style={{ height: '75%' }}></div>
                      <div className="w-6 bg-cyan-600 rounded-t" style={{ height: '85%' }}></div>
                    </div>
                  </div>

                  <div className="rounded-lg p-4 border border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                    <p className="font-semibold text-gray-900 mb-4 text-sm">Citas por Día</p>
                    <div className="h-32 bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg flex items-end justify-around px-4 py-6">
                      <div className="w-6 bg-green-400 rounded-t" style={{ height: '40%' }}></div>
                      <div className="w-6 bg-green-500 rounded-t" style={{ height: '55%' }}></div>
                      <div className="w-6 bg-green-600 rounded-t" style={{ height: '65%' }}></div>
                      <div className="w-6 bg-emerald-500 rounded-t" style={{ height: '80%' }}></div>
                      <div className="w-6 bg-emerald-600 rounded-t" style={{ height: '90%' }}></div>
                    </div>
                  </div>

                  <div className="rounded-lg p-4 border border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                    <p className="font-semibold text-gray-900 mb-4 text-sm">Densidad de Citas</p>
                    <div className="space-y-1">
                      {[
                        [2, 3, 1, 4, 2, 3, 1],
                        [3, 4, 5, 4, 5, 4, 2],
                        [4, 5, 5, 5, 4, 3, 2],
                      ].map((row, i) => (
                        <div key={i} className="flex gap-1">
                          {row.map((value, j) => {
                            const colorMap = {
                              1: 'bg-blue-100',
                              2: 'bg-blue-200',
                              3: 'bg-blue-400',
                              4: 'bg-blue-600',
                              5: 'bg-blue-900',
                            };
                            return (
                              <div
                                key={j}
                                className={`flex-1 h-4 rounded ${colorMap[value as keyof typeof colorMap]}`}
                              ></div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 2: Mapa de Zonas Calientes */}
            {carouselSlide === 1 && (
              <div className="p-8 animate-fade-in">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <FiMap size={24} className="text-sky-600" />
                    Mapa de Densidad de Demanda
                  </h3>
                  <p className="text-gray-600 text-sm">Visualiza dónde tienes mayor flujo de clientes</p>
                </div>

                <div className="rounded-lg overflow-hidden border border-gray-200 h-80 bg-white flex items-center justify-center relative">
                  <svg className="w-full h-full" viewBox="0 0 900 350" xmlns="http://www.w3.org/2000/svg">
                    {/* Fondo tipo mapa */}
                    <rect width="900" height="350" fill="#f0fdf4" />
                    
                    {/* Borde de mapa */}
                    <rect x="50" y="30" width="800" height="300" fill="none" stroke="#cbd5e1" strokeWidth="2" />

                    {/* Halos de densidad (zonas calientes) - azul a rojo */}
                    {/* Zona central muy caliente */}
                    <circle cx="320" cy="180" r="120" fill="#7dd3fc" opacity="0.15" />
                    <circle cx="320" cy="180" r="80" fill="#f87171" opacity="0.25" />
                    <circle cx="320" cy="180" r="40" fill="#ef4444" opacity="0.35" />

                    {/* Zona noreste caliente */}
                    <circle cx="650" cy="100" r="100" fill="#7dd3fc" opacity="0.15" />
                    <circle cx="650" cy="100" r="60" fill="#fbbf24" opacity="0.25" />
                    <circle cx="650" cy="100" r="30" fill="#f97316" opacity="0.35" />

                    {/* Zona sureste templada */}
                    <circle cx="700" cy="260" r="80" fill="#7dd3fc" opacity="0.20" />
                    <circle cx="700" cy="260" r="50" fill="#60a5fa" opacity="0.25" />

                    {/* Zona oeste - fría */}
                    <circle cx="150" cy="220" r="70" fill="#dbeafe" opacity="0.20" />
                    <circle cx="150" cy="220" r="40" fill="#bfdbfe" opacity="0.25" />

                    {/* Marcadores de clínicas - con tamaño según densidad */}
                    {/* Centro - MUY CALIENTE */}
                    <circle cx="320" cy="180" r="14" fill="#dc2626" opacity="0.8" />
                    <circle cx="320" cy="180" r="10" fill="#ef4444" />
                    <text x="320" y="186" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle">
                      🏥
                    </text>

                    {/* Noreste - CALIENTE */}
                    <circle cx="650" cy="100" r="12" fill="#ea580c" opacity="0.8" />
                    <circle cx="650" cy="100" r="9" fill="#f97316" />
                    <text x="650" y="105" fontSize="11" fontWeight="bold" fill="white" textAnchor="middle">
                      🏥
                    </text>

                    {/* Sureste - TEMPLADO */}
                    <circle cx="700" cy="260" r="10" fill="#0ea5e9" opacity="0.8" />
                    <circle cx="700" cy="260" r="7" fill="#06b6d4" />
                    <text x="700" y="264" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle">
                      🏥
                    </text>

                    {/* Oeste - FRÍO */}
                    <circle cx="150" cy="220" r="8" fill="#3b82f6" opacity="0.8" />
                    <circle cx="150" cy="220" r="5" fill="#60a5fa" />
                    <text x="152" y="223" fontSize="9" fontWeight="bold" fill="white" textAnchor="middle">
                      🏥
                    </text>

                    {/* Info zones */}
                    <g>
                      {/* Centro */}
                      <rect x="295" y="155" width="50" height="50" fill="white" stroke="#dc2626" strokeWidth="2" rx="3" />
                      <text x="320" y="175" fontSize="11" fontWeight="bold" fill="#dc2626" textAnchor="middle">
                        4 clínicas
                      </text>
                      <text x="320" y="190" fontSize="9" fill="#666" textAnchor="middle">
                        1,240 citas/mes
                      </text>

                      {/* Noreste */}
                      <rect x="625" y="55" width="50" height="50" fill="white" stroke="#f97316" strokeWidth="2" rx="3" />
                      <text x="650" y="75" fontSize="11" fontWeight="bold" fill="#f97316" textAnchor="middle">
                        2 clínicas
                      </text>
                      <text x="650" y="90" fontSize="9" fill="#666" textAnchor="middle">
                        680 citas/mes
                      </text>
                    </g>

                    {/* Leyenda */}
                    <rect x="60" y="245" width="280" height="70" fill="white" stroke="#d1d5db" strokeWidth="1" rx="4" />
                    <text x="75" y="262" fontSize="11" fontWeight="bold" fill="#1f2937">
                      Densidad de Demanda
                    </text>

                    {/* Leyenda colores */}
                    <circle cx="75" cy="278" r="6" fill="#bfdbfe" />
                    <text x="92" y="282" fontSize="10" fill="#374151">
                      Baja
                    </text>

                    <circle cx="145" cy="278" r="6" fill="#60a5fa" />
                    <text x="162" y="282" fontSize="10" fill="#374151">
                      Media
                    </text>

                    <circle cx="215" cy="278" r="6" fill="#fbbf24" />
                    <text x="232" y="282" fontSize="10" fill="#374151">
                      Alta
                    </text>

                    <circle cx="275" cy="278" r="6" fill="#ef4444" />
                    <text x="292" y="282" fontSize="10" fill="#374151">
                      Crítica
                    </text>

                    {/* Estadísticas rápidas */}
                    <g>
                      <text x="380" y="262" fontSize="11" fontWeight="bold" fill="#1f2937">
                        📊 Estadísticas:
                      </text>
                      <text x="380" y="280" fontSize="10" fill="#374151">
                        • Zona crítica: 1,240 citas/mes
                      </text>
                      <text x="380" y="295" fontSize="10" fill="#374151">
                        • Oportunidad de expansión en oeste
                      </text>
                      <text x="380" y="310" fontSize="10" fill="#374151">
                        • Total demanda: 2,200+ citas/mes
                      </text>
                    </g>
                  </svg>
                </div>

                <div className="mt-6 grid md:grid-cols-4 gap-3 text-sm">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-semibold text-red-900">🔴 Crítica</p>
                    <p className="text-red-700 text-xs mt-1">Demanda máxima, refuerza equipo</p>
                  </div>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="font-semibold text-orange-900">🟠 Alta</p>
                    <p className="text-orange-700 text-xs mt-1">Demanda elevada, estable</p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-semibold text-blue-900">🔵 Media</p>
                    <p className="text-blue-700 text-xs mt-1">Demanda moderada</p>
                  </div>
                  <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                    <p className="font-semibold text-cyan-900">⚪ Baja</p>
                    <p className="text-cyan-700 text-xs mt-1">Oportunidad de marketing</p>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 3: Calendario */}
            {carouselSlide === 2 && (
              <div className="p-8 animate-fade-in">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <FiCalendar size={24} className="text-sky-600" />
                    Calendario de Citas
                  </h3>
                  <p className="text-gray-600 text-sm">Gestiona todas tus citas en un solo lugar</p>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-gray-50 to-white">
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-gray-900">Marzo 2026</h4>
                      <div className="flex gap-2">
                        <button className="p-1 hover:bg-gray-200 rounded">◄</button>
                        <button className="p-1 hover:bg-gray-200 rounded">►</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold text-gray-600 mb-2">
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab', 'Dom'].map((day) => (
                        <div key={day}>{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 35 }).map((_, i) => {
                        const day = i - 5;
                        const isCurrentMonth = day > 0 && day <= 31;
                        const isToday = day === 15;
                        const hasCitas = [5, 8, 12, 15, 18, 22, 25, 28].includes(day);

                        return (
                          <div
                            key={i}
                            className={`aspect-square flex items-center justify-center rounded text-sm font-medium ${
                              !isCurrentMonth ? 'text-gray-300' : ''
                            } ${isToday ? 'bg-sky-500 text-white' : hasCitas ? 'bg-green-100 text-green-900' : ''}`}
                          >
                            {isCurrentMonth && day}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Próximas citas</p>
                    {[
                      { time: '10:00 AM', pet: 'Luna - Gato Persa', type: '🛁 Baño' },
                      { time: '11:30 AM', pet: 'Max - Perro Golden', type: '✂️ Corte' },
                      { time: '2:00 PM', pet: 'Bella - Gato Siamés', type: '🔍 Chequeo' },
                    ].map((cita, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-gray-200 rounded-lg flex justify-between items-center hover:shadow-md transition"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{cita.time}</p>
                          <p className="text-xs text-gray-600">{cita.pet}</p>
                        </div>
                        <span className="text-sm">{cita.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Slide 4: Clientes */}
            {carouselSlide === 3 && (
              <div className="p-8 animate-fade-in">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <FiUsers size={24} className="text-sky-600" />
                    Gestión de Clientes
                  </h3>
                  <p className="text-gray-600 text-sm">Base de datos centralizada con historial completo</p>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-sky-50 to-cyan-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900">Cliente</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900">Mascotas</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900">Citas</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900">Gasto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {[
                          { name: '👤 Carlos Rodríguez', pets: 2, citas: 8, gasto: '$1,240' },
                          { name: '👤 María García', pets: 1, citas: 5, gasto: '$680' },
                          { name: '👤 Juan López', pets: 3, citas: 12, gasto: '$2,100' },
                          { name: '👤 Ana Martínez', pets: 1, citas: 4, gasto: '$520' },
                        ].map((cliente, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 font-medium text-gray-900">{cliente.name}</td>
                            <td className="px-4 py-3 text-gray-600">{cliente.pets}</td>
                            <td className="px-4 py-3 text-gray-600">{cliente.citas}</td>
                            <td className="px-4 py-3 font-semibold text-green-600">{cliente.gasto}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-sky-50 to-cyan-50 border border-sky-200 rounded-lg">
                    <p className="text-xs font-semibold text-sky-700">CLIENTES NUEVOS</p>
                    <p className="text-3xl font-bold text-sky-900 mt-1">12</p>
                    <p className="text-xs text-sky-600 mt-2">Este mes</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-semibold text-green-700">RETENCIÓN</p>
                    <p className="text-3xl font-bold text-green-900 mt-1">92%</p>
                    <p className="text-xs text-green-600 mt-2">Clientes recurrentes</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-200 rounded-lg">
                    <p className="text-xs font-semibold text-purple-700">LTV</p>
                    <p className="text-3xl font-bold text-purple-900 mt-1">$584</p>
                    <p className="text-xs text-purple-600 mt-2">Valor de cliente</p>
                  </div>
                </div>
              </div>
            )}


            {/* Slide 5: Gestor de Campañas */}
            {carouselSlide === 4 && (
              <div className="p-8 animate-fade-in">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <FiMail size={24} className="text-sky-600" />
                    Gestor de Campañas
                  </h3>
                  <p className="text-gray-600 text-sm">Crea y automatiza campañas de marketing por WhatsApp y email</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Campaign Builder */}
                  <div className="md:col-span-2 border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-gray-50 to-white">
                    <h4 className="font-semibold text-gray-900 mb-4">Crear Nueva Campaña</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input type="text" placeholder="Ej: Promoción Baño Especial" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Canal</label>
                        <div className="flex gap-3">
                          <button className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm border border-green-300">
                            💬 WhatsApp
                          </button>
                          <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm border border-gray-300">
                            📧 Email
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Segmento de Clientes</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          <option>Sin mascotas hace 30+ días</option>
                          <option>Clientes VIP</option>
                          <option>Nuevos clientes</option>
                          <option>Todos</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje</label>
                        <textarea placeholder="Hola {{nombre}}, tenemos una promoción..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-20"></textarea>
                      </div>
                      <div className="flex gap-3">
                        <button className="flex-1 px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-600 text-white rounded-lg font-medium hover:shadow-lg transition">
                          Enviar Ahora
                        </button>
                        <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                          Programar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Campaign Stats */}
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                      <p className="text-xs font-semibold text-green-700">CAMPAÑAS ACTIVAS</p>
                      <p className="text-3xl font-bold text-green-900 mt-2">5</p>
                      <p className="text-xs text-green-600 mt-2">+2 esta semana</p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-semibold text-blue-700">CONTACTOS ALCANZADOS</p>
                      <p className="text-3xl font-bold text-blue-900 mt-2">842</p>
                      <p className="text-xs text-blue-600 mt-2">Mensajes enviados</p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-200 rounded-lg">
                      <p className="text-xs font-semibold text-purple-700">TASA APERTURA</p>
                      <p className="text-3xl font-bold text-purple-900 mt-2">68%</p>
                      <p className="text-xs text-purple-600 mt-2">Promedio industria: 45%</p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
                      <p className="text-xs font-semibold text-orange-700">CONVERSIÓN</p>
                      <p className="text-3xl font-bold text-orange-900 mt-2">24%</p>
                      <p className="text-xs text-orange-600 mt-2">Citas agendadas</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 6: Chatbot de Retención */}
            {carouselSlide === 5 && (
              <div className="p-8 animate-fade-in">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <FiMessageSquare size={24} className="text-sky-600" />
                    Chatbot Inteligente de Retención
                  </h3>
                  <p className="text-gray-600 text-sm">IA que detecta clientes en riesgo y genera recordatorios automáticos</p>
                  <p className="text-amber-700 text-xs mt-2 bg-amber-50 border border-amber-200 rounded px-3 py-2 inline-block">
                    💡 Mensajes limitados por plan. Compra add-ons para enviar más recordatorios y confirmaciones por WhatsApp.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Chat Interface */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white flex flex-col">
                    {/* Chat header */}
                    <div className="bg-gradient-to-r from-sky-500 to-cyan-600 text-white p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                        <Image src="/groober-logo.png" alt="Groober" width={40} height={40} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <p className="font-semibold">Groober Assistant</p>
                        <p className="text-xs text-sky-100">En línea</p>
                      </div>
                    </div>

                    {/* Chat messages */}
                    <div className="flex-1 p-4 space-y-4 bg-gray-50 h-48 overflow-y-auto">
                      {/* Bot message */}
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-white border border-sky-200 flex items-center justify-center text-sm overflow-hidden">
                          <Image src="/groober-logo.png" alt="Groober" width={32} height={32} className="w-full h-full object-contain" />
                        </div>
                        <div className="bg-white px-3 py-2 rounded-lg text-sm text-gray-800 max-w-xs">
                          Hola Carlos! 👋 Notamos que Luna necesita su baño mensual. ¿Agendamos una cita?
                        </div>
                      </div>

                      {/* User message */}
                      <div className="flex gap-2 justify-end">
                        <div className="bg-gradient-to-r from-sky-500 to-cyan-600 text-white px-3 py-2 rounded-lg text-sm max-w-xs">
                          ¡Sí! Disponible el sábado
                        </div>
                      </div>

                      {/* Bot message */}
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-white border border-sky-200 flex items-center justify-center text-sm overflow-hidden">
                          <Image src="/groober-logo.png" alt="Groober" width={32} height={32} className="w-full h-full object-contain" />
                        </div>
                        <div className="bg-white px-3 py-2 rounded-lg text-sm text-gray-800 max-w-xs">
                          Perfecto! ¿Te va a las 10:00 AM? 📅
                        </div>
                      </div>

                      {/* User message */}
                      <div className="flex gap-2 justify-end">
                        <div className="bg-gradient-to-r from-sky-500 to-cyan-600 text-white px-3 py-2 rounded-lg text-sm max-w-xs">
                          Confirmed ✅
                        </div>
                      </div>
                    </div>

                    {/* Chat input */}
                    <div className="p-3 border-t border-gray-200 flex gap-2">
                      <input type="text" placeholder="Escribe..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      <button className="px-3 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                        ↑
                      </button>
                    </div>
                  </div>

                  {/* Chatbot Features & Stats */}
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                      <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                        🎯 Capacidades de IA
                      </h4>
                      <ul className="text-sm text-indigo-800 space-y-2">
                        <li>✓ Detecta clientes inactivos</li>
                        <li>✓ Personaliza recordatorios</li>
                        <li>✓ Agendas citas automáticamente</li>
                        <li>✓ Responde preguntas frecuentes</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-3">📈 Resultados</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-800">Clientes reactivados</span>
                          <span className="font-bold text-green-900">+35%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-800">Tiempo de respuesta</span>
                          <span className="font-bold text-green-900">Instant</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-800">Satisfacción clientes</span>
                          <span className="font-bold text-green-900">4.8★</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-800">Citas completadas</span>
                          <span className="font-bold text-green-900">89%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-3">⚙️ Configuración Automática</h4>
                      <div className="space-y-2 text-xs text-blue-800">
                        <p>• Recordatorios: 7 días antes</p>
                        <p>• Reactivación: 30+ días sin cita</p>
                        <p>• Horarios: 9:00 AM - 6:00 PM</p>
                        <p>• Idioma: Español (AI completamente localizado)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center px-8 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setCarouselSlide((prev) => (prev === 0 ? 5 : prev - 1))}
                className="p-2 hover:bg-gray-200 rounded-lg transition flex items-center gap-2 text-gray-700 font-medium"
              >
                <FiChevronLeft size={20} />
                Anterior
              </button>

              {/* Dots */}
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setCarouselSlide(idx)}
                    className={`w-3 h-3 rounded-full transition ${
                      carouselSlide === idx ? 'bg-sky-500' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setCarouselSlide((prev) => (prev === 5 ? 0 : prev + 1))}
                className="p-2 hover:bg-gray-200 rounded-lg transition flex items-center gap-2 text-gray-700 font-medium"
              >
                Siguiente
                <FiChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900">
              Todo lo que necesitas para crecer
            </h2>
            <p className="text-xl text-gray-600">
              Herramientas poderosas diseñadas para veterinarios y groomers modernos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-xl border border-gray-200 hover:border-sky-200 hover:shadow-lg transition group bg-white"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <Icon size={24} className="text-sky-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900">
              Lo que dicen nuestros usuarios
            </h2>
            <p className="text-xl text-gray-600">
              Veterinarios y groomers que ya están creciendo con Groober
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-4xl">{testimonial.image}</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="w-full">
          {/* Header */}
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-5xl font-bold mb-4 text-slate-900">
              Planes que crecen contigo
            </h2>
            <p className="text-lg text-gray-600">
              Escalabilidad transparente. Sin sorpresas. Cancela cuando quieras.
            </p>
          </div>

          {/* Pricing Cards - Full Width */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {PRICING_PLANS.map((plan, index) => (
              <div
                key={index}
                className={`rounded-2xl border transition-all duration-300 flex flex-col h-full overflow-hidden ${
                  plan.highlighted
                    ? 'border-sky-400 bg-gradient-to-br from-sky-50 via-white to-cyan-50 shadow-2xl lg:scale-105 relative'
                    : 'border-gray-200 bg-white hover:shadow-xl hover:border-sky-200'
                }`}
              >
                {/* Badge - solo en Pro */}
                {plan.badge && (
                  <div className="bg-gradient-to-r from-sky-500 to-cyan-600 text-white px-4 py-2 text-center text-xs font-bold uppercase tracking-wide">
                    {plan.badge}
                  </div>
                )}

                {/* Card Content */}
                <div className={`flex flex-col h-full ${plan.badge ? 'p-6' : 'p-8'}`}>
                  {/* Header */}
                  <div className="mb-2">
                    <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                    <p className={`text-sm font-medium ${plan.highlighted ? 'text-sky-600' : 'text-gray-500'}`}>
                      {plan.subtitle}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-6 min-h-10">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-1 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    {plan.period && <span className="text-gray-600 text-sm">{plan.period}</span>}
                  </div>

                  {/* Modules Badge */}
                  <div className="mb-6 p-3 bg-gradient-to-r from-sky-50 to-cyan-50 rounded-lg border border-sky-100">
                    {plan.modules.map((module, idx) => (
                      <p key={idx} className="text-xs font-semibold text-sky-700">
                        {module}
                      </p>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => router.push('/auth/login?view=demo')}
                    className={`w-full py-3 rounded-lg font-semibold mb-6 transition-all ${
                      plan.ctaVariant === 'primary'
                        ? 'bg-gradient-to-r from-sky-500 to-cyan-600 text-white hover:shadow-lg hover:from-sky-600 hover:to-cyan-700'
                        : 'border-2 border-gray-300 text-slate-900 hover:border-sky-500 hover:bg-sky-50'
                    }`}
                  >
                    {plan.cta}
                  </button>

                  {/* Features - Flex grow para llenar espacio */}
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-900 mb-4 uppercase tracking-wider text-gray-500">
                      Incluye
                    </h4>
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => {
                        const isIncluded = feature.startsWith('✓');
                        return (
                          <li key={idx} className="flex items-start gap-3">
                            <span className={`flex-shrink-0 font-bold text-lg mt-0.5 ${
                              isIncluded ? 'text-green-500' : 'text-gray-300'
                            }`}>
                              ●
                            </span>
                            <span className={`text-sm leading-snug ${
                              isIncluded ? 'text-gray-700' : 'text-gray-400'
                            }`}>
                              {feature.replace(/^[✓✗\+]\s*/, '')}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add-ons Section */}
          <div className="border-t-2 border-gray-200 pt-20">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <h3 className="text-3xl font-bold text-slate-900 mb-3">
                Complementos opcionales
              </h3>
              <p className="text-gray-600">
                Potencia tu plan con funcionalidades adicionales cuando las necesites
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {/* Extra WhatsApp */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 text-center hover:shadow-lg transition">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FiMessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-bold text-slate-900 mb-4">Mensajes WhatsApp</h4>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-gray-50 rounded font-medium text-sky-600">
                    +100 → $100 MXN
                  </div>
                  <div className="p-2 bg-gray-50 rounded font-medium text-sky-600">
                    +300 → $250 MXN
                  </div>
                  <div className="p-2 bg-gray-50 rounded font-medium text-sky-600">
                    +1000 → $700 MXN
                  </div>
                </div>
              </div>

              {/* POS Add-on */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 text-center hover:shadow-lg transition">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FiDollarSign className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-bold text-slate-900 mb-4">Módulo POS</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Gestión de ventas completa
                </p>
                <p className="text-2xl font-bold text-green-600">+$200/mes</p>
              </div>

              {/* Marketing Add-on */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 text-center hover:shadow-lg transition">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FiBell className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-bold text-slate-900 mb-4">Módulo Marketing</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Campañas & analytics
                </p>
                <p className="text-2xl font-bold text-purple-600">+$300/mes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-sky-500 to-cyan-600">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-4xl font-bold text-white mb-6">
            ¿Listo para transformar tu clínica?
          </h2>
          <p className="text-lg text-sky-100 mb-8">
            Únete a cientos de veterinarios y groomers que ya están usando Groober
          </p>
          <button
            onClick={() => router.push('/auth/login?view=demo')}
            className="px-8 py-4 bg-white text-sky-600 rounded-lg font-semibold hover:shadow-xl transition"
          >
            Solicitar demo
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative w-8 h-8">
                  <Image
                    src="/groober-logo.png"
                    alt="Groober"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-bold text-white">Groober</span>
              </div>
              <p className="text-sm">La plataforma para clínicas veterinarias y grooming.</p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-white mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition">
                    Características
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition">
                    Precios
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="hover:text-white transition">
                    Testimonios
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Sobre nosotros
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contacto
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-white mb-4">Contacto</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <FiMail size={16} />
                  support@groober.com
                </li>
                <li className="flex items-center gap-2">
                  <FiPhone size={16} />
                  +1 (555) 123-4567
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm">
              <p>&copy; 2026 Groober. Todos los derechos reservados.</p>
              <div className="flex gap-6 mt-4 md:mt-0">
                <a href="#" className="hover:text-white transition">
                  Privacidad
                </a>
                <a href="#" className="hover:text-white transition">
                  Términos
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
