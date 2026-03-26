# Guía de Pruebas Manuales - VibraLive

## Introducción
Este documento proporciona pasos detallados para probar el sistema VibraLive completo, incluyendo el backend y frontend con autenticación, autorización y gestión de roles.

**Credenciales de Demostración:**
- **Email:** superAdmin@vibralive.com
- **Password:** admin@1234

---

## PARTE 1: Preparación Inicial

### 1.1 Verificar que el Backend está ejecutándose

```bash
# En una terminal, navega a la carpeta del backend
cd vibralive-backend

# Instala las dependencias (si aún no las has instalado)
npm install

# Ejecuta el servidor backend
npm run start
```

**Resultado Esperado:**
- El servidor debe estar disponible en `http://localhost:3001`
- Deberías ver mensaje: "NestJS application ready on port 3001"

### 1.2 Verificar la Base de Datos

El backend incluye migraciones y seeds automáticas que crean las tablas y datos iniciales.

**Verificar en PostgreSQL o tu BD:**
- Tabla `user` debe existir con al menos un usuario superadmin
- Email: `superAdmin@vibralive.com`
- Rol: `superadmin`
- Estado: `ACTIVE`

### 1.3 Verificar el Frontend

```bash
# En otra terminal, navega a la carpeta del frontend
cd vibralive-frontend

# Instala las dependencias (si aún no las has instalado)
npm install

# Ejecuta el servidor frontend
npm run dev
```

**Resultado Esperado:**
- El servidor debe estar disponible en `http://localhost:3000`
- El navegador abrirá automáticamente la página de login

---

## PARTE 2: Pruebas de Autenticación

### 2.1 Prueba de Login - Modo Superadmin

**Pasos:**
1. Abre `http://localhost:3000` en tu navegador
2. Deberías ver la página de login con:
   - Campo de Email
   - Campo de Contraseña
   - Botón "Iniciar Sesión"
   - Info box azul con credenciales de demostración

3. Los campos están pre-rellenados con:
   - Email: `superAdmin@vibralive.com`
   - Password: `admin@1234`

4. Haz clic en "Iniciar Sesión"

**Resultado Esperado:**
- ✅ Login exitoso
- ✅ Redirecciona a `/dashboard` (Dashboard de Superadmin)
- ✅ Ves la sidebar con opciones como:
  - Dashboard
  - Clínicas
  - Usuarios
  - Auditoría
  - Configuración

**Qué está sucediendo en Backend:**
- `POST /api/auth/login` recibe email y password
- Backend valida credenciales
- Genera JWT token con permissions y available_menu
- Frontend recibe token y user data
- Frontend guarda en localStorage

### 2.2 Prueba de Sesión Persistente

**Pasos:**
1. Habiendo iniciado sesión como superadmin
2. Recarga la página (F5 o Ctrl+R)

**Resultado Esperado:**
- ✅ No se te redirige al login
- ✅ La sesión se mantiene
- ✅ Ves el dashboard sin dar login nuevamente

**Qué está sucediendo:**
- La app carga desde localStorage el token guardado
- Valida que el token sea válido
- Mantiene la sesión activa

### 2.3 Prueba de Logout

**Pasos:**
1. Desde el Dashboard de Superadmin
2. Busca el botón "Cerrar Sesión" (usualmente en la sidebar abajo)
3. Haz clic en él

**Resultado Esperado:**
- ✅ Sesión cerrada
- ✅ Redirecciona a `/login`
- ✅ Página de login vacía (sin pre-rellenar)
- ✅ localStorage limpio

---

## PARTE 3: Pruebas de Autorización y Permisos

### 3.1 Verificar Permisos del Superadmin

**Pasos:**
1. Habiendo iniciado sesión como superadmin
2. Abre developer console (F12) → Console
3. Ejecuta:
```javascript
// Ver objeto de usuario completo
JSON.parse(localStorage.getItem('auth'))

// Debe mostrar:
// {
//   user: {
//     id: "...",
//     name: "Super Admin",
//     email: "superAdmin@vibralive.com",
//     role: "superadmin",
//     permissions: ["clinics:*", "users:*", "audit:*", "dashboard:admin"],
//     available_features: ["clinics", "users", "audit", "dashboard"],
//     available_menu: ["dashboard", "clinics", "users", "audit", "settings"],
//     clinic_id: null,
//     status: "ACTIVE"
//   },
//   token: "eyJ0eXAiOiJKV1QiLCJhbGc..."
// }
```

**Resultado Esperado:**
- ✅ Permisos incluyen `clinics:*`, `users:*`, `audit:*`
- ✅ available_menu incluye todos los items
- ✅ Role es `superadmin`

### 3.2 Verificar que Superadmin Accede a Todas las Páginas

**Pasos:**
1. En el Dashboard, haz clic en cada menú:
   - **Clínicas** → `http://localhost:3000/admin/clinics`
   - **Usuarios** → `http://localhost:3000/admin/users`
   - **Auditoría** → `http://localhost:3000/dashboard` (tab diferente)

**Resultado Esperado:**
- ✅ Todas las páginas cargan sin problemas
- ✅ Ver tablas con datos de ejemplo
- ✅ Ver botones de "Crear" en cada página
- ✅ Ves mensajes de PermissionGate pasados

---

## PARTE 4: Pruebas de Rutas Protegidas

### 4.1 Acceso a Ruta Protegida sin Autenticación

**Pasos:**
1. Abre una terminal y ejecuta:
```bash
# Si estás autenticado, primero cierrra sesión
# Luego abre en navegador incógnito:
http://localhost:3000/clinic/dashboard
```

**Resultado Esperado:**
- ✅ Redirecciona automáticamente a `/login`
- ✅ Aparece notificación toast roja: "Debes iniciar sesión"

**Qué está sucediendo:**
- El componente `ProtectedRoute` detecta falta de autenticación
- Guarda la URL intentada como parámetro `redirect`
- Redirige a login

### 4.2 Acceso a Ruta Protegida Después de Login

**Pasos:**
1. Haz login como superadmin (esto ya lo hicimos)
2. Navega a `/clinic/dashboard`

**Resultado Esperado:**
- ✅ Acceso denegado (página 403 Unauthorized)
- ✅ Mensaje: "No tienes permisos para acceder a esta página"
- ✅ Botones: "Volver al Dashboard" y "Cerrar Sesión"

**Por qué sucede:**
- La ruta `/clinic/dashboard` es solo para rol `owner`
- El superadmin tiene role `superadmin`
- El guard de permisos rechaza el acceso

---

## PARTE 5: Crear Nuevos Usuarios (Otros Roles)

### 5.1 Registro de Nueva Clínica (Owner)

**Pasos:**
1. En login, haz clic en "¿No tienes cuenta? Registrate aquí"
2. Completa el formulario:
   - **Nombre de Clínica:** Mi Clínica Veterinaria
   - **Teléfono:** +34912345678
   - **Ciudad:** Madrid
   - **Nombre Propietario:** Dr. Juan García
   - **Email:** juan.garcia@clinica.com
   - **Contraseña:** Test@1234
   - **Confirmar Contraseña:** Test@1234
3. Haz clic en "Registrar Clínica"

**Resultado Esperado:**
- ✅ Registro exitoso
- ✅ Redirecciona a `/clinic/dashboard`
- ✅ Ves dashboard del propietario con opciones:
   - Mi Clínica
   - Clientes
   - Mascotas
   - Mi Staff
   - Reportes

**Qué sucedió en Backend:**
- Se crea nueva clínica
- Se crea nuevo usuario con rol `owner`
- Se asocia el usuario con la clínica

### 5.2 Verificar Permisos del Owner

**Pasos:**
1. Con el owner iniciado de sesión
2. Abre console (F12)
3. Ejecuta:
```javascript
JSON.parse(localStorage.getItem('auth')).user.permissions
```

**Resultado Esperado:**
- ✅ Permisos tipo:
  - `clinic:manage`
  - `clients:*`
  - `pets:*`
  - `users:*`
  - `reports:*`

### 5.3 Verificar que Owner NO Accede a /admin/clinics

**Pasos:**
1. Con sesión de owner activa
2. Intenta acceder a: `http://localhost:3000/admin/clinics`

**Resultado Esperado:**
- ✅ Redirecciona a `/clinic/dashboard` (porque no tiene permiso)
- ✅ Toast: "No tienes permisos para acceder"

---

## PARTE 6: Pruebas de Componentes PermissionGate

### 6.1 Verificar que Solo Autorizados Ven Botones

**Pasos:**
1. Inicia sesión como superadmin
2. Ve a `/admin/clinics`
3. Busca el botón "+ Nueva Clínica" (está visible porque superadmin tiene permiso)
4. Ahora cambia a sesión de owner:
   - Abre otra ventana incógnito
   - Haz login con el owner creado
   - Ve a `/clinic/clients`
   - Busca el botón "+ Nuevo Cliente" (debería estar visible porque owner tiene `clients:*`)

**Resultado Esperado:**
- ✅ El botón se muestra solo cuando el usuario tiene permiso
- ✅ El botón está oculto (no renderizado) si no tiene permiso

---

## PARTE 7: Pruebas de Menú Dinámico

### 7.1 Comparar Menús Diferentes

**Pasos:**
1. Login como superadmin
2. Observa la sidebar izquierda:
   - Dashboard
   - Clínicas
   - Usuarios
   - Auditoría
   - Configuración

3. Logout y login como owner
4. Observa la sidebar izquierda:
   - Dashboard
   - Clientes
   - Mascotas
   - Mi Staff
   - Reportes
   - Configuración Clínica

**Resultado Esperado:**
- ✅ Los menús son diferentes
- ✅ Cada rol ve solo sus opciones
- ✅ Los items son clickeables y navegan

---

## PARTE 8: Pruebas de API y Backend

### 8.1 Verificar que GET /api/auth/me Funciona

**Pasos:**
1. Inicia sesión como superadmin
2. Abre console (F12) → Network
3. En la app, haz clic en un menú para navegar
4. Busca request a `localhost:3001`
5. Verifica que llevan header:
   ```
   Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
   ```

**Resultado Esperado:**
- ✅ Las requests incluyen el JWT token
- ✅ Estado 200 OK
- ✅ Respuestas con datos del usuario

### 8.2 Intentar Acceso sin Token

**Pasos:**
1. Abre console y ejecuta:
```javascript
fetch('http://localhost:3001/api/auth/me')
```

**Resultado Esperado:**
- ✅ Respuesta 401 Unauthorized
- ✅ Mensaje: "Unauthorized"

---

## PARTE 9: Pruebas de Notificaciones (Toast)

### 9.1 Error de Credenciales

**Pasos:**
1. Ve a login
2. Ingresa:
   - Email: `superAdmin@vibralive.com`
   - Password: `password_incorrecta`
3. Haz clic en "Iniciar Sesión"

**Resultado Esperado:**
- ✅ Toast rojo: "Credenciales inválidas"
- ✅ Permanece en login

### 9.2 Error de Servidor

**Pasos:**
1. Detén el backend:
   - En la terminal donde corre NestJS, presiona Ctrl+C
2. En el frontend, intenta hacer login

**Resultado Esperado:**
- ✅ Toast rojo: "Error de servidor" o "Conexión rechazada"
- ✅ Permanece en login
- ✅ Reinicia el backend para continuar

---

## PARTE 10: Casos de Error

### 10.1 Acceso a Página Inexistente (404)

**Pasos:**
1. Navega a: `http://localhost:3000/pagina-inexistente`

**Resultado Esperado:**
- ✅ Toast amarillo/naranja: "Página no encontrada (404)"
- ✅ O redirecciona a página de error (si implementada)

### 10.2 Acceso Prohibido (403)

**Ya lo probamos en PARTE 5.3**

---

## PARTE 11: Tabla de Pruebas Completa

| Escenario | Pasos | Resultado Esperado | Estado |
|-----------|-------|-------------------|--------|
| Login Exitoso | Email + Password correcto | Redirecciona a dashboard | ✅ |
| Login Fallido | Password incorrecto | Toast error, permanece en login | ✅ |
| Sesión Persistente | Reload después de login | Mantiene sesión | ✅ |
| Logout | Clic en logout | Redirecciona a login, localStorage limpio | ✅ |
| Acceso sin Auth | Navega a ruta protegida sin login | Redirecciona a login | ✅ |
| Registro Owner | Completa formulario registro | Nueva clínica + usuario creados | ✅ |
| PermissionGate | Componente verifica permisos | Muestra/oculta contenido | ✅ |
| Menú Dinámico | Sesiones diferentes roles | Menús diferentes aparecen | ✅ |
| API Token | Request a /api/auth/me | Incluye JWT token | ✅ |
| 401 Unauthorized | Sin token en request | Respuesta 401, redirige a login | ✅ |
| 403 Forbidden | Acceso sin permiso | Redirecciona a /unauthorized | ✅ |

---

## PARTE 12: Notas Importantes

### API Endpoints Principales

```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
GET    /api/auth/me
GET    /api/clinics
GET    /api/users
GET    /api/clients
GET    /api/pets
```

### Estructura de JWT

El token JWT contiene:
```json
{
  "sub": "user-id",
  "email": "superAdmin@vibralive.com",
  "role": "superadmin",
  "iat": 1704067200,
  "exp": 1704153600
}
```

### localStorage Keys

- `auth` → Objeto con user y token
- Otros posibles: `preferences`, `theme`, etc.

### Archivos Clave del Frontend

- `src/lib/api-client.ts` → Configuración API con interceptores
- `src/hooks/useAuth.ts` → Hook principal de autenticación
- `src/store/auth-store.ts` → Estado global con Zustand
- `src/components/ProtectedRoute.tsx` → Protección de rutas
- `src/components/PermissionGate.tsx` → Control de permisos por componente
- `src/components/DynamicSidebar.tsx` → Menú dinámico por rol

### Archivos Clave del Backend

- `src/modules/auth/auth.service.ts` → Lógica de autenticación
- `src/modules/auth/auth.controller.ts` → Endpoints de auth
- `src/modules/auth/constants/roles-permissions.const.ts` → Definición de roles y permisos
- `src/modules/auth/guards/permission.guard.ts` → Guard de permisos
- `src/common/decorators/require-permission.decorator.ts` → Decorador para proteger endpoints

---

## PARTE 13: Próximos Pasos (Desarrollo Futuro)

1. **Implementar CRUD Real:**
   - Conectar tablas de clientes, mascotas
   - Implementar formularios de creación/edición
   - Persistir datos en backend

2. **Mejorar UI:**
   - Agregar confirmación de eliminación
   - Mejoras en modales
   - Paginación en tablas

3. **Features Adicionales:**
   - Recordatorios automáticos
   - Reportes
   - Exportar datos
   - Búsqueda y filtros avanzados

4. **Testing:**
   - Unit tests para componentes React
   - Tests de integración para API
   - E2E tests con Cypress

---

## Conclusión

Este documento cubre las pruebas básicas del sistema. Si algo no funciona como se esperado:

1. Verifica los logs del backend (terminal donde corre NestJS)
2. Abre Console del navegador (F12)
3. Revisa la tabla Network en Developer Tools
4. Comprueba que ambos servidores (3000 y 3001) están corriendo

¡Éxito en las pruebas!
