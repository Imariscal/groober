import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Stylist,
  User,
  Role,
  UserRole,
  StylistAvailability,
  StylistUnavailablePeriod,
  StylistCapacity,
  Appointment,
  Clinic,
} from '@/database/entities';
import { StylistsController } from './stylists.controller';
import { StylistsService } from './stylists.service';
import { StylistAvailabilityService } from './services/stylist-availability.service';
import { TimezoneModule } from '@/shared/timezone/timezone.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Stylist,
      User,
      Role,
      UserRole,
      StylistAvailability,
      StylistUnavailablePeriod,
      StylistCapacity,
      Appointment,
      Clinic,
    ]),
    TimezoneModule,
  ],
  controllers: [StylistsController],
  providers: [StylistsService, StylistAvailabilityService],
  exports: [StylistsService, StylistAvailabilityService],
})
export class StylistsModule {}
