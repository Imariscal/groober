# GUÍA: Homologación de Códigos de Permisos

## 🎯 Objetivo
Estandarizar todos los códigos de permisos a un formato único: **`lowercase:colon:separated`**

Formato elegido:
- ✅ `ehr:medical_history:read` (CoN COLONS, lowercase)
- ✅ `clients:create`
- ✅ `appointments:read`
- ❌ NO MÁS `UPPERCASE_SNAKE_CASE` (legacy)
- ❌ NO MÁS `lowercase_snake_case` (intermedio)

---

## 📊 Problema Actual

La BD tiene permisos en 3 formatos diferentes:

```
Formato                          Cantidad    Ejemplo
================================================
lowercase:colon:separated        ~100        ehr:medical_history:read
UPPERCASE_SNAKE_CASE             ~270        PLATFORM_CLINICS_CREATE  
lowercase_snake_case             ~30         ehr_medical_history_read
```

Esto causa que:
1. El frontend no encuentra permisos en localStorage
2. Los menús desaparecen porque falla la validación
3. El `@RequirePermission()` no funciona correctamente

---

## ✅ Solución por Pasos

### PASO 1: Ejecutar Script SQL de Homologación

En **DBeaver** o **pgAdmin**:

1. Abre el archivo: `/sqlFiles/HOMOLOGACION_PERMISOS_ESTANDAR.sql`
2. **Selecciona TODO** (Ctrl+A)
3. **Ejecuta** (Ctrl+Enter)

⏱️ **Tiempo**: ~2-3 segundos  
📝 **Transaccional**: Si hay error, nada se modifica

**¿Qué hace?**
- Convierte `PLATFORM_CLINICS_CREATE` → `platform:clinics:create`
- Convierte `EHR_MEDICAL_HISTORY_READ` → `ehr:medical_history:read`
- Convierte `ehr_medical_history_create` → `ehr:medical_history:create`
- Mantiene integridad de relaciones en `role_permissions`

**Verificación en el script:**
```sql
=== VERIFICACIÓN FINAL ===

formato                                    | cantidad | ejemplos
✓ lowercase:colon:separated (ESTÁNDAR)   | 304      | [platform:clinics:create, ...]
```

---

### PASO 2: Reiniciar Backend

```bash
# En terminal (si está corriendo):
Ctrl+C

# Reiniciar:
npm run dev
```

Espera a que veas:
```
[Nest] 12345 - 03/24/2026, 2:30:45 PM  LOG [NestFactory] Nest application successfully started
```

---

### PASO 3: Limpiar Storage del Navegador

En **Developer Tools** (F12):
1. **Application** → **Storage** → **Local Storage**
2. Elimina todos los items

O ejecuta en consola:
```javascript
localStorage.clear()
sessionStorage.clear()
```

---

### PASO 4: Login de Nuevo

1. Ir a `/auth/login`
2. Ingresa credenciales
3. **Verifica en Console** (F12):
   ```
   [PermissionService] Loading permissions for role: CLINIC_OWNER (mapped to CLINIC_OWNER)
   [PermissionService] Found 304 permission links for role CLINIC_OWNER
   ✓ Loaded 304 permissions for role CLINIC_OWNER
   ```

4. **Verifica en localStorage** (F12 → Application → Local Storage):
   ```json
   {
     "permissions": [
       "platform:clinics:create",
       "ehr:medical_history:read",
       "clients:create",
       ...
     ]
   }
   ```

✅ **Si ves`ehr:medical_history:read` (con COLONS)** = ¡Funciona!

---

### PASO 5: Verifica Menús

Después de login:
- ✅ Deberías ver todos los menus en la barra lateral: 
  - Historial Médico ✓
  - Prescripciones ✓
  - Vacunas ✓
  - Etc.

Si aun no ves menus:
```javascript
// En consola (F12):
const user = JSON.parse(localStorage.getItem('user'))
console.log('Permisos:', user.permissions)
console.log('Menú:', user.available_menu)
```

---

## 🔧 Si Algo Falla

### ❌ Script SQL da error
→ Descarta la transacción (ROLLBACK automático)
→ Toma screenshot del error
→ Que sea el problema

### ❌ Menús aún no aparecen
→ Limpia localStorage NUEVAMENTE
→ Cierra navegador completamente (Ctrl+Shift+Q)
→ Reabre y login

### ❌ Backend no inicia
→ Revisa logs: ` npm run dev | grep -i error`
→ Probablemente necesita rebuild: `npm run build`

### ❌ "Permission ... not found"
→ Significa que hay código usando permiso viejo
→ Busca en codebase: `grep -r "CLINIC_SETTINGS" src/`
→ Reemplaza por `clinic:settings`

---

## 📋 Códigos Convertidos (Ejemplo)

| Viejo                         | Nuevo                        |
|-------------------------------|------------------------------|
| `PLATFORM_CLINICS_CREATE`     | `platform:clinics:create`    |
| `CLINIC_MANAGE`               | `clinic:manage`              |
| `USERS_CREATE`                | `users:create`               |
| `CLIENTS_READ`                | `clients:read`               |
| `APPOINTMENTS_UPDATE`         | `appointments:update`        |
| `VISITS_COMPLETE`             | `visits:complete`            |
| `EHR_MEDICAL_HISTORY_READ`    | `ehr:medical_history:read`   |
| `EHR_PRESCRIPTIONS_CREATE`    | `ehr:prescriptions:create`   |
| `POS_SALES_READ`              | `pos:sales:read`             |
| `REPORTS_REVENUE`             | `reports:revenue:read`       |
| `SERVICES_CREATE`             | `services:create`            |
| `STYLISTS_UPDATE`             | `stylists:update`            |
| `CAMPAIGNS_START`             | `campaigns:start`            |
| `NOTIFICATIONS_READ`          | `notifications:read`         |
| `ROUTES_OPTIMIZE`             | `routes:optimize`            |

---

## ✨ Beneficios

1. **Estándar único** → Menos errores
2. **Consistency** → Código más limpio
3. **Autodescriptivo** → `ehr:medical_history:read` = muy claro
4. **Escalable** → Fácil agregar nuevos permisos: `module:entity:action`

---

## 📞 Troubleshooting

Si aún tienes problemas después de estos pasos:

1. **Verifica que el script se ejecutó correctamente:**
   ```sql
   SELECT COUNT(*) FROM permissions WHERE code ~ '^[a-z:]+$';
   -- Debería devolver ~304
   ```

2. **Verifica que CLINIC_OWNER tiene permisos:**
   ```sql
   SELECT COUNT(DISTINCT rp.permission_id)
   FROM role_permissions rp
   JOIN roles r ON rp.role_id = r.id
   WHERE r.code = 'CLINIC_OWNER';
   -- Debería devolver 304
   ```

3. **Verifica códigos en permission.service.ts:**
   El archivo ya está corregido para retornar `.code` en lugar de `.name`

---

## 🎉 Resultado Final

Después de estos pasos:

✅ BD con códigos estándar  
✅ Backend retorna permisos con formato correcto  
✅ Frontend recibe permisos como `ehr:medical_history:read`  
✅ localStorage tiene permisos estandarizados  
✅ Menús aparecen correctamente  
✅ EHR y todo funciona sin "Acceso denegado"  

---
