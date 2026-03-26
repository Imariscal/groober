# 📋 Matriz de Permisos - VibraLive

## Estructura de Permisos

Cada permiso sigue el patrón: `modulo:accion`

### Ejemplos:
- `clients:read` = Leer clientes
- `clients:create` = Crear clientes
- `appointments:update_status` = Cambiar estado de cita
- `pricing:price_lists:delete` = Eliminar lista de precios

---

## 🏠 MÓDULOS Y ACCIONES

### 📊 DASHBOARD
| Permiso | Descripción | Owner | Staff | Admin |
|---------|-------------|-------|-------|-------|
| `dashboard:clinic` | Ver dashboard clínica | ✅ | ✅ | ✅ |

### 👥 CLIENTES
| Permiso | Descripción | Owner | Staff | Admin |
|---------|-------------|-------|-------|-------|
| `clients:read` | Leer/listar clientes | ✅ | ✅ | ✅ |
| `clients:create` | Crear cliente | ✅ | ❌ | ✅ |
| `clients:update` | Editar cliente | ✅ | ❌ | ✅ |
| `clients:deactivate` | Desactivar cliente | ✅ | ❌ | ✅ |
| `clients:delete` | Eliminar cliente | ✅ | ❌ | ✅ |
| `clients:addresses:create` | Crear dirección | ✅ | ❌ | ✅ |
| `clients:addresses:read` | Leer direcciones | ✅ | ✅ | ✅ |
| `clients:addresses:update` | Editar dirección | ✅ | ❌ | ✅ |
| `clients:addresses:delete` | Eliminar dirección | ✅ | ❌ | ✅ |
| `clients:addresses:set_default` | Marcar dirección por defecto | ✅ | ❌ | ✅ |
| `clients:tags:create` | Crear etiqueta | ✅ | ❌ | ✅ |
| `clients:tags:read` | Leer etiquetas | ✅ | ✅ | ✅ |
| `clients:tags:delete` | Eliminar etiqueta | ✅ | ❌ | ✅ |

### 🐾 MASCOTAS
| Permiso | Descripción | Owner | Staff | Admin |
|---------|-------------|-------|-------|-------|
| `pets:read` | Leer/listar mascotas | ✅ | ✅ | ✅ |
| `pets:create` | Crear mascota | ✅ | ❌ | ✅ |
| `pets:update` | Editar mascota | ✅ | ❌ | ✅ |
| `pets:delete` | Eliminar mascota | ✅ | ❌ | ✅ |

### 📅 CITAS
| Permiso | Descripción | Owner | Staff | Admin |
|---------|-------------|-------|-------|-------|
| `appointments:read` | Leer/listar citas | ✅ | ✅ | ✅ |
| `appointments:create` | Crear cita | ✅ | ✅ | ✅ |
| `appointments:update` | Editar cita | ✅ | ✅ | ✅ |
| `appointments:update_status` | Cambiar estado de cita | ✅ | ✅ | ✅ |
| `appointments:update_services` | Modificar servicios de cita | ✅ | ✅ | ✅ |
| `appointments:complete` | Completar cita | ✅ | ✅ | ✅ |
| `appointments:check_availability` | Verificar disponibilidad | ✅ | ✅ | ✅ |

### 🛠️ SERVICIOS
| Permiso | Descripción | Owner | Staff | Admin |
|---------|-------------|-------|-------|-------|
| `services:read` | Leer servicios | ✅ | ✅ | ✅ |
| `services:create` | Crear servicio | ✅ | ❌ | ✅ |
| `services:update` | Editar servicio | ✅ | ❌ | ✅ |
| `services:deactivate` | Desactivar servicio | ✅ | ❌ | ✅ |
| `services:delete` | Eliminar servicio | ✅ | ❌ | ✅ |

### 📦 PAQUETES
| Permiso | Descripción | Owner | Staff | Admin |
|---------|-------------|-------|-------|-------|
| `packages:read` | Leer paquetes | ✅ | ✅ | ✅ |
| `packages:create` | Crear paquete | ✅ | ❌ | ✅ |
| `packages:update` | Editar paquete | ✅ | ❌ | ✅ |
| `packages:deactivate` | Desactivar paquete | ✅ | ❌ | ✅ |
| `packages:delete` | Eliminar paquete | ✅ | ❌ | ✅ |

### 💰 PRECIOS
| Permiso | Descripción | Owner | Staff | Admin |
|---------|-------------|-------|-------|-------|
| `pricing:price_lists:read` | Leer listas de precios | ✅ | ❌ | ✅ |
| `pricing:price_lists:create` | Crear lista de precios | ✅ | ❌ | ✅ |
| `pricing:price_lists:delete` | Eliminar lista de precios | ✅ | ❌ | ✅ |
| `pricing:service_prices:read` | Leer precios de servicios | ✅ | ❌ | ✅ |
| `pricing:service_prices:create` | Crear precio de servicio | ✅ | ❌ | ✅ |
| `pricing:service_prices:update` | Actualizar precio de servicio | ✅ | ❌ | ✅ |
| `pricing:service_prices:delete` | Eliminar precio de servicio | ✅ | ❌ | ✅ |
| `pricing:package_prices:read` | Leer precios de paquetes | ✅ | ❌ | ✅ |
| `pricing:package_prices:create` | Crear precio de paquete | ✅ | ❌ | ✅ |
| `pricing:package_prices:update` | Actualizar precio de paquete | ✅ | ❌ | ✅ |
| `pricing:package_prices:delete` | Eliminar precio de paquete | ✅ | ❌ | ✅ |
| `pricing:calculate` | Calcular precios | ✅ | ✅ | ✅ |
| `pricing:history` | Ver historial de precios | ✅ | ✅ | ✅ |

### 👨‍💼 ESTILISTAS
| Permiso | Descripción | Owner | Staff | Admin |
|---------|-------------|-------|-------|-------|
| `stylists:read` | Leer estilistas | ✅ | ✅ | ✅ |
| `stylists:update` | Editar estilista | ✅ | ❌ | ✅ |
| `stylists:availability:create` | Crear disponibilidad | ✅ | ❌ | ✅ |
| `stylists:availability:read` | Leer disponibilidad | ✅ | ✅ | ✅ |
| `stylists:availability:update` | Editar disponibilidad | ✅ | ❌ | ✅ |
| `stylists:availability:delete` | Eliminar disponibilidad | ✅ | ❌ | ✅ |
| `stylists:unavailable:create` | Crear no disponibilidad | ✅ | ❌ | ✅ |
| `stylists:unavailable:read` | Leer no disponibilidad | ✅ | ✅ | ✅ |
| `stylists:unavailable:update` | Editar no disponibilidad | ✅ | ❌ | ✅ |
| `stylists:unavailable:delete` | Eliminar no disponibilidad | ✅ | ❌ | ✅ |
| `stylists:capacity:create` | Crear capacidad | ✅ | ❌ | ✅ |
| `stylists:capacity:read` | Leer capacidad | ✅ | ✅ | ✅ |
| `stylists:capacity:update` | Editar capacidad | ✅ | ❌ | ✅ |
| `stylists:capacity:delete` | Eliminar capacidad | ✅ | ❌ | ✅ |
| `stylists:slots` | Gestionar slots | ✅ | ✅ | ✅ |

### 🗺️ RUTEO
| Permiso | Descripción | Owner | Staff | Admin |
|---------|-------------|-------|-------|-------|
| `routes:optimize` | Optimizar rutas | ✅ | ❌ | ✅ |
| `routes:validate` | Validar rutas | ✅ | ❌ | ✅ |
| `routes:config` | Configurar ruteo | ✅ | ❌ | ✅ |
| `routes:plan_home_grooming` | Planificar home grooming | ✅ | ❌ | ✅ |

### 📢 CAMPAÑAS
| Permiso | Descripción | Owner | Staff | Admin |
|---------|-------------|-------|-------|-------|
| `campaigns:read` | Leer campañas | ✅ | ❌ | ✅ |
| `campaigns:create` | Crear campaña | ✅ | ❌ | ✅ |
| `campaigns:update` | Editar campaña | ✅ | ❌ | ✅ |
| `campaigns:delete` | Eliminar campaña | ✅ | ❌ | ✅ |
| `campaigns:start` | Iniciar campaña | ✅ | ❌ | ✅ |
| `campaigns:pause` | Pausar campaña | ✅ | ❌ | ✅ |
| `campaigns:resume` | Reanudar campaña | ✅ | ❌ | ✅ |
| `campaigns:metrics` | Ver métricas | ✅ | ❌ | ✅ |
| `campaigns:recipients` | Gestionar destinatarios | ✅ | ❌ | ✅ |
| `campaigns:preview_audience` | Pre ver audiencia | ✅ | ❌ | ✅ |

### 📝 PLANTILLAS
| Permiso | Descripción | Owner | Staff | Admin |
|---------|-------------|-------|-------|-------|
| `campaign_templates:read` | Leer plantillas | ✅ | ❌ | ✅ |
| `campaign_templates:create` | Crear plantilla | ✅ | ❌ | ✅ |
| `campaign_templates:update` | Editar plantilla | ✅ | ❌ | ✅ |
| `campaign_templates:delete` | Eliminar plantilla | ✅ | ❌ | ✅ |
| `campaign_templates:preview` | Vista previa | ✅ | ✅ | ✅ |
| `campaign_templates:render` | Renderizar plantilla | ✅ | ✅ | ✅ |
| `campaign_templates:variables` | Ver variables | ✅ | ✅ | ✅ |

### 🔔 NOTIFICACIONES
| Permiso | Descripción | Owner | Staff | Admin |
|---------|-------------|-------|-------|-------|
| `notifications:read` | Leer notificaciones | ✅ | ✅ | ✅ |
| `notifications:create` | Crear notificación | ✅ | ❌ | ✅ |
| `notifications:details` | Ver detalles | ✅ | ✅ | ✅ |
| `notifications:queue` | Gestionar cola | ✅ | ❌ | ✅ |
| `notifications:errors` | Ver errores | ✅ | ❌ | ✅ |
| `notifications:retry` | Reintentar | ✅ | ❌ | ✅ |
| `notifications:delete` | Eliminar | ✅ | ❌ | ✅ |

### 💬 WHATSAPP
| Permiso | Descripción | Owner | Staff | Admin |
|---------|-------------|-------|-------|-------|
| `whatsapp:send` | Enviar WhatsApp | ✅ | ❌ | ✅ |
| `whatsapp:read_outbox` | Leer bandeja salida | ✅ | ✅ | ✅ |
| `whatsapp:read_message` | Leer mensaje | ✅ | ✅ | ✅ |
| `whatsapp:retry` | Reintentar envío | ✅ | ❌ | ✅ |

### 📧 EMAIL
| Permiso | Descripción | Owner | Staff | Admin |
|---------|-------------|-------|-------|-------|
| `email:send` | Enviar email | ✅ | ❌ | ✅ |
| `email:read_outbox` | Leer bandeja salida | ✅ | ✅ | ✅ |
| `email:retry` | Reintentar envío | ✅ | ❌ | ✅ |

### 📈 REPORTES
| Permiso | Descripción | Owner | Staff | Admin |
|---------|-------------|-------|-------|-------|
| `reports:view` | Ver reportes | ✅ | ❌ | ✅ |
| `reports:revenue` | Reportes de ingresos | ✅ | ❌ | ✅ |
| `reports:appointments` | Reportes de citas | ✅ | ❌ | ✅ |
| `reports:clients` | Reportes de clientes | ✅ | ❌ | ✅ |
| `reports:services` | Reportes de servicios | ✅ | ❌ | ✅ |
| `reports:performance` | Reportes de rendimiento | ✅ | ❌ | ✅ |
| `reports:geography` | Reportes geográficos | ✅ | ❌ | ✅ |
| `reports:export` | Exportar reportes | ✅ | ❌ | ✅ |

### 👤 USUARIOS
| Permiso | Descripción | Owner | Staff | Admin |
|---------|-------------|-------|-------|-------|
| `users:read` | Leer usuarios | ✅ | ❌ | ✅ |
| `users:create` | Crear usuario | ✅ | ❌ | ✅ |
| `users:update` | Editar usuario | ✅ | ❌ | ✅ |
| `users:deactivate` | Desactivar usuario | ✅ | ❌ | ✅ |
| `users:delete` | Eliminar usuario | ✅ | ❌ | ✅ |

### 🔐 SEGURIDAD
| Permiso | Descripción | Owner | Staff | Admin |
|---------|-------------|-------|-------|-------|
| `clinic:manage` | Gestionar clínica | ✅ | ❌ | ✅ |
| `clinic:settings` | Configurar clínica | ✅ | ❌ | ✅ |
| `clinic:branding` | Personalizar marca | ✅ | ❌ | ✅ |
| `clinic:communication:config` | Config. comunicaciones | ✅ | ❌ | ✅ |
| `clinic:communication:read` | Leer comunicaciones | ✅ | ✅ | ✅ |
| `clinic:calendar:manage` | Gestionar calendario | ✅ | ✅ | ✅ |

### 🔑 ROLES Y PERMISOS
| Permiso | Descripción | Owner | Staff | Admin |
|---------|-------------|-------|-------|-------|
| `roles:create` | Crear rol | ❌ | ❌ | ✅ |
| `roles:read` | Leer roles | ❌ | ❌ | ✅ |
| `roles:update` | Editar rol | ❌ | ❌ | ✅ |
| `roles:delete` | Eliminar rol | ❌ | ❌ | ✅ |
| `roles:permissions:list` | Listar permisos | ❌ | ❌ | ✅ |

---

## 🛡️ CÓMO USAR LOS PERMISOS

### En Componentes

```tsx
import { usePermissions } from '@/hooks/usePermissions';

export function ClientsList() {
  const { has, hasAny } = usePermissions();

  return (
    <div>
      {has('clients:read') && (
        <div>Contenido visible solo para lectura</div>
      )}
      
      {has('clients:create') && (
        <button>Crear Cliente</button>
      )}

      {hasAny(['clients:update', 'clients:delete']) && (
        <div>Menú de acciones</div>
      )}
    </div>
  );
}
```

### En Rutas Protegidas

```tsx
import { PermissionGateRoute } from '@/components/PermissionGate';

export default function ClientsPage() {
  return (
    <PermissionGateRoute permissions={['clients:read']}>
      <ClientsContent />
    </PermissionGateRoute>
  );
}
```

### En el Menú

El componente `menu-config.ts` ya filtra automáticamente items según permisos del usuario.

### useActions Hook

Para acciones comunes:

```tsx
import { useActions } from '@/hooks/usePermissions';

export function ClientActions() {
  const {
    canCreateClient,
    canUpdateClient,
    canDeleteClient,
  } = useActions();

  return (
    <>
      {canCreateClient() && <CreateButton />}
      {canUpdateClient() && <EditButton />}
      {canDeleteClient() && <DeleteButton />}
    </>
  );
}
```

---

## 📝 NOTAS IMPORTANTES

1. **Siempre verificar en backend** - Los permisos del frontend son UX, la validación real debe estar en el backend
2. **Los permisos se cargan en el login** - Vienen en el JWT y se almacenan en el usuario
3. **El menú se filtra automáticamente** - No necesitas hacer nada especial, la config de menú ya lo hace
4. **Usar usePermissions para lógica** - Es más limpio que acceder a `user.permissions` directamente
