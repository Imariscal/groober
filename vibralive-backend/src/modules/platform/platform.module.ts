import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Clinic,
  AuditLog,
  PlatformUser,
  PlatformRole,
  User,
} from '../../database/entities';
import { SubscriptionPlan } from '../../database/entities/subscription-plan.entity';
import { PlatformClinicsService } from './platform-clinics.service';
import { PlatformClinicsController } from './platform-clinics.controller';
import { PlatformDashboardService } from './platform-dashboard.service';
import { PlatformDashboardController } from './platform-dashboard.controller';
import { PlatformAuthService } from './platform-auth.service';
import { SubscriptionPlansService } from './subscription-plans.service';
import { SubscriptionPlansController } from './subscription-plans.controller';
import { PlatformUsersService } from './platform-users.service';
import { PlatformUsersController } from './platform-users.controller';
import { PlatformReportsService } from './platform-reports.service';
import { PlatformReportsController } from './platform-reports.controller';
import { AuditService } from '../audit/audit.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Clinic,
      User,
      AuditLog,
      PlatformUser,
      PlatformRole,
      SubscriptionPlan,
    ]),
  ],
  providers: [
    PlatformClinicsService,
    PlatformDashboardService,
    PlatformAuthService,
    SubscriptionPlansService,
    PlatformUsersService,
    PlatformReportsService,
    AuditService,
  ],
  controllers: [
    PlatformClinicsController,
    PlatformDashboardController,
    SubscriptionPlansController,
    PlatformUsersController,
    PlatformReportsController,
  ],
  exports: [
    PlatformClinicsService,
    PlatformDashboardService,
    PlatformAuthService,
    SubscriptionPlansService,
    PlatformUsersService,
    PlatformReportsService,
    AuditService,
  ],
})
export class PlatformModule {}
