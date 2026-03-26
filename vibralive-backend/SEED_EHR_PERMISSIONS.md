# Seed de Permisos EHR (Expediente Médico Electrónico)

Este seed inserta todos los permisos necesarios para el módulo de Expediente Médico Electrónico (EHR) y los asigna a los roles correspondientes.

## ✅ Permisos que se insertan

### Historial Médico (4 permisos)
- `ehr:medical_history:create` - Crear historial médico
- `ehr:medical_history:read` - Ver historial médico  
- `ehr:medical_history:update` - Editar historial médico
- `ehr:medical_history:delete` - Eliminar historial médico

### Prescripciones (5 permisos)
- `ehr:prescriptions:create` - Crear prescripciones
- `ehr:prescriptions:read` - Ver prescripciones
- `ehr:prescriptions:update` - Editar prescripciones
- `ehr:prescriptions:delete` - Eliminar prescripciones
- `ehr:prescriptions:sign` - Firmar prescripciones digitalmente

### Vacunas (4 permisos)
- `ehr:vaccinations:create` - Crear registro de vacunas
- `ehr:vaccinations:read` - Ver registro de vacunas
- `ehr:vaccinations:update` - Editar registro de vacunas
- `ehr:vaccinations:delete` - Eliminar registro de vacunas

### Alergias (4 permisos)
- `ehr:allergies:create` - Crear alergias
- `ehr:allergies:read` - Ver alergias
- `ehr:allergies:update` - Editar alergias
- `ehr:allergies:delete` - Eliminar alergias

### Diagnósticos (4 permisos)
- `ehr:diagnostics:create` - Crear diagnósticos
- `ehr:diagnostics:read` - Ver diagnósticos
- `ehr:diagnostics:update` - Editar diagnósticos
- `ehr:diagnostics:delete` - Eliminar diagnósticos

### Adjuntos (4 permisos)
- `ehr:attachments:create` - Subir adjuntos médicos
- `ehr:attachments:read` - Ver adjuntos médicos
- `ehr:attachments:delete` - Eliminar adjuntos médicos
- `ehr:attachments:download` - Descargar adjuntos médicos

### Firmas Digitales (4 permisos)
- `ehr:signatures:create` - Crear firma digital de expediente
- `ehr:signatures:read` - Ver firmas digitales
- `ehr:signatures:verify` - Verificar autenticidad de firmas
- `ehr:signatures:revoke` - Revocar firma digital

### Reportes y Analytics (3 permisos)
- `ehr:analytics:read` - Ver reportes de EHR
- `ehr:analytics:export` - Exportar reportes de EHR
- `ehr:analytics:trends` - Ver tendencias médicas

### Acceso General (2 permisos)
- `ehr:read` - Acceso general a expediente médico
- `ehr:manage` - Administrar expediente médico

**Total: 36 permisos**

## 🔐 Asignaciones de Roles

### CLINIC_OWNER
Recibe: **TODOS los 36 permisos de EHR**

### CLINIC_STAFF
Recibe: 18 permisos (lectura y actualizaciones básicas)

### CLINIC_VETERINARIAN
Recibe: 25 permisos (acceso completo incluyendo firmas)

## 🚀 Cómo ejecutar

### Opción 1: Ejecutar el script bash (Linux/Mac)
```bash
cd vibralive-backend
chmod +x seed-ehr.sh
./seed-ehr.sh
```

### Opción 2: Ejecutar con npm (Windows/Linux/Mac)
Primero añade esto a `package.json`:
```json
{
  "scripts": {
    "seed:ehr": "ts-node -O '{\"module\":\"commonjs\"}' src/database/seeds/seed-ehr-permissions.ts"
  }
}
```

Luego ejecuta:
```bash
npm run seed:ehr
```

### Opción 3: Ejecutar directamente con ts-node
```bash
cd vibralive-backend
npx ts-node -O '{"module":"commonjs"}' src/database/seeds/seed-ehr-permissions.ts
```

## ✅ Verificar que funcionó

Después de ejecutar, deberías ver:
```
📝 Insertando 36 permisos de EHR...
  ✅ ehr:medical_history:create
  ✅ ehr:medical_history:read
  ...
  
✨ 36 permisos procesados

🔗 Asignando permisos a rol: CLINIC_OWNER
✅ 36 permisos asignados a CLINIC_OWNER

✅ 18 permisos asignados a CLINIC_STAFF

✅ 25 permisos asignados a CLINIC_VETERINARIAN

🎉 ¡SEED de EHR completado exitosamente!
```

También puedes verificar en la BD con:
```sql
SELECT COUNT(*) FROM permissions WHERE name LIKE 'ehr:%';
-- Debe retornar: 36

SELECT p.name, r.name 
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
JOIN roles r ON rp.role_id = r.id
WHERE p.name LIKE 'ehr:%' AND r.name = 'CLINIC_OWNER'
ORDER BY p.name;
-- Debe listar todos los 36 permisos
```

## 🔧 Solución de problemas

### Error: "Cannot find module"
Asegúrate de que las rutas en `seed-ehr-permissions.ts` coinciden con tu estructura:
- Verifica: `src/database/entities/permission.entity`
- Verifica: `src/database/entities/role.entity`
- Verifica: `src/database/entities/role-permission.entity`

### Error: "Connection refused"
Verifica que:
- PostgreSQL está corriendo
- Las variables de entorno en `.env` son correctas:
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`

### Error: "Cannot find table"
Asegúrate que:
- Las migraciones se han ejecutado: `npm run migration:run`
- Las tablas existen en la BD

## 📝 Notas

- El seed es **idempotente**: puede ejecutarse múltiples veces sin crear duplicados
- Si un permiso ya existe, lo salta
- Si una asignación rol-permiso ya existe, la salta
- Verifica los logs para ver exactamente qué se insertó y qué se saltó
