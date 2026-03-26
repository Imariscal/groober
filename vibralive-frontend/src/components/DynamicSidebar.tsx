'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useAuth } from '@/hooks/useAuth';
import { getMenuForRole, MenuItem } from '@/types/menu';
import { MdLogout, MdMenu, MdClose } from 'react-icons/md';

/**
 * Sidebar dinámico que se adapta al rol del usuario
 * Renderiza solo los items de menú disponibles para su rol
 */
export function DynamicSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { logout } = useAuth();

  if (!user) return null;

  const menuItems = getMenuForRole(user.role);

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleLogout = () => {
    if (confirm('¿Deseas cerrar sesión?')) {
      logout();
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            {isMobileOpen ? (
              <MdClose size={24} />
            ) : (
              <MdMenu size={24} />
            )}
          </button>
          <h1 className="text-lg font-bold text-gray-900">Groober</h1>
        </div>
        <div className="text-sm text-gray-600">{user.role}</div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 lg:transform-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto flex flex-col
        `}
        style={{ top: 'var(--header-height, 0)' }}
      >
        {/* Logo / Header */}
        <div className="hidden lg:flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Groober</h1>
            <p className="text-xs text-gray-500 capitalize mt-1">{user.role}</p>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-600 truncate">{user.email}</p>
          {user.clinic_id && (
            <p className="text-xs text-gray-500 mt-1">Clínica asignada</p>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <MenuItemComponent
              key={item.id}
              item={item}
              isActive={isActive}
              onNavigate={() => setIsMobileOpen(false)}
            />
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition font-medium text-sm"
          >
            <MdLogout size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}

interface MenuItemComponentProps {
  item: MenuItem;
  isActive: (href: string) => boolean;
  onNavigate: () => void;
}

function MenuItemComponent({
  item,
  isActive,
  onNavigate,
}: MenuItemComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const active = isActive(item.href);

  return (
    <div>
      <div className="flex items-center">
        <Link
          href={item.href}
          onClick={onNavigate}
          className={`
            flex-1 flex items-center space-x-3 px-4 py-2 rounded-lg transition font-medium text-sm
            ${
              active
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }
          `}
        >
          <IconRenderer icon={item.icon} />
          <span>{item.label}</span>
          {item.badge && (
            <span className={`ml-auto px-2 py-1 rounded text-xs font-semibold bg-${item.badge.color}-100 text-${item.badge.color}-700`}>
              {item.badge.label}
            </span>
          )}
        </Link>

        {item.children && item.children.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-2 hover:bg-gray-100 rounded transition"
          >
            <span className={`transition ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
        )}
      </div>

      {/* Submenu */}
      {item.children && isExpanded && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-0">
          {item.children.map((child) => (
            <Link
              key={child.id}
              href={child.href}
              onClick={onNavigate}
              className={`
                flex items-center space-x-3 px-4 py-2 rounded-lg transition text-sm
                ${
                  isActive(child.href)
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              <IconRenderer icon={child.icon} size={16} />
              <span>{child.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

interface IconRendererProps {
  icon: string;
  size?: number;
}

function IconRenderer({ icon, size = 20 }: IconRendererProps) {
  // Aquí puedes mapear strings a iconos reales
  // Por ahora retornamos un placeholder
  return (
    <div className="w-5 h-5 flex items-center justify-center">
      <span className="text-lg">📌</span>
    </div>
  );
}
