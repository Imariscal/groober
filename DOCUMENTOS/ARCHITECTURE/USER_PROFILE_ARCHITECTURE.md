# Arquitectura - Sistema de Perfil de Usuario y Configuraciones

## Resumen Ejecutivo

Se ha implementado un sistema completo de **gestión de perfil de usuario** y **configuraciones de clínica** siguiendo patrones arquitectónicos profesionales de NestJS + Next.js.

---

## Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTACIÓN (Next.js)                  │
├─────────────────────────────────────────────────────────────┤
│  - clinic/profile/page.tsx         (Perfil de Usuario)      │
│  - clinic/configurations/page.tsx  (Configuraciones)        │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────────┐
│                   SERVICIOS API (Frontend)                  │
├─────────────────────────────────────────────────────────────┤
│  - lib/auth-api.ts                 (Servicios de auth)      │
│  - lib/clinic-config-api.ts        (Servicios de config)    │
└────────────────┬────────────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
┌────────┴──────┐   ┌────┴─────────────┐
│   HTTP API    │   │  JWT Auth Guard  │
└────────┬──────┘   └────┬─────────────┘
         │                │
         └───────┬────────┘
                 │
┌────────────────┴────────────────────────────────────────────┐
│                  BACKEND (NestJS)                           │
├─────────────────────────────────────────────────────────────┤
│  CONTROLADORES                                              │
│  ├─ auth/controllers/auth.controller.ts                    │
│  └─ clinic/controllers/clinic-configurations.controller.ts │
│                                                             │
│  SERVICIOS                                                  │
│  ├─ auth/services/users.service.ts                        │
│  └─ clinic/services/clinic-configurations.service.ts      │
│                                                             │
│  DTOs (Data Transfer Objects)                              │
│  ├─ auth/dtos/update-user-profile.dto.ts                  │
│  └─ clinic/dtos/update-clinic-config.dto.ts               │
│                                                             │
│  ENTIDADES                                                  │
│  ├─ auth/entities/user.entity.ts                          │
│  └─ clinic/entities/clinic.entity.ts                      │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────────┐
│                   BASE DE DATOS                             │
├─────────────────────────────────────────────────────────────┤
│  - Tabla: users         (Datos de usuario)                  │
│  - Tabla: clinics       (Datos de clínica)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Flujo de Actualización de Perfil

### 1. Flow Frontend (Next.js)

```typescript
Usuario hace clic en "Editar"
    ↓
ProfilePage abre formulario editable
    ↓
Usuario completa campos y valida localmente
    ↓
onClick "Guardar" → handleSubmit()
    ↓
authApi.updateProfile() envía PUT a /api/auth/profile
    ↓
Backend procesa actualización
    ↓
toast.success() → ProfilePage se actualiza
```

### 2. Flow Backend (NestJS)

```
PUT /api/auth/profile
    ↓
AuthController.updateProfile()
    ↓
UsersService.updateProfile()
    ├─ Buscar usuario por ID
    ├─ Validar que email no esté duplicado (si cambió)
    ├─ Actualizar campos permitidos
    ├─ Guardar en BD
    └─ Retornar usuario actualizado
    ↓
Respuesta 200 + usuario actualizado
```

---

## Arquitectura de Directorios

### Frontend

```
vibralive-frontend/
├── src/
│   ├── app/
│   │   └── (protected)/
│   │       └── clinic/
│   │           ├── profile/
│   │           │   └── page.tsx          ← Página de perfil
│   │           └── configurations/
│   │               └── page.tsx          ← Página de configuraciones
│   │
│   └── lib/
│       ├── auth-api.ts                   ← API para auth
│       └── clinic-config-api.ts          ← API para config
```

### Backend

```
vibralive-backend/
├── src/
│   ├── auth/
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   ├── services/
│   │   │   └── users.service.ts
│   │   ├── dtos/
│   │   │   └── update-user-profile.dto.ts
│   │   └── entities/
│   │       └── user.entity.ts
│   │
│   └── clinic/
│       ├── controllers/
│       │   └── clinic-configurations.controller.ts
│       ├── services/
│       │   └── clinic-configurations.service.ts
│       ├── dtos/
│       │   └── update-clinic-config.dto.ts
│       └── entities/
│           └── clinic.entity.ts
```

---

## Endpoints API

### Autenticación y Perfil

| Método | Endpoint | Descripción | Guard |
|--------|----------|-------------|-------|
| GET | `/api/auth/profile` | Obtener perfil del usuario | JWT |
| PUT | `/api/auth/profile` | Actualizar perfil del usuario | JWT |

### Configuraciones de Clínica

| Método | Endpoint | Descripción | Guard |
|--------|----------|-------------|-------|
| PUT | `/api/clinic/configurations` | Actualizar configuraciones | JWT |

---

## DTOs (Validación)

### UpdateUserProfileDto

```typescript
{
  name: string                    // Requerido, 3-100 caracteres
  email: string                   // Requerido, debe ser válido
  phone?: string                  // Opcional, máx 20 caracteres
  address?: string                // Opcional, máx 200 caracteres
  city?: string                   // Opcional, máx 50 caracteres
  postal_code?: string            // Opcional, máx 20 caracteres
  country?: string                // Opcional, máx 50 caracteres
}
```

**Validaciones:**
- ✅ Email único (si cambió)
- ✅ Formato de email válido
- ✅ Teléfono solo con caracteres válidos: `[\d\s\-\+\(\)]+`
- ✅ Longitudes máximas respaldadas

### UpdateClinicConfigDto

```typescript
{
  notificationsEmail?: boolean    // Notificaciones por email
  notificationsSMS?: boolean      // Notificaciones por SMS
  privacy?: 'public' | 'private'  // Nivel de privacidad
  language?: 'es' | 'en'          // Idioma (Español/Inglés)
  timezone?: string               // Zona horaria (América/Europa)
}
```

---

## Mejoras de Seguridad Implementadas

1. **JWT Authentication Guard** en todos los endpoints
2. **Validación de DTOs** con class-validator
3. **Verificación de duplicados** antes de actualizar email
4. **Santización de entrada** y validación de formato
5. **Manejo de errores** robusto
6. **Timestamps** de auditoría (updated_at, created_at)

---

## Cambios en ModernTopBar.tsx

### Antes
```tsx
href={`${homeLink}/profile`}      // Dinámico según rol
href={`${homeLink}/settings`}     // Dinámico según rol
```

### Después
```tsx
href="/clinic/profile"             // Ruta fija para perfil
href="/clinic/configurations"      // Ruta fija para configuraciones
```

---

## Validaciones en Frontend

### Perfil de Usuario

✅ Nombre: Requerido, min 3 caracteres
✅ Email: Formato válido (regex)
✅ Teléfono: Solo caracteres válidos
✅ Dirección, Ciudad, País: Longitud máxima
✅ Código Postal: Formato numérico

### Configuraciones

✅ Checkboxes para notificaciones
✅ Select para privacidad y idioma
✅ Select para timezone (predefinidas)

---

## Flujo de Errores

```
Validación Frontend
    ↓
    ├─ Error → toast.error() + mostrar campo error
    └─ OK → Enviar al backend
         ↓
         Validación Backend (DTO)
            ↓
            ├─ Error → Respuesta 400 + mensaje
            └─ OK → Procesar actualización
                 ↓
                 ├─ Error BD → Respuesta 400
                 └─ OK → Respuesta 200 + datos
```

---

## Testing Sugerido

### Unit Tests (Backend)
```typescript
// UsersService.updateProfile()
- Test actualización válida
- Test email duplicado rechazado
- Test usuario no encontrado
- Test validación de formato

// ClinicConfigurationsService.updateConfiguration()
- Test actualización válida
- Test clínica no encontrada
- Test validación de enum
```

### E2E Tests (Frontend)
```typescript
// ProfilePage
- Test editar perfil válido
- Test validación de email
- Test cancelar cambios
- Test guardar exitosamente

// ConfigurationsPage
- Test cambiar notificaciones
- Test cambiar idioma
- Test cambiar timezone
```

---

## Próximas Mejoras

1. 📧 **Email de confirmación** al cambiar correo
2. 🔐 **Cambio de contraseña** en perfil
3. 📸 **Avatar/Foto de perfil**
4. 🔔 **Preferencias de notificación** más granulares
5. 🌍 **Soporte multi-idioma** en UI
6. 📱 **Two-factor authentication** (2FA)
7. 🗂️ **Historial de cambios** en perfil

---

## Notas Técnicas

- **ORM**: TypeORM con relaciones
- **Validación**: class-validator + Joi
- **Auth**: JWT con AuthGuard
- **Manejo de estado**: React hooks (useState, useEffect)
- **Toast**: react-hot-toast para notificaciones
- **HTTP Client**: Fetch API con wrapper personalizado

---

Documento creado: Marzo 9, 2026
Versión: 1.0.0
