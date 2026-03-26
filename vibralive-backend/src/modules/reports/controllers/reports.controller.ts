import { Controller, Get, Query, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { PermissionGuard } from '../../../modules/auth/guards/permission.guard';
import { RequirePermission } from '../../../modules/auth/decorators/permission.decorator';
import { RevenueReportService } from '../services/revenue-report.service';
import { AppointmentsReportService } from '../services/appointments-report.service';
import { ClientsReportService } from '../services/clients-report.service';
import { ServicesReportService } from '../services/services-report.service';
import { PerformanceReportService } from '../services/performance-report.service';
import { GeographyReportService } from '../services/geography-report.service';
import { OverviewReportService } from '../services/overview-report.service';
import { ReportQueryParams } from '../dto/reports.dto';

@Controller('reports')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class ReportsController {
  constructor(
    private revenueReportService: RevenueReportService,
    private appointmentsReportService: AppointmentsReportService,
    private clientsReportService: ClientsReportService,
    private servicesReportService: ServicesReportService,
    private performanceReportService: PerformanceReportService,
    private geographyReportService: GeographyReportService,
    private overviewReportService: OverviewReportService,
  ) {}

  /**
   * GET /reports/revenue
   * Revenue dashboard with KPIs and charts
   */
  @Get('revenue')
  @RequirePermission('reports:view')
  async getRevenueReport(
    @Req() req: any,
    @Query('period') period: string = 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('locationType') locationType?: string,
    @Query('statuses') statuses?: string | string[],
  ) {
    try {
      const clinicId = req.user.clinic_id;
      if (!clinicId) {
        throw new HttpException('No clinic context', HttpStatus.FORBIDDEN);
      }

      // Convert statuses to array if it's a single string
      const statusesArray = typeof statuses === 'string' ? [statuses] : (Array.isArray(statuses) ? statuses : undefined);

      const params: ReportQueryParams = {
        clinicId,
        period: period as any,
        startDate,
        endDate,
        locationType: locationType as 'CLINIC' | 'HOME' | undefined,
        statuses: statusesArray,
      };

      return await this.revenueReportService.generate(params);
    } catch (error) {
      console.error('Error generating revenue report:', error);
      const message = error instanceof Error ? error.message : 'Error generating report';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * GET /reports/appointments
   * Appointments dashboard with KPIs, charts and daily list
   */
  @Get('appointments')
  @RequirePermission('reports:view')
  async getAppointmentsReport(
    @Req() req: any,
    @Query('period') period: string = 'week',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('locationType') locationType?: string,
    @Query('statuses') statuses?: string | string[],
    @Query('paid') paid?: string,
    @Query('excludeStatuses') excludeStatuses?: string | string[],
  ) {
    try {
      const clinicId = req.user.clinic_id;
      if (!clinicId) {
        throw new HttpException('No clinic context', HttpStatus.FORBIDDEN);
      }

      // Convert statuses to array if it's a single string
      const statusesArray = typeof statuses === 'string' ? [statuses] : (Array.isArray(statuses) ? statuses : undefined);
      const excludeStatusesArray = typeof excludeStatuses === 'string' ? [excludeStatuses] : (Array.isArray(excludeStatuses) ? excludeStatuses : undefined);
      const paidBoolean = paid !== undefined ? paid === 'true' : undefined;

      const params: ReportQueryParams = {
        clinicId,
        period: period as any,
        startDate,
        endDate,
        locationType: locationType as 'CLINIC' | 'HOME' | undefined,
        statuses: statusesArray,
        paid: paidBoolean,
        excludeStatuses: excludeStatusesArray,
      };

      return await this.appointmentsReportService.generate(params);
    } catch (error) {
      console.error('Error generating appointments report:', error);
      const message = error instanceof Error ? error.message : 'Error generating report';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * GET /reports/clients
   * Clients analysis: growth, retention, segmentation
   */
  @Get('clients')
  @RequirePermission('reports:view')
  async getClientsReport(
    @Req() req: any,
    @Query('period') period: string = 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('locationType') locationType?: string,
    @Query('statuses') statuses?: string | string[],
  ) {
    try {
      const clinicId = req.user.clinic_id;
      if (!clinicId) {
        throw new HttpException('No clinic context', HttpStatus.FORBIDDEN);
      }

      // Convert statuses to array if it's a single string
      const statusesArray = typeof statuses === 'string' ? [statuses] : (Array.isArray(statuses) ? statuses : undefined);

      const params: ReportQueryParams = {
        clinicId,
        period: period as any,
        startDate,
        endDate,
        locationType: locationType as 'CLINIC' | 'HOME' | undefined,
        statuses: statusesArray,
      };

      return await this.clientsReportService.generate(params);
    } catch (error) {
      console.error('Error generating clients report:', error);
      const message = error instanceof Error ? error.message : 'Error generating report';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * GET /reports/services
   * Services analysis: demand, profitability, popularity
   */
  @Get('services')
  @RequirePermission('reports:view')
  async getServicesReport(
    @Req() req: any,
    @Query('period') period: string = 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('locationType') locationType?: string,
    @Query('statuses') statuses?: string | string[],
    @Query('paid') paid?: string,
    @Query('excludeStatuses') excludeStatuses?: string | string[],
  ) {
    try {
      const clinicId = req.user.clinic_id;
      if (!clinicId) {
        throw new HttpException('No clinic context', HttpStatus.FORBIDDEN);
      }

      // Convert statuses to array if it's a single string
      const statusesArray = typeof statuses === 'string' ? [statuses] : (Array.isArray(statuses) ? statuses : undefined);
      const excludeStatusesArray = typeof excludeStatuses === 'string' ? [excludeStatuses] : (Array.isArray(excludeStatuses) ? excludeStatuses : undefined);
      const paidBoolean = paid !== undefined ? paid === 'true' : undefined;

      const params: ReportQueryParams = {
        clinicId,
        period: period as any,
        startDate,
        endDate,
        locationType: locationType as 'CLINIC' | 'HOME' | undefined,
        statuses: statusesArray,
        paid: paidBoolean,
        excludeStatuses: excludeStatusesArray,
      };

      return await this.servicesReportService.generate(params);
    } catch (error) {
      console.error('Error generating services report:', error);
      const message = error instanceof Error ? error.message : 'Error generating report';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * GET /reports/performance
   * Stylists performance: utilization, revenue, ratings
   */
  @Get('performance')
  @RequirePermission('reports:view')
  async getPerformanceReport(
    @Req() req: any,
    @Query('period') period: string = 'week',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('locationType') locationType?: string,
    @Query('statuses') statuses?: string | string[],
  ) {
    try {
      const clinicId = req.user.clinic_id;
      if (!clinicId) {
        throw new HttpException('No clinic context', HttpStatus.FORBIDDEN);
      }

      // Convert statuses to array if it's a single string
      const statusesArray = typeof statuses === 'string' ? [statuses] : (Array.isArray(statuses) ? statuses : undefined);

      const params: ReportQueryParams = {
        clinicId,
        period: period as any,
        startDate,
        endDate,
        locationType: locationType as 'CLINIC' | 'HOME' | undefined,
        statuses: statusesArray,
      };

      return await this.performanceReportService.generate(params);
    } catch (error) {
      console.error('Error generating performance report:', error);
      const message = error instanceof Error ? error.message : 'Error generating report';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * GET /reports/geography
   * Geographic heatmap: zone coverage, demand density
   */
  @Get('geography')
  @RequirePermission('reports:view')
  async getGeographyReport(
    @Req() req: any,
    @Query('period') period: string = 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('locationType') locationType?: string,
    @Query('statuses') statuses?: string | string[],
  ) {
    try {
      const clinicId = req.user.clinic_id;
      if (!clinicId) {
        throw new HttpException('No clinic context', HttpStatus.FORBIDDEN);
      }

      // Convert statuses to array if it's a single string
      const statusesArray = typeof statuses === 'string' ? [statuses] : (Array.isArray(statuses) ? statuses : undefined);

      const params: ReportQueryParams = {
        clinicId,
        period: period as any,
        startDate,
        endDate,
        locationType: locationType as 'CLINIC' | 'HOME' | undefined,
        statuses: statusesArray,
      };

      return await this.geographyReportService.generate(params);
    } catch (error) {
      console.error('Error generating geography report:', error);
      const message = error instanceof Error ? error.message : 'Error generating report';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * GET /reports/overview
   * Consolidated dashboard: key metrics, charts, alerts
   */
  @Get('overview')
  async getOverviewReport(
    @Req() req: any,
    @Query('period') period: string = 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('locationType') locationType?: string,
    @Query('statuses') statuses?: string | string[],
  ) {
    try {
      console.log('=== Overview Report Endpoint ===');
      console.log('User object:', req.user);
      const clinicId = req.user.clinic_id;
      console.log('Extracted clinicId:', clinicId);
      if (!clinicId) {
        throw new HttpException('No clinic context', HttpStatus.FORBIDDEN);
      }

      // Convert statuses to array if it's a single string
      const statusesArray = typeof statuses === 'string' ? [statuses] : (Array.isArray(statuses) ? statuses : undefined);

      const params: ReportQueryParams = {
        clinicId,
        period: period as any,
        startDate,
        endDate,
        locationType: locationType as 'CLINIC' | 'HOME' | undefined,
        statuses: statusesArray,
      };

      return await this.overviewReportService.generate(params);
    } catch (error) {
      console.error('Error generating overview report:', error);
      const message = error instanceof Error ? error.message : 'Error generating report';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
