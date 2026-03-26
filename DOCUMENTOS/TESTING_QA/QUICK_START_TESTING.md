# Quick Start - Pruebas VibraLive

Guía rápida de 10 minutos para probar el sistema completo.

## 1️⃣ Inicia el Backend

```bash
cd vibralive-backend
npm install  # Solo la primera vez
npm run start
```

Espera a ver: `NestJS application ready on port 3001`

## 2️⃣ Inicia el Frontend

En otra terminal:
```bash
cd vibralive-frontend
npm install  # Solo la primera vez
npm run dev
```

Espera a ver: `Local: http://localhost:3000`

## 3️⃣ Prueba el Login (Superadmin)

1. Ve a `http://localhost:3000`
2. Ya están pre-rellenados:
   - Email: `superAdmin@vibralive.com`
   - Password: `admin@1234`
3. Haz clic en "Iniciar Sesión"

✅ **Resultado:** Dashboard con opciones: Clínicas, Usuarios, Auditoría

## 4️⃣ Explora el Dashboard Superadmin

- Dashboard → Estadísticas del sistema
- Clínicas → Tabla de clínicas existentes
- Usuarios → Tabla de usuarios del sistema

## 5️⃣ Crea un Nuevo Owner (Propietario de Clínica)

1. Logout (botón abajo en la sidebar)
2. En login, haz clic en "¿No tienes cuenta? Registrate aquí"
3. Completa:
   - Clínica: "Mi Clínica"
   - Teléfono: "+34912345678"
   - Ciudad: "Madrid"
   - Propietario: "Dr. García"
   - Email: "garcia@clinica.com"
   - Password: "Test@1234"
4. Submit

✅ **Resultado:** Nuevo dashboard con opciones: Clientes, Mascotas, Staff

## 6️⃣ Prueba Permisos

### Como Owner (El que acabas de crear):
- ✅ Accede a `/clinic/clients`
- ✅ Accede a `/clinic/pets`
- ❌ Intenta acceder a `/admin/clinics` → Bloqueado (403)

### Vuelve a Superadmin:
- Logout
- Login con `superAdmin@vibralive.com`
- ✅ Accede a `/admin/clinics`
- ❌ Intenta acceder a `/clinic/dashboard` → Bloqueado (403)

## 7️⃣ Verifica Menú Dinámico

**Superadmin ve:**
- Dashboard
- Clínicas
- Usuarios
- Auditoría
- Configuración

**Owner ve:**
- Dashboard
- Clientes
- Mascotas
- Mi Staff
- Reportes
- Configuración Clínica

## 8️⃣ Prueba Sesión Persistente

1. Inicia sesión como superadmin
2. Presiona F5 para recargar
3. ✅ La sesión persiste (no requiere login nuevamente)

## 9️⃣ Logout Correcto

1. En la sidebar, haz clic en "Cerrar Sesión"
2. ✅ Redirecciona a login
3. ✅ Página vacía (sin pre-rellenar)

## 🔟 Verifica la BD

En tu cliente PostgreSQL:
```sql
SELECT id, name, email, role, status FROM "user" LIMIT 10;
```

Deberías ver:
- superAdminUser (role: superadmin)
- El dueño recién creado (role: owner)

---

## 🎯 Casos Clave Probados

| Caso | Resultado |
|------|-----------|
| Login exitoso | ✅ |
| Permisos por rol | ✅ |
| Menú dinámico | ✅ |
| Rutas protegidas | ✅ |
| Sesión persistente | ✅ |
| Logout correcto | ✅ |
| Error credenciales | ✅ |

---

## 📝 Archivo de Referencia Completo

Para pruebas detalladas, ver: `MANUAL_TESTING_GUIDE.md`

---

## ⚠️ Problemas Comunes

**Backend no inicia**
- ¿Postgres está corriendo?
- ¿Puerto 3001 disponible?

**Frontend no carga**
- ¿Puerto 3000 disponible?
- ¿npm install completó?

**Login falla**
- ¿Backend está corriendo?
- ¿Email/password correcto?

**Está muy lento**
- Abre Console (F12) y revisa si hay errores

---

## 🚀 Próximo Paso

Una vez validado, continúa con:
1. Implementar CRUD real en BD
2. Agregar más endpoints de API
3. Mejorar UI con modales
4. Agregar validaciones avanzadas

¡Listo! El sistema está functionando correctamente. 🎉
