import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { dataSourceOptions } from '@/database/data-source';
import {
  Clinic,
  User,
  Client,
  ClientAddress,
  Pet,
  Appointment,
  WhatsAppOutbox,
  AnimalType,
  Reminder,
  MessageLog,
  PlatformUser,
  PlatformRole,
  AuditLog,
  GroomerRoute,
  GroomerRouteStop,
  AppointmentItem,
  PriceListHistory,
  PriceList,
  Service,
  ServicePrice,
  ServicePackage,
  ServicePackageItem,
  ServicePackagePrice,
  ClinicConfiguration,
  ClinicCalendarException,
  // RBAC entities
  Role,
  Permission,
  RolePermission,
  UserRole,
  // Domain profiles
  Stylist,
  StylistAvailability,
  StylistUnavailablePeriod,
  StylistCapacity,
  Veterinarian,
  VeterinarianAvailability,
  VeterinarianUnavailablePeriod,
  VeterinarianCapacity,
  // Campaigns entities
  CampaignTemplate,
  Campaign,
  CampaignRecipient,
  EmailOutbox,
  // Preventive Care entities
  PetPreventiveCareEvent,
  ReminderQueue,
  // POS entities
  Sale,
  SaleProduct,
  SaleItem,
  SalePayment,
  InventoryMovement,
  // Medical Visits (EHR) entities
  MedicalVisit,
  MedicalVisitExam,
  MedicalVisitDiagnosis,
  Prescription,
  Vaccine,
  Vaccination,
  MedicationAllergy,
  DiagnosticOrder,
  DiagnosticTestResult,
  MedicalProcedure,
  FollowUpNote,
  MedicalAttachment,
} from '@/database/entities';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { ClientsModule } from '@/modules/clients/clients.module';
import { ClientAddressesModule } from '@/modules/addresses/addresses.module';
import { PetsModule } from '@/modules/pets/pets.module';
import { AppointmentsModule } from '@/modules/appointments/appointments.module';
import { WhatsAppModule } from '@/modules/whatsapp/whatsapp.module';
import { AnimalTypesModule } from '@/modules/animal-types/animal-types.module';
import { PlatformModule } from '@/modules/platform/platform.module';
import { EmailModule } from '@/modules/email/email.module';
import { PricingModule } from '@/modules/pricing/pricing.module';
import { PriceListsModule } from '@/modules/price-lists/price-lists.module';
import { ServicesModule } from '@/modules/services/services.module';
import { PackagesModule } from '@/modules/packages/packages.module';
import { ClinicConfigurationsModule } from '@/modules/clinic-configurations/clinic-configurations.module';
import { RolesModule } from '@/modules/roles/roles.module';
import { StylistsModule } from '@/modules/stylists/stylists.module';
import { VeterinariansModule } from '@/modules/veterinarians/veterinarians.module';
import { ReportsModule } from '@/modules/reports/reports.module';
import { CampaignsModule } from '@/modules/campaigns/campaigns.module';
import { PreventiveCareModule } from '@/modules/preventive-care/preventive-care.module';
import { POSModule } from '@/modules/pos/pos.module';
import { MedicalVisitsModule } from '@/modules/medical-visits/medical-visits.module';
import { VaccineCatalogModule } from '@/modules/vaccine-catalog/vaccine-catalog.module';
import { JwtConfigService } from '@/config/jwt-config.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot(dataSourceOptions),
    TypeOrmModule.forFeature([
      Clinic,
      User,
      Client,
      ClientAddress,
      Pet,
      Appointment,
      WhatsAppOutbox,
      AnimalType,
      Reminder,
      MessageLog,
      PlatformUser,
      PlatformRole,
      AuditLog,
      GroomerRoute,
      GroomerRouteStop,
      AppointmentItem,
      PriceListHistory,
      PriceList,
      Service,
      ServicePrice,
      ServicePackage,
      ServicePackageItem,
      ServicePackagePrice,
      ClinicConfiguration,
      ClinicCalendarException,
      // RBAC entities
      Role,
      Permission,
      RolePermission,
      UserRole,
      // Domain profiles
      Stylist,
      StylistAvailability,
      StylistUnavailablePeriod,
      StylistCapacity,
      Veterinarian,
      VeterinarianAvailability,
      VeterinarianUnavailablePeriod,
      VeterinarianCapacity,
      // Campaigns entities
      CampaignTemplate,
      Campaign,
      CampaignRecipient,
      EmailOutbox,
      // Preventive Care entities
      PetPreventiveCareEvent,
      ReminderQueue,
      // POS entities
      Sale,
      SaleProduct,
      SaleItem,
      SalePayment,
      InventoryMovement,
      // Medical Visits (EHR) entities
      MedicalVisit,
      MedicalVisitExam,
      MedicalVisitDiagnosis,
      Prescription,
      Vaccine,
      Vaccination,
      MedicationAllergy,
      DiagnosticOrder,
      DiagnosticTestResult,
      MedicalProcedure,
      FollowUpNote,
      MedicalAttachment,
    ]),
    JwtModule.registerAsync({
      global: true,
      useClass: JwtConfigService,
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ClientsModule,
    ClientAddressesModule,
    PetsModule,
    AppointmentsModule,
    WhatsAppModule,
    AnimalTypesModule,
    PlatformModule,
    EmailModule,
    PricingModule,
    PriceListsModule,
    ServicesModule,
    PackagesModule,
    ClinicConfigurationsModule,
    RolesModule,
    StylistsModule,
    VeterinariansModule,
    ReportsModule,
    CampaignsModule,
    PreventiveCareModule,
    POSModule,
    MedicalVisitsModule,
    VaccineCatalogModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtConfigService],
})
export class AppModule {}
