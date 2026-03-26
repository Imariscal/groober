import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentsRepository } from './repositories/appointments.repository';
import { GroomingValidationService } from './services/grooming-validation.service';
import { AppointmentCleanupService } from './services/appointment-cleanup.service';
import { GroomingService } from './services/grooming.service';
import { TimezoneModule } from '@/shared/timezone/timezone.module';
import { PricingModule } from '../pricing/pricing.module';
import { StylistsModule } from '../stylists/stylists.module';
import { PreventiveCareModule } from '../preventive-care/preventive-care.module';
import {
  Appointment,
  ClinicConfiguration,
  ClinicCalendarException,
  Pet,
  Service,
  ServiceSizePrice,
} from '../../database/entities';
import { Clinic } from '../../database/entities/clinic.entity';
import { ClientAddress } from '../../database/entities/client-address.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      Clinic,
      ClientAddress,
      User,
      ClinicConfiguration,
      ClinicCalendarException,
      Pet,
      Service,
      ServiceSizePrice,
    ]),
    TimezoneModule,
    forwardRef(() => PricingModule),
    forwardRef(() => StylistsModule),
    PreventiveCareModule,
  ],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    AppointmentsRepository,
    GroomingValidationService,
    AppointmentCleanupService,
    GroomingService,
  ],
  exports: [
    AppointmentsService,
    AppointmentsRepository,
    GroomingValidationService,
    GroomingService,
  ],
})
export class AppointmentsModule {}
