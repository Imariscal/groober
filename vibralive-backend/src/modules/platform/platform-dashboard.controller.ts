import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PlatformRoleGuard } from '../../common/guards/platform-role.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PlatformDashboardService } from './platform-dashboard.service';

@Controller('platform')
export class PlatformDashboardController {
  constructor(private dashboardService: PlatformDashboardService) {}

  /**
   * GET /api/platform/dashboard
   * Global platform dashboard with KPIs
   * Guards: AuthGuard, PlatformRoleGuard, PermissionGuard
   * Required permission: platform:dashboard
   */
  @Get('dashboard')
  @UseGuards(AuthGuard, PlatformRoleGuard, PermissionGuard)
  @RequirePermission('platform:dashboard')
  async getDashboard() {
    return this.dashboardService.getDashboard();
  }
}
