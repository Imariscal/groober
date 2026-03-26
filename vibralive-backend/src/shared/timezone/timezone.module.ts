import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicConfiguration } from '@/database/entities';
import { TimezoneService } from './timezone.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicConfiguration])],
  providers: [TimezoneService],
  exports: [TimezoneService],
})
export class TimezoneModule {}
