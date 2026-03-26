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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@/common/decorators';
import { TenantGuard } from '@/common/guards';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';
import { RequirePermission } from '@/modules/auth/decorators/permission.decorator';
import {
  CreateCampaignTemplateDto,
  UpdateCampaignTemplateDto,
  PreviewCampaignTemplateDto,
} from '../dtos';
import { CampaignTemplateService } from '../services';

@Controller('campaign-templates')
@UseGuards(AuthGuard('jwt'), TenantGuard, PermissionGuard)
export class CampaignTemplateController {
  constructor(private readonly templateService: CampaignTemplateService) {}

  /**
   * GET /campaign-templates
   * List campaign templates for clinic
   */
  @Get()
  @RequirePermission('campaigns:read')
  async listTemplates(@CurrentUser() user: any, @Query() query: any) {
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000'; // Default for testing
    return this.templateService.listTemplates(clinicId, {
      channel: query.channel,
      isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
    });
  }

  /**
   * GET /campaign-templates/:templateId
   * Get single template
   */
  @Get(':templateId')
  @RequirePermission('campaigns:read')
  async getTemplate(
    @CurrentUser() user: any,
    @Param('templateId') templateId: string,
  ) {
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000'; // Default for testing
    return this.templateService.getTemplate(clinicId, templateId);
  }

  /**
   * POST /campaign-templates
   * Create new campaign template
   */
  @Post()
  @RequirePermission('campaigns:create')
  async createTemplate(
    @CurrentUser() user: any,
    @Body() dto: CreateCampaignTemplateDto,
  ) {
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000'; // Default for testing
    const userId = user?.id || '550e8400-e29b-41d4-a716-446655440001'; // Default for testing
    return this.templateService.createTemplate(
      clinicId,
      userId,
      dto,
    );
  }

  /**
   * PATCH /campaign-templates/:templateId
   * Update template
   */
  @Patch(':templateId')
  @RequirePermission('campaigns:update')
  async updateTemplate(
    @CurrentUser() user: any,
    @Param('templateId') templateId: string,
    @Body() dto: UpdateCampaignTemplateDto,
  ) {
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000';
    return this.templateService.updateTemplate(
      clinicId,
      templateId,
      dto,
    );
  }

  /**
   * DELETE /campaign-templates/:templateId
   * Delete template
   */
  @Delete(':templateId')
  @HttpCode(204)
  @RequirePermission('campaigns:delete')
  async deleteTemplate(
    @CurrentUser() user: any,
    @Param('templateId') templateId: string,
  ) {
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000'; // Default for testing
    await this.templateService.deleteTemplate(clinicId, templateId);
  }

  /**
   * GET /campaign-templates/:templateId/preview
   * Preview template with sample data
   */
  @Get(':templateId/preview')
  async previewTemplate(
    @CurrentUser() user: any,
    @Param('templateId') templateId: string,
  ) {
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000';
    const template = await this.templateService.getTemplate(
      clinicId,
      templateId,
    );
    return this.templateService.previewTemplate(template);
  }

  /**
   * POST /campaign-templates/:templateId/render
   * Render template with actual context
   */
  @Post(':templateId/render')
  async renderTemplate(
    @CurrentUser() user: any,
    @Param('templateId') templateId: string,
    @Body() dto: { context: Record<string, any> },
  ) {
    const clinicId = user?.clinicId || '550e8400-e29b-41d4-a716-446655440000';
    const template = await this.templateService.getTemplate(
      clinicId,
      templateId,
    );
    return this.templateService.renderTemplate(template, dto.context);
  }

  /**
   * GET /campaign-templates/variables/supported
   * Get list of all supported variables for UI
   */
  @Get('variables/supported')
  getSupportedVariables() {
    return this.templateService.getSupportedVariables();
  }
}
