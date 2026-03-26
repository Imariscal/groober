import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Veterinarian,
  User,
  Role,
  UserRole,
  VeterinarianAvailability,
  VeterinarianUnavailablePeriod,
  VeterinarianCapacity,
  Appointment,
  Clinic,
} from '@/database/entities';
import { VeterinariansController } from './veterinarians.controller';
import { VeterinariansService } from './veterinarians.service';
import { TimezoneModule } from '@/shared/timezone/timezone.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Veterinarian,
      User,
      Role,
      UserRole,
      VeterinarianAvailability,
      VeterinarianUnavailablePeriod,
      VeterinarianCapacity,
      Appointment,
      Clinic,
    ]),
    TimezoneModule,
  ],
  controllers: [VeterinariansController],
  providers: [VeterinariansService],
  exports: [VeterinariansService],
})
export class VeterinariansModule {}
