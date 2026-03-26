import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { 
  Clinic, 
  ClinicConfiguration, 
  ClinicCalendarException,
  ClinicBillingConfig,
  ClinicEmailConfig,
  ClinicWhatsAppConfig,
  MessageTemplate,
  ClinicBranding,
} from '@/database/entities';
import { TimezoneModule } from '@/shared/timezone/timezone.module';
import { ClinicConfigurationsController } from './clinic-configurations.controller';
import { ClinicConfigurationsService } from './clinic-configurations.service';
import { CommunicationConfigController } from './controllers/communication-config.controller';
import { CommunicationConfigService } from './services/communication-config.service';
import { BrandingConfigController } from './controllers/branding-config.controller';
import { BrandingConfigService } from './services/branding-config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Clinic, 
      ClinicConfiguration, 
      ClinicCalendarException,
      ClinicBillingConfig,
      ClinicEmailConfig,
      ClinicWhatsAppConfig,
      MessageTemplate,
      ClinicBranding,
    ]),
    TimezoneModule,
  ],
  controllers: [
    ClinicConfigurationsController, 
    CommunicationConfigController,
    BrandingConfigController,
  ],
  providers: [
    ClinicConfigurationsService, 
    CommunicationConfigService,
    BrandingConfigService,
  ],
  exports: [
    ClinicConfigurationsService, 
    CommunicationConfigService,
    BrandingConfigService,
  ],
})
export class ClinicConfigurationsModule {}
