import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  MedicalVisit,
  Prescription,
  Vaccine,
  Vaccination,
  MedicationAllergy,
  DiagnosticOrder,
  DiagnosticTestResult,
  MedicalVisitExam,
  MedicalVisitDiagnosis,
  MedicalProcedure,
  FollowUpNote,
  MedicalAttachment,
  Appointment,
  Pet,
  User,
  ClinicConfiguration,
  Clinic,
} from '@/database/entities';
import { MedicalVisitsController } from './medical-visits.controller';
import { MedicalVisitsService } from './services/medical-visits.service';
import { MedicalVisitsRepository } from './repositories/medical-visits.repository';
import { TimezoneService } from '@/shared/timezone/timezone.service';
import { VaccineCatalogModule } from '@/modules/vaccine-catalog/vaccine-catalog.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicalVisit,
      Prescription,
      Vaccine,
      Vaccination,
      MedicationAllergy,
      DiagnosticOrder,
      DiagnosticTestResult,
      MedicalVisitExam,
      MedicalVisitDiagnosis,
      MedicalProcedure,
      FollowUpNote,
      MedicalAttachment,
      Appointment,
      Pet,
      User,
      ClinicConfiguration,
      Clinic,
    ]),
    VaccineCatalogModule,
  ],
  controllers: [MedicalVisitsController],
  providers: [
    MedicalVisitsService,
    MedicalVisitsRepository,
    TimezoneService,
  ],
  exports: [MedicalVisitsService, MedicalVisitsRepository],
})
export class MedicalVisitsModule {}
