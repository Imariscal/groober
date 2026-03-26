import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PlatformRoleGuard } from '../../common/guards/platform-role.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PlatformReportsService } from './platform-reports.service';

@Controller('platform')
export class PlatformReportsController {
  constructor(private reportsService: PlatformReportsService) {}

  /**
   * GET /api/platform/reports
   * Platform reports with real data
   * Guards: AuthGuard, PlatformRoleGuard, PermissionGuard
   * Required permission: platform:dashboard
   */
  @Get('reports')
  @UseGuards(AuthGuard, PlatformRoleGuard, PermissionGuard)
  @RequirePermission('platform:dashboard')
  async getReports(@Query('period') period?: string) {
    return this.reportsService.getReports(period || 'month');
  }
}
