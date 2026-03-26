import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import {
  RequirePlatformRole,
  RequirePermission,
  CurrentUser,
} from '../../common/decorators';
import { PlatformRoleGuard, PermissionGuard } from '../../common/guards';
import { SubscriptionPlansService, CreatePlanDto, UpdatePlanDto } from './subscription-plans.service';

@Controller('platform')
export class SubscriptionPlansController {
  constructor(private plansService: SubscriptionPlansService) {}

  /**
   * GET /api/platform/plans
   * List all subscription plans
   */
  @Get('plans')
  @UseGuards(AuthGuard, PlatformRoleGuard, PermissionGuard)
  @RequirePermission('clinics:read')
  async listPlans(@Query('status') status?: string) {
    return this.plansService.listPlans({ status });
  }

  /**
   * GET /api/platform/plans/active
   * List only active plans (for dropdowns)
   */
  @Get('plans/active')
  @UseGuards(AuthGuard, PlatformRoleGuard, PermissionGuard)
  @RequirePermission('clinics:read')
  async listActivePlans() {
    return this.plansService.listPlans({ status: 'active' });
  }

  /**
   * GET /api/platform/plans/:id
   * Get plan by ID
   */
  @Get('plans/:id')
  @UseGuards(AuthGuard, PlatformRoleGuard, PermissionGuard)
  @RequirePermission('clinics:read')
  async getPlan(@Param('id') id: string) {
    return this.plansService.getPlanById(id);
  }

  /**
   * POST /api/platform/plans
   * Create a new subscription plan
   */
  @Post('plans')
  @UseGuards(AuthGuard, PlatformRoleGuard, PermissionGuard)
  @RequirePlatformRole('PLATFORM_SUPERADMIN')
  @RequirePermission('clinics:create')
  async createPlan(
    @Body() dto: CreatePlanDto,
    @CurrentUser() user: any,
  ) {
    return this.plansService.createPlan(dto, user.sub);
  }

  /**
   * PATCH /api/platform/plans/:id
   * Update a subscription plan
   */
  @Patch('plans/:id')
  @UseGuards(AuthGuard, PlatformRoleGuard, PermissionGuard)
  @RequirePlatformRole('PLATFORM_SUPERADMIN')
  @RequirePermission('clinics:update')
  async updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
    @CurrentUser() user: any,
  ) {
    return this.plansService.updatePlan(id, dto, user.sub);
  }

  /**
   * POST /api/platform/plans/:id/toggle-status
   * Toggle plan status (active/inactive)
   */
  @Post('plans/:id/toggle-status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, PlatformRoleGuard, PermissionGuard)
  @RequirePlatformRole('PLATFORM_SUPERADMIN')
  @RequirePermission('clinics:update')
  async togglePlanStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.plansService.togglePlanStatus(id, user.sub);
  }

  /**
   * DELETE /api/platform/plans/:id
   * Delete (soft) a subscription plan
   */
  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard, PlatformRoleGuard, PermissionGuard)
  @RequirePlatformRole('PLATFORM_SUPERADMIN')
  @RequirePermission('clinics:delete')
  async deletePlan(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.plansService.deletePlan(id, user.sub);
  }
}
