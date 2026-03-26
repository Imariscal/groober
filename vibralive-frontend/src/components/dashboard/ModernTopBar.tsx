'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiBell, FiChevronDown, FiLogOut, FiSettings, FiUser, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { useAuthStore } from '@/store/auth-store';
import { useAuth } from '@/hooks/useAuth';
import { useDensityStore } from '@/hooks/useDensity';
import { useBranding } from '@/contexts/BrandingContext';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { GlobalSearchDropdown } from './GlobalSearchDropdown';

interface ModernTopBarProps {
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  notificationCount?: number;
}

export function ModernTopBar({
  onSearch,
  onNotificationClick,
  ctaLabel = 'Nuevo',
  ctaHref,
  onCtaClick,
  notificationCount = 0,
}: ModernTopBarProps) {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { density, toggleDensity } = useDensityStore();
  const { branding } = useBranding();
  const { results, isLoading, search, clearResults } = useGlobalSearch();
  const [searchInput, setSearchInput] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Branding values with fallbacks
  const brandName = branding?.brandName || 'Groober';
  const logoUrl = branding?.logoUrl;
  const primaryColor = branding?.primaryColor || '#0ea5e9';

  // Dynamic home link based on role
  const homeLink = user?.role === 'superadmin'
    ? '/platform/dashboard'
    : user?.role === 'CLINIC_OWNER'
      ? '/clinic/dashboard'
      : '/staff/dashboard';

  // Close dropdown cuando se hace click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchActive(false);
        setSearchInput('');
        clearResults();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearResults]);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-6">
      <div className="h-full flex items-center justify-between gap-4">
        {/* Left Section - Logo */}
        <Link href={homeLink} className="flex items-center gap-2 flex-shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} className="h-8 object-contain" />
          ) : (
            <div 
              className="w-8 h-8 text-white rounded-lg flex items-center justify-center font-bold text-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {brandName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-bold text-base text-slate-900 hidden sm:inline">{brandName}</span>
        </Link>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-md" ref={searchRef}>
          <motion.div
            animate={{ width: searchActive ? '100%' : '100%' }}
            className="relative"
          >
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar clientes, mascotas, citas..."
              className="w-full h-10 pl-9 pr-4 bg-slate-100 border border-slate-200 rounded-lg
                text-sm text-slate-900 placeholder-slate-500
                focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50
                transition-all duration-150"
              value={searchInput}
              onFocus={() => setSearchActive(true)}
              onBlur={() => setTimeout(() => setSearchActive(false), 150)}
              onChange={(e) => {
                setSearchInput(e.target.value);
                search(e.target.value);
                onSearch?.(e.target.value);
              }}
            />
            <GlobalSearchDropdown
              results={results}
              isLoading={isLoading}
              isOpen={searchActive && searchInput.length > 0}
              queryLength={searchInput.length}
              onSelect={() => {
                setSearchActive(false);
                setSearchInput('');
                clearResults();
              }}
            />
          </motion.div>
        </div>

        {/* Right Section - Icons + Avatar */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Density Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleDensity}
            title={`Cambiar a modo ${density === 'comfortable' ? 'compacto' : 'cómodo'}`}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-150"
            aria-label={`Densidad: ${density}`}
          >
            {density === 'comfortable' ? (
              <FiMaximize2 className="w-5 h-5 text-slate-600" />
            ) : (
              <FiMinimize2 className="w-5 h-5 text-slate-600" />
            )}
          </motion.button>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNotificationClick}
            className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors duration-150"
            aria-label="Notificaciones"
          >
            <FiBell className="w-5 h-5 text-slate-600" />
            {notificationCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 w-2 h-2 bg-critical-500 rounded-full"
              />
            )}
          </motion.button>

          {/* CTA Button */}
          {ctaHref || onCtaClick ? (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              {ctaHref ? (
                <Link
                  href={ctaHref}
                  className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg
                    hover:bg-primary-600 transition-colors duration-150
                    shadow-xs hover:shadow-md"
                >
                  {ctaLabel}
                </Link>
              ) : (
                <button
                  onClick={onCtaClick}
                  className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg
                    hover:bg-primary-600 transition-colors duration-150
                    shadow-xs hover:shadow-md"
                >
                  {ctaLabel}
                </button>
              )}
            </motion.div>
          ) : null}

          {/* Avatar + Dropdown */}
          <div ref={dropdownRef} className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100
                transition-colors duration-150"
              aria-label="Menú de usuario"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600
                rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <FiChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200
                ${dropdownOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-white border border-slate-200
                    rounded-lg shadow-lg py-1 z-50"
                >
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-slate-200">
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>

                  {/* Menu Items */}
                  <Link
                    href="/clinic/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700
                      hover:bg-slate-50 transition-colors duration-150"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FiUser className="w-4 h-4" />
                    <span>Mi Perfil</span>
                  </Link>

                  <Link
                    href="/clinic/configurations"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700
                      hover:bg-slate-50 transition-colors duration-150"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FiSettings className="w-4 h-4" />
                    <span>Configuración</span>
                  </Link>

                  {/* Divider */}
                  <div className="border-t border-slate-200 my-1" />

                  {/* Logout */}
                  <button
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-critical-600
                      hover:bg-critical-50 transition-colors duration-150"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
