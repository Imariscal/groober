import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import {
  RequirePlatformRole,
  RequirePermission,
  CurrentUser,
} from '../../common/decorators';
import { PlatformRoleGuard, PermissionGuard } from '../../common/guards';
import { PlatformClinicsService } from './platform-clinics.service';
import { PlatformAuthService } from './platform-auth.service';
import {
  CreateClinicDto,
  UpdateClinicDto,
  SuspendClinicDto,
  CreateClinicOwnerDto,
  AssignPlanDto,
} from './dtos';

@Controller('platform')
export class PlatformClinicsController {
  constructor(
    private clinicsService: PlatformClinicsService,
    private platformAuthService: PlatformAuthService,
  ) {}

  // PUBLIC: Login endpoint
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async loginPlatform(
    @Body() loginDto: { email: string; password: string },
  ) {
    return this.platformAuthService.loginPlatform(loginDto);
  }

  // GUARD: List clinics
  @Get('clinics')
  @UseGuards(AuthGuard, PlatformRoleGuard, PermissionGuard)
  @RequirePermission('clinics:read')
  async listClinics(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('city') city?: string,
    @Query('search') search?: string,
  ) {
    return this.clinicsService.listClinics({
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
      status,
      plan,
      city,
      search,
    });
  }

  // GUARD: Get clinic
  @Get('clinics/:id')
  @UseGuards(AuthGuard, PlatformRoleGuard, PermissionGuard)
  @RequirePermission('clinics:read')
  async getClinic(@Param('id') clinicId: string) {
    return this.clinicsService.getClinicById(clinicId);
  }

  // GUARD: Create clinic
  @Post('clinics')
  @UseGuards(AuthGuard, PlatformRoleGuard, PermissionGuard)
  @RequirePlatformRole('PLATFORM_SUPERADMIN')
  @RequirePermission('clinics:create')
  async createClinic(
    @Body() dto: CreateClinicDto,
    @CurrentUser() user: any,
  ) {
    return this.clinicsService.createClinic(dto, user.sub);
  }

  // GUARD: Update clinic
  @Patch('clinics/:id')
  @UseGuards(AuthGuard, PlatformRoleGuard, PermissionGuard)
  @RequirePlatformRole('PLATFORM_SUPERADMIN')
  @RequirePermission('clinics:update')
  async updateClinic(
    @Param('id') clinicId: string,
    @Body() dto: UpdateClinicDto,
    @CurrentUser() user: any,
  ) {
    return this.clinicsService.updateClinic(clinicId, dto, user.sub);
  }

  // GUARD: Suspend clinic
  @Post('clinics/:id/suspend')
  @UseGuards(AuthGuard, PlatformRoleGuard, PermissionGuard)
  @RequirePermission('clinics:suspend')
  async suspendClinic(
    @Param('id') clinicId: string,
    @Body() dto: SuspendClinicDto,
    @CurrentUser() user: any,
  ) {
    return this.clinicsService.suspendClinic(clinicId, dto, user.sub);
  }

  // GUARD: Activate clinic
  @Post('clinics/:id/activate')
  @UseGuards(AuthGuard, PlatformRoleGuard, PermissionGuard)
  @RequirePermission('clinics:activate')
  async activateClinic(
    @Param('id') clinicId: string,
    @CurrentUser() user: any,
  ) {
    return this.clinicsService.activateClinic(clinicId, user.sub);
  }

  // GUARD: Create clinic owner (first admin user for onboarding)
  @Post('clinics/:id/owner')
  @UseGuards(AuthGuard, PlatformRoleGuard, PermissionGuard)
  @RequirePlatformRole('PLATFORM_SUPERADMIN')
  @RequirePermission('users:create')
  @HttpCode(HttpStatus.CREATED)
  async createClinicOwner(
    @Param('id') clinicId: string,
    @Body() dto: CreateClinicOwnerDto,
    @CurrentUser() user: any,
  ) {
    return this.clinicsService.createClinicOwner(clinicId, dto, user.sub);
  }

  // GUARD: Assign subscription plan to clinic
  @Post('clinics/:id/assign-plan')
  @UseGuards(AuthGuard, PlatformRoleGuard, PermissionGuard)
  @RequirePlatformRole('PLATFORM_SUPERADMIN')
  @RequirePermission('clinics:update')
  async assignPlan(
    @Param('id') clinicId: string,
    @Body() dto: AssignPlanDto,
    @CurrentUser() user: any,
  ) {
    return this.clinicsService.assignPlan(clinicId, dto.subscription_plan_id, user.sub);
  }
}
