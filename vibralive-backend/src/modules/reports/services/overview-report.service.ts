import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../../../database/entities/appointment.entity';
import { Client } from '../../../database/entities/client.entity';
import { OverviewReportResponse, ReportQueryParams } from '../dto/reports.dto';
import { RevenueReportService } from './revenue-report.service';
import { AppointmentsReportService } from './appointments-report.service';
import { ReportsService } from './reports.service';

@Injectable()
export class OverviewReportService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    private revenueReportService: RevenueReportService,
    private appointmentsReportService: AppointmentsReportService,
    @Inject(ReportsService)
    private reportsService: ReportsService,
  ) {}

  async generate(params: ReportQueryParams): Promise<OverviewReportResponse> {
    console.log('=== Overview Report Generation ===');
    console.log('Clinic ID:', params.clinicId);
    const { startDate, endDate } = this.reportsService.getNormalizeDateRange('month');
    const { startDate: weekStart, endDate: weekEnd } = this.reportsService.getNormalizeDateRange('week');

    console.log('Date ranges - Month:', { startDate, endDate });
    console.log('Date ranges - Week:', { weekStart, weekEnd });

    // Get all revenue and appointment metrics for this month
    const [monthRevenue, paidRevenue, totalAppointments, paidAppointments, cancelledRevenue, cancelledAppointments] = await Promise.all([
      this.getTotalRevenue(params.clinicId, startDate, endDate),
      this.getPaidRevenue(params.clinicId, startDate, endDate),
      this.getTotalAppointmentsCount(params.clinicId, startDate, endDate),
      this.getPaidAppointmentsCount(params.clinicId, startDate, endDate),
      this.getCancelledRevenue(params.clinicId, startDate, endDate),
      this.getCancelledAppointmentsCount(params.clinicId, startDate, endDate),
    ]);

    const pendingRevenue = monthRevenue - paidRevenue;
    const pendingAppointments = totalAppointments - paidAppointments;

    const confirmedAppointments = await this.getConfirmedAppointments(params.clinicId, weekStart, weekEnd);
    const activeClients = await this.getActiveClients(params.clinicId);

    console.log('Final metrics:', { 
      monthRevenue, 
      paidRevenue, 
      pendingRevenue,
      cancelledRevenue,
      totalAppointments,
      paidAppointments,
      pendingAppointments,
      cancelledAppointments,
      confirmedAppointments, 
      activeClients 
    });
    console.log('=== End Overview Report ===');

    return {
      healthMetrics: {
        revenueThisMonth: {
          label: 'Ingresos Este Mes',
          value: this.reportsService.formatCurrency(monthRevenue),
          change: '↑ 12% vs mes anterior',
          period: 'Mes actual',
        },
        appointmentsThisWeek: {
          label: 'Citas Confirmadas',
          value: `${confirmedAppointments} citas`,
          trending: 'Esta semana',
        },
        activeClients: {
          label: 'Clientes Activos',
          value: `${activeClients} clientes`,
          trending: '↑ 8% vs mes anterior',
        },
        occupancyRate: {
          label: 'Ocupación',
          value: '78%',
          trending: 'Capacidad: 85%',
        },
      },
      paymentMetrics: {
        totalRevenue: monthRevenue,
        paidRevenue,
        pendingRevenue,
        cancelledRevenue,
        totalAppointments,
        paidAppointments,
        pendingAppointments,
        cancelledAppointments,
      },
      charts: {
        revenueLastWeek: [],
        appointmentsByStylist: [],
        clientGrowth: [],
      },
      alerts: [
        {
          type: 'warning',
          message: 'Tasa de cancelación: 12% (↑ 3% vs mes anterior)',
        },
        {
          type: 'success',
          message: 'Cliente VIP: Juan García - 12 citas este mes',
        },
        {
          type: 'info',
          message: 'Servicio emergente: "Baño de espuma" - 8 citas nuevas',
        },
      ],
      metadata: {
        period: 'month',
        lastUpdated: new Date(),
      },
    };
  }

  private async getTotalRevenue(clinicId: string, startDate: Date, endDate: Date): Promise<number> {
    // Get total revenue from non-cancelled appointments (expected/potential revenue)
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COALESCE(SUM(appointment.totalAmount), 0)', 'totalRevenue')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.status != :cancelledStatus', { cancelledStatus: 'CANCELLED' })
      .andWhere('appointment.scheduledAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    const revenue = parseFloat(result?.totalRevenue || 0);
    console.log('getTotalRevenue result (non-cancelled):', { revenue, dateRange: { startDate, endDate }, clinicId });
    return revenue;
  }

  private async getPaidRevenue(clinicId: string, startDate: Date, endDate: Date): Promise<number> {
    // Get revenue from paid appointments (paid = true)
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COALESCE(SUM(appointment.totalAmount), 0)', 'paidRevenue')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.paid = :paid', { paid: true })
      .andWhere('appointment.scheduledAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    const revenue = parseFloat(result?.paidRevenue || 0);
    console.log('getPaidRevenue result:', { revenue, dateRange: { startDate, endDate }, clinicId });
    return revenue;
  }

  private async getTotalAppointmentsCount(clinicId: string, startDate: Date, endDate: Date): Promise<number> {
    // Count total non-cancelled appointments
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COUNT(appointment.id)', 'count')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.status != :cancelledStatus', { cancelledStatus: 'CANCELLED' })
      .andWhere('appointment.scheduledAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    const count = result?.count ? parseInt(result.count) : 0;
    console.log('getTotalAppointmentsCount:', { count, startDate, endDate, clinicId });
    return count;
  }

  private async getPaidAppointmentsCount(clinicId: string, startDate: Date, endDate: Date): Promise<number> {
    // Count paid appointments (paid = true)
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COUNT(appointment.id)', 'count')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.paid = :paid', { paid: true })
      .andWhere('appointment.scheduledAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    const count = result?.count ? parseInt(result.count) : 0;
    console.log('getPaidAppointmentsCount:', { count, startDate, endDate, clinicId });
    return count;
  }

  private async getConfirmedAppointments(clinicId: string, startDate: Date, endDate: Date): Promise<number> {
    // Debug: Get all appointments to see what we have
    const allAppointments = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('appointment.id, appointment.status, appointment.scheduledAt, appointment.updatedAt')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.status IN (:...statuses)', { statuses: ['CONFIRMED', 'COMPLETED'] })
      .getRawMany();
    
    console.log('DEBUG - All CONFIRMED/COMPLETED appointments:', allAppointments);

    // Query citas confirmadas/completadas esta semana (usando updatedAt para capturar cuando se confirmó/completó)
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COUNT(appointment.id)', 'count')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.status IN (:...statuses)', { statuses: ['CONFIRMED', 'COMPLETED'] })
      .andWhere('appointment.updatedAt >= :startDate', { startDate })
      .andWhere('appointment.updatedAt <= :endDate', { endDate })
      .getRawOne();

    const count = result?.count ? parseInt(result.count) : 0;
    console.log('getConfirmedAppointments:', { count, startDate, endDate, clinicId, dateRange: { startDate, endDate } });
    return count;
  }

  private async getActiveClients(clinicId: string): Promise<number> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COUNT(DISTINCT appointment.clientId)', 'count')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.createdAt >= :ninetyDaysAgo', { ninetyDaysAgo })
      .getRawOne();

    const count = parseInt(result?.count || 0);
    console.log('getActiveClients:', { count, clinicId, ninetyDaysAgo });
    return count;
  }

  private async getCancelledRevenue(clinicId: string, startDate: Date, endDate: Date): Promise<number> {
    // Get revenue from cancelled appointments
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COALESCE(SUM(appointment.totalAmount), 0)', 'cancelledRevenue')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.status = :cancelledStatus', { cancelledStatus: 'CANCELLED' })
      .andWhere('appointment.scheduledAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    const revenue = parseFloat(result?.cancelledRevenue || 0);
    console.log('getCancelledRevenue result:', { revenue, dateRange: { startDate, endDate }, clinicId });
    return revenue;
  }

  private async getCancelledAppointmentsCount(clinicId: string, startDate: Date, endDate: Date): Promise<number> {
    // Count cancelled appointments
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COUNT(appointment.id)', 'count')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.status = :cancelledStatus', { cancelledStatus: 'CANCELLED' })
      .andWhere('appointment.scheduledAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    const count = result?.count ? parseInt(result.count) : 0;
    console.log('getCancelledAppointmentsCount:', { count, startDate, endDate, clinicId });
    return count;
  }
}
