'use client';

import React from 'react';
import { usePermissions, useActions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/PermissionGate';

/**
 * Ejemplos de cómo usar los hooks de permisos en componentes
 */

// ❌ MALO - Acceder directamente a user.permissions
// if (user?.permissions?.includes('clients:create')) { ... }

// ✅ BUENO - Usar el hook usePermissions
function ClientsListExample() {
  const { has, hasAny, hasFeature } = usePermissions();

  if (!has('clients:read')) {
    return <div>No tienes permisos para ver clientes</div>;
  }

  return (
    <div className="space-y-4">
      <h1>Gestión de Clientes</h1>

      {/* Botón para crear solo si tiene permiso */}
      {has('clients:create') && (
        <button className="btn btn-primary">
          + Crear Cliente
        </button>
      )}

      {/* Mostrar tabla si tiene permiso de lectura */}
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            {/* Mostrar columna "Acciones" solo si puede hacer algo */}
            {hasAny(['clients:update', 'clients:delete']) && (
              <th>Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {/* Tabla aquí */}
        </tbody>
      </table>

      {/* Mostrar ítem dinámicamente si tiene feature */}
      {hasFeature('clients-management') && (
        <div className="mt-4 p-4 bg-blue-50 rounded">
          Gestión de clientes habilitada
        </div>
      )}
    </div>
  );
}

// Usar useActions para acciones comunes
function ClientActionsExample() {
  const {
    canCreateClient,
    canUpdateClient,
    canDeleteClient,
  } = useActions();

  return (
    <div className="flex gap-2">
      {canCreateClient() && (
        <button className="btn btn-sm btn-primary">Crear</button>
      )}

      {canUpdateClient() && (
        <button className="btn btn-sm btn-secondary">Editar</button>
      )}

      {canDeleteClient() && (
        <button className="btn btn-sm btn-danger">Eliminar</button>
      )}
    </div>
  );
}

// Usar PermissionGate para envolver contenido
function ClientsPageExample() {
  return (
    <PermissionGate
      permissions={['clients:read']}
      fallback={<div className="text-red-600">Acceso denegado</div>}
    >
      <div className="space-y-4">
        <ClientsListExample />
        <ClientActionsExample />
      </div>
    </PermissionGate>
  );
}

// Ejemplo: Formulario completo
function CreateClientFormExample() {
  const { has } = usePermissions();

  if (!has('clients:create')) {
    return <div>No tienes permisos para crear clientes</div>;
  }

  return (
    <form className="space-y-4 max-w-2xl">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Nombre
        </label>
        <input
          id="name"
          type="text"
          placeholder="Nombre del cliente"
          className="input input-bordered w-full"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="email@example.com"
          className="input input-bordered w-full"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium">
          Teléfono
        </label>
        <input
          id="phone"
          type="tel"
          placeholder="+1234567890"
          className="input input-bordered w-full"
        />
      </div>

      {/* Tags solo si tiene permisos */}
      {has('clients:tags:create') && (
        <div>
          <label htmlFor="tags" className="block text-sm font-medium">
            Etiquetas
          </label>
          <input
            id="tags"
            type="text"
            placeholder="Tag1, Tag2"
            className="input input-bordered w-full"
          />
        </div>
      )}

      <button type="submit" className="btn btn-primary">
        Crear Cliente
      </button>
    </form>
  );
}

// Ejemplo: Modal de acciones
function ClientActionsModalExample() {
  const { has, hasAll } = usePermissions();
  const [isOpen, setIsOpen] = React.useState(false);

  // Solo mostrar modal si puede hacer ALGO
  if (!hasAll(['clients:update', 'clients:delete'])) {
    return null;
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-sm btn-ghost"
      >
        Acciones
      </button>

      {isOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Acciones</h3>

            <div className="space-y-2">
              {has('clients:update') && (
                <button className="btn btn-sm btn-block">
                  ✏️ Editar Cliente
                </button>
              )}

              {has('clients:addresses:update') && (
                <button className="btn btn-sm btn-block">
                  📍 Editar Dirección
                </button>
              )}

              {has('clients:delete') && (
                <button className="btn btn-sm btn-block btn-error">
                  🗑️ Eliminar Cliente
                </button>
              )}
            </div>

            <div className="modal-action">
              <button
                onClick={() => setIsOpen(false)}
                className="btn"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Ejemplo: Dashboard con múltiples secciones
function DashboardExample() {
  const { hasFeature, has } = usePermissions();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Clientes */}
      {hasFeature('clients-management') && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">👥 Clientes</h2>
            <p>Total: 342</p>
            {has('clients:create') && (
              <div className="card-actions">
                <button className="btn btn-primary btn-sm">
                  + Nuevo Cliente
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mascotas */}
      {hasFeature('pets-management') && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">🐾 Mascotas</h2>
            <p>Total: 456</p>
            {has('pets:create') && (
              <div className="card-actions">
                <button className="btn btn-primary btn-sm">
                  + Nueva Mascota
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Citas */}
      {hasFeature('appointments-management') && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">📅 Citas</h2>
            <p>Próximas: 12</p>
            {has('appointments:create') && (
              <div className="card-actions">
                <button className="btn btn-primary btn-sm">
                  + Nueva Cita
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export {
  ClientsListExample,
  ClientActionsExample,
  ClientsPageExample,
  CreateClientFormExample,
  ClientActionsModalExample,
  DashboardExample,
};
