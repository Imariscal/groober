import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Appointment,
  AppointmentItem,
  AppointmentGroup,
  PriceList,
  ServicePrice,
  Service,
  Client,
  PriceListHistory,
  ServicePackage,
  ServicePackagePrice,
} from '../../database/entities';
import { TimezoneModule } from '@/shared/timezone/timezone.module';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { GroomingBatchService } from './services/grooming-batch.service';
import { AppointmentItemRepository } from './repositories/appointment-item.repository';
import { AppointmentGroupRepository } from './repositories/appointment-group.repository';
import { PriceListHistoryRepository } from './repositories/price-list-history.repository';
import { ServicePackagePriceRepository } from './repositories/service-package-price.repository';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      AppointmentItem,
      AppointmentGroup,
      PriceList,
      ServicePrice,
      Service,
      Client,
      PriceListHistory,
      ServicePackage,
      ServicePackagePrice,
    ]),
    forwardRef(() => AppointmentsModule),
    TimezoneModule,
  ],
  providers: [
    PricingService,
    GroomingBatchService,
    AppointmentItemRepository,
    AppointmentGroupRepository,
    PriceListHistoryRepository,
    ServicePackagePriceRepository,
  ],
  controllers: [PricingController],
  exports: [PricingService, GroomingBatchService],
})
export class PricingModule {}
