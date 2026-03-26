import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { PermissionGuard } from '../../../modules/auth/guards/permission.guard';
import { RequirePermission } from '../../../modules/auth/decorators/permission.decorator';
import { CommunicationConfigService } from '../services/communication-config.service';
import {
  UpdateBillingConfigDto,
  UpdateEmailConfigDto,
  TestEmailDto,
  UpdateWhatsAppConfigDto,
  TestWhatsAppDto,
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
  TEMPLATE_VARIABLES,
} from '../dto/communication-config.dto';

@Controller('clinics/:clinicId/config')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class CommunicationConfigController {
  constructor(private readonly configService: CommunicationConfigService) {}

  // =====================================================
  // BILLING CONFIG
  // =====================================================

  @Get('billing')
  @RequirePermission('clinic:settings')
  async getBillingConfig(@Param('clinicId') clinicId: string) {
    return this.configService.getBillingConfig(clinicId);
  }

  @Put('billing')
  @RequirePermission('clinic:settings')
  async updateBillingConfig(
    @Param('clinicId') clinicId: string,
    @Body() dto: UpdateBillingConfigDto,
  ) {
    return this.configService.updateBillingConfig(clinicId, dto);
  }

  // =====================================================
  // EMAIL CONFIG
  // =====================================================

  @Get('email')
  @RequirePermission('clinic:settings')
  async getEmailConfig(@Param('clinicId') clinicId: string) {
    return this.configService.getEmailConfig(clinicId);
  }

  @Put('email')
  @RequirePermission('clinic:settings')
  async updateEmailConfig(
    @Param('clinicId') clinicId: string,
    @Body() dto: UpdateEmailConfigDto,
  ) {
    return this.configService.updateEmailConfig(clinicId, dto);
  }

  @Post('email/test')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('clinic:settings')
  async testEmailConfig(
    @Param('clinicId') clinicId: string,
    @Body() dto: TestEmailDto,
  ) {
    return this.configService.testEmailConfig(clinicId, dto.testEmail);
  }

  // =====================================================
  // WHATSAPP CONFIG
  // =====================================================

  @Get('whatsapp')
  @RequirePermission('clinic:settings')
  async getWhatsAppConfig(@Param('clinicId') clinicId: string) {
    return this.configService.getWhatsAppConfig(clinicId);
  }

  @Put('whatsapp')
  @RequirePermission('clinic:settings')
  async updateWhatsAppConfig(
    @Param('clinicId') clinicId: string,
    @Body() dto: UpdateWhatsAppConfigDto,
  ) {
    return this.configService.updateWhatsAppConfig(clinicId, dto);
  }

  @Post('whatsapp/test')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('clinic:settings')
  async testWhatsAppConfig(
    @Param('clinicId') clinicId: string,
    @Body() dto: TestWhatsAppDto,
  ) {
    return this.configService.testWhatsAppConfig(clinicId, dto.testPhone);
  }

  // =====================================================
  // MESSAGE TEMPLATES
  // =====================================================

  @Get('templates')
  @RequirePermission('clinic:settings')
  async listTemplates(
    @Param('clinicId') clinicId: string,
    @Query('channel') channel?: string,
    @Query('trigger') trigger?: string,
  ) {
    return this.configService.listTemplates(clinicId, channel, trigger);
  }

  @Get('templates/variables')
  @RequirePermission('clinic:settings')
  getTemplateVariables() {
    return TEMPLATE_VARIABLES;
  }

  @Get('templates/:templateId')
  @RequirePermission('clinic:settings')
  async getTemplate(
    @Param('clinicId') clinicId: string,
    @Param('templateId') templateId: string,
  ) {
    return this.configService.getTemplate(clinicId, templateId);
  }

  @Post('templates')
  @RequirePermission('clinic:settings')
  async createTemplate(
    @Param('clinicId') clinicId: string,
    @Body() dto: CreateMessageTemplateDto,
  ) {
    return this.configService.createTemplate(clinicId, dto);
  }

  @Put('templates/:templateId')
  @RequirePermission('clinic:settings')
  async updateTemplate(
    @Param('clinicId') clinicId: string,
    @Param('templateId') templateId: string,
    @Body() dto: UpdateMessageTemplateDto,
  ) {
    return this.configService.updateTemplate(clinicId, templateId, dto);
  }

  @Delete('templates/:templateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('clinic:settings')
  async deleteTemplate(
    @Param('clinicId') clinicId: string,
    @Param('templateId') templateId: string,
  ) {
    return this.configService.deleteTemplate(clinicId, templateId);
  }

  @Post('templates/:templateId/duplicate')
  @RequirePermission('clinic:settings')
  async duplicateTemplate(
    @Param('clinicId') clinicId: string,
    @Param('templateId') templateId: string,
  ) {
    return this.configService.duplicateTemplate(clinicId, templateId);
  }

  @Post('templates/seed')
  @HttpCode(HttpStatus.OK)
  async seedDefaultTemplates(@Param('clinicId') clinicId: string) {
    const count = await this.configService.seedDefaultTemplates(clinicId);
    return { message: `Se crearon ${count} plantillas predeterminadas`, count };
  }
}
