# 📋 Guía de Sincronización de Permisos: Backend vs BD

## 🎯 Objetivo

Sincronizar los permisos configurados en el **código del backend** con los permisos registrados en la **base de datos**, asegurando:

1. ✅ No hay permisos obsoletos en la BD
2. ✅ No hay permisos faltantes en el código
3. ✅ Descripciones amigables para usuarios finales
4. ✅ Categorías bien organizadas

---

## 📊 Estado Actual (Análisis)

### Comparación Backend vs BD

```
Backend: 89 permisos configurados en decoradores @RequirePermission()
BD:      238 permisos registrados

Diferencia: 149 permisos en BD sin uso aparente en código
```

### Principales Discrepancias

#### 1. ❌ Permisos Obsoletos (Eliminar)

| Categoría | Cantidad | Motivo |
|-----------|----------|--------|
| `medical:*` | 18 | Reemplazado por `ehr:*` |
| `medical_visits:*` | 4 | Reemplazado por `ehr:*` |
| **Total a eliminar** | **24** | Código antiguo (v1) |

#### 2. ⚠️ Permisos No Encontrados (Revisar)

| Categoría | Cantidad | Estado |
|-----------|----------|--------|
| Email | 4 | ¿Implementado? |
| Notificaciones | N/A | Inconsistencia (notification vs notifications) |
| POS (avanzado) | 8 | Parcialmente implementado |
| Pricing (avanzado) | 8 | Parcialmente implementado |
| Estilistas | 13 | Solo lectura/actualización encontrado |
| Reportes | 8 | ¿Implementado? |
| Rutas | 4 | ¿Implementado? |
| WhatsApp | N/A | Integración no verificada |
| Preventive Care | 5 | ¿Implementado? |
| Roles (config) | 4 | Solo lectura encontrado |
| **Total a revisar** | **~60** | Funcionalidades secundarias |

#### 3. ✅ Permisos Correctos (Mantener)

- `ehr:*` - 39 permisos (✓ Sistema nuevo)
- `appointments:*` - 7 permisos (✓ Encontrado)
- `clients:*` - 8 permisos (✓ Encontrado)
- `users:*` - 5 permisos (✓ Encontrado)
- `veterinarians:*` - 4 permisos (✓ Encontrado)
- Y otros módulos principales ✓

---

## 🚀 Plan de Ejecución

### Fase 1: Limpieza (CRÍTICA)

Ejecutar:
```bash
psql -U usuario -d vibralive < sqlFiles/1_DELETE_OBSOLETE_PERMISSIONS.sql
```

**Qué hace:**
- ❌ Elimina 24 permisos `medical:*` y `medical_visits:*`
- 🔄 Limpia asignaciones de roles

**Verificar después:**
```sql
SELECT COUNT(*) FROM permissions WHERE code LIKE 'medical%';
-- Resultado esperado: 0
```

---

### Fase 2: Actualización (ALTA PRIORIDAD)

Ejecutar:
```bash
psql -U usuario -d vibralive < sqlFiles/2_UPDATE_EHR_PERMISSIONS_FRIENDLY.sql
```

**Qué hace:**
- 📝 Actualiza descripciones amigables para `ehr:*`
- 🏷️ Estandariza nombres de categorías
- 🔗 Re-asigna permisos a roles (CLINIC_VETERINARIAN, CLINIC_OWNER, CLINIC_STAFF)

**Verificar después:**
```sql
SELECT category, COUNT(*) 
FROM permissions 
WHERE code LIKE 'ehr:%' 
GROUP BY category;

-- Resultado esperado:
-- Expediente Médico Electrónico | 31
```

---

### Fase 3: Auditoría (INFORMACIÓN)

Ejecutar:
```bash
psql -U usuario -d vibralive < sqlFiles/3_AUDIT_UNUSED_PERMISSIONS.sql
```

**Qué da:**
- 📊 Listado de permisos sin uso en código
- 📈 Estadísticas por categoría
- 🔍 Sugerencias para revisión manual

**Acciones recomendadas después:**
1. Revisar los ~60 permisos no encontrados
2. Continuar código o eliminarlos si no se usan
3. Documentar decisión por cada módulo

---

## 📋 Guía de Decisiones por Módulo

### ✅ MÓDULOS CRÍTICOS (Mantener sin cambios)

**EHR (Expediente Médico Electrónico)**
- Estado: ✓ Completo y actualizado
- Acción: Ejecutar Script 2 (descripciones amigables)

**Appointments (Citas)**
- Estado: ✓ Implementado
- Acción: Mantener

**Clients/Users (Clientes y Usuarios)**
- Estado: ✓ Implementado
- Acción: Mantener

---

### ⚠️ MÓDULOS PARCIALMENTE IMPLEMENTADOS (Revisar)

**POS (Punto de Venta)**
- Encontrado: create, read, update, sales ops
- Faltante: inventory:adjust, inventory:history, payments
- Acción: ¿Completar implementación o eliminar?

**Pricing**
- Encontrado: price_lists, service_prices
- Faltante: package_prices, calculate, history
- Acción: ¿Completar o eliminar?

**Stylists**
- Encontrado: read, update
- Faltante: availability, capacity, slots, unavailable
- Acción: ¿Completar o eliminar?

---

### ❓ MÓDULOS SIN EVIDENCIA (Decidir)

**Email, WhatsApp, Reminders (avanzado), Routes, Preventive Care**

Para cada uno:

**Opción A: Eliminar** (si no está en planes)
```sql
DELETE FROM role_permissions 
WHERE permission_id IN (
  SELECT id FROM permissions 
  WHERE code LIKE 'email:%'
);

DELETE FROM permissions WHERE code LIKE 'email:%';
```

**Opción B: Mantener** (para futuro)
- Actualizar descripciones amigables
- Re-asignar a roles apropiados

---

## 🔄 Flujo de Ejecución Recomendado

```
PASO 1: Ejecutar Script de Auditoría (LECTURA)
        ↓
        Revisar salida y decidir qué hacer
        ↓
PASO 2: Ejecutar Script 1 (Eliminar obsoletos) [CRÍTICO]
        ↓
        Verificar con: SELECT COUNT(*) FROM permissions WHERE code LIKE 'medical%';
        ↓
PASO 3: Ejecutar Script 2 (Actualizar EHR) [IMPORTANTE]
        ↓
        Verificar con: SELECT * FROM permissions WHERE code LIKE 'ehr:%';
        ↓
PASO 4: Revisar manualmente módulos complejos
        ↓
PASO 5: Documentar decisiones y crear script personalizado si es necesario
```

---

## ✅ Checklist Post-Sincronización

- [ ] Script 1 ejecutado sin errores
- [ ] Sin registros `medical:*` en BD
- [ ] Script 2 ejecutado sin errores
- [ ] Descripciones EHR actualizadas
- [ ] Roles tienen permisos EHR asignados
- [ ] Script 3 revisado manualmente
- [ ] Decisiones documentadas por módulo
- [ ] Backend reiniciado tras cambios
- [ ] Pruebas de acceso funcionales

---

## 📞 Notas Importantes

### Sobre las Inconsistencias de Nombres

Hay varias prefijos inconsistentes entre BD y código:

| BD | Código | Decisión |
|:--|:--|:--|
| platform:clinics:* | clinics:* | Revisar/Estandarizar |
| reminders:* | reminder:* | Revisar/Estandarizar |
| notification:* | notifications:* | Revisar/Estandarizar |

**Recomendación:** Actualizar el código para usar el formato de BD para consistencia.

### Rollback

Cada script incluye capacidad de ROLLBACK:

```sql
-- Dentro de la transacción, si hay error:
ROLLBACK;
```

### Respaldo

ANTES de ejecutar, hacer backup:

```bash
pg_dump vibralive > backup_permisos_$(date +%Y%m%d_%H%M%S).sql
```

---

## 📚 Scripts Generados

1. **1_DELETE_OBSOLETE_PERMISSIONS.sql** - Elimina medical:* y medical_visits:*
2. **2_UPDATE_EHR_PERMISSIONS_FRIENDLY.sql** - Actualiza EHR con descripciones amigables
3. **3_AUDIT_UNUSED_PERMISSIONS.sql** - Reporte de permisos sin usar (LECTURA)

Ubicación: `VibraLive/sqlFiles/`