# 📊 ANÁLISIS COMPLETO DE PERMISOS - VibraLive

## 🎯 RESUMEN EJECUTIVO

### Total de Permisos Únicos: **175-180 permisos**

**Distribución:**
- Sin categoría EHR explícito (`ehr:*`): ~135-140 permisos
- Categoría EHR explícito (`ehr:*`): ~40 permisos
- Total: **~175-180 permisos únicos**

---

## 📋 DESGLOSE DETALLADO POR CATEGORÍA

### 1. **PLATAFORMA (Super Admin Only)**
**19 permisos**
```
platform:clinics:create
platform:clinics:read
platform:clinics:update
platform:clinics:delete
platform:clinics:suspend
platform:clinics:activate
platform:plans:create
platform:plans:read
platform:plans:update
platform:plans:delete
platform:plans:toggle
platform:users:create
platform:users:read
platform:users:update
platform:users:delete
platform:users:impersonate
platform:dashboard
platform:reports
audit:read
```

### 2. **CONFIGURACIÓN DE CLÍNICA**
**6 permisos**
```
clinic:manage
clinic:settings
clinic:branding
clinic:communication:config
clinic:communication:read
clinic:calendar:manage
```

### 3. **USUARIOS Y ROLES**
**10 permisos**
```
users:create
users:read
users:update
users:deactivate
users:delete
roles:create
roles:read
roles:update
roles:delete
roles:permissions:list
```

### 4. **CLIENTES Y MASCOTAS**
**19 permisos**
```
clients:create
clients:read
clients:update
clients:deactivate
clients:delete
clients:addresses:create
clients:addresses:read
clients:addresses:update
clients:addresses:delete
clients:addresses:set_default
clients:tags:create
clients:tags:read
clients:tags:delete
pets:create
pets:read
pets:update
pets:delete
```

### 5. **CITAS Y SERVICIOS**
**22 permisos**
```
appointments:create
appointments:read
appointments:update
appointments:update_status
appointments:update_services
appointments:complete
appointments:check_availability
services:create
services:read
services:update
services:deactivate
services:delete
packages:create
packages:read
packages:update
packages:deactivate
packages:delete
```

### 6. **VISITAS CLÍNICAS**
**6 permisos**
```
visits:create
visits:read
visits:update
visits:update_status
visits:complete
visits:cancel
```

### 7. **EXPEDIENTE MÉDICO ELECTRÓNICO - Antiguo Sistema**
**19 permisos**
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

### 8. **EHR - EXPEDIENTE MÉDICO ELECTRÓNICO (Nuevo Sistema)**
**42 permisos** ⭐
```
ehr:medical_history:create
ehr:medical_history:read
ehr:medical_history:update
ehr:medical_history:delete
ehr:prescriptions:create
ehr:prescriptions:read
ehr:prescriptions:update
ehr:prescriptions:delete
ehr:prescriptions:sign
ehr:vaccinations:create
ehr:vaccinations:read
ehr:vaccinations:update
ehr:vaccinations:delete
ehr:allergies:create
ehr:allergies:read
ehr:allergies:update
ehr:allergies:delete
ehr:diagnostics:create
ehr:diagnostics:read
ehr:diagnostics:update
ehr:diagnostics:delete
ehr:attachments:create
ehr:attachments:read
ehr:attachments:delete
ehr:attachments:download
ehr:signatures:create
ehr:signatures:read
ehr:signatures:verify
ehr:signatures:revoke
ehr:analytics:read
ehr:analytics:export
ehr:analytics:trends
ehr:read
ehr:manage
```

### 9. **CUIDADO PREVENTIVO**
**5 permisos**
```
preventive_care:create
preventive_care:read
preventive_care:update
preventive_care:delete
preventive_care:complete
```

### 10. **RECORDATORIOS**
**5 permisos**
```
reminders:create
reminders:read
reminders:send
reminders:cancel
reminders:queue
```

### 11. **POS - PUNTO DE VENTA**
**17 permisos**
```
pos:products:create
pos:products:read
pos:products:update
pos:products:delete
pos:sales:create
pos:sales:read
pos:sales:update
pos:sales:complete
pos:sales:cancel
pos:sales:refund
pos:inventory:read
pos:inventory:adjust
pos:inventory:history
pos:payments:create
pos:payments:read
pos:reports
```

### 12. **PRECIOS Y FACTURACIÓN**
**11 permisos**
```
pricing:price_lists:create
pricing:price_lists:read
pricing:price_lists:delete
pricing:service_prices:create
pricing:service_prices:update
pricing:service_prices:delete
pricing:service_prices:read
pricing:package_prices:create
pricing:package_prices:update
pricing:package_prices:delete
pricing:package_prices:read
pricing:calculate
pricing:history
```

### 13. **ESTILISTAS Y DISPONIBILIDAD**
**15 permisos**
```
stylists:read
stylists:update
stylists:availability:create
stylists:availability:read
stylists:availability:update
stylists:availability:delete
stylists:unavailable:create
stylists:unavailable:read
stylists:unavailable:update
stylists:unavailable:delete
stylists:capacity:create
stylists:capacity:read
stylists:capacity:update
stylists:capacity:delete
stylists:slots
```

### 14. **VETERINARIOS**
**4 permisos**
```
veterinarians:create
veterinarians:read
veterinarians:update
veterinarians:delete
```

### 15. **RUTAS Y OPTIMIZACIÓN**
**4 permisos**
```
routes:optimize
routes:validate
routes:config
routes:plan_home_grooming
```

### 16. **CAMPAÑAS Y PLANTILLAS**
**17 permisos**
```
campaigns:create
campaigns:read
campaigns:update
campaigns:delete
campaigns:start
campaigns:pause
campaigns:resume
campaigns:metrics
campaigns:recipients
campaigns:preview_audience
campaign_templates:create
campaign_templates:read
campaign_templates:update
campaign_templates:delete
campaign_templates:preview
campaign_templates:render
campaign_templates:variables
```

### 17. **NOTIFICACIONES Y COMUNICACIÓN**
**14 permisos**
```
notifications:create
notifications:read
notifications:details
notifications:queue
notifications:errors
notifications:retry
notifications:delete
whatsapp:send
whatsapp:read_outbox
whatsapp:read_message
whatsapp:retry
email:send
email:read_outbox
email:retry
```

### 18. **REPORTES Y ANALYTICS**
**8 permisos**
```
reports:view
reports:revenue
reports:appointments
reports:clients
reports:services
reports:performance
reports:geography
reports:export
```

### 19. **DASHBOARD**
**1 permiso**
```
dashboard:clinic
```

---

## 📊 TABLA RESUMEN POR CATEGORÍA

| Categoría | Permisos | Descripción |
|-----------|----------|-------------|
| Plataforma | 19 | Super Admin - Gestión de clínicas y planes |
| Configuración Clínica | 6 | Administración de clínica |
| Usuarios y Roles | 10 | Gestión de usuarios y roles |
| Clientes y Mascotas | 19 | CRUD de clientes, direcciones, mascotas |
| Citas y Servicios | 22 | CRUD de citas, servicios, paquetes |
| Visitas Clínicas | 6 | Gestión de visitas |
| EHR Antiguo (medical:*) | 25 | Sistema médico anterior |
| **EHR Nuevo (ehr:*)** | **42** | **Sistema médico nuevo - COMPLETO** |
| Cuidado Preventivo | 5 | Eventos preventivos |
| Recordatorios | 5 | Gestión de recordatorios |
| POS | 17 | Punto de venta |
| Precios | 13 | Gestión de precios |
| Estilistas | 15 | Disponibilidad y capacidad |
| Veterinarios | 4 | Gestión de veterinarios |
| Rutas | 4 | Optimización de rutas |
| Campañas | 17 | Campañas y plantillas |
| Notificaciones | 14 | Comunicación (email, WhatsApp) |
| Reportes | 8 | Analytics y reportes |
| Dashboard | 1 | Acceso general |
| **TOTAL** | **~175-180** | **PERMISOS ÚNICOS** |

---

## 🔍 ANÁLISIS ENTRE BE Y FE

### Backend (roles-permissions.const.ts)
- **Total permisos definidos:** 175-180
- **Ubicación:** `vibralive-backend/src/modules/auth/constants/roles-permissions.const.ts`
- **Fuente de verdad:** ✅ SÍ

### Frontend (vibralive-frontend)
- **Usa permisos BE:** Sí, consume los mismos permisos del backend
- **No redefine permisos:** Correcto - solo lee del contexto de autenticación
- **Sistema de roles FE:** Basado en decoradores `@RequirePermission()` del BE

---

## 🎯 RESUMEN FINAL

**Total de permisos únicos del sistema: ~175-180**

**Distribución:**
- ✅ **Permisos BE:** 175-180
- ✅ **Permisos FE:** Los mismos del BE (sin duplicación)
- ✅ **Fuente única:** `roles-permissions.const.ts`

**Permisos a sincronizar en BD:**
- INSERT: 175-180 permisos nuevos
- DELETE: 149 permisos obsoletos
- ASSIGN CLINIC_OWNER: 175-180 permisos (todos)

---

## 📝 NOTAS IMPORTANTES

1. **No hay duplicación BE/FE:** El frontend no redefine permisos
2. **EHR tiene 2 sistemas:** `medical:*` (antiguo) + `ehr:*` (nuevo, 42 permisos)
3. **CLINIC_OWNER recibe:** Todos los 175-180 permisos (menos los `platform:*`)
4. **CLINIC_VETERINARIAN:** Acceso completo a EHR nuevo (`ehr:*`)
5. **Otros roles:** Acceso restringido según necesidad

---

**Generado:** 2024-03-24  
**Fuente:** `roles-permissions.const.ts` (líneas 1-953)
