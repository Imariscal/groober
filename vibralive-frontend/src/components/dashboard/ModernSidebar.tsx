'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiBell,
  FiSettings,
  FiLogOut,
  FiChevronRight,
  FiMenu,
  FiX,
  FiShield,
  FiMap,
  FiTrendingUp,
  FiMessageSquare,
  FiMail,
  FiList,
  FiChevronDown,
  FiChevronsLeft,
  FiChevronsRight,
} from 'react-icons/fi';
import { MdDashboard, MdMedicalServices, MdPets, MdOutlineShoppingCart, MdLocalOffer } from 'react-icons/md';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useBranding } from '@/contexts/BrandingContext';
import { useSidebarCollapsed } from '@/contexts/SidebarContext';
import {
  getMenuForRole,
  filterMenuByPermissions,
  MenuSectionWithPermissions,
  MenuItemWithPermissions,
} from './menu-config';

// Custom scrollbar styles
const scrollbarStyles = `
  .sidebar-nav::-webkit-scrollbar {
    width: 6px;
  }
  
  .sidebar-nav::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .sidebar-nav::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.4);
    border-radius: 3px;
    transition: background-color 0.2s ease;
  }
  
  .sidebar-nav::-webkit-scrollbar-thumb:hover {
    background: rgba(148, 163, 184, 0.7);
  }
  
  /* Firefox */
  .sidebar-nav {
    scrollbar-color: rgba(148, 163, 184, 0.4) transparent;
    scrollbar-width: thin;
  }
  
  .sidebar-nav:hover {
    scrollbar-color: rgba(148, 163, 184, 0.7) transparent;
  }
`;

interface ModernSidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function ModernSidebar({ isMobile = false, isOpen = true, onClose }: ModernSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const { isCollapsed, setIsCollapsed } = useSidebarCollapsed();
  const { isSuperAdmin, isOwner } = usePermissions();
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const sectionRefsMap = React.useRef<Record<string, HTMLButtonElement | null>>({});

  // Obtener menú según rol del usuario
  const baseMenu = getMenuForRole(user?.role);
  
  // Filtrar items según permisos del usuario
  const navigation = filterMenuByPermissions(
    baseMenu,
    user?.permissions || []
  );

  // Initialize with all sections expanded by default
  const initialExpandedSections = new Set<string>(
    navigation.map((section) => section.title).filter((title): title is string => Boolean(title))
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(initialExpandedSections);

  // Branding values with fallbacks
  const brandName = branding?.brandName || 'Groober';
  const logoUrl = branding?.logoDarkUrl || branding?.logoUrl;

  // Inyectar estilos del scrollbar
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = scrollbarStyles;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const homeLink = isSuperAdmin()
    ? '/platform/dashboard'
    : isOwner()
      ? '/clinic/dashboard'
      : '/staff/dashboard';

  const isActive = (href: string) => {
    if (href === homeLink) return pathname === href;
    return pathname.startsWith(href);
  };

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionTitle)) {
        newSet.delete(sectionTitle);
      } else {
        newSet.add(sectionTitle);
      }
      return newSet;
    });
  };

  const handleSectionHover = (sectionTitle: string) => {
    const button = sectionRefsMap.current[sectionTitle];
    if (button) {
      const rect = button.getBoundingClientRect();
      setMenuPosition({
        top: rect.top,
        left: rect.right, // sin gap - empieza justo donde termina el sidebar
      });
    }
    setHoveredSection(sectionTitle);
  };

  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className={`h-16 border-b border-slate-700 flex items-center justify-between transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {!isCollapsed && (
          <Link href={homeLink} className="flex items-center gap-3 flex-1" onClick={onClose}>
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-8 object-contain" />
            ) : (
              <div 
                className="w-8 h-8 text-white rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: branding?.primaryColor || '#0ea5e9' }}
              >
                {brandName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <p className="font-bold text-white text-base leading-none">{brandName}</p>
            </div>
          </Link>
        )}
        
        {isCollapsed && (
          <Link href={homeLink} className="w-full flex justify-center" onClick={onClose}>
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-8 object-contain" />
            ) : (
              <div 
                className="w-8 h-8 text-white rounded-lg flex items-center justify-center font-bold text-sm"
                style={{ backgroundColor: branding?.primaryColor || '#0ea5e9' }}
              >
                {brandName.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
        )}

        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-2 p-1 rounded-md hover:bg-slate-700/30 transition-colors"
          title={isCollapsed ? 'Expandir' : 'Colapsar'}
        >
          {isCollapsed ? (
            <FiChevronsRight className="w-5 h-5 text-slate-300" />
          ) : (
            <FiChevronsLeft className="w-5 h-5 text-slate-300" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav flex-1 overflow-y-auto py-4 transition-all duration-300" style={{ paddingLeft: isCollapsed ? '0.5rem' : '0.5rem', paddingRight: isCollapsed ? '0.5rem' : '0.5rem' }}>
        {/* First: Render dashboard items (items without section title) */}
        {navigation
          .filter(section => !section.title)
          .flatMap(section => section.items)
          .map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="group relative mb-4"
              >
                {/* Active Indicator Background */}
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-y-0 left-0 w-1 bg-primary-500 rounded-r"
                    transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                  />
                )}

                <div
                  className={`
                    flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md
                    transition-all duration-150
                    ${
                      active
                        ? 'bg-slate-700/50 text-white'
                        : 'text-slate-300 hover:bg-slate-700/30 hover:text-white'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary-400' : ''}`} />
                  {!isCollapsed && <span className="flex-1 text-sm font-medium">{item.label}</span>}

                  {item.badge && (
                    <span className="flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold bg-primary-500/20 text-primary-300">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}

        {/* Then: Render sections with title */}
        {navigation
          .filter(section => section.title)
          .map((section) => {
          const isExpanded = expandedSections.has(section.title!);
          
          if (isCollapsed) {
            // Collapsed view - Show icons with hover popup
            return (
              <div
                key={section.title}
                className="relative group mb-4 pointer-events-auto"
                onMouseEnter={() => handleSectionHover(section.title!)}
                onMouseLeave={() => setHoveredSection(null)}
              >
                {/* Icon Button */}
                <button
                  ref={(el) => {
                    if (el && section.title) sectionRefsMap.current[section.title] = el;
                  }}
                  className="w-full flex justify-center items-center py-3 rounded-md hover:bg-slate-700/30 transition-colors group"
                  title={section.title}
                >
                  {(() => {
                    // Use collapsedIcon if available, otherwise use first item's icon
                    const icon = section.collapsedIcon || (section.items.length > 0 && section.items[0].icon);
                    if (icon) {
                      return React.createElement(icon as any, {
                        className: 'w-5 h-5 text-slate-300 group-hover:text-white transition-colors',
                      });
                    }
                  })()}
                </button>

                {/* Floating Menu - Fixed positioning with dynamic coordinates */}
                <AnimatePresence>
                  {hoveredSection === section.title && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="fixed w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-40 overflow-hidden"
                      style={{ 
                        top: `${menuPosition.top}px`,
                        left: `${menuPosition.left}px`,
                      }}
                    >
                      {/* Section Title */}
                      <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/50">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {section.title}
                        </p>
                      </div>

                      {/* Items - Scrollable if needed */}
                      <div className="py-2 max-h-96 overflow-y-auto">
                        {section.items.map((item) => {
                          const active = isActive(item.href);
                          const Icon = item.icon;

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => {
                                onClose?.();
                                setHoveredSection(null);
                              }}
                              className={`
                                flex items-center gap-3 px-4 py-2.5 mx-1 rounded-md
                                transition-all duration-150
                                ${
                                  active
                                    ? 'bg-slate-700/50 text-white'
                                    : 'text-slate-300 hover:bg-slate-700/30 hover:text-white'
                                }
                              `}
                            >
                              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary-400' : ''}`} />
                              <span className="flex-1 text-sm font-medium">{item.label}</span>
                              {item.badge && (
                                <span className="flex items-center justify-center h-5 w-5 rounded-full text-xs font-semibold bg-primary-500/20 text-primary-300">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          // Expanded view - Original behavior
          return (
            <div key={section.title} className="mb-6">
              {/* Section Header - Clickable */}
              <button
                onClick={() => toggleSection(section.title!)}
                className="w-full px-4 py-2 flex items-center justify-between gap-2 rounded-md hover:bg-slate-700/20 transition-colors duration-150 group"
              >
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </p>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                </motion.div>
              </button>

              {/* Section Items - Animated */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1 mt-2">
                      {section.items.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className="group relative"
                          >
                            {/* Active Indicator Background */}
                            {active && (
                              <motion.div
                                layoutId="activeNav"
                                className="absolute inset-y-0 left-0 w-1 bg-primary-500 rounded-r"
                                transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                              />
                            )}

                            <div
                              className={`
                                flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md
                                transition-all duration-150
                                ${
                                  active
                                    ? 'bg-slate-700/50 text-white'
                                    : 'text-slate-300 hover:bg-slate-700/30 hover:text-white'
                                }
                              `}
                            >
                              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary-400' : ''}`} />
                              <span className="flex-1 text-sm font-medium">{item.label}</span>

                              {item.badge && (
                                <span className="flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold bg-primary-500/20 text-primary-300">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className={`border-t border-slate-700 space-y-3 transition-all duration-300 ${isCollapsed ? 'px-2 py-3' : 'p-4'}`}>
        {/* User Info */}
        {!isCollapsed && (
          <div className="px-2 py-2 rounded-md bg-slate-700/30 border border-slate-700">
            <p className="text-sm font-semibold text-white leading-none mb-1">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={() => {
            logout();
            onClose?.();
          }}
          className={`w-full flex items-center gap-3 rounded-md
            text-critical-400/80 hover:bg-critical-500/10 hover:text-critical-300
            transition-colors duration-150 text-sm font-medium ${isCollapsed ? 'justify-center py-2' : 'px-4 py-2.5'}`}
          title="Cerrar Sesión"
        >
          <FiLogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="flex-1">Cerrar Sesión</span>}
        </button>
      </div>
    </>
  );

  // Mobile Version - Drawer
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-30"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-slate-900 z-40 flex flex-col overflow-hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop Version - Fixed Sidebar
  return (
    <aside className={`bg-slate-900 border-r border-slate-700 flex flex-col h-screen fixed left-0 top-0 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-60'}`}>
      {sidebarContent}
    </aside>
  );
}

// Mobile Toggle Button Component
export function MobileSidebarToggle({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-150"
      aria-label="Toggle sidebar"
    >
      {isOpen ? (
        <FiX className="w-6 h-6 text-slate-600" />
      ) : (
        <FiMenu className="w-6 h-6 text-slate-600" />
      )}
    </motion.button>
  );
}
