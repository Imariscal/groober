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
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@/common/decorators';
import { TenantGuard } from '@/common/guards';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';
import { RequirePermission } from '@/modules/auth/decorators/permission.decorator';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  PreviewAudienceDto,
} from '../dtos';
import {
  CampaignService,
  CampaignFilterService,
  CampaignAnalyticsService,
  CampaignSchedulerService,
} from '../services';

@Controller('campaigns')
@UseGuards(AuthGuard('jwt'), TenantGuard, PermissionGuard)
export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly filterService: CampaignFilterService,
    private readonly analyticsService: CampaignAnalyticsService,
    private readonly schedulerService: CampaignSchedulerService,
  ) {}

  /**
   * GET /campaigns
   * List campaigns for clinic
   */
  @Get()
  @RequirePermission('campaigns:read')
  async listCampaigns(@CurrentUser() user: any, @Query() query: any) {
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000'; // Default for testing
    const result = await this.campaignService.listCampaigns(clinicId, {
      status: query.status,
      page: parseInt(query.page || '1', 10),
      limit: parseInt(query.limit || '20', 10),
    });
    return result;
  }

  /**
   * GET /campaigns/:campaignId
   * Get single campaign with details
   */
  @Get(':campaignId')
  @RequirePermission('campaigns:read')
  async getCampaign(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
  ) {
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000'; // Default for testing
    return this.campaignService.getCampaign(clinicId, campaignId);
  }

  /**
   * POST /campaigns
   * Create new campaign
   */
  @Post()
  @RequirePermission('campaigns:create')
  async createCampaign(
    @CurrentUser() user: any,
    @Body() dto: CreateCampaignDto,
  ) {
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000';
    const userId = user?.id || '550e8400-e29b-41d4-a716-446655440001';
    return this.campaignService.createCampaign(
      clinicId,
      userId,
      dto,
    );
  }

  /**
   * PATCH /campaigns/:campaignId
   * Update campaign (only when DRAFT)
   */
  @Patch(':campaignId')
  @RequirePermission('campaigns:update')
  async updateCampaign(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000';
    return this.campaignService.updateCampaign(
      clinicId,
      campaignId,
      dto,
    );
  }

  /**
   * POST /campaigns/:campaignId/start
   * Start campaign execution
   * Transitions: DRAFT/SCHEDULED → RUNNING
   */
  @Post(':campaignId/start')
  @RequirePermission('campaigns:start')
  async startCampaign(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
  ) {
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000'; // Default for testing
    return this.campaignService.startCampaign(clinicId, campaignId);
  }

  /**
   * POST /campaigns/:campaignId/pause
   * Pause running campaign
   */
  @Post(':campaignId/pause')
  @RequirePermission('campaigns:pause')
  async pauseCampaign(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
  ) {
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000';
    const userId = user?.id || '550e8400-e29b-41d4-a716-446655440001';
    return this.campaignService.pauseCampaign(
      clinicId,
      campaignId,
      userId,
    );
  }

  /**
   * POST /campaigns/:campaignId/resume
   * Resume paused campaign
   */
  @Post(':campaignId/resume')
  @RequirePermission('campaigns:resume')
  async resumeCampaign(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
  ) {
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000'; // Default for testing
    return this.campaignService.resumeCampaign(clinicId, campaignId);
  }

  /**
   * DELETE /campaigns/:campaignId
   * Delete campaign (only when DRAFT)
   */
  @Delete(':campaignId')
  @HttpCode(204)
  @RequirePermission('campaigns:delete')
  async deleteCampaign(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
  ) {
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000'; // Default for testing
    await this.campaignService.deleteCampaign(clinicId, campaignId);
  }

  /**
   * GET /campaigns/:campaignId/metrics
   * Get campaign delivery metrics and analytics
   */
  @Get(':campaignId/metrics')
  @RequirePermission('campaigns:read')
  async getCampaignMetrics(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
  ) {
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000'; // Default for testing
    return this.campaignService.getCampaignMetrics(clinicId, campaignId);
  }

  /**
   * GET /campaigns/:campaignId/recipients
   * Get recipients for campaign with pagination
   */
  @Get(':campaignId/recipients')
  @RequirePermission('campaigns:read')
  async getCampaignRecipients(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
    @Query() query: any,
  ) {
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000';
    return this.campaignService.previewRecipients(
      clinicId,
      campaignId,
      parseInt(query.limit || '50', 10),
    );
  }

  /**
   * POST /campaigns/audience/preview
   * Preview audience size for filter combination
   * Useful for UI before creating campaign
   */
  @Post('audience/preview')
  @RequirePermission('campaigns:create')
  async previewAudience(
    @CurrentUser() user: any,
    @Body() dto: PreviewAudienceDto,
  ) {
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000';
    // Validate filter
    const validation = this.filterService.validateFilter(dto.filter);
    if (!validation.valid) {
      throw new BadRequestException(
        `Invalid filter: ${validation.errors.join(', ')}`,
      );
    }

    const estimatedCount = await this.filterService.estimateAudience(
      clinicId,
      dto.filter,
    );

    // Get sample recipients
    const limit = dto.limit || 50;
    const previllage = await this.filterService.previewRecipients(
      clinicId,
      dto.filter,
      limit,
    );

    return {
      estimatedCount,
      previewCount: previllage.length,
      preview: previllage,
    };
  }

  /**
   * GET /campaigns/:campaignId/progress
   * Get campaign execution progress
   */
  @Get(':campaignId/progress')
  @RequirePermission('campaigns:read')
  async getCampaignProgress(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
  ) {
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000';
    return this.campaignService.getCampaignExecutionProgress(campaignId);
  }

  /**
   * GET /campaigns/:campaignId/analytics
   * Get detailed campaign analytics
   */
  @Get(':campaignId/analytics')
  @RequirePermission('campaigns:read')
  async getCampaignAnalytics(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
  ) {
    return this.analyticsService.getCampaignMetrics(campaignId);
  }

  /**
   * GET /campaigns/:campaignId/recipients/status/:status
   * Get recipients by status with pagination
   */
  @Get(':campaignId/recipients/status/:status')
  @RequirePermission('campaigns:read')
  async getRecipientsByStatus(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
    @Param('status') status: string,
    @Query('limit') limit?: string,
  ) {
    const pageLimit = parseInt(limit || '50', 10);
    return this.analyticsService.getRecipientsByStatus(campaignId, status as any, pageLimit);
  }

  /**
   * GET /campaigns/:campaignId/recipients/breakdown
   * Get recipient status breakdown with statistics
   */
  @Get(':campaignId/recipients/breakdown')
  @RequirePermission('campaigns:read')
  async getRecipientBreakdown(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
  ) {
    return this.analyticsService.getRecipientStatusBreakdown(campaignId);
  }

  /**
   * POST /scheduler/trigger
   * Manually trigger campaign execution check
   * Useful for testing - normally handled by @Cron
   */
  @Post('scheduler/trigger')
  @HttpCode(200)
  @RequirePermission('campaigns:manage')
  async triggerScheduler(@CurrentUser() user: any) {
    return this.schedulerService.triggerScheduledCampaignCheck();
  }
}

