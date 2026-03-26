# Pruebas Manuales - Versión Simplificada

Pasos simples para verificar que todo funciona correctamente.

## ✅ Paso 1: Iniciar Servicios

**Terminal 1 - Backend:**
```bash
cd vibralive-backend
npm install
npm run start
```
Espera a ver: `NestJS application ready on port 3001`

**Terminal 2 - Frontend:**
```bash
cd vibralive-frontend
npm install
npm run dev
```
Espera a ver: `Local: http://localhost:3000`

---

## ✅ Paso 2: Login como Superadmin

1. Abre `http://localhost:3000`
2. Los campos están pre-llenados:
   - Email: `superAdmin@vibralive.com`
   - Password: `admin@1234`
3. Haz clic en "Iniciar Sesión"

**Esperado:**
- Login exitoso
- Ves Dashboard con 4 cards: Clínicas, Usuarios, Clientes, Mascotas
- Sidebar con: Dashboard, Clínicas, Usuarios, Auditoría, Configuración

---

## ✅ Paso 3: Explora Menú Superadmin

Haz clic en cada opción de sidebar:

1. **Dashboard** → Ver estadísticas
2. **Clínicas** → Ver tabla con clínicas de ejemplo
3. **Usuarios** → Ver tabla con usuarios
4. **Auditoría** → Página de auditoría (placeholder)
5. **Configuración** → Página de configuración (placeholder)

**Esperado:** Todas cargan sin errores

---

## ✅ Paso 4: Verifica Sesión Persistente

1. Presiona F5 para recargar la página
2. **Esperado:** No te redirige a login, permanece en el dashboard con la sesión activa

---

## ✅ Paso 5: Logout

1. En la sidebar, busca el botón "Cerrar Sesión" (abajo)
2. Haz clic
3. **Esperado:**
   - Redirecciona a login
   - Página vacía sin pre-rellenar
   - LocalStorage limpio

---

## ✅ Paso 6: Crea una Nueva Clínica (Owner)

1. En login, haz clic en "¿No tienes cuenta? Registrate aquí"
2. Completa:
   - Clínica: `Mi Clínica`
   - Teléfono: `+34912345678`
   - Ciudad: `Madrid`
   - Propietario: `Dr. García`
   - Email: `garcia@clinic.com`
   - Password: `Test@1234`
   - Confirmar: `Test@1234`
3. Haz clic en "Registrar Clínica"

**Esperado:**
- Registro exitoso
- Redirecciona a `/clinic/dashboard`
- Ves Dashboard de Owner con cards diferentes
- Sidebar muestra: Dashboard, Clientes, Mascotas, Mi Staff, Reportes

---

## ✅ Paso 7: Prueba Acceso Limitado del Owner

1. Con sesión del Owner (García)
2. **Intenta acceder a:** `http://localhost:3000/admin/clinics`
3. **Esperado:**
   - Redirecciona a `/unauthorized`
   - Mensaje: "No tienes permisos para acceder a esta página"
   - Botón: "Volver al Dashboard"

---

## ✅ Paso 8: Prueba Acceso Owner desde Superadmin

1. Logout (Cerrar Sesión)
2. Login nuevamente como superadmin
3. **Intenta acceder a:** `http://localhost:3000/clinic/dashboard`
4. **Esperado:**
   - Redirecciona a `/unauthorized`
   - No puede acceder porque es para owners

---

## ✅ Paso 9: Verifica Tablas de Datos

**Como Superadmin:**
1. Ve a `/admin/clinics` → Ver tabla de clínicas
2. Ver botón "+ Nueva Clínica" (visible porque tiene permiso)

**Como Owner:**
1. Ve a `/clinic/clients` → Ver tabla de clientes
2. Ver botón "+ Nuevo Cliente" (visible porque tiene permiso)

---

## ✅ Paso 10: Prueba Error de Login

1. Logout
2. Intenta login con:
   - Email: `superAdmin@vibralive.com`
   - Password: `password_incorrecta`
3. **Esperado:**
   - Toast rojo: "Credenciales inválidas"
   - Permanece en login

---

## ✅ Paso 11: Verifica Token en localStorage

1. Con sesión activa, presiona F12 (Developer Tools)
2. Ve a Application → localStorage
3. Busca la clave `auth`
4. **Esperado:** Ver JSON con:
   ```json
   {
     "user": {
       "id": "...",
       "email": "superAdmin@vibralive.com",
       "role": "superadmin",
       "permissions": ["clinics:*", "users:*", ...]
     },
     "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
   }
   ```

---

## ✅ Paso 12: Verifica API Con Token

1. Abre Console (F12 → Console)
2. Ejecuta:
```javascript
fetch('http://localhost:3001/api/auth/me', {
  headers: { 'Authorization': 'Bearer ' + JSON.parse(localStorage.getItem('auth')).token }
})
.then(r => r.json())
.then(d => console.log(d))
```

3. **Esperado:** Ver objeto de usuario completo con permisos

---

## ✅ Paso 13: Prueba API Sin Token

1. En Console, ejecuta:
```javascript
fetch('http://localhost:3001/api/auth/me')
```

2. **Esperado:**
   - Respuesta 401 Unauthorized
   - Mensaje: "Unauthorized"

---

## ✅ Paso 14: Prueba Menúes Diferentes

**Superadmin ve:**
```
Dashboard
Clínicas
Usuarios  
Auditoría
Configuración
```

**Owner ve:**
```
Dashboard
Clientes
Mascotas
Mi Staff
Reportes
Configuración Clínica
```

---

## 🎯 Resumen de Pruebas

| Test | Resultado |
|------|-----------|
| Login superadmin | ✅ |
| Ver dashboard | ✅ |
| Menú dinámico | ✅ |
| Logout | ✅ |
| Sesión persistente | ✅ |
| Registro owner | ✅ |
| Permisos dinámicos | ✅ |
| Acceso denegado (403) | ✅ |
| Token en request | ✅ |
| Credenciales inválidas | ✅ |

---

## 🔴 Si Algo No Funciona

### Login no funciona
- Verifica backend en puerto 3001
- Verifica BD tiene superadmin
- Revisa Console del navegador (F12)

### No ve dashboard
- Verifica que está autenticado (localStorage tiene 'auth')
- Comprueba que backend devuelve token
- Revisa Network en Developer Tools

### Permiso bloqueado incorrectamente
- Verifica role del usuario
- Revisa matriz de permisos en SYSTEM_ARCHITECTURE.md
- Comprueba que Backend está devolviendo permisos correctamente

### Toast no aparece
- Verifica que react-hot-toast está instalado
- Revisa Console para errores
- Comprueba que api-client.ts tiene toast imports

---

## 📚 Archivos de Referencia

- **MANUAL_TESTING_GUIDE.md** - Pruebas completas (13 secciones)
- **SYSTEM_ARCHITECTURE.md** - Diagrama de arquitectura  
- **TEST_USERS_GUIDE.md** - Usuarios y SQL de prueba
- **PROJECT_STATUS.md** - Estado general del proyecto

---

## ✨ Conclusión

Si todos estos pasos funcionan, el sistema está listo para:
- ✅ Integrar datos reales de BD
- ✅ Agregar más endpoints API
- ✅ Implementar CRUD completo
- ✅ Deploy a producción

¡Éxito! 🎉
