import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicBranding, Clinic } from '../../../database/entities';
import {
  UpdateBrandingConfigDto,
  BrandingConfigResponseDto,
  PublicBrandingDto,
  BrandingFeatureDto,
} from '../dto/branding-config.dto';

@Injectable()
export class BrandingConfigService {
  constructor(
    @InjectRepository(ClinicBranding)
    private brandingRepo: Repository<ClinicBranding>,
    @InjectRepository(Clinic)
    private clinicRepo: Repository<Clinic>,
  ) {}

  async getBrandingConfig(clinicId: string): Promise<BrandingConfigResponseDto> {
    let config = await this.brandingRepo.findOne({ where: { clinicId } });

    if (!config) {
      // Create default branding config
      config = this.brandingRepo.create({ clinicId });
      config = await this.brandingRepo.save(config);
    }

    return this.toBrandingResponse(config);
  }

  async updateBrandingConfig(
    clinicId: string,
    dto: UpdateBrandingConfigDto,
  ): Promise<BrandingConfigResponseDto> {
    let config = await this.brandingRepo.findOne({ where: { clinicId } });

    if (!config) {
      config = this.brandingRepo.create({ clinicId });
    }

    // Handle features JSON
    const { features, ...rest } = dto;
    Object.assign(config, rest);
    
    if (features !== undefined) {
      config.featuresJson = JSON.stringify(features);
    }

    config = await this.brandingRepo.save(config);
    return this.toBrandingResponse(config);
  }

  // Public endpoint - for login pages (no auth required)
  async getPublicBranding(clinicIdentifier: string): Promise<PublicBrandingDto> {
    // Try to find clinic by slug first, then by ID
    let clinic = await this.clinicRepo.findOne({ 
      where: { slug: clinicIdentifier },
      select: ['id', 'name', 'slug'],
    });

    // If not found by slug, try by ID (UUID format)
    if (!clinic && this.isUUID(clinicIdentifier)) {
      clinic = await this.clinicRepo.findOne({ 
        where: { id: clinicIdentifier },
        select: ['id', 'name', 'slug'],
      });
    }

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    const config = await this.brandingRepo.findOne({ 
      where: { clinicId: clinic.id } 
    });

    // Return default branding if none configured
    if (!config || !config.isActive) {
      return this.getDefaultPublicBranding(clinic.name);
    }

    return this.toPublicBranding(config, clinic.name);
  }

  private isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  // Get branding by clinic ID (for authenticated users)
  async getBrandingByClinicId(clinicId: string): Promise<PublicBrandingDto> {
    const clinic = await this.clinicRepo.findOne({ 
      where: { id: clinicId },
      select: ['id', 'name'],
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    const config = await this.brandingRepo.findOne({ 
      where: { clinicId } 
    });

    if (!config || !config.isActive) {
      return this.getDefaultPublicBranding(clinic.name);
    }

    return this.toPublicBranding(config, clinic.name);
  }

  // Reset branding to defaults
  async resetBranding(clinicId: string): Promise<BrandingConfigResponseDto> {
    let config = await this.brandingRepo.findOne({ where: { clinicId } });

    if (config) {
      await this.brandingRepo.remove(config);
    }

    // Create fresh default config
    config = this.brandingRepo.create({ clinicId });
    config = await this.brandingRepo.save(config);

    return this.toBrandingResponse(config);
  }

  // =====================================================
  // Private Helper Methods
  // =====================================================

  private toBrandingResponse(config: ClinicBranding): BrandingConfigResponseDto {
    const features = this.parseFeatures(config.featuresJson);

    return {
      id: config.id,
      clinicId: config.clinicId,
      logoUrl: config.logoUrl,
      logoDarkUrl: config.logoDarkUrl,
      faviconUrl: config.faviconUrl,
      loginBackgroundUrl: config.loginBackgroundUrl,
      brandName: config.brandName,
      tagline: config.tagline,
      primaryColor: config.primaryColor,
      primaryColorLight: config.primaryColorLight,
      primaryColorDark: config.primaryColorDark,
      secondaryColor: config.secondaryColor,
      accentColor: config.accentColor,
      sidebarBgColor: config.sidebarBgColor,
      sidebarTextColor: config.sidebarTextColor,
      sidebarActiveBg: config.sidebarActiveBg,
      sidebarActiveText: config.sidebarActiveText,
      topbarBgColor: config.topbarBgColor,
      topbarTextColor: config.topbarTextColor,
      loginGradientFrom: config.loginGradientFrom,
      loginGradientTo: config.loginGradientTo,
      loginTextColor: config.loginTextColor,
      fontFamily: config.fontFamily,
      headingFontFamily: config.headingFontFamily,
      borderRadius: config.borderRadius,
      buttonRadius: config.buttonRadius,
      features,
      footerText: config.footerText,
      privacyPolicyUrl: config.privacyPolicyUrl,
      termsUrl: config.termsUrl,
      customCss: config.customCss,
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  private toPublicBranding(config: ClinicBranding, clinicName: string): PublicBrandingDto {
    const features = this.parseFeatures(config.featuresJson);

    return {
      logoUrl: config.logoUrl,
      logoDarkUrl: config.logoDarkUrl,
      faviconUrl: config.faviconUrl,
      loginBackgroundUrl: config.loginBackgroundUrl,
      brandName: config.brandName || clinicName,
      tagline: config.tagline,
      primaryColor: config.primaryColor,
      loginGradientFrom: config.loginGradientFrom,
      loginGradientTo: config.loginGradientTo,
      loginTextColor: config.loginTextColor,
      fontFamily: config.fontFamily,
      features,
      footerText: config.footerText,
      privacyPolicyUrl: config.privacyPolicyUrl,
      termsUrl: config.termsUrl,
    };
  }

  private getDefaultPublicBranding(clinicName: string): PublicBrandingDto {
    return {
      brandName: clinicName || 'VibraLive',
      tagline: 'Motor de Retención Veterinario',
      primaryColor: '#0ea5e9',
      loginGradientFrom: '#2563eb',
      loginGradientTo: '#1d4ed8',
      loginTextColor: '#ffffff',
      fontFamily: 'Inter',
      features: [
        {
          icon: 'calendar',
          title: 'Agenda Inteligente',
          description: 'Gestiona citas y recordatorios automáticos',
        },
        {
          icon: 'pets',
          title: 'Perfiles de Mascotas',
          description: 'Historial completo de cada paciente',
        },
        {
          icon: 'whatsapp',
          title: 'WhatsApp Integrado',
          description: 'Comunicación directa con clientes',
        },
      ],
    };
  }

  private parseFeatures(json: string | null | undefined): BrandingFeatureDto[] | undefined {
    if (!json) return undefined;
    try {
      return JSON.parse(json);
    } catch {
      return undefined;
    }
  }
}
