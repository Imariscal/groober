# 📋 ANÁLISIS LIMPIO: SINCRONIZACIÓN DE PERMISOS Y ROLES

## 🎯 Objetivo General

Resinc ronizar completamente el sistema de permisos VibraLive:
1. ✅ Fuente de verdad: `roles-permissions.const.ts` (Backend)
2. 🗑️ Eliminar TODOS los permisos y asignaciones en BD
3. 🆕 Insertar permisos con descripciones y categorías amigables
4. 👤 Asignar TODOS los permisos a CLINIC_OWNER (rol dueño de clínica)

---

## 📊 ROLES IDENTIFICADOS EN roles-permissions.const.ts

| Código | Nombre | Descripción |
|--------|--------|-------------|
| SUPER_ADMIN | Super Administrador | Gestor de plataforma - Crea y gestiona clínicas y planes |
| CLINIC_OWNER | Propietario de Clínica | Administrador con acceso completo a su clínica |
| CLINIC_STAFF | Personal de Clínica | Personal operativo con acceso limitado a funciones diarias |
| CLINIC_STYLIST | Estilista | Profesional de grooming con acceso a citas y prevención |
| CLINIC_VETERINARIAN | Veterinario | Profesional veterinario con acceso a registro médico electrónico |

**Total Roles:** 5

---

## 📍 CATEGORÍAS DE PERMISOS (Mapeadas desde el archivo)

Basado en los comentarios en roles-permissions.const.ts:

| Categoría | Descripción |
|-----------|-------------|
| **Plataforma** | Gestión de plataforma, clínicas, planes, usuarios superadmin |
| **Clínica** | Configuración de clínica, branding, comunicación |
| **Usuarios y Roles** | Gestión de usuarios y roles a nivel clínica |
| **Clientes y Mascotas** | CRUD de clientes, mascotas, direcciones, tags |
| **Citas y Servicios** | Gestión de citas, servicios, paquetes |
| **Visitas Clínicas** | Visitas médicas (grooming y clínica) |
| **EHR (Expediente Médico)** | Historial médico, diagnósticos, prescripciones, vacunas, alergias |
| **Cuidado Preventivo** | Eventos de cuidado preventivo |
| **Recordatorios** | Creación, envío y gestión de recordatorios |
| **POS (Punto de Venta)** | Productos, ventas, inventario, pagos |
| **Precios y Facturación** | Listas de precios, precios de servicios y paquetes |
| **Estilistas y Disponibilidad** | Gestión de estilistas, disponibilidad, capacidad, slots |
| **Veterinarios** | Gestión de veterinarios |
| **Rutas y Optimización** | Optimización de rutas, validación, planificación grooming |
| **Campañas** | Creación y gestión de campañas de marketing |
| **Notificaciones y Comunicación** | Notificaciones, WhatsApp, Email |
| **Reportes y Analytics** | Reportes de negocio, exportación |
| **Dashboard** | Acceso a dashboard de clínica/estilista/veterinario |
| **Auditoría** | Logs de auditoría |

---

## 📝 CONTEO DE PERMISOS POR CATEGORÍA

Extraídos de roles-permissions.const.ts:

| Categoría | Cantidad | Códigos Ejemplo |
|-----------|----------|-----------------|
| Plataforma | 19 | platform:clinics:*, platform:plans:*, platform:users:*, audit:read |
| Clínica | 6 | clinic:manage, clinic:settings, clinic:branding, clinic:communication:* |
| Usuarios y Roles | 10 | users:*, roles:* |
| Clientes y Mascotas | 13 | clients:*, clients:addresses:*, clients:tags:*, pets:* |
| Citas y Servicios | 7 | appointments:* |
| Visitas Clínicas | 6 | visits:* |
| EHR (Expediente Médico) | 39 | ehr:*, medical_visits:*, medical:* |
| Cuidado Preventivo | 5 | preventive_care:* |
| Recordatorios | 5 | reminders:* |
| POS | 17 | pos:* |
| Precios | 11 | pricing:* |
| Estilistas | 15 | stylists:* |
| Veterinarios | 4 | veterinarians:* |
| Rutas | 4 | routes:* |
| Campañas | 10 | campaigns:*, campaign_templates:* |
| Notificaciones | 11 | notifications:*, whatsapp:*, email:* |
| Reportes | 8 | reports:* |
| Dashboard | 1 | dashboard:clinic |

**TOTAL PERMISOS:** ~191 (basado en roles-permissions.const.ts)

---

## 🔄 PLAN DE EJECUCIÓN

### Paso 1: Limpiar BD
```sql
-- Script 1: DELETE role_permissions
-- Script 2: DELETE permissions
```

### Paso 2: Insertar Permisos Nuevamente
```sql
-- Script 3: INSERT todos los permisos con descripciones y categorías
```

### Paso 3: Asignar a CLINIC_OWNER
```sql
-- Script 4: INSERT role_permissions para CLINIC_OWNER
```

### Paso 4: Verificar
```sql
-- Validar conteos
```

---

## 📊 RESULTADO ESPERADO

```
✅ permissions tabla: vacía → 191 registros
✅ role_permissions tabla: vacía → 191 registros (solo CLINIC_OWNER)
✅ CLINIC_OWNER: 0 permisos → 191 permisos
✅ Otros roles: Sin cambios (pueden configurarse después)
```

---

## 📋 PRÓXIMOS PASOS

1. Ejecutar Script 1 (DELETE role_permissions)
2. Ejecutar Script 2 (DELETE permissions)
3. Ejecutar Script 3 (INSERT permissions)
4. Ejecutar Script 4 (INSERT role_permissions para CLINIC_OWNER)
5. Verificar con queries de validación