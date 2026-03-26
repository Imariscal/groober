'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiLogOut } from 'react-icons/fi';
import * as MdIcons from 'react-icons/md';
import { useAuth } from '@/hooks/useAuth';
import { getMenuForRole } from '@/types/menu';


export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  // Filtrar menú según role y permisos del usuario
  const menuItems = getMenuForRole(user?.role, user?.permissions || []);

  // Helper to render icons dynamically
  const renderIcon = (iconName: string) => {
    const IconComponent = MdIcons[iconName as keyof typeof MdIcons];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="font-bold">V</span>
          </div>
          <span className="font-bold text-lg">Groober</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase px-4 mb-4">
          Menú
        </p>
        <div className="space-y-2">
          {menuItems.map(({ href, label, icon, children }) => {
            const isActive = pathname === href || pathname.startsWith(href);
            return (
              <>
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {renderIcon(icon)}
                  <span>{label}</span>
                </Link>
                {children && (
                  <div className="ml-8 space-y-1">
                    {children.map(child => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-2 px-4 py-1 rounded transition-colors ${
                          pathname === child.href
                            ? 'bg-primary-700 text-white'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        {renderIcon(child.icon)}
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-700 p-4 space-y-2">
        <div className="px-4 py-2 text-sm">
          <p className="font-semibold">{user?.name}</p>
          <p className="text-gray-400 text-xs">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors text-sm"
        >
          <FiLogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
