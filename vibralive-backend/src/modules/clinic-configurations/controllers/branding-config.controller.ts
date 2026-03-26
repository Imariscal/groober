import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { PermissionGuard } from '../../../modules/auth/guards/permission.guard';
import { RequirePermission } from '../../../modules/auth/decorators/permission.decorator';
import { BrandingConfigService } from '../services/branding-config.service';
import {
  UpdateBrandingConfigDto,
  BrandingConfigResponseDto,
  PublicBrandingDto,
} from '../dto/branding-config.dto';

@Controller()
export class BrandingConfigController {
  constructor(private readonly brandingService: BrandingConfigService) {}

  // =====================================================
  // PUBLIC ENDPOINTS (no auth required)
  // =====================================================

  // Get branding for login page by clinic slug
  @Get('public/branding/:clinicSlug')
  async getPublicBranding(
    @Param('clinicSlug') clinicSlug: string,
  ): Promise<PublicBrandingDto> {
    return this.brandingService.getPublicBranding(clinicSlug);
  }

  // =====================================================
  // PROTECTED ENDPOINTS
  // =====================================================

  @UseGuards(AuthGuard, TenantGuard, PermissionGuard)
  @Get('clinics/:clinicId/config/branding')
  @RequirePermission('clinic:settings')
  async getBrandingConfig(
    @Param('clinicId') clinicId: string,
  ): Promise<BrandingConfigResponseDto> {
    return this.brandingService.getBrandingConfig(clinicId);
  }

  @UseGuards(AuthGuard, TenantGuard, PermissionGuard)
  @Put('clinics/:clinicId/config/branding')
  @RequirePermission('clinic:settings')
  async updateBrandingConfig(
    @Param('clinicId') clinicId: string,
    @Body() dto: UpdateBrandingConfigDto,
  ): Promise<BrandingConfigResponseDto> {
    return this.brandingService.updateBrandingConfig(clinicId, dto);
  }

  @UseGuards(AuthGuard, TenantGuard, PermissionGuard)
  @Delete('clinics/:clinicId/config/branding')
  @RequirePermission('clinic:settings')
  async resetBranding(
    @Param('clinicId') clinicId: string,
  ): Promise<BrandingConfigResponseDto> {
    return this.brandingService.resetBranding(clinicId);
  }

  // Get current user's clinic branding (for sidebar/topbar)
  @UseGuards(AuthGuard, TenantGuard, PermissionGuard)
  @Get('clinics/:clinicId/branding')
  @RequirePermission('clinic:settings')
  async getClinicBranding(
    @Param('clinicId') clinicId: string,
  ): Promise<PublicBrandingDto> {
    return this.brandingService.getBrandingByClinicId(clinicId);
  }
}
