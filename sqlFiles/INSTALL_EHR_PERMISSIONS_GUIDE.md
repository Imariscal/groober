# 🔐 Script de Permisos EHR - Instrucciones de Instalación

## 📋 Archivos Generados

1. **SQL Script**: `sqlFiles/INSERT_MISSING_EHR_PERMISSIONS.sql`
   - Crea 31 nuevos permisos de EHR
   - Asigna automáticamente a roles (VETERINARIAN, OWNER, STAFF)

2. **Código Actualizado**: 
   - `vibralive-backend/src/modules/medical-visits/medical-visits.controller.ts`
   - Cambio: `visits:view_medical_history` → `ehr:medical_history:read`

---

## ⚙️ Pasos para Ejecutar

### Opción 1: Ejecutar directamente en PostgreSQL (Recomendado)

```bash
# Desde terminal con acceso a psql
psql -U <user> -d vibralive < sqlFiles/INSERT_MISSING_EHR_PERMISSIONS.sql
```

O en Windows (PowerShell):
```powershell
Get-Content sqlFiles/INSERT_MISSING_EHR_PERMISSIONS.sql | psql -U <user> -d vibralive
```

### Opción 2: Usar DBeaver o cliente SQL

1. Abre DBeaver/pgAdmin
2. Conecta a base de datos `vibralive`
3. Copia todo el contenido de `INSERT_MISSING_EHR_PERMISSIONS.sql`
4. Ejecuta como query

### Opción 3: Desde Node.js Seed

```typescript
// scripts/seed-ehr-permissions.ts
import { execSync } from 'child_process';

const seedEhrPermissions = () => {
  const sqlFile = path.join(__dirname, '../sqlFiles/INSERT_MISSING_EHR_PERMISSIONS.sql');
  execSync(`psql -U postgres -d vibralive -f ${sqlFile}`);
  console.log('✅ EHR permissions seeded successfully');
};
```

---

## ✅ Verificar Instalación

Ejecuta esta query para confirmar:

```sql
-- Ver permisos EHR creados
SELECT COUNT(*) as ehr_permissions_count FROM "permission" WHERE code LIKE 'ehr:%';

-- Ver años asignados a CLINIC_VETERINARIAN
SELECT p.code, p.description 
FROM "role" r
JOIN "role_permission" rp ON r.id = rp.role_id
JOIN "permission" p ON rp.permission_id = p.id
WHERE r.code = 'CLINIC_VETERINARIAN' AND p.code LIKE 'ehr:%'
ORDER BY p.code;
```

Esperado: **31 permisos EHR insertados**

---

## 🔄 Cambios en Código

### Backend (TypeScript)

`vibralive-backend/src/modules/medical-visits/medical-visits.controller.ts`

**Antes:**
```typescript
@RequirePermission('visits:view_medical_history')
```

**Después:**
```typescript
@RequirePermission('ehr:medical_history:read')
```

---

## 📊 Resumen de Permisos Insertados

### Historial Médico (4)
- `ehr:medical_history:create`
- `ehr:medical_history:read`
- `ehr:medical_history:update`
- `ehr:medical_history:delete`

### Prescripciones (5)
- `ehr:prescriptions:create`
- `ehr:prescriptions:read`
- `ehr:prescriptions:update`
- `ehr:prescriptions:delete`
- `ehr:prescriptions:sign`

### Vacunaciones (4)
- `ehr:vaccinations:create`
- `ehr:vaccinations:read`
- `ehr:vaccinations:update`
- `ehr:vaccinations:delete`

### Alergias (4)
- `ehr:allergies:create`
- `ehr:allergies:read`
- `ehr:allergies:update`
- `ehr:allergies:delete`

### Diagnósticos (4)
- `ehr:diagnostics:create`
- `ehr:diagnostics:read`
- `ehr:diagnostics:update`
- `ehr:diagnostics:delete`

### Adjuntos (4)
- `ehr:attachments:create`
- `ehr:attachments:read`
- `ehr:attachments:delete`
- `ehr:attachments:download`

### Firmas Digitales (4)
- `ehr:signatures:create`
- `ehr:signatures:read`
- `ehr:signatures:verify`
- `ehr:signatures:revoke`

### Analytics/Reportes (3)
- `ehr:analytics:read`
- `ehr:analytics:export`
- `ehr:analytics:trends`

### Generales (2)
- `ehr:read`
- `ehr:manage`

---

## 🎯 Asignación de Permisos por Rol

| Rol | Permisos | Acceso |
|-----|----------|--------|
| **CLINIC_VETERINARIAN** | Todos (31) | ✅ Completo |
| **CLINIC_OWNER** | Todos (31) | ✅ Completo (para config) |
| **CLINIC_STAFF** | Lectura (7) | 📖 Solo lectura |
| **CLINIC_STYLIST** | Ninguno | ❌ Sin acceso |

---

## 🚀 Próximos Pasos

1. ✅ Ejecutar script SQL
2. ✅ Recompiar backend: `npm run build`
3. ✅ Reiniciar backend: `npm run start:dev`
4. ✅ Probar en frontend: Cargar `http://localhost:3000/clinic/visits/{appointmentId}`

---

## 🐛 Troubleshooting

### Error: "permission 'ehr:medical_history:read' not found"

**Solución**: El script no se ejecutó correctamente. Verifica:

```sql
-- Busca el permiso
SELECT * FROM "permission" WHERE code = 'ehr:medical_history:read';

-- Si está vacío, ejecuta el SQL script manualmente
```

### Error: "user does not have permission"

**Solución**: El rol no está asignado. Verifica:

```sql
-- Busca la asignación
SELECT * FROM "role_permission" 
WHERE role_id IN (SELECT id FROM "role" WHERE code = 'CLINIC_VETERINARIAN')
AND permission_id IN (SELECT id FROM "permission" WHERE code = 'ehr:medical_history:read');

-- Si está vacío, el INSERT de role_permission falló
```

---

**Fecha**: 2026-03-24  
**Creado por**: Sistema de Permisos EHR  
**Versión**: 1.0
