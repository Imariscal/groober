import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../../../database/entities/appointment.entity';
import { AppointmentItem } from '../../../database/entities/appointment-item.entity';
import { Service } from '../../../database/entities/service.entity';
import { ServicesReportResponse, ReportQueryParams, ServiceRow } from '../dto/reports.dto';
import { ReportsService } from './reports.service';

@Injectable()
export class ServicesReportService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(AppointmentItem)
    private appointmentItemRepository: Repository<AppointmentItem>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @Inject(ReportsService)
    private reportsService: ReportsService,
  ) {}

  async generate(params: ReportQueryParams): Promise<ServicesReportResponse> {
    const period = params.period || 'month';
    const { startDate, endDate } = this.reportsService.getNormalizeDateRange(period);
    const clinicId = params.clinicId;

    // When filtering by paid=true, automatically exclude cancelled appointments
    const excludeStatuses = params.paid === true ? ['CANCELLED'] : params.excludeStatuses;

    console.log('=== Services Report Generation ===');
    console.log('Period:', period, 'Date range:', { startDate, endDate });
    console.log('Filters:', { paid: params.paid, statuses: params.statuses, excludeStatuses });

    try {
      const [
        scatterData,
        topByDemand,
        allServices,
        activeServicesCount,
        mostDemanded,
        mostProfitable,
      ] = await Promise.all([
        this.getScatterDemandVsRevenue(clinicId, startDate, endDate, params.paid, params.statuses, excludeStatuses),
        this.getTopByDemand(clinicId, startDate, endDate, params.paid, params.statuses, excludeStatuses),
        this.getAllServicesAnalysis(clinicId, startDate, endDate, params.paid, params.statuses, excludeStatuses),
        this.getActiveServicesCount(clinicId, startDate, endDate, params.paid, params.statuses, excludeStatuses),
        this.getMostDemandedService(clinicId, startDate, endDate, params.paid, params.statuses, excludeStatuses),
        this.getMostProfitableService(clinicId, startDate, endDate, params.paid, params.statuses, excludeStatuses),
      ]);

      const totalServices = allServices.length;
      const servicesWithDemand = scatterData.length;
      const availabilityRate = totalServices > 0 ? Math.round((servicesWithDemand / totalServices) * 100) : 0;

      return {
        kpis: {
          activeServices: {
            label: 'Servicios Activos',
            value: `${activeServicesCount} servicios`,
            trending: 'Con demanda registrada',
          },
          mostDemanded: {
            label: 'Servicio más demandado',
            value: mostDemanded ? `${mostDemanded.name} - ${mostDemanded.demandCount} citas` : 'N/A',
            trending: '(período actual)',
          },
          mostProfitable: {
            label: 'Servicio más rentable',
            value: mostProfitable ? `${mostProfitable.name} - $${mostProfitable.totalRevenue.toLocaleString('es-MX')} MXN` : '$0 MXN',
            trending: '(período actual)',
          },
          availabilityRate: {
            label: 'Tasa de disponibilidad',
            value: `${availabilityRate}%`,
            trending: 'Servicios disponibles',
          },
        },
        charts: {
          scatterDemandVsRevenue: scatterData,
          topByDemand: topByDemand,
        },
        services: allServices,
        metadata: {
          period: period,
          lastUpdated: new Date(),
        },
      };
    } catch (error) {
      console.error('Error generating services report:', error);
      throw error;
    }
  }

  private async getActiveServicesCount(clinicId: string, startDate: Date, endDate: Date, paid?: boolean, statuses?: string[], excludeStatuses?: string[]): Promise<number> {
    let query = this.appointmentItemRepository
      .createQueryBuilder('item')
      .select('COUNT(DISTINCT item.serviceId)', 'count')
      .leftJoin(Appointment, 'appointment', 'appointment.id = item.appointmentId')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate });

    if (paid !== undefined) {
      query = query.andWhere('appointment.paid = :paid', { paid });
    }

    if (statuses && statuses.length > 0) {
      query = query.andWhere('appointment.status IN (:...statuses)', { statuses });
    }

    if (excludeStatuses && excludeStatuses.length > 0) {
      query = query.andWhere('appointment.status NOT IN (:...excludeStatuses)', { excludeStatuses });
    }

    const result = await query.getRawOne();
    return parseInt(result?.count || 0, 10);
  }

  private async getMostDemandedService(clinicId: string, startDate: Date, endDate: Date, paid?: boolean, statuses?: string[], excludeStatuses?: string[]) {
    let query = this.appointmentItemRepository
      .createQueryBuilder('item')
      .select('service.name', 'name')
      .addSelect('COUNT(DISTINCT item.appointmentId)', 'demandCount')
      .leftJoin(Appointment, 'appointment', 'appointment.id = item.appointmentId')
      .leftJoin(Service, 'service', 'service.id = item.serviceId')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate });

    if (paid !== undefined) {
      query = query.andWhere('appointment.paid = :paid', { paid });
    }

    if (statuses && statuses.length > 0) {
      query = query.andWhere('appointment.status IN (:...statuses)', { statuses });
    }

    if (excludeStatuses && excludeStatuses.length > 0) {
      query = query.andWhere('appointment.status NOT IN (:...excludeStatuses)', { excludeStatuses });
    }

    const result = await query
      .groupBy('service.id, service.name')
      .orderBy('COUNT(DISTINCT item.appointmentId)', 'DESC')
      .limit(1)
      .getRawOne();

    return result ? { name: result.name, demandCount: parseInt(result.demandCount, 10) } : null;
  }

  private async getMostProfitableService(clinicId: string, startDate: Date, endDate: Date, paid?: boolean, statuses?: string[], excludeStatuses?: string[]) {
    let query = this.appointmentItemRepository
      .createQueryBuilder('item')
      .select('service.name', 'name')
      .addSelect('COALESCE(SUM(CAST(item.subtotal AS FLOAT)), 0)', 'totalRevenue')
      .leftJoin(Appointment, 'appointment', 'appointment.id = item.appointmentId')
      .leftJoin(Service, 'service', 'service.id = item.serviceId')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate });

    if (paid !== undefined) {
      query = query.andWhere('appointment.paid = :paid', { paid });
    }

    if (statuses && statuses.length > 0) {
      query = query.andWhere('appointment.status IN (:...statuses)', { statuses });
    }

    if (excludeStatuses && excludeStatuses.length > 0) {
      query = query.andWhere('appointment.status NOT IN (:...excludeStatuses)', { excludeStatuses });
    }

    const result = await query
      .groupBy('service.id, service.name')
      .orderBy('COALESCE(SUM(CAST(item.subtotal AS FLOAT)), 0)', 'DESC')
      .limit(1)
      .getRawOne();

    return result ? { name: result.name, totalRevenue: parseFloat(result.totalRevenue || 0) } : null;
  }

  private async getScatterDemandVsRevenue(clinicId: string, startDate: Date, endDate: Date, paid?: boolean, statuses?: string[], excludeStatuses?: string[]) {
    let query = this.appointmentItemRepository
      .createQueryBuilder('item')
      .select('service.name', 'name')
      .addSelect('COUNT(DISTINCT item.appointmentId)', 'demandCount')
      .addSelect('COALESCE(SUM(CAST(item.subtotal AS FLOAT)), 0)', 'totalRevenue')
      .addSelect('COALESCE(service.category, \'GROOMING\')', 'type')
      .leftJoin(Appointment, 'appointment', 'appointment.id = item.appointmentId')
      .leftJoin(Service, 'service', 'service.id = item.serviceId')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate });

    if (paid !== undefined) {
      query = query.andWhere('appointment.paid = :paid', { paid });
    }

    if (statuses && statuses.length > 0) {
      query = query.andWhere('appointment.status IN (:...statuses)', { statuses });
    }

    if (excludeStatuses && excludeStatuses.length > 0) {
      query = query.andWhere('appointment.status NOT IN (:...excludeStatuses)', { excludeStatuses });
    }

    const results = await query
      .groupBy('service.id, service.name, service.category')
      .orderBy('COUNT(DISTINCT item.appointmentId)', 'DESC')
      .limit(20)
      .getRawMany();

    return results.map((r) => ({
      name: r.name,
      demandCount: parseInt(r.demandCount, 10),
      totalRevenue: parseFloat(r.totalRevenue || 0),
      type: r.type === 'MEDICAL' ? 'Médico' : 'Grooming',
    }));
  }

  private async getTopByDemand(clinicId: string, startDate: Date, endDate: Date, paid?: boolean, statuses?: string[], excludeStatuses?: string[]) {
    let query = this.appointmentItemRepository
      .createQueryBuilder('item')
      .select('service.name', 'name')
      .addSelect('COUNT(DISTINCT item.appointmentId)', 'demandCount')
      .leftJoin(Appointment, 'appointment', 'appointment.id = item.appointmentId')
      .leftJoin(Service, 'service', 'service.id = item.serviceId')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate });

    if (paid !== undefined) {
      query = query.andWhere('appointment.paid = :paid', { paid });
    }

    if (statuses && statuses.length > 0) {
      query = query.andWhere('appointment.status IN (:...statuses)', { statuses });
    }

    if (excludeStatuses && excludeStatuses.length > 0) {
      query = query.andWhere('appointment.status NOT IN (:...excludeStatuses)', { excludeStatuses });
    }

    const results = await query
      .groupBy('service.id, service.name')
      .orderBy('COUNT(DISTINCT item.appointmentId)', 'DESC')
      .limit(8)
      .getRawMany();

    return results.map((r) => ({
      name: r.name,
      demandCount: parseInt(r.demandCount, 10),
    }));
  }

  private async getAllServicesAnalysis(clinicId: string, startDate: Date, endDate: Date, paid?: boolean, statuses?: string[], excludeStatuses?: string[]): Promise<ServiceRow[]> {
    let query = this.appointmentItemRepository
      .createQueryBuilder('item')
      .select('service.id', 'id')
      .addSelect('service.name', 'name')
      .addSelect('COALESCE(service.category, \'GROOMING\')', 'type')
      .addSelect('COUNT(DISTINCT item.appointmentId)', 'demandCount')
      .addSelect('COALESCE(SUM(CAST(item.subtotal AS FLOAT)), 0)', 'totalRevenue')
      .addSelect('COALESCE(AVG(CAST(item.subtotal AS FLOAT)), 0)', 'avgPrice')
      .leftJoin(Appointment, 'appointment', 'appointment.id = item.appointmentId')
      .leftJoin(Service, 'service', 'service.id = item.serviceId')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate });

    if (paid !== undefined) {
      query = query.andWhere('appointment.paid = :paid', { paid });
    }

    if (statuses && statuses.length > 0) {
      query = query.andWhere('appointment.status IN (:...statuses)', { statuses });
    }

    if (excludeStatuses && excludeStatuses.length > 0) {
      query = query.andWhere('appointment.status NOT IN (:...excludeStatuses)', { excludeStatuses });
    }

    const results = await query
      .groupBy('service.id, service.name, service.category')
      .orderBy('COUNT(DISTINCT item.appointmentId)', 'DESC')
      .limit(50)
      .getRawMany();

    return results.map((r) => {
      const totalRevenue = parseFloat(r.totalRevenue || 0);
      const avgPrice = parseFloat(r.avgPrice || 0);
      const demandCount = parseInt(r.demandCount, 10);
      const estimatedMargin = avgPrice * 0.4; // Estimación: 40% de margen

      return {
        name: r.name,
        type: r.type === 'MEDICAL' ? 'Médico' : 'Grooming',
        demandCount: demandCount,
        totalRevenue: totalRevenue,
        avgPrice: avgPrice,
        estimatedMargin: `$${estimatedMargin.toFixed(2)} MXN`,
        status: demandCount > 0 ? '✓ Activo' : '- Inactivo',
      };
    });
  }
}
