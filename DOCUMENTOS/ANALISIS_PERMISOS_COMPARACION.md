# Análisis de Permisos: Backend vs Base de Datos

## 📊 Resumen Ejecutivo

**Permisos en Backend:** 89 permisos configurados en decoradores
**Permisos en BD:** 238 permisos registrados
**Diferencia:** 149 permisos en BD (muchos sin uso en el código actual)

---

## ❌ PERMISOS EN BD PERO NO EN CÓDIGO (ELIMINAR)

### Antiguo Sistema "medical_visits:*" y "medical:*" (Reemplazados por EHR)

Estos fueron reemplazados por el nuevo sistema EHR.

```
medical_visits:create
medical_visits:read
medical_visits:update
medical_visits:sign

medical:diagnoses:create
medical:diagnoses:read
medical:diagnoses:update
medical:prescriptions:create
medical:prescriptions:read
medical:prescriptions:update
medical:prescriptions:cancel
medical:vaccinations:create
medical:vaccinations:read
medical:vaccinations:update
medical:allergies:create
medical:allergies:read
medical:allergies:update
medical:diagnostic_orders:create
medical:diagnostic_orders:read
medical:diagnostic_orders:update
medical:procedures:create
medical:procedures:read
medical:follow_ups:create
medical:follow_ups:read
medical:history:read
```

**Total:** 24 permisos antiguos

### Permisos No Encontrados en Código

```
clinic:branding (usamos clinic:settings)
clinic:communication:config (no hay decorador)
clinic:communication:read (no hay decorador)
clinic:calendar:manage (no hay decorador)

campaign:templates:* (múltiples - no encontrados)
campaigns:metrics (no encontrado)
campaigns:pause (existe en código, revisar)
campaigns:preview_audience (no encontrado)
campaigns:recipients (no encontrado)
campaigns:resume (existe en código, revisar)
campaigns:start (existe en código, revisar)

email:* (multiple - no encontrados en decoradores)

notification:* (múltiples con "s" vs sin "s")

pos:inventory:adjust (no encontrado)
pos:inventory:history (no encontrado)
pos:payments:create (no encontrado)

pricing:calculate (no encontrado)
pricing:history (no encontrado)
pricing:package_prices:* (múltiple - no encontrado)

preventive_care:* (múltiples - no encontrados)

reminders:send (no encontrado)
reminders:queue (no encontrado)

reports:* (múltiples - no encontrados)

roles:create, roles:delete, roles:update, roles:permissions:list (no encontrados)

stylists:availability:* (múltiples - no encontrados)
stylists:unavailable:* (múltiples - no encontrados)
stylists:capacity:* (múltiples - no encontrados)
stylists:slots (no encontrado)

routes:* (múltiples - no encontrados)

whatsapp:* (múltiples - no encontrados)

dashboard:clinic (no encontrado - existe  platform:dashboard)
```

**Total aproximado:** 100+ permisos no encontrados en el código

### Inconsistencias de Nombres

Hay algunos permisos donde el prefijo en BD difiere del backend:

```
BD: platform:clinics:*  vs  Backend: clinics:*
BD: reminders:*        vs  Backend: reminder:*
```

---

## ✅ PERMISOS EN CÓDIGO PERO NO EN BD (AGREGAR)

Búsquedas en BD con variaciones de formato muestran que la mayoría EXISTEN, pero hay algunas discrepancias:

1. **Posibles permisos faltantes:**
   - Algunos ehr:* delete (allergies:delete, diagnostics:delete, medical_history:delete, prescriptions:delete, vaccinations:delete)

---

## 🎯 Recomendación

1. **LIMPIAR BD:** Eliminar permisos del sistema "medical:*" y "medical_visits:*" ya que fueron reemplazados por "ehr:*"
2. **AUDITAR:** Los 100+ permisos no encontrados en código podrían ser:
   - Funcionalidades no implementadas aún
   - Código legacy no actualizado
   - Características desactivadas

3. **ESTANDARIZAR:** 
   - Singular vs Plural (reminder vs reminders)
   - Prefijos (clinics vs platform:clinics)

---

## 📋 Próximas Acciones

1. Generar script para eliminar permisos obsoletos
2. Generar script para agregar permisos faltantes (con descripciones amigables)
3. Actualizar nombres de categorías a versiones amigables para usuario final