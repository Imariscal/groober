/**
 * EJEMPLO: Cómo usar el sistema de autenticación y permisos
 * Este archivo muestra patrones recomendados para implementar protección por roles y permisos
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';
import { RequirePermission, RequireRole } from '@/modules/auth/decorators/permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/database/entities';

/**
 * EJEMPLO 1: Endpoint público (sin protección)
 */
@Controller('api/public')
export class PublicController {
  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }
}

/**
 * EJEMPLO 2: Endpoints protegidos por autenticación
 */
@Controller('api/profile')
@UseGuards(AuthGuard)
export class ProfileController {
  /**
   * Cualquier usuario autenticado puede acceder
   */
  @Get('me')
  getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
    };
  }

  /**
   * Actualizar perfil - Solo el usuario dueño o superadmin
   */
  @Patch('me')
  updateProfile(@CurrentUser() user: User, @Body() updateDto: any) {
    // Aquí puedes validar que solo el usuario pueda actualizar su propio perfil
    return { success: true };
  }
}

/**
 * EJEMPLO 3: Endpoints protegidos por permisos específicos
 */
@Controller('api/clinics')
@UseGuards(AuthGuard, PermissionGuard)
export class ClinicsController {
  /**
   * Crear clínica - Solo usuarios con permiso 'clinics:create'
   * Típicamente: SuperAdmin
   */
  @Post()
  @RequirePermission('clinics:create')
  createClinic(@CurrentUser() user: User, @Body() createDto: any) {
    return {
      message: 'Clínica creada por ' + user.email,
      clinic_id: 'new-uuid',
    };
  }

  /**
   * Ver todas las clínicas - SuperAdmin puede ver todas
   * Owner solo ve su propia clínica (validar en servicio)
   */
  @Get()
  @RequirePermission('clinics:read')
  listClinics(@CurrentUser() user: User) {
    return {
      user_role: user.role,
      clinicId: user.clinicId,
      // logic: si es superadmin retorna todas,
      // si es owner retorna solo su clínica
    };
  }

  /**
   * Editar clínica - SuperAdmin tiene 'clinics:update'
   * Owner tiene 'clinic:manage' (solo su clínica)
   * Requiere UNO de estos permisos
   */
  @Patch(':id')
  @RequirePermission('clinics:update', 'clinic:manage')
  updateClinic(
    @CurrentUser() user: User,
    @Param('id') clinicId: string,
    @Body() updateDto: any,
  ) {
    // Logic: si user es owner, validar que clinicId === user.clinicId
    return { success: true };
  }

  /**
   * Suspender clínica - Solo SuperAdmin puede hacer esto
   */
  @Patch(':id/suspend')
  @RequirePermission('clinics:suspend')
  suspendClinic(
    @CurrentUser() user: User,
    @Param('id') clinicId: string,
  ) {
    return { success: true };
  }

  /**
   * Eliminar clínica - Solo SuperAdmin puede hacer esto
   */
  @Delete(':id')
  @RequirePermission('clinics:delete')
  deleteClinic(
    @CurrentUser() user: User,
    @Param('id') clinicId: string,
  ) {
    return { success: true };
  }
}

/**
 * EJEMPLO 4: Endpoints solo para SuperAdmin
 */
@Controller('api/admin')
@UseGuards(AuthGuard)
@RequireRole('superadmin')
export class AdminController {
  /**
   * Dashboard administrativo - Solo SuperAdmin
   */
  @Get('dashboard')
  getAdminDashboard(@CurrentUser() user: User) {
    return {
      total_clinics: 150,
      total_users: 5000,
      active_subscriptions: 120,
    };
  }

  /**
   * Ver logs de auditoría - Solo SuperAdmin
   */
  @Get('audit-logs')
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('audit:read')
  getAuditLogs() {
    return { logs: [] };
  }

  /**
   * Impersonar usuario - Solo SuperAdmin
   */
  @Post('impersonate/:userId')
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('users:impersonate')
  impersonateUser(@Param('userId') userId: string) {
    return { message: 'Usuario impersonado' };
  }
}

/**
 * EJEMPLO 5: Endpoints de Owner
 */
@Controller('api/clinic')
@UseGuards(AuthGuard, PermissionGuard)
export class ClinicManagementController {
  /**
   * Gestionar usuarios de una clínica
   * Solo Owner puede hacer esto con su clínica
   * SuperAdmin puede hacer esto con cualquier clínica
   */
  @Post('users')
  @RequirePermission('users:create')
  createClinicUser(@CurrentUser() user: User, @Body() createDto: any) {
    // Logic: validar que user.clinicId sea el clinic siendo gestionado
    return { success: true };
  }

  /**
   * Ver usuarios de la clínica
   */
  @Get('users')
  @RequirePermission('users:read')
  listClinicUsers(@CurrentUser() user: User) {
    return { users: [] };
  }

  /**
   * Configuración de clínica (solo owner)
   */
  @Get('settings')
  @RequirePermission('clinic:manage')
  getClinicSettings(@CurrentUser() user: User) {
    return {
      clinicId: user.clinicId,
      // settings...
    };
  }

  @Patch('settings')
  @RequirePermission('clinic:manage')
  updateClinicSettings(@CurrentUser() user: User, @Body() updateDto: any) {
    return { success: true };
  }
}

/**
 * EJEMPLO 6: Endpoints de Staff
 */
@Controller('api/clinic/clients')
@UseGuards(AuthGuard, PermissionGuard)
export class ClientsController {
  /**
   * Ver clientes de la clínica
   * Staff puede ver, Owner y SuperAdmin pueden ver todo
   */
  @Get()
  @RequirePermission('clients:read')
  listClients(@CurrentUser() user: User) {
    return {
      clinicId: user.clinicId,
      clients: [],
    };
  }

  /**
   * Crear cliente
   * Staff y Owner pueden crear en su clínica
   */
  @Post()
  @RequirePermission('clients:create')
  createClient(@CurrentUser() user: User, @Body() createDto: any) {
    return { success: true };
  }

  /**
   * Actualizar cliente
   * Staff y Owner pueden
   */
  @Patch(':id')
  @RequirePermission('clients:update')
  updateClient(
    @CurrentUser() user: User,
    @Param('id') clientId: string,
    @Body() updateDto: any,
  ) {
    return { success: true };
  }
}

/**
 * NOTAS DE IMPLEMENTACIÓN:
 *
 * 1. ALWAYS use @UseGuards(AuthGuard) en endpoints protegidos
 *
 * 2. Para requerir permisos ESPECÍFICOS:
 *    - Use @UseGuards(AuthGuard, PermissionGuard)
 *    - Use @RequirePermission('permission:action')
 *
 * 3. Para requerir un ROL específico:
 *    - Use @UseGuards(AuthGuard) (PermissionGuard maneja validación)
 *    - Use @RequireRole('superadmin')
 *
 * 4. Múltiples permisos (OR logic):
 *    @RequirePermission('clinics:update', 'clinic:manage')
 *    ↑ Usuario necesita TENER UNO de estos permisos
 *
 * 5. En la lógica del servicio:
 *    - Siempre valida que el usuario pueda acceder a los datos específicos
 *    - Si es Owner, valida que clinic_id coincida
 *    - Si es SuperAdmin, tiene acceso a todo
 *
 * 6. Errores:
 *    - Sin autenticación: 401 Unauthorized (AuthGuard)
 *    - Sin permiso: 403 Forbidden (PermissionGuard)
 */
