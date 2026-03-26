import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../../database/entities/appointment.entity';
import { AppointmentItem } from '../../database/entities/appointment-item.entity';
import { Client } from '../../database/entities/client.entity';
import { ClientAddress } from '../../database/entities/client-address.entity';
import { User } from '../../database/entities/user.entity';
import { Clinic } from '../../database/entities/clinic.entity';
import { Service } from '../../database/entities/service.entity';
import { PriceList } from '../../database/entities/price-list.entity';
import { ClinicConfiguration } from '../../database/entities/clinic-configuration.entity';
import { ReportsService } from './services/reports.service';
import { RevenueReportService } from './services/revenue-report.service';
import { AppointmentsReportService } from './services/appointments-report.service';
import { ClientsReportService } from './services/clients-report.service';
import { ServicesReportService } from './services/services-report.service';
import { PerformanceReportService } from './services/performance-report.service';
import { GeographyReportService } from './services/geography-report.service';
import { OverviewReportService } from './services/overview-report.service';
import { ReportsController } from './controllers/reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      AppointmentItem,
      Client,
      ClientAddress,
      User,
      Clinic,
      Service,
      PriceList,
      ClinicConfiguration,
    ]),
  ],
  providers: [
    ReportsService,
    RevenueReportService,
    AppointmentsReportService,
    ClientsReportService,
    ServicesReportService,
    PerformanceReportService,
    GeographyReportService,
    OverviewReportService,
  ],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
