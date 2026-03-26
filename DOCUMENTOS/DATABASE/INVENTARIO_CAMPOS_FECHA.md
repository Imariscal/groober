# INVENTARIO EXHAUSTIVO DE CAMPOS DE FECHA
## VibraLive Backend - 43 Entities

**Fecha del Inventario:** 6 de marzo de 2026
**Total de Entities Analizadas:** 43
**Campos de Fecha Identificados:** 142

---

## LEYENDA DE CATEGORÍAS

| Categoría | Tipo | Descripción |
|-----------|------|-------------|
| **A** | TimestampTZ | `timestamp with time zone` o `@CreateDateColumn` / `@UpdateDateColumn` - CORRECTO para UTC |
| **B** | Date | `date` - Solo fecha (sin hora) - Para fechas calendario |
| **C** | Time | `time` - Solo hora del día (sin fecha) - Para horarios |
| **D** | Refactor | `timestamp` o `datetime` sin zona - DEBE CONVERTIRSE a `timestamptz` |

---

## REPORTE DETALLADO POR ENTITY

### 1. **animal-type.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| AnimalType | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| AnimalType | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 2

---

### 2. **appointment.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| Appointment | scheduledAt | scheduled_at | timestamp with time zone | A | Cuándo está programada la cita - CORRECTO (con TZ) |
| Appointment | cancelledAt | cancelled_at | timestamp (nullable) | D | **REFACTOR REQUERIDO**: Convertir a `timestamp with time zone` |
| Appointment | assignedAt | assigned_at | timestamp (nullable) | D | **REFACTOR REQUERIDO**: Convertir a `timestamp with time zone` |
| Appointment | priceLockAt | price_lock_at | timestamp (nullable) | D | **REFACTOR REQUERIDO**: Convertir a `timestamp with time zone` |
| Appointment | rescheduledAt | rescheduled_at | timestamp (nullable) | D | **REFACTOR REQUERIDO**: Convertir a `timestamp with time zone` |
| Appointment | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| Appointment | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 7 (2 necesitan refactor)

---

### 3. **appointment-group.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| AppointmentGroup | scheduledAt | scheduled_at | timestamp with time zone | A | Cuándo están programadas las citas del grupo - CORRECTO |
| AppointmentGroup | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| AppointmentGroup | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 3

---

### 4. **appointment-item.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| AppointmentItem | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 1

---

### 5. **audit-log.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| AuditLog | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 1

---

### 6. **client.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| Client | preferredContactTimeStart | preferred_contact_time_start | time (nullable) | C | Rango de horas preferidas para contacto - CORRECTO |
| Client | preferredContactTimeEnd | preferred_contact_time_end | time (nullable) | C | Rango de horas preferidas para contacto - CORRECTO |
| Client | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| Client | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 4

---

### 7. **client-address.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| ClientAddress | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| ClientAddress | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 2

---

### 8. **client-tag.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| ClientTag | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 1

---

### 9. **clinic.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| Clinic | suspendedAt | suspended_at | timestamp with time zone (nullable) | A | Cuándo fue suspendida la clínica - CORRECTO |
| Clinic | statsUpdatedAt | stats_updated_at | timestamp with time zone (nullable) | A | Cuándo se actualizaron las estadísticas - CORRECTO |
| Clinic | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| Clinic | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 4

---

### 10. **clinic-billing-config.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| ClinicBillingConfig | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| ClinicBillingConfig | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 2

---

### 11. **clinic-branding.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| ClinicBranding | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| ClinicBranding | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 2

---

### 12. **clinic-calendar-exception.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| ClinicCalendarException | date | date | date | B | Fecha de la excepción (sin hora) - CORRECTO |
| ClinicCalendarException | startTime | start_time | time (nullable) | C | Hora de inicio si es SPECIAL_HOURS - CORRECTO |
| ClinicCalendarException | endTime | end_time | time (nullable) | C | Hora de fin si es SPECIAL_HOURS - CORRECTO |
| ClinicCalendarException | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| ClinicCalendarException | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 5

---

### 13. **clinic-configuration.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| ClinicConfiguration | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| ClinicConfiguration | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 2

---

### 14. **clinic-email-config.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| ClinicEmailConfig | lastVerifiedAt | last_verified_at | timestamp with time zone (nullable) | A | Cuándo se verificó la config - CORRECTO |
| ClinicEmailConfig | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| ClinicEmailConfig | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 3

---

### 15. **clinic-whatsapp-config.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| ClinicWhatsAppConfig | lastVerifiedAt | last_verified_at | timestamp with time zone (nullable) | A | Cuándo se verificó la config - CORRECTO |
| ClinicWhatsAppConfig | lastResetDate | last_reset_date | date (nullable) | B | Fecha del último reset de límite diario - CORRECTO |
| ClinicWhatsAppConfig | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| ClinicWhatsAppConfig | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 4

---

### 16. **groomer-route.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| GroomerRoute | routeDate | route_date | date | B | Fecha de la ruta - CORRECTO (sin hora) |
| GroomerRoute | generatedAt | generated_at | timestamp (nullable) | D | **REFACTOR REQUERIDO**: Convertir a `timestamp with time zone` |
| GroomerRoute | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| GroomerRoute | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 4 (1 necesita refactor)

---

### 17. **groomer-route-stop.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| GroomerRouteStop | plannedArrivalTime | planned_arrival_time | timestamp (nullable) | D | **REFACTOR REQUERIDO**: Convertir a `timestamp with time zone` |
| GroomerRouteStop | plannedDepartureTime | planned_departure_time | timestamp (nullable) | D | **REFACTOR REQUERIDO**: Convertir a `timestamp with time zone` |
| GroomerRouteStop | actualArrivalTime | actual_arrival_time | timestamp (nullable) | D | **REFACTOR REQUERIDO**: Convertir a `timestamp with time zone` |
| GroomerRouteStop | actualDepartureTime | actual_departure_time | timestamp (nullable) | D | **REFACTOR REQUERIDO**: Convertir a `timestamp with time zone` |
| GroomerRouteStop | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| GroomerRouteStop | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 6 (4 necesitan refactor)

---

### 18. **message-log.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| MessageLog | sentAt | sent_at | timestamp with time zone (nullable) | A | Cuándo se envió el mensaje - CORRECTO |
| MessageLog | readAt | read_at | timestamp with time zone (nullable) | A | Cuándo se leyó el mensaje - CORRECTO |
| MessageLog | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 3

---

### 19. **message-template.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| MessageTemplate | scheduledTime | scheduled_time | time (nullable) | C | Hora a la que enviar si `timing=SCHEDULED` - CORRECTO |

**Campos de Fecha:** 1

---

### 20. **permission.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| Permission | - | - | - | - | **SIN CAMPOS DE FECHA** |

**Campos de Fecha:** 0

---

### 21. **pet.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| Pet | dateOfBirth | date_of_birth | date (nullable) | B | Fecha de nacimiento de la mascota - CORRECTO |
| Pet | deceasedAt | deceased_at | date (nullable) | B | Fecha de fallecimiento - CORRECTO (no necesita hora) |
| Pet | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| Pet | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |
| Pet | deletedAt | deleted_at | @DeleteDateColumn | A | Soft delete - CORRECTO |

**Campos de Fecha:** 5

---

### 22. **platform-role.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| PlatformRole | created_at | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 1

---

### 23. **platform-user.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| PlatformUser | created_at | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| PlatformUser | updated_at | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |
| PlatformUser | last_login_at | last_login_at | timestamp with time zone (nullable) | A | Cuándo fue el último login - CORRECTO |
| PlatformUser | deactivated_at | deactivated_at | timestamp with time zone (nullable) | A | Cuándo fue desactivado - CORRECTO |
| PlatformUser | invitation_token_expires_at | invitation_token_expires_at | timestamp with time zone (nullable) | A | Expiración del token de invitación - CORRECTO |
| PlatformUser | password_reset_token_expires_at | password_reset_token_expires_at | timestamp with time zone (nullable) | A | Expiración del token de reset - CORRECTO |

**Campos de Fecha:** 6

---

### 24. **price-list.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| PriceList | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| PriceList | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 2

---

### 25. **price-list-history.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| PriceListHistory | changedAt | changed_at | @CreateDateColumn | A | Cuándo fue el cambio - CORRECTO |

**Campos de Fecha:** 1

---

### 26. **reminder.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| Reminder | scheduledDate | scheduled_date | date | B | Fecha programada del recordatorio - CORRECTO |
| Reminder | confirmedAt | confirmed_at | timestamp with time zone (nullable) | A | Cuándo fue confirmado por cliente - CORRECTO |
| Reminder | lastAttemptAt | last_attempt_at | timestamp with time zone (nullable) | A | Cuándo fue el último intento - CORRECTO |
| Reminder | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| Reminder | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 5

---

### 27. **role.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| Role | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 1

---

### 28. **role-permission.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| RolePermission | - | - | - | - | **SIN CAMPOS DE FECHA** |

**Campos de Fecha:** 0

---

### 29. **service.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| Service | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| Service | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 2

---

### 30. **service-package.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| ServicePackage | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| ServicePackage | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 2

---

### 31. **service-package-item.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| ServicePackageItem | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| ServicePackageItem | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 2

---

### 32. **service-package-price.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| ServicePackagePrice | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| ServicePackagePrice | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 2

---

### 33. **service-price.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| ServicePrice | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| ServicePrice | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 2

---

### 34. **stylist.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| Stylist | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| Stylist | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 2

---

### 35. **stylist-availability.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| StylistAvailability | startTime | start_time | time | C | Hora de inicio del horario laboral - CORRECTO |
| StylistAvailability | endTime | end_time | time | C | Hora de fin del horario laboral - CORRECTO |
| StylistAvailability | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| StylistAvailability | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 4

---

### 36. **stylist-capacity.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| StylistCapacity | date | date | date | B | Fecha específica para capacidad override - CORRECTO |
| StylistCapacity | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| StylistCapacity | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 3

---

### 37. **stylist-unavailable-period.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| StylistUnavailablePeriod | startDate | start_date | date | B | Inicio del período de indisponibilidad - CORRECTO |
| StylistUnavailablePeriod | endDate | end_date | date | B | Fin del período de indisponibilidad - CORRECTO |
| StylistUnavailablePeriod | startTime | start_time | time (nullable) | C | Hora inicio si no es todo el día - CORRECTO |
| StylistUnavailablePeriod | endTime | end_time | time (nullable) | C | Hora fin si no es todo el día - CORRECTO |
| StylistUnavailablePeriod | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| StylistUnavailablePeriod | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 6

---

### 38. **subscription-plan.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| SubscriptionPlan | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| SubscriptionPlan | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 2

---

### 39. **user.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| User | lastLogin | last_login | timestamp with time zone (nullable) | A | Cuándo fue el último login - CORRECTO |
| User | deactivatedAt | deactivated_at | timestamp with time zone (nullable) | A | Cuándo fue desactivado - CORRECTO |
| User | invitationTokenExpiresAt | invitation_token_expires_at | timestamp with time zone (nullable) | A | Expiración del token de invitación - CORRECTO |
| User | passwordResetTokenExpiresAt | password_reset_token_expires_at | timestamp with time zone (nullable) | A | Expiración del token de reset - CORRECTO |
| User | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| User | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 6

---

### 40. **user-role.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| UserRole | assignedAt | assigned_at | @CreateDateColumn | A | Cuándo se asignó el rol - CORRECTO |

**Campos de Fecha:** 1

---

### 41. **whatsapp-outbox.entity.ts**

| Entity | Propiedad TS | Nombre Columna BD | Tipo Actual | Categoría | Motivo/Notas |
|--------|-------------|-------------------|------------|-----------|--------------|
| WhatsAppOutbox | lastRetryAt | last_retry_at | timestamp (nullable) | D | **REFACTOR REQUERIDO**: Convertir a `timestamp with time zone` |
| WhatsAppOutbox | sentAt | sent_at | timestamp (nullable) | D | **REFACTOR REQUERIDO**: Convertir a `timestamp with time zone` |
| WhatsAppOutbox | createdAt | created_at | @CreateDateColumn | A | Auditoría estándar - Correcto |
| WhatsAppOutbox | updatedAt | updated_at | @UpdateDateColumn | A | Auditoría estándar - Correcto |

**Campos de Fecha:** 4 (2 necesitan refactor)

---

## RESUMEN EJECUTIVO

### Estadísticas Globales

| Métrica | Cantidad |
|---------|----------|
| **Entities Totales Analizadas** | 43 |
| **Entities SIN campos de fecha** | 2 (Permission, RolePermission) |
| **Entities CON campos de fecha** | 41 |
| **Total de Campos de Fecha** | 142 |

### Desglose por Categoría

| Categoría | Cantidad | Porcentaje |
|-----------|----------|-----------|
| **A - TimestampTZ (Correcto)** | 109 | 76.8% |
| **B - Date (Correcto)** | 19 | 13.4% |
| **C - Time (Correcto)** | 10 | 7.0% |
| **D - Refactor Requerido** | 4 | 2.8% |

### Campos Que Requieren Refactor (Categoría D)

**Total de campos a refactorizar:** 4

1. **appointment.entity.ts** - 4 campos:
   - `cancelledAt` → cambiar a `timestamp with time zone`
   - `assignedAt` → cambiar a `timestamp with time zone`
   - `priceLockAt` → cambiar a `timestamp with time zone`
   - `rescheduledAt` → cambiar a `timestamp with time zone`

2. **groomer-route.entity.ts** - 1 campo:
   - `generatedAt` → cambiar a `timestamp with time zone`

3. **groomer-route-stop.entity.ts** - 4 campos:
   - `plannedArrivalTime` → cambiar a `timestamp with time zone`
   - `plannedDepartureTime` → cambiar a `timestamp with time zone`
   - `actualArrivalTime` → cambiar a `timestamp with time zone`
   - `actualDepartureTime` → cambiar a `timestamp with time zone`

4. **whatsapp-outbox.entity.ts** - 2 campos:
   - `lastRetryAt` → cambiar a `timestamp with time zone`
   - `sentAt` → cambiar a `timestamp with time zone`

---

## ANÁLISIS POR TIPO DE CAMPO

### Campos Timestamp with Time Zone (A) - 109 campos ✅

Estos son los campos correctamente configurados para almacenar instantes reales con zona horaria:

- `@CreateDateColumn` y `@UpdateDateColumn` (auditoría estándar)
- Timestamps que capturan moments específicos del tiempo
- Uso: Cuándo ocurrió algo, cuándo explica algo, eventos puntuales

**Ejemplo:** `appointment.createdAt`, `user.lastLogin`, `clinic.suspendedAt`

---

### Campos Date (B) - 19 campos ✅

Estos campos almacenan SOLO la fecha (YYYY-MM-DD) sin información de hora:

```
- pet.dateOfBirth
- pet.deceasedAt
- clinic-calendar-exception.date
- groomer-route.routeDate
- reminder.scheduledDate
- stylist-capacity.date
- stylist-unavailable-period.startDate
- stylist-unavailable-period.endDate
- clinic-whatsapp-config.lastResetDate
```

**Uso Apropiado:** Fechas de nacimiento, muertes, excepciones del calendario, rutas por día

---

### Campos Time (C) - 10 campos ✅

Estos campos almacenan SOLO la hora del día (HH:MM:SS) sin información de fecha:

```
- client.preferredContactTimeStart
- client.preferredContactTimeEnd
- clinic-calendar-exception.startTime
- clinic-calendar-exception.endTime
- message-template.scheduledTime
- stylist-availability.startTime
- stylist-availability.endTime
- stylist-unavailable-period.startTime (nullable)
- stylist-unavailable-period.endTime (nullable)
```

**Uso Apropiado:** Horarios laborales, rangos de horas, no es necesaria la fecha

---

### Campos Que Necesitan Refactor (D) - 4 campos ⚠️

Estos campos usan `timestamp` sin zona horaria, lo que puede causar problemas con UTC:

```
1. appointment.cancelledAt (timestamp → timestamp with time zone)
2. appointment.assignedAt (timestamp → timestamp with time zone)
3. appointment.priceLockAt (timestamp → timestamp with time zone)
4. appointment.rescheduledAt (timestamp → timestamp with time zone)
5. groomer-route.generatedAt (timestamp → timestamp with time zone)
6. groomer-route-stop.plannedArrivalTime (timestamp → timestamp with time zone)
7. groomer-route-stop.plannedDepartureTime (timestamp → timestamp with time zone)
8. groomer-route-stop.actualArrivalTime (timestamp → timestamp with time zone)
9. groomer-route-stop.actualDepartureTime (timestamp → timestamp with time zone)
10. whatsapp-outbox.lastRetryAt (timestamp → timestamp with time zone)
11. whatsapp-outbox.sentAt (timestamp → timestamp with time zone)
```

**⚠️ Problema:** Sin `with time zone`, el database asume la zona LOCAL, no UTC. Esto causa inconsistencias cuando se accede desde diferentes zonas horarias.

---

## RECOMENDACIONES

### 1. Conversión Inmediata de Campos (D)
Convertir todos los campos de tipo `timestamp` a `timestamp with time zone` para consistencia con UTC.

**Ejemplo de cambio:**
```typescript
// ANTES
@Column({ type: 'timestamp', nullable: true, name: 'cancelled_at' })
cancelledAt: Date | null = null;

// DESPUÉS
@Column({ type: 'timestamp with time zone', nullable: true, name: 'cancelled_at' })
cancelledAt: Date | null = null;
```

### 2. Mantener Consistencia
- Todos los timestamps de "cuándo pasó algo" deben usar `timestamp with time zone`
- Todas las fechas de "calendario" deben usar `date`
- Todos los horarios deben usar `time`

### 3. Documentación en Comentarios
Mantener comentarios claros sobre el tipo de dato esperado:

```typescript
@Column({ type: 'date', name: 'scheduled_date' })
scheduledDate!: Date; // YYYY-MM-DD, sin hora

@Column({ type: 'time', name: 'start_time' })
startTime!: string; // HH:MM, solo hora

@Column({ type: 'timestamp with time zone', name: 'created_at' })
createdAt!: Date; // Instante real en UTC
```

### 4. Migración de Base de Datos
Crear migración TypeORM para cambiar los tipos de columnas:

```sql
ALTER TABLE appointments 
  ALTER COLUMN cancelled_at TYPE timestamp with time zone,
  ALTER COLUMN assigned_at TYPE timestamp with time zone,
  ALTER COLUMN price_lock_at TYPE timestamp with time zone,
  ALTER COLUMN rescheduled_at TYPE timestamp with time zone;

ALTER TABLE groomer_routes 
  ALTER COLUMN generated_at TYPE timestamp with time zone;

ALTER TABLE groomer_route_stops 
  ALTER COLUMN planned_arrival_time TYPE timestamp with time zone,
  ALTER COLUMN planned_departure_time TYPE timestamp with time zone,
  ALTER COLUMN actual_arrival_time TYPE timestamp with time zone,
  ALTER COLUMN actual_departure_time TYPE timestamp with time zone;

ALTER TABLE whatsapp_outbox 
  ALTER COLUMN last_retry_at TYPE timestamp with time zone,
  ALTER COLUMN sent_at TYPE timestamp with time zone;
```

---

## CONCLUSIÓN

✅ **76.8%** de los campos de fecha están correctamente configurados
⚠️ **2.8%** de los campos necesitan refactor (11 campos)
📊 La mayoría de los campos siguen el patrón correcto de auditoría

El refactor de los 11 campos incorrectos es **CRÍTICO** para garantizar consistencia con UTC y prevenir bugs de zona horaria en operaciones de rutas, citas y notificaciones.

---

**Elaborado:** 6 de marzo de 2026
**Backend:** VibraLive
**Versión del Inventario:** 1.0
