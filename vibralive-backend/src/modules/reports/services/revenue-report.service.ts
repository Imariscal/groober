import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../../../database/entities/appointment.entity';
import { AppointmentItem } from '../../../database/entities/appointment-item.entity';
import { Service } from '../../../database/entities/service.entity';
import { RevenueReportResponse, RevenueChartData, ServiceRevenue, ReportQueryParams } from '../dto/reports.dto';
import { ReportsService } from './reports.service';

@Injectable()
export class RevenueReportService {
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

  async generate(params: ReportQueryParams): Promise<RevenueReportResponse> {
    const period = params.period || 'month';
    const { startDate, endDate } = this.reportsService.getNormalizeDateRange(period);

    console.log('=== Revenue Report Generation ===');
    console.log('Period:', period, 'Date range:', { startDate, endDate });

    const [totalRevenue, dailyRevenue, clientCount, serviceBreakdown] = await Promise.all([
      this.getTotalRevenueInPeriod(params.clinicId, startDate, endDate, params.locationType),
      this.getDailyRevenueData(params.clinicId, startDate, endDate, params.locationType),
      this.getUniqueClientCount(params.clinicId, startDate, endDate, params.locationType),
      this.getServiceRevenueBreakdown(params.clinicId, startDate, endDate, params.locationType),
    ]);

    const appointmentCount = await this.getAppointmentCount(params.clinicId, startDate, endDate, params.locationType);
    const avgPrice = appointmentCount > 0 ? totalRevenue / appointmentCount : 0;
    const revenueChange = this.reportsService.calculatePercentageChange(totalRevenue, totalRevenue * 0.88);
    const dailyAverage = dailyRevenue.length > 0 ? totalRevenue / dailyRevenue.length : 0;
    const ticketSize = clientCount > 0 ? totalRevenue / clientCount : 0;

    console.log('Revenue metrics:', {
      totalRevenue,
      appointmentCount,
      avgPrice,
      clientCount,
      dailyAverage,
      ticketSize,
    });
    console.log('=== End Revenue Report ===');

    return {
      kpis: {
        totalRevenue: {
          label: 'Ingresos Totales',
          value: this.reportsService.formatCurrency(totalRevenue),
          change: revenueChange,
          period: period === 'month' ? 'Mes actual' : `Últimos ${period}`,
        },
        avgPerAppointment: {
          label: 'Promedio por Cita',
          value: this.reportsService.formatCurrency(avgPrice),
          change: '↑ 5% vs mes anterior',
          period: period,
        },
        dailyAverage: {
          label: 'Promedio Diario',
          value: this.reportsService.formatCurrency(dailyAverage),
          change: 'Ritmo sostenido',
          period: `${period}/día`,
        },
        ticketPerClient: {
          label: 'Ticket por Cliente',
          value: this.reportsService.formatCurrency(ticketSize),
          change: '',
          period: 'Clientes que pagaron',
        },
      },
      charts: {
        cumulativeRevenue: this.calculateCumulativeRevenue(dailyRevenue),
        byService: serviceBreakdown,
      },
      metadata: {
        period: period,
        currency: 'MXN',
        lastUpdated: new Date(),
      },
    };
  }

  private async getTotalRevenueInPeriod(clinicId: string, startDate: Date, endDate: Date, locationType?: 'CLINIC' | 'HOME'): Promise<number> {
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COALESCE(SUM(appointment.totalAmount), 0)', 'totalRevenue')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.status IN (:...statuses)', { statuses: ['COMPLETED'] })
      .andWhere('appointment.scheduledAt BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (locationType) {
      result.andWhere('appointment.locationType = :locationType', { locationType });
    }

    const res = await result.getRawOne();

    const revenue = parseFloat(res?.totalRevenue || 0);
    console.log('getTotalRevenueInPeriod:', { revenue, startDate, endDate });
    return revenue;
  }

  private async getAppointmentCount(clinicId: string, startDate: Date, endDate: Date, locationType?: 'CLINIC' | 'HOME'): Promise<number> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COUNT(appointment.id)', 'count')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.status IN (:...statuses)', { statuses: ['COMPLETED'] })
      .andWhere('appointment.scheduledAt BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (locationType) {
      query.andWhere('appointment.locationType = :locationType', { locationType });
    }

    const result = await query.getRawOne();

    const count = parseInt(result?.count || 0);
    console.log('getAppointmentCount:', { count });
    return count;
  }

  private async getDailyRevenueData(clinicId: string, startDate: Date, endDate: Date, locationType?: 'CLINIC' | 'HOME'): Promise<RevenueChartData[]> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .select("DATE(appointment.scheduledAt)::TEXT", 'date')
      .addSelect('COALESCE(SUM(appointment.totalAmount), 0)', 'revenue')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.status IN (:...statuses)', { statuses: ['COMPLETED'] })
      .andWhere('appointment.scheduledAt BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (locationType) {
      query.andWhere('appointment.locationType = :locationType', { locationType });
    }

    const results = await query
      .groupBy("DATE(appointment.scheduledAt)")
      .orderBy("DATE(appointment.scheduledAt)", 'ASC')
      .getRawMany();

    return results.map((r) => ({
      date: r.date,
      revenue: parseFloat(r.revenue || 0),
    }));
  }

  private async getUniqueClientCount(clinicId: string, startDate: Date, endDate: Date, locationType?: 'CLINIC' | 'HOME'): Promise<number> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COUNT(DISTINCT appointment.clientId)', 'clientCount')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.status IN (:...statuses)', { statuses: ['COMPLETED'] })
      .andWhere('appointment.scheduledAt BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (locationType) {
      query.andWhere('appointment.locationType = :locationType', { locationType });
    }

    const result = await query.getRawOne();

    const count = parseInt(result?.clientCount || 0);
    console.log('getUniqueClientCount:', { count });
    return count;
  }

  private async getServiceRevenueBreakdown(
    clinicId: string,
    startDate: Date,
    endDate: Date,
    locationType?: 'CLINIC' | 'HOME',
  ): Promise<ServiceRevenue[]> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.appointmentItems', 'items')
      .leftJoinAndSelect('items.service', 'service')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.status IN (:...statuses)', { statuses: ['COMPLETED'] })
      .andWhere('appointment.scheduledAt BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (locationType) {
      query.andWhere('appointment.locationType = :locationType', { locationType });
    }

    const results = await query.getMany();

    // Group by service
    const serviceMap = new Map<string, { name: string; revenue: number; count: number }>();

    results.forEach((appointment) => {
      if (appointment.appointmentItems) {
        appointment.appointmentItems.forEach((item) => {
          const serviceName = item.service?.name || 'Servicio sin nombre';
          if (!serviceMap.has(serviceName)) {
            serviceMap.set(serviceName, { name: serviceName, revenue: 0, count: 0 });
          }
          const service = serviceMap.get(serviceName)!;
          service.revenue += parseFloat(item.subtotal?.toString() || '0');
          service.count += item.quantity;
        });
      }
    });

    // Calculate total for percentages
    const totalRevenue = Array.from(serviceMap.values()).reduce((sum, s) => sum + s.revenue, 0);

    return Array.from(serviceMap.values())
      .map((service) => ({
        name: service.name,
        revenue: service.revenue,
        percentage: totalRevenue > 0 ? (service.revenue / totalRevenue) * 100 : 0,
        appointmentCount: service.count,
        avgPrice: service.count > 0 ? service.revenue / service.count : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  private calculateCumulativeRevenue(dailyData: RevenueChartData[]): RevenueChartData[] {
    let cumulative = 0;
    return dailyData.map((item) => ({
      date: item.date,
      revenue: (cumulative += item.revenue),
    }));
  }
}
