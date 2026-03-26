import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vaccine, Clinic } from '@/database/entities';
import { VaccineCatalogService } from './vaccine-catalog.service';
import { VaccineCatalogController } from './vaccine-catalog.controller';
import { VaccineRepository } from './repositories/vaccine.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Vaccine, Clinic])],
  providers: [VaccineRepository, VaccineCatalogService],
  controllers: [VaccineCatalogController],
  exports: [VaccineRepository, VaccineCatalogService],
})
export class VaccineCatalogModule {}
