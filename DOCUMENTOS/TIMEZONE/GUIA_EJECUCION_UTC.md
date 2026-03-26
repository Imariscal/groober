# GUÍA DE EJECUCIÓN - POLÍTICA GLOBAL DE UTC
## VibraLive Backend - Pasos a Seguir

**Última Actualización:** 6 de marzo de 2026  
**Estado:** 🟢 LISTO PARA IMPLEMENTAR  

---

## 📌 ANTES DE COMENZAR

### Verificaciones Previas
- [ ] Backend compila sin errores (TypeScript)
- [ ] Frontend compila sin errores  
- [ ] Bases de datos de desarrollo está activa
- [ ] Tienes acceso a terminal con permisos
- [ ] Commit del código actual (git commit)

---

## 🚀 PASO 1: EJECUTAR MIGRACIONES

### Opción A: Automático con npm

```bash
# Navegar a backend
cd vibralive-backend

# Ejecutar migraciones pendientes
npm run typeorm migration:run
```

**Esperado:**
```
[INFO] Migration ConvertRemainingTimestampsToWithTimeZone started
         🔄 [MIGRATION] Iniciando conversión...
         📝 Convirtiendo appointments table...
         ✓ appointments.cancelled_at → timestamp with time zone
         ✓ appointments.assigned_at → timestamp with time zone
         ...
         ✓ whatsapp_outbox.sent_at → timestamp with time zone
         ✅ Migración completada exitosamente
[INFO] Migration ConvertRemainingTimestampsToWithTimeZone finished successfully
```

### Opción B: Manualmente con psql

```bash
# Conectar a BD
psql -h localhost -U vibralive_dev -d vibralive_db

# Ejecutar cambios manualmente (si prefieres)
# Ver SQL en: src/database/migrations/1773100000000-...
```

---

## 🔄 PASO 2: REINICIAR BACKEND

```bash
# En la terminal donde ejecutaste migration:run
npm start
```

**Verificar:**
- [ ] Backend inicia sin errores
- [ ] Logs muestran "UTC Normalize Interceptor active" (opcional)
- [ ] Puerto 3000+ está disponible

---

## ✅ PASO 3: VALIDAR ESQUEMA EN PSQL

```bash
# Conectar a BD
psql -h localhost -U vibralive_dev -d vibralive_db

# Listar tipos de las columnas convertidas
\d appointments
\d groomer_routes
\d groomer_route_stops
\d whatsapp_outbox

# Esperado para cada columna:
# ┌──────────────────┬──────────────────────────────┐
# │ Column           │ Type                         │
# ├──────────────────┼──────────────────────────────┤
# │ cancelled_at     │ timestamp with time zone     │
# │ assigned_at      │ timestamp with time zone     │
# │ price_lock_at    │ timestamp with time zone     │
# │ rescheduled_at   │ timestamp with time zone     │
# └──────────────────┴──────────────────────────────┘
```

---

## 🧪 PASO 4: TEST MANUAL - CREAR CITA

### Escenario: Cita en Tijuana a las 08:00

**En el Frontend:**
1. Login en sistema
2. Ir a Grooming → Crear Cita
3. Seleccionar:
   - Fecha: 2026-03-06
   - Hora: 08:00
   - Timezone: America/Tijuana
   - Cliente, Mascota, etc.
4. Abrir DevTools (F12) → Consola
5. Crear cita

**En la Consola Esperar:**
```
🔍 [FRONTEND] Creando cita - Validación de UTC
────────────────────────────────────────────
Entrada del usuario:
  date: 2026-03-06
  time: 08:00
  clinicTimezone: America/Tijuana

Conversión:
  computedScheduledAt: Fri Mar 06 2026 15:00:00 GMT+0000
  scheduledAtUtc (ISO): 2026-03-06T15:00:00.000Z
  ¿Termina en Z? ✅ SÍ

Validación:
  ¿Formato UTC válido? ✅ SÍ

Lo que se enviará al backend:
  scheduledAt: 2026-03-06T15:00:00.000Z
────────────────────────────────────────────
```

---

## 🔍 PASO 5: VERIFICAR EN BASE DE DATOS

```bash
# Conectar a BD
psql -h localhost -U vibralive_dev -d vibralive_db

# Listar la cita que acabas de crear
SELECT 
  id,
  scheduled_at,
  scheduled_at AT TIME ZONE 'America/Tijuana' as "Hora Tijuana",
  scheduled_at AT TIME ZONE 'UTC' as "Hora UTC",
  created_at,
  created_at::text
FROM appointments
ORDER BY created_at DESC
LIMIT 1;

# Esperado:
# ┌────────────────────┬──────────────────────────────────┬──────────────────────┬──────────────────────┐
# │ scheduled_at       │ Hora Tijuana                     │ Hora UTC             │ Margen               │
# ├────────────────────┼──────────────────────────────────┼──────────────────────┼──────────────────────┤
# │ 2026-03-06 15:00+00│ 2026-03-06 08:00:00              │ 2026-03-06 15:00:00  │ ✓ Correcto (diff 7h) │
# └────────────────────┴──────────────────────────────────┴──────────────────────┴──────────────────────┘

# VALIDACIÓN:
# - scheduled_at termina con +00 (UTC timezone indicator) ✅
# - Hora Tijuana = 08:00 ✅
# - Hora UTC = 15:00 ✅
# - Diferencia = 7 horas (Tijuana es UTC-7) ✅
```

---

## 🌍 PASO 6: CAMBIAR TIMEZONE Y VALIDAR

**En Frontend:**
1. Ir a Configuración de Clínica
2. Cambiar Timezone a "America/Monterrey" (UTC-6)
3. Volver a Grooming / Calendario
4. Observar la misma cita

**Esperado:**
- Cita ahora muestra: 09:00 (en Monterrey)
- No es 08:00 (porque cambió timezone)
- Datos son idénticos en BD (solo cambió display)

**En BD (verificación):**
```bash
SELECT 
  id,
  scheduled_at,
  scheduled_at AT TIME ZONE 'America/Monterrey' as "Hora Monterrey"
FROM appointments
LIMIT 1;

# Esperado: 09:00 en Monterrey
```

---

## 📞 PASO 7: PRUEBAS AVANZADAS (Opcional)

### Test 1: Múltiples Timezones
```bash
# En BD, crear citas y verificar conversión en cada TZ
SELECT 
  scheduled_at,
  scheduled_at AT TIME ZONE 'America/Tijuana' as "Tijuana",
  scheduled_at AT TIME ZONE 'America/Monterrey' as "Monterrey",
  scheduled_at AT TIME ZONE 'America/Mexico_City' as "Mexico City",
  scheduled_at AT TIME ZONE 'UTC' as "UTC"
FROM appointments
LIMIT 3;
```

### Test 2: Campos de Timestamp Nuevos
```bash
# Verificar los 12 campos nuevos tienen data
SELECT 
  id,
  cancelled_at,
  assigned_at,
  price_lock_at,
  rescheduled_at
FROM appointments
WHERE cancelled_at IS NOT NULL
LIMIT 1;
```

### Test 3: Rutas de Groomer
```bash
# Si hay rutas, verificar timestamps correctos
SELECT 
  id,
  generated_at,
  created_at,
  status
FROM groomer_routes
LIMIT 1;

# Verificar stops
SELECT 
  id,
  planned_arrival_time,
  actual_arrival_time,
  status
FROM groomer_route_stops
LIMIT 3;
```

---

## 🔙 PASO 8: ROLLBACK (Si es necesario)

### Si aplica: Revertir Migración
```bash
# En backend
npm run typeorm migration:revert

# Esperado:
# [INFO] Migration ConvertRemainingTimestampsToWithTimeZone (down) started
# [INFO] Migration ConvertRemainingTimestampsToWithTimeZone finished
```

### En BD (verificar rollback)
```bash
\d appointments

# Debería mostrar tipo 'timestamp' (sin time zone) nuevamente
```

---

## 📋 CHECKLIST DE VALIDACIÓN

### Después de Ejecutar Migraciones
- [ ] Migración ejecutó sin errores
- [ ] Backend arranca sin problemas
- [ ] Columnas en DB tienen tipo `timestamp with time zone`
- [ ] Los 12 campos convertidos están correctos

### Después de Crear Cita en Tijuana
- [ ] Console log muestra UTC validation
- [ ] Hora UTC en DB = 15:00
- [ ] Hora Tijuana en display = 08:00
- [ ] Cambio de timezone actualiza display correctamente
- [ ] Datos en BD NO cambian (no es refrescante)

### Después de Cambiar Timezone
- [ ] Misma cita muestra hora diferente (correcta para nuevo TZ)
- [ ] Otros usuarios ven su timezone (no es cambio global)
- [ ] Reportes muestran datos consistentes

---

## 🐛 TROUBLESHOOTING

### Problema 1: Migración No Encuentra Tabla
```
Error: Could not find a table 'appointments'
```

**Solución:**
```bash
# Verificar que todas las migraciones anteriores corrieron
npm run typeorm migration:show

# Ejecutar todas las migraciones pendientes
npm run typeorm migration:run --verbose
```

### Problema 2: Tipo de Dato No Cambió
```
Error: DATA TYPE IS STILL 'timestamp'
```

**Verificación:**
```bash
# En psql, verificar tipo exacto
\d appointments
# Ver columna 'cancelled_at'

#Si no cambió:
#1. Ejecutar migración de nuevo
#2. Si persiste, rollback y verificar SQL
```

### Problema 3: Cita Crea con Diferente Hora
```
Esperado: 15:00 UTC
Actual: 14:00 UTC (o diferente)
```

**Verificación:**
1. Revisar logs en consola frontend
2. Revisar `clinicLocalToUtc()` en [datetime-tz.ts](vibralive-frontend/src/lib/datetime-tz.ts)
3. Verificar timezone en configuración

**Solución:**
```typescript
// En datetime-tz.ts
console.log('DebugTZ:', {
  input: { date, time, timezone },
  output: clinicLocalToUtc(date, time, timezone),
});
```

### Problema 4: BD Conecta Pero Tipos No Cambian
```
Verificar permisos:
```sql
-- En psql (como admin)
ALTER TABLE "appointments" ALTER COLUMN "cancelled_at" 
  SET DATA TYPE timestamp with time zone;

-- Si da error de permisos:
GRANT ALL PRIVILEGES ON TABLE "appointments" TO vibralive_dev;
```

---

## ⚡ PERFORMANCE NOTES

### Índices
Los índices existentes continuarán funcionando con `timestamp with time zone`:
```sql
-- Índices existentes en schedule_at, created_at, etc.
-- ✅ Siguen siendo válidos
-- ✅ No requieren recreación
```

### Queries
Las queries siguen siendo rápidas:
```sql
-- Esta query es tan rápida como antes
SELECT * FROM appointments 
WHERE scheduled_at > '2026-03-01'::timestamptz
LIMIT 100;
```

### Storage
El almacenamiento aumenta mínimamente:
- `timestamp` = 8 bytes
- `timestamp with time zone` = 8 bytes
- **Delta:** 0 bytes (son equivalentes en PostgreSQL)

---

## 📚 REFERENCIAS ADICIONALES

### Documentar Cambios
Ver [BARRIDO_TOTAL_UTC_REPORTE_FINAL.md](BARRIDO_TOTAL_UTC_REPORTE_FINAL.md) para:
- Inventario completo
- Architecture decisions
- Validation results
- Risk assessment

### Archivos Modificados
- [appointment.entity.ts](vibralive-backend/src/database/entities/appointment.entity.ts)
- [groomer-route.entity.ts](vibralive-backend/src/database/entities/groomer-route.entity.ts)
- [groomer-route-stop.entity.ts](vibralive-backend/src/database/entities/groomer-route-stop.entity.ts)
- [whatsapp-outbox.entity.ts](vibralive-backend/src/database/entities/whatsapp-outbox.entity.ts)
- [1773100000000-ConvertRemainingTimestampsToWithTimeZone.ts](vibralive-backend/src/database/migrations/1773100000000-ConvertRemainingTimestampsToWithTimeZone.ts)

### Background Reading
- UTC vs Local Time: https://en.wikipedia.org/wiki/Coordinated_Universal_Time
- PostgreSQL timestamp: https://www.postgresql.org/docs/current/datatype-datetime.html
- TypeORM Migrations: https://typeorm.io/migrations

---

## ✅ CONFIRMACIÓN FINAL

Después de completar todos los pasos:

- [ ] Migraciones ejecutadas
- [ ] Backend reiniciado
- [ ] Citas funcionan correctamente
- [ ] Cambio de timezone funciona
- [ ] Datos en BD tienen timezone
- [ ] Logs muestran UTC validation
- [ ] Rollback probado (opcional)

**Si todos los ✅ están verificados, la implementación es exitosa.**

---

**Estado Final:** 🟢 LISTO PARA PRODUCCIÓN (después de testing)  
**Siguiente:** Deploy a staging y testing integral  
**Timeline Estimado:** 30 minutos de ejecución + 30 minutos de validación
